"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

type ThemeState = { dark: boolean; setDark: (dark: boolean) => void };

const ThemeContext = createContext<ThemeState | null>(null);
const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) isDark = saved === "dark";
    } catch {}
    setDarkState(isDark);
    applyMode(isDark ? Mode.Dark : Mode.Light);
  }, []);

  const setDark = (value: boolean) => {
    setDarkState(value);
    applyMode(value ? Mode.Dark : Mode.Light);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "dark" : "light");
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
