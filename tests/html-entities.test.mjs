import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeHtmlEntities } from '../skills/build-omnisend-campaign-draft/scripts/html-entities.mjs';

test('HTML references decode once, preserving literal entity-looking copy', () => {
  assert.equal(decodeHtmlEntities('&amp;#38; &amp;lt; &#38;amp;'), '&#38; &lt; &amp;');
  assert.equal(decodeHtmlEntities('&unknown; && text'), '&unknown; && text');
});
test('named references support multiple code points, case-sensitive names and longest matches', () => {
  assert.equal(decodeHtmlEntities('&NotEqualTilde; &CounterClockwiseContourIntegral; &AMP;'), '\u2242\u0338 ∳ &');
  assert.equal(decodeHtmlEntities('&notin; &notit;'), '∉ ¬it;');
  assert.equal(decodeHtmlEntities('&Amp;'), '&Amp;');
});
test('attribute ambiguity preserves query parameters without a terminating semicolon', () => {
  assert.equal(decodeHtmlEntities('?x=1&notit=2&copy=3', { attribute: true }), '?x=1&notit=2&copy=3');
  assert.equal(decodeHtmlEntities('?x=1&amp;y=2&#x26;z=3', { attribute: true }), '?x=1&y=2&z=3');
});
test('numeric references use HTML Unicode replacement and legacy code-point rules', () => {
  assert.equal(decodeHtmlEntities('&#128; &#x80; &#0; &#xD800; &#1114112;'), '€ € � � �');
  assert.equal(decodeHtmlEntities('&#x1f600; &#X1F600; &#128512;'), '😀 😀 😀');
  assert.equal(decodeHtmlEntities('A&#38 B&#x26 C'), 'A& B& C');
});
