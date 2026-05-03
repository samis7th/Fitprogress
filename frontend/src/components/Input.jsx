export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="app-label mb-1.5 block text-sm font-semibold">{label}</span>}
      <input
        className={`app-control w-full px-3.5 py-2.5 text-sm placeholder:text-gray-500 ${className}`}
        {...props}
      />
    </label>
  );
}
