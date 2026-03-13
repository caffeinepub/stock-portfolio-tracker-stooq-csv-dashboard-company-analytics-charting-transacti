// Favorites persistence hook

import { STORAGE_KEYS } from "../lib/storageKeys";
import { useLocalStorage } from "./useLocalStorage";

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    STORAGE_KEYS.FAVORITES,
    [],
  );

  const toggleFavorite = (ticker: string) => {
    setFavorites((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker],
    );
  };

  const isFavorite = (ticker: string) => favorites.includes(ticker);

  return { favorites, toggleFavorite, isFavorite };
}
