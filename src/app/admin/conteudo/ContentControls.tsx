'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  ALL_AUDIENCES,
  ALL_FORMATS,
  ALL_TONES,
  AUDIENCE_LABEL,
  FORMAT_LABEL,
  TONE_LABEL,
} from '@/lib/content-engine';
import type { Product } from '@/lib/types';

interface Props {
  products: Product[];
  current: { product: string; format: string; tone: string; audience: string; seed: number };
}

export function ContentControls({ products, current }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    if (key !== 'seed') next.set('seed', '0');
    startTransition(() => router.push(`/admin/conteudo?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className={`space-y-4 ${pending ? 'opacity-60' : ''}`}>
      <div>
        <label htmlFor="product" className="label">
          Produto
        </label>
        <select
          id="product"
          value={current.product}
          onChange={(e) => update('product', e.target.value)}
          className="input"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id} className="bg-ink-900">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="format" className="label">
          Formato do vídeo
        </label>
        <select
          id="format"
          value={current.format}
          onChange={(e) => update('format', e.target.value)}
          className="input"
        >
          {ALL_FORMATS.map((f) => (
            <option key={f} value={f} className="bg-ink-900">
              {FORMAT_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tone" className="label">
            Tom
          </label>
          <select id="tone" value={current.tone} onChange={(e) => update('tone', e.target.value)} className="input">
            {ALL_TONES.map((t) => (
              <option key={t} value={t} className="bg-ink-900">
                {TONE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audience" className="label">
            Público
          </label>
          <select
            id="audience"
            value={current.audience}
            onChange={(e) => update('audience', e.target.value)}
            className="input"
          >
            {ALL_AUDIENCES.map((a) => (
              <option key={a} value={a} className="bg-ink-900">
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => update('seed', String(Date.now() % 100000))}
        className="btn-ghost w-full"
        disabled={pending}
      >
        {pending ? 'Gerando…' : '🎲 Variar ganchos (nova versão)'}
      </button>
    </div>
  );
}
