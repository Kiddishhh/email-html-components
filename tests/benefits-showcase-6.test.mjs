import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { canvas } from './helpers/composition.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'image.benefitsShowcase6';
const directory = resolve(root, '赠品与权益组件/六权益展示卡');

test('六权益展示卡作为独立的 600px 整图组件进入编辑器', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, '六权益展示卡必须在组件清单中独立登记');
  assert.equal(entry.中文名称, '六权益展示卡');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['image.url', 'image.alt'],
    settings: ['color.surface']
  });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const catalogEntry = catalog.find((item) => item.componentKey === componentKey);
  assert.ok(catalogEntry, '六权益展示卡必须能在编辑器中选择');
  assert.equal(catalogEntry.name, '六权益展示卡');
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('六权益展示卡完整保留经确认原图且不拆分、不裁切、不链接', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'benefits-showcase-6-card' }), catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['image.url'], 'asset://benefits-showcase-6-card');
  assert.match(component.content['image.alt'], /custom window treatments & services/i);
  assert.equal(component.settings['color.surface'], '#FAF9F6');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  const assetPath = resolve(root, assets['benefits-showcase-6-card'].path);
  const png = readFileSync(assetPath);
  assert.equal(createHash('sha256').update(png).digest('hex'), '01a66457262218814cd94fe46fb06ec5cfbb3d3bf24591d18746faff160f7602');

  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.doesNotMatch(template, /<a\b|href=|image\.linkUrl|object-fit|clip-path|position:(?:absolute|fixed)/i);
});

test('六权益展示卡导出为单张无链接、流式缩放的邮件安全图片', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'benefits-showcase-6-export' }), catalog, componentKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-benefits-showcase-6-'));
  const output = resolve(temporary, 'email.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: canvas('#FFFFFF'),
    output,
    previewOutput: resolve(temporary, 'preview.html'),
    components: [{
      name: component.name,
      directory: component.directory,
      componentKey,
      content: {
        ...component.content,
        'image.url': 'https://cdn.example.com/benefits-showcase-6-card.jpg',
        'image.alt': 'Benefits & showroom address'
      },
      settings: { ...component.settings, 'color.surface': '#EFE9E1' }
    }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/benefits-showcase-6-card\.jpg"/);
  assert.match(html, /alt="Benefits &amp; showroom address"/);
  assert.match(html, /background-color:#EFE9E1/);
  assert.match(html, /width:100%;max-width:600px/);
  assert.match(html, /height:auto/);
  assert.doesNotMatch(html, /<a\b|href=|<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('六权益展示卡演示由真实默认快照和原图生成', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-benefits-showcase-6-demo-'));
  const generatedDemo = resolve(temporary, '效果演示.html');
  const result = spawnSync(process.execPath, [resolve(directory, 'render-demo.mjs'), '--output', generatedDemo], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const demo = readFileSync(generatedDemo, 'utf8');
  const committedDemo = readFileSync(resolve(directory, '效果演示.html'), 'utf8');
  assert.match(demo, /default-benefits-showcase-6-card\.jpg/);
  assert.match(demo, /class="freshine-component freshine-benefits-showcase-6-card"/);
  assert.doesNotMatch(demo, /asset:\/\/|\{\{/);
  const normalizeAssetPath = (html) => html.replace(/src="[^"]*\/default-benefits-showcase-6-card\.jpg"/g, 'src="default-benefits-showcase-6-card.jpg"');
  assert.equal(normalizeAssetPath(demo), normalizeAssetPath(committedDemo));
});
