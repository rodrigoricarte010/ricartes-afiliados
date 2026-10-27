'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Visão geral', icon: '▤', exact: true },
  { href: '/admin/produtos', label: 'Produtos afiliados', icon: '◈' },
  { href: '/admin/links', label: 'Links & QR', icon: '⇄' },
  { href: '/admin/conteudo', label: 'Estúdio de conteúdo', icon: '▶' },
  { href: '/admin/vendas', label: 'Vendas & comissões', icon: '⛁' },
  { href: '/admin/infoprodutos', label: 'Meus infoprodutos', icon: '◆' },
  { href: '/admin/guia', label: 'Guia de afiliação', icon: '◉' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙' },
];

export function Sidebar({
  displayName,
  handle,
  logout,
}: {
  displayName: string;
  handle: string;
  logout: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? 'bg-brand-500/15 text-white ring-1 ring-inset ring-brand-500/30'
                : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-lg text-xs transition ${
                active
                  ? 'bg-brand-500 text-white shadow-[0_6px_18px_-8px_rgba(255,58,38,0.9)]'
                  : 'bg-white/[0.06] text-white/50 group-hover:text-white/80'
              }`}
              aria-hidden
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/[0.07] p-3">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-white/40">{handle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="btn-ghost btn-sm flex-1"
          title="Ver a página pública"
          onClick={() => setOpen(false)}
        >
          ↗ Site
        </Link>
        {logout}
      </div>
    </div>
  );

  return (
    <>
      {/* topo mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.07] bg-ink-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-sm font-bold">Ricartes</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost btn-sm"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          {open ? '✕' : '☰'} Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-[57px] z-30 bg-ink-950/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-full flex-col pt-3">
            {nav}
            {footer}
          </div>
        </div>
      )}

      {/* desktop */}
      <aside className="sticky top-0 hidden h-dvh w-[270px] shrink-0 flex-col border-r border-white/[0.07] bg-ink-950/60 backdrop-blur-xl lg:flex">
        <div className="px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold tracking-tight text-white">Ricartes</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Afiliados</p>
            </div>
          </Link>
        </div>
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Ferramentas</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link href="/admin/conteudo" className="badge bg-lime-500/15 text-lime-300 ring-lime-500/25">
                Gerar roteiro
              </Link>
              <Link href="/admin/links" className="badge bg-white/10 text-white/70 ring-white/15">
                Novo link
              </Link>
            </div>
          </div>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 shadow-[0_8px_24px_-10px_rgba(255,58,38,0.9)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 20V5.5C5 4.7 5.7 4 6.5 4h6a5 5 0 0 1 0 10h-3" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 14l7 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
