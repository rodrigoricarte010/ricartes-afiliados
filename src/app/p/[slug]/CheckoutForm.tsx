'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createOrderAction, type CheckoutState } from './actions';
import { brl } from '@/lib/format';

function Submit({ price }: { price: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={pending}>
      {pending ? 'Processando…' : `Quero garantir por ${brl(price)}`}
    </button>
  );
}

export function CheckoutForm({
  slug,
  price,
  pixKey,
  whatsapp,
}: {
  slug: string;
  price: number;
  pixKey?: string;
  whatsapp?: string;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(createOrderAction, {});
  const [method, setMethod] = useState<'pix' | 'cartao'>('pix');
  const [utm, setUtm] = useState('');

  // captura o utm_source da URL para atribuir a venda à origem
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('utm_source');
    if (value) setUtm(value.slice(0, 40));
  }, []);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="utm_source" value={utm} />

      <div>
        <label htmlFor="customer_name" className="label">
          Seu nome
        </label>
        <input id="customer_name" name="customer_name" required placeholder="Nome completo" className="input" />
      </div>
      <div>
        <label htmlFor="customer_email" className="label">
          Seu melhor e-mail
        </label>
        <input
          id="customer_email"
          name="customer_email"
          type="email"
          required
          placeholder="voce@email.com"
          className="input"
        />
        <p className="mt-1 text-[11px] text-white/30">É para este e-mail que enviamos o acesso.</p>
      </div>

      <div>
        <span className="label">Forma de pagamento</span>
        <input type="hidden" name="payment_method" value={method} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod('pix')}
            className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${
              method === 'pix'
                ? 'border-lime-400/50 bg-lime-500/10 text-lime-200'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20'
            }`}
          >
            <span className="block font-semibold">Pix</span>
            <span className="text-[10px] opacity-70">Aprovação imediata</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('cartao')}
            className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${
              method === 'cartao'
                ? 'border-brand-400/50 bg-brand-500/10 text-brand-200'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20'
            }`}
          >
            <span className="block font-semibold">Cartão / Boleto</span>
            <span className="text-[10px] opacity-70">Combine pelo WhatsApp</span>
          </button>
        </div>
      </div>

      {state.message && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}

      <Submit price={price} />

      <p className="text-center text-[10px] leading-snug text-white/25">
        Ao continuar você concorda com os termos de uso. Garantia incondicional de 7 dias.
        {pixKey && <> Pagamento via Pix para a chave informada no próximo passo.</>}
      </p>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre o produto.')}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-[11px] text-white/35 hover:text-white/60"
        >
          Prefere tirar uma dúvida no WhatsApp? Fale comigo →
        </a>
      )}
    </form>
  );
}
