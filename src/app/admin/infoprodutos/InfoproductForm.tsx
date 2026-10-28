'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveInfoproductAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { slugify } from '@/lib/format';
import type { Infoproduct } from '@/lib/types';

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar página de vendas'}
    </button>
  );
}

const THEMES: { value: Infoproduct['theme']; label: string; preview: string }[] = [
  { value: 'royal', label: 'Violeta da marca', preview: 'from-brand-400 to-brand-700' },
  { value: 'midnight', label: 'Azul profundo', preview: 'from-sky-400 to-indigo-800' },
  { value: 'ember', label: 'Âmbar quente', preview: 'from-amber-400 to-orange-700' },
  { value: 'lime', label: 'Verde energia', preview: 'from-lime-400 to-emerald-700' },
];

export function InfoproductForm({ infoproduct }: { infoproduct?: Infoproduct }) {
  const [state, action] = useActionState<ActionState, FormData>(saveInfoproductAction, {});
  const [name, setName] = useState(infoproduct?.name ?? '');
  const [slug, setSlug] = useState(infoproduct?.slug ?? '');
  const [theme, setTheme] = useState<Infoproduct['theme']>(infoproduct?.theme ?? 'royal');
  const [price, setPrice] = useState(infoproduct ? String(infoproduct.price).replace('.', ',') : '');
  const [original, setOriginal] = useState(
    infoproduct?.original_price ? String(infoproduct.original_price).replace('.', ',') : '',
  );

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  const priceNum = Number(price.replace(/\./g, '').replace(',', '.')) || 0;
  const originalNum = Number(original.replace(/\./g, '').replace(',', '.')) || 0;
  const discount = originalNum > priceNum && originalNum > 0 ? Math.round((1 - priceNum / originalNum) * 100) : 0;

  return (
    <form action={action} className="space-y-5">
      {infoproduct && <input type="hidden" name="id" value={infoproduct.id} />}

      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">Identidade</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="label">
              Nome do infoproduto *
            </label>
            <input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!infoproduct) setSlug(slugify(e.target.value));
              }}
              placeholder="Ex.: Achadinhos que Vendem"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="slug" className="label">
              URL da página
            </label>
            <div className="flex items-center rounded-xl border border-white/10 bg-ink-900/70 px-3 focus-within:border-brand-400/70">
              <span className="shrink-0 text-xs text-white/35">/p/</span>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="label">
              Status
            </label>
            <select id="status" name="status" defaultValue={infoproduct?.status ?? 'ativo'} className="input">
              <option value="ativo" className="bg-ink-900">Ativo (no ar)</option>
              <option value="rascunho" className="bg-ink-900">Rascunho</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="tagline" className="label">
              Promessa principal (headline)
            </label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={infoproduct?.tagline ?? ''}
              placeholder="O método que transformou seguidores em R$ 7.400/mês"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="label">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={infoproduct?.description ?? ''}
              placeholder="Explique o que a pessoa recebe, para quem é e por que funciona."
              className="input resize-y"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-5">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">Preço</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className="label">
              Preço (R$) *
            </label>
            <input
              id="price"
              name="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="97"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="original_price" className="label">
              Preço &ldquo;de&rdquo; (opcional)
            </label>
            <input
              id="original_price"
              name="original_price"
              inputMode="decimal"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="197"
              className="input"
            />
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-lime-500/25 bg-lime-500/10 px-3 py-2.5 text-xs text-lime-200">
              {discount > 0 ? `${discount}% de desconto exibido` : 'Sem desconto exibido'}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-5">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">Conteúdo da página</h3>
        <div className="grid gap-4">
          <div>
            <label htmlFor="benefits" className="label">
              Benefícios (um por linha)
            </label>
            <textarea
              id="benefits"
              name="benefits"
              rows={4}
              defaultValue={infoproduct?.benefits.join('\n') ?? ''}
              placeholder={'Escolha produtos com comissão alta\nRoteiros prontos que convertem\nCalendário de 30 dias'}
              className="input resize-y"
            />
          </div>
          <div>
            <label htmlFor="bonuses" className="label">
              Bônus — formato: <code className="text-white/60">Título | Descrição</code> (um por linha)
            </label>
            <textarea
              id="bonuses"
              name="bonuses"
              rows={3}
              defaultValue={infoproduct?.bonuses.map((b) => `${b.title} | ${b.description}`).join('\n') ?? ''}
              placeholder={'Planilha de Produtos | 50 nichos mapeados\nPack de 120 Ganchos | Frases testadas'}
              className="input resize-y font-mono text-xs"
            />
          </div>
          <div>
            <label htmlFor="testimonials" className="label">
              Depoimentos — formato: <code className="text-white/60">Nome | Cargo | Texto</code> (um por linha)
            </label>
            <textarea
              id="testimonials"
              name="testimonials"
              rows={3}
              defaultValue={infoproduct?.testimonials.map((t) => `${t.name} | ${t.role ?? ''} | ${t.text}`).join('\n') ?? ''}
              placeholder={'Juliana M. | Aluna | Em 3 semanas bati R$ 1.200 de comissão'}
              className="input resize-y font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-5">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">Pagamento e visual</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="checkout_url" className="label">
              Link de checkout externo (Hotmart, Kiwify, Eduzz…)
            </label>
            <input
              id="checkout_url"
              name="checkout_url"
              type="url"
              defaultValue={infoproduct?.checkout_url ?? ''}
              placeholder="https://pay.hotmart.com/..."
              className="input"
            />
            <p className="mt-1.5 text-[11px] text-white/35">
              Se preenchido, o botão principal leva direto para esse checkout. Se vazio, usamos Pix + WhatsApp abaixo.
            </p>
          </div>
          <div>
            <label htmlFor="pix_key" className="label">
              Chave Pix
            </label>
            <input
              id="pix_key"
              name="pix_key"
              defaultValue={infoproduct?.pix_key ?? ''}
              placeholder="seu@email.com"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="label">
              WhatsApp (com DDI + DDD)
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              defaultValue={infoproduct?.whatsapp ?? ''}
              placeholder="5585999999999"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="image_url" className="label">
              Imagem de capa (URL)
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={infoproduct?.image_url ?? ''}
              placeholder="https://..."
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <span className="label">Tema da página</span>
            <input type="hidden" name="theme" value={theme} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-[11px] transition ${
                    theme === t.value
                      ? 'border-brand-400/60 bg-white/[0.06] text-white'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <span className={`h-6 w-6 shrink-0 rounded-md bg-gradient-to-br ${t.preview}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {state.message && !state.ok && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <p className="text-[11px] text-white/35">A página de vendas é publicada automaticamente em /p/{slug || 'seu-slug'}.</p>
        <div className="flex items-center gap-2">
          {infoproduct && (
            <a href={`/p/${infoproduct.slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
              Ver página ↗
            </a>
          )}
          <Submit isEdit={Boolean(infoproduct)} />
        </div>
      </div>
    </form>
  );
}
