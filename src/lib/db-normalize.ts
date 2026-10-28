// ---------------------------------------------------------------------------
// Normalização do formato do banco (usada por todos os drivers).
// Módulo isolado para poder ser testado sem carregar o driver de arquivos.
// ---------------------------------------------------------------------------

import type { Database } from './types';
import { DEMO_SETTINGS } from './seed';

export function normalizeDatabase(partial: Partial<Database>): Database {
  return {
    settings: { ...DEMO_SETTINGS, ...(partial.settings ?? {}) },
    products: partial.products ?? [],
    clicks: partial.clicks ?? [],
    conversions: partial.conversions ?? [],
    content_posts: partial.content_posts ?? [],
    infoproducts: partial.infoproducts ?? [],
    orders: partial.orders ?? [],
  };
}
