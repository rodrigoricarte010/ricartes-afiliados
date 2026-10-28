'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { brl, num, pct } from '@/lib/format';
import { PLATFORM_COLOR, PLATFORM_LABEL, type Platform, type ProductStatus } from '@/lib/types';
import { ProductRowActions } from './ProductRowActions';

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  platform: Platform;
  category: string;
  status: ProductStatus;
  price: number;
  clicks: number;
  cvr: number;
  commission: number;
}

type SortKey = 'recentes' | 'cliques' | 'comissao' | 'nome';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recentes', label: 'Recentes' },
  { key: 'cliques', label: 'Mais cliques' },
  { key: 'comissao', label: 'Mais comissão' },
  { key: 'nome', label: 'A–Z' },
];

/**
 * Catálogo com busca, filtros e ordenação no navegador.
 * Os dados chegam prontos do servidor — filtrar aqui evita ida ao banco
 * a cada tecla digitada.
 */
export function ProductTable({ rows, appUrl }: { rows: ProductRow[]; appUrl: string }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<Platform | 'todas'>('todas');
  const [status, setStatus] = useState<ProductStatus | 'todos'>('todos');
  const [sort, setSort] = useState<SortKey>('recentes');

  const platforms = useMemo(() => {
    const present = new Set(rows.map((r) => r.platform));
    return (Object.keys(PLATFORM_LABEL) as Platform[]).filter((p) => present.has(p));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (platform !== 'todas' && row.platform !== platform) return false;
      if (status !== 'todos' && row.status !== status) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        PLATFORM_LABEL[row.platform].toLowerCase().includes(q)
      );
    });

    switch (sort) {
      case 'cliques':
        return [...list].sort((a, b) => b.clicks - a.clicks);
      case 'comissao':
        return [...list].sort((a, b) => b.commission - a.commission);
      case 'nome':
        return [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      default:
        return list;
    }
  }, [rows, query, platform, status, sort]);

  const hasFilters = query.trim().length > 0 || platform !== 'todas' || status !== 'todos';

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, categoria ou /r/…"
            aria-label="Buscar produtos"
            className="input pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {platforms.length > 1 && (
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform | 'todas')}
              aria-label="Filtrar por plataforma"
              className="input w-auto py-2 text-xs"
            >
              <option value="todas" className="bg-ink-900">
                Todas as plataformas
              </option>
              {platforms.map((p) => (
                <option key={p} value={p} className="bg-ink-900">
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
          )}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus | 'todos')}
            aria-label="Filtrar por status"
            className="input w-auto py-2 text-xs"
          >
            <option value="todos" className="bg-ink-900">
              Todos os status
            </option>
            <option value="ativo" className="bg-ink-900">
              Ativos
            </option>
            <option value="pausado" className="bg-ink-900">
              Pausados
            </option>
            <option value="rascunho" className="bg-ink-900">
              Rascunhos
            </option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Ordenar"
            className="input w-auto py-2 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} className="bg-ink-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/40">
          <span>
            {filtered.length} de {rows.length} produtos
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setPlatform('todas');
              setStatus('todos');
            }}
            className="text-brand-300 hover:text-brand-200"
          >
            limpar filtros
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-white/40">
          Nenhum produto encontrado com esses filtros.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="text-right">Preço</th>
                <th className="text-right">Cliques</th>
                <th className="text-right">CVR</th>
                <th className="text-right">Comissão</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} id={`product-${row.id}`}>
                  <td>
                    <Link href={`/admin/produtos/${row.id}`} className="group block">
                      <span className="flex items-center gap-2">
                        <span className="max-w-[200px] truncate text-[13px] font-medium text-white group-hover:text-brand-300 sm:max-w-[280px]">
                          {row.name}
                        </span>
                        {row.status !== 'ativo' && (
                          <span className="badge bg-white/[0.06] text-white/40 ring-white/10">{row.status}</span>
                        )}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`badge ${PLATFORM_COLOR[row.platform]}`}>{PLATFORM_LABEL[row.platform]}</span>
                        <span className="text-[11px] text-white/35">{row.category}</span>
                        <span className="text-[11px] text-white/25">· /r/{row.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-right text-white/70">{brl(row.price)}</td>
                  <td className="text-right text-white/70">{num(row.clicks)}</td>
                  <td className="text-right text-white/70">{pct(row.cvr)}</td>
                  <td className="whitespace-nowrap text-right font-semibold text-lime-300">{brl(row.commission)}</td>
                  <td className="w-[1%] whitespace-nowrap text-right">
                    <ProductRowActions id={row.id} status={row.status} appUrl={appUrl} slug={row.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
