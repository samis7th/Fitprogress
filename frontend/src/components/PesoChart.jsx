import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateBR } from "../utils/date.js";

export default function PesoChart({ data }) {
  if (!data.length) {
    return (
      <div className="app-border app-muted flex h-72 items-center justify-center rounded-xl border border-dashed text-sm">
        Nenhum registro de peso ainda.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    dataFormatada: formatDateBR(item.data),
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,.16)" strokeDasharray="4 4" />
          <XAxis dataKey="dataFormatada" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              color: "var(--text)",
            }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="var(--accent)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--accent)" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
