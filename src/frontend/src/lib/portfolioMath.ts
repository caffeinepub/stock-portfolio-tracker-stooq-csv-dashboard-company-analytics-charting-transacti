// Portfolio calculations from transactions

import type { PositionMetrics, Transaction } from "./types";

export function calculatePositionMetrics(
  transactions: Transaction[],
  currentPrice: number,
): PositionMetrics | null {
  if (transactions.length === 0) {
    return null;
  }

  const ticker = transactions[0].ticker;
  let totalShares = 0;
  let totalCost = 0;
  let realizedPL = 0;

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  for (const tx of sorted) {
    if (tx.type === "BUY") {
      totalShares += tx.quantity;
      totalCost += tx.quantity * tx.price;
    } else {
      // SELL
      const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
      realizedPL += tx.quantity * (tx.price - avgCost);
      totalShares -= tx.quantity;
      totalCost -= tx.quantity * avgCost;
    }
  }

  const avgBuyPrice = totalShares > 0 ? totalCost / totalShares : 0;
  const currentValue = totalShares * currentPrice;
  const unrealizedPL = currentValue - totalCost;
  const unrealizedPLPercent =
    totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

  return {
    ticker,
    sharesHeld: totalShares,
    avgBuyPrice,
    currentPrice,
    currentValue,
    unrealizedPL,
    unrealizedPLPercent,
    realizedPL,
    totalCost,
  };
}
