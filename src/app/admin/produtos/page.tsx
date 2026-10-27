import Link from 'next/link';
import { repo } from '@/lib/db';
import { brl, num, pct } from '@/lib/format';
import { productStats } from '@/lib/stats';
import { appUrl } from '@/lib/url';
import { PageHeader, EmptyState, SectionCard } from '@/components/ui';
import { ProductForm } from './ProductForm';
import { ProductRowActions } from './ProductRowActions';
import { PLATFORM_COLOR, PLATFORM_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Produtos afiliados' };

export default async function ProductsPage() {
  const db = await repo.snapshot();
  const stats = productStats(db);
  const base = await appUrl();

  const totalCommission = stats.reduce((a, s) => a + s.commission, 0);
  const active = db.products.filter((p) => p.status === 'ativo').length;

  return (
    <div>
      <PageHeader
        title="Produtos afiliados"
        description="Cadastre os produtos que você divulga. Cada produto gera um link rastreável com contagem de cliques e comissão."
        action={
          <Link href="/admin/links" className="btn-ghost btn-sm sm:text-sm">
            ⇄ Links & QR
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Produtos</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{db.products.length}</p>
              <p className="text-[11px] text-white/40">{active} ativos</p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Cliques</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{num(db.clicks.length)}</p>
              <p className="text-[11px] text-white/40">total acumulado</p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Comissão</p>
              <p className="mt-1 font-display text-xl font-bold text-lime-300">{brl(totalCommission, { compact: true })}</p>
              <p className="text-[11px] text-white/40">aprovada</p>
            </div>
          </div>

          <SectionCard title="Seu catálogo" subtitle="Clique no nome para editar" padded={false}>
            {stats.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon="◈"
                  title="Nenhum produto ainda"
                  description="Use o formulário ao lado para cadastrar seu primeiro produto de afiliado."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th className="text-right">Preço</th>
                      <th className="text-right">Cliques</th>
                      <th className="text-right">CVR</th>
                      <th className="text-right">Comissão</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(({ product, clicks, cvr, commission }) => (
                      <tr key={product.id} id={`product-${product.id}`}>
                        <td>
                          <Link href={`/admin/produtos/${product.id}`} className="group block">
                            <span className="flex items-center gap-2">
                              <span className="max-w-[200px] truncate text-[13px] font-medium text-white group-hover:text-brand-300 sm:max-w-[280px]">
                                {product.name}
                              </span>
                              {product.status !== 'ativo' && (
                                <span className="badge bg-white/[0.06] text-white/40 ring-white/10">
                                  {product.status}
                                </span>
                              )}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`badge ${PLATFORM_COLOR[product.platform]}`}>
                                {PLATFORM_LABEL[product.platform]}
                              </span>
                              <span className="text-[11px] text-white/35">{product.category}</span>
                              <span className="text-[11px] text-white/25">· /r/{product.slug}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap text-right text-white/70">{brl(product.price)}</td>
                        <td className="text-right text-white/70">{num(clicks)}</td>
                        <td className="text-right text-white/70">{pct(cvr)}</td>
                        <td className="whitespace-nowrap text-right font-semibold text-lime-300">
                          {brl(commission)}
                        </td>
                        <td className="w-[1%] whitespace-nowrap text-right">
                          <ProductRowActions
                            id={product.id}
                            status={product.status}
                            appUrl={base}
                            slug={product.slug}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Novo produto" subtitle="Leva menos de 1 minuto">
          <ProductForm />
        </SectionCard>
      </div>
    </div>
  );
}
