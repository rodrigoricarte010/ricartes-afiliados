# Primeiros passos — Ricartes Renda Extra (produção)

Tudo já está no ar e conectado ao banco. Este guia é o seu "como usar" do dia a dia.

## Acessos

| O quê | Onde |
| --- | --- |
| Site / landing | https://ricartes-renda-extra.vercel.app |
| Painel | https://ricartes-renda-extra.vercel.app/login |
| Página de link na bio | https://ricartes-renda-extra.vercel.app/ricartes |
| Página de vendas (infoproduto) | https://ricartes-renda-extra.vercel.app/p/achadinhos-que-vendem |
| Diagnóstico do banco | https://ricartes-renda-extra.vercel.app/api/health |
| Painel da Vercel | https://vercel.com/re-r-sports/ricartes-renda-extra |
| Banco (Neon) | https://console.neon.tech |

A senha do painel **não fica neste repositório** (ele é público): ela está na variável `APP_PASSWORD`
do projeto na Vercel. Para trocar, siga o passo a passo mais abaixo.

## O que já está funcionando

- Banco Postgres no **Neon**, região **São Paulo**, com as 7 tabelas criadas automaticamente.
- Dados de demonstração semeados: 10 produtos, ~800 cliques em 45 dias, 25 comissões,
  7 roteiros e 2 infoprodutos — números **reais do seu banco**, não inventados na tela.
- Links rastreáveis (`/r/...`) registrando clique, origem e dispositivo antes de redirecionar
  para o link de afiliado.
- Página de vendas com checkout Pix e registro de pedidos.

## Trocar a senha do painel

1. Vercel → projeto `ricartes-renda-extra` → **Settings → Environment Variables**.
2. Edite `APP_PASSWORD` e salve.
3. **Deployments → ⋯ → Redeploy** (o projeto está com deploy automático desligado, então
   mudar variável não publica sozinho).

> Enquanto o deploy não termina, a senha antiga continua valendo.

## Limpar os dados de demonstração

Painel → **Configurações** → *Dados de demonstração*:

- **Restaurar demonstração**: recria o conjunto de exemplo (útil depois de mexer demais).
- Para começar do zero: apague os produtos/infoprodutos pelo próprio painel e deixe o banco vazio.
  O semeador só roda quando o banco está vazio, então nada volta sem você pedir.

Antes de apagar, use **Configurações → Backup** para baixar um JSON com tudo.

## Rotina de uso

1. **Produtos**: cadastre o item com preço, % de comissão e o link de afiliado original.
   Cada produto ganha `https://ricartes-renda-extra.vercel.app/r/<slug>`.
2. **Links**: copie o link rastreável (ou o QR Code) e use na bio, nos comentários e nos stories.
   Sempre que possível use `?utm_source=tiktok` (ou `instagram`, `whatsapp`) para separar a origem.
3. **Conteúdo**: escolha o produto, o formato e o tom; o estúdio devolve gancho, roteiro,
   legenda e hashtags, e guarda no calendário de produção.
4. **Vendas**: registre a comissão quando ela aparecer no painel da Shopee/TikTok Shop e
   marque como aprovada quando cair. O dashboard usa exatamente esses registros.
5. **Infoprodutos**: edite a página de vendas, preço, bônus e garantia. Os pedidos aparecem em Vendas.

## Se algo quebrar

Abra `/api/health`:

- `{"ok": true, ...}` → aplicação e banco conversando.
- `{"ok": false, "error": "..."}` → o erro aparece sem usuário/senha. Causas comuns:
  banco pausado no Neon (plano free pausa por inatividade — abra o console e reative),
  `DATABASE_URL` alterada ou removida na Vercel, ou senha do banco trocada.

Depois de qualquer mudança de variável de ambiente, **faça um novo deploy**: o projeto não
publica sozinho a cada push.
