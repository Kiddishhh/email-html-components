import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'collection.romanShadeMultiRecommendation';
const directory = resolve(root, '活动商品组件/三图推荐（CTA+标题）');
const tracked = {
  hero: 'https://freshinelife.com/collections/roman-shades/products/elara-no-drill-linen-blend-roman-shades?utm_source=omnisend&utm_medium=email&utm_id=cover-rc',
  left: 'https://freshinelife.com/collections/all-shades-blinds/products/elyna-smart-motorized-60-light-filtering-roller-shades?utm_source=omnisend&utm_medium=email&utm_id=cover-rc',
  right: 'https://freshinelife.com/collections/all-shades-blinds/products/celina-smart-motorized-linen-roman-shade?utm_source=omnisend&utm_medium=email&utm_id=cover-rc',
  cta: 'https://freshinelife.com/collections/roman-shades?utm_source=omnisend&utm_medium=email&utm_id=cover-rc'
};
const contentFields = [
  'intro.title', 'intro.subtitle',
  'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl', 'hero.discountLabel',
  'pair.left.image.url', 'pair.left.image.alt', 'pair.left.image.clickUrl', 'pair.left.discountLabel',
  'pair.right.image.url', 'pair.right.image.alt', 'pair.right.image.clickUrl', 'pair.right.discountLabel',
  'cta.text', 'cta.url'
];

test('Roman shade multi-recommendation is a selectable 600px component with the approved editable contract', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, 'the approved three-image Roman shade component must be registered');
  assert.equal(entry.中文名称, '三图推荐（CTA+标题）');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  for (const relativePath of Object.values(entry.路径)) assert.ok(existsSync(resolve(root, relativePath)), relativePath);
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: contentFields,
    settings: ['color.surface', 'color.text', 'color.discount', 'color.cta']
  });
});

test('Roman shade multi-recommendation renders supplied sources, separate tracked links and responsive email-safe layout', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'roman-shade-multi-recommendation' });
  document = addComponentInstance(document, catalog, componentKey);
  const temporary = mkdtempSync(resolve(tmpdir(), 'roman-shade-multi-recommendation-'));
  const output = resolve(temporary, 'email.html');
  const previewOutput = resolve(temporary, 'preview.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    components: document.components.map(({ name, directory: componentDirectory, componentKey: key, content, settings }) => ({ name, directory: componentDirectory, componentKey: key, content, settings }))
  }));
  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  for (const url of Object.values(tracked)) assert.match(html, new RegExp(url.replaceAll('&', '&amp;').replace(/[.?]/gu, '\\$&')));
  for (const label of ['SAVE 33%', 'SAVE 35%', 'SAVE 50%']) assert.match(html, new RegExp(label));
  assert.match(html, /Custom-Made Roman Shades/);
  for (const imageUrl of ['https://app.omnisend.com/images/6a90ffbcbb7c87eee29c65d7', 'https://app.omnisend.com/images/6a9100229b5e376dc52c4d0c', 'https://app.omnisend.com/images/6a91042bbb7c87eee29c662f']) assert.match(html, new RegExp(imageUrl.replace(/[.?]/gu, '\\$&')));
  assert.match(html, /width="536"/);
  assert.match(html, /width="256"/);
  assert.match(html, /width="20"/);
  assert.match(html, /width:min\(536px,89\.333333vw\)/);
  assert.match(html, /<tr><td height="25" style="height:25px;height:min\(25px,4\.166667vw\);font-size:0;line-height:0;">&nbsp;<\/td><\/tr>\s*<tr><td align="center" style="padding:0;text-align:center;">\s*<table role="presentation" width="536"/, 'the intro-to-hero spacer must preserve the approved 25px breathing room');
  const ctaStyle = html.match(/<a[^>]*data-freshine-href-slot="cta\.url"[^>]*style="([^"]*)"/)?.[1];
  assert.ok(ctaStyle, 'the bottom CTA must remain a separately tracked anchor');
  assert.match(ctaStyle, /font-size:18px;font-size:min\(18px,4\.8vw\)/, 'the CTA must retain the reference-sized single-line label at desktop and mobile widths');
  assert.match(ctaStyle, /white-space:nowrap/, 'the approved CTA copy must remain on one line at 375px');
  assert.doesNotMatch(html, /<style\b|<script\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|\{\{/i);
});
