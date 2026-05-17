import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ExerciseSelector from "../components/ExerciseSelector.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getApiErrorMessage } from "../utils/errors.js";

const dias = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"];
const templates = [
  { nome: "Push", grupos: "Peito, Ombro, Triceps" },
  { nome: "Pull", grupos: "Costas, Biceps" },
  { nome: "Legs", grupos: "Perna, Posterior, Gluteo" },
  { nome: "Upper", grupos: "Peito, Costas, Ombro" },
  { nome: "Lower", grupos: "Quadriceps, Posterior, Gluteo" },
  { nome: "Full body", grupos: "Corpo todo" },
];
const emptyExercise = {
  exercicio: "",
  grupo: "",
  categoria: "",
  selectedExercise: null,
  series: "",
  repeticoes: "",
  carga_alvo: "",
};
const MAX_SERIES_PER_EXERCISE = 10;

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mapPlanToForm(plan, dia) {
  if (!plan) {
    return {
      dia_semana: dia,
      nome_treino: "",
      exercicios: [{ ...emptyExercise }],
    };
  }

  return {
    dia_semana: plan.dia_semana || dia,
    nome_treino: plan.nome_treino || "",
    exercicios: (plan.exercicios?.length ? plan.exercicios : [{ ...emptyExercise }]).map((item) => ({
      exercicio: item.exercicio || "",
      grupo: item.grupo || "",
      categoria: item.categoria || "",
      selectedExercise: item.exercicio
        ? {
            nome: item.exercicio,
            grupo: item.grupo || "",
            categoria: item.categoria || "",
          }
        : null,
      series: item.series || "",
      repeticoes: item.repeticoes || "",
      carga_alvo: item.carga_alvo || "",
    })),
  };
}

function getDominantGroup(exercicios = []) {
  const groups = exercicios.reduce((acc, item) => {
    if (!item.grupo) return acc;
    acc[item.grupo] = (acc[item.grupo] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(groups).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function buildExercisesPayload(exercicios) {
  return exercicios.map((item, index) => {
    const series = Number(item.series);
    const repeticoes = Number(item.repeticoes);

    if (!item.exercicio) {
      throw new Error(`Selecione o exercicio ${index + 1}.`);
    }

    if (!Number.isInteger(series) || series < 1 || series > MAX_SERIES_PER_EXERCISE) {
      throw new Error(`O exercicio ${index + 1} deve ter entre 1 e ${MAX_SERIES_PER_EXERCISE} series.`);
    }

    if (!Number.isInteger(repeticoes) || repeticoes < 1) {
      throw new Error(`Informe repeticoes validas para o exercicio ${index + 1}.`);
    }

    return {
      exercicio: item.exercicio,
      grupo: item.grupo || null,
      categoria: item.categoria || null,
      series,
      repeticoes,
      carga_alvo: item.carga_alvo ? Number(item.carga_alvo) : null,
    };
  });
}

function isEmptyWeeklyForm(form) {
  const firstExercise = form.exercicios[0] || {};

  return (
    !form.nome_treino &&
    form.exercicios.length === 1 &&
    !firstExercise.exercicio &&
    !firstExercise.series &&
    !firstExercise.repeticoes &&
    !firstExercise.carga_alvo
  );
}

function DragHandle({ onDragStart, onDragEnd }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="app-muted grid h-8 w-8 shrink-0 cursor-grab place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent-border)] hover:text-emerald-500 active:cursor-grabbing"
      title="Arrastar exercicio"
      aria-label="Arrastar exercicio"
    >
      <span className="grid grid-cols-2 gap-0.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-current" />
        ))}
      </span>
    </button>
  );
}

