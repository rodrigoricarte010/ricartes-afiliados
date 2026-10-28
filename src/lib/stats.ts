// ---------------------------------------------------------------------------
// Cálculos de métricas a partir do snapshot do banco.
// ---------------------------------------------------------------------------

import type { ClickEvent, Conversion, Database, Product } from './types';
import { dayKey, hourInAppTz, lastNDays } from './format';

export interface ProductStats {
  product: Product;
  clicks: number;
  clicks7d: number;
  conversions: number;
  approved: number;
  pending: number;
  revenue: number;
  commission: number;
  cvr: number;
  epc: number;
}

export interface DayPoint {
  day: string;
  clicks: number;
  conversions: number;
  commission: number;
}

export interface SourceStats {
  source: string;
  clicks: number;
  conversions: number;
  commission: number;
  share: number;
}

export interface DashboardStats {
  clicks: number;
  clicks7d: number;
  clicksPrev7d: number;
  conversions: number;
  revenue: number;
  commissionApproved: number;
  commissionPending: number;
  cvr: number;
  epc: number;
  ticket: number;
  series: DayPoint[];
  bySource: SourceStats[];
  byDevice: { device: string; clicks: number; share: number }[];
  topProducts: ProductStats[];
  hourly: { hour: number; clicks: number }[];
  recentClicks: (ClickEvent & { productName?: string })[];
  recentConversions: (Conversion & { productName?: string })[];
  ordersPaid: number;
  ordersRevenue: number;
  monthlyRecurring: number;
}

import type { Order } from './types';

function withinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const diff = Date.now() - t;
  // Ignora datas no futuro (relógio errado, importação): métrica honesta.
  return diff >= 0 && diff <= days * 86400000;
}

export function productStats(db: Database): ProductStats[] {
  const now = Date.now();
  const now7 = now - 7 * 86400000;
  return db.products
    .map((product) => {
      const clicks = db.clicks.filter((c) => c.product_id === product.id);
      const clicks7d = clicks.filter((c) => {
        const t = new Date(c.ts).getTime();
        return t >= now7 && t <= now;
      }).length;
      const convs = db.conversions.filter((c) => c.product_id === product.id);
      const approved = convs.filter((c) => c.status === 'aprovada');
      const pending = convs.filter((c) => c.status === 'pendente');
      const commission = approved.reduce((a, c) => a + c.commission, 0);
      const revenue = approved.reduce((a, c) => a + c.amount, 0);
      return {
        product,
        clicks: clicks.length,
        clicks7d,
        conversions: convs.length,
        approved: approved.length,
        pending: pending.length,
        revenue,
        commission,
        cvr: clicks.length ? (convs.length / clicks.length) * 100 : 0,
        epc: clicks.length ? commission / clicks.length : 0,
      };
    })
    .sort((a, b) => b.commission - a.commission);
}

export function dashboardStats(db: Database, days = 30): DashboardStats {
  const stats = productStats(db);
  const productName = new Map(db.products.map((p) => [p.id, p.name]));

  const approved = db.conversions.filter((c) => c.status === 'aprovada');
  const pending = db.conversions.filter((c) => c.status === 'pendente');

  const clicks7d = db.clicks.filter((c) => withinDays(c.ts, 7)).length;
  const clicksPrev7d = db.clicks.filter((c) => {
    const t = new Date(c.ts).getTime();
    return t < Date.now() - 7 * 86400000 && t >= Date.now() - 14 * 86400000;
  }).length;

  const commissionApproved = approved.reduce((a, c) => a + c.commission, 0);
  const commissionPending = pending.reduce((a, c) => a + c.commission, 0);
  const revenue = approved.reduce((a, c) => a + c.amount, 0);

  // série diária
  const keys = lastNDays(days);
  const series: DayPoint[] = keys.map((day) => ({ day, clicks: 0, conversions: 0, commission: 0 }));
  const byKey = new Map(series.map((p) => [p.day, p]));
  const windowStart = new Date(keys[0] + 'T00:00:00').getTime();

  for (const c of db.clicks) {
    const t = new Date(c.ts).getTime();
    if (t < windowStart) continue;
    const point = byKey.get(dayKey(c.ts));
    if (point) point.clicks += 1;
  }
  for (const c of approved) {
    const t = new Date(c.created_at).getTime();
    if (t < windowStart) continue;
    const point = byKey.get(dayKey(c.created_at));
    if (point) {
      point.conversions += 1;
      point.commission += c.commission;
    }
  }

  // origens
  const sourceMap = new Map<string, { clicks: number; conversions: number; commission: number }>();
  const bump = (source: string) => {
    const entry = sourceMap.get(source) ?? { clicks: 0, conversions: 0, commission: 0 };
    sourceMap.set(source, entry);
    return entry;
  };
  for (const c of db.clicks) bump(c.source || 'direto').clicks += 1;
  for (const c of approved) {
    const click = db.clicks.find((k) => k.product_id === c.product_id && k.ts <= c.created_at);
    const source = click?.source || 'direto';
    const entry = bump(source);
    entry.conversions += 1;
    entry.commission += c.commission;
  }
  const totalClicks = db.clicks.length || 1;
  const bySource: SourceStats[] = [...sourceMap.entries()]
    .map(([source, v]) => ({
      source,
      clicks: v.clicks,
      conversions: v.conversions,
      commission: v.commission,
      share: (v.clicks / totalClicks) * 100,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  // dispositivos
  const deviceMap = new Map<string, number>();
  for (const c of db.clicks) deviceMap.set(c.device, (deviceMap.get(c.device) ?? 0) + 1);
  const byDevice = [...deviceMap.entries()]
    .map(([device, clicks]) => ({ device, clicks, share: (clicks / totalClicks) * 100 }))
    .sort((a, b) => b.clicks - a.clicks);

  // horários
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, clicks: 0 }));
  const nowTs = Date.now();
  for (const c of db.clicks) {
    const t = new Date(c.ts).getTime();
    if (Number.isNaN(t) || t > nowTs) continue; // ignora eventos no futuro
    const slot = hourly[hourInAppTz(c.ts)];
    if (slot) slot.clicks += 1;
  }

  const recentClicks = db.clicks
    .filter((c) => new Date(c.ts).getTime() <= nowTs)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 8)
    .map((c) => ({ ...c, productName: productName.get(c.product_id) }));

  const recentConversions = [...db.conversions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map((c) => ({ ...c, productName: productName.get(c.product_id) }));

  const ordersPaid = db.orders.filter((o: Order) => o.status === 'pago');

  return {
    clicks: db.clicks.length,
    clicks7d,
    clicksPrev7d,
    conversions: db.conversions.length,
    revenue,
    commissionApproved,
    commissionPending,
    cvr: db.clicks.length ? (db.conversions.length / db.clicks.length) * 100 : 0,
    epc: db.clicks.length ? commissionApproved / db.clicks.length : 0,
    ticket: approved.length ? revenue / approved.length : 0,
    series,
    bySource,
    byDevice,
    topProducts: stats.slice(0, 5),
    hourly,
    recentClicks,
    recentConversions,
    ordersPaid: ordersPaid.length,
    ordersRevenue: ordersPaid.reduce((a, o) => a + o.amount, 0),
    monthlyRecurring: 0,
  };
}
