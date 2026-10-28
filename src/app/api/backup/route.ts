import { NextResponse } from 'next/server';
import { repo } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Download de backup completo em JSON (somente sessão autenticada). */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const db = await repo.snapshot();
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(db, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ricartes-backup-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
