import Link from 'next/link';
import { PageHeader, SectionCard } from '@/components/ui';
import { ImportForm } from './ImportForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Importar produtos' };

const PASSOS = [
  'Abra o painel da Shopee, TikTok Shop, Mercado Livre ou Amazon e copie os links de afiliado.',
  'Cole no campo abaixo, um por linha. Pode colar direto do Excel/Google Sheets.',
  'Confira a prévia e clique em importar. Cada produto já nasce com o link rastreável /r/.',
];

export default function ImportProductsPage() {
  return (
    <div>
      <PageHeader
        title="Importar produtos em massa"
        description="Cole vários links de afiliado de uma vez e cadastre o catálogo inteiro em segundos."
        action={
          <Link href="/admin/produtos" className="btn-ghost btn-sm sm:text-sm">
            ← Produtos
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Colar lista" subtitle="Uma linha por produto">
          <ImportForm />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Como funciona">
            <ol className="space-y-3">
              {PASSOS.map((passo, i) => (
                <li key={passo} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-200">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-white/55">{passo}</span>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title="O que é preenchido">
            <ul className="space-y-2 text-xs leading-relaxed text-white/55">
              <li>
                <strong className="text-white/80">Link</strong> — obrigatório, é o destino do clique.
              </li>
              <li>
                <strong className="text-white/80">Plataforma</strong> — detectada pelo domínio do link.
              </li>
              <li>
                <strong className="text-white/80">Nome</strong> — usado se você informar; senão é deduzido da URL
                (Mercado Livre e Amazon trazem o título).
              </li>
              <li>
                <strong className="text-white/80">Preço e comissão</strong> — os números da linha. Se faltar a
                comissão, entra a taxa típica da plataforma.
              </li>
              <li>
                <strong className="text-white/80">Categoria</strong> — quando for uma das categorias conhecidas.
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="Dica">
            <p className="text-xs leading-relaxed text-white/55">
              Depois de importar, ajuste preço e comissão com os valores reais do painel da plataforma: eles definem a
              comissão estimada que aparece no catálogo e nos relatórios.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
