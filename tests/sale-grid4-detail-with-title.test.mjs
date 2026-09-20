import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { componentContracts, componentDirectory, registeredComponent, root } from './helpers/registry.mjs';
import { canvas } from './helpers/composition.mjs';

const componentKey = 'collection.saleGrid4DetailWithTitle';

test('detail four-grid is registered with a complete editor contract', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'collection.saleGrid4DetailWithTitle must be registered');
  assert.equal(entry.中文名称, '四宫格详情折扣（标题款）');
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
  for (let index = 0; index < 4; index += 1) {
    for (const suffix of ['discountLabel', 'image.url', 'image.alt', 'image.clickUrl', 'name', 'price.current', 'price.compareAt', 'cta.text']) {
      assert.ok(fields.content.includes(`saleItems[${index}].${suffix}`), `missing card ${index + 1} field ${suffix}`);
    }
  }
});

test('detail four-grid defaults match the approved products and UTM policy', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'collection.saleGrid4DetailWithTitle must be registered');
  const directory = componentDirectory(entry);
  const fixture = JSON.parse(readFileSync(`${root}/${directory}/content.fixture.v1.json`, 'utf8')).values;
  const expected = [
    ['Marisol Linen Curtains Large Windows – Elegant Pleated Drapes for Living Room & Bedroom', '$46.99', '$93.98', 'SAVE 50%'],
    ['Evelora Linen Striped Jacquard Light Filtering Drapery', '$79.90', '$139.00', 'SAVE 43%'],
    ['Nova Semi-Sheer Curtains for Large Windows – Elegant Drapes for Living Room & Bedroom', '$47.90', '$79.90', 'SAVE 40%'],
    ['Ilythra Cotton-Linen Floor to Ceiling Curtains – Light Filtering Layered Double-Layer Set', '$74.90', '$124.90', 'SAVE 40%']
  ];
  for (const [index, [name, current, compareAt, badge]] of expected.entries()) {
    assert.equal(fixture[`saleItems[${index}].name`], name);
    assert.equal(fixture[`saleItems[${index}].price.current`], current);
    assert.equal(fixture[`saleItems[${index}].price.compareAt`], compareAt);
    assert.equal(fixture[`saleItems[${index}].discountLabel`], badge);
    const url = new URL(fixture[`saleItems[${index}].image.clickUrl`]);
    assert.equal(url.searchParams.get('utm_source'), 'omnisend');
    assert.equal(url.searchParams.get('utm_medium'), 'email');
    assert.equal(url.searchParams.get('utm_id'), 'cover-rc');
    assert.equal(fixture[`saleItems[${index}].cta.text`], 'SHOP NOW');
  }
});

test('detail four-grid renders only each product image and CTA as links', () => {
  const entry = registeredComponent(componentKey);
  assert.ok(entry, 'collection.saleGrid4DetailWithTitle must be registered');
  const directory = componentDirectory(entry);
  const content = JSON.parse(readFileSync(`${root}/${directory}/content.fixture.v1.json`, 'utf8')).values;
  const settings = JSON.parse(readFileSync(`${root}/${directory}/settings.defaults.v1.json`, 'utf8')).values;
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-grid4-detail-'));
  const output = join(temporary, 'email.html');
  const composition = join(temporary, 'composition.json');
  writeFileSync(composition, JSON.stringify({
    schemaVersion: 1,
    canvas: canvas('#FBFAF8'),
    output,
    previewOutput: join(temporary, 'preview.html'),
    components: [{ name: entry.中文名称, directory, componentKey, content, settings }]
  }));

  const result = spawnSync(process.execPath, [`${root}/build-email-template.v1.mjs`, composition], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  assert.equal((visibleHtml.match(/<a\b/g) ?? []).length, 8, 'four images and four CTA buttons are the only visible links');
  assert.equal((visibleHtml.match(/data-freshine-href-slot="saleItems\[[0-3]\]\.image\.clickUrl"/g) ?? []).length, 8);
  assert.doesNotMatch(visibleHtml, /<a[^>]*>[^<]*<span[^>]*data-freshine-slot="saleItems\[[0-3]\]\.name"/);
  assert.doesNotMatch(visibleHtml, /<a[^>]*>[^<]*<span[^>]*data-freshine-slot="saleItems\[[0-3]\]\.price\./);
  assert.match(html, /width:100%;max-width:600px/);
  assert.match(html, /table-layout:fixed/);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});
