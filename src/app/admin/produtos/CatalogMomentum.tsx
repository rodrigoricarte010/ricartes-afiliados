import { dateShort, dayKey, lastNDays, num } from '@/lib/format';
import { AreaChart } from '@/components/charts';
import type { Database } from '@/lib/types';

/**
 * "Momento do catálogo": mostra o que foi cadastrado nos últimos 14 dias e
 * quantos cliques esses produtos novos já trouxeram. Ajuda a responder a
 * pergunta prática: vale continuar cadastrando produto?
 */
export function CatalogMomentum({ db }: { db: Database }) {
  const days = lastNDays(14);
  const createdByDay = new Map(days.map((d) => [d, 0]));

  // Só entram produtos cadastrados dentro da janela de 14 dias.
  const newProducts = db.products.filter((p) => {
    const key = dayKey(p.created_at);
    if (!createdByDay.has(key)) return false;
    createdByDay.set(key, (createdByDay.get(key) ?? 0) + 1);
    return true;
  });

  const last7 = days.slice(-7);
  const newIds = new Set(newProducts.map((p) => p.id));
  const newLast7 = newProducts.filter((p) => last7.includes(dayKey(p.created_at)));
  const clicksOnNew = db.clicks.filter((c) => newIds.has(c.product_id)).length;
  const clicksOnNewLast7 = db.clicks.filter(
    (c) => newIds.has(c.product_id) && last7.includes(dayKey(c.ts)),
  ).length;

  const series = days.map((d) => ({ label: dateShort(`${d}T12:00:00`), value: createdByDay.get(d) ?? 0 }));
  const totalWindow = newProducts.length;

  if (db.products.length === 0) return null;

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight text-white">Ritmo do catálogo</h2>
          <p className="mt-0.5 text-xs text-white/40">
            {totalWindow > 0
              ? `${totalWindow} produto${totalWindow === 1 ? '' : 's'} cadastrado${totalWindow === 1 ? '' : 's'} nos últimos 14 dias`
              : 'Nenhum produto cadastrado nos últimos 14 dias'}
          </p>
        </div>
        {newLast7.length > 0 && (
          <span className="badge bg-lime-500/15 text-lime-300 ring-lime-500/25">
            {newLast7.length} novo{newLast7.length === 1 ? '' : 's'} esta semana
          </span>
        )}
      </div>

      <div className="mt-3">
        <AreaChart data={series} height={56} color="#b6f24a" showAxis={false} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-[11px]">
        <div>
          <p className="text-white/35">Cliques nos produtos novos</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{num(clicksOnNew)}</p>
          <p className="text-[10px] text-white/30">{num(clicksOnNewLast7)} nos últimos 7 dias</p>
        </div>
        <div>
          <p className="text-white/35">Média por produto novo</p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {newIds.size > 0 ? num(Math.round(clicksOnNew / newIds.size)) : 0}
          </p>
          <p className="text-[10px] text-white/30">cliques por produto</p>
        </div>
      </div>
    </section>
  );
}
