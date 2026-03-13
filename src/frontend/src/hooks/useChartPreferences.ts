// Chart preferences persistence hook

import { STORAGE_KEYS } from "../lib/storageKeys";
import type { ChartPreferences } from "../lib/types";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_PREFERENCES: ChartPreferences = {
  mode: "line",
  showMA50: true,
  showMA200: true,
};

export function useChartPreferences() {
  return useLocalStorage<ChartPreferences>(
    STORAGE_KEYS.CHART_PREFERENCES,
    DEFAULT_PREFERENCES,
  );
}
