// ---------------------------------------------------------------------------
// Driver Postgres genérico (Neon, Railway, Supabase, RDS, Postgres local...).
//
// Este módulo é intencionalmente independente de aliases e do resto do app:
// recebe a função de query por injeção, o que permite testá-lo com qualquer
// implementação compatível (inclusive pg-mem).
//
// As tabelas são criadas automaticamente no primeiro acesso (DDL idempotente).
// ---------------------------------------------------------------------------

import type { Database, TableName } from './types';

/** Interface mínima de um cliente SQL (compatível com `pg.Pool`). */
export interface PgQueryable {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

const TABLES: TableName[] = ['products', 'clicks', 'conversions', 'content_posts', 'infoproducts', 'orders'];

/** Campos numéricos que o driver `pg` devolve como string (tipo numeric). */
const NUMERIC_FIELDS: Record<TableName, string[]> = {
  products: ['price', 'commission_pct'],
  clicks: [],
  conversions: ['amount', 'commission'],
  content_posts: [],
  infoproducts: ['price', 'original_price'],
  orders: ['amount'],
};

export const PG_SCHEMA: string[] = [
  `create table if not exists settings (
     id integer primary key check (id = 1),
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   )`,
  `create table if not exists products (
     id text primary key,
     slug text not null unique,
     name text not null,
     platform text not null,
     category text not null default 'Geral',
     price numeric(12,2) not null default 0,
     commission_pct numeric(6,2) not null default 0,
     affiliate_url text not null,
     image_url text,
     notes text,
     status text not null default 'ativo',
     created_at timestamptz not null default now()
   )`,
  `create table if not exists clicks (
     id text primary key,
     product_id text not null references products (id) on delete cascade,
     slug text not null,
     ts timestamptz not null default now(),
     device text not null default 'outro',
     referrer text,
     source text
   )`,
  `create table if not exists conversions (
     id text primary key,
     product_id text not null references products (id) on delete cascade,
     amount numeric(12,2) not null default 0,
     commission numeric(12,2) not null default 0,
     status text not null default 'pendente',
     created_at timestamptz not null default now()
   )`,
  `create table if not exists content_posts (
     id text primary key,
     product_id text references products (id) on delete set null,
     platform text not null default 'tiktok',
     title text not null,
     hook text not null default '',
     script text not null default '',
     caption text not null default '',
     hashtags text not null default '',
     status text not null default 'ideia',
     scheduled_at timestamptz,
     published_at timestamptz,
     created_at timestamptz not null default now()
   )`,
  `create table if not exists infoproducts (
     id text primary key,
     slug text not null unique,
     name text not null,
     tagline text not null default '',
     description text not null default '',
     price numeric(12,2) not null default 0,
     original_price numeric(12,2),
     benefits jsonb not null default '[]'::jsonb,
     bonuses jsonb not null default '[]'::jsonb,
     testimonials jsonb not null default '[]'::jsonb,
     checkout_url text,
     pix_key text,
     whatsapp text,
     image_url text,
     theme text not null default 'royal',
     status text not null default 'ativo',
     created_at timestamptz not null default now()
   )`,
  `create table if not exists orders (
     id text primary key,
     infoproduct_id text not null references infoproducts (id) on delete cascade,
     customer_name text not null,
     customer_email text not null,
     amount numeric(12,2) not null default 0,
     payment_method text not null default 'pix',
     status text not null default 'pendente',
     utm_source text,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists clicks_product_idx on clicks (product_id, ts desc)`,
  `create index if not exists conversions_product_idx on conversions (product_id, created_at desc)`,
  `create index if not exists orders_infoproduct_idx on orders (infoproduct_id, created_at desc)`,
];

export interface PostgresStoreOptions {
  query: PgQueryable['query'];
  /** Normaliza dados parciais em um Database completo (injetado pelo app). */
  normalize: (partial: Partial<Database>) => Database;
  /** Gera o estado inicial quando o banco está vazio. */
  seed: () => Database;
}

export class PostgresStore {
  private ready: Promise<void> | null = null;
  private idsCache = new Map<TableName, Set<string>>();
  private q: PgQueryable['query'];
  private normalize: PostgresStoreOptions['normalize'];
  private seed: PostgresStoreOptions['seed'];

