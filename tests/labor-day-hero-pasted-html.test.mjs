import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const previewPath = resolve(root, '头图/圆标场景叠字头图/劳动节活动头图-效果演示.html');

test('Labor Day pasted hero preserves the two-part navigation and matches the supplied scene geometry', () => {
  assert.ok(existsSync(previewPath), 'the updated paste-ready preview must exist');
  const html = readFileSync(previewPath, 'utf8');

  assert.match(html, /^<table role="presentation" width="600"[^>]*align="center"[^>]*bgcolor="#981E20"[^>]*max-width:600px/m);
  assert.doesNotMatch(html, /<table[^>]*width="100%"[^>]*bgcolor="#981E20"/i);
  assert.doesNotMatch(html, /<table[^>]*width="100%"[^>]*bgcolor="#3C2D25"/i);
  assert.match(html, /<td width="456" height="56" align="center" valign="middle"[^>]*text-align:center/);
  assert.match(html, /<td width="144" height="56" align="center" valign="middle"[^>]*text-align:center/);
  assert.match(html, /width="600" height="632"/);
  assert.match(html, /height:632px;height:min\(632px,105\.333333vw\)/);
  assert.match(html, /6a979474b313445127d1d10c/);
  assert.match(html, /6a97946cb313445127d1d109/);
  assert.match(html, /width="104" height="104"[^>]*width:104px;width:min\(104px,17\.333333vw\)/);
  assert.match(html, /padding-top:58px;padding-top:min\(58px,9\.666667vw\)/);
  assert.match(html, /padding-bottom:207px;padding-bottom:min\(207px,34\.5vw\)/);
  assert.doesNotMatch(html, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<div\b|<script\b|<iframe\b/i);
});
