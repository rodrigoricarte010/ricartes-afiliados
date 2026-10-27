import Link from 'next/link';
import { PageHeader, SectionCard, Alert } from '@/components/ui';

export const metadata = { title: 'Guia de afiliação' };

interface Program {
  id: string;
  name: string;
  emoji: string;
  url: string;
  urlLabel: string;
  commission: string;
  payout: string;
  cookie: string;
  requirements: string[];
  steps: string[];
  tip: string;
  color: string;
}

const PROGRAMS: Program[] = [
  {
    id: 'shopee',
    name: 'Shopee Afiliados',
    emoji: '🛍️',
    url: 'https://affiliate.shopee.com.br',
    urlLabel: 'affiliate.shopee.com.br',
    commission: '3% base + até 30% extra em produtos/campanhas parceiras',
    payout: 'PF até dia 10 na ShopeePay · PJ até dia 30 em conta bancária',
    cookie: 'Atribuição de 7 dias · vale o último clique',
    requirements: [
      '18 anos ou mais',
      'Conta ativa na Shopee (pode ser a sua conta de comprador)',
      'CPF ou CNPJ regularizado',
      'Conta digital da Shopee (ShopeePay/Maree) ativa para PF',
      'PIS/NIS/NIT/PASEP para retenção de impostos',
      'Pelo menos um canal público: Instagram, TikTok, YouTube, WhatsApp, Telegram ou blog',
    ],
    steps: [
      'Acesse affiliate.shopee.com.br (ou app Shopee → Eu → Programa de Afiliados).',
      'Entre com sua conta Shopee — não precisa criar outra.',
      'Preencha dados pessoais e o canal onde vai divulgar.',
      'Confirme o código enviado por e-mail e envie a solicitação.',
      'Aguarde a aprovação (normalmente de 1 a 5 dias úteis).',
      'Aprovado: abra um produto, veja a comissão e clique em "Gerar link".',
      'Cole esse link aqui no painel em Produtos afiliados.',
    ],
    tip: 'A comissão é calculada sobre o valor líquido (sem frete, cupons e impostos). O mínimo para saque costuma ser R$ 30 — confira a regra vigente no painel.',
    color: 'from-orange-500/20 to-transparent',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop (afiliado/criador)',
    emoji: '🎵',
    url: 'https://seller-br.tiktok.com',
    urlLabel: 'TikTok Studio → TikTok Shop para criadores',
    commission: '8% a 15% em média (definida por cada vendedor)',
    payout: 'Pagamento às quartas-feiras, após a liquidação do pedido',
    cookie: 'Janela de atribuição de 14 dias · links válidos por até 100 dias',
    requirements: [
      '18 anos ou mais',
      'Conta TikTok ativa e em conformidade com as diretrizes',
      '1.000 seguidores para solicitar o cadastro de criador afiliado',
      'Verificação de identidade (PKYC) com CPF e documento',
      'Conta de recebimento no seu nome',
    ],
    steps: [
      'Abra o app: Perfil → menu (☰) → TikTok Studio.',
      'Procure "TikTok Shop para criadores" e confira a checklist de requisitos.',
      'Envie a solicitação e conclua a verificação de identidade (PKYC).',
      'Aprovado: escolha produtos no marketplace do TikTok Shop.',
      'Gere o link de afiliado ou adicione o produto à vitrine (carrinho amarelo).',
      'Cadastre o produto aqui no painel e use seu link /r/ no vídeo.',
    ],
    tip: 'Com menos de 1.000 seguidores, o Linkshare pode liberar comissão em algumas contas. Entre 1.000 e 2.000 seguidores você entra no programa piloto: até 10 vídeos com produto por dia até completar 30 dias de integração e 2.000 seguidores.',
    color: 'from-cyan-500/20 to-transparent',
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre Afiliados',
    emoji: '🤝',
    url: 'https://afiliados.mercadolivre.com.br',
    urlLabel: 'afiliados.mercadolivre.com.br',
    commission: 'de 0% a 16% conforme a categoria (beleza 16%, moda 14%, eletrônicos 9,5%)',
    payout: 'Conta Mercado Pago, a partir de R$ 30 acumulados',
    cookie: 'Atribuição de 24 horas após o clique',
    requirements: [
      '18 anos ou mais',
      'Conta ativa no Mercado Livre com dados corretos',
      'Conta no Mercado Pago (pode abrir em até 30 dias após o aceite)',
      'CPF ou CNPJ regularizado',
      'Perfil público ativo em rede social, site ou blog aprovado',
      'Não ser vendedor do Mercado Livre',
    ],
    steps: [
      'Acesse a página Afiliados e Criadores e clique em "Quero participar".',
      'Faça login com sua conta Mercado Livre.',
      'Informe as mídias onde vai divulgar (com links reais).',
      'Aceite os termos e aguarde a análise do perfil.',
      'Aprovado: gere os links no painel (formato meli.la ou matt_tool).',
      'Cadastre o produto aqui com preço e comissão da categoria.',
    ],
    tip: 'O pagamento exige vendas para pelo menos 3 pessoas diferentes. Categorias de beleza, moda e fitness pagam as melhores comissões.',
    color: 'from-yellow-500/20 to-transparent',
  },
  {
    id: 'amazon',
    name: 'Amazon Associados',
    emoji: '📦',
    url: 'https://associados.amazon.com.br',
    urlLabel: 'associados.amazon.com.br',
    commission: '13% bebê/beleza/saúde · 11% moda/pet · 10% livros · 8% casa e eletrônicos',
    payout: 'Depósito em conta ou vale-presente Amazon',
    cookie: 'Atribuição de 24 horas · comissão na unidade vendida',
    requirements: [
      '18 anos ou mais',
      'CPF válido (não precisa de CNPJ)',
      'Conta na Amazon Brasil',
      'Site, canal ou rede social com conteúdo próprio',
      'Aprovação do canal pelo programa',
    ],
    steps: [
      'Cadastre-se em associados.amazon.com.br com sua conta Amazon.',
      'Informe o site/canal que você usa para divulgar.',
      'Aguarde a aprovação do canal.',
      'Gere os links no painel (formato amzn.to ou com tag de associado).',
      'Faça as 3 primeiras vendas em até 180 dias para manter a conta ativa.',
    ],
    tip: 'A Amazon exige avisar que você ganha comissão (transparência). Eletrônicos pagam pouco — moda, beleza e casa valem mais a pena.',
    color: 'from-amber-500/20 to-transparent',
  },
];

