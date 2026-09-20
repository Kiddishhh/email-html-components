import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDetailDiscountBadges } from '../scripts/render-detail-discount-badges.mjs';
const key = 'saleItems[5].discountLabel';
const template = `before<!-- FRESHINE_DETAIL_BADGE:${key} --><table><tr><td>{{content.${key}}}</td></tr></table><!-- FRESHINE_END_DETAIL_BADGE:${key} -->after`;
test('discount badge keeps prefix editable and emphasizes imported percentage safely', () => {
  const html = renderDetailDiscountBadges(template, {[key]: 'SAVE 40%'});
  assert.match(html, /SAVE<br><span[^>]*font-weight:700[^>]*>40%<\/span>/);
  assert.match(renderDetailDiscountBadges(template, {[key]: 'TAKE 12.5%'}), /TAKE<br>.*12\.5%/);
  assert.match(renderDetailDiscountBadges(template, {[key]: '40%'}), /SAVE<br>/);
  assert.doesNotMatch(renderDetailDiscountBadges(template, {[key]: '<script>alert(1)</script>'}), /<script>/);
});
test('empty discount removes the entire badge, never leaves a colored empty circle', () => {
  assert.equal(renderDetailDiscountBadges(template, {[key]: ''}), 'beforeafter');
  assert.equal(renderDetailDiscountBadges(template, {[key]: '   '}), 'beforeafter');
});
