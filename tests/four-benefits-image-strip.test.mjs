import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'image.benefitsStrip4';
const directory = resolve(root, '赠品与权益组件/四项权益整图');

test('four-benefit full-image strip is a selectable 600px benefits component with the supplied local reference', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, 'the supplied four-benefit image must be registered as an independently selectable component');
  assert.equal(entry.中文名称, '四项权益整图');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['image.url', 'image.alt'],
    settings: ['color.surface']
  });
  assert.ok(existsSync(resolve(directory, 'assets/default-benefits-strip-4.png')));
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('four-benefit full-image strip resolves the supplied source locally without splitting or linking it', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'four-benefits-image-strip' });
  document = addComponentInstance(document, catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['image.url'], 'asset://benefits-strip-4');
  assert.equal(component.content['image.alt'], 'Freshine benefits: 7–14 day delivery, free shipping, free design, and secure payments');
  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  assert.match(assets['benefits-strip-4'].path, /赠品与权益组件\/四项权益整图\/assets\/default-benefits-strip-4\.png$/);
  assert.doesNotMatch(readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8'), /<a\b|href=|image\.linkUrl/);
});

const twoRowsKey = 'image.benefitsStrip4TwoRows';
const twoRowsDirectory = resolve(root, '赠品与权益组件/四项权益整图（两行）');

test('two-row benefits can be added alongside the single-row image without replacing its asset or editable fields', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const entry = catalog.find((item) => item.componentKey === twoRowsKey);
  assert.ok(entry, 'the two-row image must be independently selectable');
  assert.equal(entry.name, '四项权益整图（两行）');
  assert.equal(entry.category, '赠品与权益组件');
  assert.deepEqual(editableFieldKeys(twoRowsKey), {
    content: ['image.url', 'image.alt'], settings: ['color.surface']
  });
  let document = createCampaignDocument({ name: 'both-benefits-layouts' });
  document = addComponentInstance(document, catalog, componentKey);
  document = addComponentInstance(document, catalog, twoRowsKey);
  assert.equal(document.components[0].content['image.url'], 'asset://benefits-strip-4');
  assert.equal(document.components[1].content['image.url'], 'asset://benefits-strip-4-two-rows');
  assert.match(document.components[1].content['image.alt'], /measurement tool/i);
  assert.equal(document.components[1].settings['color.surface'], '#FFFFFF');
  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  assert.notEqual(assets['benefits-strip-4'].path, assets['benefits-strip-4-two-rows'].path);
  const png = readFileSync(assets['benefits-strip-4-two-rows'].path);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 1080);
});

test('two-row benefits render edited image, accessible alt and surface in one unlinked email-safe image', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.ok(catalog.some((item) => item.componentKey === twoRowsKey), 'the two-row image must be registered');
  const document = addComponentInstance(createCampaignDocument({ name: 'two-row-export' }), catalog, twoRowsKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-benefits-two-rows-'));
  const output = resolve(temporary, 'email.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: resolve(temporary, 'preview.html'),
    components: [{
      name: '四项权益整图（两行）', directory: twoRowsDirectory, componentKey: twoRowsKey,
      content: { ...component.content, 'image.url': 'https://cdn.example.com/benefits-two-rows.png', 'image.alt': 'Delivery & measurement' },
      settings: { ...component.settings, 'color.surface': '#123456' }
    }]
  }));
  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/benefits-two-rows\.png"/);
  assert.match(html, /alt="Delivery &amp; measurement"/);
  assert.match(html, /background-color:#123456/);
  assert.match(html, /width:100%;max-width:600px/);
  assert.match(html, /height:auto/);
  assert.doesNotMatch(html, /<a\b|href=|<style\b|<script\b|<iframe\b|<form\b|display:(?:flex|grid)|position:(?:absolute|fixed)|asset:\/\//);
});

for (const [name, demoDirectory, imageName] of [
  ['single-row', directory, 'default-benefits-strip-4.png'],
  ['two-row', twoRowsDirectory, 'default-benefits-strip-4-two-rows.png']
]) {
  test(`${name} four-benefit demo supplies its declared local asset to the email builder`, () => {
    const result = spawnSync(process.execPath, [resolve(demoDirectory, 'render-demo.mjs')], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(readFileSync(resolve(demoDirectory, '效果演示.html'), 'utf8').includes(imageName));
  });
}
