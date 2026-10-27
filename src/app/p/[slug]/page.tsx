import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { repo } from '@/lib/db';
import { brl, initials } from '@/lib/format';
import { CheckoutForm } from './CheckoutForm';
import { Logo } from '@/components/Sidebar';
import type { Infoproduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

const THEME: Record<
  Infoproduct['theme'],
  { glow: string; accent: string; accentText: string; badge: string; button: string }
> = {
  ember: {
    glow: 'from-brand-500/25 via-orange-600/10',
    accent: 'bg-brand-500',
    accentText: 'text-brand-300',
    badge: 'bg-brand-500/15 text-brand-200 ring-brand-500/30',
    button: 'bg-brand-500 hover:bg-brand-400 text-white',
  },
  midnight: {
    glow: 'from-sky-500/20 via-indigo-700/10',
    accent: 'bg-sky-500',
    accentText: 'text-sky-300',
    badge: 'bg-sky-500/15 text-sky-200 ring-sky-500/30',
    button: 'bg-sky-500 hover:bg-sky-400 text-white',
  },
  lime: {
    glow: 'from-lime-500/20 via-emerald-700/10',
    accent: 'bg-lime-500',
    accentText: 'text-lime-300',
    badge: 'bg-lime-500/15 text-lime-200 ring-lime-500/30',
    button: 'bg-lime-500 hover:bg-lime-400 text-ink-950',
  },
  royal: {
    glow: 'from-violet-500/20 via-indigo-700/10',
    accent: 'bg-violet-500',
    accentText: 'text-violet-300',
    badge: 'bg-violet-500/15 text-violet-200 ring-violet-500/30',
    button: 'bg-violet-500 hover:bg-violet-400 text-white',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await repo.infoproductBySlug(slug);
  if (!product) return { title: 'Produto não encontrado' };
  return {
    title: product.name,
    description: product.tagline,
    openGraph: {
      title: product.name,
      description: product.tagline,
      type: 'website',
    },
  };
}

export default async function SalesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await repo.infoproductBySlug(slug);
  if (!product || product.status !== 'ativo') notFound();

  const db = await repo.snapshot();
  const theme = THEME[product.theme];
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b ${theme.glow} to-transparent`} />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />

      {/* barra */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-semibold text-white">{db.settings.display_name}</span>
          <span className="hidden text-xs text-white/35 sm:inline">{db.settings.handle}</span>
        </div>
        {discount > 0 && (
          <span className={`badge ${theme.badge}`}>🔥 {discount}% OFF hoje</span>
        )}
      </header>

      {/* hero */}
      <main className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-10 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:pt-12">
          <div className="animate-in">
            <span className={`badge ${theme.badge}`}>Infoproduto · acesso imediato</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[44px]">
              {product.name}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">{product.tagline}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-white">{brl(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-lg text-white/30 line-through">{brl(product.original_price)}</span>
                  <span className="badge bg-lime-500/15 text-lime-300 ring-lime-500/25">
                    economize {brl(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#checkout" className={`btn ${theme.button} px-6 py-3 text-sm shadow-glow`}>
                Quero começar agora →
              </a>
              <a href="#conteudo" className="btn-ghost px-6 py-3 text-sm">
                Ver o que vou receber
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/40">
              <span>✓ Acesso imediato</span>
              <span>✓ Garantia de 7 dias</span>
              <span>✓ Pagamento seguro</span>
              <span>✓ Suporte comigo no WhatsApp</span>
            </div>

            {product.description && (
              <p className="mt-8 max-w-xl whitespace-pre-line text-sm leading-relaxed text-white/55">
                {product.description}
              </p>
            )}
          </div>

          {/* checkout card */}
          <div id="checkout" className="animate-in lg:sticky lg:top-6 lg:self-start">
            <div className="card border-white/10 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/35">Garanta seu acesso</p>
                  <p className="font-display text-xl font-bold text-white">{brl(product.price)}</p>
                </div>
                {discount > 0 && <span className={`badge ${theme.badge}`}>-{discount}%</span>}
              </div>

              {product.checkout_url ? (
                <div className="space-y-3">
                  <a href={product.checkout_url} className={`btn ${theme.button} w-full !py-3.5 text-base`}>
                    Ir para o checkout seguro →
                  </a>
                  <p className="text-center text-[10px] text-white/30">
                    Você será levado ao checkout oficial para concluir o pagamento.
                  </p>
                  {product.whatsapp && (
                    <a
                      href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-[11px] text-white/35 hover:text-white/60"
                    >
                      Dúvidas? Fale comigo no WhatsApp →
                    </a>
                  )}
                </div>
              ) : (
                <CheckoutForm
                  slug={product.slug}
                  price={product.price}
                  pixKey={product.pix_key}
                  whatsapp={product.whatsapp}
                />
              )}
            </div>

            {product.testimonials.length > 0 && (
              <div className="mt-4 card p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/35">Quem já começou</p>
                <ul className="mt-3 space-y-3">
                  {product.testimonials.slice(0, 2).map((t) => (
                    <li key={t.name} className="flex gap-2.5">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${theme.accent} text-[11px] font-bold text-white`}>
                        {initials(t.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11.5px] leading-snug text-white/60">&ldquo;{t.text}&rdquo;</p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          {t.name}
                          {t.role ? ` · ${t.role}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* conteúdo */}
        <section id="conteudo" className="mt-16 scroll-mt-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            O que você vai destravar
          </h2>
          <p className="mt-1 text-sm text-white/45">Cada item foi pensado para você aplicar no mesmo dia.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {product.benefits.map((benefit, i) => (
              <div key={benefit} className="card card-hover flex items-start gap-3 p-4">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ${theme.accent} text-[11px] font-bold text-white`}>
                  {i + 1}
                </span>
                <p className="text-[13.5px] leading-snug text-white/75">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* bônus */}
        {product.bonuses.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Bônus inclusos <span className={theme.accentText}>hoje</span>
            </h2>
            <p className="mt-1 text-sm text-white/45">Materiais que sozinhos já valem o investimento.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {product.bonuses.map((bonus) => (
                <div key={bonus.title} className="card p-4">
                  <span className="badge bg-white/[0.06] text-white/50 ring-white/10">Bônus</span>
                  <p className="mt-2 text-sm font-semibold text-white">{bonus.title}</p>
                  <p className="mt-1 text-[12px] leading-snug text-white/45">{bonus.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* depoimentos */}
        {product.testimonials.length > 2 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">Quem aplicou, conta</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {product.testimonials.map((t) => (
                <figure key={t.name} className="card p-4">
                  <div className="text-[13px] leading-snug text-white/70">&ldquo;{t.text}&rdquo;</div>
                  <figcaption className="mt-3 flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${theme.accent} text-[10px] font-bold text-white`}>
                      {initials(t.name)}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {t.name}
                      {t.role ? ` · ${t.role}` : ''}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* garantia */}
        <section className="mt-14 card p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime-500/15 text-2xl">🛡️</span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">Garantia incondicional de 7 dias</h3>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-white/50">
                Entre, assista tudo e aplique. Se você achar que não é para você, me mande um e-mail dentro de 7 dias
                e devolvo 100% do valor — sem burocracia e sem perguntas.
              </p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-12 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
            Acesso imediato após o pagamento. Você recebe o material no seu e-mail e pode começar hoje mesmo.
          </p>
          <a href="#checkout" className={`btn ${theme.button} mt-5 px-8 py-3.5 text-base shadow-glow`}>
            Garantir meu acesso por {brl(product.price)}
          </a>
        </section>

        <footer className="mt-16 border-t border-white/[0.07] pt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Logo size={22} />
            <span className="text-xs text-white/40">
              {db.settings.display_name} · {db.settings.handle}
            </span>
          </div>
          <p className="mt-2 text-[10px] text-white/25">
            {db.settings.support_email && <>Suporte: {db.settings.support_email} · </>}
            Este produto não garante resultados financeiros. Resultados variam conforme dedicação.
          </p>
          <Link href="/" className="mt-3 inline-block text-[10px] text-white/20 hover:text-white/40">
            Plataforma Ricartes
          </Link>
        </footer>
      </main>
    </div>
  );
}
