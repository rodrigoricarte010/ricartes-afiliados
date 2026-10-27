import { headers } from 'next/headers';

/**
 * URL pública da aplicação.
 * Prioriza NEXT_PUBLIC_APP_URL (quando não é localhost) e, se não existir,
 * deriva do host da requisição — funciona no preview, na Vercel e local.
 */
export async function appUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) return envUrl;

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  } catch {
    // fora de contexto de request (build)
  }

  return envUrl || 'http://localhost:3000';
}
