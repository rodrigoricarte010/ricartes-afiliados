'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { repo } from '@/lib/db';
import { isAuthenticated, login, logout } from '@/lib/auth';
import { parseMoney, slugify } from '@/lib/format';
import { generateForProduct, type ContentAudience, type ContentFormat, type ContentTone } from '@/lib/content-engine';
import type {
  ContentPost,
  ContentStatus,
  ConversionStatus,
  Infoproduct,
  Order,
  Platform,
  ProductStatus,
} from '@/lib/types';

export interface ActionState {
  ok?: boolean;
  message?: string;
  slug?: string;
  id?: string;
}

async function guard() {
  if (!(await isAuthenticated())) {
    redirect('/login');
  }
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function number(form: FormData, key: string): number {
  return parseMoney(str(form, key));
}

function revalidateAll() {
  revalidatePath('/admin', 'layout');
}

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = str(formData, 'password');
  const ok = await login(password);
  if (!ok) return { ok: false, message: 'Senha incorreta. Tente novamente.' };
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Produtos de afiliado
// ---------------------------------------------------------------------------

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();

  const id = str(formData, 'id') || undefined;
  const name = str(formData, 'name');
  const affiliate_url = str(formData, 'affiliate_url');

  if (name.length < 3) return { ok: false, message: 'Informe o nome do produto.' };
  if (!/^https?:\/\//i.test(affiliate_url)) {
    return { ok: false, message: 'O link de afiliado deve começar com http:// ou https://' };
  }

  const slugInput = str(formData, 'slug');
  let slug = slugify(slugInput || name);

  // garante unicidade
  const snapshot = await repo.snapshot();
  const taken = new Set(snapshot.products.filter((p) => p.id !== id).map((p) => p.slug));
  if (taken.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

  const platform = (str(formData, 'platform') || 'shopee') as Platform;
  const status = (str(formData, 'status') || 'ativo') as ProductStatus;

  const saved = await repo.saveProduct({
    id,
    slug,
    name,
    platform,
    category: str(formData, 'category') || 'Geral',
    price: number(formData, 'price'),
    commission_pct: number(formData, 'commission_pct'),
    affiliate_url,
    image_url: str(formData, 'image_url') || undefined,
    notes: str(formData, 'notes') || undefined,
    status,
  });

  revalidateAll();
  revalidatePath(`/admin/produtos/${saved.id}`);
  return { ok: true, message: id ? 'Produto atualizado.' : 'Produto cadastrado com sucesso.', id: saved.id, slug: saved.slug };
}

export async function deleteProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  if (!id) return { ok: false, message: 'Produto inválido.' };
  await repo.deleteProduct(id);
  revalidateAll();
  return { ok: true, message: 'Produto removido (com cliques e vendas vinculados).' };
}

export async function toggleProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  if (!id) return { ok: false, message: 'Produto inválido.' };
  await repo.toggleProductStatus(id);
  revalidateAll();
  return { ok: true, message: 'Status do produto atualizado.' };
}

// ---------------------------------------------------------------------------
// Conteúdo (TikTok / Reels / Shorts)
// ---------------------------------------------------------------------------

export async function generateAndSaveContentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();

  const productId = str(formData, 'product_id');
  const snapshot = await repo.snapshot();
  const product = snapshot.products.find((p) => p.id === productId);
  if (!product) return { ok: false, message: 'Selecione um produto válido.' };

  const format = (str(formData, 'format') || 'review') as ContentFormat;
  const tone = (str(formData, 'tone') || 'direto') as ContentTone;
  const audience = (str(formData, 'audience') || 'geral') as ContentAudience;
  const seed = Number(str(formData, 'seed') || '0');

  const generated = generateForProduct(product, format, tone, audience, seed);

  const post = await repo.saveContentPost({
    product_id: product.id,
    platform: (str(formData, 'platform') || 'tiktok') as ContentPost['platform'],
    title: generated.title,
    hook: generated.hook,
    script: generated.script,
    caption: generated.caption,
    hashtags: generated.hashtags,
    status: 'roteirizado',
  });

  revalidateAll();
  return { ok: true, message: 'Roteiro salvo no seu calendário.', id: post.id };
}

export async function updateContentStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  const status = str(formData, 'status') as ContentStatus;
  if (!id || !status) return { ok: false, message: 'Dados inválidos.' };
  await repo.updateContentStatus(id, status);
  revalidateAll();
  revalidatePath(`/admin/conteudo/${id}`);
  return { ok: true, message: `Conteúdo marcado como "${status}".` };
}

export async function deleteContentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  if (!id) return { ok: false, message: 'Conteúdo inválido.' };
  await repo.deleteContentPost(id);
  revalidateAll();
  return { ok: true, message: 'Conteúdo removido.' };
}

