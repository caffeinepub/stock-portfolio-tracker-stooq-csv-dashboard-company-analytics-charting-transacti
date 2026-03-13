// Stooq data fetching hook with React Query caching

import { useQuery } from "@tanstack/react-query";
import { fetchStooqHistory } from "../lib/stooq";
import type { TimeSeries } from "../lib/types";
import { useActor } from "./useActor";

export function useStooqHistory(ticker: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TimeSeries | null>({
    queryKey: ["stooq-history", ticker],
    queryFn: async () => {
      if (!ticker || !actor) return null;
      const result = await fetchStooqHistory(ticker, actor);
      if ("type" in result) throw new Error(result.message);
      return result;
    },
    enabled: !!ticker && !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
