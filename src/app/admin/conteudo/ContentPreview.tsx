'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { generateAndSaveContentAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { CopyButton } from '@/components/CopyButton';
import type { GeneratedContent } from '@/lib/content-engine';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Salvando…' : '+ Salvar no calendário'}
    </button>
  );
}

export function ContentPreview({
  generated,
  hidden,
  statuses,
}: {
  generated: GeneratedContent;
  hidden: Record<string, string>;
  statuses: { label: string; value: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(generateAndSaveContentAction, {});
  const [tab, setTab] = useState<'script' | 'caption' | 'hooks'>('script');

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  const fullText = [generated.hook, '', generated.script, '', generated.caption, generated.hashtags].join('\n');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-500/25 bg-gradient-to-br from-brand-500/[0.12] to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-brand-300/80">Gancho (0–3s)</p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-white">“{generated.hook}”</p>
          </div>
          <CopyButton value={generated.hook} label="" compact className="!h-8 !w-8 !shrink-0 !p-0" />
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          Duração estimada: {generated.estimatedSeconds}s · formato vertical 9:16
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
        {(
          [
            ['script', 'Roteiro'],
            ['caption', 'Legenda'],
            ['hooks', 'Ganchos'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === key ? 'bg-white/[0.09] text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
        {tab === 'script' && (
          <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-white/75">
            {generated.script}
          </pre>
        )}
        {tab === 'caption' && (
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-white/75">
              {generated.caption}
            </pre>
            <div className="rounded-lg bg-lime-500/[0.08] p-2.5 text-[12.5px] leading-relaxed text-lime-200">
              {generated.hashtags}
            </div>
          </div>
        )}
        {tab === 'hooks' && (
          <ul className="space-y-2">
            {[generated.hook, ...generated.hookAlternatives].map((hook, i) => (
              <li key={hook} className="flex items-start gap-2 text-[12.5px] leading-snug text-white/75">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-white/[0.07] text-[10px] text-white/40">
                  {i + 1}
                </span>
                {hook}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={fullText} label="Copiar tudo" />
        <CopyButton value={generated.script} label="Copiar roteiro" />
        <CopyButton value={`${generated.caption}\n\n${generated.hashtags}`} label="Copiar legenda" />
      </div>

      <form action={formAction} className="space-y-2 border-t border-white/[0.07] pt-4">
        {Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <div>
          <label htmlFor="platform" className="label">
            Publicar em
          </label>
          <select id="platform" name="platform" defaultValue="tiktok" className="input">
            {statuses.map((s) => (
              <option key={s.value} value={s.value} className="bg-ink-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <SaveButton />
        {state.ok && state.id && (
          <a href={`/admin/conteudo/${state.id}`} className="block text-center text-xs font-semibold text-lime-300 hover:text-lime-200">
            Abrir conteúdo salvo →
          </a>
        )}
      </form>
    </div>
  );
}
