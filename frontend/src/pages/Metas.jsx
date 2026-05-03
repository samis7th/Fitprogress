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
      setError(getApiErrorMessage(err, "Não foi possível carregar as metas."));
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
      const message = getApiErrorMessage(err, "Não foi possível criar a meta.");
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
        title: concluida ? "Meta concluída" : "Meta reaberta",
        message: concluida
          ? "A meta foi marcada como concluída."
          : "A meta voltou para acompanhamento.",
      });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível atualizar a meta.");
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
      const message = getApiErrorMessage(err, "Não foi possível remover a meta.");
      setError(message);
      showToast({ title: "Erro ao remover meta", message, type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-500">Metas</p>
        <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">
          Progresso de carga
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Nova meta</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <span className="app-label mb-2 block text-sm font-semibold">Exercício</span>
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
                label="Repetições alvo"
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

        <Card className="xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
          <h2 className="app-text text-lg font-semibold">Metas ativas</h2>
          <div className="mt-4 space-y-3">
            {metas.map((meta) => {
              const atual = prPorExercicio[meta.exercicio.toLowerCase()] || { carga: 0 };
              const atingidaAutomaticamente = isMetaAutomaticallyReached(meta, atual);

              return (
                <div key={meta.id} className="space-y-2">
                  <MetaProgress meta={meta} atual={atual} />
                  <div className="flex flex-wrap justify-end gap-2">
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
                        Marcar como concluída
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
