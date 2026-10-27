'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction, type ActionState } from '@/app/admin/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar no painel'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="card space-y-4 p-5 sm:p-6">
      <div>
        <label htmlFor="password" className="label">
          Senha de acesso
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          placeholder="••••••••"
          className="input"
        />
      </div>

      {state.message && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
