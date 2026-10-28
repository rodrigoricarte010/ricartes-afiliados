import Link from 'next/link';
import { repo } from '@/lib/db';
import { appUrl } from '@/lib/url';
import { brl, num, pct } from '@/lib/format';
import { productStats } from '@/lib/stats';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { PLATFORM_COLOR, PLATFORM_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Links & QR' };

export default async function LinksPage() {
  const db = await repo.snapshot();
  const base = await appUrl();
  const stats = productStats(db).filter((s) => s.product.status !== 'rascunho');

  const utmSources = ['tiktok', 'instagram', 'whatsapp', 'youtube'];

  return (
    <div>
      <PageHeader
        title="Links & QR Code"
        description="Seus links rastreáveis prontos para a bio, stories e descrição dos vídeos. Cada acesso é contabilizado."
        action={
          <>
            <a href="/api/export?tipo=cliques" className="btn-ghost btn-sm sm:text-sm">
              ⤓ Cliques CSV
            </a>
            <Link href="/admin/produtos" className="btn-primary btn-sm sm:text-sm">
              + Novo produto
            </Link>
          </>
        }
      />

      {stats.length === 0 ? (
        <EmptyState
          icon="⇄"
          title="Nenhum link ativo"
          description="Cadastre um produto para gerar automaticamente seu link rastreável e o QR Code."
          action={
            <Link href="/admin/produtos" className="btn-primary btn-sm">
              Cadastrar produto
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {stats.map(({ product, clicks, cvr }) => {
            const plain = `${base}/r/${product.slug}`;
            return (
              <SectionCard key={product.id} padded={false}>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                  <div className="flex shrink-0 items-start justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/qr?data=${encodeURIComponent(plain)}&size=200`}
                      alt={`QR Code de ${product.name}`}
                      width={96}
                      height={96}
                      className="rounded-lg bg-white p-1"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold text-white">{product.name}</h3>
                      <span className={`badge ${PLATFORM_COLOR[product.platform]}`}>
                        {PLATFORM_LABEL[product.platform]}
                      </span>
                      {product.status === 'pausado' && (
                        <span className="badge bg-amber-500/15 text-amber-300 ring-amber-500/25">pausado</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/70 px-2.5 py-1.5">
                      <code className="min-w-0 flex-1 truncate text-xs text-brand-200">{plain}</code>
                      <CopyButton value={plain} label="Copiar" compact className="!px-2 !py-1" />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-white/30">Com UTM:</span>
                      {utmSources.map((src) => (
                        <CopyButton
                          key={src}
                          value={`${plain}?utm_source=${src}`}
                          label={src}
                          compact
                          className="!px-2 !py-0.5 !text-[10px]"
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-white/40">
                      <span>
                        <b className="text-white/70">{num(clicks)}</b> cliques
                      </span>
                      <span>
                        CVR <b className="text-white/70">{pct(cvr)}</b>
                      </span>
                      <span>
                        Comissão/venda <b className="text-lime-300">{brl((product.price * product.commission_pct) / 100)}</b>
                      </span>
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="ml-auto font-semibold text-white/50 hover:text-white"
                      >
                        Editar →
                      </Link>
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <div className="mt-6 card p-5">
        <h2 className="font-display text-sm font-semibold text-white">Boas práticas de divulgação</h2>
        <ul className="mt-3 grid gap-2 text-xs text-white/50 sm:grid-cols-2">
          <li>• Use <code className="text-white/70">?utm_source=tiktok</code> para separar a origem de cada vídeo.</li>
          <li>• Coloque o link na bio e também mencione no vídeo (&ldquo;link na bio&rdquo;).</li>
          <li>• Em stories, use o QR Code para quem está no computador.</li>
          <li>• Nunca use encurtadores de terceiros: eles quebram o rastreamento e a confiança.</li>
          <li>• Divulgue apenas o que você testou — a taxa de devolução afeta sua comissão.</li>
          <li>• Respeite as regras da plataforma: identifique conteúdo publicitário com #publi.</li>
        </ul>
      </div>
    </div>
  );
}
