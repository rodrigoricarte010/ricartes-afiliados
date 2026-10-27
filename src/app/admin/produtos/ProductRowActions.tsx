'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteProductAction, toggleProductAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { CopyButton } from '@/components/CopyButton';

function IconSubmit({ children, title, danger }: { children: React.ReactNode; title: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={title}
      disabled={pending}
      className={`grid h-7 w-7 place-items-center rounded-lg border text-xs transition disabled:opacity-40 ${
        danger
          ? 'border-brand-500/20 bg-brand-500/10 text-brand-300 hover:border-brand-400/40 hover:bg-brand-500/20'
          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white'
      }`}
    >
      {pending ? '·' : children}
    </button>
  );
}

export function ProductRowActions({
  id,
  status,
  appUrl,
  slug,
}: {
  id: string;
  status: string;
  appUrl: string;
  slug: string;
}) {
  const [toggleState, toggleAction] = useActionState<ActionState, FormData>(toggleProductAction, {});
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteProductAction, {});

  useEffect(() => {
    if (toggleState.message) toast(toggleState.message, toggleState.ok ? 'success' : 'error');
  }, [toggleState]);

  useEffect(() => {
    if (deleteState.message) {
      toast(deleteState.message, deleteState.ok ? 'success' : 'error');
      if (deleteState.ok && typeof window !== 'undefined') {
        const row = document.getElementById(`product-${id}`);
        row?.remove();
      }
    }
  }, [deleteState, id]);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <CopyButton value={`${appUrl}/r/${slug}`} label="" compact className="!h-7 !w-7 !p-0" />
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <IconSubmit title={status === 'ativo' ? 'Pausar produto' : 'Ativar produto'}>
          {status === 'ativo' ? '❙❙' : '▶'}
        </IconSubmit>
      </form>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm('Remover este produto? Cliques e vendas vinculados também serão removidos.')) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <IconSubmit title="Remover produto" danger>
          ✕
        </IconSubmit>
      </form>
    </div>
  );
}
