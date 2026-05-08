export default function Card({ children, className = "" }) {
  return (
    <section className={`app-surface min-w-0 rounded-xl border border-[var(--border)] p-4 transition duration-200 ease-out ${className}`}>
      {children}
    </section>
  );
}
