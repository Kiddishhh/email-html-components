import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeSaleGrid, parseSaleGridArgs, resolveSaleGridVariants, saleGridGraphQlQuery } from '../skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs';

const root = '/Users/ww/Desktop/邮件营销运营/邮件html组件';
const script = `${root}/skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs`;
const fixture = `${root}/tests/fixtures/shopify-graphql/collection-products.json`;

function payloadWithPrimaryMedia() {
  const payload = JSON.parse(readFileSync(fixture, 'utf8'));
  payload.data.collectionByHandle.products.nodes.forEach((product, index) => {
    product.media = {
      nodes: [{
        alt: index === 0 ? 'First image in product details' : null,
        image: {
          url: `https://cdn.example.com/position-first-${index + 1}.webp`,
          width: 1600,
          height: 1600
        }
      }]
    };
  });
  return payload;
}

test('uses the verified store when a production sale-grid read omits --store', () => {
  assert.equal(
    parseSaleGridArgs(['--collection-handle', 'back-to-school-home', '--count', '6']).store,
    '0qsgrb-pe.myshopify.com'
  );
});

test('uses scalar money fields and normalizes their sale labels', () => {
  const payload = JSON.parse(readFileSync(fixture, 'utf8'));
  for (const product of payload.data.collectionByHandle.products.nodes) {
    for (const variant of product.variants.nodes) {
      variant.price = variant.price.amount;
      variant.compareAtPrice = variant.compareAtPrice?.amount ?? null;
    }
  }

  const result = normalizeSaleGrid(payload, 'summer-sale');
  assert.equal(result.items[0].price, 50);
  assert.equal(result.items[0].compareAtPrice, 100);
  assert.equal(result.items[0].discountLabel, 'SAVE 50%');
  assert.doesNotMatch(saleGridGraphQlQuery(), /(?:price|compareAtPrice)\s*\{/);
});

test('normalizes a Shopify CLI response that returns collectionByHandle at the top level', () => {
  const fixturePayload = payloadWithPrimaryMedia();
  const result = normalizeSaleGrid({ collectionByHandle: fixturePayload.data.collectionByHandle }, 'summer-sale');

  assert.equal(result.collection.handle, 'summer-sale');
  assert.equal(result.items.length, 6);
});

test('identifies a missing collection by its handle before attempting variant pagination', () => {
  assert.throws(
    () => resolveSaleGridVariants({ data: { collectionByHandle: null } }, () => {
      throw new Error('variant pagination should not run');
    }, 'summer-sale'),
    /sale-grid collection not found: summer-sale/
  );
});

test('uses the first product image by media position instead of featuredImage', () => {
  const payload = payloadWithPrimaryMedia();
  payload.data.collectionByHandle.products.nodes[0].featuredImage.url = 'https://cdn.example.com/not-the-product-page-first-image.webp';

  const result = normalizeSaleGrid(payload, 'summer-sale');

  assert.equal(result.items[0].image.url, 'https://cdn.example.com/position-first-1.webp');
  assert.equal(result.items[0].image.alt, 'First image in product details');
});

test('queries exactly the first image media in product position order', () => {
  const query = saleGridGraphQlQuery();

  assert.match(query, /media\(first: 1, query: "media_type:IMAGE", sortKey: POSITION\)/);
  assert.match(query, /\.\.\. on MediaImage \{ image \{ url width height \} \}/);
  assert.doesNotMatch(query, /featuredImage/);
});

test('rejects a product without a first product image even when featuredImage exists', () => {
  const payload = payloadWithPrimaryMedia();
  payload.data.collectionByHandle.products.nodes[0].media.nodes = [];

  assert.throws(
    () => normalizeSaleGrid(payload, 'summer-sale'),
    /sale-grid product has no first product image: first-curtain/
  );
});

test('requests eight variants first and pages only a product without an available variant', () => {
  const payload = payloadWithPrimaryMedia();
  const product = payload.data.collectionByHandle.products.nodes[0];
  product.id = 'gid://shopify/Product/first';
  product.variants.nodes = [{ availableForSale: false, price: { amount: '50' }, compareAtPrice: { amount: '100' } }];
  product.variants.pageInfo = { hasNextPage: true, endCursor: 'page-one' };
  const calls = [];

  const result = resolveSaleGridVariants(payload, ({ productId, after }) => {
    calls.push({ productId, after });
    return {
      product: {
        id: productId,
        variants: {
          nodes: [{ availableForSale: true, price: { amount: '50' }, compareAtPrice: { amount: '100' } }],
          pageInfo: { hasNextPage: false, endCursor: null }
        }
      }
    };
  });

  assert.deepEqual(calls, [{ productId: 'gid://shopify/Product/first', after: 'page-one' }]);
  assert.equal(result.data.collectionByHandle.products.nodes[0].variants.nodes.at(-1).availableForSale, true);
  assert.match(saleGridGraphQlQuery(), /variants\(first: 8\)/);
  assert.match(saleGridGraphQlQuery(), /pageInfo \{ hasNextPage endCursor \}/);
  assert.doesNotMatch(saleGridGraphQlQuery(), /variants\(first: 250\)/);
});

test('normalizes the first six collection products with confirmed links and discount rules', () => {
  const result = spawnSync(process.execPath, [script, '--collection-handle', 'summer-sale', '--count', '6', '--fixture', fixture], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.collection.url, 'https://freshinelife.com/collections/summer-sale');
  assert.equal(output.items.length, 6);
  assert.deepEqual(output.items.map(({ handle }) => handle), [
    'first-curtain', 'second-curtain', 'third-curtain', 'fourth-curtain', 'fifth-curtain', 'sixth-curtain'
  ]);
  assert.equal(output.items[0].image.url, 'https://cdn.example.com/first.webp');
  assert.equal(output.items[0].image.alt, 'First Curtain product image');
  assert.equal(output.items[0].linkUrl, 'https://freshinelife.com/products/first-curtain');
  assert.equal(output.items[0].linkSource, 'handle-fallback');
  assert.equal(output.items[0].discountLabel, 'SAVE 50%');
  assert.equal(output.items[1].discountLabel, '');
  assert.equal(output.items[2].discountLabel, '');
  assert.equal(output.items[3].discountLabel, 'SAVE 20%');
});
