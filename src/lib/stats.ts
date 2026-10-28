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

interface ProductAgg {
  clicks: number;
  clicks7d: number;
  conversions: number;
  approved: number;
  pending: number;
  revenue: number;
  commission: number;
}

/**
 * Agrega cliques/conversões por produto em uma única passada.
 * A versão anterior filtrava o array inteiro para cada produto (O(P×C)), o que
 * ficava lento assim que o histórico de cliques cresce.
 */
export function productStats(db: Database): ProductStats[] {
  const now = Date.now();
  const now7 = now - 7 * 86400000;
  const empty = (): ProductAgg => ({
    clicks: 0,
    clicks7d: 0,
    conversions: 0,
    approved: 0,
    pending: 0,
    revenue: 0,
    commission: 0,
  });

  const agg = new Map<string, ProductAgg>();

  for (const click of db.clicks) {
    const entry = agg.get(click.product_id) ?? empty();
    entry.clicks += 1;
    const t = new Date(click.ts).getTime();
    if (t >= now7 && t <= now) entry.clicks7d += 1;
    agg.set(click.product_id, entry);
  }

  for (const conv of db.conversions) {
    const entry = agg.get(conv.product_id) ?? empty();
    entry.conversions += 1;
    if (conv.status === 'aprovada') {
      entry.approved += 1;
      entry.revenue += conv.amount;
      entry.commission += conv.commission;
    } else if (conv.status === 'pendente') {
      entry.pending += 1;
    }
    agg.set(conv.product_id, entry);
  }

  return db.products
    .map((product) => {
      const a = agg.get(product.id) ?? empty();
      return {
        product,
        clicks: a.clicks,
        clicks7d: a.clicks7d,
        conversions: a.conversions,
        approved: a.approved,
        pending: a.pending,
        revenue: a.revenue,
        commission: a.commission,
        cvr: a.clicks ? (a.conversions / a.clicks) * 100 : 0,
        epc: a.clicks ? a.commission / a.clicks : 0,
      };
    })
    .sort((a, b) => b.commission - a.commission);
}

export function dashboardStats(db: Database, days = 30): DashboardStats {
  const stats = productStats(db);
  const productName = new Map(db.products.map((p) => [p.id, p.name]));

  const approved = db.conversions.filter((c) => c.status === 'aprovada');
  const pending = db.conversions.filter((c) => c.status === 'pendente');

  // Janelas de 7 e 14 dias calculadas uma vez só (evita duas varreduras).
  const nowTs = Date.now();
  let clicks7d = 0;
  let clicksPrev7d = 0;
  for (const c of db.clicks) {
    const t = new Date(c.ts).getTime();
    if (Number.isNaN(t)) continue;
    const age = nowTs - t;
    if (age >= 0 && age <= 7 * 86400000) clicks7d += 1;
    else if (age > 7 * 86400000 && age <= 14 * 86400000) clicksPrev7d += 1;
  }

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

  // Atribuição por "último clique antes da venda" (mesma regra das plataformas),
  // com os cliques agrupados por produto e ordenados — antes era um `find`
  // dentro do laço de vendas (O(C×V)).
  const clicksByProduct = new Map<string, ClickEvent[]>();
  for (const click of db.clicks) {
    const list = clicksByProduct.get(click.product_id);
    if (list) list.push(click);
    else clicksByProduct.set(click.product_id, [click]);
  }
  for (const list of clicksByProduct.values()) {
    list.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }

  for (const conv of approved) {
    const list = clicksByProduct.get(conv.product_id) ?? [];
    const when = new Date(conv.created_at).getTime();
    let match: ClickEvent | undefined;
    // Busca binária no maior clique <= data da venda.
    let lo = 0;
    let hi = list.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const t = new Date(list[mid]!.ts).getTime();
      if (t <= when) {
        match = list[mid];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const entry = bump(match?.source || 'direto');
    entry.conversions += 1;
    entry.commission += conv.commission;
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

// ---------------------------------------------------------------------------
// Mês corrente e meta
// ---------------------------------------------------------------------------

export interface MonthStats {
  /** "2026-10" */
  key: string;
  /** "outubro de 2026" */
  label: string;
  /** "outubro" */
  shortLabel: string;
  monthName: string;
  year: number;
  /** Comissões aprovadas no mês. */
  commission: number;
  /** Pedidos pagos de infoprodutos no mês. */
  ordersRevenue: number;
  /** comissão + infoprodutos */
  total: number;
  clicks: number;
  conversions: number;
  ordersPaid: number;
  prevLabel: string;
  prevTotal: number;
  prevCommission: number;
  prevOrdersRevenue: number;
  /** Dia do mês (1–31) no fuso do painel. */
  day: number;
  daysInMonth: number;
}

function monthName(year: number, month: number): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 15)),
  );
}

