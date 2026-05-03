import Card from "./Card.jsx";

export default function MetricCard({ label, value, hint, tone = "default" }) {
  const toneClass = tone === "success" ? "text-emerald-500" : "app-text";

  return (
    <Card>
      <p className="app-muted text-sm">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${toneClass}`}>{value}</p>
      {hint && <p className="app-muted mt-1 text-xs">{hint}</p>}
    </Card>
  );
}
