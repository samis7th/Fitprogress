const sizeClasses = {
  sm: "h-10 w-10 rounded-xl",
  md: "h-14 w-14 rounded-2xl",
  lg: "h-20 w-20 rounded-2xl",
};

export default function BrandLogo({ size = "sm", className = "" }) {
  return (
    <img
      src="/brand-logo.png"
      alt="FitProgress"
      className={`shrink-0 object-cover shadow-sm shadow-black/20 ${sizeClasses[size]} ${className}`}
      loading="eager"
    />
  );
}
