// ---------------------------------------------------------------------------
// Leitura de links de afiliado.
//
// O usuário cola o link que o painel da Shopee/TikTok/ML/Amazon gerou e a
// plataforma preenche o resto: plataforma, nome (quando o título vem na URL)
// e comissão sugerida. Também serve para importar uma lista de links de uma vez.
// ---------------------------------------------------------------------------

import type { Platform } from './types';
import { PLATFORM_LABEL } from './types';

export interface LinkInsight {
  platform: Platform | null;
  /** Nome deduzido da URL (nem toda plataforma traz o título). */
  name?: string;
  /** Comissão típica para começar (baseada na faixa pública de cada programa). */
  suggestedCommission?: number;
  /** Link encurtado: não dá para ver o produto, mas funciona igual. */
  shortened: boolean;
  /** Dica curta exibida abaixo do campo. */
  hint?: string;
}

/** Comissão inicial sugerida por plataforma (faixa pública dos programas). */
const SUGGESTED_COMMISSION: Record<Platform, number> = {
  shopee: 3, // taxa base; campanhas de lojas parceiras chegam a 30%
  tiktok: 10, // o vendedor define, normalmente 8%–15%
  mercadolivre: 9, // varia de 0% a 16% por categoria
  amazon: 8, // 4%–13% conforme a categoria
  hotmart: 40,
  kiwify: 40,
  outro: 10,
};

const SHORTENERS = /^(?:https?:\/\/)?(?:bit\.ly|t\.co|tinyurl\.com|encurtador\.com\.br|shp\.ee|s\.shopee|amzn\.to|amzn\.eu|mercadol\.ink|tiktok\.com\/t|vt\.tiktok\.com)/i;

const HOST_RULES: { platform: Platform; test: RegExp }[] = [
  { platform: 'shopee', test: /(?:^|\.)shopee\.com(?:\.br)?$|(?:^|\.)shp\.ee$|(?:^|\.)s\.shopee\.com(?:\.br)?$/i },
  { platform: 'tiktok', test: /(?:^|\.)tiktok\.com$|(?:^|\.)shop\.tiktok\.com$|(?:^|\.)vt\.tiktok\.com$/i },
  {
    platform: 'mercadolivre',
    test: /(?:^|\.)mercadolivre\.com(?:\.br)?$|(?:^|\.)mercadolibre\.com(?:\.br)?$|(?:^|\.)ml\.com\.br$/i,
  },
  { platform: 'amazon', test: /(?:^|\.)amazon\.com(?:\.br)?$|(?:^|\.)amzn\.to$|(?:^|\.)amzn\.eu$/i },
  { platform: 'hotmart', test: /(?:^|\.)hotmart\.com$|(?:^|\.)pay\.hotmart\.com$/i },
  { platform: 'kiwify', test: /(?:^|\.)kiwify\.com(?:\.br)?$|(?:^|\.)pay\.kiwify\.com(?:\.br)?$/i },
];

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

