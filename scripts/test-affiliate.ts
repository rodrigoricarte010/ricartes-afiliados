// Testes da leitura de links de afiliado e da importação em massa.
// Rode com: npm run test:links

import { inspectAffiliateLink, parseProductList, parseMoney } from '../src/lib/affiliate';

let ok = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) {
    ok += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`  ✗ ${label}`, extra ?? '');
  }
}

console.log('\n# Detecção de plataforma');
check('shopee.com.br', inspectAffiliateLink('https://shopee.com.br/product/123/456').platform === 'shopee');
check('s.shopee.com.br', inspectAffiliateLink('https://s.shopee.com.br/abc123').platform === 'shopee');
check('vt.tiktok.com', inspectAffiliateLink('https://vt.tiktok.com/ZSabc/').platform === 'tiktok');
check('mercadolivre.com.br', inspectAffiliateLink('https://www.mercadolivre.com.br/p/MLB123').platform === 'mercadolivre');
check('amazon.com.br', inspectAffiliateLink('https://www.amazon.com.br/dp/B0ABCDEFG?tag=ricartes-20').platform === 'amazon');
check('hotmart', inspectAffiliateLink('https://pay.hotmart.com/A12345678X').platform === 'hotmart');
check('kiwify', inspectAffiliateLink('https://pay.kiwify.com.br/abc123').platform === 'kiwify');
check('domínio desconhecido', inspectAffiliateLink('https://exemplo.com/produto').platform === null);
check('link sem protocolo', inspectAffiliateLink('shopee.com.br/product/1/2').platform === 'shopee');
check('texto inválido não quebra', inspectAffiliateLink('    ').platform === null);

console.log('\n# Nome deduzido da URL');
const ml = inspectAffiliateLink('https://www.mercadolivre.com.br/MLB-1234567890-air-fryer-digital-4l-_JM');
check('ML: nome extraído', ml.name === 'Air Fryer Digital 4l', ml.name);
const amz = inspectAffiliateLink('https://www.amazon.com.br/Fone-Bluetooth-TWS/dp/B0ABC12345');
check('Amazon: nome extraído', amz.name === 'Fone Bluetooth Tws', amz.name);

console.log('\n# Comissão sugerida');
check('shopee 3%', inspectAffiliateLink('https://shopee.com.br/product/1/2').suggestedCommission === 3);
check('tiktok 10%', inspectAffiliateLink('https://vt.tiktok.com/x').suggestedCommission === 10);
check('amazon 8%', inspectAffiliateLink('https://amzn.to/xyz').suggestedCommission === 8);

console.log('\n# parseMoney');
check('R$ 1.234,56', parseMoney('R$ 1.234,56') === 1234.56);
check('49,90', parseMoney('49,90') === 49.9);
check('1,234.56', parseMoney('1,234.56') === 1234.56);
check('vazio', parseMoney('') === null);

console.log('\n# Importação em massa');
const csv = [
  'nome; preco; comissao; url',
  'Organizador de geladeira; 49,90; 12; https://shopee.com.br/product/1/2',
  'Air Fryer 4L; R$ 289,90; 8%; https://www.mercadolivre.com.br/MLB-1234567890-air-fryer-4l-_JM',
  'https://vt.tiktok.com/ZSabc/', // só o link: usa nome/comissão automáticos
  'linha sem link nenhum',
].join('\n');

const parsed = parseProductList(csv);
check('importou 3 produtos', parsed.products.length === 3, parsed.products.length);
check('ignorou o cabeçalho', parsed.products[0]?.name === 'Organizador de geladeira');
check('preço com vírgula', parsed.products[0]?.price === 49.9, parsed.products[0]?.price);
check('comissão numérica', parsed.products[0]?.commission_pct === 12, parsed.products[0]?.commission_pct);
check('nome explícito tem prioridade', parsed.products[1]?.name === 'Air Fryer 4L', parsed.products[1]?.name);
check('comissão com %', parsed.products[1]?.commission_pct === 8, parsed.products[1]?.commission_pct);
check('link sozinho usa nome automático', parsed.products[2]?.name === 'Produto TikTok Shop', parsed.products[2]?.name);
check('plataforma detectada no link solto', parsed.products[2]?.platform === 'tiktok');
check('linha inválida virou aviso', parsed.issues.length === 1 && parsed.issues[0]?.line === 5, parsed.issues);

const soLink = parseProductList('https://www.mercadolivre.com.br/MLB-1234567890-air-fryer-4l-_JM');
check('só o link do ML: nome vem da URL', soLink.products[0]?.name === 'Air Fryer 4l', soLink.products[0]?.name);

const csvUs = parseProductList('Air Fryer, "289,90", 8, https://shopee.com.br/product/1/2');
check('CSV com aspas e vírgula', csvUs.products[0]?.price === 289.9, csvUs.products[0]?.price);

console.log(`\n${failures.length ? '❌' : '✅'} ${ok} verificações ok${failures.length ? `, ${failures.length} falharam` : ''}\n`);
if (failures.length) {
  console.log('Falhas:', failures.join(' | '));
  process.exit(1);
}
