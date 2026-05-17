import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DatePicker from "../components/DatePicker.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import PesoChart from "../components/PesoChart.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { formatDateBR } from "../utils/date.js";
import { getApiErrorMessage } from "../utils/errors.js";

const WEIGHT_GOAL_KEY = "fitprogress_weight_goal";
const periodOptions = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "Tudo", value: "all" },
];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function sortByDate(items) {
  return [...items].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
}

function getRecordDate(value) {
  return String(value || "").slice(0, 10);
}

function getWeightGoal() {
  try {
    const saved = JSON.parse(localStorage.getItem(WEIGHT_GOAL_KEY) || "null");
    return saved?.peso || "";
  } catch {
    localStorage.removeItem(WEIGHT_GOAL_KEY);
    return "";
  }
}

function formatWeight(value, fallback = "--") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}kg`;
}

function getDaysBetween(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  const date = new Date(`${getRecordDate(dateValue)}T00:00:00`);
  const diff = today.setHours(0, 0, 0, 0) - date.getTime();
  return Math.max(Math.floor(diff / 86400000), 0);
}

function groupByMonth(items) {
  return items.reduce((acc, item) => {
    const date = new Date(`${getRecordDate(item.data)}T00:00:00`);
    const key = Number.isNaN(date.getTime()) ? "Sem data" : monthFormatter.format(date);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function Peso() {
  const { showToast } = useToast();
  const [pesos, setPesos] = useState([]);
  const [form, setForm] = useState({ peso: "", data: "" });
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);
  const [weightGoal, setWeightGoal] = useState(getWeightGoal);
  const [weightGoalDraft, setWeightGoalDraft] = useState(() => getWeightGoal());
  const [showGoalEditor, setShowGoalEditor] = useState(false);

  async function load() {
    try {
      const { data } = await api.get("/peso");
      setPesos(data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Nao foi possivel carregar o peso."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pesosOrdenados = useMemo(() => sortByDate(pesos), [pesos]);
  const historicoRecente = useMemo(() => [...pesosOrdenados].reverse(), [pesosOrdenados]);
  const pesoAtual = pesosOrdenados.at(-1);
  const pesoAnterior = pesosOrdenados.at(-2);
  const variacao =
    pesoAtual && pesoAnterior ? Number(pesoAtual.peso || 0) - Number(pesoAnterior.peso || 0) : 0;
  const menorPeso = pesosOrdenados.length
    ? Math.min(...pesosOrdenados.map((item) => Number(item.peso || 0)))
    : 0;
  const maiorPeso = pesosOrdenados.length
    ? Math.max(...pesosOrdenados.map((item) => Number(item.peso || 0)))
    : 0;
  const registrosNoPeriodo = useMemo(() => {
    if (period === "all") return pesosOrdenados;

    const start = new Date();
    start.setDate(start.getDate() - Number(period));
    start.setHours(0, 0, 0, 0);

    return pesosOrdenados.filter((item) => new Date(`${getRecordDate(item.data)}T00:00:00`) >= start);
  }, [period, pesosOrdenados]);
  const firstPeriodWeight = registrosNoPeriodo.at(0);
  const lastPeriodWeight = registrosNoPeriodo.at(-1);
  const periodVariation =
    firstPeriodWeight && lastPeriodWeight
      ? Number(lastPeriodWeight.peso || 0) - Number(firstPeriodWeight.peso || 0)
      : 0;
  const trendLabel =
    registrosNoPeriodo.length < 2
      ? "--"
      : Math.abs(periodVariation) < 0.2
      ? "Estavel"
      : periodVariation > 0
        ? "Subindo"
        : "Descendo";
  const targetDiff = weightGoal && pesoAtual ? Number(pesoAtual.peso || 0) - Number(weightGoal) : null;
  const lastRecordDays = getDaysBetween(pesoAtual?.data);
  const groupedHistory = useMemo(() => groupByMonth(historicoRecente), [historicoRecente]);

  function updateWeightGoal(value) {
    setWeightGoal(value);
    localStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify({ peso: value }));
    showToast({ title: "Meta salva", message: "Sua meta de peso foi atualizada." });
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      const payload = { peso: Number(form.peso) };
      if (form.data) payload.data = form.data;

      await api.post("/peso", payload);
      setForm({ peso: "", data: "" });
      showToast({ title: "Peso salvo", message: "Evolucao atualizada." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel salvar o peso.");
      setError(message);
      showToast({ title: "Erro ao salvar peso", message, type: "error" });
    }
  }

  async function removePeso(item) {
    if (!window.confirm(`Remover registro de ${item.peso}kg?`)) return;

    try {
      setError("");
      await api.delete(`/peso/${item.id}`);
      showToast({ title: "Peso removido" });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Nao foi possivel remover o peso.");
      setError(message);
      showToast({ title: "Erro ao remover peso", message, type: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
              Peso
            </p>
            <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Evolucao corporal
            </h1>
            <p className="app-muted mt-2 max-w-2xl text-sm">
              Registre seu peso, acompanhe tendencias e mantenha uma meta visivel.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setWeightGoalDraft(weightGoal);
              setShowGoalEditor((current) => !current);
            }}
          >
            Meta de peso
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {showGoalEditor && (
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="Peso alvo"
              type="number"
              step="0.1"
              value={weightGoalDraft}
              onChange={(event) => setWeightGoalDraft(event.target.value)}
              placeholder="Ex: 80"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  updateWeightGoal(weightGoalDraft);
                  setShowGoalEditor(false);
                }}
              >
                Salvar meta
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowGoalEditor(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <p className="app-muted text-xs">Peso atual</p>
          <p className="app-text mt-2 text-2xl font-semibold">
            {pesoAtual ? formatWeight(pesoAtual.peso) : "--"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Ultima variacao</p>
          <p className={`mt-2 text-2xl font-semibold ${variacao >= 0 ? "app-text" : "text-emerald-500"}`}>
            {pesoAtual && pesoAnterior ? `${variacao > 0 ? "+" : ""}${variacao.toFixed(1)}kg` : "--"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Menor peso</p>
          <p className="app-text mt-2 text-2xl font-semibold">
            {menorPeso ? formatWeight(menorPeso) : "--"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Tendencia</p>
          <p className={`mt-2 text-2xl font-semibold ${trendLabel === "Descendo" ? "text-emerald-500" : "app-text"}`}>
            {trendLabel}
          </p>
          {registrosNoPeriodo.length >= 2 && (
            <p className="app-muted mt-1 text-xs">
              {periodVariation > 0 ? "+" : ""}
              {periodVariation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}kg no periodo
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Meta</p>
          <p className="app-text mt-2 text-2xl font-semibold">
            {weightGoal ? formatWeight(weightGoal) : "--"}
          </p>
          {targetDiff !== null && (
            <p className="app-muted mt-1 text-xs">
              {Math.abs(targetDiff).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}kg de diferenca
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Novo registro</h2>
          <p className="app-muted mt-1 text-sm">Use a data de hoje ou escolha um dia anterior.</p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Input
              label="Peso"
              type="number"
              step="0.1"
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
              required
            />
            <DatePicker
              label="Data"
              value={form.data}
              onChange={(data) => setForm({ ...form, data })}
            />
            <Button type="submit" className="w-full">
              Salvar peso
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="app-text text-lg font-semibold">Tendencia</h2>
              <p className="app-muted mt-1 text-sm">
                {maiorPeso ? `Faixa registrada: ${menorPeso.toFixed(1)}kg a ${maiorPeso.toFixed(1)}kg` : "Sem dados ainda"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  period === option.value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-emerald-500"
                    : "border-[var(--border)] app-muted hover:border-[var(--accent-border)] hover:text-emerald-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <PesoChart data={registrosNoPeriodo} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="app-text text-lg font-semibold">Historico</h2>
            <p className="app-muted mt-1 text-sm">
              {lastRecordDays === null
                ? "Sem registros recentes"
                : lastRecordDays === 0
                  ? "Ultimo registro hoje"
                  : `Ultimo registro ha ${lastRecordDays} dia${lastRecordDays === 1 ? "" : "s"}`}
            </p>
          </div>
          <span className="app-muted text-sm">{historicoRecente.length} registros</span>
        </div>

        <div className="mt-4 grid gap-5">
          {Object.entries(groupedHistory).map(([month, items]) => (
            <div key={month}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="app-text text-sm font-semibold capitalize">{month}</h3>
                <span className="app-muted text-xs">
                  {items.length} registro{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="app-surface-muted app-border flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
                  >
                    <div>
                      <p className="app-text font-semibold">{formatWeight(item.peso)}</p>
                      <p className="app-muted mt-1 text-sm">{formatDateBR(item.data)}</p>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => removePeso(item)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!pesos.length && (
            <EmptyState title="Sem registros" description="Adicione seu primeiro peso." />
          )}
        </div>
      </Card>
    </div>
  );
}
