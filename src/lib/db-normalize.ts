// ---------------------------------------------------------------------------
// Normalização do formato do banco (usada por todos os drivers).
// Módulo isolado para poder ser testado sem carregar o driver de arquivos.
// ---------------------------------------------------------------------------

import type { Database } from './types';
import { EMPTY_SETTINGS } from './seed';

/**
 * Bancos criados antes da flag `is_demo` existir não têm o campo gravado.
 * Nesse caso reconhecemos o conjunto de exemplo pelos links/contatos fixos do
 * seed, para o painel avisar corretamente que são dados de demonstração.
 */
function looksLikeDemo(partial: Partial<Database>): boolean {
  const settings = partial.settings;
  if (settings?.pix_key === 'ricartes@exemplo.com' || settings?.whatsapp === '5585999999999') return true;

  const products = partial.products ?? [];
  if (!products.length) return false;
  return products.some(
    (p) =>
      typeof p?.affiliate_url === 'string' &&
      (/\/product\/000\//.test(p.affiliate_url) || p.affiliate_url.includes('1729000001')),
  );
}

// ---------------------------------------------------------------------------
// Copy antiga da demonstração
//
// A primeira versão dos dados de exemplo prometia resultado ("transformou 3
// seguidores em R$ 7.400/mês") e depoimentos com valores/views inventados. Como
// essa página é pública, o texto precisa sair do ar mesmo em bancos antigos —
// sem apagar nada do usuário. Só substitui quando o texto é exatamente o antigo:
// se a pessoa já editou, nada muda.
// ---------------------------------------------------------------------------

const LEGACY_DEMO_COPY: Record<string, string> = {
  'O método que transformou 3 seguidores em R$ 7.400/mês de comissão':
    'O passo a passo para escolher produto, gravar e divulgar sem aparecer',
  'Em 3 semanas bati R$ 1.200 de comissão só replicando os roteiros do módulo 2.':
    'Depoimento de exemplo: aqui entraria o retorno real de quem usou o método — escreva só o que puder comprovar.',
  'A planilha sozinha já pagou o curso. Parei de testar produto aleatório.':
    'Depoimento de exemplo: troque por um relato real e autorizado.',
  'Posto 1 vídeo por dia no intervalo do almoço. Nunca foi tão simples.':
    'Depoimento de exemplo: o que um cliente disse de verdade sobre o material.',
  'Eu odeio aparecer. Fiz 12 vídeos no modelo e 4 passaram de 50 mil views.':
    'Depoimento de exemplo: substitua pelo relato real de um cliente, com autorização para publicar.',
  'O checklist de edição me economiza 1h por vídeo.':
    'Depoimento de exemplo: escreva aqui a opinião real de quem comprou.',
};

const LEGACY_DEMO_ROLES: Record<string, string> = {
  'Aluna desde março': 'Exemplo de depoimento',
  'Afiliado Shopee': 'Exemplo de depoimento',
  'Mãe e criadora': 'Exemplo de depoimento',
};

function scrubDemoCopy(db: Database): Database {
  return {
    ...db,
    infoproducts: db.infoproducts.map((product) => ({
      ...product,
      tagline: LEGACY_DEMO_COPY[product.tagline] ?? product.tagline,
      testimonials: product.testimonials.map((t) => ({
        ...t,
        text: LEGACY_DEMO_COPY[t.text] ?? t.text,
        role: t.role && LEGACY_DEMO_ROLES[t.role] ? LEGACY_DEMO_ROLES[t.role] : t.role,
      })),
    })),
  };
}

export function normalizeDatabase(partial: Partial<Database>): Database {
  const settings = { ...EMPTY_SETTINGS, ...(partial.settings ?? {}) };
  if (typeof partial.settings?.is_demo !== 'boolean') {
    settings.is_demo = looksLikeDemo(partial);
  }

  const normalized: Database = {
    settings,
    products: partial.products ?? [],
    clicks: partial.clicks ?? [],
    conversions: partial.conversions ?? [],
    content_posts: partial.content_posts ?? [],
    infoproducts: partial.infoproducts ?? [],
    orders: partial.orders ?? [],
  };

  return settings.is_demo ? scrubDemoCopy(normalized) : normalized;
}
