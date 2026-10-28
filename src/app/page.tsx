import Link from 'next/link';
import { repo } from '@/lib/db';
import { brl } from '@/lib/format';
import { Logo } from '@/components/Sidebar';
import { dashboardStats } from '@/lib/stats';
import { PLATFORM_LABEL } from '@/lib/types';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

const PILLARS = [
  {
    icon: '◈',
    title: 'Afiliado de verdade',
    description:
      'Cadastre produtos da Shopee, TikTok Shop, Mercado Livre e Amazon. Cada um ganha um link rastreável com cliques, origem e conversão.',
    points: ['Link próprio /r/slug', 'QR Code para stories', 'UTM automático por rede'],
  },
  {
    icon: '▶',
    title: 'Conteúdo que vende',
    description:
      'O estúdio monta gancho, roteiro cena a cena, legenda e hashtags a partir do produto que você escolheu. Sem bloqueio criativo.',
    points: ['8 formatos de vídeo', '4 tons de voz', 'Calendário de produção'],
  },
  {
    icon: '◆',
    title: 'Seus infoprodutos',
    description:
      'Publique páginas de vendas completas com prova social, bônus, garantia e checkout com Pix ou link externo (Hotmart/Kiwify).',
    points: ['Página em /p/slug', 'Pedidos no painel', '4 temas visuais'],
  },
  {
    icon: '⛁',
    title: 'Um lugar para os números',
    description:
      'Comissões aprovadas, pendentes e canceladas; pedidos de infoproduto; melhores horários de postagem e origem do tráfego.',
    points: ['Dashboard 30 dias', 'Ranking de produtos', 'EPC e CVR'],
  },
];

