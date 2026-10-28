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

export function normalizeDatabase(partial: Partial<Database>): Database {
  const settings = { ...EMPTY_SETTINGS, ...(partial.settings ?? {}) };
  if (typeof partial.settings?.is_demo !== 'boolean') {
    settings.is_demo = looksLikeDemo(partial);
  }

  return {
    settings,
    products: partial.products ?? [],
    clicks: partial.clicks ?? [],
    conversions: partial.conversions ?? [],
    content_posts: partial.content_posts ?? [],
    infoproducts: partial.infoproducts ?? [],
    orders: partial.orders ?? [],
  };
}
