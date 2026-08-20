import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = resolve(root, 'skills/build-omnisend-campaign-draft/scripts/fetch-single-product.mjs');
const fixture = resolve(root, 'tests/fixtures/shopify-graphql/single-product.json');

test('imports one Shopify product and splits its title into a card title and selling point', () => {
  const result = spawnSync(process.execPath, [script,
    '--shopify-url', 'https://freshinelife.com/products/amara-extra-long-linen-curtains',
    '--fixture', fixture
  ], { cwd: root, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output, {
    product: {
      handle: 'amara-extra-long-linen-curtains',
      image: {
        url: 'https://cdn.example.com/amara-primary.webp',
        alt: 'Amara curtains in a sunlit living room'
      },
      linkUrl: 'https://freshinelife.com/products/amara-extra-long-linen-curtains',
      title: 'Amara Extra Long Linen Curtains',
      description: 'Elegant Light-Filtering Drapes',
      discountLabel: 'SAVE 30%'
    }
  });
});

test('imports a product from a Freshine collection-context product URL', () => {
  const result = spawnSync(process.execPath, [script,
    '--shopify-url', 'https://freshinelife.com/collections/custom-curtains/products/amara-extra-long-linen-curtains',
    '--fixture', fixture
  ], { cwd: root, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.product.handle, 'amara-extra-long-linen-curtains');
  assert.equal(output.product.linkUrl, 'https://freshinelife.com/products/amara-extra-long-linen-curtains');
});
