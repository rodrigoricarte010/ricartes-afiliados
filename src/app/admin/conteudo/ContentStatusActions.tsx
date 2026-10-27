'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import {
  deleteContentAction,
  updateContentStatusAction,
  type ActionState,
} from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { CONTENT_STATUS_LABEL, type ContentStatus } from '@/lib/types';

const FLOW: ContentStatus[] = ['ideia', 'roteirizado', 'gravado', 'publicado'];

function StatusButton({ value, active }: { value: ContentStatus; active: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
        active
          ? 'bg-lime-500 text-ink-950'
          : 'border border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white'
      }`}
    >
      {CONTENT_STATUS_LABEL[value]}
    </button>
  );
}

export function ContentStatusActions({ id, status }: { id: string; status: ContentStatus }) {
  const [state, action] = useActionState<ActionState, FormData>(updateContentStatusAction, {});
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteContentAction, {});

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  useEffect(() => {
    if (deleteState.message) toast(deleteState.message, deleteState.ok ? 'success' : 'error');
  }, [deleteState]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <form action={action} className="flex flex-wrap gap-1.5">
        <input type="hidden" name="id" value={id} />
        {FLOW.map((s) => (
          <StatusButton key={s} value={s} active={s === status} />
        ))}
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm('Remover este conteúdo do calendário?')) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/20"
        >
          Remover
        </button>
      </form>
    </div>
  );
}