/** Soma comissões aprovadas, pedidos pagos e cliques de um mês (YYYY-MM). */
export function monthStats(db: Database, reference: Date = new Date()): MonthStats {
  const today = dayKey(reference) || dayKey(new Date());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const key = `${year}-${String(month).padStart(2, '0')}`;

  const prevDate = new Date(Date.UTC(year, month - 2, 15));
  const prevKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

  const inMonth = (iso: string, prefix: string) => dayKey(iso).startsWith(prefix);

  let commission = 0;
  let conversions = 0;
  let prevCommission = 0;
  for (const c of db.conversions) {
    if (c.status !== 'aprovada') continue;
    if (inMonth(c.created_at, key)) {
      commission += c.commission;
      conversions += 1;
    } else if (inMonth(c.created_at, prevKey)) {
      prevCommission += c.commission;
    }
  }

  let ordersRevenue = 0;
  let ordersPaid = 0;
  let prevOrdersRevenue = 0;
  for (const o of db.orders) {
    if (o.status !== 'pago') continue;
    if (inMonth(o.created_at, key)) {
      ordersRevenue += o.amount;
      ordersPaid += 1;
    } else if (inMonth(o.created_at, prevKey)) {
      prevOrdersRevenue += o.amount;
    }
  }

  const clicks = db.clicks.filter((c) => inMonth(c.ts, key)).length;

  return {
    key,
    year,
    monthName: monthName(year, month),
    label: `${monthName(year, month)} de ${year}`,
    shortLabel: monthName(year, month),
    commission,
    ordersRevenue,
    total: commission + ordersRevenue,
    clicks,
    conversions,
    ordersPaid,
    prevLabel: `${monthName(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1)} de ${prevDate.getUTCFullYear()}`,
    prevTotal: prevCommission + prevOrdersRevenue,
    prevCommission,
    prevOrdersRevenue,
    day,
    daysInMonth,
  };
}

export interface GoalProgress {
  /** Meta em R$ (0 = nenhuma meta definida). */
  goal: number;
  hasGoal: boolean;
  current: number;
  remaining: number;
  /** Percentual atingido (pode passar de 100). */
  progress: number;
  /** Projeção linear para o fim do mês, no ritmo atual. */
  projected: number;
  averagePerDay: number;
  /** Quanto precisa fazer por dia (considerando hoje) para bater a meta. */
  requiredPerDay: number;
  daysLeft: number;
  daysElapsed: number;
  onTrack: boolean;
  hit: boolean;
}

export function goalProgress(month: MonthStats, goal: number): GoalProgress {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0;
  const current = month.total;
  const daysElapsed = Math.max(1, month.day);
  const daysLeft = Math.max(1, month.daysInMonth - month.day + 1);
  const averagePerDay = current / daysElapsed;
  const projected = averagePerDay * month.daysInMonth;
  const remaining = Math.max(0, safeGoal - current);

  return {
    goal: safeGoal,
    hasGoal: safeGoal > 0,
    current,
    remaining,
    progress: safeGoal > 0 ? (current / safeGoal) * 100 : 0,
    projected,
    averagePerDay,
    requiredPerDay: safeGoal > 0 ? remaining / daysLeft : 0,
    daysLeft,
    daysElapsed,
    onTrack: safeGoal > 0 && projected >= safeGoal,
    hit: safeGoal > 0 && current >= safeGoal,
  };
}
