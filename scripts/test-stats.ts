// ---------------------------------------------------------------------------
// Testes das métricas (src/lib/stats.ts) com dados montados à mão.
// Roda com: npm run test:stats
// ---------------------------------------------------------------------------

import { productStats, dashboardStats, monthStats, goalProgress } from '../src/lib/stats';
import type { ClickEvent, Conversion, Database } from '../src/lib/types';

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`, detail ?? '');
  }
}

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

function buildDb(): Database {
  const clicks: ClickEvent[] = [
    // produto A: clique no tiktok 10 dias atrás, depois um clique "direto" 2 dias
    // antes da venda (deve ser o atribuído)
    { id: 'cl1', product_id: 'pra', slug: 'a', ts: iso(10), device: 'mobile', source: 'tiktok' },
    { id: 'cl2', product_id: 'pra', slug: 'a', ts: iso(3), device: 'mobile' },
    { id: 'cl3', product_id: 'pra', slug: 'a', ts: iso(1), device: 'desktop', source: 'instagram' },
    // produto B: só cliques antigos
    { id: 'cl4', product_id: 'prb', slug: 'b', ts: iso(20), device: 'mobile', source: 'whatsapp' },
  ];

  const conversions: Conversion[] = [
    // venda de A: o último clique antes dela é cl3 (instagram)
    { id: 'cv1', product_id: 'pra', amount: 100, commission: 10, status: 'aprovada', created_at: iso(0.5) },
    { id: 'cv2', product_id: 'pra', amount: 200, commission: 20, status: 'pendente', created_at: iso(1.5) },
    { id: 'cv3', product_id: 'pra', amount: 50, commission: 5, status: 'cancelada', created_at: iso(2) },
  ];

  return {
    settings: {
      display_name: 'Teste',
      handle: '@teste',
      bio: '',
      pix_key: '',
      whatsapp: '',
      support_email: '',
      default_commission_pct: 10,
      monthly_goal: 1000,
      is_demo: false,
      affiliate_programs: [],
    },
    products: [
      {
        id: 'pra',
        slug: 'a',
        name: 'Produto A',
        platform: 'shopee',
        category: 'Casa',
        price: 100,
        commission_pct: 10,
        affiliate_url: 'https://exemplo.com/a',
        status: 'ativo',
        created_at: iso(30),
      },
      {
        id: 'prb',
        slug: 'b',
        name: 'Produto B',
        platform: 'tiktok',
        category: 'Beleza',
        price: 50,
        commission_pct: 20,
        affiliate_url: 'https://exemplo.com/b',
        status: 'ativo',
        created_at: iso(40),
      },
    ],
    clicks,
    conversions,
    content_posts: [],
    infoproducts: [],
    orders: [
      {
        id: 'or1',
        infoproduct_id: 'inf1',
        customer_name: 'Cliente',
        customer_email: 'c@exemplo.com',
        amount: 97,
        payment_method: 'pix',
        status: 'pago',
        created_at: iso(1),
      },
      {
        id: 'or2',
        infoproduct_id: 'inf1',
        customer_name: 'Cliente 2',
        customer_email: 'c2@exemplo.com',
        amount: 97,
        payment_method: 'pix',
        status: 'pendente',
        created_at: iso(1),
      },
    ],
  };
}

function main() {
  const db = buildDb();

  console.log('\n1. productStats agrega por produto');
  const stats = productStats(db);
  const a = stats.find((s) => s.product.id === 'pra')!;
  const b = stats.find((s) => s.product.id === 'prb')!;
  check('A: 3 cliques', a.clicks === 3, a.clicks);
  check('A: 2 cliques nos últimos 7 dias', a.clicks7d === 2, a.clicks7d);
  check('A: 3 conversões (todas)', a.conversions === 3, a.conversions);
  check('A: 1 aprovada', a.approved === 1, a.approved);
  check('A: 1 pendente', a.pending === 1, a.pending);
  check('A: comissão aprovada 10', Math.abs(a.commission - 10) < 1e-9, a.commission);
  check('A: CVR 100% (3 vendas / 3 cliques)', Math.abs(a.cvr - 100) < 1e-9, a.cvr);
  check('B: só 1 clique antigo', b.clicks === 1 && b.clicks7d === 0, b);
  check('B: sem comissão', b.commission === 0, b.commission);
  check('ordenado por comissão (A primeiro)', stats[0]!.product.id === 'pra');

  console.log('\n2. Atribuição pela regra do último clique antes da venda');
  const dash = dashboardStats(db, 30);
  const instagram = dash.bySource.find((s) => s.source === 'instagram');
  const tiktok = dash.bySource.find((s) => s.source === 'tiktok');
  const direto = dash.bySource.find((s) => s.source === 'direto');
  check('venda de A caiu em instagram (clique mais recente)', instagram?.commission === 10, instagram);
  check('tiktok não levou a comissão', (tiktok?.commission ?? 0) === 0, tiktok);
  check('conversão "direto" não foi inventada', (direto?.commission ?? 0) === 0, direto);
  check('total de cliques por origem = 4', dash.bySource.reduce((x, s) => x + s.clicks, 0) === 4);

  console.log('\n3. Janelas de 7 e 14 dias');
  check('cliques7d = 2', dash.clicks7d === 2, dash.clicks7d);
  check('cliquesPrev7d = 1 (o de 10 dias)', dash.clicksPrev7d === 1, dash.clicksPrev7d);
  check('KPI de comissão aprovada = 10', Math.abs(dash.commissionApproved - 10) < 1e-9);
  check('KPI pendente = 20', Math.abs(dash.commissionPending - 20) < 1e-9);

  console.log('\n4. monthStats (mês corrente, fuso do painel)');
  const month = monthStats(db);
  check('rótulo no formato "mês de ano"', / de \d{4}$/.test(month.label), month.label);
  check('total = comissão + infoprodutos (10 + 97)', month.total === 107, month);
  check('comissões do mês só com aprovadas', month.commission === 10, month.commission);
  check('pedido pendente não entra no faturamento', month.ordersRevenue === 97, month.ordersRevenue);
  check('cliques no mês contabilizados', month.clicks >= 2, month.clicks);
  check('dias no mês correto', month.daysInMonth >= 28 && month.daysInMonth <= 31, month.daysInMonth);

  console.log('\n5. goalProgress (meta honesta)');
  const g = goalProgress(month, 1000);
  check('progresso = total/meta', Math.abs(g.progress - 10.7) < 1e-9, g.progress);
  check('falta = 893', Math.abs(g.remaining - 893) < 1e-9, g.remaining);
  check('dias restantes plausíveis', g.daysLeft >= 1 && g.daysLeft <= 31, g.daysLeft);
  check('meta batida quando total >= meta', goalProgress(month, 100).hit === true);
  check('sem meta (0) não divide por zero', goalProgress(month, 0).hasGoal === false && goalProgress(month, 0).progress === 0);
  check('projeção = média/dia × dias do mês', Math.abs(g.projected - (month.total / month.day) * month.daysInMonth) < 1e-6);

  console.log(failures === 0 ? '\n✅ Todos os testes de métricas passaram.\n' : `\n❌ ${failures} verificação(ões) falharam.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
