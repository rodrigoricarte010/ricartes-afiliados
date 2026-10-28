// Utilitários de formatação (pt-BR)

// ---------------------------------------------------------------------------
// Fuso horário
//
// Na Vercel o servidor roda em UTC, então qualquer data montada com
// `getHours()`/`getDate()` ficaria 3 horas adiantada em relação ao Brasil
// (e o dia "vira" às 21h de Brasília). Todo cálculo de data/hora do painel
// passa por aqui, sempre no fuso de São Paulo.
// ---------------------------------------------------------------------------

export const APP_TIME_ZONE = 'America/Sao_Paulo';

const appPartsFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
});

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

function appParts(date: Date): DateParts {
  const parts = appPartsFormatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24, // alguns ambientes devolvem "24" à meia-noite
  };
}

/** Hora cheia (0–23) no fuso do painel. */
export function hourInAppTz(iso: Date | string): number {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return 0;
  return appParts(d).hour;
}

export function brl(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);
}

export function num(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Number.isFinite(value) ? value : 0);
}

export function pct(value: number, digits = 1): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits })}%`;
}

export function dateShort(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: APP_TIME_ZONE });
}

export function dateFull(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  });
}

export function dateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  });
}

export function relativeTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return dateShort(iso);
}

/** "R$ 1.234,56" → 1234.56 ; "49,90" → 49.9 ; "" → 0 */
export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  if (!input) return 0;
  const cleaned = String(input)
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const { year, month, day } = appParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Lista dos últimos N dias (mais antigo primeiro), como chaves YYYY-MM-DD. */
export function lastNDays(n: number, from = new Date()): string[] {
  const out: string[] = [];
  const today = appParts(from);
  for (let i = n - 1; i >= 0; i--) {
    // Meio-dia UTC evita qualquer ambiguidade de fuso ao recuar os dias.
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day, 12));
    d.setUTCDate(d.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}
