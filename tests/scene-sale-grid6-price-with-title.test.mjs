import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, applySaleGrid4ProductImport, buildEditorCatalog, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { componentContracts } from './helpers/registry.mjs';
import { canvas } from './helpers/composition.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'collection.sceneSaleGrid6PriceWithTitle';

function entry() {
  return JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8')).find((item) => item.componentKey === componentKey);
}

test('scene price six-grid is registered with six square cards and a complete editor contract', () => {
  const component = entry();
  assert.ok(component, `${componentKey} must be registered`);
  assert.equal(component.中文名称, '六宫格场景价格（标题款）');
  assert.equal(component.分类, '活动商品组件');
  assert.equal(component.输出宽度, 600);
  assert.equal(component.移动端断点, 375);

  const directory = resolve(root, component.路径.组件模板.replace('/component.template.v1.html', ''));
  const { contentSchema, fixture, settingsSchema, settingsDefaults } = componentContracts(directory);
  const fields = editableFieldKeys(componentKey);

  assert.deepEqual(fields.content, Object.keys(contentSchema.properties));
  assert.deepEqual(fields.content, Object.keys(fixture.values));
  assert.deepEqual(fields.settings, Object.keys(settingsSchema.properties));
  assert.deepEqual(fields.settings, Object.keys(settingsDefaults.values));
  for (let index = 0; index < 6; index += 1) {
    for (const suffix of ['discountLabel', 'image.url', 'image.alt', 'image.clickUrl', 'name', 'price.current', 'price.compareAt']) {
      assert.ok(fields.content.includes(`saleItems[${index}].${suffix}`), `missing card ${index + 1} field ${suffix}`);
    }
  }
  assert.equal(Object.keys(fixture.localReferenceAssets).length, 8);
  for (const path of Object.values(fixture.localReferenceAssets)) assert.ok(existsSync(resolve(directory, path)), path);
});

test('scene price six-grid renders six square linked images, sale prices, crossed-out originals, and one CTA', () => {
  const component = entry();
  assert.ok(component);
  const directory = component.路径.组件模板.replace('/component.template.v1.html', '');
  const fixture = JSON.parse(readFileSync(resolve(root, directory, 'content.fixture.v1.json'), 'utf8'));
  const settings = JSON.parse(readFileSync(resolve(root, directory, 'settings.defaults.v1.json'), 'utf8'));
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-scene-price-grid6-'));
  const output = join(temporary, 'email.html');
  const composition = join(temporary, 'composition.json');
  const httpsContent = Object.fromEntries(Object.entries(fixture.values).map(([key, value]) => [
    key,
    key.endsWith('.image.url') || key.startsWith('decoration.') && key.endsWith('.url') ? `https://cdn.example.com/${key.replace(/[^a-z0-9]+/gi, '-')}.png` : value
  ]));
  writeFileSync(composition, JSON.stringify({
    schemaVersion: 1,
    canvas: canvas('#FBF6EC'),
    output,
    previewOutput: join(temporary, 'preview.html'),
    components: [{ name: component.中文名称, directory, componentKey, content: httpsContent, settings: settings.values }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), composition], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  assert.equal((visibleHtml.match(/<a\b/g) ?? []).length, 7, 'six product images and one bottom CTA are links');
  assert.equal((visibleHtml.match(/data-freshine-href-slot="saleItems\[[0-5]\]\.image\.clickUrl"/g) ?? []).length, 6);
  assert.equal((html.match(/text-decoration:line-through/g) ?? []).length, 6);
  assert.match(html, /width:264px;width:min\(264px,44vw\)/);
  assert.match(html, /height:264px;height:min\(264px,44vw\)/);
  assert.match(html, /font-family:Lora[^;]*;font-size:30px;font-size:min\(30px,5vw\);font-weight:400;line-height:38px/);
  assert.match(html, /font-family:Montserrat[^;]*;font-size:18px;font-size:min\(18px,3vw\);font-weight:500;line-height:27px/);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('scene price six-grid Shopify import updates one of six cards and preserves CTA and unrelated data', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'scene-price-grid6-import' });
  document = addComponentInstance(document, catalog, componentKey);
  document = addComponentInstance(document, catalog, componentKey);
  const untouched = structuredClone(document.components[0]);
  const before = structuredClone(document.components[1]);
  const product = {
    handle: 'nova-curtains',
    image: { url: 'https://cdn.example.com/nova.webp', alt: 'Nova curtains' },
    linkUrl: 'https://freshinelife.com/products/nova-curtains?variant=123&utm_id=old',
    fullTitle: 'Nova Linen Curtains',
    price: '$59.90',
    compareAtPrice: '$99.90',
    discountLabel: 'SAVE 40%'
  };

  const imported = applySaleGrid4ProductImport(document, document.components[1].instanceId, 5, { product });
  assert.deepEqual(imported.components[0], untouched);
  assert.equal(imported.components[1].content['saleItems[5].name'], product.fullTitle);
  assert.equal(imported.components[1].content['saleItems[5].price.current'], product.price);
  assert.equal(imported.components[1].content['saleItems[5].price.compareAt'], product.compareAtPrice);
  assert.equal(imported.components[1].content['saleItems[5].discountLabel'], product.discountLabel);
  const importedUrl = new URL(imported.components[1].content['saleItems[5].image.clickUrl']);
  assert.equal(importedUrl.searchParams.get('variant'), '123');
  assert.equal(importedUrl.searchParams.get('utm_source'), 'omnisend');
  assert.equal(importedUrl.searchParams.get('utm_medium'), 'email');
  assert.equal(importedUrl.searchParams.get('utm_id'), 'cover-rc');
  assert.equal(imported.components[1].content['cta.text'], before.content['cta.text']);
  assert.equal(imported.components[1].content['promotion.title'], before.content['promotion.title']);
  assert.deepEqual(imported.components[1].settings, before.settings);
  assert.equal(imported.components[1].content['saleItems[0].name'], before.content['saleItems[0].name']);
  assert.throws(() => applySaleGrid4ProductImport(document, document.components[1].instanceId, 6, { product }), /out of range/);
});
