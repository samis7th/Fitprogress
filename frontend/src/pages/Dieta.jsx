import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DatePicker from "../components/DatePicker.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { formatDateBR, getLocalDateString } from "../utils/date.js";
import { getApiErrorMessage } from "../utils/errors.js";

const mealTypes = [
  "Cafe",
  "Almoco",
  "Janta",
  "Pre treino",
  "Pos treino",
  "Lanche",
  "Refeicao livre",
];
const DIET_GOALS_KEY = "fitprogress_diet_goals";

function loadDietGoals() {
  try {
    const saved = JSON.parse(localStorage.getItem(DIET_GOALS_KEY) || "null");
    return {
      calorias: saved?.calorias || 2500,
      proteina: saved?.proteina || 180,
    };
  } catch {
    localStorage.removeItem(DIET_GOALS_KEY);
    return { calorias: 2500, proteina: 180 };
  }
}

function getDateOffset(dateValue, offset) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return getLocalDateString(date);
}

function getRecordDate(value) {
  return String(value || "").slice(0, 10);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function getProgress(current, target) {
  const numericTarget = Number(target || 0);
  if (!numericTarget) return 0;
  return Math.min((Number(current || 0) / numericTarget) * 100, 100);
}

function createInitialForm(date = getLocalDateString()) {
  return {
    calorias: "",
    proteina: "",
    data: date,
    refeicao: "Cafe",
    descricao: "",
  };
}

export default function Dieta() {
  const { showToast } = useToast();
  const [registros, setRegistros] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [form, setForm] = useState(createInitialForm());
  const [error, setError] = useState("");
  const [goals, setGoals] = useState(loadDietGoals);
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  async function load() {
    try {
      const { data } = await api.get("/dieta");
      setRegistros(data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel carregar a nutricao."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const registrosDoDia = useMemo(
    () => registros.filter((item) => getRecordDate(item.data) === selectedDate),
    [registros, selectedDate],
  );

  const totals = useMemo(
    () =>
      registrosDoDia.reduce(
        (acc, item) => ({
          calorias: acc.calorias + Number(item.calorias || 0),
          proteina: acc.proteina + Number(item.proteina || 0),
        }),
        { calorias: 0, proteina: 0 },
      ),
    [registrosDoDia],
  );

  const refeicoesPorTipo = useMemo(
    () => {
      const itensPorTipo = registrosDoDia.reduce((acc, item) => {
        const tipo = item.refeicao || "Refeicao livre";
        acc[tipo] = acc[tipo] || [];
        acc[tipo].push(item);
        return acc;
      }, {});

      return mealTypes.map((tipo) => ({
        tipo,
        itens: itensPorTipo[tipo] || [],
        total: itensPorTipo[tipo]?.length || 0,
      }));
    },
    [registrosDoDia],
  );

  const refeicoesOntem = useMemo(() => {
    const yesterday = getDateOffset(selectedDate, -1);
    return registros.filter((item) => getRecordDate(item.data) === yesterday);
  }, [registros, selectedDate]);

  const ultimasRefeicoes = useMemo(
    () =>
      registros
        .filter(
          (item) =>
            getRecordDate(item.data) !== selectedDate &&
            (item.descricao || item.calorias || item.proteina),
        )
        .slice(0, 6),
    [registros, selectedDate],
  );

  const calorieProgress = getProgress(totals.calorias, goals.calorias);
  const proteinProgress = getProgress(totals.proteina, goals.proteina);

  function updateGoals(nextGoals) {
    setGoals(nextGoals);
    localStorage.setItem(DIET_GOALS_KEY, JSON.stringify(nextGoals));
  }

  function updateSelectedDate(value) {
    setSelectedDate(value);
    setForm((current) => ({ ...current, data: value }));
  }

  function selectMealType(tipo) {
    setForm((current) => ({ ...current, refeicao: tipo, data: selectedDate }));
  }

  function fillFromMeal(item) {
    setForm({
      calorias: item.calorias || "",
      proteina: item.proteina || "",
      data: selectedDate,
      refeicao: item.refeicao || "Cafe",
      descricao: item.descricao || "",
    });
  }

  async function duplicateMeal(item) {
    try {
      setError("");
      await api.post("/dieta", {
        calorias: Number(item.calorias),
        proteina: Number(item.proteina || 0),
        refeicao: item.refeicao || "Cafe",
        descricao: item.descricao || null,
        data: selectedDate,
      });
      showToast({ title: "Refeicao duplicada", message: "Registro adicionado ao dia selecionado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel duplicar a refeicao.");
      setError(message);
      showToast({ title: "Erro ao duplicar refeicao", message, type: "error" });
    }
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      const payload = {
        calorias: Number(form.calorias),
        proteina: Number(form.proteina),
        refeicao: form.refeicao,
        descricao: form.descricao.trim() || null,
        data: selectedDate,
      };

      await api.post("/dieta", payload);
      setForm(createInitialForm(selectedDate));
      showToast({ title: "Refeicao salva", message: "Resumo nutricional atualizado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel salvar a refeicao.");
      setError(message);
      showToast({ title: "Erro ao salvar refeicao", message, type: "error" });
    }
  }

  async function removeDieta(item) {
    if (!window.confirm(`Remover ${item.refeicao || "registro"} de ${item.calorias} kcal?`)) return;

    try {
      setError("");
      await api.delete(`/dieta/${item.id}`);
      showToast({ title: "Registro removido" });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel remover o registro.");
      setError(message);
      showToast({ title: "Erro ao remover registro", message, type: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
            Dieta
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Nutricao
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm">
            Visualize apenas o dia selecionado e registre cada refeicao com descricao.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <DatePicker
            label="Dia"
            value={selectedDate}
            onChange={updateSelectedDate}
            className="w-full sm:w-56"
          />
          <Button
            type="button"
            variant="secondary"
            className="sm:mb-0"
            onClick={() => setShowGoalEditor((current) => !current)}
          >
            Metas diarias
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-muted text-xs">Calorias do dia</p>
              <p className="app-text mt-2 text-2xl font-semibold">
                {formatNumber(totals.calorias)}
                <span className="app-muted ml-1 text-xs">/ {formatNumber(goals.calorias)} kcal</span>
              </p>
            </div>
            <span className="badge-soft px-2 py-1 text-xs font-semibold">{Math.round(calorieProgress)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--soft)]">
            <div className="h-full rounded-full bg-[var(--warning)]" style={{ width: `${calorieProgress}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-muted text-xs">Proteina do dia</p>
              <p className="app-text mt-2 text-2xl font-semibold">
                {formatNumber(totals.proteina)}g
                <span className="app-muted ml-1 text-xs">/ {formatNumber(goals.proteina)}g</span>
              </p>
            </div>
            <span className="badge-soft px-2 py-1 text-xs font-semibold">{Math.round(proteinProgress)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--soft)]">
            <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${proteinProgress}%` }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-muted text-xs">Refeicoes</p>
              <p className="app-text mt-2 text-2xl font-semibold">{registrosDoDia.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {showGoalEditor && (
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Input
              label="Meta de calorias"
              type="number"
              value={goals.calorias}
              onChange={(event) => updateGoals({ ...goals, calorias: event.target.value })}
            />
            <Input
              label="Meta de proteina"
              type="number"
              value={goals.proteina}
              onChange={(event) => updateGoals({ ...goals, proteina: event.target.value })}
            />
            <Button type="button" variant="secondary" onClick={() => setShowGoalEditor(false)}>
              Fechar
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {refeicoesPorTipo.map((item) => (
            <button
              key={item.tipo}
              type="button"
              onClick={() => selectMealType(item.tipo)}
              className={`app-border rounded-2xl border px-3 py-3 text-left transition ${
                form.refeicao === item.tipo
                  ? "bg-emerald-500 text-[var(--accent-contrast)]"
                  : "app-surface-muted app-text hover:border-emerald-500/40"
              }`}
            >
              <span className="block text-sm font-semibold">{item.tipo}</span>
              <span className={`mt-1 block text-xs ${form.refeicao === item.tipo ? "opacity-80" : "app-muted"}`}>
                {item.total} registro{item.total === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="app-text text-lg font-semibold">Nova refeicao</h2>
              <p className="app-muted mt-1 text-sm">
                Refeicao: <span className="app-text font-semibold">{form.refeicao}</span>
              </p>
            </div>
            <span className="badge-soft px-3 py-1 text-xs font-semibold">{formatDateBR(selectedDate)}</span>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block">
              <span className="app-label mb-2 block text-sm font-semibold">
                Alimentos da refeicao
              </span>
              <textarea
                className="app-control min-h-28 w-full resize-y px-3.5 py-2.5 text-sm placeholder:text-gray-500"
                placeholder="Ex: arroz, frango, salada e banana"
                value={form.descricao}
                onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                maxLength={500}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Input
                label="Calorias"
                type="number"
                value={form.calorias}
                onChange={(event) => setForm({ ...form, calorias: event.target.value })}
                required
              />
              <Input
                label="Proteina"
                type="number"
                value={form.proteina}
                onChange={(event) => setForm({ ...form, proteina: event.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Salvar refeicao
            </Button>
          </form>

          {(refeicoesOntem.length > 0 || ultimasRefeicoes.length > 0) && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <h3 className="app-text text-sm font-semibold">Atalhos rapidos</h3>
              <div className="mt-3 space-y-2">
                {refeicoesOntem.slice(0, 3).map((item) => (
                  <button
                    key={`ontem-${item.id}`}
                    type="button"
                    onClick={() => duplicateMeal(item)}
                    className="app-surface-muted app-border flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-[var(--accent-border)]"
                  >
                    <span className="min-w-0">
                      <span className="app-text block truncate text-xs font-semibold">
                        Repetir {item.refeicao || "refeicao"} de ontem
                      </span>
                      <span className="app-muted mt-0.5 block truncate text-[11px]">
                        {item.descricao || `${item.calorias} kcal`}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-500">Duplicar</span>
                  </button>
                ))}
                {!refeicoesOntem.length &&
                  ultimasRefeicoes.slice(0, 3).map((item) => (
                    <button
                      key={`ultima-${item.id}`}
                      type="button"
                      onClick={() => fillFromMeal(item)}
                      className="app-surface-muted app-border flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-[var(--accent-border)]"
                    >
                      <span className="min-w-0">
                        <span className="app-text block truncate text-xs font-semibold">
                          Usar {item.refeicao || "refeicao"} recente
                        </span>
                        <span className="app-muted mt-0.5 block truncate text-[11px]">
                          {item.descricao || `${item.calorias} kcal`}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-emerald-500">Preencher</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Historico do dia</h2>
              <p className="app-muted mt-1 text-sm">{formatDateBR(selectedDate)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {refeicoesPorTipo
              .filter((grupo) => grupo.itens.length > 0)
              .map((grupo) => (
                <div key={grupo.tipo}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="app-text text-sm font-semibold">{grupo.tipo}</h3>
                    <span className="app-muted text-xs">
                      {grupo.itens.reduce((total, item) => total + Number(item.calorias || 0), 0)} kcal
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {grupo.itens.map((item) => (
                      <div key={item.id} className="app-surface-muted app-border rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            {item.descricao && (
                              <p className="app-text text-sm font-medium leading-6">{item.descricao}</p>
                            )}
                            <p className="app-muted mt-2 text-sm">
                              {item.calorias} kcal - {item.proteina}g proteina
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" onClick={() => fillFromMeal(item)}>
                              Reusar
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => removeDieta(item)}>
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {!registrosDoDia.length && (
              <EmptyState
                title="Sem refeicoes"
                description="Adicione uma refeicao para o dia selecionado."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
