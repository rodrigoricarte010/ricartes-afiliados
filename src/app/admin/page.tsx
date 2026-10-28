import Link from 'next/link';
import { repo } from '@/lib/db';
import { dashboardStats, goalProgress, monthStats } from '@/lib/stats';
import { brl, num, pct, relativeTime, dateShort } from '@/lib/format';
import { AreaChart, BarsChart, Donut, ProgressBar } from '@/components/charts';
import { PageHeader, StatCard, SectionCard, EmptyState } from '@/components/ui';
import { PLATFORM_COLOR, PLATFORM_LABEL } from '@/lib/types';
import { GoalCard } from './GoalCard';
import { LiveRefresh } from './LiveRefresh';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Visão geral' };

export default async function DashboardPage() {
  const db = await repo.snapshot();
  const s = dashboardStats(db, 30);
  const month = monthStats(db);
  const goal = goalProgress(month, db.settings.monthly_goal ?? 0);

  const clicksTrend = s.clicksPrev7d > 0 ? ((s.clicks7d - s.clicksPrev7d) / s.clicksPrev7d) * 100 : 0;
  const settings = db.settings;

  const series = s.series.map((p) => ({ label: dateShort(`${p.day}T12:00:00`), value: p.clicks }));
  const commissionSeries = s.series.map((p) => ({ label: dateShort(`${p.day}T12:00:00`), value: p.commission }));

  const deviceColors: Record<string, string> = {
    mobile: '#8d78fd',
    desktop: '#b6f24a',
    tablet: '#38bdf8',
    outro: '#8b8b9e',
  };

  const deviceData = s.byDevice.map((d) => ({
    label: d.device,
    value: d.clicks,
    color: deviceColors[d.device] ?? '#8b8b9e',
  }));

  const bestHours = [...s.hourly].sort((a, b) => b.clicks - a.clicks).slice(0, 3).filter((h) => h.clicks > 0);
  const totalClicks30 = s.series.reduce((a, p) => a + p.clicks, 0);
  const totalCommission30 = s.series.reduce((a, p) => a + p.commission, 0);

  // Checklist de primeiros passos
  const steps = [
    {
      done: db.products.length > 0,
      title: 'Cadastrar um produto de afiliado',
      description: 'Cole o link da Shopee/TikTok Shop e o sistema cria seu link rastreável.',
      href: '/admin/produtos',
      cta: 'Cadastrar produto',
    },
    {
      done: db.clicks.length > 0,
      title: 'Divulgar seu link rastreável',
      description: 'Cada clique é registrado com origem, dispositivo e horário.',
      href: '/admin/links',
      cta: 'Ver meus links',
    },
    {
      done: db.content_posts.length > 0,
      title: 'Gerar um roteiro para o TikTok',
      description: 'Gancho, roteiro cena a cena, legenda e hashtags em segundos.',
      href: '/admin/conteudo',
      cta: 'Abrir estúdio',
    },
    {
      done: db.content_posts.some((p) => p.status === 'publicado'),
      title: 'Publicar o primeiro vídeo',
      description: 'Marque como publicado e acompanhe a performance do link.',
      href: '/admin/conteudo',
      cta: 'Ver calendário',
    },
    {
      done: db.infoproducts.length > 0,
      title: 'Criar sua página de vendas',
      description: 'Venda infoprodutos com checkout, Pix e página pronta.',
      href: '/admin/infoprodutos',
      cta: 'Criar página',
    },
  ];
  const pendingSteps = steps.filter((st) => !st.done);

  const isDemo = settings.is_demo;

  return (
    <div>
      {isDemo && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-100">Você está vendo dados de demonstração</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-amber-100/60">
              Os {db.products.length} produtos, {num(db.clicks.length)} cliques e {db.conversions.length} comissões
              abaixo são exemplos criados na primeira execução — nenhum é real. Comece do zero quando quiser.
            </p>
          </div>
          <Link
            href="/admin/configuracoes"
            className="btn btn-sm shrink-0 border border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
          >
            Limpar e começar do zero
          </Link>
        </div>
      )}

      <div className="mb-2 flex justify-end">
        <LiveRefresh />
      </div>

      <PageHeader
        title={`Olá, ${settings.display_name || 'afiliado'} 👋`}
        description="Aqui está o resumo dos seus últimos 30 dias como afiliado e produtor."
        action={
          <>
            <Link href="/admin/conteudo" className="btn-lime btn-sm sm:text-sm">
              ✦ Gerar roteiro
            </Link>
            <Link href="/admin/produtos" className="btn-primary btn-sm sm:text-sm">
              + Produto
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Comissão aprovada"
          value={brl(s.commissionApproved)}
          hint={`${s.conversions} vendas registradas`}
          accent="brand"
          icon="⛁"
          href="/admin/vendas"
        />
        <StatCard
          label="Cliques (7 dias)"
          value={num(s.clicks7d)}
          hint="vs. 7 dias anteriores"
          trend={clicksTrend}
          accent="lime"
          icon="⇄"
          href="/admin/links"
        />
        <StatCard
          label="Taxa de conversão"
          value={pct(s.cvr)}
          hint={`EPC ${brl(s.epc)} por clique`}
          accent="sky"
          icon="◎"
        />
        <StatCard
          label="A receber"
          value={brl(s.commissionPending)}
          hint="comissões pendentes de aprovação"
          icon="⏳"
          href="/admin/vendas"
        />
      </div>

      <div className="mt-4">
        <GoalCard month={month} goal={goal} isDemo={isDemo} />
      </div>

      {/* Gráficos principais */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Cliques por dia"
          subtitle={`${num(totalClicks30)} cliques nos últimos 30 dias`}
          action={<span className="text-[11px] text-white/35">30 dias</span>}
        >
          <AreaChart data={series} height={190} color="#8d78fd" />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/35">Média/dia</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{num(Math.round(totalClicks30 / 30))}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/35">Melhor dia</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {dateShort(s.series.reduce((a, b) => (b.clicks > a.clicks ? b : a), s.series[0]!).day + 'T12:00:00')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/35">Comissão no período</p>
              <p className="mt-0.5 text-sm font-semibold text-lime-300">{brl(totalCommission30)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Origem do tráfego" subtitle="De onde vêm seus cliques">
          {s.bySource.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/35">Sem cliques ainda.</p>
          ) : (
            <div className="space-y-3">
              {s.bySource.slice(0, 5).map((src, i) => (
                <div key={src.source}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-white/70">{src.source}</span>
                    <span className="text-white/45">
                      {num(src.clicks)} · {brl(src.commission)}
                    </span>
                  </div>
                  <ProgressBar
                    value={src.clicks}
                    max={s.bySource[0]!.clicks}
                    color={['#8d78fd', '#b6f24a', '#38bdf8', '#f59e0b', '#f472b6'][i] ?? '#8b8b9e'}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-wider text-white/35">Dispositivos</p>
            {deviceData.length > 0 ? (
              <Donut data={deviceData} size={100} thickness={12} />
            ) : (
              <p className="text-sm text-white/35">—</p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Top produtos */}
        <SectionCard
          className="lg:col-span-2"
          title="Produtos que mais rendem"
          subtitle="Ordenado por comissão aprovada"
          action={
            <Link href="/admin/produtos" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
              Ver todos →
            </Link>
          }
          padded={false}
        >
          {s.topProducts.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nenhum produto cadastrado"
                description="Cadastre seu primeiro produto de afiliado para começar a rastrear cliques e comissões."
                action={
                  <Link href="/admin/produtos" className="btn-primary btn-sm">
                    Cadastrar produto
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="text-right">Cliques</th>
                    <th className="text-right">CVR</th>
                    <th className="text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {s.topProducts.map(({ product, clicks, cvr, commission, conversions }) => (
                    <tr key={product.id}>
                      <td>
                        <Link href={`/admin/produtos/${product.id}`} className="group flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/50">
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[190px] truncate text-[13px] font-medium text-white group-hover:text-brand-300 sm:max-w-[260px]">
                              {product.name}
                            </span>
                            <span className={`badge mt-1 ${PLATFORM_COLOR[product.platform]}`}>
                              {PLATFORM_LABEL[product.platform]}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-right text-white/70">{num(clicks)}</td>
                      <td className="text-right text-white/70">
                        {pct(cvr)}
                        <span className="ml-1 text-[10px] text-white/30">({conversions})</span>
                      </td>
                      <td className="text-right font-semibold text-lime-300">{brl(commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Melhores horários */}
        <SectionCard title="Melhores horários" subtitle="Quando seu público clica (0h–23h)">
          <BarsChart data={s.hourly.map((h) => ({ label: String(h.hour), value: h.clicks }))} height={100} />
          <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Poste nesses horários</p>
            <div className="flex flex-wrap gap-2">
              {bestHours.length > 0 ? (
                bestHours.map((h) => (
                  <span key={h.hour} className="badge bg-brand-500/15 text-brand-200 ring-brand-500/25">
                    {String(h.hour).padStart(2, '0')}h · {num(h.clicks)} cliques
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/35">Sem dados</span>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Atividade recente */}
        <SectionCard className="lg:col-span-2" title="Atividade recente" subtitle="Cliques e vendas em tempo real" padded={false}>
          <ul className="divide-y divide-white/[0.05]">
            {[...s.recentClicks.map((c) => ({ kind: 'click' as const, at: c.ts, data: c })),
              ...s.recentConversions.map((c) => ({ kind: 'sale' as const, at: c.created_at, data: c }))]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .slice(0, 7)
              .map((item) => (
                <li key={`${item.kind}-${item.data.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs ${
                      item.kind === 'sale'
                        ? 'bg-lime-500/15 text-lime-300'
                        : 'bg-white/[0.06] text-white/50'
                    }`}
                  >
                    {item.kind === 'sale' ? '⛁' : '⇄'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-white/80">
                      {item.kind === 'sale' ? (
                        <>
                          Venda de <span className="font-semibold">{item.data.productName}</span>
                        </>
                      ) : (
                        <>
                          Clique em <span className="font-semibold text-white/70">{item.data.productName ?? 'produto'}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-white/35">
                      {relativeTime(item.at)}
                      {item.kind === 'click' && 'source' in item.data && item.data.source
                        ? ` · via ${item.data.source}`
                        : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    {item.kind === 'sale' && 'commission' in item.data ? (
                      <span
                        className={
                          item.data.status === 'aprovada'
                            ? 'font-semibold text-lime-300'
                            : item.data.status === 'pendente'
                              ? 'text-amber-300'
                              : 'text-white/30 line-through'
                        }
                      >
                        {brl(item.data.commission)}
                      </span>
                    ) : (
                      <span className="text-white/30">{'device' in item.data ? item.data.device : ''}</span>
                    )}
                  </div>
                </li>
              ))}
            {s.recentClicks.length === 0 && s.recentConversions.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-white/35">Nenhuma atividade ainda.</li>
            )}
          </ul>
        </SectionCard>

        {/* Checklist */}
        <SectionCard title="Próximos passos" subtitle={`${steps.length - pendingSteps.length}/${steps.length} concluídos`}>
          <div className="mb-4">
            <ProgressBar
              value={steps.length - pendingSteps.length}
              max={steps.length}
              color="#9ee22b"
            />
          </div>
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                    step.done ? 'bg-lime-500 text-ink-950' : 'bg-white/[0.08] text-white/40'
                  }`}
                >
                  {step.done ? '✓' : ''}
                </span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium ${step.done ? 'text-white/40 line-through' : 'text-white'}`}>
                    {step.title}
                  </p>
                  {!step.done && (
                    <>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/40">{step.description}</p>
                      <Link href={step.href} className="mt-1 inline-block text-[11px] font-semibold text-brand-300 hover:text-brand-200">
                        {step.cta} →
                      </Link>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Upsell infoprodutos */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-500/20 blur-2xl" />
          <p className="text-[10px] uppercase tracking-wider text-white/35">Infoprodutos</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{brl(s.ordersRevenue)}</p>
          <p className="mt-0.5 text-xs text-white/45">
            {s.ordersPaid} pedido{s.ordersPaid === 1 ? '' : 's'} pago{s.ordersPaid === 1 ? '' : 's'} · {db.infoproducts.length} produto
            {db.infoproducts.length === 1 ? '' : 's'} publicado{db.infoproducts.length === 1 ? '' : 's'}
          </p>
          <div className="mt-3">
            <AreaChart data={commissionSeries} height={60} color="#b6f24a" showAxis={false} formatValue={(v) => brl(v, { compact: true })} />
          </div>
          <Link href="/admin/infoprodutos" className="mt-2 inline-block text-xs font-semibold text-lime-300 hover:text-lime-200">
            Gerenciar infoprodutos →
          </Link>
        </div>

        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Programas de afiliado</p>
          <ul className="mt-3 space-y-2">
            {settings.affiliate_programs.slice(0, 4).map((p) => (
              <li key={p.platform} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-white/65">{PLATFORM_LABEL[p.platform]}</span>
                <span
                  className={`badge ${
                    p.status === 'conectado'
                      ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
                      : p.status === 'pendente'
                        ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
                        : 'bg-white/[0.06] text-white/40 ring-white/10'
                  }`}
                >
                  {p.status === 'conectado' ? 'conectado' : p.status === 'pendente' ? 'em análise' : 'não iniciado'}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/configuracoes" className="mt-3 inline-block text-xs font-semibold text-white/50 hover:text-white">
            Gerenciar programas →
          </Link>
        </div>
      </div>
    </div>
  );
}
