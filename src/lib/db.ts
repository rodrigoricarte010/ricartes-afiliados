// ---------------------------------------------------------------------------
// Camada de persistência.
//
// Dois drivers:
//  - "file"     → grava em .data/db.json (padrão; roda sem configurar nada)
//  - "supabase" → tabelas reais no Postgres (produção / Vercel)
//
// A aplicação sempre fala com o repositório, nunca com o driver diretamente.
// ---------------------------------------------------------------------------

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  ClickEvent,
  ContentPost,
  Conversion,
  Database,
  Infoproduct,
  Order,
  Product,
  Settings,
  TableName,
} from './types';
import { buildDemoDatabase, DEMO_SETTINGS } from './seed';
import { PostgresStore } from './db-pg';
import { normalizeDatabase } from './db-normalize';

export type { TableName } from './types';
export { normalizeDatabase } from './db-normalize';

export interface Store {
  load(): Promise<Database>;
  save(db: Database, changed: TableName[] | 'settings'): Promise<void>;
}

// ---------------------------------------------------------------------------
// Driver: arquivo JSON local
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Mutex simples por processo para evitar escrita concorrente no JSON.
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

class FileStore implements Store {
  async load(): Promise<Database> {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<Database>;
      return normalizeDatabase(parsed);
    } catch {
      const demo = buildDemoDatabase();
      await this.save(demo, 'settings');
      return demo;
    }
  }

  async save(db: Database, changed: TableName[] | 'settings'): Promise<void> {
    await withLock(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DATA_FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 0), 'utf8');
      await fs.rename(tmp, DATA_FILE);
    });
    void changed;
  }
}


// ---------------------------------------------------------------------------
// Driver: Supabase (Postgres)
// ---------------------------------------------------------------------------

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;

let supabaseSingleton: SupabaseClient | null = null;

async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseSingleton) return supabaseSingleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'DB_DRIVER=supabase exige NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. ' +
        'Rode "npm run db:setup" ou volte para DB_DRIVER=file.',
    );
  }

  const { createClient } = await import('@supabase/supabase-js');
  supabaseSingleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseSingleton;
}

class SupabaseStore implements Store {
  private idsCache = new Map<TableName, Set<string>>();

  async load(): Promise<Database> {
    const sb = await getSupabase();

    const [settingsRes, products, clicks, conversions, content, infoproducts, orders] =
      await Promise.all([
        sb.from('settings').select('data').eq('id', 1).maybeSingle(),
        sb.from('products').select('*'),
        sb.from('clicks').select('*').order('ts', { ascending: false }).limit(20000),
        sb.from('conversions').select('*'),
        sb.from('content_posts').select('*'),
        sb.from('infoproducts').select('*'),
        sb.from('orders').select('*'),
      ]);

    const empty =
      !products.data?.length &&
      !infoproducts.data?.length &&
      !settingsRes.data;

    if (empty) {
      // Primeira execução: cria o estado inicial.
      const demo = buildDemoDatabase();
      await this.save(demo, 'settings');
      return demo;
    }

    const db: Database = normalizeDatabase({
      settings: (settingsRes.data?.data as Settings | undefined) ?? undefined,
      products: (products.data as Product[]) ?? [],
      clicks: (clicks.data as ClickEvent[]) ?? [],
      conversions: (conversions.data as Conversion[]) ?? [],
      content_posts: (content.data as ContentPost[]) ?? [],
      infoproducts: (infoproducts.data as Infoproduct[]) ?? [],
      orders: (orders.data as Order[]) ?? [],
    });

    for (const t of ['products', 'clicks', 'conversions', 'content_posts', 'infoproducts', 'orders'] as TableName[]) {
      this.idsCache.set(t, new Set((db[t] as { id: string }[]).map((r) => r.id)));
    }
    return db;
  }

