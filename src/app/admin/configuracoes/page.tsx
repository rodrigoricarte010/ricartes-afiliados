import Link from 'next/link';
import { repo, dbDriver } from '@/lib/db';
import { appUrl } from '@/lib/url';
import { PageHeader, SectionCard, Alert } from '@/components/ui';
import { CopyButton } from '@/components/CopyButton';
import { SettingsForm } from './SettingsForm';
import { BackupCard } from './BackupCard';
import { resetDemoAction } from '../actions';
import { ClearDataCard } from './ClearDataCard';
import { RestoreDemoButton } from './RestoreDemoButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurações' };

const ENV_SNIPPET = `# Opção A — qualquer Postgres (Neon, Railway, Supabase...)
DB_DRIVER=postgres
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require

# Opção B — Supabase via API
# DB_DRIVER=supabase
# NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

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
                  driver === 'file'
                    ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
                    : 'bg-lime-500/15 text-lime-300 ring-lime-500/25'
                }`}
              >
                {driver === 'supabase'
                  ? 'Supabase (nuvem)'
                  : driver === 'postgres'
                    ? 'Postgres (nuvem)'
                    : 'Arquivo local'}
              </span>
            </div>

            {driver === 'file' ? (
              <Alert tone="warn">
                <p className="font-semibold">Arquivo local</p>
                <p className="mt-1 text-xs leading-snug text-amber-100/70">
                  Os dados ficam em <code className="rounded bg-black/30 px-1">.data/db.json</code> na máquina. Na
                  Vercel o armazenamento local é temporário — configure um Postgres abaixo para persistir de verdade.
                </p>
              </Alert>
            ) : (
              <Alert tone="success">
                <p className="text-xs">
                  Conectado ao {driver === 'supabase' ? 'Supabase' : 'Postgres'}. Todos os dados são gravados no banco
                  na nuvem e sobrevivem a novos deploys.
                </p>
              </Alert>
            )}

            <div className="mt-4 space-y-2 text-[11.5px] leading-relaxed text-white/45">
              <p className="font-semibold text-white/70">Como conectar um banco na nuvem</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  <b className="text-white/80">Mais simples:</b> crie um Postgres grátis no{' '}
                  <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-brand-300 hover:underline">
                    neon.tech
                  </a>{' '}
                  e copie a connection string.
                </li>
                <li>
                  Preencha <code className="rounded bg-white/10 px-1">DATABASE_URL</code> e{' '}
                  <code className="rounded bg-white/10 px-1">DB_DRIVER=postgres</code>.
                </li>
                <li>
                  As tabelas são criadas automaticamente no primeiro acesso — não precisa rodar SQL nenhum.
                </li>
                <li>
                  Também funciona com Supabase (via API), Railway, Render e Postgres local. No Supabase via API, rode{' '}
                  <code className="rounded bg-white/10 px-1">supabase/schema.sql</code> antes.
                </li>
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

          <SectionCard title="Sua página de links (bio)" subtitle="O link que vai na bio do TikTok e do Instagram">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr?data=${encodeURIComponent(`${base}/${db.settings.handle.replace(/^@/, '')}`)}&size=160`}
                alt="QR Code da página de links"
                width={72}
                height={72}
                className="shrink-0 rounded-lg bg-white p-1"
              />
              <div className="min-w-0 flex-1">
                <code className="block truncate rounded-lg border border-white/10 bg-ink-900/70 px-2.5 py-2 text-[11px] text-brand-200">
                  {base}/{db.settings.handle.replace(/^@/, '')}
                </code>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <CopyButton value={`${base}/${db.settings.handle.replace(/^@/, '')}`} label="Copiar" compact />
                  <a
                    href={`/${db.settings.handle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-sm"
                  >
                    Abrir ↗
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-snug text-white/35">
              Mostra seu perfil, seus produtos ativos, os botões das redes e o destaque do infoproduto. Todo clique é
              contabilizado com a origem <code className="text-white/60">bio</code>.
            </p>
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

          <SectionCard title="Backup dos dados" subtitle="Salve ou restaure tudo em um arquivo JSON">
            <BackupCard />
            <p className="mt-3 text-[10px] leading-snug text-white/25">
              Recomendado enquanto o banco estiver no modo arquivo local: o disco da Vercel é temporário e o backup é a
              sua garantia.
            </p>
          </SectionCard>

          <SectionCard
            title={db.settings.is_demo ? 'Dados de demonstração · apagar' : 'Começar do zero'}
            subtitle={
              db.settings.is_demo
                ? 'O painel está com os exemplos da primeira execução'
                : 'O banco já está sem dados de exemplo'
            }
          >
            <ClearDataCard produtoCount={db.products.length} cliqueCount={db.clicks.length} />
          </SectionCard>

          <SectionCard title="Restaurar demonstração">
            <p className="mb-3 text-[11px] leading-snug text-white/40">
              Recria os produtos, cliques e vendas de exemplo (útil para testar antes de usar de verdade). Tudo que
              você cadastrou será apagado.
            </p>
            <form action={resetDemoAction}>
              <RestoreDemoButton />
            </form>
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
