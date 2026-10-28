# Ricartes Renda Extra — Plataforma de Afiliados & Infoprodutos

Plataforma all-in-one da **Ricartes Renda Extra** para **ganhar dinheiro como afiliado** (Shopee, TikTok Shop, Mercado Livre, Amazon) e
**vender seus próprios infoprodutos**, com painel de métricas, gerador de roteiros para TikTok/Reels e páginas de
vendas prontas.

> Status: aplicação completa e funcional. Roda localmente sem configurar nada (dados de demonstração incluídos) e
> escala para produção com Supabase + Vercel.

---

## O que tem dentro

### 1. Painel de afiliado (`/admin`)
- **Visão geral** — comissão aprovada, a receber, cliques, taxa de conversão (CVR), EPC, gráfico de 30 dias,
  origem do tráfego, dispositivos, melhores horários de postagem, ranking de produtos e atividade em tempo real.
- **Produtos afiliados** (`/admin/produtos`) — cadastro com plataforma, categoria, preço, % de comissão e link
  original. Cada produto ganha um **link rastreável** próprio.
- **Links & QR** (`/admin/links`) — link curto `/r/<slug>`, QR Code para stories (download em PNG) e botões que já
  geram a URL com `?utm_source=tiktok|instagram|whatsapp|youtube`.
- **Vendas & comissões** (`/admin/vendas`) — registro manual das vendas informadas pela plataforma, status
  pendente/aprovada/cancelada, ticket médio e pedidos de infoproduto.

### 2. Estúdio de conteúdo (`/admin/conteudo`)
Gera, a partir de um produto já cadastrado:
- **Gancho** de 0–3s + 3 alternativas;
- **Roteiro cena a cena** com marcação de tempo, fala e o que mostrar na tela;
- **Legenda** e **hashtags** por nicho;
- **Calendário** com os status ideia → roteirizado → gravado → publicado.

8 formatos (resenha, unboxing, problema→solução, top 3, antes/depois, tutorial, prova social, comparativo),
4 tons de voz e 6 perfis de público. É determinístico: o botão **"Variar ganchos"** gera novas versões.

### 3. Infoprodutos (`/admin/infoprodutos`)
- Cria a **página de vendas pública** em `/p/<slug>` com hero, benefícios, bônus, depoimentos, garantia, FAQ e 4 temas.
- **Checkout próprio**: captura nome/e-mail, gera pedido, mostra chave Pix e envia comprovante por WhatsApp.
- Ou use **link de checkout externo** (Hotmart, Kiwify, Eduzz) no botão principal.
- Pedidos aparecem em `/admin/vendas` para você marcar como pago.

### 4. Guia de afiliação (`/admin/guia`)
Passo a passo de cadastro em cada programa, requisitos, faixas de comissão, prazos de pagamento, janela de
atribuição e um plano de 7 dias para a primeira comissão. Conteúdo verificado em outubro/2026 — sempre confirme
no site oficial, pois as regras mudam.

### 5. Página de link na bio (`/<seu-handle>`)
O endereço que vai na bio do TikTok e do Instagram — a superfície que mais converte para afiliado:
- perfil com foto/iniciais, nome, @, bio e selos de credibilidade;
- botões das redes (TikTok, Instagram, WhatsApp);
- destaque do infoproduto com CTA de compra;
- produtos ativos agrupados por categoria, com preço e botão de oferta;
- todos os cliques passam pelo link rastreável com `utm_source=bio` — dá para comparar bio × vídeo × stories no painel;
- QR Code da página disponível em Configurações.

Aceita `/<handle>` e `/<handle>` com `@` (ex.: `/ricartes` ou `/@ricartes`), além do alias `/links`.

### 6. Backup dos dados
- **Baixar backup (JSON)** em Configurações → exporta todo o banco (`/api/backup`, protegido por sessão).
- **Importar backup** → valida a estrutura antes de gravar e substitui o conteúdo atual.
- Essencial enquanto o banco estiver no modo arquivo local, já que o disco da Vercel é temporário.

### 7. Páginas públicas
- `/` — landing da plataforma com as métricas reais do seu painel.
- `/<handle>` — página de link na bio.
- `/p/<slug>` — página de vendas.
- `/p/<slug>/obrigado?pedido=<id>` — pós-compra com Pix e WhatsApp.
- `/r/<slug>` — redirecionamento rastreável (302 para o link de afiliado, registrando clique, origem e dispositivo).
- `/api/qr?data=...&size=...` — QR Code em PNG.
- `/api/backup` — exportação do banco em JSON (requer sessão).

---

## Como rodar

```bash
npm install
npm run dev          # http://localhost:3000
```

