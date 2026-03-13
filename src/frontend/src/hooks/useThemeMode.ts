// Theme mode persistence hook

import { useEffect } from "react";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { useLocalStorage } from "./useLocalStorage";

type ThemeMode = "light" | "dark";

export function useThemeMode() {
  const [mode, setMode] = useLocalStorage<ThemeMode>(
    STORAGE_KEYS.THEME_MODE,
    "dark",
  );

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { mode, setMode, toggleMode };
}
