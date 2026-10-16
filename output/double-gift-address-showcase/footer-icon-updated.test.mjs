import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const htmlPath = new URL('./footer-icon-updated.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');

test('uses the supplied footer gift icon exactly once', () => {
  assert.equal((html.match(/https:\/\/app\.omnisend\.com\/images\/6a97b53ec723a01883e3afbf/g) ?? []).length, 1);
  assert.doesNotMatch(html, /6a97926cc723a01883e3ab18/);
});

test('uses the project title typography contract', () => {
  const titleCell = html.match(/<td align="center" style="([^"]+)">\s*<span>Pinch Pleat<\/span>/)?.[1];
  assert.ok(titleCell, 'title cell was not found');
  assert.match(titleCell, /font-family:Lora,Georgia,Times New Roman,serif/);
  assert.match(titleCell, /font-size:30px;font-size:min\(30px,5vw\)/);
  assert.match(titleCell, /font-weight:400/);
  assert.match(titleCell, /line-height:38px;line-height:min\(38px,6\.333333vw\)/);
  assert.match(titleCell, /letter-spacing:0/);
  assert.match(titleCell, /text-align:center/);
});

test('uses the project subtitle typography contract', () => {
  const subtitleCell = html.match(/<td align="center" style="([^"]+)">\s*<span>Two Tiers Of Gifts With Your Order\. More To Love\.<\/span>/)?.[1];
  assert.ok(subtitleCell, 'subtitle cell was not found');
  assert.match(subtitleCell, /color:#000000/);
  assert.match(subtitleCell, /font-family:Montserrat,Arial,Helvetica,sans-serif/);
  assert.match(subtitleCell, /font-size:18px;font-size:min\(18px,3vw\)/);
  assert.match(subtitleCell, /font-weight:500/);
  assert.match(subtitleCell, /line-height:27px;line-height:min\(27px,4\.5vw\)/);
  assert.match(subtitleCell, /letter-spacing:0/);
  assert.match(subtitleCell, /text-align:center/);
});