export default async function HomePage() {
  const db = await repo.snapshot();
  const s = dashboardStats(db, 30);
  const featured = db.infoproducts.find((p) => p.status === 'ativo');

  const stats = [
    { label: 'cliques rastreados', value: String(s.clicks) },
    { label: 'comissão acumulada', value: brl(s.commissionApproved, { compact: true }) },
    { label: 'produtos no catálogo', value: String(db.products.length) },
    { label: 'roteiros gerados', value: String(db.content_posts.length) },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />

      {/* header */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight text-white">{BRAND.short}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-brand-300/70">{BRAND.suffix}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {featured && (
            <Link href={`/p/${featured.slug}`} className="hidden text-xs text-white/50 hover:text-white sm:block">
              Ver página de vendas
            </Link>
          )}
          <Link href="/admin" className="btn-primary btn-sm sm:text-sm">
            Entrar no painel
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-8 pt-10 sm:pt-16">
        <div className="animate-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-live animate-pulse-ring">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> painel liberado
            </span>
            <span className="badge bg-brand-500/15 text-brand-200 ring-brand-500/25">
              Afiliados + conteúdo + infoprodutos
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Transforme <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-sky-400 bg-clip-text text-transparent">achadinhos</span> em renda
            <span className="block text-white/40">com um sistema, não com sorte.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            Divulgue produtos da Shopee e do TikTok Shop, gere os roteiros dos vídeos em segundos e venda seus próprios
            infoprodutos — com métricas de verdade em cada etapa.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/admin" className="btn-buy px-7 py-3 text-sm">
              Começar agora — é grátis →
            </Link>
            {featured && (
              <Link href={`/p/${featured.slug}`} className="btn-ghost px-6 py-3 text-sm">
                Ver página de vendas
              </Link>
            )}
          </div>
          <p className="mt-2.5 text-[11px] text-white/35">
            Sem cartão de crédito · dados de exemplo já carregados · você pode apagar tudo depois
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/35">
            <span>Login por senha</span>
            <span>·</span>
            <span>Funciona sem API oficial</span>
            <span>·</span>
            <span>Dados seus, no seu banco</span>
          </div>
        </div>

        {/* prova social — números reais do banco */}
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-white/[0.07] py-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="flex -space-x-1.5">
              {['JM', 'PA', 'CR', 'RS'].map((initials) => (
                <span
                  key={initials}
                  className="grid h-5 w-5 place-items-center rounded-full border border-ink-950 bg-gradient-to-br from-brand-500 to-brand-700 text-[8px] font-bold text-white"
                >
                  {initials}
                </span>
              ))}
            </span>
            comissões registradas no painel
          </span>
          <span>·</span>
          <span>{db.products.length} produtos no catálogo</span>
          <span>·</span>
          <span>{db.content_posts.length} roteiros prontos</span>
          <span>·</span>
          <span>{brl(s.commissionApproved, { compact: true })} de comissão acumulada</span>
        </div>

        {/* card de métricas */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="card p-4">
              <p className="font-display text-2xl font-bold text-white">{item.value}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/35">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pilares */}
      <section className="relative mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Quatro peças que faltavam na sua rotina
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/45">
          A maioria dos afiliados perde dinheiro por falta de processo: escolhe produto no achismo, grava sem roteiro
          e não sabe o que funcionou. Aqui tudo fica registrado.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="card card-hover p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-white/15 to-white/[0.03] text-base text-white">
                {pillar.icon}
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-white">{pillar.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">{pillar.description}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {pillar.points.map((point) => (
                  <li key={point} className="badge bg-white/[0.06] text-white/55 ring-white/10">
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* fluxo */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Como funciona na prática</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-4">
            {[
              { step: '01', title: 'Cole seu link de afiliado', text: 'Da Shopee, TikTok Shop, Mercado Livre ou Amazon. Informe preço e comissão.' },
              { step: '02', title: 'Gere o roteiro do vídeo', text: 'Escolha formato e tom. O estúdio devolve gancho, cenas, legenda e hashtags.' },
              { step: '03', title: 'Publique e divulgue', text: 'Use o link rastreável na bio e nos comentários. Cada clique fica registrado.' },
              { step: '04', title: 'Acompanhe e repita', text: 'Veja o que converte, registre as comissões e escale o que funciona.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="font-display text-3xl font-extrabold text-white/10">{item.step}</span>
                <h3 className="mt-1 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-[12px] leading-snug text-white/40">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* plataformas */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-display text-xl font-bold tracking-tight text-white">Integrado com o que você já usa</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(PLATFORM_LABEL) as (keyof typeof PLATFORM_LABEL)[])
            .filter((p) => p !== 'outro')
            .map((p) => (
              <span key={p} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60">
                {PLATFORM_LABEL[p]}
              </span>
            ))}
        </div>
        <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-white/35">
          Você continua usando o painel oficial de cada plataforma para gerar links e conferir comissões. A plataforma
          consolida o que você divulga, mede os cliques e guarda o histórico — sem depender de API aprovada.
        </p>
      </section>

      {/* CTA final */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600/25 via-ink-900 to-ink-950 p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/25 blur-3xl" />
          <h2 className="relative font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Seu próximo vídeo pode ser o que vende
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/50">
            Entre no painel, cadastre um produto e gere o primeiro roteiro em menos de dois minutos.
          </p>
          <Link href="/admin" className="btn-primary relative mt-6 px-7 py-3 text-sm shadow-glow">
            Começar agora →
          </Link>
          {process.env.NODE_ENV !== 'production' && (
            <p className="relative mt-3 text-[10px] text-white/25">
              Demonstração · senha padrão{' '}
              <code className="rounded bg-black/30 px-1 text-white/50">ricartes</code>
            </p>
          )}
        </div>
      </section>

      <footer className="relative border-t border-white/[0.07] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-[11px] text-white/30">
              {BRAND.name} · {db.settings.handle}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/30">
            <Link href="/admin" className="hover:text-white/60">
              Painel
            </Link>
            {featured && (
              <Link href={`/p/${featured.slug}`} className="hover:text-white/60">
                Loja
              </Link>
            )}
            <span>Feito com Next.js + Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
