import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DatePicker from "../components/DatePicker.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { formatDateBR, getLocalDateString } from "../utils/date.js";
import { getApiErrorMessage } from "../utils/errors.js";

const REST_PRESETS = [60, 90, 120];
const EXERCISE_REST_PRESETS = [90, 120, 180];
const MAX_SERIES_PER_EXERCISE = 10;
const weekDays = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const WORKOUT_STORAGE_KEY = "fitprogress_workout_draft";

function getSeriesCount(value) {
  const count = Number(value || 1);
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(Math.trunc(count), 1), MAX_SERIES_PER_EXERCISE);
}

function buildSets(exercise) {
  const totalSets = getSeriesCount(exercise.series);

  return Array.from({ length: totalSets }).map(() => ({
    carga: exercise.carga_alvo || "",
    repeticoes: exercise.repeticoes || "",
    concluida: false,
  }));
}

function buildExecutionFromPlan(plan, date = getLocalDateString()) {
  return {
    treino_semana_id: plan?.id || "",
    nome_treino: plan?.nome_treino || "",
    data: date,
    exercicios: (plan?.exercicios || []).map((exercise) => ({
      exercicio: exercise.exercicio,
      grupo: exercise.grupo || null,
      categoria: exercise.categoria || null,
      series: exercise.series || "",
      repeticoes_planejadas: exercise.repeticoes || "",
      carga_alvo: exercise.carga_alvo || "",
      carga: exercise.carga_alvo || "",
      repeticoes: exercise.repeticoes || "",
      series_execucao: buildSets(exercise),
      serie_atual: 0,
      observacao: "",
      concluido: false,
      pulado: false,
    })),
  };
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function normalizeText(value = "") {
  return String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDateByOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

function getOffsetLabel(offset) {
  if (offset === 0) return "Hoje";
  if (offset === -1) return "Ontem";
  if (offset === 1) return "Amanha";
  return offset < 0 ? `${Math.abs(offset)} dias atras` : `Em ${offset} dias`;
}

function getWeekdayOffset(dayName) {
  const dayIndex = weekDays.findIndex((day) => normalizeText(day) === normalizeText(dayName));
  if (dayIndex < 0) return 0;
  return dayIndex - new Date().getDay();
}

function getSessionDateKey(sessao) {
  return String(sessao.data || sessao.exercicios?.[0]?.data || "").slice(0, 10);
}

function getSavedWorkout(planId) {
  try {
    const saved = JSON.parse(localStorage.getItem(WORKOUT_STORAGE_KEY) || "null");
    return saved?.planId === planId ? saved : null;
  } catch {
    localStorage.removeItem(WORKOUT_STORAGE_KEY);
    return null;
  }
}

function clearSavedWorkout() {
  localStorage.removeItem(WORKOUT_STORAGE_KEY);
}

function ExerciseStatus({ done, skipped, active }) {
  const label = skipped ? "Pulado" : done ? "Concluido" : active ? "Atual" : "Pendente";
  const className = skipped
    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
    : done
      ? "bg-[var(--success-soft)] text-[var(--success)]"
      : active
        ? "bg-emerald-500/10 text-emerald-500"
        : "bg-[var(--surface-muted)] app-muted";

  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>;
}

function getExerciseSummary(exercise) {
  const completedSets = (exercise.series_execucao || []).filter((serie) => serie.concluida);
  const bestSet =
    completedSets
      .slice()
      .sort((a, b) => Number(b.carga || 0) - Number(a.carga || 0) || Number(b.repeticoes || 0) - Number(a.repeticoes || 0))[0] ||
    completedSets.at(-1);

  return {
    completedSets,
    bestSet,
    carga: bestSet?.carga || exercise.carga || exercise.carga_alvo || "",
    repeticoes: bestSet?.repeticoes || exercise.repeticoes || exercise.repeticoes_planejadas || "",
    series: completedSets.length || Number(exercise.series || 0),
  };
}

export default function Treinos() {
  const location = useLocation();
  const { showToast } = useToast();
  const historyRef = useRef(null);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [prs, setPrs] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [execution, setExecution] = useState(buildExecutionFromPlan(null));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [historyDate, setHistoryDate] = useState(getLocalDateString());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restType, setRestType] = useState("series");
  const [timerRunning, setTimerRunning] = useState(false);
  const [workoutElapsed, setWorkoutElapsed] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [savedProgress, setSavedProgress] = useState(null);
  const [completionSummary, setCompletionSummary] = useState(null);

  function selectPlan(plan) {
    setSelectedPlanId(plan.id);
    setSavedProgress(getSavedWorkout(plan.id));
    setExecution(buildExecutionFromPlan(plan, getLocalDateString(getDateByOffset(selectedDayOffset))));
    setCurrentIndex(0);
    setRestSeconds(0);
    setRestType("series");
    setTimerRunning(false);
    setWorkoutElapsed(0);
    setWorkoutStarted(false);
  }

  async function load() {
    try {
      setLoading(true);
      const [weekResponse, sessionsResponse, prsResponse] = await Promise.all([
        api.get("/semana"),
        api.get("/treinos/sessoes"),
        api.get("/treinos/pr"),
      ]);

      const plans = weekResponse.data.data || [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + selectedDayOffset);
      const selectedDayName = weekDays[baseDate.getDay()];
      const planToSelect = plans.find((plan) => normalizeText(plan.dia_semana) === normalizeText(selectedDayName));

      setWeeklyPlans(plans);
      setSessoes(sessionsResponse.data.data || []);
      setPrs(prsResponse.data.data || []);

      if (planToSelect) {
        selectPlan(planToSelect);
      } else {
        setSelectedPlanId("");
        setExecution(buildExecutionFromPlan(null, getLocalDateString(getDateByOffset(selectedDayOffset))));
        setCurrentIndex(0);
        setRestSeconds(0);
        setRestType("series");
        setTimerRunning(false);
        setWorkoutElapsed(0);
        setWorkoutStarted(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel carregar os treinos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedDayOffset]);

  useEffect(() => {
    const dayFromNavigation = location.state?.diaSemana;
    if (!dayFromNavigation) return;

    setSelectedDayOffset(getWeekdayOffset(dayFromNavigation));
  }, [location.state]);

  useEffect(() => {
    if (!timerRunning || restSeconds <= 0) return undefined;

    const interval = window.setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [restSeconds, timerRunning]);

  useEffect(() => {
    if (!workoutStarted) return undefined;

    const interval = window.setInterval(() => {
      setWorkoutElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [workoutStarted]);

  const selectedPlan = useMemo(
    () => weeklyPlans.find((plan) => plan.id === selectedPlanId),
    [selectedPlanId, weeklyPlans],
  );

  useEffect(() => {
    if (!workoutStarted || !selectedPlan) return;

    localStorage.setItem(
      WORKOUT_STORAGE_KEY,
      JSON.stringify({
        planId: selectedPlan.id,
        execution,
        currentIndex,
        restSeconds,
        restType,
        timerRunning,
        workoutElapsed,
        savedAt: new Date().toISOString(),
      }),
    );
  }, [currentIndex, execution, restSeconds, restType, selectedPlan, timerRunning, workoutElapsed, workoutStarted]);

  const selectedDate = useMemo(() => getDateByOffset(selectedDayOffset), [selectedDayOffset]);
  const todayName = weekDays[new Date().getDay()];
  const selectedDayName = weekDays[selectedDate.getDay()];
  const selectedDayLabel = getOffsetLabel(selectedDayOffset);
  const todayPlan = useMemo(
    () => weeklyPlans.find((plan) => normalizeText(plan.dia_semana) === normalizeText(selectedDayName)),
    [selectedDayName, weeklyPlans],
  );
  const selectedPlanCompleted = selectedPlan?.status === "concluido";
  const actionLabel =
    selectedDayOffset < 0
      ? "Executar treino atrasado"
      : selectedDayOffset > 0
        ? "Antecipar treino"
        : savedProgress
          ? "Continuar treino"
          : "Iniciar treino";
  const scheduleContext =
    selectedDayOffset < 0
      ? `Voce esta registrando o treino de ${selectedDayName} como atrasado.`
      : selectedDayOffset > 0
        ? `Voce esta antecipando o treino de ${selectedDayName}.`
        : "Treino planejado para hoje.";

  const lastByExercise = useMemo(() => {
    const records = {};

    sessoes.forEach((sessao) => {
      (sessao.exercicios || []).forEach((treino) => {
        const key = normalizeText(treino.exercicio);
        if (!key || records[key]) return;
        records[key] = treino;
      });
    });

    return records;
  }, [sessoes]);

  const prByExercise = useMemo(
    () =>
      prs.reduce((acc, pr) => {
        acc[normalizeText(pr.exercicio)] = pr;
        return acc;
      }, {}),
    [prs],
  );

  const currentExercise = execution.exercicios[currentIndex];
  const completedCount = execution.exercicios.filter((item) => item.concluido || item.pulado).length;
  const savedCount = execution.exercicios.filter((item) => item.concluido && !item.pulado).length;
  const totalCount = execution.exercicios.length;
  const progress = totalCount ? (completedCount / totalCount) * 100 : 0;
  const workoutFinished = totalCount > 0 && completedCount === totalCount;
  const last = currentExercise ? lastByExercise[normalizeText(currentExercise.exercicio)] : null;
  const currentPr = currentExercise ? prByExercise[normalizeText(currentExercise.exercicio)] : null;
  const currentSets = currentExercise?.series_execucao || [];
  const currentSetIndex = currentExercise?.serie_atual || 0;
  const currentSet = currentSets[currentSetIndex];
  const currentRestPresets = restType === "exercise" ? EXERCISE_REST_PRESETS : REST_PRESETS;
  const restDescription = restType === "exercise" ? "Timer entre exercicios." : "Timer entre series.";
  const completedSetsCount = currentSets.filter((serie) => serie.concluida).length;
  const exerciseSummary = currentExercise ? getExerciseSummary(currentExercise) : null;
  const isLastExercise = currentIndex === totalCount - 1;
  const isLastSeries = currentSets.length > 0 && currentSetIndex === currentSets.length - 1;
  const finishSetLabel = isLastExercise && isLastSeries ? "Concluir treino" : "Concluir serie";
  const isNewPr =
    currentExercise &&
    Number(exerciseSummary?.carga || 0) > Number(currentPr?.carga || last?.carga || 0);

  function updateExercise(index, field, value) {
    setExecution((current) => ({
      ...current,
      exercicios: current.exercicios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function goToExercise(index) {
    if (index < 0 || index >= execution.exercicios.length) return;
    setCurrentIndex(index);
  }

  function usePlannedValues() {
    if (!currentExercise) return;
    const totalSets = getSeriesCount(currentExercise.series);
    updateExercise(
      currentIndex,
      "series_execucao",
      Array.from({ length: totalSets }).map(() => ({
        carga: currentExercise.carga_alvo || "",
        repeticoes: currentExercise.repeticoes_planejadas || "",
        concluida: false,
      })),
    );
    updateExercise(currentIndex, "serie_atual", 0);
  }

  function repeatLastValues() {
    if (!last) return;
    const totalSets = getSeriesCount(currentExercise.series || last.series);
    updateExercise(
      currentIndex,
      "series_execucao",
      Array.from({ length: totalSets }).map(() => ({
        carga: last.carga || "",
        repeticoes: last.repeticoes || "",
        concluida: false,
      })),
    );
    updateExercise(currentIndex, "serie_atual", 0);
  }

  function updateSet(setIndex, field, value) {
    if (!currentExercise) return;

    updateExercise(
      currentIndex,
      "series_execucao",
      currentSets.map((serie, index) => (index === setIndex ? { ...serie, [field]: value } : serie)),
    );
  }

  async function completeCurrentSet() {
    if (!currentExercise || !currentSet) return;

    if (!Number(currentSet.carga) || !Number(currentSet.repeticoes)) {
      setError("Informe carga e repeticoes para concluir a serie atual.");
      return;
    }

    setError("");
    const nextSets = currentSets.map((serie, index) =>
      index === currentSetIndex ? { ...serie, concluida: true } : serie,
    );
    const nextSetIndex = nextSets.findIndex((serie) => !serie.concluida);
    const summary = getExerciseSummary({ ...currentExercise, series_execucao: nextSets });

    updateExercise(currentIndex, "series_execucao", nextSets);
    updateExercise(currentIndex, "series", summary.series);
    updateExercise(currentIndex, "carga", summary.carga);
    updateExercise(currentIndex, "repeticoes", summary.repeticoes);

    if (nextSetIndex >= 0) {
      setRestSeconds(REST_PRESETS[0]);
      setRestType("series");
      setTimerRunning(true);
      updateExercise(currentIndex, "serie_atual", nextSetIndex);
      return;
    }

    updateExercise(currentIndex, "concluido", true);
    updateExercise(currentIndex, "pulado", false);

    if (isLastExercise) {
      await submitWorkout({
        exerciciosOverride: execution.exercicios.map((item, index) =>
          index === currentIndex
            ? {
                ...item,
                series_execucao: nextSets,
                series: summary.series,
                carga: summary.carga,
                repeticoes: summary.repeticoes,
                concluido: true,
                pulado: false,
              }
            : item,
        ),
      });
      return;
    }

    setRestSeconds(EXERCISE_REST_PRESETS[0]);
    setRestType("exercise");
    setTimerRunning(true);

    const nextIndex = execution.exercicios.findIndex(
      (item, index) => index > currentIndex && !item.concluido && !item.pulado,
    );

    if (nextIndex >= 0) {
      setCurrentIndex(nextIndex);
    }
  }

  async function skipExercise() {
    const nextExercises = execution.exercicios.map((item, index) =>
      index === currentIndex ? { ...item, pulado: true, concluido: false } : item,
    );

    setExecution((current) => ({ ...current, exercicios: nextExercises }));

    const nextIndex = execution.exercicios.findIndex(
      (item, index) => index > currentIndex && !item.concluido && !item.pulado,
    );

    if (nextIndex >= 0) {
      setRestSeconds(EXERCISE_REST_PRESETS[0]);
      setRestType("exercise");
      setTimerRunning(true);
      setCurrentIndex(nextIndex);
      return;
    }

    await submitWorkout({ exerciciosOverride: nextExercises });
  }

  async function submitWorkout({ exerciciosOverride } = {}) {
    if (!selectedPlan) {
      setError("Cadastre um treino na aba Semana antes de registrar a execucao.");
      return;
    }

    const exercicios = exerciciosOverride || execution.exercicios;
    const exerciciosValidos = exercicios.filter((item) => item.concluido && !item.pulado);

    if (!exerciciosValidos.length) {
      setError("Conclua pelo menos um exercicio antes de salvar o treino.");
      return;
    }

    try {
      setError("");
      const payload = {
        nome_treino: execution.nome_treino,
        data: execution.data,
        duracao_segundos: workoutElapsed,
        exercicios: exerciciosValidos.map((item) => {
          const summary = getExerciseSummary(item);

          return {
            exercicio: item.exercicio,
            grupo: item.grupo || null,
            categoria: item.categoria || null,
            series: summary.series ? Number(summary.series) : null,
            carga: Number(summary.carga),
            repeticoes: Number(summary.repeticoes),
            ...(item.observacao?.trim() ? { observacao: item.observacao.trim() } : {}),
          };
        }),
      };

      await api.post("/treinos/sessao", payload);
      await api.patch(`/semana/${selectedPlan.id}`, {
        status: "concluido",
        concluido_em: new Date().toISOString(),
      });
      clearSavedWorkout();
      setSavedProgress(null);
      setCompletionSummary({
        exercicios: exerciciosValidos.length,
        duracao: workoutElapsed,
        prs: exerciciosValidos.filter(
          (item) => Number(getExerciseSummary(item).carga || 0) > Number(prByExercise[normalizeText(item.exercicio)]?.carga || 0),
        ).length,
      });
      setExecution(buildExecutionFromPlan(selectedPlan, getLocalDateString(selectedDate)));
      setCurrentIndex(0);
      setRestSeconds(0);
      setRestType("series");
      setTimerRunning(false);
      setWorkoutElapsed(0);
      setWorkoutStarted(false);
      showToast({
        title: "Treino registrado",
        message: `${selectedPlan.nome_treino} foi salvo no historico.`,
      });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel registrar o treino.");
      setError(message);
      showToast({ title: "Erro ao salvar treino", message, type: "error" });
    }
  }

  async function reopenTodayWorkout() {
    if (!selectedPlan) return;

    try {
      setError("");
      await api.patch(`/semana/${selectedPlan.id}`, {
        status: "agendado",
        concluido_em: null,
      });
      setCompletionSummary(null);
      showToast({ title: "Treino reaberto", message: "O treino voltou para agendado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel reabrir o treino.");
      setError(message);
      showToast({ title: "Erro ao reabrir treino", message, type: "error" });
    }
  }

  async function removeTreino(treino) {
    if (!window.confirm(`Remover ${treino.exercicio}?`)) return;

    try {
      setError("");
      await api.delete(`/treinos/${treino.id}`);
      showToast({ title: "Exercicio removido", message: "O registro saiu da sessao." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel remover o exercicio.");
      setError(message);
      showToast({ title: "Erro ao remover exercicio", message, type: "error" });
    }
  }

  const sessoesDoDia = historyDate
    ? sessoes.filter((sessao) => getSessionDateKey(sessao) === historyDate)
    : [];

  const filteredSessoes = sessoesDoDia.filter((sessao) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      (sessao.nome_treino || "").toLowerCase().includes(term) ||
      (sessao.exercicios || []).some((treino) => (treino.exercicio || "").toLowerCase().includes(term))
    );
  });

  const historyExerciseCount = filteredSessoes.reduce(
    (total, sessao) => total + (sessao.exercicios?.length || 0),
    0,
  );

  function getSessionDuration(sessao) {
    return Math.max(
      0,
      ...(sessao.exercicios || []).map((treino) => Number(treino.duracao_segundos || 0)),
    );
  }

  function startWorkout() {
    if (savedProgress?.execution) {
      setExecution(savedProgress.execution);
      setCurrentIndex(savedProgress.currentIndex || 0);
      setRestSeconds(savedProgress.restSeconds || 0);
      setRestType(savedProgress.restType || "series");
      setTimerRunning(Boolean(savedProgress.timerRunning && savedProgress.restSeconds));
      setWorkoutElapsed(savedProgress.workoutElapsed || 0);
    } else {
      setRestSeconds(0);
      setRestType("series");
      setTimerRunning(false);
      setWorkoutElapsed(0);
    }

    setWorkoutStarted(true);
  }

  function goToHistory() {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-500">Treinos</p>
          <h1 className="app-text mt-1 text-2xl font-semibold tracking-tight">
            Execucao guiada
          </h1>
          <p className="app-muted mt-1 text-sm">
            Execute o treino do dia selecionado, registre series e salve ao concluir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-soft px-3 py-1 text-xs font-semibold">
            {completedCount} de {totalCount || 0} exercicios
          </span>
          {workoutStarted && (
            <span className="app-surface app-border rounded-xl border px-3 py-2 text-xs font-semibold app-text">
              Duracao: {formatTimer(workoutElapsed)}
            </span>
          )}
          <span className="app-surface app-border rounded-xl border px-3 py-2 text-xs font-semibold app-text">
            {selectedDayLabel}: {selectedDayName}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <Card className="xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          <div className="mb-4">
            <h2 className="app-text text-sm font-semibold">Treinos da semana</h2>
            <p className="app-muted mt-1 text-xs">Clique em um treino planejado para executar ou revisar o dia.</p>
            {selectedDayOffset !== 0 && (
              <Button
                type="button"
                variant="ghost"
                className="mt-3 w-full"
                onClick={() => setSelectedDayOffset(0)}
              >
                Voltar para hoje
              </Button>
            )}
          </div>

          {loading && <p className="app-muted text-sm">Carregando treinos...</p>}

          {!loading && !weeklyPlans.length && (
            <EmptyState
              title="Semana vazia"
              description="Cadastre sua rotina na aba Semana antes de executar."
            />
          )}

          <div className="mb-3 grid grid-cols-7 gap-1.5">
            {weekDays.map((day, index) => {
              const plan = weeklyPlans.find((item) => normalizeText(item.dia_semana) === normalizeText(day));
              const active = normalizeText(day) === normalizeText(selectedDayName);
              const completed = plan?.status === "concluido";

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayOffset(getWeekdayOffset(day))}
                  className={`rounded-lg border px-2 py-2 text-center text-[10px] font-semibold transition ${
                    completed
                      ? active
                        ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] ring-1 ring-[var(--success)]"
                        : "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                      : active
                        ? "border-[var(--accent)] bg-emerald-500/10 text-emerald-500"
                        : plan
                          ? "border-[var(--border)] bg-[var(--surface-muted)] app-text hover:border-[var(--accent-border)]"
                          : "border-[var(--border)] app-muted opacity-60"
                  }`}
                >
                  {weekLabels[index]}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {weeklyPlans.map((plan) => {
              const isSelectedDay = normalizeText(plan.dia_semana) === normalizeText(selectedDayName);
              const active = plan.id === selectedPlanId;
              const completed = plan.status === "concluido";

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedDayOffset(getWeekdayOffset(plan.dia_semana))}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    active
                      ? completed
                        ? "border-[var(--success)] bg-[var(--success-soft)]"
                        : "border-[var(--accent)] bg-emerald-500/10"
                      : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent-border)] hover:bg-emerald-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-500">{plan.dia_semana}</p>
                      <p className="app-text mt-1 truncate text-sm font-semibold">{plan.nome_treino}</p>
                      <p className="app-muted mt-1 text-[11px]">
                        {completed
                          ? "Concluido"
                          : isSelectedDay
                            ? selectedDayOffset === 0
                              ? "Disponivel hoje"
                              : "Disponivel"
                            : "Agendado"}
                      </p>
                    </div>
                    <span className="app-muted text-[11px]">{plan.exercicios?.length || 0} ex.</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          {!todayPlan ? (
            <EmptyState
              title="Sem treino para este dia"
              description={`Cadastre um treino para ${selectedDayName} na aba Semana.`}
            />
          ) : !selectedPlan || !currentExercise ? (
            <EmptyState
              title="Treino indisponivel"
              description="Nao foi possivel carregar o treino selecionado."
            />
          ) : selectedPlanCompleted ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="max-w-md text-center">
                <span className="badge-soft px-3 py-1 text-xs font-semibold">Concluido</span>
                <h2 className="app-text mt-4 text-2xl font-semibold">{selectedPlan.nome_treino}</h2>
                <p className="app-muted mt-2 text-sm">
                  Treino de {selectedPlan.dia_semana} concluido.
                </p>
                {completionSummary && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                      <p className="text-2xl font-semibold text-[var(--success)]">
                        {completionSummary.exercicios}
                      </p>
                  <p className="app-muted text-xs">exercicios registrados</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                      <p className="text-2xl font-semibold text-[var(--warning)]">
                        {completionSummary.prs}
                      </p>
                      <p className="app-muted text-xs">possiveis PRs</p>
                    </div>
                  </div>
                )}
                {completionSummary?.duracao !== undefined && (
                  <p className="app-muted mt-4 text-sm">
                    Duracao: <span className="app-text font-semibold">{formatTimer(completionSummary.duracao)}</span>
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="secondary" onClick={goToHistory}>
                    Ver historico
                  </Button>
                  <Button type="button" variant="secondary" onClick={reopenTodayWorkout}>
                    Retornar para agendado
                  </Button>
                </div>
              </div>
            </div>
          ) : !workoutStarted ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="app-surface-muted app-border flex min-h-[27rem] w-full max-w-[30rem] flex-col rounded-3xl border p-8 text-center transition duration-200 ease-out">
                <span className="badge-soft px-3 py-1 text-xs font-semibold">
                  {selectedDayOffset === 0 ? "Hoje" : selectedDayName}
                </span>
                <h2 className="app-text mt-4 break-words text-3xl font-semibold leading-tight">{selectedPlan.nome_treino}</h2>
                <p className="app-muted mt-2 text-sm">
                  {selectedPlan.dia_semana} - {selectedPlan.exercicios?.length || 0} exercicios planejados.
                </p>
                <p className="mt-3 min-h-11 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
                  {scheduleContext}
                </p>
                <div className="mt-5 flex-1 space-y-2 text-left">
                  {(selectedPlan.exercicios || []).slice(0, 4).map((exercise, index) => (
                    <div
                      key={`${exercise.exercicio}-${index}`}
                      className="grid min-h-9 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-[var(--surface)] px-3 py-2"
                    >
                      <span className="app-text min-w-0 truncate text-sm font-semibold">{exercise.exercicio}</span>
                      <span className="app-muted whitespace-nowrap text-xs">
                        {exercise.series}x{exercise.repeticoes}
                        {exercise.carga_alvo ? ` - ${exercise.carga_alvo}kg` : ""}
                      </span>
                    </div>
                  ))}
                  {(selectedPlan.exercicios || []).length > 4 && (
                    <p className="app-muted px-1 pt-1 text-center text-xs">
                      +{selectedPlan.exercicios.length - 4} exercicios no roteiro
                    </p>
                  )}
                </div>
                <Button type="button" className="mt-6 w-full" onClick={startWorkout}>
                  {actionLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div>
                  <div>
                    <p className="app-muted text-xs">{selectedPlan.dia_semana}</p>
                    <h2 className="app-text mt-1 text-xl font-semibold">{execution.nome_treino}</h2>
                    <p className="app-muted mt-1 text-xs">
                      {formatDateBR(execution.data)} - exercicio {currentIndex + 1} de {totalCount}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-500">
                      Duracao do treino: {formatTimer(workoutElapsed)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--soft)]">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="app-text text-2xl font-semibold tracking-tight">{currentExercise.exercicio}</h3>
                      {isNewPr && (
                        <span className="rounded bg-[var(--warning-soft)] px-2 py-1 text-xs font-bold text-[var(--warning)]">
                          novo PR
                        </span>
                      )}
                    </div>
                    <p className="app-muted mt-1 text-sm">
                      {[currentExercise.grupo, currentExercise.categoria].filter(Boolean).join(" - ") || "Exercicio"}
                    </p>
                  </div>
                  <ExerciseStatus
                    done={currentExercise.concluido}
                    skipped={currentExercise.pulado}
                    active
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[var(--surface)] p-3">
                    <p className="app-muted text-[11px]">Planejado</p>
                    <p className="app-text mt-1 text-sm font-semibold">
                      {currentExercise.series || "-"}x{currentExercise.repeticoes_planejadas || "-"}
                      {currentExercise.carga_alvo ? ` - ${currentExercise.carga_alvo}kg` : ""}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--surface)] p-3">
                    <p className="app-muted text-[11px]">Ultima vez</p>
                    <p className="app-text mt-1 text-sm font-semibold">
                      {last ? `${last.series || 1}x ${last.carga}kg x ${last.repeticoes}` : "Sem historico"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--surface)] p-3">
                    <p className="app-muted text-[11px]">Recorde atual</p>
                    <p className="app-text mt-1 text-sm font-semibold">
                      {currentPr ? `${currentPr.carga}kg x ${currentPr.repeticoes || "-"}` : "Sem PR"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="app-muted text-xs">Serie atual</p>
                      <p className="app-text mt-1 text-xl font-semibold">
                        Serie {Math.min(currentSetIndex + 1, currentSets.length || 1)} de {currentSets.length || 1}
                      </p>
                    </div>
                    <span className="badge-soft w-fit px-3 py-1 text-xs font-semibold">
                      {completedSetsCount}/{currentSets.length || 0} concluidas
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Carga da serie"
                      type="number"
                      step="0.5"
                      value={currentSet?.carga || ""}
                      onChange={(event) => updateSet(currentSetIndex, "carga", event.target.value)}
                      required
                    />
                    <Input
                      label="Repeticoes da serie"
                      type="number"
                      value={currentSet?.repeticoes || ""}
                      onChange={(event) => updateSet(currentSetIndex, "repeticoes", event.target.value)}
                      required
                    />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {currentSets.map((serie, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => updateExercise(currentIndex, "serie_atual", index)}
                        className={`rounded-lg border px-3 py-2 text-left transition ${
                          index === currentSetIndex
                            ? "border-[var(--accent)] bg-emerald-500/10"
                            : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--accent-border)]"
                        }`}
                      >
                        <p className="text-xs font-semibold text-emerald-500">Serie {index + 1}</p>
                        <p className="app-muted mt-1 text-[11px]">
                          {serie.concluida
                            ? `${serie.carga || "-"}kg x ${serie.repeticoes || "-"}`
                            : "pendente"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="app-label mb-1.5 block text-xs font-semibold">Observacao</span>
                  <textarea
                    className="app-control min-h-20 w-full resize-none px-3.5 py-2.5 text-sm placeholder:text-gray-500"
                    placeholder="Opcional: dor, ajuste de carga, tecnica, descanso..."
                    value={currentExercise.observacao}
                    onChange={(event) => updateExercise(currentIndex, "observacao", event.target.value)}
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={usePlannedValues}>
                    Usar planejado
                  </Button>
                  <Button type="button" variant="secondary" onClick={repeatLastValues} disabled={!last}>
                    Repetir ultimo
                  </Button>
                  <Button type="button" variant="ghost" onClick={skipExercise}>
                    Pular
                  </Button>
                  <Button type="button" onClick={completeCurrentSet}>
                    {finishSetLabel}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => goToExercise(currentIndex - 1)} disabled={currentIndex === 0}>
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => goToExercise(currentIndex + 1)}
                    disabled={currentIndex >= totalCount - 1}
                  >
                    Proximo
                  </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="app-text text-sm font-semibold">Descanso</h2>
                <p className="app-muted mt-1 text-xs">{restDescription}</p>
              </div>
              <p className="text-3xl font-semibold text-emerald-500">{formatTimer(restSeconds)}</p>
            </div>
            <div className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3">
              <p className="app-muted text-[11px]">Duracao do treino</p>
              <p className="app-text mt-1 text-xl font-semibold">{formatTimer(workoutElapsed)}</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {currentRestPresets.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  disabled={!workoutStarted || selectedPlanCompleted}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold app-text transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setRestSeconds(seconds);
                    setRestType(restType === "exercise" ? "exercise" : "series");
                    setTimerRunning(true);
                  }}
                >
                  {seconds}s
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" onClick={() => setTimerRunning((current) => !current)} disabled={!restSeconds || !workoutStarted || selectedPlanCompleted}>
                {timerRunning ? "Pausar" : "Iniciar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!workoutStarted || selectedPlanCompleted}
                onClick={() => {
                  setRestSeconds(0);
                  setTimerRunning(false);
                }}
              >
                {restSeconds ? "Pular descanso" : "Zerar"}
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="app-text text-sm font-semibold">Roteiro do treino</h2>
            <div className="mt-3 space-y-1.5">
              {execution.exercicios.map((item, index) => (
                <button
                  key={`${item.exercicio}-${index}`}
                  type="button"
                  disabled={!workoutStarted || selectedPlanCompleted}
                  onClick={() => goToExercise(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    index === currentIndex && workoutStarted ? "bg-emerald-500/10" : "bg-[var(--surface-muted)] hover:bg-emerald-500/10"
                  }`}
                >
                  <span className="app-muted w-5 text-center text-[11px]">{index + 1}</span>
                  <span className="app-text min-w-0 flex-1 truncate text-xs font-medium">{item.exercicio}</span>
                  <span className="app-muted text-[10px]">
                    {(item.series_execucao || []).filter((serie) => serie.concluida).length}/
                    {(item.series_execucao || []).length || item.series || 0}
                  </span>
                  <ExerciseStatus done={item.concluido} skipped={item.pulado} active={index === currentIndex && workoutStarted} />
                </button>
              ))}
              {!execution.exercicios.length && (
                <p className="app-muted rounded-lg bg-[var(--surface-muted)] p-3 text-sm">Nenhum treino selecionado.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="app-text text-sm font-semibold">Resumo</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-center">
                <p className="text-lg font-semibold text-[var(--success)]">{savedCount}</p>
                <p className="app-muted text-[10px]">salvos</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-center">
                <p className="text-lg font-semibold text-[var(--danger)]">
                  {execution.exercicios.filter((item) => item.pulado).length}
                </p>
                <p className="app-muted text-[10px]">pulados</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-center">
                <p className="text-lg font-semibold text-[var(--warning)]">
                  {execution.exercicios.filter((item) => Number(item.carga || 0) > Number(prByExercise[normalizeText(item.exercicio)]?.carga || 0)).length}
                </p>
                <p className="app-muted text-[10px]">possiveis PRs</p>
              </div>
            </div>
            {workoutFinished && (
              <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-500">
                Treino finalizado. A sessao sera salva ao concluir a ultima serie.
              </p>
            )}
          </Card>
        </div>
      </div>

      <div ref={historyRef}>
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="app-text text-sm font-semibold">Historico por dia</h2>
              <p className="app-muted mt-1 text-xs">
                Escolha uma data para visualizar apenas as sessoes daquele dia.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
              <DatePicker label="Dia" value={historyDate} onChange={setHistoryDate} />
              <label className="block">
                <span className="app-label mb-1.5 block text-xs font-semibold">Filtro</span>
                <input
                  className="app-control px-3 py-2.5 text-sm"
                  placeholder="Filtrar treino"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div>
              <p className="app-text text-sm font-semibold">
                {historyDate ? formatDateBR(historyDate) : "Nenhum dia selecionado"}
              </p>
              <p className="app-muted mt-1 text-xs">
                {filteredSessoes.length} sessao{filteredSessoes.length === 1 ? "" : "es"} - {historyExerciseCount} exercicio
                {historyExerciseCount === 1 ? "" : "s"}
              </p>
            </div>
            {historyDate !== getLocalDateString() && (
              <Button type="button" variant="secondary" onClick={() => setHistoryDate(getLocalDateString())}>
                Voltar para hoje
              </Button>
            )}
          </div>

          <div className="mt-4">
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredSessoes.map((sessao) => {
                const sessionDuration = getSessionDuration(sessao);

                return (
                  <div
                    key={sessao.sessao_id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="app-text font-semibold">{sessao.nome_treino}</p>
                        <p className="app-muted mt-1 text-sm">
                          {sessionDuration > 0 ? `Duracao ${formatTimer(sessionDuration)}` : "Sem tempo registrado"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sessionDuration > 0 && (
                          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-emerald-500">
                            {formatTimer(sessionDuration)}
                          </span>
                        )}
                        <span className="badge-soft px-3 py-1 text-xs font-semibold">
                          {sessao.exercicios.length} exercicios
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 divide-y divide-[var(--border)]">
                      {sessao.exercicios.slice(0, 4).map((treino) => (
                        <div
                          key={treino.id}
                          className="grid gap-2 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="app-text truncate text-sm font-medium">{treino.exercicio}</p>
                            {(treino.grupo || treino.categoria) && (
                              <p className="app-muted mt-0.5 text-xs">
                                {[treino.grupo, treino.categoria].filter(Boolean).join(" - ")}
                              </p>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-emerald-500">
                            {treino.series || 1}x {treino.carga}kg x {treino.repeticoes}
                          </p>
                          <Button type="button" variant="ghost" onClick={() => removeTreino(treino)}>
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {!historyDate && (
              <EmptyState
                title="Selecione um dia"
                description="Use o calendario para visualizar o historico de uma data especifica."
              />
            )}

            {historyDate && !filteredSessoes.length && (
              <EmptyState
                title="Nenhum treino encontrado"
                description="Nao ha sessoes registradas para o dia selecionado."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
