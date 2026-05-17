import { useEffect, useMemo, useState } from "react";

import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import CreateExerciseModal, { MUSCLE_GROUPS } from "./CreateExerciseModal.jsx";
import ExerciseItem from "./ExerciseItem.jsx";

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getApiErrorMessage(err, fallback) {
  return err.response?.data?.detail || err.message || fallback;
}

export default function ExerciseSelector({ value, selectedExercise, onSelect, onClear }) {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState(value || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function loadFavorites() {
    try {
      const { data } = await api.get("/exercicios/favoritos");
      setFavorites(data.data || []);
    } catch (err) {
      setFavorites([]);
      showToast({
        title: "Favoritos indisponíveis",
        message: getApiErrorMessage(
          err,
          "Os exercícios foram carregados, mas os favoritos não.",
        ),
        type: "error",
      });
    }
  }

  async function load() {
    try {
      setError("");
      setLoading(true);

      const { data } = await api.get("/exercicios");
      setExercises(data.data || []);

      await loadFavorites();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível carregar os exercícios.");
      setError(message);
      showToast({
        title: "Erro ao carregar exercícios",
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const favoriteByExerciseId = useMemo(
    () =>
      favorites.reduce((acc, favorite) => {
        acc[favorite.exercicio_id] = favorite;
        return acc;
      }, {}),
    [favorites],
  );

  const filtered = useMemo(() => {
    const text = normalizeText(query.trim());

    return exercises
      .filter((exercise) => (!group ? true : normalizeText(exercise.grupo) === normalizeText(group)))
      .filter((exercise) => (!text ? true : normalizeText(exercise.nome).includes(text)))
      .sort((a, b) => {
        const aFav = favoriteByExerciseId[a.id] ? 1 : 0;
        const bFav = favoriteByExerciseId[b.id] ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [exercises, favoriteByExerciseId, group, query]);

  async function toggleFavorite(exercise) {
    const favorite = favoriteByExerciseId[exercise.id];

    try {
      if (favorite) {
        await api.delete(`/exercicios/favoritos/${favorite.id}`);
        showToast({ title: "Favorito removido" });
      } else {
        await api.post("/exercicios/favoritos", { exercicio_id: exercise.id });
        showToast({ title: "Exercício favoritado" });
      }

      await loadFavorites();
    } catch (err) {
      showToast({
        title: "Erro ao atualizar favorito",
        message: getApiErrorMessage(err, "Não foi possível salvar a alteração."),
        type: "error",
      });
    }
  }

  async function createExercise(payload) {
    try {
      const { data } = await api.post("/exercicios", payload);
      const created = data.data?.[0];
      showToast({ title: "Exercício criado", message: created?.nome });
      setModalOpen(false);
      await load();

      if (created) {
        setQuery(created.nome);
        onSelect(created);
      }
    } catch (err) {
      showToast({
        title: "Erro ao criar exercício",
        message: getApiErrorMessage(err, "Confira os dados e tente novamente."),
        type: "error",
      });
    }
  }

  function handleSelect(exercise) {
    setQuery(exercise.nome);
    onSelect(exercise);
  }

  function handleGroupChange(muscleGroup) {
    setGroup(muscleGroup);
    setExpanded(false);

    if (!muscleGroup) {
      setQuery(value || "");
      return;
    }

    setQuery("");

    if (
      selectedExercise &&
      normalizeText(selectedExercise.grupo) !== normalizeText(muscleGroup)
    ) {
      onClear?.();
    }
  }

  const canCreate = query.trim().length > 1 && filtered.length === 0;
  const groupOptions = ["", ...MUSCLE_GROUPS];
  const visibleExercises = expanded ? filtered : filtered.slice(0, 4);
  const canExpand = filtered.length > visibleExercises.length;

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="app-control flex w-full min-w-0 items-center gap-3 px-3 py-2.5">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="app-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="app-text min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
          placeholder="Buscar exercício"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="app-scroll flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto pb-1">
        {groupOptions.map((muscleGroup) => {
          const active = group === muscleGroup;
          const label = muscleGroup || "Todos";

          return (
            <button
              key={label}
              type="button"
              className={`shrink-0 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-[var(--accent)] bg-emerald-500/10 text-emerald-500"
                  : "app-border app-muted hover:border-emerald-500/40 hover:text-emerald-500"
              }`}
              onClick={() => handleGroupChange(muscleGroup)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={`app-scroll w-full min-w-0 max-w-full space-y-1.5 overflow-y-auto rounded-2xl ${expanded ? "max-h-72" : "max-h-64"}`}>
        {loading && <p className="app-muted px-3 py-2 text-sm">Carregando exercícios...</p>}
        {!loading && error && (
          <div className="app-surface-muted app-border space-y-3 rounded-xl border p-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
              onClick={load}
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!loading &&
          !error &&
          visibleExercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              active={selectedExercise?.id === exercise.id || exercise.nome === value}
              favorite={Boolean(favoriteByExerciseId[exercise.id])}
              onSelect={handleSelect}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        {!loading && !error && canExpand && (
          <button
            type="button"
            className="app-muted w-full rounded-xl px-3 py-2 text-center text-xs font-semibold transition hover:bg-emerald-500/10 hover:text-emerald-500"
            onClick={() => setExpanded(true)}
          >
            Ver mais {filtered.length - visibleExercises.length} exercícios
          </button>
        )}
        {!loading && !error && expanded && filtered.length > 4 && (
          <button
            type="button"
            className="app-muted w-full rounded-xl px-3 py-2 text-center text-xs font-semibold transition hover:bg-emerald-500/10 hover:text-emerald-500"
            onClick={() => setExpanded(false)}
          >
            Mostrar menos
          </button>
        )}
        {!loading && !error && canCreate && (
          <button
            type="button"
            className="app-surface-muted app-border w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500/10"
            onClick={() => setModalOpen(true)}
          >
            Criar exercício: {query.trim()}
          </button>
        )}
        {!loading && !error && !filtered.length && !canCreate && (
          <p className="app-surface-muted app-border rounded-xl border p-4 text-sm app-muted">
            Nenhum exercício encontrado.
          </p>
        )}
      </div>

      {modalOpen && (
        <CreateExerciseModal
          initialName={query.trim()}
          initialGroup={group}
          onClose={() => setModalOpen(false)}
          onCreate={createExercise}
        />
      )}
    </div>
  );
}
