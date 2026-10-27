import Link from 'next/link';
import { Logo } from '@/components/Sidebar';

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="relative max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size={38} />
        </div>
        <p className="font-display text-6xl font-extrabold text-white/10">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Página não encontrada</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          O link pode ter expirado, o produto foi pausado ou o endereço está incorreto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            Ir para a home
          </Link>
          <Link href="/admin" className="btn-ghost">
            Abrir painel
          </Link>
        </div>
      </div>
    </div>
  );
}
