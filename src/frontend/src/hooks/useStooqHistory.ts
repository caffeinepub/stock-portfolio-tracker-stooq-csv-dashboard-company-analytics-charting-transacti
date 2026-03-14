// Yahoo Finance data fetching hook — frontend only, no backend canister
import { useQuery } from "@tanstack/react-query";
import type { TimeSeries } from "../lib/types";
import { fetchStooqHistory } from "../lib/yahooFinance";

export function useStooqHistory(ticker: string | null) {
  return useQuery<TimeSeries | null>({
    queryKey: ["stock-history", ticker],
    queryFn: async () => {
      if (!ticker) return null;
      const result = await fetchStooqHistory(ticker);
      if ("type" in result) throw new Error(result.message);
      return result;
    },
    enabled: !!ticker,
    staleTime: 15 * 60 * 1000, // 15 min cache — data is ~15 min delayed anyway
    retry: 1,
  });
}
