import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { repo } from '@/lib/db';
import { appUrl } from '@/lib/url';
import { brl, initials } from '@/lib/format';
import { BRAND } from '@/lib/brand';
import { PLATFORM_COLOR, PLATFORM_LABEL, type Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Aceita /ricartes e /@ricartes — o mesmo endereço que vai na bio. */
function normalizeHandle(value: string): string {
  return value.replace(/^@/, '').toLowerCase().trim();
}

async function resolve() {
  const db = await repo.snapshot();
  const settings = db.settings;
  const products = db.products.filter((p) => p.status === 'ativo');
  const infoproducts = db.infoproducts.filter((p) => p.status === 'ativo');
  return { db, settings, products, infoproducts };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const { settings } = await resolve();
  const valid = normalizeHandle(handle) === normalizeHandle(settings.handle) || normalizeHandle(handle) === 'links';
  if (!valid) return { title: 'Página não encontrada' };

  return {
    title: `${settings.display_name} · achadinhos e ofertas`,
    description: settings.bio,
    openGraph: {
      title: `${settings.display_name} — ${settings.handle}`,
      description: settings.bio,
      type: 'profile',
    },
  };
}

function ProductCard({ product, base }: { product: Product; base: string }) {
  const href = `/r/${product.slug}?utm_source=bio&utm_medium=link-na-bio`;
  const commission = (product.price * product.commission_pct) / 100;

  return (
    <a
      href={href}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-brand-400/40 hover:bg-white/[0.06]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-500/25 to-sky-500/10">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-base font-bold text-white/50">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/90 group-hover:text-white">
          {product.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`badge !px-2 !py-0.5 !text-[9.5px] ${PLATFORM_COLOR[product.platform]}`}>
            {PLATFORM_LABEL[product.platform]}
          </span>
          <span className="text-[11px] font-semibold text-lime-300">{brl(product.price)}</span>
        </div>
        <p className="mt-0.5 text-[10px] text-white/30">comissão estimada {brl(commission)}</p>
      </div>

      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-sm text-brand-200 transition group-hover:bg-brand-500 group-hover:text-white">
        →
      </span>
    </a>
  );
}

export default async function LinkInBioPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { settings, products, infoproducts } = await resolve();

  const requested = normalizeHandle(handle);
  const isOwn = requested === normalizeHandle(settings.handle);
  const isAlias = requested === 'links';
  if (!isOwn && !isAlias) notFound();

  const base = await appUrl();
  const bioUrl = `${base}/${settings.handle.replace(/^@/, '')}`;

  // agrupa por categoria mantendo a ordem de cadastro
  const categories = [...new Set(products.map((p) => p.category))];
  const featured = infoproducts[0];

  const socials = [
    { label: 'TikTok', href: 'https://www.tiktok.com/', icon: '♪' },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: '◎' },
    {
      label: 'WhatsApp',
      href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : '',
      icon: '✆',
    },
  ].filter((s) => s.href);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-600/25 to-transparent" />

      <main className="relative mx-auto max-w-md px-4 py-8 sm:py-12">
        {/* perfil */}
        <header className="animate-in text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-2xl font-extrabold text-white shadow-glow ring-4 ring-white/5">
            {initials(settings.display_name)}
          </div>
          <h1 className="mt-3 font-display text-xl font-extrabold tracking-tight text-white">
            {settings.display_name}
          </h1>
          <p className="text-sm text-brand-300/80">{settings.handle}</p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-white/50">{settings.bio}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="badge badge-live">✓ testado antes de indicar</span>
            <span className="badge bg-white/[0.06] text-white/50 ring-white/10">
              {products.length} achadinhos
            </span>
          </div>
        </header>

        {/* redes */}
        {socials.length > 0 && (
          <nav className="mt-4 flex justify-center gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/60 transition hover:border-white/25 hover:text-white"
                aria-label={social.label}
                title={social.label}
              >
                {social.icon}
              </a>
            ))}
          </nav>
        )}

        {/* destaque: infoproduto */}
        {featured && (
          <section className="mt-6">
            <div className="relative overflow-hidden rounded-2xl border border-lime-400/30 bg-gradient-to-br from-lime-500/[0.14] via-brand-500/[0.08] to-transparent p-4">
              <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-lime-400/20 blur-2xl" />
              <span className="badge bg-lime-500/20 text-lime-200 ring-lime-500/30">◆ meu método</span>
              <p className="mt-2 font-display text-base font-bold leading-snug text-white">{featured.name}</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/55">{featured.tagline}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-extrabold text-white">{brl(featured.price)}</p>
                  {featured.original_price && featured.original_price > featured.price && (
                    <p className="text-[11px] text-white/30 line-through">{brl(featured.original_price)}</p>
                  )}
                </div>
                <Link href={`/p/${featured.slug}?utm_source=bio&utm_medium=link-na-bio`} className="btn-buy !px-4 !py-2.5 !text-[11px]">
                  Quero acesso
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* produtos */}
        <section className="mt-6 space-y-5">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                <span className="h-px flex-1 bg-white/10" />
                {category}
                <span className="h-px flex-1 bg-white/10" />
              </h2>
              <div className="space-y-2">
                {products
                  .filter((p) => p.category === category)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} base={base} />
                  ))}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35">
              Nenhum produto ativo no momento. Volte em breve!
            </p>
          )}
        </section>

        {/* rodapé */}
        <footer className="mt-10 border-t border-white/[0.07] pt-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/35">
            {settings.support_email && <span>{settings.support_email}</span>}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/70"
              >
                falar comigo
              </a>
            )}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/20">
            Alguns links são de afiliado: eu recebo uma comissão se você comprar, sem custo extra para você.
          </p>
          <p className="mt-3 text-[10px] text-white/20">
            <Link href="/" className="hover:text-white/40">
              {BRAND.name}
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
