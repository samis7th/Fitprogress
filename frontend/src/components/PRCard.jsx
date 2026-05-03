export default function PRCard({ record }) {
  return (
    <div className="app-surface-muted app-border rounded-xl border p-4">
      <p className="app-muted text-sm">{record.exercicio}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="app-text text-2xl font-semibold">{record.carga}</span>
        <span className="app-muted text-sm">kg</span>
      </div>
    </div>
  );
}
