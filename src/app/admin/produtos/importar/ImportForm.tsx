'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { importProductsAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { parseProductList } from '@/lib/affiliate';
import { brl, pct } from '@/lib/format';
import { PLATFORM_LABEL } from '@/lib/types';

const EXAMPLE = `# Cole uma linha por produto — a ordem dos campos não importa
Organizador de geladeira; 49,90; 12; https://shopee.com.br/product/123/456
Air Fryer 4L; R$ 289,90; 8; https://www.mercadolivre.com.br/MLB-1234567890-air-fryer-4l-_JM
https://vt.tiktok.com/ZSabc123/`;

function Submit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending || count === 0}>
      {pending ? 'Importando…' : count === 0 ? 'Nada para importar' : `Importar ${count} ${count === 1 ? 'produto' : 'produtos'}`}
    </button>
  );
}

export function ImportForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(importProductsAction, {});
  const [text, setText] = useState('');

  const preview = useMemo(() => parseProductList(text), [text]);

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  const tooMany = preview.products.length > 200;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="lista" className="label mb-0">
            Lista de produtos
          </label>
          <button type="button" onClick={() => setText(EXAMPLE)} className="text-[11px] text-brand-300 hover:text-brand-200">
            usar exemplo
          </button>
        </div>
        <textarea
          id="lista"
          name="lista"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={EXAMPLE}
          className="input resize-y font-mono text-[12px] leading-relaxed"
        />
        <p className="mt-2 text-[11px] leading-relaxed text-white/35">
          Aceita <code className="text-white/55">;</code>, tabulação (colar do Excel/Sheets) ou vírgula. Reconhece o
          link, o nome, o preço em R$, a comissão em %, a plataforma e a categoria em qualquer ordem — o que faltar é
          deduzido do próprio link.
        </p>
      </div>

      {text.trim().length > 3 && (
        <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Prévia · {preview.products.length} {preview.products.length === 1 ? 'produto' : 'produtos'}
            </p>
            {preview.issues.length > 0 && (
              <span className="badge bg-amber-500/15 text-amber-300 ring-amber-500/30">
                {preview.issues.length} {preview.issues.length === 1 ? 'linha ignorada' : 'linhas ignoradas'}
              </span>
            )}
          </div>

          {preview.products.length === 0 ? (
            <p className="py-3 text-center text-xs text-white/35">
              Nenhum link reconhecido ainda. Cole o link de afiliado completo (https://…).
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="text-right">Preço</th>
                    <th className="text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.products.slice(0, 50).map((p) => (
                    <tr key={`${p.line}-${p.affiliate_url}`}>
                      <td>
                        <span className="block max-w-[240px] truncate text-[13px] font-medium text-white">{p.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/35">
                          <span className="badge bg-white/[0.06] text-white/50 ring-white/10">
                            {PLATFORM_LABEL[p.platform]}
                          </span>
                          {p.category} · linha {p.line}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right text-white/70">{brl(p.price)}</td>
                      <td className="whitespace-nowrap text-right text-white/70">
                        {pct(p.commission_pct, 2)}
                        <span className="ml-1 text-[10px] text-lime-300/70">
                          ≈ {brl((p.price * p.commission_pct) / 100)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.products.length > 50 && (
                <p className="mt-2 text-center text-[11px] text-white/30">
                  mostrando 50 de {preview.products.length}
                </p>
              )}
            </div>
          )}

          {preview.issues.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-white/[0.07] pt-2">
              {preview.issues.slice(0, 5).map((issue) => (
                <li key={`${issue.line}-${issue.reason}`} className="text-[11px] text-amber-300/80">
                  {issue.line > 0 ? `Linha ${issue.line}: ` : ''}
                  {issue.reason}
                  {issue.content && <span className="text-white/25"> — {issue.content.slice(0, 60)}</span>}
                </li>
              ))}
            </ul>
          )}

          {tooMany && (
            <p className="mt-2 text-[11px] text-amber-300/80">
              Só os primeiros 200 produtos serão importados nesta rodada.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end border-t border-white/[0.07] pt-4">
        <Submit count={preview.products.length} />
      </div>
    </form>
  );
}
