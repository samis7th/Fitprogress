import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import { accentOptions, backgroundOptions, useTheme } from "../context/ThemeContext.jsx";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.4-3.43 1 1 0 0 1 .7-1.7H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3z" />
    </svg>
  );
}

function BackgroundOption({ active, color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-border flex items-center gap-3 rounded-lg border p-2 text-left transition hover:border-emerald-500/40 ${
        active ? "bg-emerald-500/10 ring-1 ring-[var(--accent)]" : "app-surface-muted"
      }`}
    >
      <span className="h-8 w-10 rounded-lg border border-white/10" style={{ background: color }} />
      <span className="app-text text-sm font-medium">{label}</span>
    </button>
  );
}

function AccentOption({ active, color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active ? "border-[var(--accent)] bg-emerald-500/10 app-text" : "app-border app-muted hover:text-emerald-500"
      }`}
    >
      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </button>
  );
}

export default function Layout({ children }) {
  const { accent, background, setAccent, setBackground, theme, toggleTheme } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="fixed right-4 top-4 z-40 lg:right-6">
        <button
          type="button"
          onClick={() => setAppearanceOpen((current) => !current)}
          className="app-surface app-muted flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold transition hover:border-emerald-500/40 hover:text-emerald-500"
        >
          <PaletteIcon />
          <span className="hidden sm:inline">Aparência</span>
        </button>

        {appearanceOpen && (
          <div className="app-surface-raised absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="app-text text-sm font-semibold">Aparência</p>
                <p className="app-muted mt-1 text-xs">Ajustes visuais salvos neste navegador.</p>
              </div>
              <button
                type="button"
                onClick={() => setAppearanceOpen(false)}
                className="app-muted rounded-lg px-2 py-1 text-sm transition hover:bg-emerald-500/10 hover:text-emerald-500"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <section>
                <p className="app-muted mb-2 text-xs font-semibold uppercase">Modo</p>
                <div className="app-surface-muted app-border grid grid-cols-2 rounded-lg border p-1">
                  <button
                    type="button"
                    onClick={() => theme === "dark" && toggleTheme()}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      theme === "light" ? "bg-emerald-500 text-gray-950" : "app-muted hover:text-emerald-500"
                    }`}
                  >
                    <SunIcon />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => theme === "light" && toggleTheme()}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      theme === "dark" ? "bg-emerald-500 text-gray-950" : "app-muted hover:text-emerald-500"
                    }`}
                  >
                    <MoonIcon />
                    Escuro
                  </button>
                </div>
              </section>

              <section>
                <p className="app-muted mb-2 text-xs font-semibold uppercase">Fundo</p>
                <div className="grid gap-2">
                  {backgroundOptions.map((option) => (
                    <BackgroundOption
                      key={option.id}
                      active={background === option.id}
                      color={option.color}
                      label={option.label}
                      onClick={() => setBackground(option.id)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <p className="app-muted mb-2 text-xs font-semibold uppercase">Cor principal</p>
                <div className="grid grid-cols-2 gap-2">
                  {accentOptions.map((option) => (
                    <AccentOption
                      key={option.id}
                      active={accent === option.id}
                      color={option.color}
                      label={option.label}
                      onClick={() => setAccent(option.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
      <main className="px-4 pb-8 pt-20 sm:px-6 lg:ml-[220px] lg:px-6 lg:py-6">
        <div className="mx-auto max-w-[1320px]">
          <div key={location.pathname} className="page-transition">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
}
