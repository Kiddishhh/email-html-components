import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sourcePath = '/Users/ww/.codex/attachments/1577f939-5d1d-4776-9dc7-b8057f78a01d/pasted-text.txt';
const outputPath = new URL('./email.html', import.meta.url);
const liquidMarker = "{% assign fg_handles =";

test('rebuilds only the welcome offer module and preserves the Liquid recommendation suffix', () => {
  const source = readFileSync(sourcePath, 'utf8');
  const output = readFileSync(outputPath, 'utf8');

  assert.equal(output.slice(output.indexOf(liquidMarker)).trimEnd(), source.slice(source.indexOf(liquidMarker)).trimEnd());
  assert.match(output, /2128\.png\?v=1788938621/);
  assert.match(output, /2130\.png\?v=1788938633/);
  assert.match(output, />SITEWIDE</);
  assert.match(output, />\$100 OFF</);
  assert.match(output, />\$200 OFF</);
  assert.match(output, />\$300 OFF</);
  assert.match(output, />\$600 OFF</);
  assert.match(output, />\$399\+ Orders</);
  assert.match(output, />\$699\+ Orders</);
  assert.match(output, />\$999\+ Orders</);
  assert.match(output, />\$1,999\+ Orders</);
  assert.doesNotMatch(output.slice(0, output.indexOf(liquidMarker)), /SWATCH15|NEW15|90622b10c0440d10abb8ab10eeaa5143/);
});

test('keeps the 600px email shell, proportional mobile fallbacks, and original CTA destination', () => {
  const output = readFileSync(outputPath, 'utf8');

  assert.match(output, /max-width:600px/);
  assert.match(output, /width:min\(132px,22vw\)/);
  assert.match(output, /width:min\(175px,29\.166667vw\)/);
  assert.match(output, /font-size:min\(28px,4\.666667vw\)/);
  assert.match(output, /https:\/\/freshinelife\.com\?utm_source=shopify-flow&amp;utm_medium=email&amp;utm_id=cover-rc/);
});

test('uses a short centered divider that ends before the raised SITEWIDE label', () => {
  const output = readFileSync(outputPath, 'utf8');
  const offerModule = output.slice(0, output.indexOf(liquidMarker));

  assert.doesNotMatch(offerModule, /padding-left:46px[^">]*border-left:1px dashed/);
  assert.match(offerModule, /width="1" height="73"[^>]*border-left:1px dashed #b9afa8/);
  assert.doesNotMatch(offerModule, /margin(?:-top)?:(?:-|max\(-)/);
});
