// Stooq data fetching hook with React Query caching
// Fetches directly from the browser — no backend canister required

import { useQuery } from "@tanstack/react-query";
import { fetchStooqHistory } from "../lib/stooq";
import type { TimeSeries } from "../lib/types";

export function useStooqHistory(ticker: string | null) {
  return useQuery<TimeSeries | null>({
    queryKey: ["stooq-history", ticker],
    queryFn: async () => {
      if (!ticker) return null;
      const result = await fetchStooqHistory(ticker);
      if ("type" in result) throw new Error(result.message);
      return result;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
