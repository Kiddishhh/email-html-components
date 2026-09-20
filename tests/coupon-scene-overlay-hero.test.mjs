import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildEditorCatalog, createCampaignDocument, addComponentInstance } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { editableFieldKeys, editorFieldCopy } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentDirectory = resolve(root, '头图/优惠券场景叠层头图');
const ctaUrl = 'https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=cover-fs';
const componentKey = 'hero.couponSceneOverlay';
const contentFields = [
  'navigation.message', 'navigation.cta.text', 'navigation.cta.url',
  'intro.title', 'intro.subtitle',
  'offer.image.url', 'offer.image.alt',
  'hero.image.url', 'hero.image.alt',
  'cta.text', 'cta.url'
];

test('coupon scene overlay is selectable in the hero catalog with its confirmed field contract', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.deepEqual(entry, {
    中文名称: '优惠券场景叠层头图',
    分类: '头图',
    componentKey,
    默认主题: 'coupon-scene-overlay',
    默认变体: 'promo-bar-centered-copy-coupon-cta-overlap-scene',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '头图/优惠券场景叠层头图/component.template.v1.html',
      内容契约: '头图/优惠券场景叠层头图/content.schema.v1.json',
      设置契约: '头图/优惠券场景叠层头图/settings.schema.v1.json',
      默认测试数据: '头图/优惠券场景叠层头图/content.fixture.v1.json',
      默认设置: '头图/优惠券场景叠层头图/settings.defaults.v1.json',
      中文管理说明: '头图/优惠券场景叠层头图/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '头图/优惠券场景叠层头图/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.ok(catalog.find((item) => item.componentKey === componentKey), 'the component must be selectable under 头图');
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: contentFields,
    settings: ['navigation.visible', 'color.surface', 'color.promotion', 'color.heading', 'color.body', 'color.action']
  });
  assert.deepEqual(editorFieldCopy(componentKey, 'content', 'cta.url'), {
    label: '主 CTA 链接',
    help: '点击 SHOP NOW 后打开的公开 HTTPS 活动页。'
  });

  const document = addComponentInstance(createCampaignDocument({ name: '优惠券场景叠层头图编辑器测试' }), catalog, componentKey);
  assert.equal(document.components[0].content['cta.url'], ctaUrl);
  assert.equal(document.components[0].settings['color.body'], '#7C706A');
});

test('coupon scene overlay fixture retains the supplied coupon and room source assets', () => {
  const fixturePath = resolve(componentDirectory, 'content.fixture.v1.json');
  assert.ok(existsSync(fixturePath), 'the component must provide a local-preview fixture');

  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const defaults = JSON.parse(readFileSync(resolve(componentDirectory, 'settings.defaults.v1.json'), 'utf8'));
  assert.deepEqual(fixture.localReferenceAssets, {
    'coupon-scene-offer': 'assets/default-coupon.png',
    'coupon-scene-room': 'assets/default-room.png'
  });
  assert.equal(fixture.values['cta.url'], ctaUrl);
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.ok(existsSync(resolve(componentDirectory, relativePath)), `${relativePath} must be retained for local preview`);
  }
  assert.equal(defaults.values['color.body'], '#7C706A');
});

test('coupon scene overlay renders the specified desktop type system and proportional mobile structure', () => {
  const fixture = JSON.parse(readFileSync(resolve(componentDirectory, 'content.fixture.v1.json'), 'utf8'));
  const temporary = mkdtempSync(resolve(tmpdir(), 'coupon-scene-overlay-'));
  const previewOutput = resolve(temporary, 'preview.html');
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#F5F2ED',
      outerBackgroundColor: '#F5F2ED',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: resolve(temporary, 'email.html'),
    previewOutput,
    assets: {
      'coupon-scene-offer': { path: '头图/优惠券场景叠层头图/assets/default-coupon.png', name: 'default-coupon.png' },
      'coupon-scene-room': { path: '头图/优惠券场景叠层头图/assets/default-room.png', name: 'default-room.png' }
    },
    components: [{
      name: '优惠券场景叠层头图',
      directory: componentDirectory,
      componentKey: 'hero.couponSceneOverlay',
      content: fixture.values,
      settings: {
        'navigation.visible': true,
        'color.surface': '#F5F2ED',
        'color.promotion': '#955A34',
        'color.promotionText': '#FFFFFF',
        'color.heading': '#252324',
        'color.body': '#7C706A',
        'color.action': '#9A5A33',
        'color.actionText': '#FFFFFF'
      }
    }]
  };
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify(composition));

  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /height="56"[\s\S]*?font-size:16px;font-size:min\(16px,2\.666667vw\);font-weight:500;line-height:20px;line-height:min\(20px,3\.333333vw\);letter-spacing:0px;text-align:center;white-space:nowrap/);
  assert.match(html, /font-size:36px;font-size:min\(36px,6vw\);font-weight:500;line-height:54px;line-height:min\(54px,9vw\);letter-spacing:0px;text-align:center/);
  assert.match(html, /color:#7C706A;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;font-size:min\(16px,2\.666667vw\);font-weight:500;line-height:24px;line-height:min\(24px,4vw\);letter-spacing:0px;text-align:center/);
  assert.match(html, /src="[^\"]*default-coupon\.png"[^>]*width="528"/);
  assert.match(html, /class="freshine-coupon-scene-room"[^>]*width="528" height="528"/);
  assert.match(html, /font-size:20px;font-size:min\(20px,3\.333333vw\);font-weight:600;line-height:24px;line-height:min\(24px,4vw\);letter-spacing:0px;text-align:center/);
  assert.match(html, /margin:-28px auto 0/);
  assert.match(html, /margin:max\(-28px,-4\.666667vw\) auto 0/);
  assert.ok(html.includes('Fall Home Refresh'));
  assert.ok(html.includes(ctaUrl.replaceAll('&', '&amp;')));
  assert.ok(html.includes('From Warm Ivories To Deep Charcoals, Find The Neutral That Feels Right For Your Space.'));
  assert.doesNotMatch(html, /asset:\/\/|\{\{|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
});

test('coupon scene overlay demo renders the real fixture for visual review before editor registration', () => {
  const result = spawnSync(process.execPath, [resolve(componentDirectory, 'render-demo.mjs')], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const demoPath = resolve(componentDirectory, '效果演示.html');
  assert.ok(existsSync(demoPath), 'the reviewable component demo must be generated');
  const html = readFileSync(demoPath, 'utf8');
  assert.match(html, /Freshine Email Local Preview/);
  assert.match(html, /<body style="margin:0;padding:0;background-color:#FFFFFF;">/);
  assert.ok(html.includes('Fall Home Refresh'));
  assert.ok(html.includes('default-room.png'));
});
