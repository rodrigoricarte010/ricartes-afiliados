// ---------------------------------------------------------------------------
// Gráficos em SVG puro (sem dependências, renderizados no servidor).
// ---------------------------------------------------------------------------

import { brl, num } from '@/lib/format';

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  showAxis?: boolean;
}

export function AreaChart({
  data,
  height = 180,
  color = '#ff3a26',
  formatValue = num,
  showAxis = true,
}: AreaChartProps) {
  const width = 720;
  const padY = 14;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - padY - (d.value / max) * (height - padY * 2);
    return { x, y, ...d };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={width}
            y1={height * f}
            y2={height * f}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 6"
          />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1]!.x}
            cy={points[points.length - 1]!.y}
            r="4"
            fill={color}
            stroke="#07070c"
            strokeWidth="2"
          />
        )}
      </svg>
      {showAxis && (
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/35">
          <span>{data[0]?.label}</span>
          <span className="text-white/45">máx {formatValue(max)}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}

interface BarsProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  prefix?: string;
}

export function BarsChart({ data, height = 90, color = '#9ee22b', prefix = '' }: BarsProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => {
        const h = Math.max(2, (d.value / max) * height);
        return (
          <div key={d.label} className="group relative flex-1">
            <div
              className="w-full rounded-t-[3px] transition-all duration-300"
              style={{
                height: h,
                background: d.value === max ? color : `${color}66`,
              }}
            />
            <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-800 px-2 py-1 text-[10px] text-white ring-1 ring-white/10 group-hover:block">
              {d.label}h · {prefix}
              {d.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DonutProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function Donut({ data, size = 140, thickness = 16, centerLabel, centerValue }: DonutProps) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={thickness} />
        {data.map((d) => {
          const length = (d.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += length;
          return el;
        })}
      </svg>
      <div className="min-w-[120px] space-y-1.5">
        {centerValue && (
          <div className="mb-2">
            <div className="font-display text-xl font-bold text-white">{centerValue}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/40">{centerLabel}</div>
          </div>
        )}
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 capitalize text-white/60">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold text-white/80">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  color = '#ff3a26',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const width = Math.max(2, (value / (max || 1)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

export function MoneySpark({ data }: { data: { label: string; value: number }[] }) {
  return <AreaChart data={data} height={120} color="#9ee22b" formatValue={(v) => brl(v, { compact: true })} showAxis={false} />;
}
