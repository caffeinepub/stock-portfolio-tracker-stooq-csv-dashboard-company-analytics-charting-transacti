// Buy targets persistence hook

import { STORAGE_KEYS } from "../lib/storageKeys";
import type { BuyTarget } from "../lib/types";
import { useLocalStorage } from "./useLocalStorage";

export function useBuyTargets(ticker: string) {
  const [allTargets, setAllTargets] = useLocalStorage<
    Record<string, BuyTarget[]>
  >(STORAGE_KEYS.BUY_TARGETS, {});

  const targets = allTargets[ticker] || [];

  const addTarget = (target: Omit<BuyTarget, "id" | "ticker">) => {
    const newTarget: BuyTarget = {
      ...target,
      id: `${Date.now()}-${Math.random()}`,
      ticker,
    };

    setAllTargets((prev) => ({
      ...prev,
      [ticker]: [...(prev[ticker] || []), newTarget],
    }));
  };

  const updateTarget = (
    id: string,
    updates: Partial<Omit<BuyTarget, "id" | "ticker">>,
  ) => {
    setAllTargets((prev) => ({
      ...prev,
      [ticker]: (prev[ticker] || []).map((target) =>
        target.id === id ? { ...target, ...updates } : target,
      ),
    }));
  };

  const deleteTarget = (id: string) => {
    setAllTargets((prev) => ({
      ...prev,
      [ticker]: (prev[ticker] || []).filter((target) => target.id !== id),
    }));
  };

  return { targets, addTarget, updateTarget, deleteTarget };
}
