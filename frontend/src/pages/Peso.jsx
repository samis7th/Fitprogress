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

function sortByDate(items) {
  return [...items].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
}

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
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
          Peso
        </p>
        <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Evolucao corporal
        </h1>
        <p className="app-muted mt-2 max-w-2xl text-sm">
          Registre seu peso e acompanhe a tendencia de forma simples.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="app-muted text-xs">Peso atual</p>
          <p className="app-text mt-2 text-2xl font-semibold">
            {pesoAtual ? `${Number(pesoAtual.peso).toFixed(1)}kg` : "--"}
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
            {menorPeso ? `${menorPeso.toFixed(1)}kg` : "--"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="app-muted text-xs">Registros</p>
          <p className="app-text mt-2 text-2xl font-semibold">{pesos.length}</p>
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
          <div className="mt-5">
            <PesoChart data={pesosOrdenados} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-text text-lg font-semibold">Historico</h2>
          <span className="app-muted text-sm">{historicoRecente.length} registros</span>
        </div>

        <div className="mt-4 grid gap-2">
          {historicoRecente.map((item) => (
            <div
              key={item.id}
              className="app-surface-muted app-border flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
            >
              <div>
                <p className="app-text font-semibold">{Number(item.peso).toFixed(1)}kg</p>
                <p className="app-muted mt-1 text-sm">{formatDateBR(item.data)}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => removePeso(item)}>
                Remover
              </Button>
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
