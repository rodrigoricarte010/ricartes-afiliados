import Link from 'next/link';
import { PageHeader, SectionCard } from '@/components/ui';
import { InfoproductForm } from '../InfoproductForm';

export const metadata = { title: 'Novo infoproduto' };

export default function NewInfoproductPage() {
  return (
    <div>
      <PageHeader
        title="Novo infoproduto"
        description="Preencha o essencial e publique uma página de vendas completa. Você pode editar tudo depois."
        action={
          <Link href="/admin/infoprodutos" className="btn-ghost btn-sm sm:text-sm">
            ← Voltar
          </Link>
        }
      />
      <SectionCard>
        <InfoproductForm />
      </SectionCard>
    </div>
  );
}
