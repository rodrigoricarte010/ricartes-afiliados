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
- **Meta do mês** — defina quanto quer faturar em Configurações. O painel mostra o que já entrou (comissões
  aprovadas + pedidos pagos), quanto falta, a projeção no ritmo atual e quanto precisa por dia para bater a meta.
- **Exportar em CSV** — vendas, pedidos, cliques e catálogo (`/api/export?tipo=vendas|pedidos|cliques|produtos`),
  já com `;` e vírgula decimal para abrir direto no Excel pt-BR.
- **Atualizar ao vivo** — botão de atualização e modo automático (30s) no topo do painel, sem recarregar a página.

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
atribuição e um plano de 7 dias para a primeira comissão. Inclui:
- **checklist do que ter em mãos** (CPF, PIS/NIS, conta no seu nome, perfil público) antes de se inscrever;
- **ordem recomendada**, do mais fácil de aprovar ao que paga mais;
- botões **Não iniciei / Enviei · em análise / Aprovado** em cada plataforma, que atualizam o mesmo status de
  Configurações (o painel passa a refletir o cadastro real);
- **"Fui recusado — e agora?"** com os motivos mais comuns e como corrigir antes de reenviar.

Conteúdo verificado em outubro/2026 — sempre confirme no site oficial, pois as regras mudam.

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
- **Apagar todos os dados** → remove a demonstração (produtos, cliques, comissões, roteiros, infoprodutos, pedidos)
  e zera o perfil. Exige digitar `LIMPAR`; a linha de configuração é mantida, então os exemplos não voltam sozinhos.
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

## Guia rápido de produção

Se o objetivo é só usar a plataforma no dia a dia (senha, limpar demonstração, links e diagnóstico),
veja [`docs/primeiros-passos.md`](docs/primeiros-passos.md).

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
npm run test:links           # testes da leitura de links de afiliado
```

### Variáveis de ambiente

Copie `.env.example` para `.env.local` (ou `.env`) e ajuste:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `APP_PASSWORD` | sim (produção) | senha do painel. Padrão `ricartes` |
| `AUTH_SECRET` | sim (produção) | segredo HMAC do cookie de sessão. Gere algo aleatório e longo |
| `NEXT_PUBLIC_APP_URL` | recomendado | URL pública usada nos links rastreáveis. Se vazio, é derivada do host da requisição |
| `DB_DRIVER` | não | `file` (padrão), `postgres` ou `supabase` |
| `DATABASE_URL` | com `postgres` | connection string do Postgres (Neon, Railway, Supabase, local) |
| `NEXT_PUBLIC_SUPABASE_URL` | com `supabase` | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | com `supabase` | service role key — **somente no servidor** |

---

## Banco de dados

### Modo local (padrão)
Grava em `.data/db.json` (ignorado pelo git). Ótimo para testar. Em serverless (Vercel) o disco é efêmero —
**use um Postgres gerenciado (Neon) em produção**.

### Qualquer Postgres (recomendado: Neon) — mais simples
1. Crie um banco grátis em [neon.tech](https://neon.tech) (ou Railway, Render, Supabase pela aba *Connect*).
2. Copie a connection string (`postgresql://...?sslmode=require`).
3. Defina `DB_DRIVER=postgres` e `DATABASE_URL=...`.
4. Pronto: **as tabelas são criadas automaticamente** no primeiro acesso, sem rodar SQL.

Funciona com qualquer Postgres 13+ (inclusive local). Se você definir só `DATABASE_URL`, o driver `postgres` é
ativado automaticamente. O driver é testado com um Postgres em memória:

```bash
npm run test:db
```

### Supabase (via API)
1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) — o plano gratuito limita a
   quantidade de projetos ativos por organização; se o limite estiver atingido, pause/remova um projeto antigo ou
   faça upgrade.
2. Abra **SQL Editor** e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Copie URL e service role key em **Project Settings → API**.
4. Defina `DB_DRIVER=supabase` e as duas variáveis no ambiente (Vercel → Settings → Environment Variables).
5. Redeploy. No primeiro acesso a aplicação semeia os dados de demonstração — apague-os em Configurações se quiser
   começar do zero.

> Observação: o driver `supabase` usa a API REST (PostgREST) e exige o schema criado manualmente. O driver
> `postgres` conecta direto no banco, cria as tabelas sozinho e é o caminho mais rápido — inclusive se você usar o
> próprio Supabase apenas como Postgres (Project Settings → Database → Connection string).

A aplicação acessa o Postgres **apenas pelo servidor** com a service role key. RLS fica ligado e sem policies
públicas; a `anon key` não consegue escrever nada.

---

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Configure as variáveis da tabela acima (`DB_DRIVER=postgres`, `DATABASE_URL`, `APP_PASSWORD`,
   `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`).
3. Deploy. As rotas dinâmicas já estão marcadas com `force-dynamic` e as Server Actions funcionam no domínio da Vercel.

> Push no repositório **não** dispara deploy enquanto a integração automática estiver desligada no projeto —
> dispare manualmente (dashboard → *Deployments* → *Redeploy*) depois de mudar variáveis de ambiente.

### Diagnóstico: `/api/health`

Abra `https://SEU-DOMINIO/api/health` no navegador. A resposta mostra o driver ativo, a latência da consulta,
quantos registros há em cada tabela e — se falhar — a mensagem de erro já sem usuário/senha:

```json
{ "ok": true, "driver": "postgres", "latencyMs": 3064, "counts": { "products": 10, "clicks": 807 } }
```

Com `ok: false` e `"error": "..."` o problema está na `DATABASE_URL` (variável ausente, senha trocada, banco
pausado no Neon). Corrija a variável e faça um novo deploy.

### Neon: detalhes que já estão tratados no código

- O painel do Neon entrega a string com `?sslmode=require&channel_binding=require`. O `pg` não implementa
  `channel_binding`, e a partir do `pg-connection-string` v2.7 `sslmode=require` passou a valer como
  `verify-full` (exige CA válida). O driver remove esses parâmetros da URL e configura o TLS no Pool, então
  basta colar a string como veio.
- Use a string **com `-pooler`** no host (connection pooling): em serverless cada instância abre o próprio pool
  e o pooler do Neon evita estourar o limite de conexões.

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
│   │   ├── produtos/             CRUD, busca e filtros de produtos afiliados
│   │   ├── produtos/importar/    importação em massa por lista de links
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
│   ├── api/health/               diagnóstico do banco em produção
│   ├── api/export/               exportação em CSV (vendas, pedidos, cliques, produtos)
│   └── api/backup/               exportação do banco em JSON
├── components/                   UI, gráficos SVG, sidebar, toasts
└── lib/
    ├── types.ts                  modelo de domínio
    ├── db.ts                     repositório + escolha do driver
    ├── db-pg.ts                  driver Postgres genérico (cria tabelas sozinho)
    ├── db-normalize.ts           normalização do formato do banco
    ├── seed.ts                   dados de demonstração
    ├── stats.ts                  métricas e séries
    ├── content-engine.ts         gerador de ganchos/roteiros
    ├── auth.ts                   sessão HMAC via cookie
    ├── format.ts                 formatação pt-BR
    └── url.ts                    URL pública
supabase/schema.sql               schema para o driver supabase (PostgREST)
scripts/test-postgres.ts          teste de integração do driver Postgres
scripts/test-stats.ts             testes das métricas (agregação, atribuição, meta)
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
