import Map       "mo:core/Map";
import Types     "types/data-fetching";

import DataFetchingApi "mixins/data-fetching-api";


actor {
  let cache = Map.empty<Text, Types.CacheEntry>();

  include DataFetchingApi(cache);
};
