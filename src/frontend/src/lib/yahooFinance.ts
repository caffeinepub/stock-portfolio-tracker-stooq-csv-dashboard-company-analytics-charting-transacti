import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

/**
 * Convert Stooq-style ticker to Yahoo Finance symbol.
 * Examples:
 *   nvda.us   → NVDA
 *   asml.as   → ASML.AS
 *   stmpa.pa  → STMPA.PA
 *   ifx.de    → IFX.DE
 *   maersk-b.co → MAERSK-B.CO
 *   eric-b.st   → ERIC-B.ST
 */
export function stooqToYahoo(stooqTicker: string): string {
  const parts = stooqTicker.split(".");
  if (parts.length < 2) return stooqTicker.toUpperCase();
  const suffix = parts[parts.length - 1].toLowerCase();
  const base = parts.slice(0, -1).join(".").toUpperCase();
  if (suffix === "us") return base;
  return `${base}.${suffix.toUpperCase()}`;
}

function yahooChartUrl(symbol: string, host: string): string {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 6 * 365 * 24 * 60 * 60; // 6 years back
  return `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false&events=div%2Csplit`;
}

async function tryDirect(symbol: string, timeout = 30000): Promise<any> {
  // Try query1 and query2 in parallel, take first to succeed
  const hosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await Promise.any(
      hosts.map(async (host) => {
        const url = yahooChartUrl(symbol, host);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${host}`);
        const text = await res.text();
        if (text.trimStart().startsWith("<"))
          throw new Error(`HTML response from ${host}`);
        const json = JSON.parse(text);
        // Validate structure early so we don't accept garbage
        if (!json?.chart?.result?.[0]?.timestamp)
          throw new Error(`Invalid JSON structure from ${host}`);
        return json;
      }),
    );
  } finally {
    clearTimeout(timer);
  }
}

async function tryProxy(symbol: string, timeout = 30000): Promise<any> {
  const directUrl = yahooChartUrl(symbol, "query1.finance.yahoo.com");
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
  ];

  let lastErr: Error = new Error("Tous les proxies ont échoué");

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      let res: Response;
      try {
        res = await fetch(proxyUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      let raw = text;
      // allorigins wraps in { contents: "..." }
      if (proxyUrl.includes("allorigins")) {
        try {
          const wrapper = JSON.parse(text);
          if (typeof wrapper?.contents === "string") raw = wrapper.contents;
        } catch {
          // not wrapped
        }
      }
      if (raw.trimStart().startsWith("<")) {
        lastErr = new Error("Réponse HTML du proxy");
        continue;
      }
      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        lastErr = new Error("JSON invalide du proxy");
        continue;
      }
      if (!json?.chart?.result?.[0]?.timestamp) {
        lastErr = new Error("Structure Yahoo invalide via proxy");
        continue;
      }
      return json;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr;
}

async function fetchYahooChart(symbol: string): Promise<any> {
  // 1. Try direct browser fetch (CORS supported by Yahoo for most regions)
  try {
    return await tryDirect(symbol);
  } catch {
    // fall through to proxy
  }
  // 2. Proxy fallback
  return tryProxy(symbol);
}

function parseYahooChart(data: any): OHLCRow[] {
  const result = data?.chart?.result?.[0];
  if (!result) {
    const errMsg =
      data?.chart?.error?.description ?? "Structure Yahoo Finance invalide";
    throw new Error(errMsg);
  }

  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0)
    throw new Error("Données OHLCV manquantes");

  const { open, high, low, close, volume } = quote;
  const rows: OHLCRow[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const c = close?.[i];
    if (c == null || Number.isNaN(c) || c <= 0) continue;
    const o = open?.[i];
    const h = high?.[i];
    const l = low?.[i];
    const v = volume?.[i];
    rows.push({
      date: new Date(timestamps[i] * 1000),
      open: o != null && !Number.isNaN(o) ? o : c,
      high: h != null && !Number.isNaN(h) ? h : c,
      low: l != null && !Number.isNaN(l) ? l : c,
      close: c,
      volume: v != null && !Number.isNaN(v) ? v : undefined,
    });
  }

  if (rows.length === 0) throw new Error("Aucune donnée valide trouvée");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

export async function fetchStooqHistory(
  ticker: string,
): Promise<TimeSeries | StooqError> {
  const yahooSymbol = stooqToYahoo(ticker);
  try {
    const data = await fetchYahooChart(yahooSymbol);
    const rows = parseYahooChart(data);
    return { ticker, data: rows, fetchedAt: new Date() };
  } catch (error) {
    return {
      type: "network",
      message: `Impossible de charger les données: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
    };
  }
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
