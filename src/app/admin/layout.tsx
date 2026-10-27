import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { repo, dbDriver } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) {
    redirect('/login');
  }

  const settings = await repo.getSettings();
  const driver = dbDriver();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar
        displayName={settings.display_name}
        handle={settings.handle}
        logout={
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost btn-sm" title="Encerrar sessão">
              Sair
            </button>
          </form>
        }
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
          {driver === 'file' && (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/[0.07] px-4 py-2.5 text-xs text-amber-100/90">
              <span className="font-semibold">Modo demonstração</span>
              <span className="text-amber-100/60">
                Os dados estão em <code className="rounded bg-black/30 px-1">.data/db.json</code>. Conecte o Supabase
                para persistir na nuvem.
              </span>
              <a href="/admin/configuracoes" className="ml-auto font-semibold text-amber-200 underline-offset-2 hover:underline">
                Configurar →
              </a>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
