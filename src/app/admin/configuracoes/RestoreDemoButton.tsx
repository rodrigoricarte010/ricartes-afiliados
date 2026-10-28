'use client';

import { useFormStatus } from 'react-dom';

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      onClick={(event) => {
        const ok = window.confirm(
          'Restaurar a demonstração apaga TUDO o que você cadastrou (produtos, cliques, comissões, roteiros, infoprodutos e pedidos) e coloca os exemplos de volta.\n\nBaixe o backup antes. Continuar?',
        );
        if (!ok) event.preventDefault();
      }}
      disabled={pending}
      className="btn w-full border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Restaurando…' : '↺ Restaurar demonstração'}
    </button>
  );
}

export function RestoreDemoButton() {
  return <Button />;
}
