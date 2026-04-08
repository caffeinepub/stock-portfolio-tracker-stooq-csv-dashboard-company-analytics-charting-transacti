import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { TimeSeries } from "../lib/types";
import { fetchStooqHistory } from "../lib/yahooFinance";

export function useStooqHistory(ticker: string | null) {
  const { actor, isFetching: actorLoading } = useActor(createActor);

  return useQuery<TimeSeries | null>({
    queryKey: ["stock-history", ticker],
    queryFn: async () => {
      if (!ticker || !actor) return null;
      const result = await fetchStooqHistory(actor, ticker);
      if ("type" in result) throw new Error(result.message);
      return result;
    },
    enabled: !!ticker && !!actor && !actorLoading,
    staleTime: 15 * 60 * 1000, // 15 min cache — data is ~15 min delayed anyway
    retry: 1,
  });
}
