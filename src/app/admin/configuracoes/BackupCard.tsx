'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { importBackupAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost w-full" disabled={pending}>
      {pending ? 'Importando…' : '⤒ Importar backup'}
    </button>
  );
}

export function BackupCard() {
  const [state, action] = useActionState<ActionState, FormData>(importBackupAction, {});
  const [fileName, setFileName] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <div className="space-y-2">
      <a href="/api/backup" className="btn-ghost w-full">
        ⤓ Baixar backup (JSON)
      </a>

      <form
        ref={formRef}
        action={action}
        className="space-y-2"
        onSubmit={(e) => {
          if (!fileName) {
            e.preventDefault();
            toast('Selecione um arquivo de backup primeiro.', 'error');
            return;
          }
          if (!confirm('Importar este backup? Todo o conteúdo atual será substituído.')) {
            e.preventDefault();
          }
        }}
      >
        <label
          htmlFor="backup"
          className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-2.5 text-[11px] text-white/45 transition hover:border-white/30 hover:text-white/70"
        >
          <span className="truncate">{fileName || 'Selecionar arquivo .json'}</span>
          <span className="shrink-0 text-white/30">escolher</span>
        </label>
        <input
          id="backup"
          name="backup"
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
        />
        <Submit />
      </form>

      {state.message && !state.ok && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-[11px] text-brand-200">
          {state.message}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-lime-400/30 bg-lime-500/10 px-3 py-2 text-[11px] text-lime-200">
          {state.message}
        </p>
      )}
    </div>
  );
}
