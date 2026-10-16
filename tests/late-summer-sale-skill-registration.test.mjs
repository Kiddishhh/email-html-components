import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addComponentInstance,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy,
  styleKeysForStructure
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const componentKey = 'hero.lateSummerSale';

test('Campaign editor loads the registered late-summer hero with its complete defaults and local assets', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);

  assert.deepEqual(entry, {
    中文名称: '夏末折扣促销首图',
    分类: '头图',
    componentKey,
    默认主题: 'late-summer-sale',
    默认变体: 'promotion-copy-room-image',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '头图/夏末折扣促销首图/component.template.v1.html',
      内容契约: '头图/夏末折扣促销首图/content.schema.v1.json',
      设置契约: '头图/夏末折扣促销首图/settings.schema.v1.json',
      默认测试数据: '头图/夏末折扣促销首图/content.fixture.v1.json',
      默认设置: '头图/夏末折扣促销首图/settings.defaults.v1.json',
      中文管理说明: '头图/夏末折扣促销首图/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '头图/夏末折扣促销首图/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });

  for (const relativePath of Object.values(entry.路径)) assert.equal(existsSync(`${root}/${relativePath}`), true, relativePath);
  assert.equal(existsSync(`${root}/头图/夏末折扣促销首图/效果演示.html`), true);

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.deepEqual(styleKeysForStructure(catalog, '头图'), [
    'hero.promotionalOverlay',
    'hero.countdownOverlay',
    'hero.countdownOverlay2',
    componentKey,
    'hero.gradientScenePromotion',
    'hero.circleLogoSceneOverlay',
    'hero.sceneOverlayCta',
    'hero.sceneOverlayCta2',
    'hero.romanShadeDiscount',
    'hero.couponSceneOverlay',
    'hero.minimalTitleCta', 'hero.countdownSceneCard'
  ]);

  let document = createCampaignDocument({ name: '夏末折扣促销首图注册测试' });
  document = addComponentInstance(document, catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['hero.image.url'], 'asset://late-summer-room');
  assert.equal(component.settings['image.maxWidth'], '542px');
  assert.equal(component.settings['image.height'], '527px');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  assert.match(assets['late-summer-logo'].path, /头图\/夏末折扣促销首图\/assets\/default-logo-brown\.png$/u);
  assert.match(assets['late-summer-room'].path, /头图\/夏末折扣促销首图\/assets\/default-room\.png$/u);
});

test('Campaign editor exposes the confirmed late-summer content and common color fields', () => {
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: [
      'promotion.text', 'promotion.linkText', 'promotion.url',
      'brand.logo.url', 'brand.logo.alt', 'brand.logo.clickUrl',
      'hero.eyebrow', 'hero.title', 'hero.subtitle',
      'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl',
      'hero.cta.text', 'hero.cta.url'
    ],
    settings: [
      'navigation.visible',
      'color.surface', 'color.promotionLeft', 'color.promotionRight',
      'color.heading', 'color.body', 'color.action'
    ]
  });

  assert.deepEqual(editorFieldCopy(componentKey, 'content', 'hero.image.clickUrl'), {
    label: '主图点击链接',
    help: '点击主图后打开的活动页面地址。'
  });
  assert.deepEqual(editorFieldCopy(componentKey, 'content', 'brand.logo.clickUrl'), {
    label: '品牌 Logo 点击链接',
    help: '点击顶部品牌 Logo 后打开的页面地址。'
  });
  assert.deepEqual(editorFieldCopy(componentKey, 'content', 'brand.logo.url'), {
    label: '品牌 Logo 图片',
    help: '替换夏末折扣首图顶部使用的品牌 Logo 图片。'
  });
  assert.deepEqual(editorFieldCopy(componentKey, 'settings', 'color.heading'), {
    label: '标题文字色',
    help: '修改活动名称和主折扣标题的文字颜色。'
  });
  assert.deepEqual(editorFieldCopy(componentKey, 'settings', 'color.body'), {
    label: '正文文字色',
    help: '修改活动补充说明的文字颜色。'
  });
});

test('Campaign Skill documentation treats the late-summer hero as a free-composition editor component', () => {
  const skill = readFileSync(`${root}/skills/build-omnisend-campaign-draft/SKILL.md`, 'utf8');
  const interactions = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`, 'utf8');
  const workflow = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md`, 'utf8');
  const management = readFileSync(`${root}/头图/夏末折扣促销首图/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');

  assert.match(skill, /component-interactions\.zh-CN\.md/);
  for (const document of [interactions, management]) assert.match(document, /hero\.lateSummerSale/);
  assert.match(workflow, /四款头图/);
  assert.match(interactions, /可编辑/);
  assert.match(interactions, /542×527px/);
  assert.match(management, /已注册到 `组件清单\.json`/);
  assert.doesNotMatch(management, /暂不写入/);
  assert.doesNotThrow(() => editableFieldKeys('hero.lateSummerSale'));
});
