import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import DatePicker from "../components/DatePicker.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { formatDateBR, getLocalDateString } from "../utils/date.js";
import { getApiErrorMessage } from "../utils/errors.js";

function buildExecutionFromPlan(plan) {
  return {
    treino_semana_id: plan?.id || "",
    nome_treino: plan?.nome_treino || "",
    data: getLocalDateString(),
    exercicios: (plan?.exercicios || []).map((exercise) => ({
      exercicio: exercise.exercicio,
      grupo: exercise.grupo || null,
      categoria: exercise.categoria || null,
      series: exercise.series || "",
      repeticoes_planejadas: exercise.repeticoes || "",
      carga_alvo: exercise.carga_alvo || "",
      carga: exercise.carga_alvo || "",
      repeticoes: exercise.repeticoes || "",
    })),
  };
}

export default function Treinos() {
  const location = useLocation();
  const { showToast } = useToast();
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [execution, setExecution] = useState(buildExecutionFromPlan(null));
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function selectPlan(plan) {
    setSelectedPlanId(plan.id);
    setExecution(buildExecutionFromPlan(plan));
  }

  async function load() {
    try {
      setLoading(true);
      const [weekResponse, sessionsResponse] = await Promise.all([
        api.get("/semana"),
        api.get("/treinos/sessoes"),
      ]);

      const plans = weekResponse.data.data || [];
      const requestedPlanId = location.state?.treinoSemanaId;
      const planToSelect =
        plans.find((plan) => plan.id === requestedPlanId) ||
        plans.find((plan) => plan.id === selectedPlanId) ||
        plans[0];

      setWeeklyPlans(plans);
      setSessoes(sessionsResponse.data.data || []);

      if (planToSelect) {
        selectPlan(planToSelect);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os treinos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedPlan = useMemo(
    () => weeklyPlans.find((plan) => plan.id === selectedPlanId),
    [selectedPlanId, weeklyPlans],
  );

  const lastByExercise = useMemo(() => {
    const records = {};

    sessoes.forEach((sessao) => {
      (sessao.exercicios || []).forEach((treino) => {
        const key = treino.exercicio?.toLowerCase();
        if (!key || records[key]) return;
        records[key] = treino;
      });
    });

    return records;
  }, [sessoes]);

  function updateExercise(index, field, value) {
    setExecution((current) => ({
      ...current,
      exercicios: current.exercicios.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!selectedPlan) {
      setError("Cadastre um treino na aba Semana antes de registrar a execução.");
      return;
    }

    try {
      setError("");
      const payload = {
        nome_treino: execution.nome_treino,
        data: execution.data,
        exercicios: execution.exercicios.map((item) => ({
          exercicio: item.exercicio,
          grupo: item.grupo || null,
          categoria: item.categoria || null,
          series: item.series ? Number(item.series) : null,
          carga: Number(item.carga),
          repeticoes: Number(item.repeticoes),
        })),
      };

      await api.post("/treinos/sessao", payload);
      setExecution(buildExecutionFromPlan(selectedPlan));
      showToast({
        title: "Treino registrado",
        message: `${selectedPlan.nome_treino} foi salvo no histórico.`,
      });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível registrar o treino.");
      setError(message);
      showToast({ title: "Erro ao salvar treino", message, type: "error" });
    }
  }

  async function removeTreino(treino) {
    if (!window.confirm(`Remover ${treino.exercicio}?`)) return;

    try {
      setError("");
      await api.delete(`/treinos/${treino.id}`);
      showToast({ title: "Exercício removido", message: "O registro saiu da sessão." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível remover o exercício.");
      setError(message);
      showToast({ title: "Erro ao remover exercício", message, type: "error" });
    }
  }

  const filteredSessoes = sessoes.filter((sessao) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      sessao.nome_treino.toLowerCase().includes(term) ||
      sessao.exercicios.some((treino) => treino.exercicio.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-500">Treinos</p>
        <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">
          Executar treino da semana
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Treino de hoje</h2>
              <p className="app-muted mt-1 text-sm">
                Selecione um treino planejado e registre séries, cargas e repetições.
              </p>
            </div>
            {selectedPlan && (
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                {selectedPlan.dia_semana}
              </span>
            )}
          </div>

          {loading && <p className="app-muted mt-5 text-sm">Carregando treinos da semana...</p>}

          {!loading && !weeklyPlans.length && (
            <div className="mt-5">
              <EmptyState
                title="Nenhum treino semanal cadastrado"
                description="Cadastre sua rotina na aba Semana para registrar os treinos por aqui."
              />
            </div>
          )}

          {!loading && weeklyPlans.length > 0 && (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <Select
                label="Treino planejado"
                options={weeklyPlans.map((plan) => ({
                  value: plan.id,
                  label: `${plan.dia_semana} - ${plan.nome_treino}`,
                }))}
                value={selectedPlanId}
                onChange={(planId) => {
                  const plan = weeklyPlans.find((item) => item.id === planId);
                  if (plan) selectPlan(plan);
                }}
              />

              <DatePicker
                label="Data"
                value={execution.data}
                onChange={(data) => setExecution({ ...execution, data })}
              />

              <div className="space-y-3">
                {execution.exercicios.map((item, index) => {
                  const last = lastByExercise[item.exercicio.toLowerCase()];

                  return (
                    <div
                      key={`${item.exercicio}-${index}`}
                      className="app-surface-muted app-border rounded-xl border p-3 sm:p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="app-text text-sm font-semibold">{item.exercicio}</p>
                          <p className="app-muted mt-1 text-xs">
                            {[item.grupo, item.categoria].filter(Boolean).join(" - ")}
                          </p>
                          {last && (
                            <p className="mt-2 text-xs font-medium text-emerald-500">
                              Último: {last.series || 1}x {last.carga}kg x {last.repeticoes}
                            </p>
                          )}
                        </div>
                        <span className="w-fit rounded-lg bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-400">
                          Planejado: {item.series || "-"}x{item.repeticoes_planejadas || "-"}
                          {item.carga_alvo ? ` - ${item.carga_alvo}kg` : ""}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Input
                          label="Séries realizadas"
                          type="number"
                          value={item.series}
                          onChange={(event) => updateExercise(index, "series", event.target.value)}
                          required
                        />
                        <Input
                          label="Carga realizada"
                          type="number"
                          step="0.5"
                          value={item.carga}
                          onChange={(event) => updateExercise(index, "carga", event.target.value)}
                          required
                        />
                        <Input
                          label="Repetições realizadas"
                          type="number"
                          value={item.repeticoes}
                          onChange={(event) =>
                            updateExercise(index, "repeticoes", event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button type="submit" className="w-full">
                Salvar treino realizado
              </Button>
            </form>
          )}
        </Card>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="app-text text-lg font-semibold">Histórico por sessão</h2>
            <input
              className="app-surface app-text app-border rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Filtrar treino"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mt-5 space-y-4">
            {filteredSessoes.map((sessao) => (
              <div key={sessao.sessao_id} className="app-surface-muted app-border rounded-xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="app-text font-semibold">{sessao.nome_treino}</p>
                    <p className="app-muted mt-1 text-sm">{formatDateBR(sessao.data)}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                    {sessao.exercicios.length} exercícios
                  </span>
                </div>

                <div className="app-border mt-4 divide-y">
                  {sessao.exercicios.map((treino) => (
                    <div
                      key={treino.id}
                      className="grid gap-3 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                    >
                      <div>
                        <p className="app-text font-medium">{treino.exercicio}</p>
                        {(treino.grupo || treino.categoria) && (
                          <p className="app-muted mt-1 text-xs">
                            {[treino.grupo, treino.categoria].filter(Boolean).join(" - ")}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-emerald-500">
                        {treino.series || 1}x {treino.carga}kg x {treino.repeticoes}
                      </p>
                      <Button type="button" variant="ghost" onClick={() => removeTreino(treino)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!filteredSessoes.length && (
              <EmptyState
                title="Nenhum treino encontrado"
                description="Registre um treino planejado para começar seu histórico."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
