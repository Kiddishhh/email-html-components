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

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'image.benefitsAddressCard';
const directory = resolve(root, '赠品与权益组件/权益+地址组合卡');

test('权益+地址组合卡作为独立的 600px 整图组件进入编辑器', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, '权益+地址组合卡必须在组件清单中独立登记');
  assert.equal(entry.中文名称, '权益+地址组合卡');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['image.url', 'image.alt'],
    settings: ['color.surface']
  });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const catalogEntry = catalog.find((item) => item.componentKey === componentKey);
  assert.ok(catalogEntry, '权益+地址组合卡必须能在编辑器中选择');
  assert.equal(catalogEntry.name, '权益+地址组合卡');
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('权益+地址组合卡完整保留经确认原图且不拆分、不裁切、不链接', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'benefits-address-card' }), catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['image.url'], 'asset://benefits-address-card');
  assert.match(component.content['image.alt'], /custom window treatments and services/i);
  assert.equal(component.settings['color.surface'], '#F8F4EE');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  const assetPath = resolve(root, assets['benefits-address-card'].path);
  const png = readFileSync(assetPath);
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 1704);
  assert.equal(createHash('sha256').update(png).digest('hex'), '5050a09a88d3ea4bc41cca50ff8c14b1af940c78863d39728e6f9ee3da0a8425');

  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.doesNotMatch(template, /<a\b|href=|image\.linkUrl|object-fit|clip-path|position:(?:absolute|fixed)/i);
});

test('权益+地址组合卡导出为单张无链接、流式缩放的邮件安全图片', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'benefits-address-export' }), catalog, componentKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-benefits-address-'));
  const output = resolve(temporary, 'email.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: resolve(temporary, 'preview.html'),
    components: [{
      name: component.name,
      directory: component.directory,
      componentKey,
      content: {
        ...component.content,
        'image.url': 'https://cdn.example.com/benefits-address-card.png',
        'image.alt': 'Benefits & showroom address'
      },
      settings: { ...component.settings, 'color.surface': '#EFE9E1' }
    }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/benefits-address-card\.png"/);
  assert.match(html, /alt="Benefits &amp; showroom address"/);
  assert.match(html, /background-color:#EFE9E1/);
  assert.match(html, /width:100%;max-width:600px/);
  assert.match(html, /height:auto/);
  assert.doesNotMatch(html, /<a\b|href=|<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('权益+地址组合卡演示由真实默认快照和原图生成', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-benefits-address-demo-'));
  const generatedDemo = resolve(temporary, '效果演示.html');
  const result = spawnSync(process.execPath, [resolve(directory, 'render-demo.mjs'), '--output', generatedDemo], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const demo = readFileSync(generatedDemo, 'utf8');
  const committedDemo = readFileSync(resolve(directory, '效果演示.html'), 'utf8');
  assert.match(demo, /default-benefits-address-card\.png/);
  assert.match(demo, /class="freshine-component freshine-benefits-address-card"/);
  assert.doesNotMatch(demo, /asset:\/\/|\{\{/);
  const normalizeAssetPath = (html) => html.replace(/src="[^"]*\/default-benefits-address-card\.png"/g, 'src="default-benefits-address-card.png"');
  assert.equal(normalizeAssetPath(demo), normalizeAssetPath(committedDemo));
});
