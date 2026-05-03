import { useState } from "react";
import { NavLink } from "react-router-dom";

import BrandLogo from "../components/BrandLogo.jsx";
import { getCurrentUser, logout } from "../services/auth.js";

function Icon({ children }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

function TreinosIcon() {
  return (
    <Icon>
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <path d="M3 9v6" />
      <path d="M21 9v6" />
      <path d="M6 12h12" />
    </Icon>
  );
}

function PesoIcon() {
  return (
    <Icon>
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="M12 14l3-5" />
      <path d="M8 18h8" />
    </Icon>
  );
}

function MetasIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M22 12h-3" />
    </Icon>
  );
}

function SemanaIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </Icon>
  );
}

function DietaIcon() {
  return (
    <Icon>
      <path d="M6 3v18" />
      <path d="M10 3v7a4 4 0 0 1-8 0V3" />
      <path d="M17 3v18" />
      <path d="M17 3c3 2 4 5 4 8h-4" />
    </Icon>
  );
}

function MenuIcon() {
  return (
    <Icon>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/treinos", label: "Treinos", icon: TreinosIcon },
  { to: "/semana", label: "Semana", icon: SemanaIcon },
  { to: "/peso", label: "Peso", icon: PesoIcon },
  { to: "/metas", label: "Metas", icon: MetasIcon },
  { to: "/dieta", label: "Dieta", icon: DietaIcon },
];

function SidebarContent({ onNavigate }) {
  const user = getCurrentUser();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div className="min-w-0">
            <p className="app-text text-lg font-semibold tracking-tight">FitProgress</p>
            <p className="app-muted mt-1 truncate text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-500 text-gray-950"
                    : "app-muted hover:bg-emerald-500/10 hover:text-emerald-500"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="app-border border-t p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="app-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-red-500/10 hover:text-red-500"
        >
          <LogoutIcon />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-surface app-muted fixed left-4 top-4 z-40 rounded-lg border p-2 lg:hidden"
        aria-label="Abrir menu"
      >
        <MenuIcon />
      </button>

      <aside className="app-bg app-border fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="app-bg app-border relative h-full w-72 border-r">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="app-muted absolute right-4 top-4 rounded-lg p-2 hover:bg-emerald-500/10 hover:text-emerald-500"
              aria-label="Fechar menu"
            >
              <CloseIcon />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
