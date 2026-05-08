import BrandLogo from "./BrandLogo.jsx";

export default function AuthShell({
  children,
  error,
  footer,
  onSubmit,
  submit,
  subtitle,
  title,
}) {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 py-6 text-white sm:px-6 lg:px-8"
      style={{
        "--surface": "rgba(255,255,255,0.045)",
        "--surface-muted": "rgba(255,255,255,0.035)",
        "--border": "rgba(255,255,255,0.12)",
        "--border-strong": "rgba(255,255,255,0.18)",
        "--text": "#ffffff",
        "--muted": "rgba(255,255,255,0.58)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,212,170,.20),transparent_30rem),linear-gradient(135deg,#020617_0%,#07111f_48%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.34)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,.20),rgba(255,255,255,.035)_48%,transparent)] px-6 py-5">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <p className="text-lg font-semibold tracking-tight">FitProgress</p>
                <p className="text-sm text-white/50">Dashboard de performance</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-7">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">{subtitle}</p>
            </div>

            <div className="mt-6 space-y-4">{children}</div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="mt-6">{submit}</div>

            <div className="mt-6 text-center text-sm text-white/50">{footer}</div>
          </form>
        </div>
      </div>
    </main>
  );
}
