import Link from 'next/link';
import { repo } from '@/lib/db';
import { brl, dateTime, num } from '@/lib/format';
import { dashboardStats } from '@/lib/stats';
import { PageHeader, SectionCard, StatCard, EmptyState } from '@/components/ui';
import { ConversionForm } from './ConversionForm';
import { ConversionStatusSelect, OrderStatusSelect } from './StatusSelects';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vendas & comissões' };

export default async function SalesPage() {
  const db = await repo.snapshot();
  const s = dashboardStats(db, 30);
  const productName = new Map(db.products.map((p) => [p.id, p.name]));
  const infoproductName = new Map(db.infoproducts.map((p) => [p.id, p.name]));

  const conversions = [...db.conversions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const paidRevenue = db.orders.filter((o) => o.status === 'pago').reduce((a, o) => a + o.amount, 0);
  const pendingOrders = db.orders.filter((o) => o.status === 'pendente');

  return (
    <div>
      <PageHeader
        title="Vendas & comissões"
        description="Registre as vendas que a plataforma informou, acompanhe o que está pendente e veja os pedidos dos seus infoprodutos."
        action={
          <>
            <a href="/api/export?tipo=vendas" className="btn-ghost btn-sm sm:text-sm" title="Abre no Excel / Sheets">
              ⤓ Vendas CSV
            </a>
            <a href="/api/export?tipo=pedidos" className="btn-ghost btn-sm sm:text-sm" title="Pedidos de infoprodutos">
              ⤓ Pedidos CSV
            </a>
            <Link href="/admin/produtos" className="btn-ghost btn-sm sm:text-sm">
              ◈ Produtos
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Comissão aprovada" value={brl(s.commissionApproved)} hint="disponível/recebida" accent="lime" icon="✓" />
        <StatCard label="Comissão pendente" value={brl(s.commissionPending)} hint="em análise pela plataforma" icon="⏳" />
        <StatCard label="Ticket médio" value={brl(s.ticket)} hint="por venda aprovada" icon="◈" />
        <StatCard
          label="Infoprodutos"
          value={brl(paidRevenue)}
          hint={`${pendingOrders.length} pedido(s) pendente(s)`}
          accent="brand"
          icon="◆"
          href="/admin/infoprodutos"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <SectionCard
            title="Vendas de afiliado"
            subtitle={`${num(conversions.length)} registros`}
            padded={false}
          >
            {conversions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon="⛁"
                  title="Nenhuma venda registrada"
                  description="Quando a Shopee ou o TikTok Shop informarem uma venda, registre aqui para acompanhar suas comissões."
                />
              </div>
            ) : (
              <div className="max-h-[520px] overflow-auto">
                <table className="table-base">
                  <thead className="sticky top-0 z-10 bg-ink-950/95 backdrop-blur">
                    <tr>
                      <th>Produto</th>
                      <th>Data</th>
                      <th className="text-right">Venda</th>
                      <th className="text-right">Comissão</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.map((c) => (
                      <tr key={c.id}>
                        <td className="max-w-[220px]">
                          <span className="block truncate text-[13px] text-white/80">
                            {productName.get(c.product_id) ?? 'Produto removido'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-[11px] text-white/40">{dateTime(c.created_at)}</td>
                        <td className="whitespace-nowrap text-right text-white/60">{brl(c.amount)}</td>
                        <td className="whitespace-nowrap text-right font-semibold text-lime-300">{brl(c.commission)}</td>
                        <td className="text-right">
                          <ConversionStatusSelect id={c.id} status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Pedidos de infoprodutos" subtitle="Vendas feitas nas suas páginas" padded={false}>
            {db.orders.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon="◆"
                  title="Nenhum pedido ainda"
                  description="Divulgue sua página de vendas: /p/<seu-infoproduto>."
                  action={
                    <Link href="/admin/infoprodutos" className="btn-primary btn-sm">
                      Criar infoproduto
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Produto</th>
                      <th>Data</th>
                      <th className="text-right">Valor</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="block text-[13px] text-white/85">{o.customer_name}</span>
                          <span className="block text-[11px] text-white/35">{o.customer_email}</span>
                        </td>
                        <td className="max-w-[160px] truncate text-[12px] text-white/60">
                          {infoproductName.get(o.infoproduct_id) ?? '—'}
                        </td>
                        <td className="whitespace-nowrap text-[11px] text-white/40">{dateTime(o.created_at)}</td>
                        <td className="whitespace-nowrap text-right font-semibold text-white/85">{brl(o.amount)}</td>
                        <td className="text-right">
                          <OrderStatusSelect id={o.id} status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Registrar venda manual" subtitle="Comissões informadas pela plataforma">
            {db.products.length === 0 ? (
              <p className="text-sm text-white/40">
                Cadastre um produto primeiro em{' '}
                <Link href="/admin/produtos" className="text-brand-300 hover:underline">
                  Produtos afiliados
                </Link>
                .
              </p>
            ) : (
              <ConversionForm products={db.products} />
            )}
          </SectionCard>

          <SectionCard title="Como funciona a comissão" subtitle="Shopee · TikTok Shop · Mercado Livre">
            <ul className="space-y-2.5 text-[12px] leading-snug text-white/50">
              <li>
                <b className="text-white/80">Pendente:</b> a venda aconteceu, mas a plataforma ainda está no prazo de
                devolução (geralmente 7–30 dias).
              </li>
              <li>
                <b className="text-white/80">Aprovada:</b> passou o prazo e a comissão foi liberada.
              </li>
              <li>
                <b className="text-white/80">Cancelada:</b> devolução ou cancelamento — não entra no seu total.
              </li>
              <li>
                O relatório oficial está no painel de cada plataforma. Use esta página para consolidar tudo num lugar.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
