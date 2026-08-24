import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const componentKey = 'collection.curtainEditorialTriptych';
const directory = `${root}/活动商品组件/窗帘场景三图卡`;
const contentFields = [
  'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl',
  'pair.left.url', 'pair.left.alt', 'pair.left.clickUrl', 'pair.left.caption',
  'pair.right.url', 'pair.right.alt', 'pair.right.clickUrl', 'pair.right.caption',
  'intro.title', 'intro.subtitle'
];

function renderTriptych() {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: 'curtain-editorial-triptych' });
  document = addComponentInstance(document, catalog, componentKey);
  const output = '/private/tmp/curtain-editorial-triptych.html';
  const previewOutput = '/private/tmp/curtain-editorial-triptych.preview.html';
  const compositionPath = '/private/tmp/curtain-editorial-triptych.json';
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name, directory: itemDirectory, componentKey: key, content, settings }) => ({ name, directory: itemDirectory, componentKey: key, content, settings }))
  };
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), compositionPath, '--preview-local-assets'], { cwd: root, encoding: 'utf8' });
  return { result, html: result.status === 0 ? readFileSync(previewOutput, 'utf8') : '' };
}

test('curtain editorial triptych registers the reference-faithful three-image composition', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);

  assert.ok(entry, 'collection.curtainEditorialTriptych must be registered');
  assert.equal(entry.中文名称, '窗帘场景三图卡');
  assert.equal(entry.分类, '活动商品组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  for (const relativePath of Object.values(entry.路径)) assert.equal(existsSync(`${root}/${relativePath}`), true, `missing ${relativePath}`);
  for (const filename of ['assets/default-curtain-editorial-hero.jpg', 'assets/default-curtain-editorial-left.jpg', 'assets/default-curtain-editorial-right.jpg', '效果演示.html']) assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);

  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const settingsDefaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  assert.deepEqual(Object.keys(contentSchema.properties), contentFields);
  for (const key of ['hero.image.url', 'hero.image.clickUrl', 'pair.left.url', 'pair.left.clickUrl', 'pair.right.url', 'pair.right.clickUrl']) assert.equal(contentSchema.properties[key].protocol, 'https');
  assert.equal(fixture.values['hero.image.url'], 'asset://curtain-editorial-hero');
  assert.equal(fixture.values['pair.left.url'], 'asset://curtain-editorial-left');
  assert.equal(fixture.values['pair.right.url'], 'asset://curtain-editorial-right');
  assert.equal(settingsSchema.properties['color.surface'].default, '#FBFAF8');
  assert.equal(settingsSchema.properties['font.heading'].default, 'Montserrat, Arial, Helvetica, sans-serif');
  assert.equal(settingsDefaults.values['font.heading'], 'Montserrat, Arial, Helvetica, sans-serif');
  assert.match(template, /width="538" height="536"/);
  assert.match(template, /width="256" height="319"/);
  assert.match(template, /width:89\.667%;max-width:538px/);
  assert.match(template, /width:87\.333%;max-width:524px/);
  assert.match(template, /width="12"/);
  assert.match(template, /font-family:\{\{settings\.font\.heading\}\};font-size:30px;font-size:min\(30px,6\.933vw\);font-weight:500;line-height:150%;letter-spacing:0px;text-align:center/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:16px;font-size:min\(16px,3\.733vw\);font-weight:500;line-height:150%;letter-spacing:0px;text-align:center/);
  assert.doesNotMatch(template, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b/i);
  assert.deepEqual(editableFieldKeys(componentKey), { content: contentFields, settings: ['color.surface'] });
});

test('curtain editorial triptych renders independent links and the reference copy in a local preview', () => {
  const rendered = renderTriptych();
  assert.equal(rendered.result.status, 0, rendered.result.stderr || rendered.result.stdout);
  assert.match(rendered.html, /Sunlit dining room with Liana sheer curtains/);
  assert.match(rendered.html, /Mira Solid Sheer Curtains &gt;&gt;/);
  assert.match(rendered.html, /Semi-Sheer Curtains &gt;&gt;/);
  assert.match(rendered.html, /Dining Room/);
  assert.match(rendered.html, /From Warm Ivories To Deep Charcoals/);
  for (const url of ['https://freshinelife.com/collections/sheer-curtains', 'https://freshinelife.com/collections/solid-sheer-curtains', 'https://freshinelife.com/collections/semi-sheer-curtains']) assert.match(rendered.html, new RegExp(url));
  assert.doesNotMatch(rendered.html, /asset:\/\/|\{\{/);
});

test('curtain editorial triptych demo centers its 600px canvas and internal content tables', () => {
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');

  assert.match(demo, /width="600"[^>]+align="center"[^>]+max-width:600px[^>]+margin:0 auto/);
  assert.equal((demo.match(/width="538"[^>]+align="center"[^>]+max-width:538px[^>]+margin:0 auto/g) ?? []).length, 2);
  assert.match(demo, /width="524"[^>]+align="center"[^>]+max-width:524px[^>]+margin:0 auto/);
});

test('curtain editorial triptych demo uses the approved centered Montserrat Medium title styles', () => {
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');

  assert.match(demo, /Dining Room<\/span>.*font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;font-size:min\(16px,3\.733vw\);font-weight:500;line-height:150%;letter-spacing:0px;text-align:center/s);
  assert.match(demo, /font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:30px;font-size:min\(30px,6\.933vw\);font-weight:500;line-height:150%;letter-spacing:0px;text-align:center;[^>]*>Dining Room/);
});

test('curtain editorial triptych adds a responsive divider below the intro copy', () => {
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');

  const divider = /<td height="36"[^>]*>[\s\S]*?width="524"[^>]+align="center"[^>]+width:87\.333%;max-width:524px[^>]+margin:0 auto[\s\S]*?height="1"[^>]+bgcolor="#E2DEDB"[^>]+height:1px[^>]+background-color:#E2DEDB[\s\S]*?<td height="37"/;
  assert.match(template, /data-freshine-slot="intro\.subtitle"[\s\S]*?<\/span>[\s\S]*?<td height="36"/);
  assert.match(template, divider);
  assert.match(demo, /That Feels Right For Your Space\.<\/span>[\s\S]*?<td height="36"/);
  assert.match(demo, divider);
});

test('curtain editorial triptych is documented as an HTML editor component with current responsive rules', () => {
  const interactions = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`, 'utf8');
  const editorCatalog = buildEditorCatalog({ workspaceRoot: root });

  assert.ok(editorCatalog.some((item) => item.componentKey === componentKey));
  assert.match(interactions, /collection\.curtainEditorialTriptych[\s\S]*?HTML 编辑器[\s\S]*?Montserrat `30px \/ 500（Medium） \/ 150%`[\s\S]*?Montserrat `16px \/ 500 \/ 150%`[\s\S]*?#E2DEDB[\s\S]*?375px[\s\S]*?26px[\s\S]*?14px/);
});
