/**
 * Esqueleto exibido enquanto o painel busca os dados no Postgres.
 * Mantém a navegação fluida mesmo quando a consulta demora.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-56 rounded-lg bg-white/[0.07]" />
        <div className="h-4 w-full max-w-md rounded bg-white/[0.05]" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="mt-3 h-6 w-24 rounded bg-white/[0.09]" />
            <div className="mt-2 h-3 w-20 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="card p-5">
          <div className="h-4 w-32 rounded bg-white/[0.07]" />
          <div className="mt-4 h-40 rounded-xl bg-white/[0.04]" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 rounded bg-white/[0.05]" style={{ width: `${90 - i * 12}%` }} />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="h-4 w-24 rounded bg-white/[0.07]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-white/25">carregando seus dados…</p>
    </div>
  );
}
