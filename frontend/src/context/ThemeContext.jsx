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
  { id: "default", label: "Neutro", color: "linear-gradient(135deg, #f8fafc 0%, #030712 100%)" },
  { id: "graphite", label: "Grafite", color: "linear-gradient(135deg, #eef2f7 0%, #080a12 100%)" },
  { id: "plum", label: "Uva", color: "linear-gradient(135deg, #faf5ff 0%, #120a1f 100%)" },
];

export const accentOptions = [
  { id: "emerald", label: "Esmeralda", color: "#10B981" },
  { id: "violet", label: "Violeta", color: "#8B5CF6" },
  { id: "rose", label: "Rosa", color: "#E11D48" },
  { id: "teal", label: "Teal", color: "#14B8A6" },
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
