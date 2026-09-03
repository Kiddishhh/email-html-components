import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
const componentKey = 'hero.circleLogoSceneOverlay';
const componentDirectory = resolve(root, '头图/圆标场景叠字头图');
const clickUrl = 'https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc';
const approvedLogoSha256 = '65fb8f34f185949c9f9614d2ff66d3a7ac1249499f0b8384098c070943cb589c';
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

test('circle-logo scene-overlay hero is selectable with the approved editable contract', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '圆标场景叠字头图',
    分类: '头图',
    componentKey,
    默认主题: 'circle-logo-scene-overlay',
    默认变体: 'full-click-top-circle-logo-bottom-copy',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '头图/圆标场景叠字头图/component.template.v1.html',
      内容契约: '头图/圆标场景叠字头图/content.schema.v1.json',
      设置契约: '头图/圆标场景叠字头图/settings.schema.v1.json',
      默认测试数据: '头图/圆标场景叠字头图/content.fixture.v1.json',
      默认设置: '头图/圆标场景叠字头图/settings.defaults.v1.json',
      中文管理说明: '头图/圆标场景叠字头图/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '头图/圆标场景叠字头图/component.styles.v1.css'
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
    settings: ['color.surface', 'color.text']
  });
  assert.equal(editorFieldCopy(componentKey, 'content', 'hero.linkUrl').label, '整张头图点击链接');
  assert.equal(editorFieldCopy(componentKey, 'content', 'brand.logo.url').label, '圆形 Logo 图片');

  const fixture = JSON.parse(readFileSync(resolve(componentDirectory, 'content.fixture.v1.json'), 'utf8'));
  assert.equal(fixture.values['hero.linkUrl'], clickUrl);
  assert.equal(fixture.values['hero.eyebrow'], 'Labor Day Sale');
  assert.equal(fixture.values['hero.title'], 'UP TO 65% Off');
  assert.equal(fixture.values['hero.subtitle'], 'EXTRA $600OFF&UP TO 20%OFF SITEWIDE');
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.ok(existsSync(resolve(componentDirectory, relativePath)), relativePath);
  }
  const logoPath = resolve(componentDirectory, fixture.localReferenceAssets['circle-logo-scene-logo']);
  assert.equal(createHash('sha256').update(readFileSync(logoPath)).digest('hex'), approvedLogoSha256);
});

test('circle-logo scene-overlay hero renders the reference geometry and email-safe behavior', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '圆标场景叠字头图测试' });
  document = addComponentInstance(document, catalog, componentKey);

  const temporary = mkdtempSync(resolve(tmpdir(), 'circle-logo-scene-overlay-'));
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
  assert.match(html, /class="freshine-circle-logo-scene-background"[^>]*width="600" height="761"/);
  assert.match(html, /height:761px;height:min\(761px,126\.833333vw\)/);
  assert.match(html, /background-position:center top/);
  assert.match(html, /background-size:cover/);
  assert.doesNotMatch(html, /linear-gradient\(/);
  assert.match(html, /padding-top:60px;padding-top:min\(60px,10vw\)/);
  assert.match(html, /width="120" height="120"[^>]*width:120px;width:min\(120px,20vw\)/);
  assert.match(html, /font-size:36px;font-size:min\(36px,6vw\)[^>]*line-height:46px;line-height:min\(46px,7\.666667vw\)/);
  assert.match(html, /font-size:66px;font-size:min\(66px,11vw\)[^>]*font-weight:700[^>]*line-height:80px;line-height:min\(80px,13\.333333vw\)/);
  assert.match(html, /width="410"[^>]*width:410px;width:min\(410px,68\.333333vw\)/);
  assert.match(html, /font-size:19px;font-size:min\(19px,3\.166667vw\)[^>]*line-height:31px;line-height:min\(31px,5\.166667vw\)/);
  for (const text of ['Labor Day Sale', 'UP TO 65% Off', 'EXTRA $600OFF&amp;UP TO 20%OFF SITEWIDE']) {
    assert.ok(html.includes(text), text);
  }
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b|<script\b|<iframe\b/i);
});
