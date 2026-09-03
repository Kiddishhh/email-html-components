import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
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
const componentKey = 'hero.gradientScenePromotion';
const componentDirectory = resolve(root, '头图/渐变场景活动头图');
const clickUrl = 'https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_campaign=late_summer_sale&utm_content=hero';
const contentFields = [
  'hero.backgroundImage.url',
  'hero.backgroundImage.alt',
  'hero.linkUrl',
  'brand.logo.url',
  'brand.logo.alt',
  'hero.eyebrow',
  'hero.title',
  'hero.subtitle'
];

test('gradient scene promotion hero is independently registered with complete editor defaults', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '渐变场景活动头图',
    分类: '头图',
    componentKey,
    默认主题: 'gradient-scene-promotion',
    默认变体: 'full-click-background-logo-copy',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '头图/渐变场景活动头图/component.template.v1.html',
      内容契约: '头图/渐变场景活动头图/content.schema.v1.json',
      设置契约: '头图/渐变场景活动头图/settings.schema.v1.json',
      默认测试数据: '头图/渐变场景活动头图/content.fixture.v1.json',
      默认设置: '头图/渐变场景活动头图/settings.defaults.v1.json',
      中文管理说明: '头图/渐变场景活动头图/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '头图/渐变场景活动头图/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });

  for (const relativePath of Object.values(entry.路径)) assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  assert.ok(existsSync(resolve(componentDirectory, '效果演示.html')));

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const component = catalog.find((candidate) => candidate.componentKey === componentKey);
  assert.ok(component, `${componentKey} must be selectable`);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: contentFields,
    settings: ['color.surface', 'color.text']
  });
  assert.equal(editorFieldCopy(componentKey, 'content', 'hero.linkUrl').label, '整张头图点击链接');
  assert.equal(editorFieldCopy(componentKey, 'content', 'hero.backgroundImage.url').label, '场景背景图');

  const fixture = JSON.parse(readFileSync(resolve(componentDirectory, 'content.fixture.v1.json'), 'utf8'));
  assert.equal(fixture.values['hero.linkUrl'], clickUrl);
  assert.equal(fixture.values['hero.eyebrow'], 'Late Summer Sale');
  assert.equal(fixture.values['hero.title'], 'UP TO 70% Off');
  assert.equal(fixture.values['hero.subtitle'], 'EXTRA $600OFF&UP TO 20%OFF SITEWIDE');
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.ok(existsSync(resolve(componentDirectory, relativePath)), relativePath);
  }
});

test('gradient scene promotion hero renders the approved 600px and proportional 375px geometry', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '渐变场景活动头图测试' });
  document = addComponentInstance(document, catalog, componentKey);

  const temporary = mkdtempSync(resolve(tmpdir(), 'gradient-scene-promotion-'));
  const previewOutput = resolve(temporary, 'preview.html');
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output: resolve(temporary, 'email.html'),
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name, directory, componentKey: key, content, settings }) => ({
      name,
      directory,
      componentKey: key,
      content,
      settings
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
  assert.match(html, /data-freshine-href-slot="hero\.linkUrl"/);
  assert.ok(html.includes(clickUrl.replaceAll('&', '&amp;')));
  assert.match(html, /class="freshine-gradient-scene-background"[^>]*width="600" height="761"/);
  assert.match(html, /height:761px;height:min\(761px,126\.833333vw\)/);
  assert.match(html, /linear-gradient\(180deg,rgba\(251,250,248,0\) 44\.7%,rgba\(251,250,248,0\.85\) 82\.5%,#FBFAF8 100%\)/);
  assert.match(html, /background-position:50\.310559% top/);
  assert.match(html, /padding-top:370px;padding-top:min\(370px,61\.666667vw\)/);
  assert.match(html, /width="97" height="97"[^>]*width:97px;width:min\(97px,16\.166667vw\)/);
  assert.match(html, /font-size:30px;font-size:min\(30px,5vw\)[^>]*line-height:38px;line-height:min\(38px,6\.333333vw\)/);
  assert.match(html, /font-size:66px;font-size:min\(66px,11vw\)[^>]*line-height:80px;line-height:min\(80px,13\.333333vw\)/);
  assert.match(html, /font-size:19px;font-size:min\(19px,3\.166667vw\)[^>]*line-height:23px;line-height:min\(23px,3\.833333vw\)/);
  for (const text of ['Late Summer Sale', 'UP TO 70% Off', 'EXTRA $600OFF&amp;UP TO 20%OFF SITEWIDE']) {
    assert.ok(html.includes(text), text);
  }
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
});
