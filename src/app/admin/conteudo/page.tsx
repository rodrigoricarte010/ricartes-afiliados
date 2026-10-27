import Link from 'next/link';
import { repo } from '@/lib/db';
import { generateForProduct, FORMAT_LABEL, type ContentAudience, type ContentFormat, type ContentTone } from '@/lib/content-engine';
import { relativeTime, dateShort } from '@/lib/format';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { ContentControls } from './ContentControls';
import { ContentPreview } from './ContentPreview';
import { CONTENT_STATUS_COLOR, CONTENT_STATUS_LABEL, type ContentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estúdio de conteúdo' };

const STATUS_FLOW: ContentStatus[] = ['ideia', 'roteirizado', 'gravado', 'publicado'];

export default async function ContentStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; format?: string; tone?: string; audience?: string; seed?: string }>;
}) {
  const sp = await searchParams;
  const db = await repo.snapshot();
  const products = db.products.filter((p) => p.status !== 'rascunho');

  const current = {
    product: sp.product && products.some((p) => p.id === sp.product) ? sp.product : products[0]?.id ?? '',
    format: sp.format && sp.format in FORMAT_LABEL ? sp.format : 'review',
    tone: sp.tone ?? 'direto',
    audience: sp.audience ?? 'geral',
    seed: Number(sp.seed ?? '0') || 0,
  };

  const product = products.find((p) => p.id === current.product);

  const generated =
    product &&
    generateForProduct(
      product,
      current.format as ContentFormat,
      current.tone as ContentTone,
      current.audience as ContentAudience,
      current.seed,
    );

  const byStatus = (status: ContentStatus) => db.content_posts.filter((p) => p.status === status);

  return (
    <div>
      <PageHeader
        title="Estúdio de conteúdo"
        description="Gere gancho, roteiro cena a cena, legenda e hashtags para TikTok, Reels e Shorts — a partir dos produtos que você já divulga."
      />

      {products.length === 0 ? (
        <EmptyState
          icon="▶"
          title="Cadastre um produto primeiro"
          description="O estúdio usa os dados do produto (nome, preço, categoria, plataforma) para montar o roteiro perfeito."
          action={
            <Link href="/admin/produtos" className="btn-primary btn-sm">
              Cadastrar produto
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <SectionCard title="Configurar roteiro" subtitle="Escolha e o texto é gerado na hora">
              <ContentControls products={products} current={current} />
            </SectionCard>

            <SectionCard title="Dicas de performance" subtitle="O que mais pesa no TikTok">
              <ul className="space-y-2.5 text-[12px] leading-snug text-white/50">
                <li>
                  <b className="text-white/80">0–3s é tudo.</b> O gancho precisa gerar curiosidade, não explicar o produto.
                </li>
                <li>
                  <b className="text-white/80">Texto grande na tela.</b> 70% assiste sem som na primeira passada.
                </li>
                <li>
                  <b className="text-white/80">1 vídeo por dia &gt; 7 num domingo.</b> Constância treina o algoritmo.
                </li>
                <li>
                  <b className="text-white/80">16–34s converte mais</b> para achadinhos e review.
                </li>
                <li>
                  <b className="text-white/80">CTA explícito.</b> &ldquo;Link na bio&rdquo; dito e escrito.
                </li>
              </ul>
            </SectionCard>
          </div>

          <div className="space-y-4">
            {generated && product ? (
              <SectionCard
                title={generated.title}
                subtitle={`${product.name} · ${FORMAT_LABEL[current.format as ContentFormat]}`}
                action={
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="text-xs font-semibold text-white/45 hover:text-white"
                  >
                    Editar produto →
                  </Link>
                }
              >
                <ContentPreview
                  generated={generated}
                  hidden={{
                    product_id: product.id,
                    format: current.format,
                    tone: current.tone,
                    audience: current.audience,
                    seed: String(current.seed),
                  }}
                  statuses={[
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'Instagram Reels', value: 'reels' },
                    { label: 'YouTube Shorts', value: 'shorts' },
                  ]}
                />
              </SectionCard>
            ) : null}

            <SectionCard title="Calendário de conteúdo" subtitle="Arraste do papel para a câmera" padded={false}>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {STATUS_FLOW.map((status) => {
                  const posts = byStatus(status);
                  return (
                    <div key={status} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`badge ${CONTENT_STATUS_COLOR[status]}`}>{CONTENT_STATUS_LABEL[status]}</span>
                        <span className="text-[11px] text-white/30">{posts.length}</span>
                      </div>
                      <div className="space-y-2">
                        {posts.slice(0, 4).map((post) => (
                          <Link
                            key={post.id}
                            href={`/admin/conteudo/${post.id}`}
                            className="block rounded-lg border border-white/[0.06] bg-ink-900/60 p-2 transition hover:border-white/15 hover:bg-ink-800"
                          >
                            <p className="line-clamp-2 text-[11.5px] font-medium leading-snug text-white/75">
                              {post.title}
                            </p>
                            <p className="mt-1 text-[10px] text-white/30">
                              {post.published_at ? `publicado ${dateShort(post.published_at)}` : relativeTime(post.created_at)}
                            </p>
                          </Link>
                        ))}
                        {posts.length === 0 && (
                          <p className="rounded-lg border border-dashed border-white/[0.08] px-2 py-4 text-center text-[10px] text-white/25">
                            vazio
                          </p>
                        )}
                        {posts.length > 4 && (
                          <p className="text-center text-[10px] text-white/30">+{posts.length - 4} outros</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
