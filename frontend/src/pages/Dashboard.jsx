import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PesoChart from "../components/PesoChart.jsx";
import PRCard from "../components/PRCard.jsx";
import Skeleton from "../components/Skeleton.jsx";
import api from "../services/api.js";
import { getCurrentUser } from "../services/auth.js";

const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [treinos, setTreinos] = useState([]);
  const [pesos, setPesos] = useState([]);
  const [prs, setPrs] = useState([]);
  const [metas, setMetas] = useState([]);
  const [semana, setSemana] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [treinosRes, pesosRes, prsRes, metasRes, resumoRes, semanaRes] = await Promise.all([
          api.get("/treinos"),
          api.get("/peso"),
          api.get("/treinos/pr"),
          api.get("/metas"),
          api.get("/dashboard/resumo"),
          api.get("/semana"),
        ]);

        setTreinos(treinosRes.data.data || []);
        setPesos(pesosRes.data.data || []);
        setPrs(prsRes.data.data || []);
        setMetas(metasRes.data.data || []);
        setSemana(semanaRes.data.data || []);
        setResumo(resumoRes.data.data || null);
      } catch (err) {
        setError(err.response?.data?.detail || "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const firstName = user?.user_metadata?.name || user?.email?.split("@")[0] || "atleta";
  const todayName = weekDays[new Date().getDay()];
  const treinoHoje = useMemo(
    () => semana.find((treino) => normalizeText(treino.dia_semana) === normalizeText(todayName)),
    [semana, todayName],
  );
  const melhorPr = resumo?.melhor_pr;
  const pesoAtual = resumo?.peso_atual;
  const pesoVariacao = resumo?.peso_variacao;
  const metasAtivas = metas.filter((meta) => !meta.concluida).length;

  const stats = [
    {
      label: "Treinos concluídos",
      value: loading ? "..." : resumo?.treinos_concluidos_semana ?? 0,
      hint: "na semana",
      tone: "success",
    },
    {
      label: "Total de sessões",
      value: loading ? "..." : resumo?.treinos_concluidos_total ?? 0,
      hint: `${resumo?.treinos_total ?? 0} exercícios registrados`,
    },
    {
      label: "Peso atual",
      value: pesoAtual ? `${pesoAtual.peso}kg` : "--",
      hint:
        pesoVariacao === null || pesoVariacao === undefined
          ? "sem comparativo"
          : `${pesoVariacao > 0 ? "+" : ""}${Number(pesoVariacao).toFixed(1)}kg`,
    },
    {
      label: "Metas ativas",
      value: loading ? "..." : resumo?.metas_ativas ?? metasAtivas,
      hint: "acompanhe progresso",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-500">Olá, {firstName}</p>
          <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">
            Seu progresso em foco.
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm">
            Acompanhe consistência, peso, metas e recordes pessoais.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            treinoHoje
              ? navigate("/treinos", { state: { treinoSemanaId: treinoHoje.id } })
              : navigate("/semana")
          }
        >
          {treinoHoje ? `Iniciar ${treinoHoje.nome_treino}` : "Planejar semana"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Treino de hoje</h2>
              <p className="app-muted mt-1 text-sm">{todayName}</p>
            </div>
            {treinoHoje && (
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                {treinoHoje.exercicios?.length || 0} exercícios
              </span>
            )}
          </div>
          <div className="mt-5">
            {treinoHoje ? (
              <div className="app-surface-muted app-border rounded-xl border p-5">
                <p className="app-text font-semibold">{treinoHoje.nome_treino}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(treinoHoje.exercicios || []).slice(0, 5).map((exercise, index) => (
                    <span
                      key={`${exercise.exercicio}-${index}`}
                      className="rounded-lg bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-400"
                    >
                      {exercise.exercicio}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Sem treino para hoje"
                description="Defina sua rotina semanal para iniciar direto pelo dashboard."
              />
            )}
          </div>
        </Card>

        <Card>
          <h2 className="app-text text-lg font-semibold">Recorde principal</h2>
          <div className="mt-5">
            {melhorPr ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm text-emerald-500">{melhorPr.exercicio}</p>
                <p className="mt-3 text-4xl font-semibold text-emerald-400">
                  {melhorPr.carga}kg
                </p>
                <p className="app-muted mt-2 text-sm">melhor carga registrada</p>
              </div>
            ) : (
              <EmptyState
                title="Sem PRs ainda"
                description="Registre treinos para calcular seus recordes."
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5">
            <h2 className="app-text text-lg font-semibold">Peso</h2>
            <p className="app-muted mt-1 text-sm">Tendência corporal</p>
          </div>
          <PesoChart data={pesos} />
        </Card>

        <Card>
          <h2 className="app-text text-lg font-semibold">Consistência semanal</h2>
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-500">Treinos concluídos</p>
            <p className="mt-3 text-4xl font-semibold text-emerald-400">
              {resumo?.treinos_concluidos_semana ?? 0}
            </p>
            <p className="app-muted mt-2 text-sm">
              sessões registradas nos últimos 7 dias
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="app-text text-lg font-semibold">PRs recentes</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {prs.slice(0, 4).map((record) => (
            <PRCard key={record.exercicio} record={record} />
          ))}
          {!prs.length && (
            <EmptyState title="Sem dados" description="Adicione treinos para ver PRs." />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="app-text text-lg font-semibold">Insight rápido</h2>
        <div className="mt-4">
          {treinos.length === 0 && (
            <EmptyState
              title="Comece por um treino"
              description="Registre seu primeiro treino para liberar PRs e insights."
            />
          )}
          {treinos.length > 0 && metas.length === 0 && (
            <EmptyState
              title="Defina uma meta"
              description="Escolha uma carga alvo para transformar seus PRs em progresso visual."
            />
          )}
          {treinos.length > 0 && metas.length > 0 && (
            <div className="app-surface-muted app-border rounded-xl border p-5">
              <p className="app-text font-medium">Base pronta</p>
              <p className="app-muted mt-1 text-sm">
                Continue registrando treinos para comparar semana a semana.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
