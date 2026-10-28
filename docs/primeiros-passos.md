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

Enquanto o banco tiver os exemplos, o topo do painel mostra uma faixa âmbar avisando que os
números não são reais.

Painel → **Configurações** → *Dados de demonstração · apagar*:

1. Clique em **⤓ Baixar backup** e guarde o JSON (opcional, mas recomendado).
2. Digite `LIMPAR` no campo de confirmação.
3. Clique em **🗑 Apagar todos os dados**.

Isso zera produtos, cliques, comissões, roteiros, infoprodutos e pedidos, e deixa o perfil vazio
(sem Pix/WhatsApp de exemplo). A linha de configuração continua existindo, então o semeador
automático **não devolve os exemplos** depois da limpeza.

Para trazer os exemplos de volta algum dia: **Restaurar demonstração** (pede confirmação, porque
apaga tudo o que você cadastrou).

## Rotina de uso

1. **Produtos**: cadastre o item com preço, % de comissão e o link de afiliado original.
   Cada produto ganha `https://ricartes-renda-extra.vercel.app/r/<slug>`.
   - **Cole o link primeiro**: a plataforma (Shopee, TikTok Shop, Mercado Livre, Amazon, Hotmart, Kiwify) é
     detectada pelo domínio, a comissão típica já vem preenchida e, no Mercado Livre/Amazon, o nome do produto
     é deduzido da própria URL.
   - **Muitos produtos?** Use *Produtos → ⇪ Importar lista* e cole uma linha por produto (do Excel, do Sheets ou
     digitada). Há prévia em tempo real antes de confirmar.
   - No catálogo dá para buscar por nome/categoria e filtrar por plataforma, status e ordenação.
2. **Links**: copie o link rastreável (ou o QR Code) e use na bio, nos comentários e nos stories.
   Sempre que possível use `?utm_source=tiktok` (ou `instagram`, `whatsapp`) para separar a origem.
3. **Conteúdo**: escolha o produto, o formato e o tom; o estúdio devolve gancho, roteiro,
   legenda e hashtags, e guarda no calendário de produção.
4. **Vendas**: registre a comissão quando ela aparecer no painel da Shopee/TikTok Shop e
   marque como aprovada quando cair. O dashboard usa exatamente esses registros.
   - **⤓ Vendas CSV / ⤓ Pedidos CSV** exportam os lançamentos (abre direto no Excel, com `;` e vírgula decimal).
5. **Meta**: em Configurações, preencha *Meta de faturamento do mês*. O cartão do topo do painel mostra
   o que já entrou (comissões aprovadas + pedidos pagos), o que falta, a projeção no ritmo atual e
   quanto você precisa fazer por dia. Deixe `0` ou vazio para esconder a meta.
6. **Infoprodutos**: edite a página de vendas, preço, bônus e garantia. Os pedidos aparecem em Vendas.

> **Atualizar os números**: no topo do painel tem `↻ Atualizar` e o botão `○ ao vivo`. Com o modo ao vivo
> ligado, o painel rebusca os dados a cada 30 segundos (só com a aba visível) — útil enquanto você divulga.

## Se algo quebrar

Abra `/api/health`:

- `{"ok": true, ...}` → aplicação e banco conversando.
- `{"ok": false, "error": "..."}` → o erro aparece sem usuário/senha. Causas comuns:
  banco pausado no Neon (plano free pausa por inatividade — abra o console e reative),
  `DATABASE_URL` alterada ou removida na Vercel, ou senha do banco trocada.

Depois de qualquer mudança de variável de ambiente, **faça um novo deploy**: o projeto não
publica sozinho a cada push.
