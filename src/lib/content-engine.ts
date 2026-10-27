// ---------------------------------------------------------------------------
// Motor de conteúdo: gera ganchos, roteiros, legendas e hashtags para vídeos
// curtos (TikTok / Reels / Shorts) a partir dos dados de um produto.
//
// É 100% determinístico e offline: o mesmo (produto + formato + seed) gera o
// mesmo roteiro. Trocar a seed ("Variar") produz uma nova combinação.
// ---------------------------------------------------------------------------

import type { Platform, Product } from './types';
import { brl } from './format';

export type ContentFormat =
  | 'review'
  | 'unboxing'
  | 'problema-solucao'
  | 'top3'
  | 'antes-depois'
  | 'tutorial'
  | 'prova-social'
  | 'comparativo';

export type ContentTone = 'direto' | 'humor' | 'storytelling' | 'urgente';
export type ContentAudience = 'geral' | 'donas-de-casa' | 'jovens' | 'mães' | 'trabalhadores' | 'gamers';

export interface GenerateInput {
  productName: string;
  price: number;
  category: string;
  platform: Platform;
  format: ContentFormat;
  tone: ContentTone;
  audience: ContentAudience;
  seed?: number;
}

export interface GeneratedContent {
  title: string;
  hook: string;
  hookAlternatives: string[];
  script: string;
  caption: string;
  hashtags: string;
  estimatedSeconds: number;
}

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  review: 'Resenha honesta',
  unboxing: 'Unboxing / primeira impressão',
  'problema-solucao': 'Problema → solução',
  top3: 'Top 3 motivos',
  'antes-depois': 'Antes e depois',
  tutorial: 'Tutorial rápido',
  'prova-social': 'Prova social',
  comparativo: 'Comparativo (com e sem)',
};

export const TONE_LABEL: Record<ContentTone, string> = {
  direto: 'Direto ao ponto',
  humor: 'Humor / zoeira',
  storytelling: 'Storytelling',
  urgente: 'Urgência / escassez',
};

export const AUDIENCE_LABEL: Record<ContentAudience, string> = {
  geral: 'Público geral',
  'donas-de-casa': 'Donas de casa',
  jovens: 'Jovens 18–24',
  'mães': 'Mães',
  trabalhadores: 'Quem trabalha fora',
  gamers: 'Gamers',
};

const PLATFORM_CTA: Record<Platform, string> = {
  shopee: 'o link tá na bio, é na Shopee e tá com cupom',
  tiktok: 'o link tá no carrinho amarelo aqui do vídeo',
  mercadolivre: 'o link tá na bio, é no Mercado Livre com frete Full',
  amazon: 'o link tá na bio, é na Amazon com Prime',
  hotmart: 'o link tá na bio, acesso liberado na hora',
  kiwify: 'o link tá na bio, pagamento no Pix e acesso imediato',
  outro: 'o link tá na bio',
};

// ---------------------------------------------------------------------------
// PRNG determinístico
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rnd() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