  async save(db: Database, changed: TableName[] | 'settings'): Promise<void> {
    const sb = await getSupabase();
    const tables: TableName[] =
      changed === 'settings'
        ? ['products', 'clicks', 'conversions', 'content_posts', 'infoproducts', 'orders']
        : changed;

    const { error: settingsError } = await sb
      .from('settings')
      .upsert({ id: 1, data: db.settings, updated_at: new Date().toISOString() });
    if (settingsError) throw new Error(`settings: ${settingsError.message}`);

    for (const table of tables) {
      const rows = db[table] as unknown as Record<string, unknown>[];
      if (rows.length > 0) {
        const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`${table}: ${error.message}`);
      }

      const prevIds = this.idsCache.get(table);
      if (prevIds) {
        const nextIds = new Set(rows.map((r) => String(r.id)));
        const removed = [...prevIds].filter((id) => !nextIds.has(id));
        if (removed.length > 0) {
          const { error } = await sb.from(table).delete().in('id', removed);
          if (error) throw new Error(`${table} (delete): ${error.message}`);
        }
      }
      this.idsCache.set(table, new Set(rows.map((r) => String(r.id))));
    }
  }
}

// ---------------------------------------------------------------------------
// Repositório (API usada pela aplicação)
// ---------------------------------------------------------------------------

function driverName(): 'file' | 'supabase' | 'postgres' {
  const configured = (process.env.DB_DRIVER ?? '').toLowerCase();
  if (configured === 'supabase') return 'supabase';
  if (configured === 'postgres' || configured === 'pg' || configured === 'neon') return 'postgres';
  // Se apenas DATABASE_URL foi definida, assume Postgres genérico.
  if (process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) return 'postgres';
  return 'file';
}

// ---------------------------------------------------------------------------
// Driver: Postgres genérico (Neon, Railway, Supabase, RDS, local...)
// ---------------------------------------------------------------------------

let pgQuery: import('./db-pg').PgQueryable['query'] | null = null;

/**
 * Normaliza a connection string antes de entregá-la ao `pg`.
 *
 * O driver lê o `sslmode` da própria URL e, nas versões recentes, trata
 * `require` como `verify-full` — isso sobrepõe o `ssl` que passamos no Pool.
 * Também existem parâmetros (ex.: `channel_binding`, copiado do painel do
 * Neon) que o `pg` não implementa. Removemos esses parâmetros e cuidamos do
 * TLS explicitamente, o que funciona igual em Neon, Supabase, Railway e local.
 */
function normalizePgUrl(raw: string): { url: string; needsSsl: boolean } {
  let parsed: URL | null = null;
  try {
    parsed = new URL(raw);
  } catch {
    parsed = null; // string fora do formato URL: deixa o `pg` reclamar
  }

  const sslmode = parsed?.searchParams.get('sslmode') ?? null;
  if (parsed) {
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('channel_binding');
  }

  const knownHosted = /neon\.tech|supabase\.co|render\.com|railway|amazonaws|azure/i.test(raw);
  const needsSsl = sslmode === 'disable' ? false : sslmode !== null || knownHosted;

  return { url: parsed ? parsed.toString() : raw, needsSsl };
}

async function getPgQuery(): Promise<import('./db-pg').PgQueryable['query']> {
  if (pgQuery) return pgQuery;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DB_DRIVER=postgres exige a variável DATABASE_URL.');
  }

  const pg = await import('pg');
  const { url, needsSsl } = normalizePgUrl(connectionString);

  const pool = new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });

  pgQuery = async (text, params) => {
    const result = await pool.query(text, params as unknown[]);
    return { rows: result.rows as Record<string, unknown>[] };
  };
  return pgQuery;
}

function createPostgresStore(): Store {
  const store = new PostgresStore({
    // Repassa a chamada para o pool, resolvido sob demanda.
    query: (text, params) => getPgQuery().then((query) => query(text, params)),
    normalize: normalizeDatabase,
    seed: buildDemoDatabase,
  });
  return store as unknown as Store;
}

let storeSingleton: Store | null = null;
function store(): Store {
  if (!storeSingleton) {
    const driver = driverName();
    storeSingleton =
      driver === 'supabase'
        ? new SupabaseStore()
        : driver === 'postgres'
          ? createPostgresStore()
          : new FileStore();
  }
  return storeSingleton;
}

