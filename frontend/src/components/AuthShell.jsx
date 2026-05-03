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
      className="relative min-h-screen overflow-hidden bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-8"
      style={{
        "--surface": "rgba(255,255,255,0.045)",
        "--surface-muted": "rgba(255,255,255,0.035)",
        "--border": "rgba(255,255,255,0.12)",
        "--text": "#ffffff",
        "--muted": "rgba(255,255,255,0.56)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#07111f_48%,#020617_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,.18),rgba(255,255,255,.035)_45%,transparent)] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <p className="text-lg font-semibold tracking-tight">FitProgress</p>
                <p className="text-sm text-white/50">Dashboard de performance</p>
              </div>
            </div>
          </div>

          <section className="flex items-center justify-center px-5 py-8 sm:px-8">
            <form onSubmit={onSubmit} className="w-full max-w-sm">
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-white/55">{subtitle}</p>
              </div>

              <div className="mt-8 space-y-4">{children}</div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div className="mt-6">{submit}</div>

              <div className="mt-6 text-center text-sm text-white/50">{footer}</div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
