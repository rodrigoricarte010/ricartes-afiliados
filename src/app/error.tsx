'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Tela de erro amigável.
 *
 * Em produção o Next.js esconde a mensagem original dos erros de Server
 * Component (sobra só um `digest`), então tratamos três casos:
 *  1. mensagem explícita de banco (dev / rota server) → "Banco de dados não configurado"
 *  2. mensagem mascarada pela build de produção  → "Não conseguimos carregar os dados"
 *     (com a dica de DATABASE_URL, que é a causa mais comum)
 *  3. qualquer outro erro                         → "Algo deu errado"
 */
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
  const isMasked = /Server Components render|omitted in production/i.test(message);
  const kind: 'db' | 'masked' | 'other' = isDatabaseIssue ? 'db' : isMasked ? 'masked' : 'other';

  return (
    <div className="relative grid min-h-dvh place-items-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="relative w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-2xl">
          {kind === 'other' ? '⚠️' : '🗄️'}
        </span>

        <h1 className="mt-4 font-display text-2xl font-bold text-white">
          {kind === 'db'
            ? 'Banco de dados não configurado'
            : kind === 'masked'
              ? 'Não conseguimos carregar os dados'
              : 'Algo deu errado'}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-white/50">
          {kind === 'db' && (
            <>
              A aplicação está em modo Postgres, mas não conseguiu conectar. Confira se a variável{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">DATABASE_URL</code> está definida no
              projeto da Vercel e faça um novo deploy.
            </>
          )}
          {kind === 'masked' && (
            <>
              Ocorreu uma falha ao buscar os dados desta página. Na maioria das vezes isso quer dizer que o banco
              ainda não está configurado ou está fora do ar: confira a variável{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">DATABASE_URL</code> nas configurações
              do projeto na Vercel.
            </>
          )}
          {kind === 'other' && <>Ocorreu um erro inesperado ao carregar esta página. Tente novamente.</>}
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
