// ---------------------------------------------------------------------------
// Dados de demonstração — a plataforma abre já populada e com gráficos reais.
// ---------------------------------------------------------------------------

import type {
  ClickEvent,
  ContentPost,
  Conversion,
  Database,
  Device,
  Infoproduct,
  Order,
  Product,
  Settings,
} from './types';
import { slugify } from './format';
import { generateForProduct, type ContentFormat } from './content-engine';

function iso(daysAgo: number, hour = 12, minute = 0): string {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  // Nunca inventa evento no futuro: se o horário sorteado ainda não chegou,
  // recua um dia (mantém a curva de 45 dias sem distorcer os gráficos).
  if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 1);
  return d.toISOString();
}

// PRNG determinístico para os dados de demo
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_SETTINGS: Settings = {
  display_name: 'Ricarte',
  handle: '@ricartes',
  bio: 'Achadinhos que valem a pena • Testo antes de indicar • Links com cupom todo dia',
  pix_key: 'ricartes@exemplo.com',
  whatsapp: '5585999999999',
  support_email: 'contato@ricartes.com',
  default_commission_pct: 12,
  affiliate_programs: [
    { platform: 'shopee', status: 'conectado', note: 'Programa de Afiliados Shopee aprovado' },
    { platform: 'tiktok', status: 'pendente', note: 'Aguardando aprovação do TikTok Shop' },
    { platform: 'mercadolivre', status: 'nao_iniciado', note: 'Falta gerar links no Mercado Livre Afiliados' },
    { platform: 'amazon', status: 'pendente', note: 'Associados Amazon em análise' },
    { platform: 'hotmart', status: 'conectado', note: 'Produtor verificado' },
    { platform: 'kiwify', status: 'conectado', note: 'Conta ativa para infoprodutos' },
  ],
};

const PRODUCT_SEEDS: Array<Omit<Product, 'id' | 'slug' | 'created_at'>> = [
  {
    name: 'Organizador de Geladeira Empilhável (kit 4)',
    platform: 'shopee',
    category: 'Cozinha',
    price: 49.9,
    commission_pct: 14,
    affiliate_url: 'https://shopee.com.br/product/000/111?af_siteid=ricartes',
    status: 'ativo',
    notes: 'Melhor conversão em vídeo de "geladeira organizada".',
  },
  {
    name: 'Air Fryer 4L Digital Antiaderente',
    platform: 'shopee',
    category: 'Cozinha',
    price: 289.9,
    commission_pct: 8,
    affiliate_url: 'https://shopee.com.br/product/000/222?af_siteid=ricartes',
    status: 'ativo',
    notes: 'Ticket alto, comissão menor. Ótimo para vídeo comparativo.',
  },
  {
    name: 'Fone Bluetooth TWS com Cancelamento de Ruído',
    platform: 'tiktok',
    category: 'Tecnologia',
    price: 159.9,
    commission_pct: 18,
    affiliate_url: 'https://shop.tiktok.com/view/product/1729000001',
    status: 'ativo',
    notes: 'Comissão alta no TikTok Shop.',
  },
  {
    name: 'Sérum Facial Vitamina C 30ml',
    platform: 'shopee',
    category: 'Beleza',
    price: 39.9,
    commission_pct: 20,
    affiliate_url: 'https://shopee.com.br/product/000/333?af_siteid=ricartes',
    status: 'ativo',
    notes: 'Achadinho de beleza com margem excelente.',
  },
  {
    name: 'Kit 3 Potes Herméticos de Vidro',
    platform: 'mercadolivre',
    category: 'Cozinha',
    price: 79.9,
    commission_pct: 6,
    affiliate_url: 'https://mercadolivre.com.br/p/MLB123456?matt_tool=ricartes',
    status: 'ativo',
  },
  {
    name: 'Mop Giratório com Balde e Espremedor',
    platform: 'shopee',
    category: 'Casa',
    price: 89.9,
    commission_pct: 11,
    affiliate_url: 'https://shopee.com.br/product/000/444?af_siteid=ricartes',
    status: 'ativo',
  },
  {
    name: 'Elástico de Treino Kit 5 Níveis',
    platform: 'tiktok',
    category: 'Fitness',
    price: 39.9,
    commission_pct: 22,
    affiliate_url: 'https://shop.tiktok.com/view/product/1729000002',
    status: 'ativo',
  },
  {
    name: 'Luminária de Mesa LED com 3 Tons',
    platform: 'amazon',
    category: 'Casa',
    price: 119.9,
    commission_pct: 5,
    affiliate_url: 'https://amazon.com.br/dp/B0EXAMPLE?tag=ricartes-20',
    status: 'pausado',
    notes: 'Pausado: comissão baixa para o esforço de conteúdo.',
  },
  {
    name: 'Tapete de Atividades Infantil Educativo',
    platform: 'shopee',
    category: 'Infantil',
    price: 69.9,
    commission_pct: 15,
    affiliate_url: 'https://shopee.com.br/product/000/555?af_siteid=ricartes',
    status: 'ativo',
  },
  {
    name: 'Camiseta Oversized Algodão Premium',
    platform: 'tiktok',
    category: 'Moda',
    price: 59.9,
    commission_pct: 16,
    affiliate_url: 'https://shop.tiktok.com/view/product/1729000003',
    status: 'rascunho',
  },
];

