'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addConversionAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import type { Product } from '@/lib/types';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Registrando…' : 'Registrar venda'}
    </button>
  );
}

export function ConversionForm({ products }: { products: Product[] }) {
  const [state, action] = useActionState<ActionState, FormData>(addConversionAction, {});
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const product = products.find((p) => p.id === productId);

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="product_id" className="label">
          Produto vendido
        </label>
        <select
          id="product_id"
          name="product_id"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="input"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id} className="bg-ink-900">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="amount" className="label">
            Valor da venda
          </label>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder={product ? String(product.price).replace('.', ',') : '0,00'}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="commission" className="label">
            Sua comissão
          </label>
          <input
            id="commission"
            name="commission"
            inputMode="decimal"
            placeholder={
              product ? ((product.price * product.commission_pct) / 100).toFixed(2).replace('.', ',') : '0,00'
            }
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="label">
          Situação
        </label>
        <select id="status" name="status" defaultValue="pendente" className="input">
          <option value="pendente" className="bg-ink-900">Pendente (aguardando aprovação)</option>
          <option value="aprovada" className="bg-ink-900">Aprovada (já cai na conta)</option>
          <option value="cancelada" className="bg-ink-900">Cancelada / devolvida</option>
        </select>
      </div>

      <p className="text-[11px] leading-snug text-white/35">
        Deixe os valores em branco para usar o preço e o percentual cadastrados no produto.
      </p>

      <Submit />

      {state.message && !state.ok && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}
    </form>
  );
}
