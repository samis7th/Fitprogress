import { useEffect, useMemo, useRef, useState } from "react";

import { formatDateBR, getLocalDateString } from "../utils/date.js";

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
function parseDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function sameDay(a, b) {
  return getLocalDateString(a) === getLocalDateString(b);
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

export default function DatePicker({ label, value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const containerRef = useRef(null);
  const today = new Date();
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  useEffect(() => {
    function handleClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [value]);

  function changeMonth(offset) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(date) {
    onChange(getLocalDateString(date));
    setOpen(false);
  }

  function selectToday() {
    onChange(getLocalDateString(today));
    setViewDate(today);
    setOpen(false);
  }

  return (
    <label className={`relative block ${className}`} ref={containerRef}>
      {label && <span className="app-label mb-1.5 block text-sm font-semibold">{label}</span>}
      <button
        type="button"
        className={`app-control flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left ${
          open ? "border-[var(--accent)] ring-4 ring-[var(--accent-soft)]" : ""
        }`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedDate ? "app-text text-sm font-medium" : "app-muted text-sm"}>
          {selectedDate ? formatDateBR(selectedDate) : "Selecionar data"}
        </span>
        <span className="app-muted">
          <CalendarIcon />
        </span>
      </button>

      {open && (
        <div className="app-surface app-border absolute z-[80] mt-2 w-72 rounded-2xl border p-3 shadow-2xl shadow-black/25">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="app-muted rounded-lg p-2 transition hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
            >
              <ArrowLeftIcon />
            </button>
            <p className="app-text text-sm font-bold capitalize">{monthFormatter.format(viewDate)}</p>
            <button
              type="button"
              className="app-muted rounded-lg p-2 transition hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
            >
              <ArrowRightIcon />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day, index) => (
              <span key={`${day}-${index}`} className="app-muted py-1 text-xs font-bold">
                {day}
              </span>
            ))}
            {days.map((date) => {
              const dateValue = getLocalDateString(date);
              const selected = selectedDate && sameDay(date, selectedDate);
              const currentMonth = date.getMonth() === viewDate.getMonth();
              const isToday = sameDay(date, today);

              return (
                <button
                  key={dateValue}
                  type="button"
                  className={`grid h-8 place-items-center rounded-lg text-sm font-semibold transition ${
                    selected
                      ? "bg-emerald-500 text-gray-950"
                      : currentMonth
                        ? "app-text hover:bg-emerald-500/10 hover:text-emerald-500"
                        : "app-muted opacity-45 hover:bg-emerald-500/10 hover:opacity-100"
                  } ${isToday && !selected ? "ring-1 ring-[var(--accent-border)]" : ""}`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
            <button
              type="button"
              className="app-muted rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={() => onChange("")}
            >
              Limpar
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-gray-950 transition hover:bg-emerald-400"
              onClick={selectToday}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </label>
  );
}
