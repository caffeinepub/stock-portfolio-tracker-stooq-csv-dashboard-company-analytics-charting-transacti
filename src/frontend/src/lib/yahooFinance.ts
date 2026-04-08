import type { backendInterface } from "../backend.d.ts";
import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

// ---------------------------------------------------------------------------
// In-memory cache (15 min TTL) — shared across all callers
// ---------------------------------------------------------------------------

const memCache = new Map<string, Promise<OHLCRow[]>>();

// ---------------------------------------------------------------------------
// Core fetch: calls backend.fetchStockHistory(ticker) → parses JSON
// ---------------------------------------------------------------------------

async function fetchFromBackend(
  actor: backendInterface,
  ticker: string,
): Promise<OHLCRow[]> {
  const raw: string = await actor.fetchStockHistory(ticker);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse non-JSON du serveur");
  }

  // Backend returns {error: string} on failure
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "error" in (parsed as Record<string, unknown>)
  ) {
    throw new Error(String((parsed as Record<string, unknown>).error));
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Format de réponse invalide");
  }

  const rows: OHLCRow[] = [];
  for (const entry of parsed as Record<string, unknown>[]) {
    const date = new Date(entry.date as string);
    if (Number.isNaN(date.getTime())) continue;
    const close = Number(entry.close);
    if (Number.isNaN(close) || close <= 0) continue;
    rows.push({
      date,
      open: Number(entry.open) || close,
      high: Number(entry.high) || close,
      low: Number(entry.low) || close,
      close,
      volume: entry.volume != null ? Number(entry.volume) : undefined,
    });
  }

  if (rows.length === 0) throw new Error("Aucune donnée valide");
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}

// ---------------------------------------------------------------------------
// Main export: fetchStooqHistory(actor, ticker) — calls backend server-side
// ---------------------------------------------------------------------------

export async function fetchStooqHistory(
  actor: backendInterface,
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

  const fetchPromise = fetchFromBackend(actor, ticker);

  // Cache promise for 15 minutes
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
// filterByTimeRange — unchanged
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// stooqToYahoo — kept for compatibility
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
