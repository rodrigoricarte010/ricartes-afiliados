import Link from 'next/link';
import { repo, dbDriver } from '@/lib/db';
import { appUrl } from '@/lib/url';
import { PageHeader, SectionCard, Alert } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { SettingsForm } from './SettingsForm';
import { resetDemoAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurações' };

const ENV_SNIPPET = `DB_DRIVER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
APP_PASSWORD=uma-senha-forte
AUTH_SECRET=um-segredo-aleatorio-bem-longo
NEXT_PUBLIC_APP_URL=https://seu-dominio.com`;

export default async function SettingsPage() {
  const db = await repo.snapshot();
  const base = await appUrl();
  const driver = dbDriver();

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Seus dados, programas de afiliado e a conexão com o banco de dados."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="Perfil e programas">
          <SettingsForm settings={db.settings} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Banco de dados">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
              <span className="text-xs text-white/45">Driver ativo</span>
              <span
                className={`badge ${
                  driver === 'supabase'
                    ? 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
                    : 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
                }`}
              >
                {driver === 'supabase' ? 'Supabase (nuvem)' : 'Arquivo local'}
              </span>
            </div>

            {driver === 'file' ? (
              <Alert tone="warn">
                <p className="font-semibold">Modo demonstração</p>
                <p className="mt-1 text-xs leading-snug text-amber-100/70">
                  Os dados ficam em <code className="rounded bg-black/30 px-1">.data/db.json</code> na máquina. Na
                  Vercel o armazenamento local é temporário — configure o Supabase abaixo para persistir de verdade.
                </p>
              </Alert>
            ) : (
              <Alert tone="success">
                <p className="text-xs">Conectado ao Supabase. Todos os dados são gravados no Postgres.</p>
              </Alert>
            )}

            <div className="mt-4 space-y-2 text-[11.5px] leading-relaxed text-white/45">
              <p className="font-semibold text-white/70">Como conectar o Supabase</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  Crie um projeto em{' '}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-300 hover:underline">
                    supabase.com/dashboard
                  </a>
                </li>
                <li>
                  Rode o SQL de <code className="rounded bg-white/10 px-1">supabase/schema.sql</code> no SQL Editor (cria
                  as tabelas).
                </li>
                <li>Copie a URL e a service role key em Project Settings → API.</li>
                <li>Adicione as variáveis abaixo na Vercel (ou no .env local).</li>
              </ol>
            </div>

            <div className="mt-3 rounded-xl border border-white/[0.07] bg-ink-950/70 p-3">
              <pre className="overflow-x-auto whitespace-pre text-[10.5px] leading-relaxed text-white/60">{ENV_SNIPPET}</pre>
              <CopyButton value={ENV_SNIPPET} label="Copiar variáveis" compact className="mt-2" />
            </div>

            <Alert tone="warn">
              <p className="text-[11px] leading-snug">
                A <code className="rounded bg-black/30 px-1">SUPABASE_SERVICE_ROLE_KEY</code> só é usada no servidor.
                Nunca a exponha no navegador nem com prefixo <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_</code>.
              </p>
            </Alert>
          </SectionCard>

          <SectionCard title="Seus endereços">
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/45">Painel</span>
                <code className="truncate text-brand-200">{base}/admin</code>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-white/45">Página pública</span>
                <code className="truncate text-brand-200">{base}</code>
              </li>
              {db.infoproducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-white/45">{p.name}</span>
                  <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-brand-200 hover:underline">
                    /p/{p.slug} ↗
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Dados de demonstração">
            <p className="mb-3 text-[11px] leading-snug text-white/40">
              Recria os produtos, cliques e vendas de exemplo. Tudo que você cadastrou será apagado.
            </p>
            <form
              action={resetDemoAction}
              onSubmit={undefined}
            >
              <button
                type="submit"
                className="btn w-full border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
              >
                ↺ Restaurar demonstração
              </button>
            </form>
            <p className="mt-3 text-[10px] text-white/25">
              Dica: para começar do zero, apague produto por produto na página de produtos (mantém a configuração).
            </p>
          </SectionCard>

          <SectionCard title="Ajuda rápida">
            <ul className="space-y-2 text-[11.5px] leading-snug text-white/45">
              <li>
                <Link href="/admin/produtos" className="text-white/70 hover:underline">
                  Produtos afiliados
                </Link>{' '}
                — cadastre links da Shopee, TikTok Shop, Mercado Livre ou Amazon.
              </li>
              <li>
                <Link href="/admin/conteudo" className="text-white/70 hover:underline">
                  Estúdio de conteúdo
                </Link>{' '}
                — gere roteiros de 30s para divulgar cada produto.
              </li>
              <li>
                <Link href="/admin/infoprodutos" className="text-white/70 hover:underline">
                  Infoprodutos
                </Link>{' '}
                — publique páginas de vendas com checkout.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
