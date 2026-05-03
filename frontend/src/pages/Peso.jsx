import { useEffect, useState } from "react";

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

export default function Peso() {
  const { showToast } = useToast();
  const [pesos, setPesos] = useState([]);
  const [form, setForm] = useState({ peso: "", data: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/peso");
      setPesos(data.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar o peso."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();

    try {
      setError("");
      const payload = { peso: Number(form.peso) };
      if (form.data) payload.data = form.data;

      await api.post("/peso", payload);
      setForm({ peso: "", data: "" });
      showToast({ title: "Peso salvo", message: "Evolução atualizada." });
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Não foi possível salvar o peso.");
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
      const message = getApiErrorMessage(err, "Não foi possível remover o peso.");
      setError(message);
      showToast({ title: "Erro ao remover peso", message, type: "error" });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-emerald-500">Peso</p>
        <h1 className="app-text mt-1 text-3xl font-semibold tracking-tight">
          Evolução corporal
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Novo registro</h2>
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
              Salvar
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="app-text text-lg font-semibold">Gráfico</h2>
          <div className="mt-5">
            <PesoChart data={pesos} />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="app-text text-lg font-semibold">Histórico</h2>
        <div className="app-border mt-5 divide-y">
          {pesos.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="app-text font-medium">{item.peso}kg</p>
                <p className="app-muted mt-1 text-sm">{formatDateBR(item.data)}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => removePeso(item)}>
                Remover
              </Button>
            </div>
          ))}
          {!pesos.length && (
            <div className="py-4">
              <EmptyState title="Sem registros" description="Adicione seu primeiro peso." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
