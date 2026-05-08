export default function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-emerald-500 text-gray-950 hover:bg-emerald-400 shadow-sm shadow-black/10",
    secondary: "app-surface app-text border border-[var(--border-strong)] hover:border-emerald-500/40 hover:bg-emerald-500/10",
    ghost: "app-muted hover:bg-emerald-500/10 hover:text-emerald-500",
    danger: "text-red-400 hover:bg-red-500/10 hover:text-red-300",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
