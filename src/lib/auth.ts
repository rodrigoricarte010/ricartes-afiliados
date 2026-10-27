// ---------------------------------------------------------------------------
// Autenticação simples por senha com cookie assinado (HMAC-SHA256).
// Suficiente para um painel pessoal. Para multiusuário, troque por Supabase Auth.
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ra_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

function secret(): string {
  return process.env.AUTH_SECRET || 'dev-secret-nao-use-em-producao';
}

export function appPassword(): string {
  return process.env.APP_PASSWORD || 'ricartes';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  const expected = sign(encoded);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { exp: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function login(password: string): Promise<boolean> {
  if (password !== appPassword()) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE = COOKIE_NAME;
