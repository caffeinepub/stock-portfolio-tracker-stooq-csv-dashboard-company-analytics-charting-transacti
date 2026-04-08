// stooq.ts — CORS proxy code removed.
// Data fetching now handled by yahooFinance.ts (backend canister HTTP outcalls).
// This file kept for parseStooqCSV utility only.
import type { OHLCRow } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
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
