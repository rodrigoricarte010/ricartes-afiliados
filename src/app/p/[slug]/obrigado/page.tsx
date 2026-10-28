import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repo } from '@/lib/db';
import { brl } from '@/lib/format';
import { CopyButton } from '@/components/CopyButton';
import { Logo } from '@/components/Sidebar';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pedido recebido' };

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { slug } = await params;
  const { pedido } = await searchParams;
  const db = await repo.snapshot();
  const product = db.infoproducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const order = db.orders.find((o) => o.id === pedido);
  const pixKey = product.pix_key || db.settings.pix_key;
  const whatsapp = product.whatsapp || db.settings.whatsapp;

  const pixMessage = order
    ? `Olá! Acabei de fazer o pedido de "${product.name}" (${brl(order.amount)}). Meu e-mail: ${order.customer_email}. Pedido ${order.id}`
    : `Olá! Quero comprar "${product.name}".`;

  return (
    <div className="relative min-h-dvh px-5 py-10">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="relative mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Logo size={26} />
          <span className="text-sm font-semibold text-white">{db.settings.display_name}</span>
        </div>

        <div className="card p-6 text-center sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lime-500/15 text-2xl">✅</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            {order ? 'Pedido reservado!' : 'Quase lá!'}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            {order ? (
              <>
                {order.customer_name.split(' ')[0]}, seu pedido de <b className="text-white/80">{product.name}</b> foi
                registrado. Falta só o pagamento para liberar o acesso.
              </>
            ) : (
              <>Não encontramos esse pedido, mas você pode falar comigo pelo WhatsApp abaixo.</>
            )}
          </p>

          {order && order.payment_method === 'pix' && (
            <div className="mt-6 rounded-xl border border-lime-500/25 bg-lime-500/[0.07] p-4 text-left">
              <p className="text-[10px] uppercase tracking-wider text-lime-300/70">Pague com Pix</p>
              <p className="mt-1 text-2xl font-bold text-white">{brl(order.amount)}</p>
              <p className="mt-1 text-[11px] text-white/40">
                Chave Pix ({product.pix_key ? 'do produto' : 'padrão'}):
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2">
                <code className="min-w-0 flex-1 truncate text-xs text-lime-200">{pixKey || 'configurar chave Pix'}</code>
                {pixKey && <CopyButton value={pixKey} label="Copiar" compact className="!px-2 !py-1" />}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-white/35">
                Envie o comprovante no WhatsApp com o número do pedido{' '}
                <code className="rounded bg-white/10 px-1 text-white/60">{order.id}</code>. O acesso é liberado em
                até 1 hora útil.
              </p>
            </div>
          )}

          {order && order.payment_method !== 'pix' && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Próximo passo</p>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Para pagar no cartão ou boleto, me chame no WhatsApp com o número do pedido{' '}
                <code className="rounded bg-white/10 px-1 text-white/70">{order.id}</code>. Envio o link de pagamento
                na hora.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(pixMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-buy w-full !py-3"
              >
                Enviar comprovante no WhatsApp
              </a>
            )}
            <Link href={`/p/${product.slug}`} className="btn-ghost w-full">
              Voltar para a página do produto
            </Link>
          </div>

          <p className="mt-5 text-[10px] leading-snug text-white/25">
            Guarde este link. Em caso de dúvida, escreva para {db.settings.support_email || 'o suporte'}.
          </p>
        </div>

        <p className="mt-6 text-center text-[10px] text-white/25">
          <Link href="/" className="hover:text-white/40">
            {BRAND.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