Acesse `/admin` — a senha padrão de demonstração é **`ricartes`**.
Na primeira execução o banco é criado em `.data/db.json` com 10 produtos, ~45 dias de cliques, vendas,
roteiros e 2 infoprodutos de exemplo.

```bash
npm run build && npm start   # produção
npm run typecheck            # checagem de tipos
```

### Variáveis de ambiente

Copie `.env.example` para `.env.local` (ou `.env`) e ajuste:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `APP_PASSWORD` | sim (produção) | senha do painel. Padrão `ricartes` |
| `AUTH_SECRET` | sim (produção) | segredo HMAC do cookie de sessão. Gere algo aleatório e longo |
| `NEXT_PUBLIC_APP_URL` | recomendado | URL pública usada nos links rastreáveis. Se vazio, é derivada do host da requisição |
| `DB_DRIVER` | não | `file` (padrão) ou `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | com `supabase` | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | com `supabase` | service role key — **somente no servidor** |

---

## Banco de dados

### Modo local (padrão)
Grava em `.data/db.json` (ignorado pelo git). Ótimo para testar. Em serverless (Vercel) o disco é efêmero —
**use Supabase em produção**.

### Supabase (produção)
1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) — o plano gratuito limita a
   quantidade de projetos ativos por organização; se o limite estiver atingido, pause/remova um projeto antigo ou
   faça upgrade.
2. Abra **SQL Editor** e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Copie URL e service role key em **Project Settings → API**.
4. Defina `DB_DRIVER=supabase` e as duas variáveis no ambiente (Vercel → Settings → Environment Variables).
5. Redeploy. No primeiro acesso a aplicação semeia os dados de demonstração — apague-os em Configurações se quiser
   começar do zero.

A aplicação acessa o Postgres **apenas pelo servidor** com a service role key. RLS fica ligado e sem policies
públicas; a `anon key` não consegue escrever nada.

---

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Configure as variáveis da tabela acima (`DB_DRIVER=supabase`, `APP_PASSWORD`, `AUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL`).
3. Deploy. As rotas dinâmicas já estão marcadas com `force-dynamic` e as Server Actions funcionam no domínio da Vercel.

---

## Estrutura

```
src/
├── app/
│   ├── page.tsx                  landing pública
│   ├── login/                    autenticação por senha
│   ├── admin/
│   │   ├── layout.tsx            shell + guarda de sessão
│   │   ├── actions.ts            todas as Server Actions
│   │   ├── page.tsx              dashboard
│   │   ├── produtos/             CRUD de produtos afiliados
│   │   ├── links/                links rastreáveis + QR
│   │   ├── conteudo/             estúdio de conteúdo + calendário
│   │   ├── vendas/               comissões e pedidos
│   │   ├── infoprodutos/         CRUD de infoprodutos
│   │   ├── guia/                 guia de afiliação
│   │   └── configuracoes/        perfil, programas, banco
│   ├── [handle]/                 página de link na bio
│   ├── p/[slug]/                 página de vendas + obrigado
│   ├── r/[slug]/                 redirecionamento rastreável
│   ├── api/qr/                   geração de QR
│   └── api/backup/               exportação do banco em JSON
├── components/                   UI, gráficos SVG, sidebar, toasts
└── lib/
    ├── types.ts                  modelo de domínio
    ├── db.ts                     drivers file / supabase + repositório
    ├── seed.ts                   dados de demonstração
    ├── stats.ts                  métricas e séries
    ├── content-engine.ts         gerador de ganchos/roteiros
    ├── auth.ts                   sessão HMAC via cookie
    ├── format.ts                 formatação pt-BR
    └── url.ts                    URL pública
supabase/schema.sql               schema completo do Postgres
```

## Decisões técnicas

- **Sem dependência de API oficial.** Shopee/TikTok Shop não aprovam todo mundo para API; o fluxo funciona com
  links gerados por você e métricas próprias de clique. Quando tiver credenciais, dá para sincronizar comissões.
- **Server Actions + `revalidatePath`.** Sem endpoints REST manuais; formulários funcionam sem estado global.
- **Gráficos em SVG puro.** Zero dependências de chart, zero layout shift, renderização no servidor.
- **Driver de banco plugável.** A mesma interface `Store` serve para arquivo local e Postgres; trocar é uma env var.
- **Sem `localStorage` para dados.** Tudo passa pelo servidor, então o painel funciona igual em qualquer dispositivo.

## Próximos passos sugeridos

- Integração com a **Shopee Affiliate Open API** (`appId`/`secret`) para importar comissões automaticamente.
- Upload de imagens para o Supabase Storage em vez de colar URLs.
- Multiusuário (Supabase Auth) se você for trabalhar com equipe.
- Webhook/Pix automático (Mercado Pago) para liberar o acesso ao infoproduto sem conferência manual.
