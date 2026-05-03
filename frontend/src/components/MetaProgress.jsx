export default function MetaProgress({ meta, atual = 0 }) {
  const cargaAtual = typeof atual === "object" ? Number(atual.carga || 0) : Number(atual || 0);
  const repeticoesAtuais = typeof atual === "object" ? Number(atual.repeticoes || 0) : 0;
  const metaCarga = Number(meta.meta_carga || 0);
  const metaRepeticoes = Number(meta.meta_repeticoes || 0);
  const cargaSuficiente = metaCarga > 0 && cargaAtual >= metaCarga;
  const repeticoesSuficientes = !metaRepeticoes || repeticoesAtuais >= metaRepeticoes;
  const atingidaAutomaticamente = cargaSuficiente && repeticoesSuficientes;
  const progressoAutomatico =
    meta.meta_carga > 0 ? Math.min((cargaAtual / meta.meta_carga) * 100, 100) : 0;
  const concluidaManual = Boolean(meta.concluida);
  const progresso = concluidaManual || atingidaAutomaticamente ? 100 : progressoAutomatico;
  const restante = concluidaManual ? 0 : Math.max(Number(meta.meta_carga) - cargaAtual, 0);

  return (
    <div className="app-surface-muted app-border rounded-xl border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-text font-semibold leading-tight">{meta.exercicio}</p>
            {concluidaManual && (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                Concluída
              </span>
            )}
            {!concluidaManual && atingidaAutomaticamente && (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                Atingida
              </span>
            )}
          </div>
          <p className="app-muted mt-1 text-sm leading-snug">
            {cargaAtual.toFixed(1)} / {Number(meta.meta_carga).toFixed(1)}kg
            {meta.meta_repeticoes ? ` - alvo ${meta.meta_repeticoes} reps` : ""}
          </p>
          {repeticoesAtuais > 0 && (
            <p className="app-muted mt-1 text-xs">
              Atual: {cargaAtual.toFixed(1)}kg x {repeticoesAtuais}
            </p>
          )}
          <p className="mt-1 text-xs leading-snug text-emerald-500">
            {concluidaManual
              ? "Meta marcada como concluída"
              : atingidaAutomaticamente
                ? "Meta atingida automaticamente"
                : `Faltam ${restante.toFixed(1)}kg`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">
          {Math.round(progresso)}%
        </span>
      </div>
      <div className="app-border mt-3 h-2 overflow-hidden rounded-full border">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${progresso}%` }}
        />
      </div>
    </div>
  );
}
