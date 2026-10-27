// Componentes visuais reutilizáveis (server-safe).

import Link from 'next/link';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-white/50">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  accent = 'neutral',
  icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  accent?: 'neutral' | 'brand' | 'lime' | 'sky';
  icon?: string;
  href?: string;
}) {
  const accents: Record<string, string> = {
    neutral: 'from-white/[0.06] to-transparent',
    brand: 'from-brand-500/20 to-transparent',
    lime: 'from-lime-500/15 to-transparent',
    sky: 'from-sky-500/15 to-transparent',
  };

  const body = (
    <div className={`card card-hover relative overflow-hidden p-4 sm:p-5 ${href ? 'cursor-pointer' : ''}`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accents[accent]}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">{label}</p>
          <p className="kpi-value mt-1.5">{value}</p>
          {(hint || typeof trend === 'number') && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
              {typeof trend === 'number' && (
                <span
                  className={`font-semibold ${
                    trend > 0 ? 'text-lime-400' : trend < 0 ? 'text-brand-400' : 'text-white/50'
                  }`}
                >
                  {trend > 0 ? '▲' : trend < 0 ? '▼' : '•'} {Math.abs(trend).toFixed(0)}%
                </span>
              )}
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-sm text-white/60">
            {icon}
          </span>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({
  icon = '✦',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-xl text-white/50">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-white/45">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
          <div>
            {title && <h2 className="font-display text-sm font-semibold tracking-tight text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'p-4 sm:p-5' : ''}>{children}</div>
    </section>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'success'; children: React.ReactNode }) {
  const tones = {
    info: 'border-sky-400/25 bg-sky-500/10 text-sky-100',
    warn: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
    success: 'border-lime-400/25 bg-lime-500/10 text-lime-100',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
