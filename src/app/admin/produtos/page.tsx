import Link from 'next/link';
import { repo } from '@/lib/db';
import { brl, num } from '@/lib/format';
import { productStats } from '@/lib/stats';
import { appUrl } from '@/lib/url';
import { PageHeader, EmptyState, SectionCard } from '@/components/ui';
import { ProductForm } from './ProductForm';
import { ProductTable, type ProductRow } from './ProductTable';

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
          <>
            <Link href="/admin/produtos/importar" className="btn-ghost btn-sm sm:text-sm">
              ⇪ Importar lista
            </Link>
            <Link href="/admin/links" className="btn-ghost btn-sm sm:text-sm">
              ⇄ Links & QR
            </Link>
          </>
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
                  description="Use o formulário ao lado para cadastrar seu primeiro produto — ou cole uma lista de links de uma vez."
                  action={
                    <Link href="/admin/produtos/importar" className="btn-ghost btn-sm">
                      ⇪ Importar lista de links
                    </Link>
                  }
                />
              </div>
            ) : (
              <ProductTable
                appUrl={base}
                rows={stats.map<ProductRow>(({ product, clicks, cvr, commission }) => ({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  platform: product.platform,
                  category: product.category,
                  status: product.status,
                  price: product.price,
                  clicks,
                  cvr,
                  commission,
                }))}
              />
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