const DEVICES: Device[] = ['mobile', 'mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
const SOURCES = ['tiktok', 'tiktok', 'tiktok', 'instagram', 'whatsapp', 'direto', 'youtube'];
const REFERRERS = [
  'https://www.tiktok.com/',
  'https://www.instagram.com/',
  'https://www.google.com/',
  'https://l.instagram.com/',
  '',
];

export function buildDemoDatabase(): Database {
  const rnd = mulberry32(20261027);

  const products: Product[] = PRODUCT_SEEDS.map((p, i) => ({
    ...p,
    id: `prd_${String(i + 1).padStart(3, '0')}`,
    slug: slugify(p.name).split('-').slice(0, 4).join('-'),
    created_at: iso(60 - i * 3),
  }));

  // Popularidade relativa de cada produto (quanto clique/venda gera)
  const weights = [1.0, 0.75, 1.35, 1.15, 0.5, 0.7, 1.25, 0.25, 0.55, 0.2];

  const clicks: ClickEvent[] = [];
  let clickIdx = 0;
  // Série de 45 dias com crescimento suave (a plataforma está "rodando")
  for (let day = 44; day >= 0; day--) {
    const growth = 1 + (44 - day) * 0.018;
    const weekday = new Date(Date.now() - day * 86400000).getDay();
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.25 : 1;
    const base = Math.round((9 + rnd() * 7) * growth * weekendBoost);

    for (let c = 0; c < base; c++) {
      // escolhe produto por peso
      const totalW = weights.reduce((a, b) => a + b, 0);
      let r = rnd() * totalW;
      let idx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          idx = i;
          break;
        }
      }
      const product = products[idx];
      if (!product || product.status === 'rascunho') continue;

      const hour = Math.floor(6 + rnd() * 17);
      const minute = Math.floor(rnd() * 60);
      const source = SOURCES[Math.floor(rnd() * SOURCES.length)];
      clicks.push({
        id: `clk_${String(++clickIdx).padStart(5, '0')}`,
        product_id: product.id,
        slug: product.slug,
        ts: iso(day, hour, minute),
        device: DEVICES[Math.floor(rnd() * DEVICES.length)],
        referrer: REFERRERS[Math.floor(rnd() * REFERRERS.length)],
        source,
      });
    }
  }

  // Conversões: taxa de ~3-6% dos cliques, distribuídas por produto
  const clicksByProduct = new Map<string, ClickEvent[]>();
  for (const c of clicks) {
    const arr = clicksByProduct.get(c.product_id) ?? [];
    arr.push(c);
    clicksByProduct.set(c.product_id, arr);
  }

  const conversions: Conversion[] = [];
  let convIdx = 0;
  for (const product of products) {
    const list = clicksByProduct.get(product.id) ?? [];
    const rate = product.platform === 'tiktok' ? 0.055 : product.platform === 'shopee' ? 0.042 : 0.028;
    for (const click of list) {
      if (rnd() > rate) continue;
      const daysSince = (Date.now() - new Date(click.ts).getTime()) / 86400000;
      // vendas muito recentes ainda pendentes
      const status = daysSince < 4 ? (rnd() > 0.45 ? 'pendente' : 'aprovada') : rnd() > 0.94 ? 'cancelada' : 'aprovada';
      const commission = (product.price * product.commission_pct) / 100;
      conversions.push({
        id: `cnv_${String(++convIdx).padStart(4, '0')}`,
        product_id: product.id,
        amount: product.price,
        commission: Number(commission.toFixed(2)),
        status,
        created_at: click.ts,
      });
    }
  }

  // Conteúdos já planejados / publicados
  const contentSeeds: Array<{
    productIdx: number;
    format: ContentFormat;
    status: ContentPost['status'];
    daysAgo: number;
  }> = [
    { productIdx: 0, format: 'antes-depois', status: 'publicado', daysAgo: 12 },
    { productIdx: 2, format: 'review', status: 'publicado', daysAgo: 9 },
    { productIdx: 3, format: 'unboxing', status: 'publicado', daysAgo: 6 },
    { productIdx: 6, format: 'top3', status: 'gravado', daysAgo: 2 },
    { productIdx: 5, format: 'problema-solucao', status: 'roteirizado', daysAgo: 1 },
    { productIdx: 1, format: 'comparativo', status: 'ideia', daysAgo: 0 },
    { productIdx: 8, format: 'tutorial', status: 'ideia', daysAgo: 0 },
  ];

  const content_posts: ContentPost[] = contentSeeds.map((s, i) => {
    const product = products[s.productIdx]!;
    const gen = generateForProduct(product, s.format, 'direto', 'geral', i);
    return {
      id: `cnt_${String(i + 1).padStart(3, '0')}`,
      product_id: product.id,
      platform: 'tiktok',
      title: gen.title,
      hook: gen.hook,
      script: gen.script,
      caption: gen.caption,
      hashtags: gen.hashtags,
      status: s.status,
      scheduled_at: s.status === 'ideia' || s.status === 'roteirizado' ? iso(-3 + i) : undefined,
      published_at: s.status === 'publicado' ? iso(s.daysAgo, 19, 30) : undefined,
      created_at: iso(s.daysAgo + 1),
    };
  });

  const infoproducts: Infoproduct[] = [
    {
      id: 'inf_001',
      slug: 'achadinhos-que-vendem',
      name: 'Achadinhos que Vendem',
      tagline: 'O método que transformou 3 seguidores em R$ 7.400/mês de comissão',
      description:
        'Um guia direto ao ponto para quem quer viver de recomendar produtos na Shopee e no TikTok Shop sem aparecer, sem gastar com anúncios e sem depender de sorte no algoritmo. São 6 módulos com os roteiros que realmente convertem, a planilha de escolha de produto e o calendário de postagem de 30 dias.',
      price: 97,
      original_price: 197,
      benefits: [
        'Escolha produtos com comissão alta e pouca concorrência (planilha inclusa)',
        'Roteiros prontos de 15s, 30s e 60s que já deram certo',
        'Como configurar o link rastreável e saber de onde vem cada venda',
        'Calendário de 30 dias de postagem — sem travar na ideia',
        'Como pedir amostra grátis para marcas e lojas',
        'Mentalidade de creator: consistência sem burnout',
      ],
      bonuses: [
        { title: 'Planilha de Produtos Vencedores', description: '50 nichos mapeados com comissão média e concorrência.' },
        { title: 'Pack de 120 Ganchos', description: 'Frases de abertura testadas para os primeiros 3 segundos.' },
        { title: 'Aula: TikTok Shop do zero', description: 'Passo a passo para liberar o carrinho amarelo.' },
      ],
      testimonials: [
        { name: 'Juliana M.', role: 'Aluna desde março', text: 'Em 3 semanas bati R$ 1.200 de comissão só replicando os roteiros do módulo 2.' },
        { name: 'Pedro A.', role: 'Afiliado Shopee', text: 'A planilha sozinha já pagou o curso. Parei de testar produto aleatório.' },
        { name: 'Camila R.', role: 'Mãe e criadora', text: 'Posto 1 vídeo por dia no intervalo do almoço. Nunca foi tão simples.' },
      ],
      checkout_url: '',
      pix_key: 'ricartes@exemplo.com',
      whatsapp: '5585999999999',
      theme: 'royal',
      status: 'ativo',
      created_at: iso(30),
    },
    {
      id: 'inf_002',
      slug: 'tiktok-sem-aparecer',
      name: 'TikTok Sem Aparecer',
      tagline: 'Faça vídeos que vendem usando só as mãos, o produto e a voz',
      description:
        'Para quem tem vergonha de aparecer: um sistema de produção de vídeos com foco em produto, texto na tela e narração. Inclui 40 modelos de vídeo "mãos + produto", banco de áudios em alta e checklist de edição no CapCut em menos de 10 minutos.',
      price: 67,
      original_price: 127,
      benefits: [
        '40 modelos de vídeo sem mostrar o rosto',
        'Checklist de edição no CapCut em 10 minutos',
        'Como escolher áudios em alta antes de viralizar',
        'Estrutura de conta que o algoritmo entende rápido',
      ],
      bonuses: [
        { title: 'Banco de 60 áudios', description: 'Sons que funcionam para nicho de achadinhos.' },
        { title: 'Template de CapCut', description: 'Projeto pronto para só trocar os clipes.' },
      ],
      testimonials: [
        { name: 'Rafael S.', text: 'Eu odeio aparecer. Fiz 12 vídeos no modelo e 4 passaram de 50 mil views.' },
        { name: 'Bianca L.', text: 'O checklist de edição me economiza 1h por vídeo.' },
      ],
      pix_key: 'ricartes@exemplo.com',
      whatsapp: '5585999999999',
      theme: 'midnight',
      status: 'ativo',
      created_at: iso(20),
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord_001',
      infoproduct_id: 'inf_001',
      customer_name: 'Juliana Martins',
      customer_email: 'juliana@exemplo.com',
      amount: 97,
      payment_method: 'pix',
      status: 'pago',
      utm_source: 'tiktok',
      created_at: iso(5, 20, 12),
    },
    {
      id: 'ord_002',
      infoproduct_id: 'inf_002',
      customer_name: 'Rafael Souza',
      customer_email: 'rafael@exemplo.com',
      amount: 67,
      payment_method: 'cartao',
      status: 'pago',
      utm_source: 'instagram',
      created_at: iso(4, 15, 40),
    },
    {
      id: 'ord_003',
      infoproduct_id: 'inf_001',
      customer_name: 'Bianca Lima',
      customer_email: 'bianca@exemplo.com',
      amount: 97,
      payment_method: 'pix',
      status: 'pago',
      utm_source: 'tiktok',
      created_at: iso(2, 9, 5),
    },
    {
      id: 'ord_004',
      infoproduct_id: 'inf_001',
      customer_name: 'Camila Rocha',
      customer_email: 'camila@exemplo.com',
      amount: 97,
      payment_method: 'pix',
      status: 'pendente',
      utm_source: 'tiktok',
      created_at: iso(1, 21, 30),
    },
  ];

  return {
    settings: DEMO_SETTINGS,
    products,
    clicks,
    conversions,
    content_posts,
    infoproducts,
    orders,
  };
}
