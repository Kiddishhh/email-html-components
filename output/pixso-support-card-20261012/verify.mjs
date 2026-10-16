import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const raw = read('0_0.html');
const clean = read('pixso-reference.html');
const html = read('component.html');
const preview = read('effect-preview.html');
const map = JSON.parse(read('class-map.json'));
let expected = raw.replace(/\sid="[\d_]+"/g, '');
for (const [from, to] of Object.entries(map).sort((a, b) => b[0].length - a[0].length)) expected = expected.split(from).join(to);
assert.equal(clean.trim(), expected.trim(), 'Cleanup changed more than class names and unused ids');
const tokens = s => [...s.matchAll(/\bclass="([^"]+)"/g)].map(m => m[1].split(/\s+/).length);
assert.deepEqual(tokens(clean), tokens(raw));
assert.equal(Object.keys(map).length, 18);
assert.equal([...raw.matchAll(/\sid="[\d_]+"/g)].length, 15);
assert(!/\sid="[\d_]+"|(?:Pixso|stroke|frame-content)-[^"\s]*\d_\d/.test(clean));
assert(!/localhost:\d|\/assets\/\d{10,}/.test(clean + html));
for (const asset of ['assets/images/Group_295_3580.svg', 'fonts/Montserrat-Regular_1.ttf', 'fonts/Montserrat-Medium_1.ttf']) assert(fs.statSync(path.join(dir, asset)).size > 0);

assert(!/<(?:!doctype|html|head|body|style|script|link|div|iframe|svg|form|input|button)\b/i.test(html));
assert(!/\bon\w+\s*=|javascript:|@font-face|position\s*:|display\s*:\s*(?:flex|grid)|mix-blend|filter:|background|bgcolor|color-scheme|prefers-color-scheme|data-ogsc/i.test(html), 'Unexpected background, layout, script, or dark-mode compensation');
const stack = [];
let rootTables = 0;
for (const match of html.matchAll(/<(\/)?([a-z][a-z0-9]*)\b[^>]*>/gi)) {
  const closing = !!match[1];
  const tag = match[2].toLowerCase();
  if (['img', 'br', 'hr'].includes(tag)) continue;
  if (closing) assert.equal(stack.pop(), tag, 'Incorrect nesting');
  else {
    if (!stack.length) { assert.equal(tag, 'table'); rootTables++; }
    if (tag === 'tr') assert.equal(stack.at(-1), 'table');
    if (tag === 'td') assert.equal(stack.at(-1), 'tr');
    if (tag === 'table' && stack.length) assert.equal(stack.at(-1), 'td');
    assert(!(tag === 'a' && stack.includes('a')), 'Nested anchors');
    stack.push(tag);
  }
}
assert.equal(stack.length, 0);
assert.equal(rootTables, 1);
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
assert.equal(hrefs.length, 3);
assert.equal(hrefs[0], 'tel:+19496916598');
assert.equal(hrefs[1], 'mailto:support@freshinelife.com');
assert.equal(hrefs[2], 'https://direct.lc.chat/3efb1757-ba25-4f16-8fa5-844db27ef883?utm_source=omnisend&amp;utm_medium=email&amp;utm_id=Columbus_Day_Sale');
assert(!hrefs.some(s => /&(?!amp;)/.test(s)));
assert(html.includes('src="https://app.omnisend.com/images/6acc9bd331a0ed8db8a4d529"'));
assert(html.includes('alt="Customer support"'));
assert(html.includes('max-width:600px'));
assert(html.includes('width:90.333333%;max-width:542px'));
assert(preview.includes('width="600"') && preview.includes('width="375"'));
const cols = [8.888889, 13.425926, 5.462963, 65.925926, 6.296296];
assert(Math.abs(cols.reduce((a,b) => a+b, 0)-100) < 0.00001);
console.log(JSON.stringify({
  status: 'PASS',
  sourceChecks: ['single root table', 'balanced nesting', 'three exact contact hrefs', 'escaped UTM query', 'public user icon', 'transparent/no background', 'no dark-mode compensation', '600px max container', '375px preview frame', 'paired class rename', 'localized resources'],
  cleanup: { temporaryUrlsRemaining: 0, unusedIdsRemoved: 15, classesRenamed: 18, retained: 0 },
  proportionalWidths: { desktopContainer: 600, desktopCard: 542, mobileContainer: 375, mobileCard: 338.75 },
  limits: ['Static source checks only; local browser rendering not verified', 'No Omnisend save or real inbox tests', 'Unsupported web fonts fall back to Arial/Helvetica', 'CSS min() and rounded border need client-specific testing']
}, null, 2));
