import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const componentKey = 'collection.curtainInspirationGrid4';
const directory = `${root}/活动商品组件/窗帘灵感四宫格`;
const imageFields = [1, 2, 3, 4].flatMap((index) => [
  `grid.image${index}.url`,
  `grid.image${index}.alt`,
  `grid.image${index}.clickUrl`,
  `grid.image${index}.caption`
]);

function renderGrid(showCaptions) {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: `curtain-grid-captions-${showCaptions}` });
  document = addComponentInstance(document, catalog, componentKey);
  document.components[0].settings['grid.showCaptions'] = showCaptions;
  const output = `/private/tmp/curtain-grid-captions-${showCaptions}.html`;
  const previewOutput = `/private/tmp/curtain-grid-captions-${showCaptions}.preview.html`;
  const compositionPath = `/private/tmp/curtain-grid-captions-${showCaptions}.json`;
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name, directory, componentKey: key, content, settings }) => ({ name, directory, componentKey: key, content, settings }))
  };
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  return { result, html: result.status === 0 ? readFileSync(previewOutput, 'utf8') : '' };
}

test('curtain inspiration grid registers four independently linked images in the Campaign editor', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);

  assert.ok(entry, 'collection.curtainInspirationGrid4 must be registered');
  assert.equal(entry.中文名称, '窗帘灵感四宫格');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);

  for (const relativePath of Object.values(entry.路径)) {
    assert.equal(existsSync(`${root}/${relativePath}`), true, `missing ${relativePath}`);
  }
  for (const filename of [
    'assets/default-curtain-grid-1.png',
    'assets/default-curtain-grid-2.png',
    'assets/default-curtain-grid-3.png',
    'assets/default-curtain-grid-4.png',
    '效果演示.html'
  ]) {
    assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);
  }

  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const settingsDefaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  assert.deepEqual(Object.keys(contentSchema.properties), ['promotion.title', 'promotion.subtitle', ...imageFields]);
  for (const index of [1, 2, 3, 4]) {
    assert.equal(contentSchema.properties[`grid.image${index}.url`].protocol, 'https');
    assert.equal(contentSchema.properties[`grid.image${index}.clickUrl`].protocol, 'https');
    assert.equal(contentSchema.properties[`grid.image${index}.caption`].required, false);
    assert.equal(typeof fixture.values[`grid.image${index}.caption`], 'string');
    assert.equal(fixture.values[`grid.image${index}.url`], `asset://curtain-grid-${index}`);
    assert.match(template, new RegExp(`data-freshine-href-slot=\"grid\\.image${index}\\.clickUrl\"`));
    assert.match(template, new RegExp(`data-freshine-slot=\"grid\\.image${index}\\.caption\"`));
  }
  assert.match(template, /width="510"/);
  assert.match(template, /width="247"/);
  assert.match(template, /padding:52px 0 52px/);
  assert.match(template, /width:85%;max-width:510px/);
  assert.match(template, /font-family:\{\{settings\.font\.heading\}\};font-size:30px;font-size:min\(30px,5vw\);font-weight:500;line-height:38px;line-height:min\(38px,6\.333333vw\)/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:18px;font-size:min\(18px,3vw\);font-weight:500;line-height:27px;line-height:min\(27px,4\.5vw\)/);
  assert.equal(settingsSchema.properties['grid.showCaptions'].type, 'boolean');
  assert.equal(settingsDefaults.values['grid.showCaptions'], false);
  assert.match(template, /FRESHINE_IF_SETTING:grid\.showCaptions/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:16px;font-size:min\(16px,4\.267vw\);font-weight:500;line-height:22px/);
  assert.doesNotMatch(template, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['promotion.title', 'promotion.subtitle', ...imageFields],
    settings: ['grid.showCaptions', 'color.surface']
  });
});

test('curtain inspiration captions are omitted by default and rendered only when enabled', () => {
  const hidden = renderGrid(false);
  assert.equal(hidden.result.status, 0, hidden.result.stderr || hidden.result.stdout);
  assert.doesNotMatch(hidden.html, /Linen Roman Shades|grid\.image1\.caption|FRESHINE_IF_SETTING/);
  assert.equal((hidden.html.match(/colspan="3" height="16" style="height:16px;height:min\(16px,2\.666667vw\);font-size:0;line-height:0;"/g) ?? []).length, 1);

  const visible = renderGrid(true);
  assert.equal(visible.result.status, 0, visible.result.stderr || visible.result.stdout);
  for (const caption of ['Linen Roman Shades', 'Floral Roman Shades', 'Venetian Blinds', 'Bamboo Shades']) {
    assert.match(visible.html, new RegExp(caption));
  }
  assert.equal((visible.html.match(/colspan="3" height="16" style="height:16px;height:min\(16px,2\.666667vw\);font-size:0;line-height:0;"/g) ?? []).length, 2);
  assert.doesNotMatch(visible.html, /FRESHINE_IF_SETTING|FRESHINE_END_IF_SETTING/);
});
