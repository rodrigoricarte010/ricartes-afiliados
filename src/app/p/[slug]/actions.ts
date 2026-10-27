'use server';

import { redirect } from 'next/navigation';
import { repo } from '@/lib/db';
import type { PaymentMethod } from '@/lib/types';

export interface CheckoutState {
  ok?: boolean;
  message?: string;
}

export async function createOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const slug = String(formData.get('slug') ?? '');
  const name = String(formData.get('customer_name') ?? '').trim();
  const email = String(formData.get('customer_email') ?? '').trim();
  const method = (String(formData.get('payment_method') ?? 'pix') as PaymentMethod) ?? 'pix';
  const utm = String(formData.get('utm_source') ?? '').trim() || undefined;

  if (name.length < 3) return { ok: false, message: 'Informe seu nome completo.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: 'Informe um e-mail válido — é por ele que você recebe o acesso.' };
  }

  const product = await repo.infoproductBySlug(slug);
  if (!product) return { ok: false, message: 'Produto não encontrado.' };
  if (product.status !== 'ativo') return { ok: false, message: 'Este produto não está disponível no momento.' };

  const order = await repo.addOrder({
    infoproduct_id: product.id,
    customer_name: name,
    customer_email: email,
    amount: product.price,
    payment_method: method,
    utm_source: utm,
    status: 'pendente',
  });

  redirect(`/p/${product.slug}/obrigado?pedido=${order.id}`);
}
