const badgeStyles = {
  halter: "bg-sky-500/10 text-sky-400",
  "máquina": "bg-violet-500/10 text-violet-400",
  maquina: "bg-violet-500/10 text-violet-400",
  "peso corporal": "bg-emerald-500/10 text-emerald-500",
};

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z" />
    </svg>
  );
}

export default function ExerciseItem({
  exercise,
  active,
  favorite,
  onSelect,
  onToggleFavorite,
}) {
  return (
    <div
      className={`app-surface-muted app-border flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 ${
        active ? "border-[var(--accent)] bg-emerald-500/10" : ""
      }`}
    >
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(exercise)}>
        <p className="app-text truncate text-sm font-semibold">{exercise.nome}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="app-muted text-xs">{exercise.grupo}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              badgeStyles[exercise.categoria] || "bg-gray-500/10 text-gray-500"
            }`}
          >
            {exercise.categoria}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(exercise)}
        className={`grid h-8 w-8 place-items-center rounded-full transition hover:bg-emerald-500/10 ${
          favorite ? "text-yellow-400" : "app-muted"
        }`}
        aria-label={favorite ? "Remover favorito" : "Favoritar exercício"}
      >
        <StarIcon filled={favorite} />
      </button>
    </div>
  );
}
