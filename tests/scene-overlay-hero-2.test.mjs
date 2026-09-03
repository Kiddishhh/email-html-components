import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  addComponentInstance,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'hero.sceneOverlayCta2';
const componentDirectory = resolve(root, '头图/场景文字叠层头图2');
const contentFields = [
  'navigation.message',
  'navigation.cta.text',
  'navigation.cta.url',
  'hero.backgroundImage.url',
  'hero.backgroundImage.alt',
  'hero.linkUrl',
  'brand.logo.url',
  'brand.logo.alt',
  'hero.eyebrow',
  'hero.title',
  'hero.subtitle'
];
const settingsFields = [
  'navigation.visible',
  'color.navigationLeft',
  'color.navigationRight',
  'color.navigationText',
  'color.surface',
  'color.text'
];

test('scene-overlay hero 2 is selectable with the approved editable contract', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);

  assert.deepEqual(entry, {
    中文名称: '场景文字叠层头图2',
    分类: '头图',
    componentKey,
    默认主题: 'labor-day-scene-overlay',
    默认变体: 'split-navigation-full-click-sale-scene',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '头图/场景文字叠层头图2/component.template.v1.html',
      内容契约: '头图/场景文字叠层头图2/content.schema.v1.json',
      设置契约: '头图/场景文字叠层头图2/settings.schema.v1.json',
      默认测试数据: '头图/场景文字叠层头图2/content.fixture.v1.json',
      默认设置: '头图/场景文字叠层头图2/settings.defaults.v1.json',
      中文管理说明: '头图/场景文字叠层头图2/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '头图/场景文字叠层头图2/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });
  for (const relativePath of Object.values(entry.路径)) {
    assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  }
  assert.ok(existsSync(resolve(componentDirectory, '效果演示.html')));

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.ok(catalog.some((candidate) => candidate.componentKey === componentKey));
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: contentFields,
    settings: settingsFields
  });
  assert.equal(editorFieldCopy(componentKey, 'content', 'navigation.message').label, '导航促销文案');
  assert.equal(editorFieldCopy(componentKey, 'content', 'hero.linkUrl').label, '整张头图点击链接');
});

test('scene-overlay hero 2 renders the approved Labor Day geometry and email-safe links', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '场景文字叠层头图2 测试' });
  document = addComponentInstance(document, catalog, componentKey);
  const temporary = mkdtempSync(resolve(tmpdir(), 'scene-overlay-hero-2-'));
  const previewOutput = resolve(temporary, 'preview.html');
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output: resolve(temporary, 'email.html'),
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name, directory, componentKey: key, content, settings }) => ({ name, directory, componentKey: key, content, settings }))
  };
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify(composition));
  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /class="freshine-scene-overlay-hero-2-navigation"/);
  assert.match(html, /height="56"[\s\S]*?height:min\(56px,9\.333333vw\)/);
  assert.match(html, /width="456" height="56"/);
  assert.match(html, /width="144" height="56"/);
  assert.match(html, /class="freshine-scene-overlay-hero-2-background"[^>]*width="600" height="632"/);
  assert.match(html, /height:632px;height:min\(632px,105\.333333vw\)/);
  assert.match(html, /background-position:center top/);
  assert.match(html, /background-size:cover/);
  assert.match(html, /linear-gradient\(180deg,rgba\(15,10,7,0\.05\) 0%,rgba\(15,10,7,0\.10\) 42%,rgba\(15,10,7,0\.28\) 100%\)/);
  assert.match(html, /width="104" height="104"[^>]*width:104px;width:min\(104px,17\.333333vw\)/);
  assert.match(html, /font-family:Lora,Georgia,'Times New Roman',serif;font-size:39px;font-size:min\(39px,6\.5vw\)/);
  assert.match(html, /font-size:62px;font-size:min\(62px,10\.333333vw\)[^>]*font-weight:800/);
  assert.match(html, /width="410"[^>]*width:410px;width:min\(410px,68\.333333vw\)/);
  assert.ok(html.includes('Unlock An Extra 15% Off Your First Order At Freshine'));
  assert.ok(html.includes('Labor Day Sale'));
  assert.ok(html.includes('UP TO 65% Off'));
  assert.ok(html.includes('EXTRA $600OFF&amp;UP TO 20%OFF SITEWIDE'));
  assert.ok(html.includes('utm_source=omnisend&amp;utm_medium=email&amp;utm_id=cover-fc'));
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b|<script\b|<iframe\b/i);
});

test('scene-overlay hero 2 is documented as a separately managed component', () => {
  assert.ok(existsSync(resolve(componentDirectory, 'COMPONENT_MANAGEMENT.zh-CN.v1.md')));
  assert.match(readFileSync(resolve(root, '组件索引.md'), 'utf8'), /场景文字叠层头图2/);
  assert.match(
    readFileSync(resolve(root, 'skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md'), 'utf8'),
    /hero\.sceneOverlayCta2/
  );
});
