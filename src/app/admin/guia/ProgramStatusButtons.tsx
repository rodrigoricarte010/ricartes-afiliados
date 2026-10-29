'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { markProgramAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import type { Platform } from '@/lib/types';

type Status = 'conectado' | 'pendente' | 'nao_iniciado';

function Btn({ status, current, label, tone }: { status: Status; current: Status; label: string; tone: string }) {
  const { pending } = useFormStatus();
  const active = current === status;
  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending || active}
      title={active ? 'Este já é o status atual' : `Marcar como ${label.toLowerCase()}`}
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-default ${
        active
          ? 'border-white/20 bg-white/[0.10] text-white'
          : `${tone} disabled:opacity-100`
      }`}
    >
      {pending && !active ? '…' : active ? `✓ ${label}` : label}
    </button>
  );
}

/**
 * Botões para registrar em que pé está o cadastro naquela plataforma.
 * Ficam no guia porque é ali que a pessoa acaba de se inscrever — antes ela
 * precisava ir até Configurações para atualizar.
 */
export function ProgramStatusButtons({ platform, status }: { platform: Platform; status: Status }) {
  const [state, action] = useActionState<ActionState, FormData>(markProgramAction, {});

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="platform" value={platform} />
      <span className="mr-0.5 text-[10px] uppercase tracking-wider text-white/30">Meu cadastro:</span>
      <Btn
        status="nao_iniciado"
        current={status}
        label="Não iniciei"
        tone="border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white/80"
      />
      <Btn
        status="pendente"
        current={status}
        label="Enviei / em análise"
        tone="border-amber-400/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
      />
      <Btn
        status="conectado"
        current={status}
        label="Aprovado"
        tone="border-lime-400/25 bg-lime-500/10 text-lime-200 hover:bg-lime-500/20"
      />
    </form>
  );
}
