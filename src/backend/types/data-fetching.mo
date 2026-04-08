module {
  /// A single OHLCV row returned to the frontend
  public type OHLCRow = {
    date   : Text;
    open   : Float;
    high   : Float;
    low    : Float;
    close  : Float;
    volume : Float;
  };

  /// In-memory cache entry for a ticker's historical data
  public type CacheEntry = {
    payload   : Text;   // serialised JSON Text (raw response tunnelled to frontend)
    fetchedAt : Int;    // seconds since epoch (Time.now() / 1_000_000_000)
  };
};
