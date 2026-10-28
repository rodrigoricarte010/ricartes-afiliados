// ---------------------------------------------------------------------------
// Teste de integração do driver Postgres usando pg-mem (Postgres em memória).
// Roda com: npx tsx scripts/test-postgres.ts
// ---------------------------------------------------------------------------

import { newDb } from 'pg-mem';
import { PostgresStore } from '../src/lib/db-pg';
import { buildDemoDatabase } from '../src/lib/seed';
import { normalizeDatabase } from '../src/lib/db-normalize';

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`, detail ?? '');
  }
}

async function main() {
  const mem = newDb();
  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();

  const store = new PostgresStore({
    query: async (text, params) => {
      const result = await pool.query(text, params as unknown[]);
      return { rows: result.rows as Record<string, unknown>[] };
    },
    normalize: normalizeDatabase,
    seed: buildDemoDatabase,
  });

  console.log('\n0. Normalização limpa a copy antiga da demonstração');
  const legacy = normalizeDatabase({
    settings: { ...buildDemoDatabase().settings, is_demo: true },
    infoproducts: [
      {
        id: 'inf_old',
        slug: 'antigo',
        name: 'Antigo',
        tagline: 'O método que transformou 3 seguidores em R$ 7.400/mês de comissão',
        description: '',
        price: 97,
        benefits: [],
        bonuses: [],
        testimonials: [
          { name: 'Juliana M.', role: 'Aluna desde março', text: 'Em 3 semanas bati R$ 1.200 de comissão só replicando os roteiros do módulo 2.' },
        ],
        checkout_url: '',
        theme: 'royal',
        status: 'ativo',
        created_at: new Date().toISOString(),
      },
    ],
  });
  const fixed = legacy.infoproducts[0]!;
  check('tagline sem promessa de resultado', !/R\$/.test(fixed.tagline), fixed.tagline);
  check('depoimento sem valor inventado', !/R\$/.test(fixed.testimonials[0]!.text), fixed.testimonials[0]!.text);
  check('papel do depoimento marcado como exemplo', fixed.testimonials[0]!.role === 'Exemplo de depoimento');

  const userEdited = normalizeDatabase({
    settings: { ...buildDemoDatabase().settings, is_demo: true },
    infoproducts: [{ ...fixed, tagline: 'Meu texto, editado por mim', testimonials: [] }],
  });
  check('texto editado pelo usuário é preservado', userEdited.infoproducts[0]!.tagline === 'Meu texto, editado por mim');

  const notDemo = normalizeDatabase({
    settings: { ...buildDemoDatabase().settings, is_demo: false },
    infoproducts: [{ ...fixed, tagline: 'Texto real do meu produto' }],
  });
  check('fora da demonstração nada é reescrito', notDemo.infoproducts[0]!.tagline === 'Texto real do meu produto');

  console.log('\n1. Semeia o banco vazio na primeira leitura');
  const initial = await store.load();
  check('produtos criados', initial.products.length === 10, initial.products.length);
  check('cliques criados', initial.clicks.length > 100, initial.clicks.length);
  check('infoprodutos criados', initial.infoproducts.length === 2, initial.infoproducts.length);
  check('configurações presentes', Boolean(initial.settings?.display_name), initial.settings);

  console.log('\n2. Recarrega do banco (dados persistiram)');
  const reloaded = await store.load();
  check('mesma quantidade de produtos', reloaded.products.length === initial.products.length);
  check('mesma quantidade de cliques', reloaded.clicks.length === initial.clicks.length);
  check('preço veio como número', typeof reloaded.products[0]!.price === 'number', reloaded.products[0]!.price);
  check(
    'campos jsonb preservados (benefícios)',
    Array.isArray(reloaded.infoproducts[0]!.benefits) && reloaded.infoproducts[0]!.benefits.length > 0,
    reloaded.infoproducts[0]!.benefits,
  );
  check('data em ISO', !Number.isNaN(new Date(reloaded.products[0]!.created_at).getTime()));

  console.log('\n3. Insere um produto novo');
  const db = await store.load();
  db.products.unshift({
    id: 'prd_teste',
    slug: 'produto-de-teste',
    name: 'Produto de Teste',
    platform: 'shopee',
    category: 'Cozinha',
    price: 19.9,
    commission_pct: 10,
    affiliate_url: 'https://shopee.com.br/x',
    status: 'ativo',
    created_at: new Date().toISOString(),
  });
  await store.save(db, ['products']);

  const withNew = await store.load();
  check('produto aparece no banco', withNew.products.some((p) => p.id === 'prd_teste'));
  check('total atualizado', withNew.products.length === initial.products.length + 1, withNew.products.length);

  console.log('\n4. Atualiza o mesmo produto (upsert)');
  const db2 = await store.load();
  const target = db2.products.find((p) => p.id === 'prd_teste')!;
  target.name = 'Produto de Teste (editado)';
  target.price = 29.5;
  await store.save(db2, ['products']);
  const afterUpdate = await store.load();
  const updated = afterUpdate.products.find((p) => p.id === 'prd_teste')!;
  check('nome atualizado', updated.name === 'Produto de Teste (editado)', updated.name);
  check('preço atualizado', updated.price === 29.5, updated.price);
  check('sem duplicar linha', afterUpdate.products.filter((p) => p.id === 'prd_teste').length === 1);

  console.log('\n5. Remove produto e seus dependentes');
  const db3 = await store.load();
  db3.products = db3.products.filter((p) => p.id !== 'prd_teste');
  await store.save(db3, ['products']);
  const afterDelete = await store.load();
  check('produto removido', !afterDelete.products.some((p) => p.id === 'prd_teste'));

  console.log('\n6. Salva configurações');
  const db4 = await store.load();
  db4.settings.display_name = 'Teste Persistido';
  db4.settings.handle = '@teste';
  await store.save(db4, 'settings');
  const afterSettings = await store.load();
  check('nome persistido', afterSettings.settings.display_name === 'Teste Persistido', afterSettings.settings.display_name);
  check('handle persistido', afterSettings.settings.handle === '@teste');

  console.log('\n7. Pedido e conversão');
  const db5 = await store.load();
  db5.orders.unshift({
    id: 'ord_teste',
    infoproduct_id: db5.infoproducts[0]!.id,
    customer_name: 'Fulano Teste',
    customer_email: 'fulano@teste.com',
    amount: 97,
    payment_method: 'pix',
    status: 'pendente',
    created_at: new Date().toISOString(),
  });
  db5.conversions.unshift({
    id: 'cnv_teste',
    product_id: db5.products[0]!.id,
    amount: 49.9,
    commission: 6.99,
    status: 'aprovada',
    created_at: new Date().toISOString(),
  });
  await store.save(db5, ['orders', 'conversions']);
  const afterOrders = await store.load();
  check('pedido salvo', afterOrders.orders.some((o) => o.id === 'ord_teste'));
  check('conversão salva', afterOrders.conversions.some((c) => c.id === 'cnv_teste'));
  check(
    'valores numéricos corretos',
    afterOrders.conversions.find((c) => c.id === 'cnv_teste')?.commission === 6.99,
    afterOrders.conversions.find((c) => c.id === 'cnv_teste')?.commission,
  );

  // limpar tudo: tabelas vazias, settings zerado e sem semear de novo
  await store.save(
    {
      settings: { ...afterOrders.settings, is_demo: false, display_name: '', handle: '' },
      products: [],
      clicks: [],
      conversions: [],
      content_posts: [],
      infoproducts: [],
      orders: [],
    },
    ['clicks', 'conversions', 'content_posts', 'orders', 'infoproducts', 'products'],
  );
  const cleared = await store.load();
  check('clearAll: produtos vazios', cleared.products.length === 0, cleared.products.length);
  check('clearAll: cliques vazios', cleared.clicks.length === 0, cleared.clicks.length);
  check('clearAll: comissões vazias', cleared.conversions.length === 0, cleared.conversions.length);
  check('clearAll: pedidos vazios', cleared.orders.length === 0, cleared.orders.length);
  check('clearAll: settings sem nome', cleared.settings.display_name === '', cleared.settings.display_name);
  check('clearAll: is_demo desligado', cleared.settings.is_demo === false, cleared.settings.is_demo);

  await pool.end();

  console.log(
    failures === 0 ? '\n✅ Todos os testes do driver Postgres passaram.\n' : `\n❌ ${failures} verificação(ões) falharam.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Erro no teste:', error);
  process.exit(1);
});
