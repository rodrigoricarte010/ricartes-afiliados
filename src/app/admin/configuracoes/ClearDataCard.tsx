'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { clearDataAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';

function Submit({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!enabled || pending}
      className="btn w-full border border-red-500/30 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Apagando…' : '🗑 Apagar todos os dados'}
    </button>
  );
}

export function ClearDataCard({ produtoCount, cliqueCount }: { produtoCount: number; cliqueCount: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(clearDataAction, {});
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <div>
      <p className="mb-3 text-[11px] leading-snug text-white/45">
        Remove <strong className="text-white/70">{produtoCount} produtos</strong>,{' '}
        <strong className="text-white/70">{cliqueCount} cliques</strong>, comissões, roteiros, infoprodutos e pedidos —
        e zera o perfil (nome, bio, Pix, WhatsApp). Não dá para desfazer:{' '}
        <a href="/api/backup" className="font-semibold text-brand-300 underline-offset-2 hover:underline">
          baixe o backup antes
        </a>
        .
      </p>

      <form action={formAction} className="space-y-2">
        <label htmlFor="confirmacao" className="label">
          Digite <span className="font-mono text-red-300">LIMPAR</span> para confirmar
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          placeholder="LIMPAR"
          className="input font-mono uppercase tracking-wider"
        />
        <Submit enabled={confirmation.trim().toUpperCase() === 'LIMPAR'} />
      </form>

      <p className="mt-3 text-[10px] leading-snug text-white/25">
        Depois de limpar, o banco fica vazio de verdade — os dados de exemplo <strong>não voltam sozinhos</strong>.
        Para trazê-los de volta algum dia, use o botão “Restaurar demonstração”.
      </p>
    </div>
  );
}
