import Map              "mo:core/Map";
import Text             "mo:core/Text";
import Time             "mo:core/Time";
import Types            "../types/data-fetching";
import Lib              "../lib/data-fetching";

/// Public API surface for the data-fetching domain.
/// Receives the shared cache map via mixin injection.
mixin (cache : Map.Map<Text, Types.CacheEntry>) {
  /// IC HTTP response normalisation — required by the IC http_request transform mechanism.
  /// Strips non-deterministic headers so all subnet replicas agree on the response.
  public query func transform(input : Lib.TransformArgs) : async Lib.HttpRequestResult {
    { input.response with headers = [] }
  };

  /// Perform a single HTTP GET via IC management canister http_request.
  /// Returns null on non-2xx status.
  func httpGet(url : Text) : async ?Text {
    let ic = actor "aaaaa-aa" : actor {
      http_request : ({
        url               : Text;
        max_response_bytes : ?Nat64;
        method            : { #get; #head; #post };
        headers           : [Lib.HttpHeader];
        body              : ?Blob;
        transform         : ?{ function : Lib.TransformFn; context : Blob };
        is_replicated     : ?Bool;
      }) -> async Lib.HttpRequestResult;
    };
    let result = await (with cycles = 20_000_000_000) ic.http_request({
      url               = url;
      max_response_bytes = ?(500_000 : Nat64);
      method            = #get;
      headers           = [
        { name = "Accept";     value = "application/json" },
        { name = "User-Agent"; value = "Mozilla/5.0" },
      ];
      body          = null;
      transform     = ?{ function = transform; context = ("" : Text).encodeUtf8() };
      is_replicated = null;
    });
    if (result.status >= 200 and result.status < 300) {
      switch (result.body.decodeUtf8()) {
        case (?t) ?t;
        case null ?""
      }
    } else {
      null
    }
  };

  /// Fetch historical OHLCV data for `ticker`.
  /// Returns a JSON string the frontend parses directly.
  /// On failure returns: {"error":"<reason>"}
  public shared func fetchStockHistory(ticker : Text) : async Text {
    // Serve from cache if fresh
    switch (cache.get(ticker)) {
      case (?entry) {
        if (Lib.isFresh(entry)) return entry.payload;
      };
      case null {};
    };

    // Try FMP — normalize to flat OHLCV array before caching
    let fmpResult = await httpGet(Lib.fmpUrl(ticker));
    switch (fmpResult) {
      case (?body) {
        switch (Lib.normalizeFmp(body)) {
          case (?normalized) {
            cache.add(ticker, { payload = normalized; fetchedAt = Time.now() / 1_000_000_000 });
            return normalized;
          };
          case null {}; // bad FMP response, fall through to Yahoo
        };
      };
      case null {};
    };

    // Try Yahoo Finance as fallback — normalize to flat OHLCV array
    let yahooResult = await httpGet(Lib.yahooUrl(ticker));
    switch (yahooResult) {
      case (?body) {
        switch (Lib.normalizeYahoo(body)) {
          case (?normalized) {
            cache.add(ticker, { payload = normalized; fetchedAt = Time.now() / 1_000_000_000 });
            return normalized;
          };
          case null {}; // bad Yahoo response, fall through
        };
      };
      case null {};
    };

    // Both failed
    "{\"error\":\"Impossible de charger les donn\u{e9}es pour " # ticker # "\"}"
  };
};
