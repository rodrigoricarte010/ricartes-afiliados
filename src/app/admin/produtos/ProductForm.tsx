'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveProductAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { slugify } from '@/lib/format';
import { PLATFORM_LABEL, type Platform, type Product } from '@/lib/types';

const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];
const CATEGORIES = [
  'Cozinha',
  'Casa',
  'Beleza',
  'Tecnologia',
  'Fitness',
  'Infantil',
  'Moda',
  'Pets',
  'Papelaria',
  'Geral',
];

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
    </button>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveProductAction, {});
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [price, setPrice] = useState(product ? String(product.price).replace('.', ',') : '');
  const [commission, setCommission] = useState(product ? String(product.commission_pct).replace('.', ',') : '12');

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  const priceNum = Number(price.replace(/\./g, '').replace(',', '.')) || 0;
  const commNum = Number(commission.replace(',', '.')) || 0;
  const estimated = (priceNum * commNum) / 100;

  return (
    <form action={formAction} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Nome do produto *
          </label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!product) setSlug(slugify(e.target.value));
            }}
            placeholder="Ex.: Organizador de geladeira empilhável (kit 4)"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="platform" className="label">
            Plataforma
          </label>
          <select id="platform" name="platform" defaultValue={product?.platform ?? 'shopee'} className="input">
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="bg-ink-900">
                {PLATFORM_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="label">
            Categoria
          </label>
          <input
            id="category"
            name="category"
            list="categorias"
            defaultValue={product?.category ?? 'Geral'}
            className="input"
            placeholder="Cozinha"
          />
          <datalist id="categorias">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="price" className="label">
            Preço de venda (R$)
          </label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="49,90"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="commission_pct" className="label">
            Comissão (%)
          </label>
          <input
            id="commission_pct"
            name="commission_pct"
            inputMode="decimal"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="12"
            className="input"
          />
          {estimated > 0 && (
            <p className="mt-1.5 text-[11px] text-lime-300/80">
              ≈ R$ {estimated.toFixed(2).replace('.', ',')} de comissão por venda
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="affiliate_url" className="label">
            Link de afiliado original *
          </label>
          <input
            id="affiliate_url"
            name="affiliate_url"
            required
            type="url"
            defaultValue={product?.affiliate_url ?? ''}
            placeholder="https://shopee.com.br/product/...?af_siteid=seu_id"
            className="input"
          />
          <p className="mt-1.5 text-[11px] text-white/35">
            Gere esse link no painel da Shopee/TikTok Shop/Mercado Livre. O visitante será redirecionado para ele.
          </p>
        </div>

        <div>
          <label htmlFor="slug" className="label">
            Seu link rastreável
          </label>
          <div className="flex items-center rounded-xl border border-white/10 bg-ink-900/70 px-3 focus-within:border-brand-400/70">
            <span className="shrink-0 text-xs text-white/35">/r/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="organizador-geladeira"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={product?.status ?? 'ativo'} className="input">
            <option value="ativo" className="bg-ink-900">Ativo (divulgando)</option>
            <option value="pausado" className="bg-ink-900">Pausado</option>
            <option value="rascunho" className="bg-ink-900">Rascunho</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="image_url" className="label">
            Imagem do produto (URL, opcional)
          </label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={product?.image_url ?? ''}
            placeholder="https://..."
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label">
            Anotações internas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={product?.notes ?? ''}
            placeholder="Ex.: converte melhor em vídeo de antes e depois; comissão alta em campanha."
            className="input resize-y"
          />
        </div>
      </div>

      {state.message && !state.ok && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Submit isEdit={Boolean(product)} />
      </div>
    </form>
  );
}
