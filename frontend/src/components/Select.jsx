import { useEffect, useRef, useState } from "react";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function normalizeOption(option) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return option;
}

export default function Select({ label, options, value, onChange, placeholder = "Selecione" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const normalizedOptions = options.map(normalizeOption);
  const selected = normalizedOptions.find((option) => option.value === value);

  useEffect(() => {
    function handleClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <label className="relative block" ref={containerRef}>
      {label && <span className="app-label mb-1.5 block text-xs font-semibold">{label}</span>}
      <button
        type="button"
        className={`app-control flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left ${
          open ? "border-[var(--accent)] ring-4 ring-[var(--accent-soft)]" : ""
        }`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "app-text truncate" : "app-muted truncate"}>
          {selected?.label || placeholder}
        </span>
        <span className={`app-muted transition ${open ? "rotate-180" : ""}`}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="app-surface-raised app-scroll absolute z-[70] mt-2 max-h-56 w-full overflow-y-auto rounded-xl border p-1.5">
          {normalizedOptions.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "app-text hover:bg-emerald-500/10 hover:text-emerald-500"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate font-medium">{option.label}</span>
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </label>
  );
}
