'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] erro não tratado:', error);
  }, [error]);

  const message = error?.message ?? '';
  const isDatabaseIssue =
    /DATABASE_URL|DB_DRIVER|password|ECONNREFUSED|ENOTFOUND|relation .* does not exist|getaddrinfo|connect/i.test(
      message,
    );

  return (
    <div className="relative grid min-h-dvh place-items-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="relative w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-2xl">
          {isDatabaseIssue ? '🗄️' : '⚠️'}
        </span>

        <h1 className="mt-4 font-display text-2xl font-bold text-white">
          {isDatabaseIssue ? 'Banco de dados não configurado' : 'Algo deu errado'}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-white/50">
          {isDatabaseIssue ? (
            <>
              A aplicação está em modo Postgres, mas não conseguiu conectar. Confira se a variável{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">DATABASE_URL</code> está definida no
              projeto da Vercel e faça um novo deploy.
            </>
          ) : (
            <>Ocorreu um erro inesperado ao carregar esta página. Tente novamente.</>
          )}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={reset} className="btn-primary">
            Tentar novamente
          </button>
          <Link href="/" className="btn-ghost">
            Ir para a home
          </Link>
        </div>

        {error?.digest && (
          <p className="mt-4 text-[10px] text-white/25">Código do erro: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
