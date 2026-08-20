import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addComponentInstance,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const builder = `${root}/build-email-template.v1.mjs`;
const navigationStyles = [
  {
    componentKey: 'hero.promotionalOverlay',
    leftClass: 'freshine-promotional-overlay-navigation-left',
    rightClass: 'freshine-promotional-overlay-navigation-right'
  },
  {
    componentKey: 'hero.countdownOverlay',
    leftClass: 'freshine-countdown-navigation-left',
    rightClass: 'freshine-countdown-navigation-right'
  },
  {
    componentKey: 'hero.countdownOverlay2',
    leftClass: 'freshine-countdown-2-promotion-left',
    rightClass: 'freshine-countdown-2-promotion-right'
  },
  {
    componentKey: 'hero.lateSummerSale',
    leftClass: 'freshine-late-summer-promotion-left',
    rightClass: 'freshine-late-summer-promotion-right'
  }
];

function renderHero(componentKey) {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name: `${componentKey}-mobile-navigation` });
  document = addComponentInstance(document, catalog, componentKey);
  const safeName = componentKey.replaceAll('.', '-');
  const output = `/private/tmp/${safeName}-mobile-navigation.html`;
  const previewOutput = `/private/tmp/${safeName}-mobile-navigation.local-preview.html`;
  const compositionPath = `/private/tmp/${safeName}-mobile-navigation.composition.json`;
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output,
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
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const result = spawnSync(process.execPath, [builder, compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return readFileSync(previewOutput, 'utf8');
}

function firstElementWithClass(html, tagName, className) {
  const match = html.match(new RegExp(`<${tagName}[^>]*class="${className}"[^>]*>[\\s\\S]*?</${tagName}>`));
  assert.ok(match, `missing ${tagName}.${className}`);
  return match[0];
}

function effectiveInlineStyles(elementHtml) {
  const style = elementHtml.match(/\bstyle="([^"]*)"/)?.[1] ?? '';
  return Object.fromEntries(style.split(';').map((declaration) => declaration.trim()).filter(Boolean).map((declaration) => {
    const separator = declaration.indexOf(':');
    return [declaration.slice(0, separator), declaration.slice(separator + 1)];
  }));
}

test('every hero renders the late-summer two-column responsive navigation contract', () => {
  for (const { componentKey, leftClass, rightClass } of navigationStyles) {
    const html = renderHero(componentKey);
    assert.match(html, new RegExp(`<td class="${leftClass}"[^>]*width="75\\.5%"[^>]*height="71"[^>]*style="[^"]*width:75\\.5%;[^"]*height:71px;height:min\\(71px,11\\.833333vw\\);[^"]*padding:0 min\\(18px,3vw\\);[^"]*text-align:center;vertical-align:middle;"`), `${componentKey} left navigation must use the late-summer responsive cell`);
    assert.match(html, new RegExp(`<td class="${rightClass}"[^>]*width="24\\.5%"[^>]*height="71"[^>]*style="[^"]*width:24\\.5%;[^"]*height:71px;height:min\\(71px,11\\.833333vw\\);[^"]*padding:0 min\\(10px,1\\.666667vw\\);[^"]*text-align:center;vertical-align:middle;"`), `${componentKey} right navigation must use the late-summer responsive cell`);
    assert.match(html, new RegExp(`<span[^>]*style="[^"]*font-size:18px;font-size:min\\(18px,3vw\\);font-weight:400;line-height:24px;line-height:min\\(24px,4vw\\);[^"]*"`), `${componentKey} navigation copy must use late-summer responsive typography`);
    assert.match(html, /text-decoration:underline;/, `${componentKey} navigation link must remain underlined`);

    const leftCell = firstElementWithClass(html, 'td', leftClass);
    const copy = leftCell.match(/<span[^>]*data-freshine-slot="(?:promotion|navigation)\.text"[^>]*>[\s\S]*?<\/span>/)?.[0];
    assert.ok(copy, `${componentKey} must render navigation copy inside the left cell`);
    assert.equal(effectiveInlineStyles(copy)['font-size'], 'min(18px,3vw)', `${componentKey} must not append a legacy navigation copy font size`);
    assert.equal(effectiveInlineStyles(copy)['line-height'], 'min(24px,4vw)', `${componentKey} must not append a legacy navigation copy line height`);

    const rightCell = firstElementWithClass(html, 'td', rightClass);
    const link = rightCell.match(/<a\b[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(link, `${componentKey} must render the navigation link inside the right cell`);
    assert.equal(effectiveInlineStyles(link)['font-size'], 'min(18px,3vw)', `${componentKey} must not append a legacy navigation link font size`);
    assert.equal(effectiveInlineStyles(link)['line-height'], 'min(24px,4vw)', `${componentKey} must not append a legacy navigation link line height`);
  }
});
