import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getStoredAccent,
  getStoredBackground,
  getStoredTheme,
  storeAccent,
  storeBackground,
  storeTheme,
} from "../services/theme.js";

const ThemeContext = createContext(null);

export const backgroundOptions = [
  { id: "default", label: "Carbono", color: "linear-gradient(135deg, #f5f7fb 0%, #0d0f14 100%)" },
  { id: "graphite", label: "Grafite", color: "linear-gradient(135deg, #f0f3f8 0%, #080a12 100%)" },
  { id: "plum", label: "Roxo profundo", color: "linear-gradient(135deg, #faf5ff 0%, #120a1f 100%)" },
];

export const accentOptions = [
  { id: "violet", label: "Violeta", color: "#7C5CFC" },
  { id: "emerald", label: "Teal fitness", color: "#00D4AA" },
  { id: "rose", label: "Energia", color: "#F43F5E" },
  { id: "teal", label: "Ciano", color: "#21D9C8" },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);
  const [background, setBackground] = useState(getStoredBackground);
  const [accent, setAccent] = useState(getStoredAccent);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storeTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.background = background;
    storeBackground(background);
  }, [background]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    storeAccent(accent);
  }, [accent]);

  const value = useMemo(
    () => ({
      theme,
      background,
      accent,
      setBackground,
      setAccent,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [accent, background, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
