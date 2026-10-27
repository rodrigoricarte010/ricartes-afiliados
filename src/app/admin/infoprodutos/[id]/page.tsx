import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repo } from '@/lib/db';
import { brl, dateTime } from '@/lib/format';
import { PageHeader, SectionCard } from '@/components/ui';
import { InfoproductForm } from '../InfoproductForm';
import { DeleteInfoproductButton } from './DeleteInfoproductButton';

export const dynamic = 'force-dynamic';

export default async function EditInfoproductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await repo.snapshot();
  const product = db.infoproducts.find((p) => p.id === id);
  if (!product) notFound();

  const orders = db.orders.filter((o) => o.infoproduct_id === product.id);
  const paid = orders.filter((o) => o.status === 'pago');
  const revenue = paid.reduce((a, o) => a + o.amount, 0);
  const conversionLabel = orders.length > 0 ? `${paid.length}/${orders.length} pagos` : 'sem pedidos ainda';

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`/p/${product.slug} · criado em ${dateTime(product.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <a href={`/p/${product.slug}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm sm:text-sm">
              Ver página ↗
            </a>
            <Link href="/admin/infoprodutos" className="btn-ghost btn-sm sm:text-sm">
              ← Voltar
            </Link>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Receita</p>
          <p className="mt-1 font-display text-xl font-bold text-lime-300">{brl(revenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Pedidos</p>
          <p className="mt-1 font-display text-xl font-bold text-white">{orders.length}</p>
          <p className="text-[11px] text-white/40">{conversionLabel}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Preço atual</p>
          <p className="mt-1 font-display text-xl font-bold text-white">{brl(product.price)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <SectionCard>
          <InfoproductForm infoproduct={product} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Últimos pedidos" padded={false}>
            <ul className="divide-y divide-white/[0.05]">
              {orders.slice(0, 8).map((o) => (
                <li key={o.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-white/80">{o.customer_name}</span>
                    <span className="shrink-0 text-[12px] font-semibold text-white/70">{brl(o.amount)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/30">
                    <span>{o.customer_email}</span>
                    <span
                      className={
                        o.status === 'pago' ? 'text-lime-400' : o.status === 'pendente' ? 'text-amber-400' : ''
                      }
                    >
                      {o.status}
                    </span>
                  </div>
                </li>
              ))}
              {orders.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-white/35">Nenhum pedido ainda.</li>
              )}
            </ul>
          </SectionCard>

          <SectionCard title="Zona de risco">
            <p className="mb-3 text-[11px] leading-snug text-white/40">
              Remover o infoproduto apaga a página de vendas e todos os pedidos vinculados. Essa ação não pode ser
              desfeita.
            </p>
            <DeleteInfoproductButton id={product.id} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
