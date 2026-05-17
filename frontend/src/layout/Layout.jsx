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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function BackgroundOption({ active, color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[88px] overflow-hidden rounded-2xl border p-3 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent-border)]"
          : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent-border)]"
      }`}
    >
      <span className="absolute inset-0 opacity-60" style={{ background: color }} />
      <span className="absolute inset-0 bg-[var(--surface)]/75 backdrop-blur-[1px]" />
      <span className="relative flex items-start justify-between gap-3">
        <span>
          <span className="app-text block text-sm font-semibold">{label}</span>
          <span className="app-muted mt-1 block text-[11px]">Tema</span>
        </span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-full border transition ${
            active
              ? "border-[var(--accent)] bg-[var(--accent)] text-gray-950"
              : "border-white/10 bg-black/10 text-transparent group-hover:text-[var(--muted)]"
          }`}
        >
          <CheckIcon />
        </span>
      </span>
      <span className="relative mt-4 flex gap-1">
        <span className="h-2 w-8 rounded-full bg-[var(--accent)]" />
        <span className="h-2 w-4 rounded-full bg-white/20" />
        <span className="h-2 w-6 rounded-full bg-white/10" />
      </span>
    </button>
  );
}

function AccentOption({ active, color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] app-text"
          : "border-[var(--border)] app-muted hover:border-[var(--accent-border)] hover:text-[var(--text)]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-4 w-4 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: color, color }} />
        <span className="truncate">{label}</span>
      </span>
      <span className={active ? "text-[var(--accent)]" : "text-transparent"}>
        <CheckIcon />
      </span>
    </button>
  );
}

export default function Layout({ children }) {
  const { accent, background, resetAppearance, setAccent, setBackground, setTheme, theme } = useTheme();
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
          <div className="app-surface-raised absolute right-0 mt-3 w-[min(23rem,calc(100vw-2rem))] rounded-2xl border p-4 shadow-2xl">
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

            <div className="mt-4 space-y-4">
              <section>
                <div className="app-surface-muted grid grid-cols-2 rounded-2xl border border-[var(--border)] p-1">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      theme === "light"
                        ? "bg-[var(--accent)] text-gray-950"
                        : "app-muted hover:text-[var(--text)]"
                    }`}
                  >
                    <SunIcon />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      theme === "dark"
                        ? "bg-[var(--accent)] text-gray-950"
                        : "app-muted hover:text-[var(--text)]"
                    }`}
                  >
                    <MoonIcon />
                    Escuro
                  </button>
                </div>
              </section>

              <section>
                <p className="app-muted mb-2 text-xs font-semibold uppercase tracking-[0.16em]">Tema</p>
                <div className="grid grid-cols-2 gap-2">
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
                <p className="app-muted mb-2 text-xs font-semibold uppercase tracking-[0.16em]">Destaque</p>
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

              <button
                type="button"
                onClick={resetAppearance}
                className="app-muted w-full rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold transition hover:border-[var(--accent-border)] hover:text-[var(--text)]"
              >
                Restaurar padrão
              </button>
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