export default function Semana() {
  const location = useLocation();
  const { showToast } = useToast();
  const navigationDayApplied = useRef("");
  const [planejamento, setPlanejamento] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState({ 0: true });
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [exercisePickerIndex, setExercisePickerIndex] = useState(null);
  const [duplicateTargetDay, setDuplicateTargetDay] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
      setError(getApiErrorMessage(err, "Nao foi possivel carregar a semana."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const treinoPorDia = useMemo(
    () =>
      planejamento.reduce((acc, item) => {
        acc[normalizeText(item.dia_semana)] = item;
        return acc;
      }, {}),
    [planejamento],
  );

  const totalExercicios = useMemo(
    () => planejamento.reduce((total, item) => total + (item.exercicios?.length || 0), 0),
    [planejamento],
  );

  const selectedPlan = treinoPorDia[normalizeText(form.dia_semana)];

  useEffect(() => {
    const diaSemana = location.state?.diaSemana;
    if (!diaSemana || navigationDayApplied.current === location.key) return;
    if (!dias.some((dia) => normalizeText(dia) === normalizeText(diaSemana))) return;

    navigationDayApplied.current = location.key;
    selectDay(diaSemana);
  }, [location.key, location.state?.diaSemana]);

  useEffect(() => {
    if (hasUnsavedChanges || !isEmptyWeeklyForm(form) || !selectedPlan) return;

    const nextForm = mapPlanToForm(selectedPlan, form.dia_semana);
    setForm(nextForm);
    setExpandedExercises(
      nextForm.exercicios.reduce((acc, _, index) => ({ ...acc, [index]: false }), {}),
    );
  }, [form, hasUnsavedChanges, selectedPlan]);

  function selectDay(dia) {
    if (
      hasUnsavedChanges &&
      !window.confirm("Existem alteracoes nao salvas. Trocar de dia mesmo assim?")
    ) {
      return;
    }

    const plan = treinoPorDia[normalizeText(dia)];
    const nextForm = mapPlanToForm(plan, dia);
    setForm(nextForm);
    setExpandedExercises(
      plan
        ? nextForm.exercicios.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
        : { 0: true },
    );
    setHasUnsavedChanges(false);
    setDuplicateTargetDay("");
  }

  function updateExercise(index, field, value) {
    setForm((current) => ({
      ...current,
      exercicios: current.exercicios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setHasUnsavedChanges(true);
  }

  function addExercise() {
    setForm((current) => ({
      ...current,
      exercicios: [...current.exercicios, { ...emptyExercise }],
    }));
    setExpandedExercises((current) => ({ ...current, [form.exercicios.length]: true }));
    setHasUnsavedChanges(true);
  }

  function removeExercise(index) {
    setForm((current) => ({
      ...current,
      exercicios:
        current.exercicios.length === 1
          ? [{ ...emptyExercise }]
          : current.exercicios.filter((_, itemIndex) => itemIndex !== index),
    }));
    setExpandedExercises((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        const itemIndex = Number(key);
        if (itemIndex < index) next[itemIndex] = value;
        if (itemIndex > index) next[itemIndex - 1] = value;
      });
      return Object.keys(next).length ? next : { 0: true };
    });
    setHasUnsavedChanges(true);
  }

  function clearDayExercises() {
    if (!form.exercicios.some((item) => item.exercicio || item.series || item.repeticoes || item.carga_alvo)) {
      return;
    }

    if (!window.confirm(`Limpar todos os exercicios de ${form.dia_semana}?`)) {
      return;
    }

    setForm((current) => ({
      ...current,
      exercicios: [{ ...emptyExercise }],
    }));
    setExpandedExercises({ 0: true });
    setDraggingIndex(null);
    setDragOverIndex(null);
    setExercisePickerIndex(null);
    setHasUnsavedChanges(true);
  }

  function reorderExercise(fromIndex, toIndex) {
    if (
      fromIndex === null ||
      toIndex === null ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= form.exercicios.length ||
      toIndex >= form.exercicios.length
    ) {
      return;
    }

    setForm((current) => {
      const exercicios = [...current.exercicios];
      const [item] = exercicios.splice(fromIndex, 1);
      exercicios.splice(toIndex, 0, item);
      return { ...current, exercicios };
    });

    setExpandedExercises((current) => {
      const ordered = form.exercicios.map((_, index) => Boolean(current[index]));
      const [item] = ordered.splice(fromIndex, 1);
      ordered.splice(toIndex, 0, item);
      return ordered.reduce((acc, value, index) => ({ ...acc, [index]: value }), {});
    });
    setHasUnsavedChanges(true);
  }

  function setExerciseExpanded(index, expanded) {
    setExpandedExercises((current) => ({ ...current, [index]: expanded }));
  }

  function startDrag(event, index) {
    setDraggingIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function overDrag(event, index) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function dropExercise(event, index) {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    reorderExercise(Number.isNaN(fromIndex) ? draggingIndex : fromIndex, index);
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function endDrag() {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function applyTemplate(template) {
    setForm((current) => ({
      ...current,
      nome_treino: template.nome,
      exercicios: current.exercicios.length ? current.exercicios : [{ ...emptyExercise }],
    }));
    setHasUnsavedChanges(true);
  }

  function handleExerciseSelect(index, exercise) {
    updateExercise(index, "selectedExercise", exercise);
    updateExercise(index, "exercicio", exercise.nome);
    updateExercise(index, "grupo", exercise.grupo);
    updateExercise(index, "categoria", exercise.categoria);
    setExercisePickerIndex(null);
  }

  async function duplicateCurrentPlan() {
    if (!duplicateTargetDay) {
      setError("Escolha um dia para duplicar o treino.");
      return;
    }

    if (normalizeText(duplicateTargetDay) === normalizeText(form.dia_semana)) {
      setError("Escolha um dia diferente do treino atual.");
      return;
    }

    try {
      setError("");
      const exercicios = buildExercisesPayload(form.exercicios);
      await api.post("/semana", {
        dia_semana: duplicateTargetDay,
        nome_treino: form.nome_treino,
        exercicios,
      });

      showToast({
        title: "Treino duplicado",
        message: `${form.nome_treino} foi copiado para ${duplicateTargetDay}.`,
      });
      setDuplicateTargetDay("");
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel duplicar o treino.");
      setError(message);
      showToast({ title: "Erro ao duplicar treino", message, type: "error" });
    }
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      const exercicios = buildExercisesPayload(form.exercicios);
      await api.post("/semana", {
        dia_semana: form.dia_semana,
        nome_treino: form.nome_treino,
        exercicios,
      });

      setExpandedExercises(
        form.exercicios.reduce((acc, _, index) => ({ ...acc, [index]: false }), {}),
      );
      setHasUnsavedChanges(false);
      showToast({ title: "Treino semanal salvo", message: "Planejamento atualizado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel salvar o treino semanal.");
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
      const message = getApiErrorMessage(err, "Nao foi possivel remover o treino semanal.");
      setError(message);
      showToast({ title: "Erro ao remover treino", message, type: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
            Semana
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Planejamento semanal
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm">
            Monte a rotina da semana. Salvar um dia novamente substitui o treino anterior desse dia.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="app-surface app-border rounded-2xl border px-4 py-3">
            <p className="app-muted text-xs">Dias definidos</p>
            <p className="app-text mt-1 text-xl font-semibold">{planejamento.length}/7</p>
          </div>
          <div className="app-surface app-border rounded-2xl border px-4 py-3">
            <p className="app-muted text-xs">Exercicios</p>
            <p className="app-text mt-1 text-xl font-semibold">{totalExercicios}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {dias.map((dia) => {
            const plan = treinoPorDia[normalizeText(dia)];
            const preenchido = Boolean(plan);
            const ativo = normalizeText(form.dia_semana) === normalizeText(dia);
            const dominantGroup = getDominantGroup(plan?.exercicios);

            return (
              <button
                key={dia}
                type="button"
                onClick={() => selectDay(dia)}
                className={`app-border rounded-2xl border px-3 py-3 text-left transition ${
                  ativo
                    ? "bg-emerald-500 text-[var(--accent-contrast)]"
                    : "app-surface-muted app-text hover:border-emerald-500/40"
                }`}
              >
                <span className="block text-sm font-semibold">{dia}</span>
                {plan?.nome_treino && (
                  <span className="mt-1 block truncate text-xs font-semibold opacity-90">
                    {plan.nome_treino}
                  </span>
                )}
                <span
                  className={`mt-1 block text-xs ${
                    ativo ? "opacity-80" : preenchido ? "text-emerald-500" : "app-muted"
                  }`}
                >
                  {preenchido
                    ? `${plan.exercicios?.length || 0} ex.${dominantGroup ? ` - ${dominantGroup}` : ""}`
                    : "Livre"}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Definir treino</h2>
              <p className="app-muted mt-1 text-sm">
                {selectedPlan ? "Editando treino definido" : "Criando rotina do dia"} - {form.dia_semana}
              </p>
            </div>
            <span className="badge-soft w-fit px-3 py-1 text-xs font-semibold">
              {form.exercicios.length} exercicio{form.exercicios.length === 1 ? "" : "s"}
            </span>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="app-muted text-xs">
                Gerencie os exercicios deste dia antes de salvar o planejamento.
              </p>
              <Button type="button" variant="ghost" onClick={clearDayExercises}>
                Limpar exercicios
              </Button>
            </div>

            <div>
              <p className="app-label mb-2 text-xs font-semibold">Templates rapidos</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <button
                    key={template.nome}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="app-border app-muted rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500"
                    title={template.grupos}
                  >
                    {template.nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Input
                label="Nome do treino"
                placeholder="Ex: Push, Pernas, Full body"
                value={form.nome_treino}
                onChange={(event) => {
                  setForm({ ...form, nome_treino: event.target.value });
                  setHasUnsavedChanges(true);
                }}
                required
              />
            </div>

            <div className="space-y-3">
              {form.exercicios.map((item, index) => {
                const expanded = expandedExercises[index] || !item.exercicio;

                if (!expanded && item.exercicio) {
                  return (
                    <div
                      key={index}
                      onDragOver={(event) => overDrag(event, index)}
                      onDrop={(event) => dropExercise(event, index)}
                      className={`app-surface-muted app-border rounded-2xl border p-3 transition ${
                        dragOverIndex === index ? "border-emerald-500/40 bg-emerald-500/10" : ""
                      } ${draggingIndex === index ? "opacity-50" : ""}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <DragHandle
                              onDragStart={(event) => startDrag(event, index)}
                              onDragEnd={endDrag}
                            />
                            <span className="app-muted text-xs font-semibold">{index + 1}</span>
                            <p className="app-text truncate text-sm font-semibold">{item.exercicio}</p>
                          </div>
                          <p className="app-muted mt-1 text-xs">
                            {[item.grupo, item.categoria].filter(Boolean).join(" - ") || "Exercicio"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge-soft px-3 py-1 text-xs font-semibold">
                            {item.series || "-"}x{item.repeticoes || "-"}
                            {item.carga_alvo ? ` - ${item.carga_alvo}kg` : ""}
                          </span>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setExerciseExpanded(index, true)}
                          >
                            Editar
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => removeExercise(index)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    onDragOver={(event) => overDrag(event, index)}
                    onDrop={(event) => dropExercise(event, index)}
                    className={`app-surface-muted app-border min-w-0 overflow-hidden rounded-2xl border p-3 transition sm:p-4 ${
                      dragOverIndex === index ? "border-emerald-500/40 bg-emerald-500/10" : ""
                    } ${draggingIndex === index ? "opacity-50" : ""}`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <DragHandle
                          onDragStart={(event) => startDrag(event, index)}
                          onDragEnd={endDrag}
                        />
                        <span className="app-muted text-xs font-semibold">{index + 1}</span>
                        <p className="app-text text-sm font-semibold">Exercicio {index + 1}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.exercicio && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setExerciseExpanded(index, false)}
                          >
                            Fechar
                          </Button>
                        )}
                        <Button type="button" variant="ghost" onClick={() => removeExercise(index)}>
                          Remover
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="min-w-0">
                        <span className="app-label mb-2 block text-sm font-semibold">
                          Exercicio
                        </span>
                        {item.exercicio ? (
                          <button
                            type="button"
                            onClick={() => setExercisePickerIndex(index)}
                            className="app-control flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
                          >
                            <span>
                              <span className="app-text block text-sm font-semibold">
                                {item.exercicio}
                              </span>
                              <span className="app-muted mt-1 block text-xs">
                                {[item.grupo, item.categoria].filter(Boolean).join(" - ") ||
                                  "Selecionado"}
                              </span>
                            </span>
                            <span className="text-xs font-semibold text-emerald-500">Trocar</span>
                          </button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={() => setExercisePickerIndex(index)}
                          >
                            Selecionar exercicio
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          label="Series"
                          type="number"
                          min="1"
                          max={MAX_SERIES_PER_EXERCISE}
                          step="1"
                          value={item.series}
                          onChange={(event) => updateExercise(index, "series", event.target.value)}
                          required
                        />
                        <Input
                          label="Repeticoes"
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
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={addExercise}>
                Adicionar exercicio
              </Button>
              <Button type="submit">{selectedPlan ? "Atualizar treino" : "Salvar semana"}</Button>
            </div>

            {form.nome_treino && form.exercicios.some((item) => item.exercicio) && (
              <div className="app-surface-muted app-border grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Select
                  label="Duplicar treino para"
                  placeholder="Escolha um dia"
                  options={dias
                    .filter((dia) => normalizeText(dia) !== normalizeText(form.dia_semana))
                    .map((dia) => ({ value: dia, label: dia }))}
                  value={duplicateTargetDay}
                  onChange={setDuplicateTargetDay}
                />
                <Button type="button" variant="secondary" onClick={duplicateCurrentPlan}>
                  Duplicar
                </Button>
              </div>
            )}

            {hasUnsavedChanges && (
              <p className="text-xs font-medium text-[var(--warning)]">
                Alteracoes nao salvas neste treino.
              </p>
            )}
          </form>
        </Card>

        <Card className="xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto app-scroll">
          <h2 className="app-text text-lg font-semibold">Treinos definidos</h2>
          <div className="mt-4 grid gap-3">
            {planejamento.map((item) => (
              <div key={item.id} className="app-surface-muted app-border rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
                      {item.dia_semana}
                    </p>
                    <p className="app-text mt-1 font-semibold">{item.nome_treino}</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removePlanejado(item)}>
                    Remover
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {(item.exercicios || []).map((exercicio, index) => (
                    <div key={`${exercicio.exercicio}-${index}`} className="app-border border-t pt-3">
                      <p className="app-text text-sm font-semibold">{exercicio.exercicio}</p>
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

      {exercisePickerIndex !== null && (
        <div className="fixed inset-0 z-[80] flex items-start justify-end bg-black/70 p-3 sm:p-6">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setExercisePickerIndex(null)}
            aria-label="Fechar seletor"
          />
          <div className="app-surface-raised app-scroll relative max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-3xl border p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
                  Exercicio {exercisePickerIndex + 1}
                </p>
                <h2 className="app-text mt-1 text-xl font-semibold">Selecionar exercicio</h2>
                <p className="app-muted mt-1 text-sm">
                  Busque por nome, grupo muscular ou favoritos.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setExercisePickerIndex(null)}>
                Fechar
              </Button>
            </div>

            <ExerciseSelector
              value={form.exercicios[exercisePickerIndex]?.exercicio}
              selectedExercise={form.exercicios[exercisePickerIndex]?.selectedExercise}
              onSelect={(exercise) => handleExerciseSelect(exercisePickerIndex, exercise)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
