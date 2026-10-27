-- ===========================================================================
-- Ricartes Afiliados — schema do banco (Supabase / Postgres)
--
-- Como usar:
--   1. Abra o projeto no Supabase → SQL Editor → New query
--   2. Cole todo este arquivo e clique em RUN
--   3. Copie NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em Settings → API
--   4. Configure as variáveis de ambiente e use DB_DRIVER=supabase
--
-- Observação: a aplicação acessa o banco apenas pelo servidor usando a
-- service role key. RLS fica habilitado e sem policies públicas, então a
-- chave anon não consegue ler nem escrever nada.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Configurações (linha única, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb  not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Produtos de afiliado
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id              text primary key,
  slug            text not null unique,
  name            text not null,
  platform        text not null check (platform in ('shopee','tiktok','mercadolivre','amazon','hotmart','kiwify','outro')),
  category        text not null default 'Geral',
  price           numeric(12,2) not null default 0,
  commission_pct  numeric(6,2)  not null default 0,
  affiliate_url   text not null,
  image_url       text,
  notes           text,
  status          text not null default 'ativo' check (status in ('ativo','pausado','rascunho')),
  created_at      timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);
create index if not exists products_platform_idx on public.products (platform);

-- ---------------------------------------------------------------------------
-- Cliques nos links rastreáveis
-- ---------------------------------------------------------------------------
create table if not exists public.clicks (
  id          text primary key,
  product_id  text not null references public.products (id) on delete cascade,
  slug        text not null,
  ts          timestamptz not null default now(),
  device      text not null default 'outro' check (device in ('mobile','desktop','tablet','outro')),
  referrer    text,
  source      text
);

create index if not exists clicks_product_idx on public.clicks (product_id, ts desc);
create index if not exists clicks_ts_idx on public.clicks (ts desc);

-- ---------------------------------------------------------------------------
-- Vendas / comissões de afiliado
-- ---------------------------------------------------------------------------
create table if not exists public.conversions (
  id          text primary key,
  product_id  text not null references public.products (id) on delete cascade,
  amount      numeric(12,2) not null default 0,
  commission  numeric(12,2) not null default 0,
  status      text not null default 'pendente' check (status in ('pendente','aprovada','cancelada')),
  created_at  timestamptz not null default now()
);

create index if not exists conversions_product_idx on public.conversions (product_id, created_at desc);
create index if not exists conversions_status_idx on public.conversions (status);

-- ---------------------------------------------------------------------------
-- Conteúdo (roteiros de TikTok / Reels / Shorts)
-- ---------------------------------------------------------------------------
create table if not exists public.content_posts (
  id            text primary key,
  product_id    text references public.products (id) on delete set null,
  platform      text not null default 'tiktok' check (platform in ('tiktok','reels','shorts')),
  title         text not null,
  hook          text not null default '',
  script        text not null default '',
  caption       text not null default '',
  hashtags      text not null default '',
  status        text not null default 'ideia' check (status in ('ideia','roteirizado','gravado','publicado')),
  scheduled_at  timestamptz,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists content_status_idx on public.content_posts (status);

-- ---------------------------------------------------------------------------
-- Infoprodutos (produtos próprios)
-- ---------------------------------------------------------------------------
create table if not exists public.infoproducts (
  id              text primary key,
  slug            text not null unique,
  name            text not null,
  tagline         text not null default '',
  description     text not null default '',
  price           numeric(12,2) not null default 0,
  original_price  numeric(12,2),
  benefits        jsonb not null default '[]'::jsonb,
  bonuses         jsonb not null default '[]'::jsonb,
  testimonials    jsonb not null default '[]'::jsonb,
  checkout_url    text,
  pix_key         text,
  whatsapp        text,
  image_url       text,
  theme           text not null default 'ember' check (theme in ('ember','midnight','lime','royal')),
  status          text not null default 'ativo' check (status in ('ativo','rascunho')),
  created_at      timestamptz not null default now()
);

create index if not exists infoproducts_status_idx on public.infoproducts (status);

-- ---------------------------------------------------------------------------
-- Pedidos dos infoprodutos
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                text primary key,
  infoproduct_id    text not null references public.infoproducts (id) on delete cascade,
  customer_name     text not null,
  customer_email    text not null,
  amount            numeric(12,2) not null default 0,
  payment_method    text not null default 'pix' check (payment_method in ('pix','cartao','boleto','externo')),
  status            text not null default 'pendente' check (status in ('pendente','pago','reembolsado')),
  utm_source        text,
  created_at        timestamptz not null default now()
);

create index if not exists orders_infoproduct_idx on public.orders (infoproduct_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- ---------------------------------------------------------------------------
-- Segurança: RLS ligado, sem policies públicas.
-- O servidor usa a service role key (bypassa RLS). O cliente nunca acessa.
-- ---------------------------------------------------------------------------
alter table public.settings      enable row level security;
alter table public.products      enable row level security;
alter table public.clicks        enable row level security;
alter table public.conversions   enable row level security;
alter table public.content_posts enable row level security;
alter table public.infoproducts  enable row level security;
alter table public.orders        enable row level security;

-- Permite leitura pública apenas de páginas de vendas ativas (opcional).
-- Se você não usa a anon key no navegador, pode remover estes dois blocos.
drop policy if exists "infoproducts public read" on public.infoproducts;
create policy "infoproducts public read"
  on public.infoproducts for select
  to anon
  using (status = 'ativo');

-- ---------------------------------------------------------------------------
-- Pronto. A aplicação cria os dados de demonstração no primeiro acesso.
-- ---------------------------------------------------------------------------
