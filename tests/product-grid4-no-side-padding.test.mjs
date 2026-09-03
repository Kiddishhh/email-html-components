import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  addComponentInstance,
  applySaleGrid4ProductImport,
  buildEditorCatalog,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy,
  styleKeysForStructure
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'collection.productGrid4NoSidePadding';
const componentDirectory = resolve(root, '活动商品组件/四宫格商品推荐（无左右边距）');
const itemFields = Array.from({ length: 4 }, (_, index) => [
  `saleItems[${index}].discountLabel`,
  `saleItems[${index}].image.url`,
  `saleItems[${index}].image.alt`,
  `saleItems[${index}].image.clickUrl`,
  `saleItems[${index}].cta.text`
]).flat();

test('full-width product grid is selectable with its complete defaults and editor fields', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '四宫格商品推荐（无左右边距）',
    分类: '活动商品组件',
    componentKey,
    默认主题: 'full-bleed-product-grid4',
    默认变体: 'two-row-tall-products-no-side-padding',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '活动商品组件/四宫格商品推荐（无左右边距）/component.template.v1.html',
      内容契约: '活动商品组件/四宫格商品推荐（无左右边距）/content.schema.v1.json',
      设置契约: '活动商品组件/四宫格商品推荐（无左右边距）/settings.schema.v1.json',
      默认测试数据: '活动商品组件/四宫格商品推荐（无左右边距）/content.fixture.v1.json',
      默认设置: '活动商品组件/四宫格商品推荐（无左右边距）/settings.defaults.v1.json',
      中文管理说明: '活动商品组件/四宫格商品推荐（无左右边距）/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '活动商品组件/四宫格商品推荐（无左右边距）/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });
  for (const relativePath of Object.values(entry.路径)) assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  assert.ok(existsSync(resolve(componentDirectory, '效果演示.html')));

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.ok(catalog.some((candidate) => candidate.componentKey === componentKey));
  assert.ok(styleKeysForStructure(catalog, '活动商品组件').includes(componentKey));
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['saleCollection.title', 'saleCollection.body', ...itemFields],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.theme', 'color.action']
  });
  assert.equal(editorFieldCopy(componentKey, 'content', 'saleCollection.title').label, '推荐区标题');
  assert.equal(editorFieldCopy(componentKey, 'content', 'saleItems[0].cta.text').label, '商品 1 按钮文字');

  let document = createCampaignDocument({ name: '无左右边距四宫格默认值测试' });
  document = addComponentInstance(document, catalog, componentKey);
  const instance = document.components[0];
  assert.equal(instance.content['saleCollection.title'], 'Three Days Left to Refresh');
  assert.equal(instance.content['saleCollection.body'], 'A Beautiful Opportunity To Bring Soft Light, Lasting Comfort, And Timeless Style Into Your Space.');
  assert.equal(instance.content['saleItems[0].discountLabel'], 'SAVE 50%');
  assert.equal(instance.content['saleItems[1].discountLabel'], 'SAVE 40%');
  assert.equal(instance.content['saleItems[2].cta.text'], 'SHOP MIRAVEL >>');
  assert.equal(instance.content['saleItems[3].cta.text'], 'SHOP AMARA >>');
  assert.equal(instance.settings['color.surface'], '#FBFAF8');
  assert.equal(instance.settings['color.heading'], '#1F1F1F');
  assert.equal(instance.settings['color.body'], '#7C706A');
  assert.equal(instance.settings['color.theme'], '#8D1B1B');
  assert.equal(instance.settings['color.action'], '#1F1F1F');
});

