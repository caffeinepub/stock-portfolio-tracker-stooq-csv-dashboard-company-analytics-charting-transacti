// Stooq CSV data retrieval and parsing
// Actor is passed as parameter to allow use from React hooks

import type { backendInterface } from "../backend";
import type { OHLCRow, TimeSeries } from "./types";

export interface StooqError {
  type: "network" | "parse" | "empty" | "invalid";
  message: string;
}

export async function fetchStooqHistory(
  ticker: string,
  actor: backendInterface,
): Promise<TimeSeries | StooqError> {
  try {
    const csvText = await actor.fetchStooqCSV(ticker);

    if (!csvText || csvText.trim().length === 0) {
      return {
        type: "empty",
        message: "Aucune donnée disponible pour ce ticker",
      };
    }

    const parsed = parseStooqCSV(csvText);

    if ("type" in parsed) return parsed;

    if (parsed.length === 0) {
      return { type: "empty", message: "Aucune donnée historique trouvée" };
    }

    return { ticker, data: parsed, fetchedAt: new Date() };
  } catch (error) {
    return {
      type: "network",
      message: `Erreur de connexion: ${error instanceof Error ? error.message : "Inconnue"}`,
    };
  }
}

function parseStooqCSV(csvText: string): OHLCRow[] | StooqError {
  try {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2)
      return { type: "invalid", message: "Format CSV invalide" };

    const header = lines[0].toLowerCase();
    const hasVolume = header.includes("vol");
    const data: OHLCRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      if (parts.length < 5) continue;

      const dateStr = parts[0].replace(/-/g, "");
      const open = Number.parseFloat(parts[1]);
      const high = Number.parseFloat(parts[2]);
      const low = Number.parseFloat(parts[3]);
      const close = Number.parseFloat(parts[4]);
      const volume =
        hasVolume && parts[5] ? Number.parseFloat(parts[5]) : undefined;

      const year = Number.parseInt(dateStr.substring(0, 4));
      const month = Number.parseInt(dateStr.substring(4, 6)) - 1;
      const day = Number.parseInt(dateStr.substring(6, 8));
      const date = new Date(year, month, day);

      if (
        Number.isNaN(open) ||
        Number.isNaN(high) ||
        Number.isNaN(low) ||
        Number.isNaN(close) ||
        Number.isNaN(date.getTime()) ||
        close <= 0
      ) {
        continue;
      }
      data.push({ date, open, high, low, close, volume });
    }

    data.sort((a, b) => a.date.getTime() - b.date.getTime());
    return data;
  } catch (error) {
    return {
      type: "parse",
      message: `Erreur de parsing: ${error instanceof Error ? error.message : "Inconnue"}`,
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
  const cutoffDate = new Date(
    now.getFullYear() - years,
    now.getMonth(),
    now.getDate(),
  );
  return data.filter((row) => row.date >= cutoffDate);
}
