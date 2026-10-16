import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedVisibleText } from '../skills/build-omnisend-campaign-draft/scripts/readback-html-tokens.mjs';

for (const [label, html, expected] of [
  ['inline tag does not create a word space', '<span>Save</span>20%', 'Save20%'],
  ['inline display overrides the default block boundary', '<div style="display:inline!important;display:block">Save</div>20%', 'Save20%'],
  ['comments do not create word spaces', 'Save<!-- annotation -->20%', 'Save20%'],
  ['real whitespace survives inline tags', 'Save <b>20%</b>', 'Save 20%'],
  ['block boundaries separate words', '<p>Save</p><p>20%</p>', 'Save 20%'],
  ['display block separates words on both sides', 'A<span style="display:block">B</span>C', 'A B C'],
  ['line breaks separate words', 'Save<br>20%', 'Save 20%'],
  ['images remain visual separators without contributing alt text', 'A<img src="https://example.com/a.png" alt="Not copy">B', 'A B'],
  ['nested templates contribute neither copy nor boundaries', 'A<template><template>hidden</template>also hidden</template>B', 'AB'],
  ['a slash does not make the non-void template element self-closing', 'A<template/>hidden</template>B', 'AB'],
  ['raw script and style contents cannot contribute markup or copy', 'A<script>"<template>"; hidden</script><style>.x { content:"hidden" }</style>B', 'AB'],
  ['hidden attribute suppresses descendants', 'A<span hidden="false">hidden</span>B', 'AB'],
  ['a slash cannot close an ordinary hidden non-void element', 'A<div hidden/>hidden</div>B', 'AB'],
  ['hidden void elements do not swallow visible siblings', '<input hidden/><meta hidden/><link hidden/><p>Save now</p>', 'Save now'],
  ['effective display none suppresses descendants', 'A<div style="display:none!important;display:block"><span style="display:block">hidden</span></div>B', 'AB'],
  ['visibility hidden cannot stand in for visible copy', 'A<span style="visibility:hidden">hidden</span>B', 'AB'],
  ['visibility visible restores a child without exposing hidden sibling text', 'A<span style="visibility:hidden">hidden<span style="visibility:visible">B</span>hidden</span>C', 'ABC'],
  ['entities are decoded once after attribute-aware parsing', '<span title="A > B">&amp;#38; &gt;</span>', '&#38; >'],
  ['a new paragraph closes the hidden paragraph before inheriting visibility', 'Hello<p style="display:none">unused<p>Wrong</p>', 'Hello Wrong'],
  ['paragraph closure also closes hidden inline descendants', '<p hidden><span>unused<p>Visible</p>', 'Visible'],
  ['a block start ends an omitted paragraph', '<p style="visibility:hidden">unused<div>Visible</div>', 'Visible'],
  ['paragraph closure does not unhide a genuinely hidden ancestor', '<div hidden><p>unused<p>still hidden</p></div>Visible', 'Visible'],
  ['paragraph closure does not cross a template boundary', '<p hidden>unused<template><p>inert</p></template>still hidden</p>Visible', 'Visible'],
  ['paragraph closure does not cross a table cell boundary', '<p hidden>unused<td><p>still hidden</p></td></p>Visible', 'Visible'],
  ['paragraph closure does not cross a button boundary', '<p hidden><button><p>still hidden</p></button></p>Visible', 'Visible'],
  ['default center boundaries separate surrounding words', 'Save<center>20%</center>today', 'Save 20% today'],
  ['explicit inline still overrides a default center boundary', 'Save<center style="display:inline!important;display:block">20%</center>', 'Save20%'],
  ['title text is not visible copy', 'Save<title>not copy</title>20%', 'Save20%'],
  ['title contents cannot introduce HTML nodes or close outer elements', '<p>A<title></p><p>not copy &amp;</title>B</p>C', 'AB C'],
  ['a title attribute remains metadata without hiding its element', '<span title="not copy">Save20%</span>', 'Save20%'],
  ['title-prefixed wrapper names do not start a title text region', 'A<title-copy>B</title-copy>C', 'ABC'],
  ['a trailing slash on a title end tag does not swallow following copy', 'A<title>hidden</title/>B', 'AB'],
  ['attributes on a title end tag do not swallow following copy', 'A<title>hidden</title data-note="A > B">B', 'AB'],
  ['explicitly closed formatting remains compatible with omitted paragraph ends', '<p><b>First</b><p>Second</p>', 'First Second'],
  ['formatting inside an inert template cannot make visible text ambiguous', 'A<template><p><b>hidden<p>also hidden</p></template>B', 'AB'],
  ['NBSP does not delimit a title start tag name', 'Hello<title\u00a0x>Wrong</title\u00a0x>', 'HelloWrong'],
  ['NBSP does not delimit a title end tag name', 'A<title>hidden</title\u00a0x>Wrong</title>B', 'AB'],
  ['ordinary form wrapping preserves visible paragraph text', '<form><p hidden>unused<p>Visible</p></form>', 'Visible'],
  ['separate forms do not count as nested forms', '<form>A</form><form>B</form>', 'A B'],
  ['template forms cannot affect surrounding form state', '<form>A<template><form><form>hidden</form></form></template>B</form>', 'AB'],
]) test(label, () => assert.equal(normalizedVisibleText(html), expected));

test('ambiguous raw-text closing markup fails instead of swallowing later copy', () => {
  assert.throws(() => normalizedVisibleText('A<title>hidden</title x=<>Wrong</title>B'), /unsupported.*closing tag/);
});

test('nested forms cannot close a hidden paragraph and manufacture visible copy', () => {
  assert.throws(() => normalizedVisibleText('<form><p hidden>unused<form>Wrong</form></form>'), /unsupported nested form/);
  assert.throws(() => normalizedVisibleText('<div><form></div><p hidden>unused<form>Wrong</form>'), /unsupported nested form/);
});

test('implicit paragraph closure fails closed when formatting reconstruction would be needed', () => {
  for (const tag of ['a', 'b', 'big', 'code', 'em', 'font', 'i', 'nobr', 's', 'small', 'strike', 'strong', 'tt', 'u']) {
    assert.throws(() => normalizedVisibleText(`<p><${tag} hidden>old<p>Wrong</p>`), /unsupported implicit paragraph closure/);
  }
});

for (const tag of ['address', 'article', 'aside', 'center', 'details', 'dl', 'dt', 'dd', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header', 'hgroup', 'main', 'menu', 'nav', 'pre', 'section', 'search', 'summary']) {
  test(`${tag} default boundaries separate adjacent copy`, () => {
    assert.equal(normalizedVisibleText(`A<${tag}>B</${tag}>C`), 'A B C');
  });
}
