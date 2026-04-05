import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

// ---------------------------------------------------------------------------
// In-memory cache to avoid duplicate fetches
// ---------------------------------------------------------------------------

const memCache = new Map<string, Promise<OHLCRow[]>>();

// ---------------------------------------------------------------------------
// Request queue: max 4 concurrent fetches
// ---------------------------------------------------------------------------

let activeRequests = 0;
const MAX_CONCURRENT = 4;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = waitQueue.shift();
  if (next) next();
}

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

// ---------------------------------------------------------------------------
// Fetch with timeout helper
// ---------------------------------------------------------------------------

async function fetchTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// FMP Ticker Mapping
// Converts Stooq-format tickers (e.g. "asml.as") to FMP format (e.g. "ASML")
// FMP uses: US tickers without suffix, EU tickers sometimes with exchange suffix
// ---------------------------------------------------------------------------

const FMP_OVERRIDES: Record<string, string> = {
  // European stocks — FMP uses specific exchange suffixes
  "asml.as": "ASML",
  "stmpa.pa": "STM",
  "ifx.de": "IFX",
  "tte.pa": "TTE",
  "rno.pa": "RNO",
  "air.pa": "AIR",
  "vow3.de": "VOW3",
  "bmw.de": "BMW",
  "mbg.de": "MBG",
  "sie.de": "SIE",
  "mt.pa": "MT",
  "hlag.de": "HLAG",
  "lha.de": "LHA",
  "af.pa": "AF",
  "ubi.pa": "UBI",
  "maersk-b.co": "MAERSK-B",
  "abbn.sw": "ABBN",
  "eric-b.st": "ERIC-B",
  "nokia.he": "NOKIA",
  "stlam.as": "STLAM",
  // Problematic US-listed tickers
  "bhp.to": "BHP",
  "rio.to": "RIO",
  "nhydy.us": "NHYDY",
  "eurn.us": "EURN",
  // US stocks with .us suffix — strip suffix
  // (handled by default logic below)
};

function toFmpTicker(stooqTicker: string): string {
  const lower = stooqTicker.toLowerCase();
  if (FMP_OVERRIDES[lower]) return FMP_OVERRIDES[lower];
  // Default: strip suffix and uppercase
  const parts = stooqTicker.split(".");
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1].toLowerCase();
    if (suffix === "us") return parts[0].toUpperCase();
  }
  return stooqTicker.toUpperCase();
}

// ---------------------------------------------------------------------------
// Strategy 1: Financial Modeling Prep (FMP) with demo key
// CORS-compatible, no signup, covers major US/EU tickers
// ---------------------------------------------------------------------------

interface FMPHistoricalEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FMPResponse {
  symbol: string;
  historical: FMPHistoricalEntry[];
}

async function fetchFMP(stooqTicker: string): Promise<OHLCRow[]> {
  const symbol = toFmpTicker(stooqTicker);
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?apikey=demo`;

  const res = await fetchTimeout(url, 15000);
  if (!res.ok) throw new Error(`FMP HTTP ${res.status}`);

  const text = await res.text();
  if (!text || text.trimStart()[0] !== "{") throw new Error("FMP non-JSON");

  const data: FMPResponse = JSON.parse(text);
  if (!data.historical || data.historical.length === 0)
    throw new Error(`FMP: aucune donnée pour ${symbol}`);

  const rows = data.historical
    .map((entry) => {
      const date = new Date(entry.date);
      if (Number.isNaN(date.getTime())) return null;
      const close = Number(entry.close);
      if (Number.isNaN(close) || close <= 0) return null;
      return {
        date,
        open: Number(entry.open) || close,
        high: Number(entry.high) || close,
        low: Number(entry.low) || close,
        close,
        volume: entry.volume != null ? Number(entry.volume) : undefined,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) throw new Error("FMP: aucune ligne valide");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

// ---------------------------------------------------------------------------
// Ticker conversion for Yahoo Finance
// ---------------------------------------------------------------------------

export function stooqToYahoo(stooqTicker: string): string {
  const upper = stooqTicker.toUpperCase();
  const parts = upper.split(".");
  if (parts.length < 2) return upper;
  const suffix = parts[parts.length - 1];
  const base = parts.slice(0, -1).join(".");
  if (suffix === "US") return base;
  return `${base}.${suffix}`;
}

const YAHOO_OVERRIDES: Record<string, string[]> = {
  "bhp.to": ["BHP", "BHP.AX"],
  "rio.to": ["RIO", "RIO.L"],
  "stmpa.pa": ["STM.PA", "STM"],
  "nhydy.us": ["NHYDY"],
  "eurn.us": ["EURN"],
  "maersk-b.co": ["MAERSK-B.CO"],
  "eric-b.st": ["ERIC-B.ST"],
  "stlam.as": ["STLAM.MI", "STLAM.AS"],
};

function getYahooSymbols(stooqTicker: string): string[] {
  const lower = stooqTicker.toLowerCase();
  return YAHOO_OVERRIDES[lower] ?? [stooqToYahoo(stooqTicker)];
}

// ---------------------------------------------------------------------------
// Strategy 2: Yahoo Finance direct (no proxy)
// ---------------------------------------------------------------------------

async function fetchYahooDirect(stooqTicker: string): Promise<OHLCRow[]> {
  const symbols = getYahooSymbols(stooqTicker);
  const p2 = Math.floor(Date.now() / 1000);
  const p1 = p2 - 6 * 365 * 24 * 60 * 60;

  const errors: string[] = [];
  for (const sym of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&period1=${p1}&period2=${p2}&formatted=false`;
      const res = await fetchTimeout(url, 12000);
      if (!res.ok) {
        errors.push(`Yahoo ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (!text || text.trimStart()[0] !== "{") {
        errors.push("Yahoo non-JSON");
        continue;
      }
      const rows = parseYahooChart(JSON.parse(text));
      if (rows.length > 0) return rows;
    } catch (e) {
      errors.push(
        `Yahoo ${sym}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  throw new Error(errors.join(" | "));
}

// ---------------------------------------------------------------------------
// Strategy 3: Stooq CSV via corsproxy.io (last resort)
// ---------------------------------------------------------------------------

function unwrapProxy(text: string): string {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{")) {
    try {
      const w = JSON.parse(trimmed);
      if (typeof w?.contents === "string") return w.contents;
    } catch {
      /* raw */
    }
  }
  return text;
}

async function fetchStooqViaProxy(stooqTicker: string): Promise<OHLCRow[]> {
  const stooqUrl = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqTicker.toLowerCase())}&i=d`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(stooqUrl)}`;

  const res = await fetchTimeout(proxyUrl, 18000);
  if (!res.ok) throw new Error(`StooqProxy HTTP ${res.status}`);

  const text = unwrapProxy(await res.text());
  const first = text.trimStart()[0];
  if (first === "<") throw new Error("StooqProxy retourné HTML");

  const header = text.split("\n")[0].toLowerCase();
  if (!header.includes("date") || !header.includes(","))
    throw new Error("StooqProxy: en-tête CSV invalide");

  const rows = parseStooqCsv(text);
  if (rows.length === 0) throw new Error("StooqProxy: aucune ligne valide");
  return rows;
}

