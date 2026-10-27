import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repo } from '@/lib/db';
import { dateTime } from '@/lib/format';
import { PageHeader, SectionCard } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { ContentStatusActions } from '../ContentStatusActions';
import { CONTENT_STATUS_COLOR, CONTENT_STATUS_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await repo.snapshot();
  const post = db.content_posts.find((p) => p.id === id);
  if (!post) notFound();

  const product = db.products.find((p) => p.id === post.product_id);
  const fullText = [post.hook, '', post.script, '', post.caption, post.hashtags].join('\n');

  return (
    <div>
      <PageHeader
        title={post.title}
        description={`${product?.name ?? 'Sem produto vinculado'} · criado em ${dateTime(post.created_at)}`}
        action={
          <Link href="/admin/conteudo" className="btn-ghost btn-sm sm:text-sm">
            ← Estúdio
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SectionCard
            title="Gancho"
            action={<CopyButton value={post.hook} label="Copiar" compact />}
          >
            <p className="font-display text-lg font-semibold leading-snug text-white">“{post.hook}”</p>
          </SectionCard>

          <SectionCard
            title="Roteiro cena a cena"
            action={<CopyButton value={post.script} label="Copiar roteiro" compact />}
          >
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-white/75">{post.script}</pre>
          </SectionCard>

          <SectionCard title="Legenda" action={<CopyButton value={post.caption} label="Copiar" compact />}>
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-white/75">{post.caption}</pre>
          </SectionCard>

          <SectionCard title="Hashtags" action={<CopyButton value={post.hashtags} label="Copiar" compact />}>
            <p className="text-[13px] leading-relaxed text-lime-200">{post.hashtags}</p>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Status da produção">
            <div className="mb-3 flex items-center gap-2">
              <span className={`badge ${CONTENT_STATUS_COLOR[post.status]}`}>{CONTENT_STATUS_LABEL[post.status]}</span>
              {post.published_at && (
                <span className="text-[11px] text-white/35">publicado {dateTime(post.published_at)}</span>
              )}
            </div>
            <ContentStatusActions id={post.id} status={post.status} />
          </SectionCard>

          <SectionCard title="Checklist de gravação">
            <ul className="space-y-2 text-[12px] text-white/50">
              {[
                'Celular na vertical (9:16) e luz na frente',
                'Gravar 3 takes do gancho (fala mais rápido)',
                'Gravar B-roll: produto na mão, uso real, detalhe',
                'Texto na tela nos primeiros 3 segundos',
                'Editar no CapCut com cortes a cada 1–2s',
                'Áudio em alta + voz mais alta que a música',
                'Legenda embutida (acessibilidade)',
                'CTA verbal + escrito: link na bio',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-white/15 text-[9px] text-white/30">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Ações rápidas">
            <div className="space-y-2">
              <CopyButton value={fullText} label="Copiar tudo" className="w-full" />
              {product && (
                <Link href={`/admin/produtos/${product.id}`} className="btn-ghost w-full">
                  Ver produto e link
                </Link>
              )}
              <Link href="/admin/conteudo" className="btn-ghost w-full">
                Gerar outra versão
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
