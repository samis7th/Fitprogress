import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateBR } from "../utils/date.js";

function formatWeight(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
  return `${Number(value).toLocaleString("pt-BR")}kg`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const weight = payload[0]?.value;

  return (
    <div className="app-surface-raised app-border rounded-xl border px-3 py-2 shadow-xl">
      <p className="app-muted text-[11px] font-medium">{label}</p>
      <p className="app-text mt-1 text-sm font-semibold">{formatWeight(weight)}</p>
    </div>
  );
}

export default function PesoChart({ data }) {
  const chartData = data
    .map((item) => ({
      ...item,
      peso: Number(item.peso),
      dataFormatada: formatDateBR(item.data),
      rawDate: item.data,
    }))
    .filter((item) => !Number.isNaN(item.peso))
    .sort((a, b) => String(a.rawDate || "").localeCompare(String(b.rawDate || "")));

  if (!chartData.length) {
    return (
      <div className="app-border flex h-72 items-center justify-center rounded-2xl border border-dashed bg-[var(--surface-muted)]/45 p-6 text-center">
        <div>
          <p className="app-text text-sm font-semibold">Nenhum registro de peso</p>
          <p className="app-muted mt-1 text-xs">Adicione seu primeiro peso para visualizar a tendencia.</p>
        </div>
      </div>
    );
  }

  const weights = chartData.map((item) => item.peso);
  const latest = chartData.at(-1);
  const previous = chartData.at(-2);
  const variation = latest && previous ? latest.peso - previous.peso : null;
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const yPadding = Math.max((maxWeight - minWeight) * 0.18, 2);
  const yDomain = [Math.floor(minWeight - yPadding), Math.ceil(maxWeight + yPadding)];

  return (
    <div className="overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--surface-muted),transparent)] p-3">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="app-muted text-[11px] font-medium">Peso atual</p>
          <p className="app-text mt-1 text-2xl font-semibold tracking-tight">
            {formatWeight(latest?.peso)}
          </p>
        </div>
        {variation !== null && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              variation >= 0
                ? "bg-[var(--accent-soft)] text-emerald-500"
                : "bg-[var(--success-soft)] text-[var(--success)]"
            }`}
          >
            {variation > 0 ? "+" : ""}
            {variation.toLocaleString("pt-BR")}kg desde o ultimo registro
          </span>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.34} />
                <stop offset="55%" stopColor="var(--accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" strokeDasharray="3 8" vertical={false} />
            <XAxis
              dataKey="dataFormatada"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(value) => `${value}kg`}
              domain={yDomain}
              width={42}
            />
            <Tooltip cursor={{ stroke: "var(--accent)", strokeOpacity: 0.22 }} content={<CustomTooltip />} />
            {latest && (
              <ReferenceLine
                y={latest.peso}
                stroke="var(--accent)"
                strokeOpacity={0.18}
                strokeDasharray="4 6"
              />
            )}
            <Area
              type="monotone"
              dataKey="peso"
              stroke="var(--accent)"
              strokeWidth={3}
              fill="url(#pesoGradient)"
              dot={{
                r: 3,
                fill: "var(--surface)",
                stroke: "var(--accent)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "var(--accent)",
                stroke: "var(--surface-raised)",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
