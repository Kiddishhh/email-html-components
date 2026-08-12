import assert from 'node:assert/strict';
import test from 'node:test';

const guard = await import('../skills/build-omnisend-campaign-draft/scripts/shopify-readonly.mjs');

test('allows only the approved read-only Shopify CLI command families', () => {
  assert.doesNotThrow(() => guard.assertReadonlyShopifyCommand(['shopify', 'store', 'info']));
  assert.doesNotThrow(() => guard.assertReadonlyShopifyCommand([
    'shopify', 'store', 'execute', '--query', 'query { shop { name } }'
  ]));
  assert.doesNotThrow(() => guard.assertReadonlyShopifyCommand(['shopify', 'theme', 'list', '--json']));
  assert.doesNotThrow(() => guard.assertReadonlyShopifyCommand([
    'shopify', 'theme', 'pull', '--theme', '123', '--path', '/private/tmp/theme-snapshot'
  ]));
});

test('rejects Shopify writes, mutation payloads, and mutation bypass flags', () => {
  assert.throws(() => guard.assertReadonlyShopifyCommand(['shopify', 'theme', 'push']), /not allowed/);
  assert.throws(() => guard.assertReadonlyShopifyCommand(['shopify', 'theme', 'dev']), /not allowed/);
  assert.throws(() => guard.assertReadonlyShopifyCommand([
    'shopify', 'store', 'execute', '--query', 'mutation { productCreate(input: {}) { product { id } } }'
  ]), /mutation/);
  assert.throws(() => guard.assertReadonlyShopifyCommand([
    'shopify', 'store', 'execute', '--allow-mutations', '--query', 'query { shop { name } }'
  ]), /--allow-mutations/);
});