function pickMany<T>(rnd: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(rnd() * copy.length) % copy.length;
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Banco de ganchos
// ---------------------------------------------------------------------------

const HOOKS: Record<ContentFormat, string[]> = {
  review: [
    'Comprei {produto} achando que era furada. Estava errada.',
    'Gastei {preco} em {produto} pra você não precisar fazer isso.',
    'Ninguém fala a verdade sobre {produto}. Então eu falo.',
    '{produto} por {preco}: vale a pena ou é armadilha?',
    'Eu testei {produto} por 30 dias. O resultado me surpreendeu.',
  ],
  unboxing: [
    'Chegou {produto} e eu não esperava isso dentro da caixa.',
    'Abrindo {produto} que todo mundo tá comprando 👀',
    'Unboxing do {produto} — presta atenção no detalhe do final.',
    'Paguei {preco} nisso. Vamos abrir juntos?',
    'Isso chegou hoje e já virou meu favorito: {produto}.',
  ],
  'problema-solucao': [
    'Se você sofre com {problema}, para tudo e assiste isso.',
    'Eu passava raiva com {problema} até descobrir {produto}.',
    'O problema não é você. É que ninguém te mostrou {produto}.',
    'Cansada de {problema}? Esse treco de {preco} resolveu.',
    'Se {problema} é a sua rotina, esse vídeo é pra você.',
  ],
  top3: [
    '3 motivos pra você comprar {produto} AGORA.',
    'Top 3 coisas que ninguém te conta sobre {produto}.',
    'Se eu tivesse que escolher só 3 motivos pra levar {produto}...',
    'Por que {produto} virou o item mais vendido da categoria?',
    '3 sinais de que você precisa de {produto}.',
  ],
  'antes-depois': [
    'Meu antes e depois com {produto} — e não foi mágica.',
    'Isso era minha rotina antes de {produto}. Olha agora.',
    'A diferença de {produto} em 7 dias é bizarra.',
    'Antes: {problema}. Depois de {produto}: olha isso.',
    'Guardei o antes só pra provar o quanto {produto} muda.',
  ],
  tutorial: [
    'O jeito certo de usar {produto} (90% faz errado).',
    'Truque de 15 segundos com {produto} que ninguém te ensinou.',
    'Como eu uso {produto} pra economizar tempo todo dia.',
    'Para de usar {produto} assim. Olha o jeito certo.',
    '3 formas de usar {produto} que você nunca viu.',
  ],
  'prova-social': [
    'Todo mundo comentou pedindo o link de {produto}. Então toma.',
    'Mais de mil pessoas já levaram {produto}. Eu entendo por quê.',
    'Eu postei {produto} uma vez e o direct não parou mais.',
    'Esse aqui esgotou 2 vezes: {produto}.',
    'Não sou eu que falo: olha os comentários sobre {produto}.',
  ],
  comparativo: [
    'A diferença entre pagar caro e pagar {preco} em {produto}.',
    '{produto} vs. o jeito antigo. Não tem comparação.',
    'Com {produto} x sem {produto}: 30 segundos de diferença.',
    'Comparei {produto} com o que eu usava antes. Choquei.',
    'Por que eu abandonei o método antigo por {produto}.',
  ],
};

const BRIDGES = [
  'Deixa eu te mostrar o que aconteceu.',
  'Olha esse detalhe aqui.',
  'Vou ser sincera com você:',
  'E é aqui que a coisa muda.',
  'Presta atenção nisso.',
  'Muita gente erra nessa parte.',
];

const BENEFITS_BY_CATEGORY: Record<string, string[]> = {
  cozinha: [
    'economiza tempo na rotina da cozinha',
    'deixa tudo organizado e visível',
    'é fácil de limpar (e isso muda tudo)',
    'cabe em qualquer armário',
    'evita desperdício de comida',
  ],
  beleza: [
    'resultado visível sem ir no salão',
    'textura leve, não pesa',
    'cheiro agradável e fixa o dia todo',
    'custo por uso muito menor que o salão',
    'funciona até em pele sensível',
  ],
  tecnologia: [
    'conecta em 10 segundos, sem app chato',
    'bateria que dura o dia inteiro',
    'qualidade de som/imagem acima do preço',
    'é compacto, cabe na bolsa ou no bolso',
    'funciona com Android e iPhone',
  ],
  casa: [
    'resolve a bagunça em minutos',
    'não ocupa espaço',
    'deixa o ambiente com cara de novo',
    'é resistente, não quebra fácil',
    'montagem sem ferramenta',
  ],
  fitness: [
    'treino em casa sem academia',
    'ocupa pouco espaço',
    'resultado em 3 semanas de uso',
    'acompanha a evolução no app',
    'silencioso, dá pra usar de madrugada',
  ],
  infantil: [
    'entretém sem tela',
    'desenvolve coordenação',
    'material atóxico e resistente',
    'vem com tudo que precisa',
    'a criança volta a brincar sozinha',
  ],
  moda: [
    'cai bem em qualquer corpo',
    'tecido que não amassa',
    'combina com tudo que você já tem',
    'preço de fast-fashion, cara de boutique',
    'não desbota na lavagem',
  ],
  default: [
    'custa menos do que parece',
    'resolve um problema real da rotina',
    'é o mais bem avaliado da categoria',
    'chega rápido e não dá dor de cabeça',
    'todo mundo que compra, indica',
  ],
};

const PROBLEMS_BY_CATEGORY: Record<string, string[]> = {
  cozinha: ['geladeira lotada e nada acha', 'comida estragando no fundo da geladeira', 'perder 40 minutos lavando louça'],
  beleza: ['pele oleosa no meio do dia', 'gastar R$ 300 no salão por mês', 'base que craquela'],
  tecnologia: ['fone que embola e desconecta', 'bateria que acaba na metade do dia', 'cabos embolados na mesa'],
  casa: ['casa sempre bagunçada', 'armário sem espaço', 'cheiro de mofo no guarda-roupa'],
  fitness: ['academia caríssima e longe', 'dor nas costas de ficar sentado', 'não ter tempo de treinar'],
  infantil: ['criança grudada no celular', 'brinquedo que quebra em 2 dias', 'não saber o que dar de presente'],
  moda: ['roupa que marca', 'nada combina com nada', 'peça que desbota na primeira lavagem'],
  default: ['perder tempo com coisa que não funciona', 'comprar barato e comprar duas vezes', 'achar que é caro e desistir'],
};

const CAPTION_CTA = [
  'Link na bio 👆',
  'Corre que o cupom expira 👇',
  'Salva esse vídeo pra não perder 🔖',
  'Comenta "QUERO" que eu te mando o link 📩',
  'Arrasta pra cima e garante o seu 🛒',
];

function normalizeCategory(category: string): string {
  const c = category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const map: [string, string][] = [
    ['cozinh', 'cozinha'],
    ['geladeira', 'cozinha'],
    ['airfryer', 'cozinha'],
    ['utensil', 'cozinha'],
    ['beleza', 'beleza'],
    ['skincare', 'beleza'],
    ['pele', 'beleza'],
    ['maquiagem', 'beleza'],
    ['cabelo', 'beleza'],
    ['tecno', 'tecnologia'],
    ['eletron', 'tecnologia'],
    ['fone', 'tecnologia'],
    ['celular', 'tecnologia'],
    ['casa', 'casa'],
    ['decor', 'casa'],
    ['organiz', 'casa'],
    ['fitness', 'fitness'],
    ['treino', 'fitness'],
    ['infantil', 'infantil'],
    ['brinquedo', 'infantil'],
    ['moda', 'moda'],
    ['roupa', 'moda'],
  ];
  for (const [needle, key] of map) {
    if (c.includes(needle)) return key;
  }
  return 'default';
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

const TONE_OPENER: Record<ContentTone, string[]> = {
  direto: ['Vou direto ao ponto.', 'Sem enrolação.', 'Rápido e objetivo:'],
  humor: ['Gente, eu tô rindo até agora 😅', 'Juízo? Nenhum. Coragem? Total.', 'Eu não ia comprar. Spoiler: comprei.'],
  storytelling: ['Semana passada eu quase desisti.', 'Deixa eu começar do início.', 'Isso me pegou de surpresa.'],
  urgente: ['Isso esgota rápido, então corre.', 'Últimas unidades no preço de hoje.', 'Se você for comprar, é agora.'],
};

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

export function generateContent(input: GenerateInput): GeneratedContent {
  const seedBase = `${input.productName}|${input.format}|${input.tone}|${input.audience}|${input.seed ?? 0}`;
  const rnd = mulberry32(hashString(seedBase));

  const cat = normalizeCategory(input.category);
  const benefits = BENEFITS_BY_CATEGORY[cat] ?? BENEFITS_BY_CATEGORY.default;
  const problems = PROBLEMS_BY_CATEGORY[cat] ?? PROBLEMS_BY_CATEGORY.default;

  const vars = {
    produto: input.productName,
    preco: brl(input.price),
    problema: pick(rnd, problems),
    categoria: input.category || 'essa categoria',
  };

  const hookPool = HOOKS[input.format].map((h) => fillTemplate(h, vars));
  const hook = pick(rnd, hookPool);
  const hookAlternatives = pickMany(rnd, hookPool.filter((h) => h !== hook), 3);

  const chosenBenefits = pickMany(rnd, benefits, 3);
  const bridge = pick(rnd, BRIDGES);
  const opener = pick(rnd, TONE_OPENER[input.tone]);
  const cta = PLATFORM_CTA[input.platform];
  const captionCta = pick(rnd, CAPTION_CTA);

  const lines: string[] = [];

  lines.push(`[0-3s] GANCHO`);
  lines.push(`Fala: "${hook}"`);
  lines.push(`Visual: rosto em close, produto na mão, texto grande na tela.`);
  lines.push('');

  lines.push(`[3-6s] CONTEXTO`);
  lines.push(`Fala: "${opener} ${bridge}"`);
  lines.push(`Visual: corte rápido para a cena de uso real.`);
  lines.push('');

  if (input.format === 'top3') {
    lines.push(`[6-22s] OS 3 MOTIVOS`);
    chosenBenefits.forEach((b, i) => {
      const sec = 6 + i * 5;
      lines.push(`${sec}-${sec + 5}s — Motivo ${i + 1}: ${b}.`);
      lines.push(`   Visual: demonstração curta de "${b.split(' ').slice(0, 4).join(' ')}...".`);
    });
  } else if (input.format === 'unboxing') {
    lines.push(`[6-22s] ABERTURA DA CAIXA`);
    lines.push(`Fala: "Olha o que vem dentro..."`);
    lines.push(`Visual: abrir devagar, mostrar cada item, zoom no acabamento.`);
    lines.push(`Detalhe que vende: ${chosenBenefits[0]}.`);
  } else if (input.format === 'antes-depois') {
    lines.push(`[6-22s] O ANTES E O DEPOIS`);
    lines.push(`Fala: "Antes: ${vars.problema}. Depois: ${chosenBenefits[0]}."`);
    lines.push(`Visual: split screen ou montagem lado a lado.`);
  } else if (input.format === 'tutorial') {
    lines.push(`[6-24s] PASSO A PASSO`);
    lines.push(`Passo 1: preparar o cenário e mostrar o produto em uso.`);
    lines.push(`Passo 2: ${chosenBenefits[1]}.`);
    lines.push(`Passo 3: o detalhe que ninguém mostra — ${chosenBenefits[2]}.`);
    lines.push(`Visual: cortes de 1s, texto numerando cada passo.`);
  } else if (input.format === 'comparativo') {
    lines.push(`[6-22s] COMPARATIVO`);
    lines.push(`Lado A (jeito antigo): ${vars.problema}.`);
    lines.push(`Lado B (com o produto): ${chosenBenefits[0]}.`);
    lines.push(`Visual: dois quadros na tela, o lado B sempre mais rápido/limpo.`);
  } else {
    lines.push(`[6-22s] DEMONSTRAÇÃO`);
    lines.push(`Fala: "Olha isso aqui: ${chosenBenefits[0]}. E ainda ${chosenBenefits[1]}."`);
    lines.push(`Visual: 3 cenas de uso, uma por frase. Cada corte com texto de apoio.`);
  }
  lines.push('');

  lines.push(`[22-28s] PROVA / QUEBRA DE OBJEÇÃO`);
  lines.push(`Fala: "E o preço? ${vars.preco}. ${chosenBenefits[2].charAt(0).toUpperCase() + chosenBenefits[2].slice(1)}."`);
  lines.push(`Visual: print de avaliações ou da tela do carrinho.`);
  lines.push('');

  lines.push(`[28-33s] CTA`);
  lines.push(`Fala: "${hook.includes('?') ? 'Responde lá embaixo' : 'Se você chegou até aqui'} — ${cta}."`);
  lines.push(`Visual: seta apontando para o link/carrinho + texto "link na bio".`);
  lines.push('');
  lines.push(`Áudio sugerido: som em alta da aba "Em alta" — evite música com direitos autorais.`);

  const script = lines.join('\n');

  const caption = [
    hook,
    '',
    `${chosenBenefits[0].charAt(0).toUpperCase() + chosenBenefits[0].slice(1)} e por ${vars.preco} eu não achei caro.`,
    captionCta,
  ].join('\n');

  const baseTags = ['#achadinhos', '#achadinhosdashopee', '#tiktokmefezcomprar', '#dicas', '#unboxing'];
  const catTags: Record<string, string[]> = {
    cozinha: ['#cozinha', '#organizacao', '#utilidadesdomesticas'],
    beleza: ['#skincare', '#autocuidado', '#beleza'],
    tecnologia: ['#tecnologia', '#gadgets', '#tech'],
    casa: ['#casaorganizada', '#decoracao', '#dicasdecasa'],
    fitness: ['#fitness', '#treinoemcasa', '#saude'],
    infantil: ['#maternidade', '#brinquedos', '#kids'],
    moda: ['#lookdodia', '#moda', '#achadinhosdefashion'],
    default: ['#promocao', '#oferta', '#achadinhos'],
  };
  const hashtags = [...(catTags[cat] ?? catTags.default), ...pickMany(rnd, baseTags, 3)].join(' ');

  let title = `${FORMAT_LABEL[input.format]}: ${input.productName}`;
  if (input.format === 'top3') title = `Top 3 motivos: ${input.productName}`;
  if (input.format === 'problema-solucao') title = `${vars.problema} → ${input.productName}`;

  const estimatedSeconds = input.format === 'tutorial' ? 34 : input.format === 'top3' ? 33 : 32;

  return {
    title,
    hook,
    hookAlternatives,
    script,
    caption,
    hashtags,
    estimatedSeconds,
  };
}

/** Conveniência: gera a partir de um Product já cadastrado. */
export function generateForProduct(
  product: Pick<Product, 'name' | 'price' | 'category' | 'platform'>,
  format: ContentFormat,
  tone: ContentTone = 'direto',
  audience: ContentAudience = 'geral',
  seed = 0,
): GeneratedContent {
  return generateContent({
    productName: product.name,
    price: product.price,
    category: product.category,
    platform: product.platform,
    format,
    tone,
    audience,
    seed,
  });
}

export const ALL_FORMATS = Object.keys(FORMAT_LABEL) as ContentFormat[];
export const ALL_TONES = Object.keys(TONE_LABEL) as ContentTone[];
export const ALL_AUDIENCES = Object.keys(AUDIENCE_LABEL) as ContentAudience[];
