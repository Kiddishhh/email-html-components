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
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy,
  styleKeysForStructure
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'navigation.eventCountdown';
const componentDirectory = resolve(root, '导航组件/活动倒计时导航');
const contentFields = [
  'countdown.title',
  'benefit.1.text',
  'benefit.2.text',
  'benefit.3.text',
  'promotion.cta.text',
  'promotion.cta.url'
];

test('event countdown navigation is selectable with complete editable defaults', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '活动倒计时导航',
    分类: '导航组件',
    componentKey,
    默认主题: 'event-countdown-navigation',
    默认变体: 'static-countdown-benefits-cta',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '导航组件/活动倒计时导航/component.template.v1.html',
      内容契约: '导航组件/活动倒计时导航/content.schema.v1.json',
      设置契约: '导航组件/活动倒计时导航/settings.schema.v1.json',
      默认测试数据: '导航组件/活动倒计时导航/content.fixture.v1.json',
      默认设置: '导航组件/活动倒计时导航/settings.defaults.v1.json',
      中文管理说明: '导航组件/活动倒计时导航/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '导航组件/活动倒计时导航/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });

  for (const relativePath of Object.values(entry.路径)) assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  assert.ok(existsSync(resolve(componentDirectory, '效果演示.html')));

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const component = catalog.find((candidate) => candidate.componentKey === componentKey);
  assert.ok(component, `${componentKey} must be selectable`);
  assert.deepEqual(styleKeysForStructure(catalog, '导航组件'), [
    'navigation.promotionCta',
    componentKey
  ]);
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: contentFields,
    settings: ['color.surface', 'color.text', 'color.action']
  });
  assert.equal(editorFieldCopy(componentKey, 'content', 'countdown.title').label, '倒计时标题');
  assert.equal(editorFieldCopy(componentKey, 'content', 'promotion.cta.url').label, '活动按钮链接');

  let document = createCampaignDocument({ name: '活动倒计时导航测试' });
  document = addComponentInstance(document, catalog, componentKey);
  const instance = document.components[0];
  assert.equal(instance.content['countdown.title'], 'ONLY 3 DAYS!');
  assert.equal(instance.content['benefit.1.text'], 'Free Gift On $699+');
  assert.equal(instance.content['benefit.2.text'], 'Free Gift On $999+');
  assert.equal(instance.content['benefit.3.text'], 'Free Shipping');
  assert.equal(instance.content['promotion.cta.text'], 'SHOP THE HOLIDAY SALE >>');
  assert.equal(instance.settings['color.surface'], '#F5F1ED');
  assert.equal(instance.settings['color.text'], '#1F1F1F');
  assert.equal(instance.settings['color.action'], '#8D1B1B');
});

test('event countdown navigation renders the approved 600px and proportional 375px geometry', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: '活动倒计时导航渲染测试' });
  document = addComponentInstance(document, catalog, componentKey);

  const temporary = mkdtempSync(resolve(tmpdir(), 'event-countdown-navigation-'));
  const output = resolve(temporary, 'email.html');
  const previewOutput = resolve(temporary, 'preview.html');
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    assets: {},
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
  assert.match(html, /class="freshine-event-countdown"[^>]*width="100%"[^>]*max-width:600px/);
  assert.match(html, /height="45"[^>]*height:45px;height:min\(45px,7\.5vw\)/);
  assert.match(html, /font-family:Lora,'Times New Roman',serif;font-size:30px;font-size:min\(30px,5vw\);font-weight:400;line-height:40px;line-height:min\(40px,6\.666667vw\);letter-spacing:0\.7px;letter-spacing:min\(0\.7px,0\.116667vw\)/);
  assert.match(html, /padding:0 27px 0 15px;padding:0 min\(27px,4\.5vw\) 0 min\(15px,2\.5vw\)/);
  assert.match(html, /font-size:18px;font-size:min\(18px,3vw\);font-weight:400;line-height:22px;line-height:min\(22px,3\.666667vw\)/);
  assert.equal((html.match(/width="1"[^>]*height="20"/g) ?? []).length, 2);
  assert.match(html, /width="334"[^>]*width:55\.666667%;max-width:334px/);
  assert.match(html, /background-color:#8D1B1B;border-radius:3px/);
  assert.match(html, /line-height:55px;line-height:min\(55px,9\.166667vw\)/);
  for (const text of ['ONLY 3 DAYS!', 'Free Gift On $699+', 'Free Gift On $999+', 'Free Shipping', 'SHOP THE HOLIDAY SALE &gt;&gt;']) {
    assert.ok(html.includes(text), text);
  }
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<script\b|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
});
