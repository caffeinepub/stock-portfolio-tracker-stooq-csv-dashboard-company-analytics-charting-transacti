// Shared types for the application

export interface OHLCRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TimeSeries {
  ticker: string;
  data: OHLCRow[];
  fetchedAt: Date;
}

export interface Transaction {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  date: Date;
  quantity: number;
  price: number;
  note?: string;
}

export interface HorizontalLine {
  id: string;
  ticker: string;
  label: string;
  price: number;
  color: string;
}

export interface BuyTarget {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  status: "Planned" | "Executed";
  linkedTransactionId?: string;
  note?: string;
}

export interface PositionMetrics {
  ticker: string;
  sharesHeld: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedPL: number;
  totalCost: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  positions: PositionMetrics[];
}

export type TimeRange = "1Y" | "2Y" | "3Y" | "5Y" | "MAX";

export interface ChartPreferences {
  mode: "line" | "candlestick";
  showMA50: boolean;
  showMA200: boolean;
}
