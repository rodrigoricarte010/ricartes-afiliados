// ---------------------------------------------------------------------------
// Modelo de domínio da plataforma
// ---------------------------------------------------------------------------

/** Marketplaces / redes de afiliados suportadas. */
export type Platform =
  | 'shopee'
  | 'tiktok'
  | 'mercadolivre'
  | 'amazon'
  | 'hotmart'
  | 'kiwify'
  | 'outro';

export type ProductStatus = 'ativo' | 'pausado' | 'rascunho';

/** Produto de terceiro que você divulga como afiliado. */
export interface Product {
  id: string;
  /** Identificador curto usado no link rastreável: /r/<slug> */
  slug: string;
  name: string;
  platform: Platform;
  category: string;
  /** Preço de venda do produto, em BRL. */
  price: number;
  /** Percentual de comissão que você recebe (0–100). */
  commission_pct: number;
  /** Link de afiliado original gerado no painel da plataforma. */
  affiliate_url: string;
  image_url?: string;
  notes?: string;
  status: ProductStatus;
  created_at: string;
}

export type Device = 'mobile' | 'desktop' | 'tablet' | 'outro';

/** Um clique no link rastreável. */
export interface ClickEvent {
  id: string;
  product_id: string;
  slug: string;
  ts: string;
  device: Device;
  referrer?: string;
  /** utm_source / origem (tiktok, instagram, whatsapp, direto...) */
  source?: string;
}

export type ConversionStatus = 'pendente' | 'aprovada' | 'cancelada';

/** Venda confirmada de um produto de afiliado. */
export interface Conversion {
  id: string;
  product_id: string;
  /** Valor da venda (BRL). */
  amount: number;
  /** Comissão recebida (BRL). */
  commission: number;
  status: ConversionStatus;
  created_at: string;
}

export type ContentStatus = 'ideia' | 'roteirizado' | 'gravado' | 'publicado';
export type ContentPlatform = 'tiktok' | 'reels' | 'shorts';

/** Roteiro / post de conteúdo curto para divulgar um produto. */
export interface ContentPost {
  id: string;
  product_id?: string;
  platform: ContentPlatform;
  title: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string;
  status: ContentStatus;
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  text: string;
  role?: string;
}

/** Produto próprio (infoproduto) vendido na sua página de vendas. */
export interface Infoproduct {
  id: string;
  /** Usado na página pública: /p/<slug> */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  original_price?: number;
  benefits: string[];
  bonuses: Benefit[];
  testimonials: Testimonial[];
  /** Checkout externo (Hotmart, Kiwify, Eduzz...). Se vazio, usa Pix/WhatsApp. */
  checkout_url?: string;
  pix_key?: string;
  whatsapp?: string;
  image_url?: string;
  /** Tema visual da página de vendas. */
  theme: 'ember' | 'midnight' | 'lime' | 'royal';
  status: 'ativo' | 'rascunho';
  created_at: string;
}

export type OrderStatus = 'pendente' | 'pago' | 'reembolsado';
export type PaymentMethod = 'pix' | 'cartao' | 'boleto' | 'externo';

/** Pedido recebido na página de vendas. */
export interface Order {
  id: string;
  infoproduct_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  utm_source?: string;
  created_at: string;
}

export interface Settings {
  display_name: string;
  handle: string;
  bio: string;
  pix_key: string;
  whatsapp: string;
  support_email: string;
  /** Comissão média usada nas estimativas quando o produto não informa. */
  default_commission_pct: number;
  /**
   * Quanto você quer faturar por mês (R$), somando comissões aprovadas e
   * vendas de infoprodutos. `0` = sem meta definida.
   */
  monthly_goal: number;
  /**
   * `true` enquanto o banco contém os dados de exemplo criados na primeira
   * execução. Vira `false` quando o usuário limpa tudo e começa do zero.
   */
  is_demo: boolean;
  affiliate_programs: { platform: Platform; status: 'conectado' | 'pendente' | 'nao_iniciado'; note?: string }[];
}

/** Formato completo do banco (modo file / snapshot). */
export interface Database {
  settings: Settings;
  products: Product[];
  clicks: ClickEvent[];
  conversions: Conversion[];
  content_posts: ContentPost[];
  infoproducts: Infoproduct[];
  orders: Order[];
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  shopee: 'Shopee',
  tiktok: 'TikTok Shop',
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  hotmart: 'Hotmart',
  kiwify: 'Kiwify',
  outro: 'Outro',
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  shopee: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  tiktok: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30',
  mercadolivre: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30',
  amazon: 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
  hotmart: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  kiwify: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  outro: 'bg-white/10 text-white/70 ring-white/20',
};

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  ideia: 'Ideia',
  roteirizado: 'Roteirizado',
  gravado: 'Gravado',
  publicado: 'Publicado',
};

export const CONTENT_STATUS_COLOR: Record<ContentStatus, string> = {
  ideia: 'bg-white/10 text-white/70 ring-white/20',
  roteirizado: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  gravado: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  publicado: 'bg-lime-500/15 text-lime-300 ring-lime-500/30',
};

/** Tabelas persistidas no banco (chaves de Database, exceto settings). */
export type TableName =
  | 'products'
  | 'clicks'
  | 'conversions'
  | 'content_posts'
  | 'infoproducts'
  | 'orders';
