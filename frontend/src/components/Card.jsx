export default function Card({ children, className = "" }) {
  return (
    <section className={`app-surface min-w-0 rounded-2xl border p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}
