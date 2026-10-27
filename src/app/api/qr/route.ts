import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');
  const size = Math.min(1024, Math.max(120, Number(url.searchParams.get('size') ?? 300)));
  const download = url.searchParams.get('download') === '1';

  if (!data || data.length > 900) {
    return NextResponse.json({ error: 'Parâmetro "data" inválido.' }, { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b0b13ff', light: '#ffffffff' },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
        ...(download ? { 'Content-Disposition': 'attachment; filename="qrcode.png"' } : {}),
      },
    });
  } catch (error) {
    console.error('[qr] erro:', error);
    return NextResponse.json({ error: 'Falha ao gerar QR Code.' }, { status: 500 });
  }
}
