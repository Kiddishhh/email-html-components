import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { componentContracts, componentDirectory, registeredComponent } from './helpers/registry.mjs';
import {
  addComponentInstance,
  applySaleGrid4ProductImport,
  buildEditorCatalog,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'collection.sceneSaleGrid4WithTitle';

test('scene four-grid is registered with the complete editable contract', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'scene four-grid must be registered');
  assert.equal(entry.中文名称, '四宫格场景折扣（标题款）');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);

  const directory = componentDirectory(entry, { absolute: true });
  const { contentSchema, fixture, settingsSchema, settingsDefaults } = componentContracts(directory);
  const fields = editableFieldKeys(componentKey);

  assert.deepEqual(fields.content, Object.keys(contentSchema.properties));
  assert.deepEqual(fields.content, Object.keys(fixture.values));
  assert.deepEqual(fields.settings, Object.keys(settingsSchema.properties));
  assert.deepEqual(fields.settings, Object.keys(settingsDefaults.values));
  assert.deepEqual(fields.settings, ['color.surface', 'color.heading', 'color.body', 'color.product', 'color.theme', 'color.badgeText']);
  assert.equal(fields.content.length, 22);
  for (let index = 0; index < 4; index += 1) {
    for (const suffix of ['discountLabel', 'image.url', 'image.alt', 'image.clickUrl', 'name']) {
      assert.ok(fields.content.includes(`saleItems[${index}].${suffix}`));
    }
  }
});

test('scene four-grid defaults preserve the approved design content and local source crops', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry);
  const directory = componentDirectory(entry, { absolute: true });
  const fixture = JSON.parse(readFileSync(resolve(directory, 'content.fixture.v1.json'), 'utf8'));
  assert.equal(fixture.values['saleCollection.title'], 'Upgrade Your Home in Style');
  assert.equal(fixture.values['saleCollection.body'], 'Refresh Your Home With Our Latest Curtain Designs-Crafted To Bring A Clean, Modern Look And Effortless Comfort For The Year Ahead.');
  assert.deepEqual([0, 1, 2, 3].map((index) => fixture.values[`saleItems[${index}].name`]), [
    'Elara Linen Blend Curtains',
    'Ilythra Cotton Linen Roman Shades',
    'Amara Extra Long Linen Curtains',
    'Elyna Motorized Roller Shades'
  ]);
  assert.deepEqual([0, 1, 2, 3].map((index) => fixture.values[`saleItems[${index}].discountLabel`]), ['SAVE 50%', 'SAVE 50%', 'SAVE 50%', 'SAVE 35%']);
  assert.equal(Object.keys(fixture.localReferenceAssets).length, 4);
  for (const path of Object.values(fixture.localReferenceAssets)) assert.ok(existsSync(resolve(directory, path)));
});

test('scene four-grid renders four linked images and four linked product names without a CTA or prices', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry);
  const directory = componentDirectory(entry);
  const fixture = JSON.parse(readFileSync(resolve(root, directory, 'content.fixture.v1.json'), 'utf8'));
  const settings = JSON.parse(readFileSync(resolve(root, directory, 'settings.defaults.v1.json'), 'utf8'));
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-scene-grid4-'));
  const output = join(temporary, 'email.html');
  const composition = join(temporary, 'composition.json');
  const httpsContent = Object.fromEntries(Object.entries(fixture.values).map(([key, value]) => [
    key,
    key.endsWith('.image.url') ? `https://cdn.example.com/product-${key.match(/\d/)[0]}.jpg` : value
  ]));
  writeFileSync(composition, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#F8F5F1', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: join(temporary, 'preview.html'),
    components: [{ name: entry.中文名称, directory, componentKey, content: httpsContent, settings: settings.values }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), composition], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  assert.equal((visibleHtml.match(/<a\b/g) ?? []).length, 8);
  assert.equal((visibleHtml.match(/data-freshine-href-slot="saleItems\[[0-3]\]\.image\.clickUrl"/g) ?? []).length, 8);
  assert.doesNotMatch(html, /saleCollection\.cta|price\.current|price\.compareAt|SHOP NOW|APPLY DISCOUNT/);
  assert.match(html, /max-width:600px/);
  assert.match(html, /width:246px;width:min\(246px,41vw\)/);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('scene four-grid Shopify import updates one card name and tracked link only', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'scene-grid4-import' });
  document = addComponentInstance(document, catalog, componentKey);
  document = addComponentInstance(document, catalog, componentKey);
  const untouchedInstance = structuredClone(document.components[0]);
  const before = structuredClone(document.components[1]);

  const imported = applySaleGrid4ProductImport(document, document.components[1].instanceId, 2, {
    product: {
      handle: 'nova-semi-sheer-curtains',
      image: { url: 'https://cdn.example.com/nova.webp', alt: 'Nova curtains' },
      linkUrl: 'https://freshinelife.com/products/nova-semi-sheer-curtains?variant=123&utm_id=old',
      title: 'Nova Semi-Sheer Curtains',
      discountLabel: 'SAVE 40%'
    }
  });

  assert.deepEqual(imported.components[0], untouchedInstance);
  assert.equal(imported.components[1].content['saleItems[2].image.url'], 'https://cdn.example.com/nova.webp');
  assert.equal(imported.components[1].content['saleItems[2].image.alt'], 'Nova curtains');
  assert.equal(imported.components[1].content['saleItems[2].name'], 'Nova Semi-Sheer Curtains');
  assert.equal(imported.components[1].content['saleItems[2].discountLabel'], 'SAVE 40%');
  const url = new URL(imported.components[1].content['saleItems[2].image.clickUrl']);
  assert.equal(url.searchParams.get('variant'), '123');
  assert.equal(url.searchParams.get('utm_source'), 'omnisend');
  assert.equal(url.searchParams.get('utm_medium'), 'email');
  assert.equal(url.searchParams.get('utm_id'), 'cover-rc');
  assert.equal(imported.components[1].content['saleItems[0].name'], before.content['saleItems[0].name']);
  assert.equal(imported.components[1].content['saleCollection.title'], before.content['saleCollection.title']);
  assert.deepEqual(imported.components[1].settings, before.settings);
  assert.deepEqual(document.components[1], before);
  assert.equal(imported.components[1].source, 'shopify-product:nova-semi-sheer-curtains:slot-3');
  assert.equal(imported.components[1].confirmed, false);
});