  constructor(options: PostgresStoreOptions) {
    this.q = options.query;
    this.normalize = options.normalize;
    this.seed = options.seed;
  }

  /** Cria as tabelas uma única vez por processo. */
  private ensureSchema(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        for (const statement of PG_SCHEMA) {
          await this.q(statement);
        }
      })().catch((error) => {
        this.ready = null;
        throw error;
      });
    }
    return this.ready;
  }

  async load(): Promise<Database> {
    await this.ensureSchema();

    const [settingsRes, ...rest] = await Promise.all([
      this.q(`select data from settings where id = 1`),
      ...TABLES.map((table) => this.q(`select * from ${table}`)),
    ]);

    const rowsByTable = new Map<TableName, Record<string, unknown>[]>();
    TABLES.forEach((table, index) => {
      rowsByTable.set(table, rest[index]?.rows ?? []);
    });

    const isEmpty = !settingsRes.rows[0] && TABLES.every((t) => (rowsByTable.get(t) ?? []).length === 0);

    if (isEmpty) {
      const initial = this.seed();
      await this.save(initial, 'settings');
      return initial;
    }

    const partial: Partial<Database> = {
      settings: (settingsRes.rows[0]?.data as Database['settings'] | undefined) ?? undefined,
    };

    for (const table of TABLES) {
      (partial as Record<string, unknown>)[table] = (rowsByTable.get(table) ?? []).map((row) =>
        coerceRow(table, row),
      );
      this.idsCache.set(table, new Set((rowsByTable.get(table) ?? []).map((row) => String(row.id))));
    }

    return this.normalize(partial);
  }

  async save(db: Database, changed: TableName[] | 'settings'): Promise<void> {
    await this.ensureSchema();

    await this.q(
      `insert into settings (id, data, updated_at) values (1, $1::jsonb, now())
       on conflict (id) do update set data = excluded.data, updated_at = now()`,
      [JSON.stringify(db.settings)],
    );

    const tables: TableName[] = changed === 'settings' ? TABLES : changed;

    for (const table of tables) {
      const rows = db[table] as unknown as Record<string, unknown>[];

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]!);
        const values: unknown[] = [];
        const tuples = rows.map((row, rowIndex) => {
          const placeholders = columns.map((column, columnIndex) => {
            values.push(serializeValue(column, row[column]));
            return `$${rowIndex * columns.length + columnIndex + 1}`;
          });
          return `(${placeholders.join(', ')})`;
        });

        const updates = columns
          .filter((column) => column !== 'id')
          .map((column) => `${column} = excluded.${column}`)
          .join(', ');

        await this.q(
          `insert into ${table} (${columns.join(', ')}) values ${tuples.join(', ')}
           on conflict (id) do update set ${updates}`,
          values,
        );
      }

      const previous = this.idsCache.get(table);
      if (previous) {
        const nextIds = new Set(rows.map((row) => String(row.id)));
        const removed = [...previous].filter((id) => !nextIds.has(id));
        if (removed.length > 0) {
          // placeholders explícitos: funciona em qualquer Postgres/emulador
          const placeholders = removed.map((_, index) => `$${index + 1}`).join(', ');
          await this.q(`delete from ${table} where id in (${placeholders})`, removed);
        }
      }
      this.idsCache.set(table, new Set(rows.map((row) => String(row.id))));
    }
  }
}

function serializeValue(column: string, value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof Date))) {
    return JSON.stringify(value);
  }
  return value;
}

function coerceRow(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const field of NUMERIC_FIELDS[table]) {
    const value = out[field];
    if (typeof value === 'string') out[field] = Number.parseFloat(value);
    else if (value === null) out[field] = undefined;
  }
  return out;
}
