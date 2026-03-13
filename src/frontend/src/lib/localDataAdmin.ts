// Local storage data administration helpers

import { STORAGE_KEYS } from "./storageKeys";

export interface DataCategory {
  key: string;
  label: string;
  description: string;
}

export const DATA_CATEGORIES: DataCategory[] = [
  {
    key: STORAGE_KEYS.FAVORITES,
    label: "Favoris",
    description: "Entreprises favorites",
  },
  {
    key: STORAGE_KEYS.TRANSACTIONS,
    label: "Transactions",
    description: "Historique des achats et ventes",
  },
  {
    key: STORAGE_KEYS.HORIZONTAL_LINES,
    label: "Lignes horizontales",
    description: "Supports, résistances et prix cibles",
  },
  {
    key: STORAGE_KEYS.BUY_TARGETS,
    label: "Targets d'achat",
    description: "Paliers d'achat planifiés",
  },
  {
    key: STORAGE_KEYS.CHART_PREFERENCES,
    label: "Préférences graphique",
    description: "Mode d'affichage et indicateurs",
  },
];

export function exportCategoryData(key: string): string {
  const data = localStorage.getItem(key);
  return data || "{}";
}

export function clearCategoryData(key: string): void {
  localStorage.removeItem(key);
}

export function clearAllData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

export function exportAllData(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    result[name] = exportCategoryData(key);
  }
  return result;
}
