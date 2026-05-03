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
          <CartesianGrid stroke="#1F2937" strokeDasharray="4 4" />
          <XAxis dataKey="dataFormatada" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#030712",
              border: "1px solid #1F2937",
              borderRadius: 12,
              color: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#34D399"
            strokeWidth={3}
            dot={{ r: 4, fill: "#34D399" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
