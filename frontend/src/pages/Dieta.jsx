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
    () => registros.filter((item) => item.data === selectedDate),
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
    () =>
      mealTypes.map((tipo) => ({
        tipo,
        total: registrosDoDia.filter((item) => item.refeicao === tipo).length,
      })),
    [registrosDoDia],
  );

  function updateSelectedDate(value) {
    setSelectedDate(value);
    setForm((current) => ({ ...current, data: value }));
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
        <DatePicker
          label="Dia"
          value={selectedDate}
          onChange={updateSelectedDate}
          className="w-full sm:w-56"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="app-muted text-xs">Calorias do dia</p>
          <p className="app-text mt-2 text-2xl font-semibold">{totals.calorias}</p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Proteina do dia</p>
          <p className="app-text mt-2 text-2xl font-semibold">{totals.proteina}g</p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Refeicoes</p>
          <p className="app-text mt-2 text-2xl font-semibold">{registrosDoDia.length}</p>
        </Card>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {refeicoesPorTipo.map((item) => (
            <button
              key={item.tipo}
              type="button"
              onClick={() => setForm((current) => ({ ...current, refeicao: item.tipo }))}
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
          <h2 className="app-text text-lg font-semibold">Nova refeicao</h2>
          <p className="app-muted mt-1 text-sm">
            Refeicao: <span className="app-text font-semibold">{form.refeicao}</span>
          </p>

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
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="app-text text-lg font-semibold">Historico do dia</h2>
              <p className="app-muted mt-1 text-sm">{formatDateBR(selectedDate)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {registrosDoDia.map((item) => (
              <div key={item.id} className="app-surface-muted app-border rounded-2xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
                      {item.refeicao || "Refeicao"}
                    </p>
                    {item.descricao && (
                      <p className="app-text mt-2 text-sm font-medium leading-6">{item.descricao}</p>
                    )}
                    <p className="app-muted mt-2 text-sm">
                      {item.calorias} kcal - {item.proteina}g proteina
                    </p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeDieta(item)}>
                    Remover
                  </Button>
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
