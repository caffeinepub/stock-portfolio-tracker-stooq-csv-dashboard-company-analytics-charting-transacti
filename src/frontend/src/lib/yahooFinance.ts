import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

// Convert Stooq-style ticker to Yahoo Finance symbol
// nvda.us → NVDA, asml.as → ASML.AS, stmpa.pa → STMPA.PA
export function stooqToYahoo(stooqTicker: string): string {
  const upper = stooqTicker.toUpperCase();
  if (upper.endsWith(".US")) {
    return upper.slice(0, -3);
  }
  return upper;
}

async function tryFetch(url: string, timeout = 15000): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: { Accept: "application/json, text/plain, */*" },
  });
}

async function fetchYahooChart(yahooSymbol: string): Promise<any> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5y&includePrePost=false`;

  const attempts = [
    () => tryFetch(url),
    () => tryFetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`),
    () =>
      tryFetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`),
  ];

  let lastErr: Error = new Error("Tous les serveurs ont échoué");

  for (let i = 0; i < attempts.length; i++) {
    try {
      const res = await attempts[i]();
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        lastErr = new Error("Réponse HTML inattendue");
        continue;
      }
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        lastErr = new Error("Réponse non-JSON");
        continue;
      }
      // allorigins wraps the response in { contents: "..." }
      if (i === 2 && typeof json?.contents === "string") {
        const inner = json.contents.trimStart();
        if (inner.startsWith("<")) {
          lastErr = new Error("Réponse HTML via proxy");
          continue;
        }
        try {
          json = JSON.parse(json.contents);
        } catch {
          lastErr = new Error("Réponse proxy non-JSON");
          continue;
        }
      }
      return json;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr;
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