export const dbDriver = () => driverName();

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export const repo = {
  async snapshot(): Promise<Database> {
    return store().load();
  },

  async getSettings(): Promise<Settings> {
    const db = await store().load();
    return db.settings;
  },

  async saveSettings(settings: Settings): Promise<void> {
    const db = await store().load();
    db.settings = settings;
    await store().save(db, 'settings');
  },

  // ---------------- produtos ----------------
  async saveProduct(input: Omit<Product, 'id' | 'created_at'> & { id?: string }): Promise<Product> {
    const db = await store().load();
    const existing = input.id ? db.products.find((p) => p.id === input.id) : undefined;
    const product: Product = {
      ...input,
      id: existing?.id ?? input.id ?? uid('prd'),
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
    const idx = db.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) db.products[idx] = product;
    else db.products.unshift(product);
    await store().save(db, ['products']);
    return product;
  },

  /**
   * Cadastra vários produtos de uma vez (importação em massa).
   * Uma única leitura + escrita, em vez de N idas ao banco.
   */
  async saveProducts(
    inputs: (Omit<Product, 'id' | 'created_at'> & { id?: string })[],
  ): Promise<Product[]> {
    if (!inputs.length) return [];
    const db = await store().load();
    const now = new Date().toISOString();

    const created = inputs.map((input) => {
      const existing = input.id ? db.products.find((p) => p.id === input.id) : undefined;
      const product: Product = {
        ...input,
        id: existing?.id ?? input.id ?? uid('prd'),
        created_at: existing?.created_at ?? now,
      };
      const idx = db.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) db.products[idx] = product;
      else db.products.push(product);
      return product;
    });

    // mantém a ordem de cadastro mais recente primeiro
    db.products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    await store().save(db, ['products']);
    return created;
  },

  async deleteProduct(id: string): Promise<void> {
    const db = await store().load();
    db.products = db.products.filter((p) => p.id !== id);
    db.clicks = db.clicks.filter((c) => c.product_id !== id);
    db.conversions = db.conversions.filter((c) => c.product_id !== id);
    for (const post of db.content_posts) {
      if (post.product_id === id) post.product_id = undefined;
    }
    await store().save(db, ['products', 'clicks', 'conversions', 'content_posts']);
  },

  async toggleProductStatus(id: string): Promise<void> {
    const db = await store().load();
    const product = db.products.find((p) => p.id === id);
    if (!product) return;
    product.status = product.status === 'ativo' ? 'pausado' : 'ativo';
    await store().save(db, ['products']);
  },

  async productBySlug(slug: string): Promise<Product | undefined> {
    const db = await store().load();
    return db.products.find((p) => p.slug === slug);
  },

  // ---------------- cliques ----------------
  async addClick(click: Omit<ClickEvent, 'id'>): Promise<void> {
    const db = await store().load();
    db.clicks.push({ ...click, id: uid('clk') });
    await store().save(db, ['clicks']);
  },

  // ---------------- conversões ----------------
  async addConversion(input: Omit<Conversion, 'id' | 'created_at'>): Promise<void> {
    const db = await store().load();
    db.conversions.unshift({
      ...input,
      id: uid('cnv'),
      created_at: new Date().toISOString(),
    });
    await store().save(db, ['conversions']);
  },

  async updateConversionStatus(id: string, status: Conversion['status']): Promise<void> {
    const db = await store().load();
    const conv = db.conversions.find((c) => c.id === id);
    if (!conv) return;
    conv.status = status;
    await store().save(db, ['conversions']);
  },

  // ---------------- conteúdo ----------------
  async saveContentPost(
    input: Omit<ContentPost, 'id' | 'created_at'> & { id?: string },
  ): Promise<ContentPost> {
    const db = await store().load();
    const existing = input.id ? db.content_posts.find((p) => p.id === input.id) : undefined;
    const post: ContentPost = {
      ...input,
      id: existing?.id ?? input.id ?? uid('cnt'),
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
    const idx = db.content_posts.findIndex((p) => p.id === post.id);
    if (idx >= 0) db.content_posts[idx] = post;
    else db.content_posts.unshift(post);
    await store().save(db, ['content_posts']);
    return post;
  },

  async updateContentStatus(id: string, status: ContentPost['status']): Promise<void> {
    const db = await store().load();
    const post = db.content_posts.find((p) => p.id === id);
    if (!post) return;
    post.status = status;
    if (status === 'publicado' && !post.published_at) post.published_at = new Date().toISOString();
    await store().save(db, ['content_posts']);
  },

  async deleteContentPost(id: string): Promise<void> {
    const db = await store().load();
    db.content_posts = db.content_posts.filter((p) => p.id !== id);
    await store().save(db, ['content_posts']);
  },

  // ---------------- infoprodutos ----------------
  async saveInfoproduct(
    input: Omit<Infoproduct, 'id' | 'created_at'> & { id?: string },
  ): Promise<Infoproduct> {
    const db = await store().load();
    const existing = input.id ? db.infoproducts.find((p) => p.id === input.id) : undefined;
    const item: Infoproduct = {
      ...input,
      id: existing?.id ?? input.id ?? uid('inf'),
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
    const idx = db.infoproducts.findIndex((p) => p.id === item.id);
    if (idx >= 0) db.infoproducts[idx] = item;
    else db.infoproducts.unshift(item);
    await store().save(db, ['infoproducts']);
    return item;
  },

  async deleteInfoproduct(id: string): Promise<void> {
    const db = await store().load();
    db.infoproducts = db.infoproducts.filter((p) => p.id !== id);
    db.orders = db.orders.filter((o) => o.infoproduct_id !== id);
    await store().save(db, ['infoproducts', 'orders']);
  },

  async infoproductBySlug(slug: string): Promise<Infoproduct | undefined> {
    const db = await store().load();
    return db.infoproducts.find((p) => p.slug === slug);
  },

  // ---------------- pedidos ----------------
  async addOrder(input: Omit<Order, 'id' | 'created_at' | 'status'> & { status?: Order['status'] }): Promise<Order> {
    const db = await store().load();
    const order: Order = {
      ...input,
      id: uid('ord'),
      status: input.status ?? 'pendente',
      created_at: new Date().toISOString(),
    };
    db.orders.unshift(order);
    await store().save(db, ['orders']);
    return order;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const db = await store().load();
    const order = db.orders.find((o) => o.id === id);
    if (!order) return;
    order.status = status;
    await store().save(db, ['orders']);
  },

  // ---------------- utilidades ----------------
  async resetDemo(): Promise<void> {
    storeSingleton = null;
    const demo = buildDemoDatabase();
    await store().save(demo, 'settings');
  },

  async isEmpty(): Promise<boolean> {
    const db = await store().load();
    return db.products.length === 0 && db.infoproducts.length === 0;
  },

  /**
   * Substitui todo o banco pelo conteúdo de um backup JSON.
   * Valida a forma dos dados antes de gravar (nada de confiar no arquivo).
   */
  async importDatabase(input: unknown): Promise<{ ok: boolean; message: string; counts?: Record<string, number> }> {
    if (!input || typeof input !== 'object') {
      return { ok: false, message: 'Arquivo inválido: esperado um objeto JSON.' };
    }
    const raw = input as Record<string, unknown>;
    const tables = ['products', 'clicks', 'conversions', 'content_posts', 'infoproducts', 'orders'] as const;

    for (const table of tables) {
      const value = raw[table];
      if (value !== undefined && !Array.isArray(value)) {
        return { ok: false, message: `Estrutura inválida: "${table}" deveria ser uma lista.` };
      }
    }

    const db = normalizeDatabase(raw as Partial<Database>);

    // integridade mínima: cada linha precisa de um id
    for (const table of tables) {
      const rows = db[table] as unknown as { id?: unknown }[];
      const broken = rows.find((row) => !row || typeof row !== 'object' || typeof row.id !== 'string');
      if (broken) {
        return { ok: false, message: `Estrutura inválida em "${table}": registro sem id.` };
      }
    }

    if (db.products.length === 0 && db.infoproducts.length === 0) {
      return { ok: false, message: 'O backup está vazio — nada foi importado.' };
    }

    await store().save(db, 'settings');

    return {
      ok: true,
      message: 'Backup importado com sucesso.',
      counts: {
        products: db.products.length,
        clicks: db.clicks.length,
        conversions: db.conversions.length,
        content_posts: db.content_posts.length,
        infoproducts: db.infoproducts.length,
        orders: db.orders.length,
      },
    };
  },
};