// ---------------------------------------------------------------------------
// Vendas de afiliado
// ---------------------------------------------------------------------------

export async function addConversionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const productId = str(formData, 'product_id');
  const snapshot = await repo.snapshot();
  const product = snapshot.products.find((p) => p.id === productId);
  if (!product) return { ok: false, message: 'Selecione o produto vendido.' };

  const amount = number(formData, 'amount') || product.price;
  const commission = number(formData, 'commission') || (amount * product.commission_pct) / 100;
  const status = (str(formData, 'status') || 'pendente') as ConversionStatus;

  await repo.addConversion({ product_id: product.id, amount, commission, status });
  revalidateAll();
  return {
    ok: true,
    message: `Venda registrada: comissão de R$ ${commission.toFixed(2).replace('.', ',')}.`,
  };
}

export async function updateConversionStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  const status = str(formData, 'status') as ConversionStatus;
  if (!id || !status) return { ok: false, message: 'Dados inválidos.' };
  await repo.updateConversionStatus(id, status);
  revalidateAll();
  return { ok: true, message: 'Status da comissão atualizado.' };
}

// ---------------------------------------------------------------------------
// Infoprodutos
// ---------------------------------------------------------------------------

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function saveInfoproductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();

  const id = str(formData, 'id') || undefined;
  const name = str(formData, 'name');
  if (name.length < 3) return { ok: false, message: 'Informe o nome do infoproduto.' };

  let slug = slugify(str(formData, 'slug') || name);
  const snapshot = await repo.snapshot();
  const taken = new Set(snapshot.infoproducts.filter((p) => p.id !== id).map((p) => p.slug));
  if (taken.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

  const bonuses = splitLines(str(formData, 'bonuses')).map((line) => {
    const [title, ...rest] = line.split('|');
    return { title: (title ?? '').trim(), description: rest.join('|').trim() };
  });

  const testimonials = splitLines(str(formData, 'testimonials')).map((line) => {
    const [nm, role, ...rest] = line.split('|');
    return { name: (nm ?? '').trim(), role: (role ?? '').trim(), text: rest.join('|').trim() };
  });

  const saved = await repo.saveInfoproduct({
    id,
    slug,
    name,
    tagline: str(formData, 'tagline'),
    description: str(formData, 'description'),
    price: number(formData, 'price'),
    original_price: number(formData, 'original_price') || undefined,
    benefits: splitLines(str(formData, 'benefits')),
    bonuses,
    testimonials,
    checkout_url: str(formData, 'checkout_url') || undefined,
    pix_key: str(formData, 'pix_key') || undefined,
    whatsapp: str(formData, 'whatsapp') || undefined,
    image_url: str(formData, 'image_url') || undefined,
    theme: (str(formData, 'theme') || 'ember') as Infoproduct['theme'],
    status: (str(formData, 'status') || 'ativo') as Infoproduct['status'],
  });

  revalidateAll();
  revalidatePath(`/p/${saved.slug}`);
  return { ok: true, message: id ? 'Infoproduto atualizado.' : 'Infoproduto criado.', id: saved.id, slug: saved.slug };
}

export async function deleteInfoproductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  if (!id) return { ok: false, message: 'Infoproduto inválido.' };
  await repo.deleteInfoproduct(id);
  revalidateAll();
  return { ok: true, message: 'Infoproduto removido.' };
}

export async function updateOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const id = str(formData, 'id');
  const status = str(formData, 'status') as Order['status'];
  if (!id || !status) return { ok: false, message: 'Dados inválidos.' };
  await repo.updateOrderStatus(id, status);
  revalidateAll();
  return { ok: true, message: 'Pedido atualizado.' };
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await guard();
  const snapshot = await repo.snapshot();

  const programs = snapshot.settings.affiliate_programs.map((program) => {
    const raw = str(formData, `program_${program.platform}`);
    return raw ? { ...program, status: raw as typeof program.status } : program;
  });

  await repo.saveSettings({
    ...snapshot.settings,
    display_name: str(formData, 'display_name') || snapshot.settings.display_name,
    handle: str(formData, 'handle') || snapshot.settings.handle,
    bio: str(formData, 'bio'),
    pix_key: str(formData, 'pix_key'),
    whatsapp: str(formData, 'whatsapp'),
    support_email: str(formData, 'support_email'),
    default_commission_pct: number(formData, 'default_commission_pct') || 12,
    affiliate_programs: programs,
  });

  revalidateAll();
  return { ok: true, message: 'Configurações salvas.' };
}

export async function resetDemoAction(): Promise<void> {
  await guard();
  await repo.resetDemo();
  revalidateAll();
  redirect('/admin');
}
