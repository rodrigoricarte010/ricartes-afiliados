'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteInfoproductAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn w-full border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
    >
      {pending ? 'Removendo…' : 'Remover infoproduto'}
    </button>
  );
}

export function DeleteInfoproductButton({ id }: { id: string }) {
  const [state, action] = useActionState<ActionState, FormData>(deleteInfoproductAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      toast(state.message, state.ok ? 'success' : 'error');
      if (state.ok) router.push('/admin/infoprodutos');
    }
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Remover este infoproduto e todos os pedidos vinculados?')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
