import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import OutCall "http-outcalls/outcall";

actor {
  type CacheEntry = {
    csvData : Text;
    timestamp : Time.Time;
  };

  let cache = Map.empty<Text, CacheEntry>();
  let cacheTTL : Time.Time = 60 * 60 * 1_000_000_000; // 1 hour in nanoseconds

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchStooqCSV(ticker : Text) : async Text {
    let currentTime = Time.now();
    switch (cache.get(ticker)) {
      case (?entry) {
        if (currentTime - entry.timestamp < cacheTTL) {
          return entry.csvData;
        };
      };
      case (null) {};
    };
    let url = "https://stooq.com/q/d/l/?s=" # ticker # "&i=d";
    let csvData = await OutCall.httpGetRequest(url, [], transform);
    let newEntry : CacheEntry = {
      csvData;
      timestamp = currentTime;
    };
    cache.add(ticker, newEntry);
    csvData;
  };
};
