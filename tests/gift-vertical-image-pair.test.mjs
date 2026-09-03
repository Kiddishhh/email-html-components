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
const componentKey = 'gift.verticalImagePair';
const directory = resolve(root, '赠品与权益组件/赠品上下展示卡');
const defaultLink = 'https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-rc';
const contentFields = ['images[0].url', 'images[0].alt', 'images[1].url', 'images[1].alt', 'gift.linkUrl'];

test('赠品上下展示卡作为独立的两图组件进入编辑器', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '赠品上下展示卡',
    分类: '赠品与权益组件',
    componentKey,
    默认主题: 'vertical-gift-image-pair',
    默认变体: 'two-full-width-linked-images-stacked',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '赠品与权益组件/赠品上下展示卡/component.template.v1.html',
      内容契约: '赠品与权益组件/赠品上下展示卡/content.schema.v1.json',
      设置契约: '赠品与权益组件/赠品上下展示卡/settings.schema.v1.json',
      默认测试数据: '赠品与权益组件/赠品上下展示卡/content.fixture.v1.json',
      默认设置: '赠品与权益组件/赠品上下展示卡/settings.defaults.v1.json',
      中文管理说明: '赠品与权益组件/赠品上下展示卡/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '赠品与权益组件/赠品上下展示卡/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });
  for (const relativePath of Object.values(entry.路径)) assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
  assert.deepEqual(editableFieldKeys(componentKey), { content: contentFields, settings: [] });
  assert.ok(buildEditorCatalog({ workspaceRoot: root }).some((item) => item.componentKey === componentKey));
});

test('赠品上下展示卡完整保留两张用户提供原图并将两图链接到同一默认 UTM 地址', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'gift-vertical-image-pair' }), catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['gift.linkUrl'], defaultLink);
  assert.equal(component.content['images[0].url'], 'asset://gift-vertical-pillow-cover');
  assert.equal(component.content['images[1].url'], 'asset://gift-vertical-eye-mask');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  for (const assetId of ['gift-vertical-pillow-cover', 'gift-vertical-eye-mask']) {
    const image = readFileSync(resolve(root, assets[assetId].path));
    assert.equal(image.toString('ascii', 1, 4), 'PNG');
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 676);
  }
  assert.equal(createHash('sha256').update(readFileSync(resolve(root, assets['gift-vertical-pillow-cover'].path))).digest('hex'), '0079cc705eee61fcc81c42d5e5d1da6ee6431a044d32f8ced3661a86a30dac3f');
  assert.equal(createHash('sha256').update(readFileSync(resolve(root, assets['gift-vertical-eye-mask'].path))).digest('hex'), 'f3f4de4d8e9983bf472e0bc1250f9843883c89963b2f8a9096bd9dbfd96a9e8e');

  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.equal((template.match(/data-freshine-href-slot="gift\.linkUrl"/g) ?? []).length, 2);
  assert.match(template, /width="600" height="338"/);
  assert.doesNotMatch(template, /<style\b|@media|<div\b|<script\b|<iframe\b|<form\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|object-fit|clip-path/i);
});

test('赠品上下展示卡在本地预览中输出两个整图链接且保持邮件安全', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'gift-vertical-image-preview' }), catalog, componentKey);
  const temporary = mkdtempSync(resolve(tmpdir(), 'gift-vertical-image-pair-'));
  const previewOutput = resolve(temporary, 'preview.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: document.canvas,
    output: resolve(temporary, 'email.html'),
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name, directory: componentDirectory, componentKey: key, content, settings }) => ({ name, directory: componentDirectory, componentKey: key, content, settings }))
  }));
  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input, '--preview-local-assets'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.equal((html.match(/<img\b/g) ?? []).length, 2);
  assert.equal((html.match(/href="https:\/\/freshinelife\.com\/\?utm_source=omnisend&amp;utm_medium=email&amp;utm_id=cover-rc"/g) ?? []).length, 2);
  assert.equal((html.match(/width="600" height="338"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<style\b|@media|<div\b|<script\b|<iframe\b|<form\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)/i);
});

test('赠品上下展示卡有可定位的管理说明与交互说明', () => {
  assert.ok(existsSync(resolve(directory, 'COMPONENT_MANAGEMENT.zh-CN.v1.md')));
  assert.match(readFileSync(resolve(root, '组件索引.md'), 'utf8'), /赠品上下展示卡/);
  assert.match(readFileSync(resolve(root, 'skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md'), 'utf8'), /gift\.verticalImagePair/);
});
