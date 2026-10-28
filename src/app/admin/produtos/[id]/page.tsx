import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repo } from '@/lib/db';
import { brl, dateFull, num, pct, relativeTime } from '@/lib/format';
import { appUrl } from '@/lib/url';
import { PageHeader, SectionCard } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { AreaChart } from '@/components/charts';
import { ProductForm } from '../ProductForm';
import { PLATFORM_LABEL } from '@/lib/types';
import { lastNDays, dayKey, dateShort } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await repo.snapshot();
  const product = db.products.find((p) => p.id === id);
  if (!product) notFound();

  const base = await appUrl();
  const trackUrl = `${base}/r/${product.slug}`;

  const clicks = db.clicks.filter((c) => c.product_id === product.id);
  const conversions = db.conversions.filter((c) => c.product_id === product.id);
  const approved = conversions.filter((c) => c.status === 'aprovada');
  const commission = approved.reduce((a, c) => a + c.commission, 0);

  const days = lastNDays(14);
  const byDay = new Map(days.map((d) => [d, 0]));
  for (const c of clicks) {
    const key = dayKey(c.ts);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const series = days.map((d) => ({ label: dateShort(`${d}T12:00:00`), value: byDay.get(d) ?? 0 }));

  const qrSize = 220;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${PLATFORM_LABEL[product.platform]} · ${product.category} · criado em ${dateFull(product.created_at)}`}
        action={
          <Link href="/admin/produtos" className="btn-ghost btn-sm sm:text-sm">
            ← Voltar
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Cliques</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{num(clicks.length)}</p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Vendas</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{conversions.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Conversão</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {pct(clicks.length ? (conversions.length / clicks.length) * 100 : 0)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Comissão</p>
              <p className="mt-1 font-display text-xl font-bold text-lime-300">{brl(commission, { compact: true })}</p>
            </div>
          </div>

          <SectionCard title="Cliques nos últimos 14 dias">
            <AreaChart data={series} height={150} color="#8d78fd" />
          </SectionCard>

          <SectionCard title="Editar dados do produto">
            <ProductForm product={product} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Link rastreável">
            <p className="mb-2 text-xs text-white/45">
              Divulgue esta URL. Todo clique é registrado com origem, dispositivo e horário.
            </p>
            <div className="rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2.5">
              <code className="block break-all text-xs text-brand-200">{trackUrl}</code>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton value={trackUrl} label="Copiar link" compact />
              <a href={trackUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                Testar ↗
              </a>
            </div>

            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-white/35">Link original de afiliado</p>
              <a
                href={product.affiliate_url}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-xs text-white/50 hover:text-white/80"
              >
                {product.affiliate_url}
              </a>
            </div>
          </SectionCard>

          <SectionCard title="QR Code" subtitle="Para stories, cartaz ou bio">
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr?data=${encodeURIComponent(trackUrl)}&size=${qrSize}`}
                alt={`QR Code do link ${product.slug}`}
                width={qrSize}
                height={qrSize}
                className="rounded-xl bg-white p-2"
              />
              <a
                href={`/api/qr?data=${encodeURIComponent(trackUrl)}&size=600&download=1`}
                className="btn-ghost btn-sm mt-3"
              >
                ⤓ Baixar PNG
              </a>
            </div>
          </SectionCard>

          {product.notes && (
            <SectionCard title="Anotações">
              <p className="whitespace-pre-wrap text-sm text-white/60">{product.notes}</p>
            </SectionCard>
          )}

          <SectionCard title="Últimas vendas" padded={false}>
            <ul className="divide-y divide-white/[0.05]">
              {conversions.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <span className="text-white/50">{relativeTime(c.created_at)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-white/70">{brl(c.amount)}</span>
                    <span
                      className={`badge ${
                        c.status === 'aprovada'
                          ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
                          : c.status === 'pendente'
                            ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
                            : 'bg-white/[0.06] text-white/40 ring-white/10'
                      }`}
                    >
                      {c.status}
                    </span>
                  </span>
                </li>
              ))}
              {conversions.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-white/35">Nenhuma venda registrada ainda.</li>
              )}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