const INFO_PRODUCTS = [
  {
    name: 'Hotmart',
    commission: '30% a 80% por venda',
    note: 'Maior marketplace de infoprodutos do Brasil. Você se afilia a produtos já validados e usa o material de apoio do produtor.',
    url: 'https://hotmart.com',
  },
  {
    name: 'Kiwify',
    commission: 'definida pelo produtor (comum 40%–60%)',
    note: 'Checkout simples, Pix aprovado na hora e área de membros integrada. Bom para quem quer lançar rápido.',
    url: 'https://kiwify.com.br',
  },
  {
    name: 'Eduzz / Braip / Monetizze',
    commission: '30% a 70%',
    note: 'Alternativas com afiliação aberta em nichos de saúde, finanças e relacionamento.',
    url: 'https://www.eduzz.com',
  },
];

export default function GuidePage() {
  return (
    <div>
      <PageHeader
        title="Guia de afiliação"
        description="Como se inscrever nos programas, quanto cada plataforma paga e o que fazer nos próximos 7 dias. Conteúdo verificado em outubro de 2026."
        action={
          <Link href="/admin/produtos" className="btn-primary btn-sm sm:text-sm">
            + Cadastrar produto
          </Link>
        }
      />

      <Alert tone="info">
        <p className="text-[12px] leading-relaxed">
          <b>Regra de ouro:</b> as regras mudam com frequência (seguidores, comissão, prazo de pagamento). Sempre
          confirme no site oficial antes de se inscrever — o número que aparece no seu painel é o que vale.
        </p>
      </Alert>

      <div className="mt-4 space-y-4">
        {PROGRAMS.map((program) => (
          <SectionCard key={program.id} padded={false}>
            <div className={`bg-gradient-to-r ${program.color} px-4 py-4 sm:px-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-lg">
                    {program.emoji}
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-white">{program.name}</h2>
                    <a
                      href={program.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-brand-200 hover:underline"
                    >
                      {program.urlLabel} ↗
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-1 sm:gap-1">
                  <span className="text-white/35">Comissão</span>
                  <span className="text-white/70">{program.commission}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Requisitos</h3>
                <ul className="mt-2 space-y-1.5">
                  {program.requirements.map((req) => (
                    <li key={req} className="flex gap-2 text-[12px] leading-snug text-white/60">
                      <span className="mt-0.5 text-lime-400">✓</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Passo a passo do cadastro
                </h3>
                <ol className="mt-2 space-y-1.5">
                  {program.steps.map((step, i) => (
                    <li key={step} className="flex gap-2 text-[12px] leading-snug text-white/60">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-white/[0.08] text-[9px] text-white/45">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <p className="text-[9.5px] uppercase tracking-wider text-white/30">Pagamento</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">{program.payout}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <p className="text-[9.5px] uppercase tracking-wider text-white/30">Janela de atribuição</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-white/60">{program.cookie}</p>
                </div>
                <div className="rounded-lg border border-lime-500/20 bg-lime-500/[0.06] p-2.5">
                  <p className="text-[9.5px] uppercase tracking-wider text-lime-300/60">Dica prática</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-lime-100/80">{program.tip}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        className="mt-4"
        title="Vender infoprodutos (o que mais paga)"
        subtitle="Comissões de 30% a 80% — muito acima dos marketplaces"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {INFO_PRODUCTS.map((item) => (
            <div key={item.name} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white">{item.name}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-brand-200 hover:underline"
                >
                  abrir ↗
                </a>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-lime-300">{item.commission}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-white/45">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-[12px] leading-relaxed text-white/55">
            <b className="text-white/80">Prefere não pagar plataforma?</b> Use a página de vendas deste painel
            (/p/seu-slug): ela já tem checkout, Pix, bônus, prova social e garantia. Você recebe o pedido no painel e
            libera o acesso manualmente ou com o link do Drive/Notion/área de membros.
          </p>
          <Link href="/admin/infoprodutos/novo" className="btn-ghost btn-sm mt-2.5">
            Criar minha página de vendas
          </Link>
        </div>
      </SectionCard>

      <SectionCard className="mt-4" title="Seus próximos 7 dias" subtitle="Plano simples para a primeira comissão">
        <ol className="space-y-3">
          {[
            {
              day: 'Dia 1',
              title: 'Escolha 1 programa e faça o cadastro',
              text: 'Shopee é o mais fácil de aprovar (sem mínimo de seguidores). TikTok Shop entrega mais comissão por venda, mas pede 1.000 seguidores.',
            },
            {
              day: 'Dia 1–2',
              title: 'Crie um perfil público de divulgação',
              text: 'Bio clara, foto, 3 posts no feed. Perfil vazio ou trancado é o motivo mais comum de recusa.',
            },
            {
              day: 'Dia 3',
              title: 'Escolha 3 produtos de comissão alta',
              text: 'Prefira categorias de beleza, casa e organização. Cadastre aqui e veja a comissão estimada de cada um.',
            },
            {
              day: 'Dia 4–5',
              title: 'Grave 3 vídeos de 30s',
              text: 'Use o estúdio de conteúdo: 3 formatos diferentes para o mesmo produto. Poste 1 por dia, sempre com o link /r/ na bio.',
            },
            {
              day: 'Dia 6–7',
              title: 'Meça e repita o que funcionou',
              text: 'Volte na visão geral: qual vídeo gerou mais cliques? Qual horário? Faça mais do mesmo.',
            },
          ].map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                {item.day}
              </span>
              <div>
                <p className="text-[13px] font-medium text-white">{item.title}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-white/45">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
          <Link href="/admin/produtos" className="btn-primary btn-sm">
            Cadastrar primeiro produto
          </Link>
          <Link href="/admin/conteudo" className="btn-lime btn-sm">
            Gerar primeiro roteiro
          </Link>
          <Link href="/admin/configuracoes" className="btn-ghost btn-sm">
            Atualizar status dos programas
          </Link>
        </div>
      </SectionCard>

      <p className="mt-5 text-center text-[10px] leading-relaxed text-white/25">
        Conteúdo informativo, verificado em outubro de 2026. Não somos afiliados ou representantes oficiais da Shopee,
        TikTok, Mercado Livre, Amazon, Hotmart ou Kiwify. Regras, comissões e requisitos podem mudar sem aviso — confirme
        sempre no site oficial.
      </p>
    </div>
  );
}
