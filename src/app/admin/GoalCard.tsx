import Link from 'next/link';
import { brl, pct } from '@/lib/format';
import type { GoalProgress, MonthStats } from '@/lib/stats';

/**
 * Cartão "meta do mês". Todos os números vêm do banco: nada é inventado.
 * Sem meta definida o cartão vira um convite para escolher uma.
 */
export function GoalCard({
  month,
  goal,
  isDemo,
}: {
  month: MonthStats;
  goal: GoalProgress;
  isDemo: boolean;
}) {
  const diff = month.prevTotal > 0 ? ((month.total - month.prevTotal) / month.prevTotal) * 100 : null;

  if (!goal.hasGoal) {
    return (
      <section className="card relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300">
              Meta de {month.shortLabel}
            </p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {month.total > 0 ? `Você já fez ${brl(month.total)} neste mês` : 'Defina quanto quer ganhar este mês'}
            </p>
            <p className="mt-1 max-w-xl text-xs leading-snug text-white/45">
              Sem meta não existe progresso — só números soltos. Escolha um valor e o painel mostra quanto falta e se
              você está no ritmo certo para bater até dia {month.daysInMonth}.
            </p>
          </div>
          <Link href="/admin/configuracoes" className="btn-primary btn-sm shrink-0">
            Definir meta
          </Link>
        </div>
      </section>
    );
  }

  const barColor = goal.hit ? '#b6f24a' : goal.onTrack ? '#8d78fd' : '#f5a524';
  const width = Math.min(100, Math.max(goal.current > 0 ? 2 : 0, goal.progress));

  return (
    <section className="card relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300">
              Meta de {month.shortLabel}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {brl(goal.current)}
              <span className="ml-1.5 text-sm font-medium text-white/40">de {brl(goal.goal)}</span>
            </p>
          </div>
          <div className="text-right">
            {goal.hit ? (
              <span className="badge bg-lime-500/15 text-lime-300 ring-lime-500/25">✓ meta batida</span>
            ) : (
              <p className="text-sm font-semibold text-white/80">{pct(goal.progress, 0)}</p>
            )}
            <p className="mt-1 text-[11px] text-white/35">
              faltam {brl(goal.remaining)} · {goal.daysLeft} dia{goal.daysLeft === 1 ? '' : 's'} restante
              {goal.daysLeft === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${width}%`, background: barColor }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/45">
          <span>
            Comissões <b className="text-white/75">{brl(month.commission)}</b>
          </span>
          <span>
            Infoprodutos <b className="text-white/75">{brl(month.ordersRevenue)}</b>
          </span>
          <span>
            {goal.daysElapsed} de {month.daysInMonth} dias
          </span>
          {diff !== null && (
            <span className={diff >= 0 ? 'text-lime-400/90' : 'text-white/45'}>
              {diff >= 0 ? '▲' : '▼'} {pct(Math.abs(diff), 0)} vs. {month.prevLabel.split(' de ')[0]}
            </span>
          )}
          <Link
            href="/admin/configuracoes"
            className="ml-auto font-semibold text-brand-300 hover:text-brand-200"
          >
            Editar meta →
          </Link>
        </div>

        <p className="mt-2 text-[11px] leading-snug text-white/35">
          {goal.hit
            ? `Meta de ${month.shortLabel} batida. Se quiser, suba o valor para o próximo mês.`
            : goal.onTrack
              ? `No ritmo atual (${brl(goal.averagePerDay)}/dia) você fecha o mês em ${brl(goal.projected)} — no caminho certo.`
              : `No ritmo atual (${brl(goal.averagePerDay)}/dia) o mês fecha em ${brl(goal.projected)}. Para bater a meta, faltam ${brl(goal.requiredPerDay)} por dia.`}
          {isDemo && ' Valores de demonstração.'}
        </p>
      </div>
    </section>
  );
}
