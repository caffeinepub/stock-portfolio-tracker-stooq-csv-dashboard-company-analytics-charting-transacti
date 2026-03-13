// Horizontal lines persistence hook

import { STORAGE_KEYS } from "../lib/storageKeys";
import type { HorizontalLine } from "../lib/types";
import { useLocalStorage } from "./useLocalStorage";

export function useHorizontalLines(ticker: string) {
  const [allLines, setAllLines] = useLocalStorage<
    Record<string, HorizontalLine[]>
  >(STORAGE_KEYS.HORIZONTAL_LINES, {});

  const lines = allLines[ticker] || [];

  const addLine = (line: Omit<HorizontalLine, "id" | "ticker">) => {
    const newLine: HorizontalLine = {
      ...line,
      id: `${Date.now()}-${Math.random()}`,
      ticker,
    };

    setAllLines((prev) => ({
      ...prev,
      [ticker]: [...(prev[ticker] || []), newLine],
    }));
  };

  const updateLine = (
    id: string,
    updates: Partial<Omit<HorizontalLine, "id" | "ticker">>,
  ) => {
    setAllLines((prev) => ({
      ...prev,
      [ticker]: (prev[ticker] || []).map((line) =>
        line.id === id ? { ...line, ...updates } : line,
      ),
    }));
  };

  const deleteLine = (id: string) => {
    setAllLines((prev) => ({
      ...prev,
      [ticker]: (prev[ticker] || []).filter((line) => line.id !== id),
    }));
  };

  return { lines, addLine, updateLine, deleteLine };
}
