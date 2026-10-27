// ---------------------------------------------------------------------------
// Link rastreável: /r/<slug>
// Registra o clique (origem, dispositivo, referrer) e redireciona para o link
// de afiliado original.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { repo } from '@/lib/db';
import type { Device } from '@/lib/types';

export const dynamic = 'force-dynamic';

function detectDevice(ua: string): Device {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return 'tablet';
  if (/mobi|android|iphone|ipod|phone/.test(s)) return 'mobile';
  if (/windows|macintosh|linux|cros/.test(s)) return 'desktop';
  return 'outro';
}

function detectSource(url: URL, referrer: string | null): string {
  const utm = url.searchParams.get('utm_source') || url.searchParams.get('src');
  if (utm) return utm.toLowerCase().slice(0, 40);
  if (!referrer) return 'direto';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram') || host.includes('ig.')) return 'instagram';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('kwai')) return 'kwai';
    if (host.includes('facebook')) return 'facebook';
    if (host.includes('google')) return 'google';
    if (host.includes('bing')) return 'bing';
    if (host.includes('twitter') || host.includes('x.com')) return 'x';
    return host;
  } catch {
    return 'direto';
  }
}

function isBot(ua: string): boolean {
  return /bot|crawler|spider|preview|facebookexternalhit|whatsapp\/|slackbot|telegrambot|discordbot|headless|lighthouse/i.test(
    ua,
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);

  const product = await repo.productBySlug(slug);

  if (!product) {
    return NextResponse.redirect(new URL('/?erro=link-invalido', url.origin));
  }

  if (product.status === 'rascunho') {
    return NextResponse.redirect(new URL('/?erro=link-inativo', url.origin));
  }

  const ua = request.headers.get('user-agent') ?? '';
  // Não conta bots nem o próprio autor testando (opt-out via ?preview=1)
  if (!isBot(ua) && !url.searchParams.has('preview')) {
    try {
      await repo.addClick({
        product_id: product.id,
        slug: product.slug,
        ts: new Date().toISOString(),
        device: detectDevice(ua),
        referrer: request.headers.get('referer') ?? undefined,
        source: detectSource(url, request.headers.get('referer')),
      });
    } catch (error) {
      // Nunca bloqueia o redirecionamento por causa de métrica
      console.error('[track] falha ao registrar clique:', error);
    }
  }

  return NextResponse.redirect(product.affiliate_url, 302);
}
