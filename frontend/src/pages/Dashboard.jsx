import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PesoChart from "../components/PesoChart.jsx";
import Skeleton from "../components/Skeleton.jsx";
import api from "../services/api.js";
import { getCurrentUser } from "../services/auth.js";
import { getLocalDateString, isPlanCompletedForDate } from "../utils/date.js";

const weekDays = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatNumber(value, fallback = "--") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  return Number(value).toLocaleString("pt-BR");
}

function StatCard({ label, value, suffix, detail, color = "var(--accent)" }) {
  return (
    <Card className="p-3.5">
      <p className="app-muted text-[11px] font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <p className="text-2xl font-semibold tracking-tight" style={{ color }}>
          {value}
        </p>
        {suffix && <span className="app-muted text-xs">{suffix}</span>}
      </div>
      {detail && <p className="app-muted mt-1 text-[11px]">{detail}</p>}
    </Card>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="app-text text-sm font-semibold">{title}</h2>
      {action}
    </div>
  );
}

function WeekOverview({ semana, todayName, onSelectDay }) {
  const todayIndex = weekDays.findIndex((day) => normalizeText(day) === normalizeText(todayName));
  const currentWeekStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    return date;
  }, []);
  const plannedByDay = useMemo(
    () =>
      semana.reduce((acc, plan) => {
        acc[normalizeText(plan.dia_semana)] = plan;
        return acc;
      }, {}),
    [semana],
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {weekDays.map((day, index) => {
        const plan = plannedByDay[normalizeText(day)];
        const active = index === todayIndex;
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(currentWeekStart.getDate() + index);
        const completed = isPlanCompletedForDate(plan, dayDate);
        const rest = !plan;
        const statusLabel = completed ? "Concluido" : active && plan ? "Disponivel hoje" : plan ? "Agendado" : "Recuperacao";

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(plan, day)}
            className={`min-w-0 rounded-lg border p-2.5 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-emerald-500/10 ${
              completed
                ? "border-[var(--success)] bg-[var(--success-soft)]"
                : active
                  ? "border-[var(--accent)] bg-emerald-500/10"
                  : "border-[var(--border)] bg-[var(--surface-muted)]"
            } ${rest ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${completed || active ? "text-emerald-500" : "app-muted"}`}>
                {weekLabels[index]}
              </p>
              {completed && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-label="Concluido" />
              )}
            </div>
            <p className={`mt-2 truncate text-xs font-semibold ${completed || active ? "text-emerald-500" : "app-text"}`}>
              {plan?.nome_treino || "Descanso"}
            </p>
            <p className="app-muted mt-1 truncate text-[10px]">
              {plan ? `${plan.exercicios?.length || 0} exercicios` : "Recuperacao"}
            </p>
            <p className={`mt-1 truncate text-[10px] font-medium ${completed ? "text-[var(--success)]" : active && plan ? "text-emerald-500" : "app-muted"}`}>
              {statusLabel}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function PRList({ prs }) {
  if (!prs.length) {
    return <EmptyState title="Sem PRs ainda" description="Registre treinos para calcular seus recordes." />;
  }

  return (
    <div className="space-y-1.5">
      {prs.slice(0, 5).map((record, index) => (
        <div
          key={record.exercicio}
          className="flex items-center gap-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2"
        >
          <span className="app-muted w-4 text-center text-[11px]">{index + 1}</span>
          <p className="app-text min-w-0 flex-1 truncate text-xs font-medium">{record.exercicio}</p>
          {index === 0 && (
            <span className="rounded bg-[var(--warning-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--warning)]">
              PR
            </span>
          )}
          <span className="text-xs font-semibold text-[var(--warning)]">{record.carga}kg</span>
        </div>
      ))}
    </div>
  );
}

function GoalList({ metas, prs }) {
  const prByExercise = useMemo(
    () =>
      prs.reduce((acc, pr) => {
        acc[normalizeText(pr.exercicio)] = pr;
        return acc;
      }, {}),
    [prs],
  );

  const visibleGoals = metas.slice(0, 3);

  if (!visibleGoals.length) {
    return <EmptyState title="Sem metas" description="Crie uma meta para acompanhar progresso." />;
  }

  return (
    <div className="space-y-2">
      {visibleGoals.map((meta) => {
        const current = Number(prByExercise[normalizeText(meta.exercicio)]?.carga || 0);
        const target = Number(meta.meta_carga || 0);
        const progress = meta.concluida ? 100 : target > 0 ? Math.min((current / target) * 100, 100) : 0;

        return (
          <div key={meta.id} className="rounded-lg bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="app-text min-w-0 truncate text-xs font-semibold">{meta.exercicio}</p>
              <span className="text-xs font-semibold text-emerald-500">{Math.round(progress)}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="app-muted text-[11px]">
                {formatNumber(current)} / {formatNumber(target)}kg
              </p>
              {meta.concluida && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  concluida
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [pesos, setPesos] = useState([]);
  const [prs, setPrs] = useState([]);
  const [metas, setMetas] = useState([]);
  const [semana, setSemana] = useState([]);
  const [dieta, setDieta] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [pesosRes, prsRes, metasRes, resumoRes, semanaRes, dietaRes] = await Promise.all([
          api.get("/peso"),
          api.get("/treinos/pr"),
          api.get("/metas"),
          api.get("/dashboard/resumo"),
          api.get("/semana"),
          api.get("/dieta"),
        ]);

        setPesos(pesosRes.data.data || []);
        setPrs(prsRes.data.data || []);
        setMetas(metasRes.data.data || []);
        setResumo(resumoRes.data.data || null);
        setSemana(semanaRes.data.data || []);
        setDieta(dietaRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || "Nao foi possivel carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const firstName = user?.user_metadata?.name || user?.email?.split("@")[0] || "atleta";
  const today = new Date();
  const todayName = weekDays[today.getDay()];
  const treinoHoje = useMemo(
    () => semana.find((treino) => normalizeText(treino.dia_semana) === normalizeText(todayName)),
    [semana, todayName],
  );
  const treinoHojeConcluido = isPlanCompletedForDate(treinoHoje, today);
  const pesoAtual = resumo?.peso_atual;
  const pesoVariacao = resumo?.peso_variacao;
  const todayDate = getLocalDateString(today);
  const dietaHoje = useMemo(
    () => dieta.filter((item) => String(item.data || "").slice(0, 10) === todayDate),
    [dieta, todayDate],
  );
  const caloriasHoje = dietaHoje.reduce((total, item) => total + Number(item.calorias || 0), 0);
  const proteinaHoje = dietaHoje.reduce((total, item) => total + Number(item.proteina || 0), 0);
  const metasConcluidas = resumo?.metas_concluidas ?? metas.filter((meta) => meta.concluida).length;
  const metasAtivas = resumo?.metas_ativas ?? metas.filter((meta) => !meta.concluida).length;

  function handleSelectWeekDay(plan, day) {
    if (plan?.id) {
      navigate("/treinos", { state: { diaSemana: plan.dia_semana } });
      return;
    }

    navigate("/semana", { state: { diaSemana: day } });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-500">Dashboard</p>
          <h1 className="app-text mt-1 text-2xl font-semibold tracking-tight">
            Bom treino, {firstName}
          </h1>
          <p className="app-muted mt-1 text-sm">
            {todayName} em progresso. Acompanhe treino, metas, peso e nutricao no mesmo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-soft px-3 py-1 text-xs font-semibold">
            {resumo?.treinos_concluidos_semana ?? 0} sessoes na semana
          </span>
          <Button
            type="button"
            onClick={() =>
              treinoHoje
                ? navigate("/treinos", { state: { diaSemana: treinoHoje.dia_semana } })
                : navigate("/semana")
            }
          >
            {treinoHojeConcluido ? "Ver treino" : treinoHoje ? "Iniciar treino" : "Planejar semana"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Treinos / semana"
            value={resumo?.treinos_concluidos_semana ?? 0}
            suffix="sessoes"
            detail={`${resumo?.treinos_total ?? 0} exercicios registrados`}
            color="var(--accent-bright)"
          />
          <StatCard
            label="Peso atual"
            value={pesoAtual ? pesoAtual.peso : "--"}
            suffix="kg"
            detail={
              pesoVariacao === null || pesoVariacao === undefined
                ? "sem comparativo"
                : `${pesoVariacao > 0 ? "+" : ""}${Number(pesoVariacao).toFixed(1)}kg`
            }
            color="var(--success)"
          />
          <StatCard
            label="Metas ativas"
            value={metasAtivas}
            suffix={`/ ${metas.length}`}
            detail={`${metasConcluidas} concluidas`}
            color="var(--warning)"
          />
          <StatCard
            label="Nutricao hoje"
            value={formatNumber(caloriasHoje)}
            suffix="kcal"
            detail={`${formatNumber(proteinaHoje)}g de proteina`}
            color="var(--warning)"
          />
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="grid gap-4">
          <Card>
            <SectionHeader
              title="Semana atual"
              action={
                <button
                  type="button"
                  className="text-xs font-semibold text-emerald-500"
                  onClick={() => navigate("/semana")}
                >
                  editar semana
                </button>
              }
            />
            <WeekOverview semana={semana} todayName={todayName} onSelectDay={handleSelectWeekDay} />
          </Card>

          <Card>
            <SectionHeader title="Recordes recentes" />
            <PRList prs={prs} />
          </Card>

          <Card>
            <SectionHeader title="Peso - tendencia" />
            <PesoChart data={pesos} />
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <SectionHeader
              title="Metas em progresso"
              action={
                <button
                  type="button"
                  className="text-xs font-semibold text-emerald-500"
                  onClick={() => navigate("/metas")}
                >
                  ver todas
                </button>
              }
            />
            <GoalList metas={metas} prs={prs} />
          </Card>

          <Card>
            <SectionHeader title="Treino de hoje" />
            {treinoHoje ? (
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="app-text text-sm font-semibold">{treinoHoje.nome_treino}</p>
                    <p className="app-muted mt-1 text-[11px]">
                      {treinoHoje.exercicios?.length || 0} exercicios planejados
                    </p>
                  </div>
                  <span className="badge-soft px-2 py-1 text-[10px] font-semibold">{todayName}</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {(treinoHoje.exercicios || []).slice(0, 4).map((exercise, index) => (
                    <div key={`${exercise.exercicio}-${index}`} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="app-text min-w-0 flex-1 truncate">{exercise.exercicio}</span>
                      <span className="app-muted">
                        {exercise.series || "-"}x{exercise.repeticoes || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Sem treino hoje" description="Defina sua semana para iniciar direto daqui." />
            )}
          </Card>

          <Card>
            <SectionHeader
              title="Dieta de hoje"
              action={
                <button
                  type="button"
                  className="text-xs font-semibold text-emerald-500"
                  onClick={() => navigate("/dieta")}
                >
                  registrar
                </button>
              }
            />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="app-muted text-[11px]">Calorias</p>
                <p className="mt-1 text-xl font-semibold text-[var(--warning)]">
                  {formatNumber(caloriasHoje)} kcal
                </p>
              </div>
              <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                <p className="app-muted text-[11px]">Proteina</p>
                <p className="mt-1 text-xl font-semibold text-[var(--success)]">
                  {formatNumber(proteinaHoje)}g
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {dietaHoje.slice(0, 4).map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2">
                  <span className="badge-soft px-2 py-0.5 text-[10px] font-semibold">{meal.refeicao}</span>
                  <p className="app-text min-w-0 flex-1 truncate text-xs">{meal.descricao || "Refeicao"}</p>
                  <span className="app-muted text-[11px]">{meal.calorias} kcal</span>
                </div>
              ))}
              {!dietaHoje.length && (
                <EmptyState title="Sem refeicoes hoje" description="Registre suas refeicoes para acompanhar macros." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
