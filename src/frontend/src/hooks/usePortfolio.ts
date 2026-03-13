// Portfolio aggregation hook

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { calculatePositionMetrics } from "../lib/portfolioMath";
import { fetchStooqHistory } from "../lib/stooq";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type {
  PortfolioSummary,
  PositionMetrics,
  Transaction,
} from "../lib/types";
import { useActor } from "./useActor";
import { useLocalStorage } from "./useLocalStorage";

export function usePortfolio() {
  const { actor, isFetching: actorFetching } = useActor();
  const [allTransactions] = useLocalStorage<Record<string, Transaction[]>>(
    STORAGE_KEYS.TRANSACTIONS,
    {},
  );

  const tickers = Object.keys(allTransactions).filter(
    (ticker) => (allTransactions[ticker] || []).length > 0,
  );

  const priceQueries = useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: ["stooq-history", ticker],
      queryFn: async () => {
        if (!actor) return null;
        const result = await fetchStooqHistory(ticker, actor);
        if ("type" in result) throw new Error(result.message);
        return result;
      },
      enabled: !!actor && !actorFetching,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  const isLoading = actorFetching || priceQueries.some((q) => q.isLoading);
  const hasError = priceQueries.some((q) => q.isError);

  const summary: PortfolioSummary | null = useMemo(() => {
    if (tickers.length === 0) return null;
    if (isLoading) return null;

    const positions: PositionMetrics[] = [];

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const query = priceQueries[i];
      const transactions = allTransactions[ticker] || [];
      if (transactions.length === 0 || !query) continue;

      const timeSeries = query.data;
      if (!timeSeries || timeSeries.data.length === 0) continue;

      const currentPrice = timeSeries.data[timeSeries.data.length - 1].close;
      const metrics = calculatePositionMetrics(transactions, currentPrice);
      if (metrics && metrics.sharesHeld > 0) positions.push(metrics);
    }

    if (positions.length === 0) return null;

    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalPL = positions.reduce(
      (sum, p) => sum + p.unrealizedPL + p.realizedPL,
      0,
    );
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalPL, totalPLPercent, positions };
  }, [isLoading, tickers, priceQueries, allTransactions]);

  return { summary, isLoading, hasError };
}
