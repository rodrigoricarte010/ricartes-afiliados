import { NextResponse } from 'next/server';
import { dbDriver, repo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Esconde usuário/senha caso a mensagem de erro traga a connection string. */
function sanitize(message: string): string {
  return message.replace(/(:\/\/[^:/@]+:)[^@]+@/g, '$1***@');
}

/**
 * Diagnóstico de saúde da aplicação.
 *
 * Abrir `/api/health` no navegador responde:
 *  - qual driver de banco está ativo (`file`, `postgres`, `supabase`)
 *  - se a conexão respondeu e quanto tempo levou
 *  - quantos registros existem em cada tabela
 *
 * Serve para conferir em produção (Vercel) se a DATABASE_URL está correta,
 * especialmente quando o site mostra a tela de erro de banco.
 */
export async function GET() {
  const driver = dbDriver();
  const startedAt = Date.now();

  try {
    const db = await repo.snapshot();
    const lastClick = db.clicks.reduce<string | null>(
      (acc, c) => (acc === null || c.ts > acc ? c.ts : acc),
      null,
    );

    return NextResponse.json(
      {
        ok: true,
        driver,
        latencyMs: Date.now() - startedAt,
        counts: {
          products: db.products.length,
          clicks: db.clicks.length,
          conversions: db.conversions.length,
          content_posts: db.content_posts.length,
          infoproducts: db.infoproducts.length,
          orders: db.orders.length,
        },
        lastClickAt: lastClick,
        checkedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[health] banco indisponível:', message);

    return NextResponse.json(
      {
        ok: false,
        driver,
        latencyMs: Date.now() - startedAt,
        error: sanitize(message),
        hint:
          driver === 'postgres'
            ? 'Confira se DATABASE_URL está definida no projeto da Vercel (Settings → Environment Variables) e faça um novo deploy.'
            : 'Verifique a configuração do banco.',
        checkedAt: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
