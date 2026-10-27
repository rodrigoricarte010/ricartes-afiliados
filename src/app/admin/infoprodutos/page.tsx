import Link from 'next/link';
import { repo } from '@/lib/db';
import { brl, num } from '@/lib/format';
import { appUrl } from '@/lib/url';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meus infoprodutos' };

export default async function InfoproductsPage() {
  const db = await repo.snapshot();
  const base = await appUrl();

  const revenueByProduct = new Map<string, { paid: number; count: number; pending: number }>();
  for (const order of db.orders) {
    const entry = revenueByProduct.get(order.infoproduct_id) ?? { paid: 0, count: 0, pending: 0 };
    if (order.status === 'pago') {
      entry.paid += order.amount;
      entry.count += 1;
    }
    if (order.status === 'pendente') entry.pending += 1;
    revenueByProduct.set(order.infoproduct_id, entry);
  }

  const totalRevenue = [...revenueByProduct.values()].reduce((a, e) => a + e.paid, 0);

  return (
    <div>
      <PageHeader
        title="Meus infoprodutos"
        description="Crie páginas de vendas completas com checkout, prova social e bônus — sem depender de plataforma externa."
        action={
          <Link href="/admin/infoprodutos/novo" className="btn-primary btn-sm sm:text-sm">
            + Novo infoproduto
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Receita paga</p>
          <p className="mt-1 font-display text-xl font-bold text-lime-300">{brl(totalRevenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Pedidos pagos</p>
          <p className="mt-1 font-display text-xl font-bold text-white">
            {num([...revenueByProduct.values()].reduce((a, e) => a + e.count, 0))}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Infoprodutos</p>
          <p className="mt-1 font-display text-xl font-bold text-white">{db.infoproducts.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">No ar</p>
          <p className="mt-1 font-display text-xl font-bold text-white">
            {db.infoproducts.filter((p) => p.status === 'ativo').length}
          </p>
        </div>
      </div>

      {db.infoproducts.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Nenhum infoproduto ainda"
          description="Crie sua primeira página de vendas em minutos: nome, promessa, preço e benefícios. O resto é automático."
          action={
            <Link href="/admin/infoprodutos/novo" className="btn-primary btn-sm">
              Criar meu primeiro infoproduto
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {db.infoproducts.map((product) => {
            const stats = revenueByProduct.get(product.id) ?? { paid: 0, count: 0, pending: 0 };
            const url = `${base}/p/${product.slug}`;
            return (
              <SectionCard key={product.id} padded={false}>
                <div className="flex items-start gap-4 p-4 sm:p-5">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${
                      product.theme === 'ember'
                        ? 'from-brand-500 to-orange-700'
                        : product.theme === 'lime'
                          ? 'from-lime-500 to-emerald-700'
                          : product.theme === 'royal'
                            ? 'from-violet-500 to-indigo-700'
                            : 'from-slate-600 to-slate-900'
                    }`}
                  >
                    ◆
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold text-white">{product.name}</h3>
                      <span
                        className={`badge ${
                          product.status === 'ativo'
                            ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
                            : 'bg-white/[0.06] text-white/40 ring-white/10'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-white/40">{product.tagline}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-white/45">
                      <span className="font-display text-base font-bold text-white">{brl(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-white/30 line-through">{brl(product.original_price)}</span>
                      )}
                      <span className="text-lime-300">{brl(stats.paid)} recebido</span>
                      <span>{stats.count} pedidos</span>
                      {stats.pending > 0 && <span className="text-amber-300">{stats.pending} pendentes</span>}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Link href={`/admin/infoprodutos/${product.id}`} className="btn-ghost btn-sm">
                        Editar
                      </Link>
                      <a href={url} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                        Ver página ↗
                      </a>
                      <CopyButton value={url} label="Copiar link" compact />
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <SectionCard className="mt-4" title="Onde divulgar seus infoprodutos">
        <div className="grid gap-3 text-[12px] leading-snug text-white/50 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-1 font-semibold text-white">TikTok / Reels</p>
            Link na bio + vídeos de 3 ganchos diferentes apontando para a mesma página. Use UTM{' '}
            <code className="text-white/70">?utm_source=tiktok</code>.
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-1 font-semibold text-white">Shopee / TikTok Shop</p>
            Cadastre o infoproduto como produto digital (Kiwify/Hotmart) e use o link da página de vendas como
            destino do anúncio.
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-1 font-semibold text-white">WhatsApp / Telegram</p>
            Envie o link direto com prova social: &ldquo;fulana já fez R$ 1.200 com isso&rdquo;. Converta mais que
            qualquer anúncio.
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
