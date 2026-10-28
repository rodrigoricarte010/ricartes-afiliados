import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { LoginForm } from './LoginForm';
import { Logo } from '@/components/Sidebar';
import { BRAND } from '@/lib/brand';

export const metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAuthenticated()) redirect('/admin');

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={46} />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">{BRAND.name}</h1>
          <p className="mt-1 text-sm text-white/45">{BRAND.tagline}</p>
        </div>

        <LoginForm />

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-[11px] text-white/30">
            <span className="badge badge-live">● sistema online</span>
            <span className="badge bg-white/[0.06] text-white/45 ring-white/10">dados de demonstração</span>
          </div>
          <p className="text-center text-xs leading-relaxed text-white/30">
            Senha padrão: <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">ricartes</code>
            <br />
            Troque em <code className="text-white/50">APP_PASSWORD</code> no arquivo <code className="text-white/50">.env</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
