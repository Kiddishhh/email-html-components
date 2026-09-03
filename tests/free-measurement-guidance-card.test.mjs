import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'tool.freeMeasurementGuidance';
const directory = resolve(root, '赠品与权益组件/免费测量引导卡');

test('free measurement guidance is a selectable 600px benefit component with its approved editable fields', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, 'the supplied free-measurement guidance design must be registered independently');
  assert.equal(entry.中文名称, '免费测量引导卡');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: ['guide.title', 'guide.subtitle', 'guide.image.url', 'guide.image.alt', 'guide.image.clickUrl'],
    settings: ['color.surface', 'color.text']
  });
  assert.ok(existsSync(resolve(directory, 'assets/default-free-measurement-guidance-scene.png')));
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('free measurement guidance makes only the scene image a configurable UTM-tagged help-me-measure link', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'free-measurement-guidance' });
  document = addComponentInstance(document, catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['guide.title'], 'Not Sure Where to Start?');
  assert.equal(component.content['guide.subtitle'], 'No Worries. Get Free 24/7 Assistance From Our Team.');
  assert.equal(component.content['guide.image.url'], 'asset://free-measurement-guidance-scene');
  assert.match(component.content['guide.image.alt'], /measuring/i);
  assert.equal(component.content['guide.image.clickUrl'], 'https://freshinelife.com/pages/help-me-measure?utm_source=omnisend&utm_medium=email&utm_id=cover-rc');
  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  assert.match(assets['free-measurement-guidance-scene'].path, /赠品与权益组件\/免费测量引导卡\/assets\/default-free-measurement-guidance-scene\.png$/);
  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.match(template, /font-size:30px/);
  assert.match(template, /font-size:18px/);
  assert.match(template, /<a\b[^>]*href="\{\{content\.guide\.image\.clickUrl\}\}"/i);
  assert.doesNotMatch(template, /cta\./i);
});
