import { useEffect, useMemo, useState } from "react";

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

const mealTypes = [
  "Café",
  "Almoço",
  "Janta",
  "Pré treino",
  "Pós treino",
  "Lanche",
  "Refeição livre",
];

function createInitialForm(date = getLocalDateString()) {
  return {
    calorias: "",
    proteina: "",
    data: date,
    refeicao: "Café",
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
      setError(getApiErrorMessage(err, "Não foi possível carregar a nutrição."));
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
        data: form.data,
      };

      await api.post("/dieta", payload);
      setForm(createInitialForm(selectedDate));
      showToast({ title: "Refeição salva", message: "Resumo nutricional atualizado." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível salvar a refeição.");
      setError(message);
      showToast({ title: "Erro ao salvar refeição", message, type: "error" });
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
      const message = getApiErrorMessage(err, "Não foi possível remover o registro.");
      setError(message);
      showToast({ title: "Erro ao remover registro", message, type: "error" });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-500">Dieta</p>
          <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">Nutrição</h1>
        </div>
        <DatePicker
          label="Dia"
          value={selectedDate}
          onChange={updateSelectedDate}
          className="sm:w-56"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="app-muted text-sm">Calorias do dia</p>
          <p className="app-text mt-3 text-3xl font-semibold">{totals.calorias}</p>
        </Card>
        <Card>
          <p className="app-muted text-sm">Proteína do dia</p>
          <p className="app-text mt-3 text-3xl font-semibold">{totals.proteina}g</p>
        </Card>
        <Card>
          <p className="app-muted text-sm">Refeições</p>
          <p className="app-text mt-3 text-3xl font-semibold">{registrosDoDia.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Nova refeição</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Select
              label="Tipo"
              options={mealTypes}
              value={form.refeicao}
              onChange={(refeicao) => setForm({ ...form, refeicao })}
            />

            <label className="block">
              <span className="app-label mb-2 block text-sm font-semibold">
                Alimentos da refeição
              </span>
              <textarea
                className="app-control min-h-24 w-full resize-y px-3.5 py-2.5 text-sm placeholder:text-gray-500"
                placeholder="Ex: arroz, frango, salada e banana"
                value={form.descricao}
                onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                maxLength={500}
              />
            </label>

            <Input
              label="Calorias"
              type="number"
              value={form.calorias}
              onChange={(event) => setForm({ ...form, calorias: event.target.value })}
              required
            />
            <Input
              label="Proteína"
              type="number"
              value={form.proteina}
              onChange={(event) => setForm({ ...form, proteina: event.target.value })}
              required
            />
            <DatePicker
              label="Data"
              value={form.data}
              onChange={(data) => setForm({ ...form, data })}
            />
            <Button type="submit" className="w-full">
              Salvar refeição
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="app-text text-lg font-semibold">Histórico do dia</h2>
          <div className="app-border mt-5 divide-y">
            {registrosDoDia.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="app-text font-medium">{item.refeicao || "Refeição"}</p>
                  {item.descricao && (
                    <p className="app-muted mt-1 max-w-2xl text-sm">{item.descricao}</p>
                  )}
                  <p className="app-muted mt-1 text-sm">
                    {item.calorias} kcal - {item.proteina}g proteína
                  </p>
                </div>
                <p className="app-muted text-sm">{formatDateBR(item.data)}</p>
                <Button type="button" variant="ghost" onClick={() => removeDieta(item)}>
                  Remover
                </Button>
              </div>
            ))}
            {!registrosDoDia.length && (
              <div className="py-4">
                <EmptyState
                  title="Sem refeições"
                  description="Adicione uma refeição para o dia selecionado."
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
