const THEME_KEY = "fitprogress_theme";
const BACKGROUND_KEY = "fitprogress_background";
const ACCENT_KEY = "fitprogress_accent";

const BACKGROUND_OPTIONS = ["default", "graphite", "plum"];
const ACCENT_OPTIONS = ["emerald", "violet", "rose", "teal"];

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function storeTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredBackground() {
  const background = localStorage.getItem(BACKGROUND_KEY);
  return BACKGROUND_OPTIONS.includes(background) ? background : "default";
}

export function storeBackground(background) {
  localStorage.setItem(BACKGROUND_KEY, background);
}

export function getStoredAccent() {
  const accent = localStorage.getItem(ACCENT_KEY);
  return ACCENT_OPTIONS.includes(accent) ? accent : "violet";
}

export function storeAccent(accent) {
  localStorage.setItem(ACCENT_KEY, accent);
}
