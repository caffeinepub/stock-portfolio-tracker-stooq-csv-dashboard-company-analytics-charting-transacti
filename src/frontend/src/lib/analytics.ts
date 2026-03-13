// Analytics calculations from time-series data

import type { OHLCRow } from "./types";

export interface Statistics {
  latestClose: number | null;
  change1M: number | null;
  change3M: number | null;
  change1Y: number | null;
  change5Y: number | null;
  high52W: number | null;
  low52W: number | null;
  ma50: number | null;
  ma200: number | null;
  volatility: number | null;
  maxDrawdown1Y: number | null;
  maxDrawdown5Y: number | null;
}

export function calculateStatistics(data: OHLCRow[]): Statistics {
  if (data.length === 0) {
    return {
      latestClose: null,
      change1M: null,
      change3M: null,
      change1Y: null,
      change5Y: null,
      high52W: null,
      low52W: null,
      ma50: null,
      ma200: null,
      volatility: null,
      maxDrawdown1Y: null,
      maxDrawdown5Y: null,
    };
  }

  const latestClose = data[data.length - 1].close;

  return {
    latestClose,
    change1M: calculatePercentChange(data, 21),
    change3M: calculatePercentChange(data, 63),
    change1Y: calculatePercentChange(data, 252),
    change5Y: calculatePercentChange(data, 1260),
    high52W: calculate52WeekHigh(data),
    low52W: calculate52WeekLow(data),
    ma50: calculateMA(data, 50),
    ma200: calculateMA(data, 200),
    volatility: calculateVolatility(data),
    maxDrawdown1Y: calculateMaxDrawdown(data, 252),
    maxDrawdown5Y: calculateMaxDrawdown(data, 1260),
  };
}

function calculatePercentChange(
  data: OHLCRow[],
  daysBack: number,
): number | null {
  if (data.length < 2) return null;
  const latestClose = data[data.length - 1].close;
  const targetIndex = Math.max(0, data.length - 1 - daysBack);
  const pastClose = data[targetIndex].close;
  if (pastClose === 0) return null;
  return ((latestClose - pastClose) / pastClose) * 100;
}

function calculate52WeekHigh(data: OHLCRow[]): number | null {
  const last252 = data.slice(-252);
  if (last252.length === 0) return null;
  return Math.max(...last252.map((d) => d.high));
}

function calculate52WeekLow(data: OHLCRow[]): number | null {
  const last252 = data.slice(-252);
  if (last252.length === 0) return null;
  return Math.min(...last252.map((d) => d.low));
}

function calculateMA(data: OHLCRow[], period: number): number | null {
  if (data.length < period) return null;
  const recent = data.slice(-period);
  const sum = recent.reduce((acc, d) => acc + d.close, 0);
  return sum / period;
}

export function calculateMAArray(
  data: OHLCRow[],
  period: number,
): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, d) => acc + d.close, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateVolatility(data: OHLCRow[]): number | null {
  if (data.length < 2) return null;
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const ret = Math.log(data[i].close / data[i - 1].close);
    returns.push(ret);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, ret) => acc + (ret - mean) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev * Math.sqrt(252) * 100;
}

function calculateMaxDrawdown(
  data: OHLCRow[],
  daysBack: number,
): number | null {
  const slice = data.slice(-daysBack);
  if (slice.length < 2) return null;
  let maxDrawdown = 0;
  let peak = slice[0].close;
  for (const row of slice) {
    if (row.close > peak) peak = row.close;
    const drawdown = ((row.close - peak) / peak) * 100;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}