// ---------------------------------------------------------------------------
// Main export
// Order: FMP (CORS-native) → Yahoo direct → Stooq via proxy
// ---------------------------------------------------------------------------

export async function fetchStooqHistory(
  ticker: string,
): Promise<TimeSeries | StooqError> {
  const cacheKey = ticker.toLowerCase();

  if (memCache.has(cacheKey)) {
    try {
      const rows = await memCache.get(cacheKey)!;
      return { ticker, data: rows, fetchedAt: new Date() };
    } catch {
      memCache.delete(cacheKey);
    }
  }

  const fetchPromise = withSlot(async () => {
    // Strategy 1: FMP — CORS-native, no signup, best reliability
    try {
      return await fetchFMP(ticker);
    } catch {
      /* next */
    }

    // Strategy 2: Yahoo Finance direct
    try {
      return await fetchYahooDirect(ticker);
    } catch {
      /* next */
    }

    // Strategy 3: Stooq via corsproxy.io
    return fetchStooqViaProxy(ticker);
  });

  // Cache for 15 minutes
  memCache.set(cacheKey, fetchPromise);
  setTimeout(() => memCache.delete(cacheKey), 15 * 60 * 1000);

  try {
    const rows = await fetchPromise;
    return { ticker, data: rows, fetchedAt: new Date() };
  } catch (err) {
    memCache.delete(cacheKey);
    let msg = "Toutes les sources ont échoué";
    if (err instanceof Error) msg = err.message.slice(0, 200);
    return {
      type: "network",
      message: `Impossible de charger les données: ${msg}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseYahooChart(data: unknown): OHLCRow[] {
  const d = data as Record<string, unknown>;
  const result = (d?.chart as Record<string, unknown>)?.result;
  if (!Array.isArray(result) || result.length === 0) {
    const errMsg =
      ((d?.chart as Record<string, unknown>)?.error as Record<string, string>)
        ?.description ?? "Structure Yahoo Finance invalide";
    throw new Error(errMsg);
  }
  const r = result[0] as Record<string, unknown>;
  const timestamps = r.timestamp as number[] | undefined;
  const quote = (r.indicators as Record<string, unknown[]>)?.quote?.[0] as
    | Record<string, (number | null)[]>
    | undefined;

  if (!quote || !timestamps || timestamps.length === 0)
    throw new Error("Données OHLCV manquantes");

  const { open, high, low, close, volume } = quote;
  const rows: OHLCRow[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const c = close?.[i];
    if (c == null || Number.isNaN(c) || c <= 0) continue;
    rows.push({
      date: new Date(timestamps[i] * 1000),
      open: open?.[i] ?? c,
      high: high?.[i] ?? c,
      low: low?.[i] ?? c,
      close: c,
      volume: volume?.[i] ?? undefined,
    });
  }

  if (rows.length === 0) throw new Error("Aucune donnée valide");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

function parseStooqCsv(csv: string): OHLCRow[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV vide ou invalide");
  const rows: OHLCRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 5) continue;
    const [dateStr, openStr, highStr, lowStr, closeStr, volumeStr] = parts;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) continue;
    const close = Number.parseFloat(closeStr);
    if (Number.isNaN(close) || close <= 0) continue;
    rows.push({
      date,
      open: Number.parseFloat(openStr) || close,
      high: Number.parseFloat(highStr) || close,
      low: Number.parseFloat(lowStr) || close,
      close,
      volume: volumeStr ? Number.parseFloat(volumeStr) || undefined : undefined,
    });
  }
  if (rows.length === 0) throw new Error("Aucune donnée valide");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

export function filterByTimeRange(
  data: OHLCRow[],
  range: "1Y" | "2Y" | "3Y" | "5Y" | "MAX",
): OHLCRow[] {
  if (range === "MAX" || data.length === 0) return data;
  const now = new Date();
  const yearsMap = { "1Y": 1, "2Y": 2, "3Y": 3, "5Y": 5 };
  const years = yearsMap[range];
  const cutoff = new Date(
    now.getFullYear() - years,
    now.getMonth(),
    now.getDate(),
  );
  return data.filter((row) => row.date >= cutoff);
}
