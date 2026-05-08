import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ExerciseSelector from "../components/ExerciseSelector.jsx";
import Input from "../components/Input.jsx";
import MetaProgress from "../components/MetaProgress.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
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

export default function Metas() {
  const { showToast } = useToast();
  const [metas, setMetas] = useState([]);
  const [prs, setPrs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

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
            ["Ativas", resumo.ativas],
            ["Concluidas", resumo.concluidas],
            ["Total", resumo.total],
          ].map(([label, value]) => (
            <div key={label} className="app-surface app-border rounded-2xl border px-4 py-3">
              <p className="app-muted text-xs">{label}</p>
              <p className="app-text mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Nova meta</h2>
          <p className="app-muted mt-1 text-sm">
            Escolha o exercicio e registre a carga que quer bater.
          </p>

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

        <Card className="xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto app-scroll">
          <div>
            <h2 className="app-text text-lg font-semibold">Metas cadastradas</h2>
            <p className="app-muted mt-1 text-sm">Acompanhamento manual e automatico.</p>
          </div>

          <div className="mt-4 grid gap-3">
            {metas.map((meta) => {
              const atual = prPorExercicio[meta.exercicio.toLowerCase()] || { carga: 0 };
              const atingidaAutomaticamente = isMetaAutomaticallyReached(meta, atual);

              return (
                <div key={meta.id} className="app-surface-muted app-border rounded-2xl border p-3">
                  <MetaProgress meta={meta} atual={atual} />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
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