function cleanSlug(slug: string): string {
  const text = decodeURIComponent(slug)
    .replace(/[-_+]+/g, ' ')
    .replace(/\.(html?|php|aspx?)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return titleCase(text).slice(0, 90);
}

/** Tenta extrair o nome do produto a partir do caminho da URL. */
function nameFromUrl(url: URL, platform: Platform): string | undefined {
  const parts = url.pathname.split('/').filter(Boolean);

  if (platform === 'mercadolivre') {
    // /MLB-1234567890-nome-do-produto-_JM
    const ml = parts.find((p) => /^MLB-?\d+/i.test(p));
    if (ml) {
      const withoutId = ml.replace(/^MLB-?\d+-?/i, '').replace(/-?_JM$/i, '');
      const name = cleanSlug(withoutId);
      if (name.length >= 3) return name;
    }
    // /nome-do-produto-1234567890 (URL amigável)
    const friendly = parts.find((p) => /-MP|-JM$/.test(p) || /\d{6,}/.test(p));
    if (friendly && !/^MLB/i.test(friendly)) {
      const name = cleanSlug(friendly.replace(/-?MP$/i, ''));
      if (name.length >= 6) return name;
    }
    return undefined;
  }

  if (platform === 'amazon') {
    const dpIndex = parts.findIndex((p) => p.toLowerCase() === 'dp' || p.toLowerCase() === 'gp');
    if (dpIndex > 0) {
      const name = cleanSlug(parts[dpIndex - 1] ?? '');
      if (name.length >= 3) return name;
    }
    return undefined;
  }

  if (platform === 'shopee') {
    // /Nome-do-Produto-i.123456.789012
    const named = parts.find((p) => /-i\.\d+\.\d+$/i.test(p));
    if (named) {
      const name = cleanSlug(named.replace(/-i\.\d+\.\d+$/i, ''));
      if (name.length >= 3) return name;
    }
    return undefined;
  }

  if (platform === 'tiktok') {
    // /view/product/1234567890 — sem título na URL
    return undefined;
  }

  return undefined;
}

function hintFor(platform: Platform): string {
  switch (platform) {
    case 'shopee':
      return 'Comissão base da Shopee fica em torno de 3% — lojas parceiras pagam mais. Ajuste com o valor real do seu painel.';
    case 'tiktok':
      return 'No TikTok Shop o vendedor define a comissão (normalmente 8%–15%). Confira no painel do afiliado.';
    case 'mercadolivre':
      return 'No Mercado Livre a comissão varia de 0% a 16% por categoria (Beleza paga mais, Alimentos quase nada).';
    case 'amazon':
      return 'Na Amazon Brasil a comissão vai de 4% a 13% conforme a categoria.';
    case 'hotmart':
    case 'kiwify':
      return 'Em infoproduto a comissão costuma ficar entre 30% e 60% — confirme na área de afiliados do produtor.';
    default:
      return 'Confira a comissão no painel da plataforma.';
  }
}

/**
 * Analisa um link de afiliado e devolve plataforma, nome e comissão sugerida.
 * Nunca lança: URL inválida devolve tudo nulo.
 */
export function inspectAffiliateLink(raw: string): LinkInsight {
  const input = (raw ?? '').trim();
  if (!input) return { platform: null, shortened: false };

  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return { platform: null, shortened: false, hint: 'Cole o link completo, começando com https://' };
  }

  const shortener = SHORTENERS.test(withProtocol.replace(/^https?:\/\//i, ''));
  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  const rule = HOST_RULES.find((r) => r.test.test(host));
  const platform = rule?.platform ?? null;

  if (!platform) {
    return {
      platform: null,
      shortened: shortener,
      hint: shortener
        ? 'Link encurtado: funciona, mas escolha a plataforma manualmente.'
        : `Não reconheci o site ${host}. Escolha a plataforma manualmente.`,
    };
  }

  const name = nameFromUrl(url, platform);

  return {
    platform,
    name,
    suggestedCommission: SUGGESTED_COMMISSION[platform],
    shortened: shortener,
    hint: hintFor(platform),
  };
}

// ---------------------------------------------------------------------------
// Importação em massa
// ---------------------------------------------------------------------------

export interface ParsedProduct {
  name: string;
  affiliate_url: string;
  platform: Platform;
  price: number;
  commission_pct: number;
  category: string;
  line: number;
}

export interface ImportIssue {
  line: number;
  content: string;
  reason: string;
}

export interface ParseResult {
  products: ParsedProduct[];
  issues: ImportIssue[];
}

const KNOWN_PLATFORMS: { token: string; platform: Platform }[] = [
  { token: 'shopee', platform: 'shopee' },
  { token: 'shp', platform: 'shopee' },
  { token: 'tiktok', platform: 'tiktok' },
  { token: 'tik tok', platform: 'tiktok' },
  { token: 'mercado livre', platform: 'mercadolivre' },
  { token: 'mercadolivre', platform: 'mercadolivre' },
  { token: 'mercado libre', platform: 'mercadolivre' },
  { token: 'ml', platform: 'mercadolivre' },
  { token: 'amazon', platform: 'amazon' },
  { token: 'hotmart', platform: 'hotmart' },
  { token: 'kiwify', platform: 'kiwify' },
  { token: 'outro', platform: 'outro' },
];

const CATEGORIES = [
  'cozinha',
  'casa',
  'beleza',
  'tecnologia',
  'fitness',
  'infantil',
  'moda',
  'pets',
  'papelaria',
  'geral',
];

/** "R$ 1.234,56" | "1234,56" | "1234.56" | "1.234" → number */
export function parseMoney(raw: string): number | null {
  const cleaned = raw
    .replace(/r\$/gi, '')
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized: string;

  if (lastComma > lastDot) {
    // formato brasileiro: 1.234,56
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // formato americano: 1,234.56
    normalized = cleaned.replace(/,/g, '');
  } else {
    normalized = cleaned.replace(',', '.');
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function isUrl(token: string): boolean {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(token) && !/^\d+([.,]\d+)?$/.test(token);
}

/** Divide uma linha CSV respeitando aspas: `"R$ 49,90",12`. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === ',' && !quoted) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

/**
 * Interpreta uma lista colada pelo usuário. Cada linha vira um produto.
 *
 * Aceita colunas em qualquer ordem, separadas por `;`, tabulação, `|` ou
 * vírgula (quando não há vírgula decimal). Reconhece:
 *  - o link de afiliado (obrigatório)
 *  - o nome do produto (ou deduz da URL quando não vier)
 *  - preço em R$ (primeiro número "grande")
 *  - comissão em % (número até 100, quando houver dois números)
 *  - plataforma pelo nome e categoria pelo nome
 */
export function parseProductList(text: string): ParseResult {
  const products: ParsedProduct[] = [];
  const issues: ImportIssue[] = [];

  const lines = (text ?? '').split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // Cabeçalho de planilha: "nome; url; preço; comissão"
    if (/^(nome|produto|name|url|link)\b/i.test(line) && !/https?:\/\//i.test(line)) return;

    // Separador: ponto e vírgula, tabulação ou barra vertical quando existirem
    // (padrão de planilha brasileira). Sem eles, cai para vírgula — e aí
    // "49,90" precisaria de aspas, então o CSV americano é aceito com aspas.
    const separator = /;/.test(line) ? ';' : /\t/.test(line) ? '\t' : /\|/.test(line) ? '|' : ',';
    const tokens =
      separator === ','
        ? splitCsvLine(line)
        : line
            .split(separator)
            .map((t) => t.trim())
            .filter(Boolean);

    let url: string | undefined;
    let platform: Platform | null = null;
    let category = 'Geral';
    const numbers: number[] = [];
    const words: string[] = [];

    for (const token of tokens) {
      if (!url && isUrl(token)) {
        url = /^https?:\/\//i.test(token) ? token : `https://${token}`;
        continue;
      }

      const lower = token.toLowerCase();

      const platformMatch = KNOWN_PLATFORMS.find((p) => lower === p.token || lower === `${p.token} shop`);
      if (platformMatch && !platform) {
        platform = platformMatch.platform;
        continue;
      }

      if (CATEGORIES.includes(lower)) {
        category = titleCase(token);
        continue;
      }

      const money = parseMoney(token);
      // Só considera número se o token for essencialmente numérico.
      if (money !== null && /^[r$\s]*[\d.,]+%?$/i.test(token)) {
        numbers.push(token.includes('%') ? money : money);
        continue;
      }

      words.push(token);
    }

    if (!url) {
      issues.push({ line: lineNo, content: line, reason: 'não encontrei um link nessa linha' });
      return;
    }

    const auto = inspectAffiliateLink(url);
    const resolvedPlatform = platform ?? auto.platform ?? 'outro';

    // Números: o maior costuma ser o preço; o menor (≤100) a comissão.
    let price = 0;
    let commission = auto.suggestedCommission ?? SUGGESTED_COMMISSION[resolvedPlatform];

    if (numbers.length >= 2) {
      const sorted = [...numbers].sort((a, b) => b - a);
      price = sorted[0] ?? 0;
      const maybeCommission = sorted[sorted.length - 1] ?? 0;
      if (maybeCommission > 0 && maybeCommission <= 100) commission = maybeCommission;
    } else if (numbers.length === 1) {
      const only = numbers[0] ?? 0;
      if (only <= 100 && only > 0) {
        // número pequeno: provavelmente comissão, não preço
        commission = only;
      } else {
        price = only;
      }
    }

    const name = words.join(' ').trim() || auto.name || `Produto ${PLATFORM_LABEL[resolvedPlatform]}`;

    if (name.length < 3) {
      issues.push({ line: lineNo, content: line, reason: 'nome do produto muito curto' });
      return;
    }

    products.push({
      name: name.slice(0, 120),
      affiliate_url: url,
      platform: resolvedPlatform,
      price,
      commission_pct: commission,
      category,
      line: lineNo,
    });
  });

  if (!products.length && !issues.length) {
    issues.push({ line: 0, content: '', reason: 'nenhuma linha para importar' });
  }

  return { products, issues };
}
