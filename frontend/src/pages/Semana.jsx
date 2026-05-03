import { useEffect, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ExerciseSelector from "../components/ExerciseSelector.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/errors.js";

const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const emptyExercise = {
  exercicio: "",
  grupo: "",
  categoria: "",
  selectedExercise: null,
  series: "",
  repeticoes: "",
  carga_alvo: "",
};

export default function Semana() {
  const { showToast } = useToast();
  const [planejamento, setPlanejamento] = useState([]);
  const [form, setForm] = useState({
    dia_semana: "Segunda",
    nome_treino: "",
    exercicios: [{ ...emptyExercise }],
  });
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/semana");
      setPlanejamento(data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar a semana."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateExercise(index, field, value) {
    setForm((current) => ({
      ...current,
      exercicios: current.exercicios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addExercise() {
    setForm((current) => ({
      ...current,
      exercicios: [...current.exercicios, { ...emptyExercise }],
    }));
  }

  function removeExercise(index) {
    setForm((current) => ({
      ...current,
      exercicios:
        current.exercicios.length === 1
          ? current.exercicios
          : current.exercicios.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.post("/semana", {
        dia_semana: form.dia_semana,
        nome_treino: form.nome_treino,
        exercicios: form.exercicios.map((item) => ({
          exercicio: item.exercicio,
          grupo: item.grupo || null,
          categoria: item.categoria || null,
          series: Number(item.series),
          repeticoes: Number(item.repeticoes),
          carga_alvo: item.carga_alvo ? Number(item.carga_alvo) : null,
        })),
      });

      setForm({ dia_semana: "Segunda", nome_treino: "", exercicios: [{ ...emptyExercise }] });
      showToast({ title: "Treino semanal salvo", message: "Planejamento atualizado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível salvar o treino semanal.");
      setError(message);
      showToast({ title: "Erro ao salvar semana", message, type: "error" });
    }
  }

  async function removePlanejado(item) {
    if (!window.confirm(`Remover treino de ${item.dia_semana}?`)) return;

    try {
      setError("");
      await api.delete(`/semana/${item.id}`);
      showToast({ title: "Treino removido da semana" });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível remover o treino semanal.");
      setError(message);
      showToast({ title: "Erro ao remover treino", message, type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-500">Semana</p>
        <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">
          Planejamento semanal
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Definir treino</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Select
              label="Dia"
              options={dias}
              value={form.dia_semana}
              onChange={(dia_semana) => setForm({ ...form, dia_semana })}
            />
            <Input
              label="Nome do treino"
              placeholder="Ex: Push, Pernas, Full body"
              value={form.nome_treino}
              onChange={(event) => setForm({ ...form, nome_treino: event.target.value })}
              required
            />

            <div className="space-y-3">
              {form.exercicios.map((item, index) => (
                <div key={index} className="app-surface-muted app-border min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="app-text text-sm font-semibold">Exercício {index + 1}</p>
                    <Button type="button" variant="ghost" onClick={() => removeExercise(index)}>
                      Remover
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="min-w-0">
                      <span className="app-label mb-2 block text-sm font-semibold">
                        Exercício
                      </span>
                      <ExerciseSelector
                        value={item.exercicio}
                        selectedExercise={item.selectedExercise}
                        onSelect={(exercise) => {
                          updateExercise(index, "selectedExercise", exercise);
                          updateExercise(index, "exercicio", exercise.nome);
                          updateExercise(index, "grupo", exercise.grupo);
                          updateExercise(index, "categoria", exercise.categoria);
                        }}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        label="Séries"
                        type="number"
                        value={item.series}
                        onChange={(event) => updateExercise(index, "series", event.target.value)}
                        required
                      />
                      <Input
                        label="Repetições"
                        type="number"
                        value={item.repeticoes}
                        onChange={(event) =>
                          updateExercise(index, "repeticoes", event.target.value)
                        }
                        required
                      />
                      <Input
                        label="Carga alvo"
                        type="number"
                        value={item.carga_alvo}
                        onChange={(event) =>
                          updateExercise(index, "carga_alvo", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={addExercise}>
                Adicionar exercício
              </Button>
              <Button type="submit">Salvar semana</Button>
            </div>
          </form>
        </Card>

        <Card className="xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
          <h2 className="app-text text-lg font-semibold">Treinos definidos</h2>
          <div className="mt-4 grid gap-3">
            {planejamento.map((item) => (
              <div key={item.id} className="app-surface-muted app-border rounded-xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-500">{item.dia_semana}</p>
                    <p className="app-text mt-1 font-semibold">{item.nome_treino}</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removePlanejado(item)}>
                    Remover
                  </Button>
                </div>
                <div className="app-border mt-4 divide-y">
                  {(item.exercicios || []).map((exercicio, index) => (
                    <div key={`${exercicio.exercicio}-${index}`} className="py-3">
                      <p className="app-text font-medium">{exercicio.exercicio}</p>
                      {(exercicio.grupo || exercicio.categoria) && (
                        <p className="app-muted mt-1 text-xs">
                          {[exercicio.grupo, exercicio.categoria].filter(Boolean).join(" - ")}
                        </p>
                      )}
                      <p className="app-muted mt-1 text-sm">
                        {exercicio.series}x{exercicio.repeticoes}
                        {exercicio.carga_alvo ? ` - alvo ${exercicio.carga_alvo}kg` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!planejamento.length && (
              <EmptyState
                title="Semana vazia"
                description="Defina seus treinos para organizar melhor a rotina."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
