'use client';

import { useCallback, useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const EVENT = 'ra-toast';

/** Dispara um toast de qualquer lugar (inclusive de handlers de formulário). */
export function toast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-3), { id, message: detail.message, type: detail.type ?? 'success' }]);
      window.setTimeout(() => remove(id), 3800);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [remove]);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl animate-in ${
              item.type === 'error'
                ? 'border-red-400/30 bg-red-950/80 text-red-100'
                : item.type === 'info'
                  ? 'border-sky-400/30 bg-sky-950/80 text-sky-100'
                  : 'border-lime-400/30 bg-[#12200a]/90 text-lime-100'
            }`}
          >
            <span className="mt-0.5 text-base leading-none">
              {item.type === 'error' ? '⚠️' : item.type === 'info' ? 'ℹ️' : '✅'}
            </span>
            <p className="flex-1 leading-snug">{item.message}</p>
            <button
              onClick={() => remove(item.id)}
              className="text-white/40 transition hover:text-white"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
