export default function EmptyState({ title, description, action }) {
  return (
    <div className="app-surface-muted app-border rounded-xl border border-dashed p-6 text-center">
      <p className="app-text font-medium">{title}</p>
      {description && <p className="app-muted mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
