import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ExerciseSelector from "../components/ExerciseSelector.jsx";
import Input from "../components/Input.jsx";
import MetaProgress from "../components/MetaProgress.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { formatDateBR } from "../utils/date.js";
import { getApiErrorMessage } from "../utils/errors.js";

const initialForm = {
  exercicio: "",
  selectedExercise: null,
  meta_carga: "",
  meta_repeticoes: "",
};

function isMetaAutomaticallyReached(meta, atual) {
  const cargaAtual = Number(atual?.carga || 0);
  const repeticoesAtuais = Number(atual?.repeticoes || 0);
  const metaCarga = Number(meta.meta_carga || 0);
  const metaRepeticoes = Number(meta.meta_repeticoes || 0);

  if (metaCarga <= 0 || cargaAtual < metaCarga) {
    return false;
  }

  return !metaRepeticoes || repeticoesAtuais >= metaRepeticoes;
}

function getMetaState(meta, atual) {
  if (meta.concluida) {
    return { label: "Concluida", tone: "success" };
  }

  if (isMetaAutomaticallyReached(meta, atual)) {
    return { label: "Atingida", tone: "success" };
  }

  return { label: "Em progresso", tone: "accent" };
}

export default function Metas() {
  const { showToast } = useToast();
  const [metas, setMetas] = useState([]);
  const [prs, setPrs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [showPrHistory, setShowPrHistory] = useState(false);

  async function load() {
    try {
      const [metasRes, prsRes] = await Promise.all([api.get("/metas"), api.get("/treinos/pr")]);
      setMetas(metasRes.data.data || []);
      setPrs(prsRes.data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel carregar as metas."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const prPorExercicio = useMemo(
    () =>
      prs.reduce((acc, pr) => {
        acc[pr.exercicio.toLowerCase()] = {
          carga: Number(pr.carga) || 0,
          repeticoes: pr.repeticoes,
        };
        return acc;
      }, {}),
    [prs],
  );

  const resumo = useMemo(() => {
    const concluidas = metas.filter((meta) => {
      const atual = prPorExercicio[meta.exercicio.toLowerCase()] || { carga: 0 };
      return meta.concluida || isMetaAutomaticallyReached(meta, atual);
    }).length;

    return {
      total: metas.length,
      concluidas,
      ativas: Math.max(metas.length - concluidas, 0),
    };
  }, [metas, prPorExercicio]);

  const metasOrdenadas = useMemo(
    () =>
      metas
        .slice()
        .sort((a, b) => {
          const atualA = prPorExercicio[a.exercicio.toLowerCase()] || { carga: 0 };
          const atualB = prPorExercicio[b.exercicio.toLowerCase()] || { carga: 0 };
          const aConcluida = a.concluida || isMetaAutomaticallyReached(a, atualA);
          const bConcluida = b.concluida || isMetaAutomaticallyReached(b, atualB);

          if (aConcluida !== bConcluida) return aConcluida ? 1 : -1;
          return a.exercicio.localeCompare(b.exercicio, "pt-BR");
        }),
    [metas, prPorExercicio],
  );

  const historicoPrs = useMemo(
    () =>
      prs
        .slice()
        .sort((a, b) => {
          const dataA = String(a.data || "");
          const dataB = String(b.data || "");

          if (dataA || dataB) return dataB.localeCompare(dataA);
          return String(a.exercicio || "").localeCompare(String(b.exercicio || ""), "pt-BR");
        }),
    [prs],
  );

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      const payload = {
        exercicio: form.exercicio,
        meta_carga: Number(form.meta_carga),
      };

      if (form.meta_repeticoes) {
        payload.meta_repeticoes = Number(form.meta_repeticoes);
      }

      await api.post("/metas", payload);
      setForm(initialForm);
      showToast({ title: "Meta criada", message: "Progresso atualizado automaticamente." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel criar a meta.");
      setError(message);
      showToast({ title: "Erro ao criar meta", message, type: "error" });
    }
  }

  async function toggleMetaConcluida(meta) {
    try {
      setError("");
      const concluida = !meta.concluida;
      await api.patch(`/metas/${meta.id}`, { concluida });
      showToast({
        title: concluida ? "Meta concluida" : "Meta reaberta",
        message: concluida
          ? "A meta foi marcada como concluida."
          : "A meta voltou para acompanhamento.",
      });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel atualizar a meta.");
      setError(message);
      showToast({ title: "Erro ao atualizar meta", message, type: "error" });
    }
  }

  async function removeMeta(meta) {
    if (!window.confirm(`Remover meta de ${meta.exercicio}?`)) return;

    try {
      setError("");
      await api.delete(`/metas/${meta.id}`);
      showToast({ title: "Meta removida" });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel remover a meta.");
      setError(message);
      showToast({ title: "Erro ao remover meta", message, type: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
            Metas
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Progresso de carga
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm">
            Defina objetivos por exercicio e acompanhe quando o PR atual alcanca a meta.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Ativas", resumo.ativas, "text-emerald-500"],
            ["Concluidas", resumo.concluidas, "text-[var(--success)]"],
            ["Total", resumo.total, "app-text"],
          ].map(([label, value, color]) => (
            <div key={label} className="app-surface app-border rounded-2xl border px-4 py-3">
              <p className="app-muted text-xs">{label}</p>
              <p className={`mt-1 text-xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="app-text text-lg font-semibold">Nova meta</h2>
              <p className="app-muted mt-1 text-sm">
                Escolha o exercicio e registre a carga que quer bater.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              PR
            </span>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <span className="app-label mb-2 block text-sm font-semibold">Exercicio</span>
              <ExerciseSelector
                value={form.exercicio}
                selectedExercise={form.selectedExercise}
                onSelect={(exercise) =>
                  setForm({
                    ...form,
                    selectedExercise: exercise,
                    exercicio: exercise.nome,
                  })
                }
              />
            </div>

            {form.exercicio && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="app-muted text-xs">Meta para</p>
                <p className="app-text mt-1 text-sm font-semibold">{form.exercicio}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Carga alvo"
                type="number"
                step="0.5"
                value={form.meta_carga}
                onChange={(event) => setForm({ ...form, meta_carga: event.target.value })}
                required
              />
              <Input
                label="Repeticoes alvo"
                type="number"
                value={form.meta_repeticoes}
                onChange={(event) => setForm({ ...form, meta_repeticoes: event.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!form.exercicio}>
              Salvar meta
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Metas cadastradas</h2>
              <p className="app-muted mt-1 text-sm">Acompanhamento manual e automatico.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPrHistory((current) => !current)}
              >
                {showPrHistory ? "Ocultar PRs" : "Historico de PRs"}
              </Button>
              <span className="badge-soft w-fit px-3 py-1 text-xs font-semibold">
                {resumo.ativas} em andamento
              </span>
            </div>
          </div>

          {showPrHistory && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="app-text text-sm font-semibold">Historico de PRs batidos</h3>
                  <p className="app-muted mt-1 text-xs">
                    Recordes calculados a partir dos treinos registrados.
                  </p>
                </div>
                <span className="badge-soft w-fit px-3 py-1 text-xs font-semibold">
                  {historicoPrs.length} PR{historicoPrs.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1 app-scroll">
                {historicoPrs.map((pr, index) => (
                  <div
                    key={`${pr.exercicio}-${index}`}
                    className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="app-text truncate text-sm font-semibold">{pr.exercicio}</p>
                      <p className="app-muted mt-1 text-xs">
                        {pr.data ? formatDateBR(pr.data) : "Data nao registrada"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--warning)]">
                        {Number(pr.carga || 0).toLocaleString("pt-BR")}kg
                      </span>
                      {pr.repeticoes && (
                        <span className="badge-soft px-3 py-1 text-xs font-semibold">
                          {pr.repeticoes} reps
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {!historicoPrs.length && (
                  <EmptyState
                    title="Sem PRs registrados"
                    description="Conclua treinos para gerar recordes automaticamente."
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3">
            {metasOrdenadas.map((meta) => {
              const atual = prPorExercicio[meta.exercicio.toLowerCase()] || { carga: 0 };
              const atingidaAutomaticamente = isMetaAutomaticallyReached(meta, atual);
              const state = getMetaState(meta, atual);

              return (
                <div
                  key={meta.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent-border)] hover:bg-emerald-500/[0.03]"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        state.tone === "success"
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {state.label}
                    </span>
                    <span className="app-muted text-xs">
                      Atual: {Number(atual.carga || 0).toFixed(1)}kg
                      {atual.repeticoes ? ` x ${atual.repeticoes}` : ""}
                    </span>
                  </div>

                  <MetaProgress meta={meta} atual={atual} />

                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-3">
                    {meta.concluida && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toggleMetaConcluida(meta)}
                      >
                        Reabrir meta
                      </Button>
                    )}
                    {!meta.concluida && !atingidaAutomaticamente && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => toggleMetaConcluida(meta)}
                      >
                        Marcar concluida
                      </Button>
                    )}
                    {!meta.concluida && atingidaAutomaticamente && (
                      <span className="app-muted rounded-lg px-3 py-2 text-xs font-semibold">
                        Atingida automaticamente
                      </span>
                    )}
                    <Button type="button" variant="ghost" onClick={() => removeMeta(meta)}>
                      Remover
                    </Button>
                  </div>
                </div>
              );
            })}

            {!metas.length && (
              <EmptyState title="Sem metas" description="Crie uma meta para acompanhar progresso." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
