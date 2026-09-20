import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { componentContracts, componentDirectory, registeredComponent, root } from './helpers/registry.mjs';

const componentKey = 'collection.saleGrid6DetailWithTitle';

test('detail six-grid is registered with a complete editor contract', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'collection.saleGrid6DetailWithTitle must be registered');
  assert.equal(entry.中文名称, '六宫格详情折扣（标题款）');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);

  const directory = componentDirectory(entry);
  const { contentSchema, fixture, settingsSchema, settingsDefaults } = componentContracts(directory);
  const fields = editableFieldKeys(componentKey);

  assert.deepEqual(fields.content, Object.keys(contentSchema.properties));
  assert.deepEqual(fields.content, Object.keys(fixture.values));
  assert.deepEqual(fields.settings, Object.keys(settingsSchema.properties));
  assert.deepEqual(fields.settings, Object.keys(settingsDefaults.values));
  for (let index = 0; index < 6; index += 1) {
    for (const suffix of ['discountLabel', 'image.url', 'image.alt', 'image.clickUrl', 'name', 'price.current', 'price.compareAt', 'cta.text']) {
      assert.ok(fields.content.includes(`saleItems[${index}].${suffix}`), `missing card ${index + 1} field ${suffix}`);
    }
  }
});

test('detail six-grid renders only each product image and CTA as links', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'collection.saleGrid6DetailWithTitle must be registered');
  const directory = componentDirectory(entry);
  const content = JSON.parse(readFileSync(`${root}/${directory}/content.fixture.v1.json`, 'utf8')).values;
  const settings = JSON.parse(readFileSync(`${root}/${directory}/settings.defaults.v1.json`, 'utf8')).values;
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-grid4-detail-'));
  const output = join(temporary, 'email.html');
  const composition = join(temporary, 'composition.json');
  writeFileSync(composition, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FBFAF8', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: join(temporary, 'preview.html'),
    components: [{ name: entry.中文名称, directory, componentKey, content, settings }]
  }));

  const result = spawnSync(process.execPath, [`${root}/build-email-template.v1.mjs`, composition], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  assert.equal((visibleHtml.match(/<a\b/g) ?? []).length, 12, 'six images and six CTA buttons are the only visible links');
  assert.equal((visibleHtml.match(/data-freshine-href-slot="saleItems\[[0-5]\]\.image\.clickUrl"/g) ?? []).length, 12);
  assert.doesNotMatch(visibleHtml, /<a[^>]*>[^<]*<span[^>]*data-freshine-slot="saleItems\[[0-5]\]\.name"/);
  assert.doesNotMatch(visibleHtml, /<a[^>]*>[^<]*<span[^>]*data-freshine-slot="saleItems\[[0-5]\]\.price\./);
  assert.match(html, /width:100%;max-width:600px/);
  assert.match(html, /table-layout:fixed/);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});


test('detail six-grid import supports all six slots and preserves unrelated content and settings', async () => {
  const { buildEditorCatalog, createCampaignDocument, addComponentInstance, applySaleGrid4ProductImport } = await import('../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs');
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let doc = createCampaignDocument({ name: 'six detail test' });
  doc = addComponentInstance(doc, catalog, componentKey);
  doc = addComponentInstance(doc, catalog, componentKey);
  const original = structuredClone(doc);
  const product = { handle: 'example', image: { url: 'https://cdn.example.com/product.jpg', alt: 'product' }, linkUrl: 'https://freshinelife.com/products/example?variant=9', fullTitle: 'Full product title', price: '$60', compareAtPrice: '$100', discountLabel: 'SAVE 40%' };
  for (let slot = 0; slot < 6; slot++) {
    const result = applySaleGrid4ProductImport(doc, doc.components[1].instanceId, slot, {product});
    assert.deepEqual(result.components[0], original.components[0]);
    assert.deepEqual(result.components[1].settings, original.components[1].settings);
    const before = original.components[1].content;
    const after = result.components[1].content;
    for (const key of Object.keys(before)) {
      if (!key.startsWith(`saleItems[${slot}].`) || key.endsWith('.cta.text')) assert.equal(after[key], before[key], key);
    }
    assert.equal(after[`saleItems[${slot}].name`], product.fullTitle);
    assert.equal(after[`saleItems[${slot}].price.current`], product.price);
    assert.equal(after[`saleItems[${slot}].price.compareAt`], product.compareAtPrice);
    assert.equal(after[`saleItems[${slot}].discountLabel`], product.discountLabel);
    assert.match(after[`saleItems[${slot}].image.clickUrl`], /variant=9&utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
    assert.equal(result.confirmed, false);
  }
  assert.deepEqual(doc, original);
  for (const slot of [-1, 6, 1.5]) assert.throws(() => applySaleGrid4ProductImport(doc, doc.components[0].instanceId, slot, {product}), /out of range/);
});
