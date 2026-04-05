// Stooq CSV fetching — frontend only, no backend canister
// NOTE: This module is kept for filterByTimeRange and as fallback.
// Primary data fetching should use yahooFinance.ts (Yahoo Finance + Stooq fallback).
import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

// corsproxy.io correct format: ?ENCODED_URL (NOT ?url=ENCODED_URL)
const PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

function isValidCSV(text: string): boolean {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<")) return false;
  if (trimmed.startsWith("{")) return false;
  const firstLine = trimmed.split("\n")[0].toLowerCase();
  return firstLine.includes("date") && firstLine.includes(",");
}

async function tryProxy(
  stooqUrl: string,
  proxyFn: (url: string) => string,
  timeout = 20000,
): Promise<string> {
  const proxyUrl = proxyFn(stooqUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(proxyUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // allorigins might wrap in JSON
    let content = text;
    try {
      const wrapper = JSON.parse(text);
      if (typeof wrapper?.contents === "string") content = wrapper.contents;
    } catch {
      // raw content
    }
    if (!isValidCSV(content)) throw new Error("Contenu non-CSV reçu");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStooqCSVRaw(ticker: string): Promise<string> {
  const stooqUrl = `https://stooq.com/q/d/l/?s=${encodeURIComponent(ticker)}&i=d`;
  return Promise.any(PROXIES.map((proxyFn) => tryProxy(stooqUrl, proxyFn)));
}

export function parseStooqCSV(csv: string): OHLCRow[] {
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

    const open = Number.parseFloat(openStr) || close;
    const high = Number.parseFloat(highStr) || close;
    const low = Number.parseFloat(lowStr) || close;
    const volume = volumeStr ? Number.parseFloat(volumeStr) : undefined;

    rows.push({
      date,
      open,
      high,
      low,
      close,
      volume: volume != null && !Number.isNaN(volume) ? volume : undefined,
    });
  }

  if (rows.length === 0) throw new Error("Aucune donnée valide trouvée");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

export async function fetchStooqHistory(
  ticker: string,
): Promise<TimeSeries | StooqError> {
  try {
    const csv = await fetchStooqCSVRaw(ticker);
    const rows = parseStooqCSV(csv);
    return { ticker, data: rows, fetchedAt: new Date() };
  } catch (error) {
    const msg =
      error instanceof AggregateError
        ? error.errors.map((e: Error) => e.message).join(" / ")
        : error instanceof Error
          ? error.message
          : "Erreur inconnue";
    return {
      type: "network",
      message: `Impossible de charger les données: ${msg}`,
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
