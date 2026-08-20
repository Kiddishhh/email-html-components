import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const directory = `${root}/头图/夏末折扣促销首图`;
const builder = `${root}/build-email-template.v1.mjs`;

function readJson(filename) {
  return JSON.parse(readFileSync(`${directory}/${filename}`, 'utf8'));
}

function makeComposition(name, mutate = () => {}) {
  const fixture = readJson('content.fixture.v1.json');
  const defaults = readJson('settings.defaults.v1.json');
  const outputDirectory = mkdtempSync(join(tmpdir(), `${name}-`));
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#F3EFE8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: `${outputDirectory}/output.html`,
    previewOutput: `${outputDirectory}/preview.html`,
    assets: Object.fromEntries(Object.entries(fixture.localReferenceAssets).map(([id, path]) => [id, {
      path: `头图/夏末折扣促销首图/${path}`,
      name: path.split('/').at(-1)
    }])),
    components: [{
      name: '夏末折扣促销首图',
      directory,
      componentKey: 'hero.lateSummerSale',
      content: { ...fixture.values },
      settings: { ...defaults.values }
    }]
  };
  mutate(composition);
  const path = `${outputDirectory}/composition.json`;
  writeFileSync(path, JSON.stringify(composition, null, 2));
  return { composition, path };
}

function run(path, ...args) {
  return spawnSync(process.execPath, [builder, path, ...args], { cwd: root, encoding: 'utf8' });
}

test('late summer sale hero exposes replaceable campaign content and preserves the 600px reference geometry', () => {
  for (const filename of [
    'component.template.v1.html',
    'component.styles.v1.css',
    'content.schema.v1.json',
    'content.fixture.v1.json',
    'settings.schema.v1.json',
    'settings.defaults.v1.json',
    'COMPONENT_MANAGEMENT.zh-CN.v1.md',
    '效果演示.html',
    'assets/default-room.png',
    'assets/default-logo-brown.png'
  ]) {
    assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);
  }

  const contentSchema = readJson('content.schema.v1.json');
  const settingsSchema = readJson('settings.schema.v1.json');
  const fixture = readJson('content.fixture.v1.json');
  const defaults = readJson('settings.defaults.v1.json');

  assert.equal(contentSchema.componentKey, 'hero.lateSummerSale');
  assert.equal(settingsSchema.componentKey, 'hero.lateSummerSale');
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'promotion.text', 'promotion.linkText', 'promotion.url',
    'brand.logo.url', 'brand.logo.alt', 'brand.logo.clickUrl',
    'hero.eyebrow', 'hero.title', 'hero.subtitle',
    'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl',
    'hero.cta.text', 'hero.cta.url'
  ]);
  assert.equal(contentSchema.properties['hero.image.url'].role, 'background-image-source');
  assert.equal(contentSchema.properties['hero.image.url'].skillPrompt, true);
  assert.equal(contentSchema.properties['hero.image.clickUrl'].role, 'link-target');
  assert.equal(fixture.values['hero.image.url'], 'asset://late-summer-room');
  assert.equal(fixture.localReferenceAssets['late-summer-room'], 'assets/default-room.png');
  assert.equal(defaults.values['content.maxWidth'], '600px');
  assert.equal(defaults.values['image.maxWidth'], '542px');
  assert.equal(defaults.values['image.height'], '527px');
  assert.equal(defaults.values['cta.maxWidth'], '275px');
  assert.equal(defaults.values['cta.height'], '54px');
  assert.equal(defaults.values['cta.overlap'], '27px');
});

test('late summer sale hero renders its local default image and email-safe overlapping CTA', () => {
  const { composition, path } = makeComposition('late-summer-default');
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.match(preview, /class="freshine-late-summer-logo"[^>]*width="106"/);
  assert.match(preview, /class="freshine-late-summer-promotion"[^>]*width="600"/);
  assert.match(preview, /width="75\.5%" height="71"/);
  assert.match(preview, /class="freshine-late-summer-image"[^>]*background="[^"]*default-room\.png"[^>]*width="542" height="527"/);
  const renderedImageTag = preview.match(/<td class="freshine-late-summer-image"[^>]*>/)?.[0] ?? '';
  assert.match(renderedImageTag, /height:527px;height:min\(527px,87\.833333vw\);max-height:527px/);
  assert.doesNotMatch(renderedImageTag, /height:527px;height:87\.833333vw/);
  assert.match(preview, /class="freshine-late-summer-cta"[^>]*width="275"/);
  assert.match(preview, /margin:-27px auto 0/);
  assert.match(preview, /height:498px;height:min\(498px,calc\(87\.833333vw - 29px\)\);max-height:498px/);
  assert.match(preview, /Late Summer Sale/);
  assert.match(preview, /UP TO 70% OFF/);
  assert.match(preview, /Extra \$600 OFF &amp; UP TO 20% OFF SITEWIDE/);
  assert.doesNotMatch(preview, /<div\b|<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed|sticky)/i);
});

test('late summer sale hero caps desktop chrome while scaling its vertical rhythm on mobile', () => {
  const { composition, path } = makeComposition('late-summer-responsive-height');
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.match(preview, /height:67px;height:min\(67px,11\.166667vw\)/);
  assert.match(preview, /width:17\.666667vw;max-width:106px/);
  assert.match(preview, /height:71px;height:min\(71px,11\.833333vw\)/);
  assert.match(preview, /padding:0 18px;padding:0 min\(18px,3vw\)/);
  assert.match(preview, /padding:49px 18px 57px;padding:min\(49px,8\.166667vw\) min\(18px,3vw\) min\(57px,9\.5vw\)/);
  assert.match(preview, /height:26px;height:min\(26px,4\.333333vw\)/);
  assert.match(preview, /height:17px;height:min\(17px,2\.833333vw\)/);
  assert.match(preview, /height:52px;height:min\(52px,8\.666667vw\)/);
});

test('late summer sale hero blocks the local room image from a final build', () => {
  const { path } = makeComposition('late-summer-local-gate', (composition) => {
    composition.components[0].content['brand.logo.url'] = 'https://cdn.example.com/freshine-logo.png';
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /local asset late-summer-room must be uploaded before final build/);
});

test('late summer sale hero renders replaceable HTTPS image, alt text, and click targets', () => {
  const { composition, path } = makeComposition('late-summer-https', (value) => {
    const content = value.components[0].content;
    content['brand.logo.url'] = 'https://cdn.example.com/freshine-logo.png';
    content['hero.image.url'] = 'https://cdn.example.com/replacement-room.jpg';
    content['hero.image.alt'] = 'Replacement dining room with beige curtains';
    content['hero.image.clickUrl'] = 'https://freshinelife.com/collections/custom-curtains';
  });
  const result = run(path);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(composition.output, 'utf8');
  assert.match(html, /background="https:\/\/cdn\.example\.com\/replacement-room\.jpg"/);
  assert.match(html, /aria-label="Replacement dining room with beige curtains"/);
  assert.match(html, /href="https:\/\/freshinelife\.com\/collections\/custom-curtains"/);
  assert.match(html, /href="https:\/\/freshinelife\.com\/collections\/all"/);
});
