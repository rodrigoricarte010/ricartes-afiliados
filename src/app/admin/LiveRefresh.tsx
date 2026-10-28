'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERVAL = 30_000;
const STORAGE_KEY = 'ricartes:auto-refresh';

/**
 * Botão "Atualizar" + atualização automática opcional (30s) do painel.
 *
 * O painel é renderizado no servidor (dados sempre frescos no primeiro acesso),
 * mas quando ele fica aberto numa aba enquanto você divulga links, os números
 * envelhecem. Aqui o RSC é revalidado sem recarregar a página inteira.
 */
export function LiveRefresh() {
  const router = useRouter();
  const [auto, setAuto] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const [, forceTick] = useState(0);
  const mountedAt = useRef(Date.now());

  // Preferência fica no navegador (o servidor não precisa saber disso).
  useEffect(() => {
    try {
      setAuto(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* navegador sem storage: segue desligado */
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setUpdatedAt(Date.now());
    // router.refresh() não avisa quando termina; 700ms é o suficiente na prática.
    window.setTimeout(() => setRefreshing(false), 700);
  }, [router]);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      // Não atualiza com a aba escondida (economiza requisições).
      if (document.visibilityState === 'visible') refresh();
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [auto, refresh]);

  // Recalcula o "há Xs" a cada 5s, mesmo sem atualização.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const toggle = () => {
    const next = !auto;
    setAuto(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignora */
    }
    if (next) refresh();
  };

  const seconds = Math.max(0, Math.round((Date.now() - Math.max(updatedAt, mountedAt.current)) / 1000));
  const label =
    seconds < 10 ? 'atualizado agora' : seconds < 60 ? `atualizado há ${seconds}s` : `atualizado há ${Math.round(seconds / 60)} min`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
      <span className={`inline-flex items-center gap-1.5 ${auto ? 'text-lime-300/90' : ''}`}>
        <span
          className={`h-1.5 w-1.5 rounded-full ${auto ? 'animate-pulse bg-lime-400' : 'bg-white/25'}`}
          aria-hidden
        />
        {refreshing ? 'buscando dados…' : label}
      </span>

      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        ↻ Atualizar
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={auto}
        title="Atualiza os números a cada 30 segundos enquanto o painel estiver aberto"
        className={`rounded-lg border px-2 py-1 font-semibold transition ${
          auto
            ? 'border-lime-400/25 bg-lime-500/10 text-lime-300 hover:bg-lime-500/15'
            : 'border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white/70'
        }`}
      >
        {auto ? '● ao vivo' : '○ ao vivo'}
      </button>
    </div>
  );
}