test('full-width product grid renders the approved 600px and proportional 375px geometry', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '无左右边距四宫格渲染测试' });
  document = addComponentInstance(document, catalog, componentKey);
  const temporary = mkdtempSync(resolve(tmpdir(), 'product-grid4-no-side-padding-'));
  const previewOutput = resolve(temporary, 'preview.html');
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output: resolve(temporary, 'email.html'),
    previewOutput,
    assets: {},
    components: document.components.map(({ name, directory, componentKey: key, content, settings }) => ({
      name, directory, componentKey: key, content, settings
    }))
  };
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify(composition));
  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /class="freshine-product-grid4-no-side-padding"[^>]*width="600"[^>]*max-width:600px/);
  assert.match(html, /padding-top:46px;padding-top:min\(46px,7\.666667vw\)/);
  assert.match(html, /font-family:Lora,Georgia,'Times New Roman',serif;font-size:30px;font-size:min\(30px,5vw\);font-weight:400;line-height:40px;line-height:min\(40px,6\.666667vw\)/);
  assert.match(html, /font-size:16px;font-size:min\(16px,2\.666667vw\);font-weight:500;line-height:24px;line-height:min\(24px,4vw\)/);
  assert.equal((html.match(/width="289" height="361"/g) ?? []).length, 4);
  assert.equal((html.match(/width:48\.166667%;height:361px;height:min\(361px,60\.166667vw\)/g) ?? []).length, 4);
  assert.equal((html.match(/width="22"[^>]*width:3\.666667%/g) ?? []).length, 4);
  assert.equal((html.match(/height="31"[^>]*height:31px;height:min\(31px,5\.166667vw\)/g) ?? []).length, 4);
  assert.equal((html.match(/padding-top:14px;padding-top:min\(14px,2\.333333vw\);padding-bottom:14px;padding-bottom:min\(14px,2\.333333vw\)/g) ?? []).length, 4);
  for (const text of ['Three Days Left to Refresh', 'SHOP ELARA &gt;&gt;', 'SHOP IRIS &gt;&gt;', 'SHOP MIRAVEL &gt;&gt;', 'SHOP AMARA &gt;&gt;']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /saleCollection\.cta|asset:\/\/|\{\{|<script\b|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
});

test('full-width product grid Shopify import changes only the requested card', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '无左右边距四宫格导入测试' });
  document = addComponentInstance(document, catalog, componentKey);
  document = addComponentInstance(document, catalog, componentKey);
  const untouchedInstance = structuredClone(document.components[0]);
  const originalSelectedContent = structuredClone(document.components[1].content);

  const imported = applySaleGrid4ProductImport(document, document.components[1].instanceId, 2, {
    product: {
      handle: 'elara-linen-curtains',
      image: { url: 'https://cdn.example.com/elara-primary.webp', alt: 'Elara linen curtains' },
      linkUrl: 'https://freshinelife.com/products/elara-linen-curtains',
      title: 'Elara Linen Curtains',
      description: 'Light-filtering linen drapes',
      discountLabel: 'SAVE 45%'
    }
  });

  assert.deepEqual(imported.components[0], untouchedInstance);
  assert.equal(imported.components[1].content['saleItems[2].image.url'], 'https://cdn.example.com/elara-primary.webp');
  assert.equal(imported.components[1].content['saleItems[2].image.alt'], 'Elara linen curtains');
  assert.equal(imported.components[1].content['saleItems[2].image.clickUrl'], 'https://freshinelife.com/products/elara-linen-curtains');
  assert.equal(imported.components[1].content['saleItems[2].discountLabel'], 'SAVE 45%');
  assert.equal(imported.components[1].content['saleItems[2].cta.text'], 'Elara Linen Curtains');
  assert.equal(imported.components[1].content['saleItems[0].image.url'], originalSelectedContent['saleItems[0].image.url']);
  assert.equal(imported.components[1].content['saleItems[0].cta.text'], originalSelectedContent['saleItems[0].cta.text']);
  assert.deepEqual(imported.components[1].settings, document.components[1].settings);
  assert.equal(imported.components[1].source, 'shopify-product:elara-linen-curtains:slot-3');
  assert.equal(imported.components[1].confirmed, false);
  assert.deepEqual(document.components[1].content, originalSelectedContent);
});
