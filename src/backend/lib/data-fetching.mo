import Char  "mo:core/Char";
import Int   "mo:core/Int";
import Map   "mo:core/Map";
import Nat   "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Text  "mo:core/Text";
import Time  "mo:core/Time";
import Types "../types/data-fetching";

module {
  /// 15-minute TTL in seconds
  public let TTL_SECONDS : Int = 900;

  public type Cache = Map.Map<Text, Types.CacheEntry>;

  /// IC management canister types for http_request
  public type HttpHeader = { name : Text; value : Text };
  public type HttpRequestResult = {
    status  : Nat;
    headers : [HttpHeader];
    body    : Blob;
  };
  public type TransformArgs = { response : HttpRequestResult; context : Blob };
  public type TransformFn   = query TransformArgs -> async HttpRequestResult;

  /// Check whether a cache entry is still valid (< TTL_SECONDS old)
  public func isFresh(entry : Types.CacheEntry) : Bool {
    let nowSec : Int = Time.now() / 1_000_000_000;
    nowSec - entry.fetchedAt < TTL_SECONDS;
  };

  /// FMP historical price endpoint (demo key, CORS-compatible)
  public func fmpUrl(ticker : Text) : Text {
    "https://financialmodelingprep.com/api/v3/historical-price-full/" # ticker # "?apikey=demo"
  };

  /// Yahoo Finance chart endpoint (fallback)
  public func yahooUrl(ticker : Text) : Text {
    "https://query1.finance.yahoo.com/v8/finance/chart/" # ticker # "?interval=1d&range=2y"
  };

  // ---------------------------------------------------------------------------
  // Simple Nat to decimal Text conversion
  // ---------------------------------------------------------------------------

  func natToStr(n : Nat) : Text {
    if (n == 0) return "0";
    var val = n;
    var s = "";
    while (val > 0) {
      let digit = val % 10;
      s := Text.fromChar(Char.fromNat32(Nat32.fromNat(48 + digit))) # s;
      val /= 10;
    };
    s
  };

  // ---------------------------------------------------------------------------
  // Minimal text utilities for JSON parsing (no external JSON library)
  // ---------------------------------------------------------------------------

  /// Find the first occurrence of `needle` in `haystack` starting at offset `from`.
  /// Returns the byte offset or -1 if not found.
  func indexOf(haystack : Text, needle : Text, from : Nat) : Int {
    let hChars = haystack.toArray();
    let nChars = needle.toArray();
    let hLen   = hChars.size();
    let nLen   = nChars.size();
    if (nLen == 0) return Int.fromNat(from);
    if (hLen < nLen) return -1;
    var i = from;
    while (i + nLen <= hLen) {
      var j = 0;
      var matched = true;
      while (j < nLen) {
        if (hChars[i + j] != nChars[j]) { matched := false; j := nLen };
        j += 1;
      };
      if (matched) return Int.fromNat(i);
      i += 1;
    };
    -1
  };

  /// Extract the JSON string or numeric value for `key` in an object JSON string.
  /// Returns "" if key not found, value is null, or value is empty.
  func jsonField(json : Text, key : Text) : Text {
    let needle = "\"" # key # "\"";
    let pos = indexOf(json, needle, 0);
    if (pos < 0) return "";
    let chars = json.toArray();
    let len   = chars.size();
    // skip past key, whitespace, and colon
    var i = pos.toNat() + needle.size();
    while (i < len and (chars[i] == ' ' or chars[i] == ':' or chars[i] == '\t')) { i += 1 };
    if (i >= len) return "";
    if (chars[i].toNat32() == 34) {
      // string value (ASCII 34 = double-quote)
      i += 1;
      var result = "";
      while (i < len and chars[i].toNat32() != 34) {
        result #= Text.fromChar(chars[i]);
        i += 1;
      };
      result
    } else if (chars[i] == 'n') {
      "" // null
    } else {
      // numeric or boolean value
      var result = "";
      while (i < len and chars[i] != ',' and chars[i] != '}' and chars[i] != ']') {
        result #= Text.fromChar(chars[i]);
        i += 1;
      };
      result
    }
  };

  /// Extract a balanced `[...]` substring from `chars` starting search at `from`.
  func extractArray(chars : [Char], from : Nat) : Text {
    let len = chars.size();
    var i = from;
    while (i < len and chars[i] != '[') { i += 1 };
    if (i >= len) return "";
    let start = i;
    var depth = 0;
    while (i < len) {
      if (chars[i] == '[') { depth += 1 }
      else if (chars[i] == ']') {
        depth -= 1;
        if (depth == 0) {
          var result = "";
          var j = start;
          while (j <= i) {
            result #= Text.fromChar(chars[j]);
            j += 1;
          };
          return result;
        };
      };
      i += 1;
    };
    ""
  };

  /// Parse a JSON numeric/null array string like `[1.5,2.0,null,3.1]`
  /// into an array of raw Text tokens (e.g. ["1.5","2.0","null","3.1"]).
  func parseNumArray(src : Text) : [Text] {
    let sc  = src.toArray();
    let sl  = sc.size();
    var vals : [Text] = [];
    var i = 1; // skip opening '['
    while (i < sl) {
      // skip whitespace and commas
      while (i < sl and (sc[i] == ' ' or sc[i] == ',' or sc[i] == '\t' or sc[i] == '\n')) { i += 1 };
      if (i >= sl or sc[i] == ']') {
        i := sl; // exit
      } else {
        var val = "";
        while (i < sl and sc[i] != ',' and sc[i] != ']') {
          val #= Text.fromChar(sc[i]);
          i += 1;
        };
        vals := vals.concat([val]);
      };
    };
    vals
  };

  /// Extract and parse the named numeric array `name` from a JSON object string.
  func namedNumArray(json : Text, name : Text) : [Text] {
    let chars = json.toArray();
    let pos   = indexOf(json, "\"" # name # "\"", 0);
    if (pos < 0) return [];
    let arr   = extractArray(chars, pos.toNat() + name.size() + 2);
    parseNumArray(arr)
  };

  // ---------------------------------------------------------------------------
  // Unix timestamp → YYYY-MM-DD
  // ---------------------------------------------------------------------------

  /// Convert a Unix timestamp (seconds since 1970-01-01) to "YYYY-MM-DD".
  /// Uses Int arithmetic to avoid Nat subtraction underflow traps.
  public func unixToDate(ts : Nat) : Text {
    let days : Int = ts / 86400;
    let z    : Int = days + 719468;
    let era  : Int = z / 146097;
    let doe  : Int = z - era * 146097;
    let yoe  : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y    : Int = yoe + era * 400;
    let doy  : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp   : Int = (5 * doy + 2) / 153;
    let d    : Int = doy - (153 * mp + 2) / 5 + 1;
    let m    : Int = if (mp < 10) mp + 3 else mp - 9;
    let yr   : Int = if (m <= 2) y + 1 else y;
    let mN   : Nat = m.toNat();
    let dN   : Nat = d.toNat();
    let yrN  : Nat = yr.toNat();
    let mStr = if (mN < 10) "0" # natToStr(mN) else natToStr(mN);
    let dStr = if (dN < 10) "0" # natToStr(dN) else natToStr(dN);
    natToStr(yrN) # "-" # mStr # "-" # dStr
  };

  // ---------------------------------------------------------------------------
  // Public normalization functions
  // ---------------------------------------------------------------------------

  /// Parse an FMP response body and return a normalized flat JSON array string.
  /// FMP format: {"historical":[{"date":"YYYY-MM-DD","open":N,"high":N,"low":N,"close":N,"volume":N,...},...]}
  /// Output:     [{"date":"YYYY-MM-DD","open":N,"high":N,"low":N,"close":N,"volume":N},...]
  public func normalizeFmp(body : Text) : ?Text {
    if (indexOf(body, "\"historical\"", 0) < 0) return null;
    let chars    = body.toArray();
    let hPos     = indexOf(body, "\"historical\"", 0);
    if (hPos < 0) return null;
    let arrayStr = extractArray(chars, hPos.toNat() + 12);
    if (arrayStr.size() == 0) return null;

    let arrChars = arrayStr.toArray();
    let arrLen   = arrChars.size();
    var result   = "[";
    var first    = true;
    var i        = 0;
    while (i < arrLen) {
      if (arrChars[i] == '{') {
        // find matching '}'
        var depth = 0;
        var end_  = i;
        var found = false;
        var k     = i;
        while (k < arrLen) {
          if      (arrChars[k] == '{') { depth += 1 }
          else if (arrChars[k] == '}') {
            depth -= 1;
            if (depth == 0) { end_ := k; found := true; k := arrLen }; // break
          };
          k += 1;
        };
        if (found) {
          var obj = "";
          var j   = i;
          while (j <= end_) { obj #= Text.fromChar(arrChars[j]); j += 1 };
          let date   = jsonField(obj, "date");
          let close  = jsonField(obj, "close");
          if (date.size() > 0 and close.size() > 0) {
            let open   = jsonField(obj, "open");
            let high   = jsonField(obj, "high");
            let low    = jsonField(obj, "low");
            let volume = jsonField(obj, "volume");
            if (not first) { result #= "," };
            result #= "{\"date\":\"" # date # "\",\"open\":"   # (if (open.size()   == 0) close else open)
                                             # ",\"high\":"   # (if (high.size()   == 0) close else high)
                                             # ",\"low\":"    # (if (low.size()    == 0) close else low)
                                             # ",\"close\":"  # close
                                             # ",\"volume\":" # (if (volume.size() == 0) "0"   else volume)
                                             # "}";
            first := false;
          };
          i := end_ + 1;
        } else {
          i += 1;
        };
      } else {
        i += 1;
      };
    };
    result #= "]";
    if (first) null else ?result
  };

  /// Parse a Yahoo Finance chart response body and return a normalized flat JSON array string.
  /// Yahoo format: {"chart":{"result":[{"timestamp":[...],"indicators":{"quote":[{"open":[...],...}]}}]}}
  /// Output:       [{"date":"YYYY-MM-DD","open":N,"high":N,"low":N,"close":N,"volume":N},...]
  public func normalizeYahoo(body : Text) : ?Text {
    if (indexOf(body, "\"timestamp\"", 0) < 0) return null;
    if (indexOf(body, "\"quote\"",     0) < 0) return null;

    let tsPos = indexOf(body, "\"timestamp\"", 0);
    if (tsPos < 0) return null;
    let chars    = body.toArray();
    let tsArray  = extractArray(chars, tsPos.toNat() + 11);
    if (tsArray.size() == 0) return null;

    let qPos     = indexOf(body, "\"quote\"", 0);
    if (qPos < 0) return null;
    let quoteArr = extractArray(chars, qPos.toNat() + 7);

    let timestamps = parseNumArray(tsArray);
    let opens      = namedNumArray(quoteArr, "open");
    let highs      = namedNumArray(quoteArr, "high");
    let lows       = namedNumArray(quoteArr, "low");
    let closes     = namedNumArray(quoteArr, "close");
    let volumes    = namedNumArray(quoteArr, "volume");

    let count = timestamps.size();
    if (count == 0) return null;

    var result = "[";
    var first  = true;
    var idx    = 0;
    while (idx < count) {
      let tsText   = timestamps[idx];
      let closeStr = if (idx < closes.size()) closes[idx] else "null";
      if (closeStr != "null" and closeStr.size() > 0) {
        switch (Nat.fromText(tsText)) {
          case null {};
          case (?ts) {
            let date      = unixToDate(ts);
            let openStr   = if (idx < opens.size())   opens[idx]   else closeStr;
            let highStr   = if (idx < highs.size())   highs[idx]   else closeStr;
            let lowStr    = if (idx < lows.size())    lows[idx]    else closeStr;
            let volumeStr = if (idx < volumes.size()) volumes[idx] else "0";
            if (not first) { result #= "," };
            result #= "{\"date\":\"" # date # "\",\"open\":"   # (if (openStr   == "null" or openStr.size()   == 0) closeStr else openStr)
                                             # ",\"high\":"   # (if (highStr   == "null" or highStr.size()   == 0) closeStr else highStr)
                                             # ",\"low\":"    # (if (lowStr    == "null" or lowStr.size()    == 0) closeStr else lowStr)
                                             # ",\"close\":"  # closeStr
                                             # ",\"volume\":" # (if (volumeStr == "null" or volumeStr.size() == 0) "0" else volumeStr)
                                             # "}";
            first := false;
          };
        };
      };
      idx += 1;
    };
    result #= "]";
    if (first) null else ?result
  };
};
