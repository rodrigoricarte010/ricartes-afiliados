'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateConversionStatusAction, updateOrderStatusAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';

export function ConversionStatusSelect({ id, status }: { id: string; status: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateConversionStatusAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className={`rounded-lg border-0 px-2 py-1 text-[11px] font-semibold ring-1 ring-inset transition focus:outline-none ${
          status === 'aprovada'
            ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
            : status === 'pendente'
              ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
              : 'bg-white/[0.06] text-white/50 ring-white/10'
        }`}
      >
        <option value="pendente" className="bg-ink-900 text-white">pendente</option>
        <option value="aprovada" className="bg-ink-900 text-white">aprovada</option>
        <option value="cancelada" className="bg-ink-900 text-white">cancelada</option>
      </select>
    </form>
  );
}

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateOrderStatusAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className={`rounded-lg border-0 px-2 py-1 text-[11px] font-semibold ring-1 ring-inset transition focus:outline-none ${
          status === 'pago'
            ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
            : status === 'pendente'
              ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
              : 'bg-white/[0.06] text-white/50 ring-white/10'
        }`}
      >
        <option value="pendente" className="bg-ink-900 text-white">pendente</option>
        <option value="pago" className="bg-ink-900 text-white">pago</option>
        <option value="reembolsado" className="bg-ink-900 text-white">reembolsado</option>
      </select>
    </form>
  );
}
