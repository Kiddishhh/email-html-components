import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'collection.curtainEditorialMosaic4';
const directory = resolve(root, '活动商品组件/窗帘精选拼贴四图');

const imageFields = [0, 1, 2, 3].flatMap((index) => [
  `mosaic.items[${index}].image.url`,
  `mosaic.items[${index}].image.alt`,
  `mosaic.items[${index}].clickUrl`
]);

test('窗帘精选拼贴四图作为独立的 600px 活动商品组件进入编辑器', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, '窗帘精选拼贴四图必须在组件清单中独立登记');
  assert.equal(entry.中文名称, '窗帘精选拼贴四图');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['promotion.title', 'promotion.subtitle', ...imageFields, 'cta.text', 'cta.url'],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.cardFallback', 'color.cta']
  });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const catalogEntry = catalog.find((item) => item.componentKey === componentKey);
  assert.ok(catalogEntry, '窗帘精选拼贴四图必须能在编辑器中选择');
  assert.equal(catalogEntry.name, '窗帘精选拼贴四图');
});

test('窗帘精选拼贴四图保留非等高双列拼贴和五个独立点击链接', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'curtain-editorial-mosaic4' }), catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['promotion.title'], 'A FRESH LOOK FOR THE SEASON');
  assert.equal(component.content['mosaic.items[0].image.url'], 'https://app.omnisend.com/images/6a96adcab313445127d1b63e');
  assert.match(component.content['mosaic.items[0].clickUrl'], /emilia-smart-motorized-cotton-roman-shades\?utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
  assert.match(component.content['cta.url'], /freshine-sale\?utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);

  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.match(template, /width="526"/);
  assert.match(template, /padding:0 20px;padding:0 min\(20px,3\.333333vw\)/);
  assert.match(template, /width="259" height="258"/);
  assert.match(template, /width="259" height="323"/);
  assert.match(template, /width="259" height="194"/);
  assert.equal((template.match(/data-freshine-href-slot=/g) ?? []).length, 5);
  assert.doesNotMatch(template, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)/i);
});

test('窗帘精选拼贴四图导出为邮件安全的四图背景和 CTA 链接', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'curtain-editorial-mosaic4-export' }), catalog, componentKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-curtain-editorial-mosaic4-'));
  const output = resolve(temporary, 'email.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: resolve(temporary, 'preview.html'),
    components: [{ name: component.name, directory: component.directory, componentKey, content: component.content, settings: component.settings }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.match(html, /A FRESH LOOK FOR THE SEASON/);
  assert.equal((html.match(/background-image:url\('/g) ?? []).length, 4);
  assert.equal((html.match(/<a\b/g) ?? []).length, 5);
  assert.match(html, /width:526px;width:min\(526px,87\.666667vw\)/);
  assert.match(html, /height:323px;height:min\(323px,53\.833333vw\)/);
  assert.match(html, /height:194px;height:min\(194px,32\.333333vw\)/);
  assert.doesNotMatch(html, /asset:\/\/|file:\/\/|data:image|\{\{/);
});

test('窗帘精选拼贴四图演示由默认公开快照生成', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-curtain-editorial-mosaic4-demo-'));
  const generatedDemo = resolve(temporary, '效果演示.html');
  const result = spawnSync(process.execPath, [resolve(directory, 'render-demo.mjs'), '--output', generatedDemo], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const demo = readFileSync(generatedDemo, 'utf8');
  const committedDemo = readFileSync(resolve(directory, '效果演示.html'), 'utf8');
  assert.match(demo, /6a96adcab313445127d1b63e/);
  assert.match(demo, /class="freshine-component freshine-curtain-editorial-mosaic4"/);
  assert.doesNotMatch(demo, /asset:\/\/|\{\{/);
  assert.equal(demo, committedDemo);
});
