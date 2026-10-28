import { NextResponse } from 'next/server';
import { repo } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { APP_TIME_ZONE, dateTime } from '@/lib/format';
import { PLATFORM_LABEL, type Device } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Exportação em CSV para abrir no Excel / Google Sheets do Brasil.
 *
 * - separador `;` e vírgula decimal (o Excel pt-BR espera exatamente isso)
 * - BOM UTF-8 para os acentos não quebrarem
 * - datas já convertidas para o fuso de São Paulo
 */

type Cell = string | number;

const DEVICE_LABEL: Record<Device, string> = {
  mobile: 'celular',
  desktop: 'computador',
  tablet: 'tablet',
  outro: 'outro',
};

function cell(value: Cell | undefined | null): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  // Sempre entre aspas: protege `;`, quebras de linha e aspas no conteúdo.
  return `"${text.replace(/"/g, '""')}"`;
}

/** 1234.5 → "1.234,50" (número puro, sem R$, para o Excel somar). */
function numberBR(value: number): string {
  const fixed = (Number.isFinite(value) ? value : 0).toFixed(2);
  const [int, dec] = fixed.split('.');
  const withDots = int!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots},${dec}`;
}

function csv(headers: string[], rows: Cell[][]): string {
  const lines = [headers.map(cell).join(';'), ...rows.map((row) => row.map(cell).join(';'))];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function stamp(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}-${get('hour')}${get('minute')}`;
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const tipo = new URL(request.url).searchParams.get('tipo') ?? 'vendas';
  const db = await repo.snapshot();
  const productName = new Map(db.products.map((p) => [p.id, p.name]));
  const platform = new Map(db.products.map((p) => [p.id, PLATFORM_LABEL[p.platform]]));
  const infoproductName = new Map(db.infoproducts.map((p) => [p.id, p.name]));

  let body: string;
  let name: string;

  switch (tipo) {
    case 'cliques':
      body = csv(
        ['Data', 'Produto', 'Plataforma', 'Origem', 'Dispositivo', 'Link'],
        [...db.clicks]
          .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
          .map((c) => [
            dateTime(c.ts),
            productName.get(c.product_id) ?? 'Produto removido',
            platform.get(c.product_id) ?? '',
            c.source || 'direto',
            DEVICE_LABEL[c.device] ?? c.device,
            `/r/${c.slug}`,
          ]),
      );
      name = 'cliques';
      break;

    case 'pedidos':
      body = csv(
        ['Data', 'Cliente', 'E-mail', 'Infoproduto', 'Valor', 'Pagamento', 'Status', 'Origem'],
        [...db.orders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((o) => [
            dateTime(o.created_at),
            o.customer_name,
            o.customer_email,
            infoproductName.get(o.infoproduct_id) ?? '—',
            numberBR(o.amount),
            o.payment_method,
            o.status,
            o.utm_source || 'direto',
          ]),
      );
      name = 'pedidos';
      break;

    case 'produtos':
      body = csv(
        ['Produto', 'Plataforma', 'Categoria', 'Preço', 'Comissão %', 'Comissão por venda', 'Status', 'Link rastreável', 'Link de afiliado', 'Cadastrado em'],
        db.products.map((p) => [
          p.name,
          PLATFORM_LABEL[p.platform],
          p.category,
          numberBR(p.price),
          numberBR(p.commission_pct),
          numberBR((p.price * p.commission_pct) / 100),
          p.status,
          `/r/${p.slug}`,
          p.affiliate_url,
          dateTime(p.created_at),
        ]),
      );
      name = 'produtos';
      break;

    default:
      body = csv(
        ['Data', 'Produto', 'Plataforma', 'Valor da venda', 'Comissão', 'Status'],
        [...db.conversions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((c) => [
            dateTime(c.created_at),
            productName.get(c.product_id) ?? 'Produto removido',
            platform.get(c.product_id) ?? '',
            numberBR(c.amount),
            numberBR(c.commission),
            c.status,
          ]),
      );
      name = 'vendas';
      break;
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ricartes-${name}-${stamp()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
