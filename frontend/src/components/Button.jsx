export default function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-emerald-500 text-gray-950 hover:bg-emerald-400",
    secondary: "app-surface app-text border hover:border-emerald-500/40",
    ghost: "app-muted hover:bg-emerald-500/10 hover:text-emerald-500",
  };

  return (
    <button
      type="button"
      className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
