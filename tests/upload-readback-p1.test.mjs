import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftUploadTransaction, sha256 } from '../skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs';

const html = '<table><tr><td><img src="https://example.com/image.jpg" alt="Bright room"><p>NEW SALE 65% OFF</p><p>Free design help</p><a href="https://example.com/shop?a=1&amp;b=2">Shop</a><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
function content(body) {
  return { generalSettings: { content: { width: '600px' } }, sections: [{ id: 'section-1', rows: [{ columns: [{ blocks: [
    { id: 'html-1', type: 'htmlCode', htmlCode: { body, style: '' } }
  ] }] }] }] };
}
function transaction(mode, readback, expectedHtml = html, initialContent = null) {
  const calls = [];
  let wrote = false;
  const state = { campaign: { name: 'P1', subject: 'P1', preheader: '' }, assets: {},
    finalConfirmation: { status: 'confirmed', confirmedStaticHtmlSha256: sha256(expectedHtml), ...(mode === 'verified' ? { campaignID: 'campaign-1', contentID: 'content-1' } : {}) } };
  const transport = async request => {
    calls.push(request);
    const path = new URL(request.url).pathname;
    if (path === '/api/campaigns' && request.method === 'GET') return { status: 200, json: { items: mode === 'updated' ? [{ id: 'campaign-1', name: 'P1', status: 'draft' }] : [] } };
    if (path === '/api/brands/current') return { status: 200, json: { name: 'Freshine' } };
    if (path === '/api/email-templates/import') return { status: 201, json: { id: 'template-1' } };
    if (path === '/api/campaigns' && request.method === 'POST') {
      wrote = true;
      return { status: 201, json: { id: 'campaign-1', status: 'draft', content: { email: { contentID: 'content-1' } } } };
    }
    if (path === '/api/campaigns/campaign-1') return { status: 200, json: { id: 'campaign-1', status: 'draft', content: { email: { contentID: 'content-1' } } } };
    if (path === '/api/email-content/content-1' && request.method === 'PUT') { wrote = true; return { status: 200, json: request.body }; }
    if (path === '/api/email-content/content-1') return { status: 200, json: wrote || mode === 'verified' ? readback : initialContent ?? content(html.replace('NEW SALE 65% OFF', 'OLD SALE 10% OFF')) };
    throw Error(`unexpected external operation: ${request.method} ${path}`);
  };
  return { calls, tx: createDraftUploadTransaction({ projectState: state, html: expectedHtml, transport,
    readFile: async () => { throw Error('no local images in this test'); } }) };
}

for (const mode of ['created', 'updated', 'verified']) {
  const run = tx => mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock');
  const wrap = copy => `<table><tr><td>${copy}<img src="https://example.com/image.png" alt="Room"></td></tr><tr><td><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
  test(`${mode} rejects metadata HTML when actual body is empty`, async () => {
    for (const location of ['section', 'row', 'column', 'block']) for (const metadata of [
      { htmlCode: html }, { type: 'htmlCode', htmlCode: { body: html } }, { blocks: [{ htmlCode: html }] }
    ]) {
      const remote = content('');
      const section = remote.sections[0], row = section.rows[0], column = row.columns[0];
      const owner = { section, row, column, block: column.blocks[0] }[location];
      owner.metadata = metadata;
      await assert.rejects(run(transaction(mode, remote).tx), /HTML|visible text|unsubscribe token/);
    }
  });
  test(`${mode} ignores metadata when an actual HTML block is correct`, async () => {
    const remote = content(html);
    remote.sections[0].metadata = { htmlCode: html };
    assert.equal((await run(transaction(mode, remote).tx)).readbackVerified, true);
  });
  test(`${mode} does not treat another block type as HTML`, async () => {
    const remote = content('');
    remote.sections[0].rows[0].columns[0].blocks[0] = { type: 'text', htmlCode: html };
    await assert.rejects(run(transaction(mode, remote).tx), /HTML/);
  });
  test(`${mode} title boundaries use HTML whitespace rather than NBSP`, async () => {
    for (const [before, after] of [
      ['Hello', 'Hello<title\u00a0x>Wrong</title\u00a0x>'],
      ['AWrongB', 'A<title>hidden</title\u00a0x>Wrong</title>B']
    ]) await assert.rejects(run(transaction(mode, content(wrap(after)), wrap(before)).tx), /visible text/);
    assert.equal((await run(transaction(mode, content(wrap('A<title>hidden</title\u00a0x>Wrong</title>B')), wrap('AB')).tx)).readbackVerified, true);
  });
  test(`${mode} rejects malformed title closing syntax instead of concealing copy`, async () => {
    await assert.rejects(run(transaction(mode, content(wrap('A<title>hidden</title x=<>Wrong</title>B')), wrap('AB')).tx), /unsupported.*closing tag/);
  });
  test(`${mode} rejects nested forms before they can end hidden paragraphs`, async () => {
    await assert.rejects(run(transaction(mode, content(wrap('<form><p hidden>unused<form>Wrong</form></form>')), wrap('<p>Wrong</p>')).tx), /unsupported nested form/);
  });
  test(`${mode} rejects ambiguous formatting reconstruction across omitted paragraph ends`, async () => {
    const expected = wrap('<p>Wrong</p>');
    for (const tag of ['b', 'a href="https://example.com/shop"']) {
      await assert.rejects(run(transaction(mode, content(wrap(`<p><${tag} hidden>old<p>Wrong</p>`)), expected).tx), /unsupported implicit paragraph closure/);
    }
  });
  test(`${mode} rejects visible copy after an implicitly closed hidden paragraph`, async () => {
    await assert.rejects(run(transaction(mode, content(wrap('Hello<p style="display:none">unused<p>Wrong</p>')), wrap('Hello')).tx), /visible text/);
  });
  test(`${mode} accepts omitted paragraph ends without leaking hidden state`, async () => {
    const expected = wrap('<p style="display:none">unused</p><p>Save now</p>');
    const remote = expected.replace('unused</p>', 'unused');
    assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
  });
  test(`${mode} checks links and images after an omitted hidden paragraph end`, async () => {
    const expected = wrap('<p style="display:none">unused</p><p><a href="https://example.com/shop"><img src="https://example.com/card.png" alt="Card"></a></p>');
    const remote = expected.replace('unused</p>', 'unused');
    assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
    for (const changed of [remote.replace('/shop', '/wrong'), remote.replace('/card.png', '/wrong.png')]) {
      await assert.rejects(run(transaction(mode, content(changed), expected).tx), /URL|node|alt/);
    }
  });
  test(`${mode} respects center block boundaries and explicit inline overrides`, async () => {
    await assert.rejects(run(transaction(mode, content(wrap('Save<center>20%</center>')), wrap('Save20%')).tx), /visible text/);
    assert.equal((await run(transaction(mode, content(wrap('Save<center>20%</center>')), wrap('Save 20%')).tx)).readbackVerified, true);
    assert.equal((await run(transaction(mode, content(wrap('Save<center style="display:inline">20%</center>')), wrap('Save20%')).tx)).readbackVerified, true);
  });
  test(`${mode} rejects body copy moved into title`, async () => {
    const expected = wrap('<p>SALE 65% OFF</p>');
    await assert.rejects(run(transaction(mode, content(expected.replace('SALE 65% OFF', '<title>SALE 65% OFF</title>')), expected).tx), /visible text/);
  });
  test(`${mode} title markup cannot provide link or image evidence`, async () => {
    const expected = wrap('<a href="https://example.com/shop">Save20%</a>');
    const remote = expected.replace('Save20%', 'Save<title></a><img src="https://wrong.example/a.png">hidden</title>20%');
    assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
    await assert.rejects(run(transaction(mode, content(remote.replace('/shop', '/wrong')), expected).tx), /URL|node/);
  });
  test(`${mode} applies paragraph, block and title rules to Outlook-only copy`, async () => {
    for (const [before, after] of [
      ['Hello', 'Hello<p style="display:none">unused<p>Wrong</p>'],
      ['Save20%', 'Save<center>20%</center>'],
      ['<p>SALE</p>', '<p><title>SALE</title></p>']
    ]) {
      const expected = wrap(`<!--[if mso]>${before}<![endif]-->Regular`);
      const remote = wrap(`<!--[if mso]>${after}<![endif]-->Regular`);
      await assert.rejects(run(transaction(mode, content(remote), expected).tx), /visible text.*Outlook/);
    }
  });
  test(`${mode} rejects a real word space lost at an inline boundary`, async () => {
    for (const changed of ['<span>Save</span>20%', '<div style="display:inline">Save</div>20%', 'Save<!-- space removed -->20%']) {
      await assert.rejects(run(transaction(mode, content(wrap(changed)), wrap('Save 20%')).tx), /visible text/);
    }
  });
  test(`${mode} accepts equivalent inline and comment boundaries inside a word`, async () => {
    for (const equivalent of ['<span>Save</span>20%', '<div style="display:inline">Save</div>20%', 'Save<!-- annotation -->20%']) {
      assert.equal((await run(transaction(mode, content(wrap(equivalent)), wrap('Save20%')).tx)).readbackVerified, true);
    }
  });
  test(`${mode} keeps real whitespace around inline markup`, async () => {
    const expected = wrap('Save 20%');
    for (const equivalent of ['<span>Save </span>20%', 'Save <span>20%</span>']) {
      assert.equal((await run(transaction(mode, content(wrap(equivalent)), expected).tx)).readbackVerified, true);
    }
  });
  test(`${mode} uses the same word boundaries for clickable copy`, async () => {
    const linked = copy => wrap(`<a href="https://example.com/shop">${copy}</a>`);
    assert.equal((await run(transaction(mode, content(linked('<span>Save</span>20%')), linked('Save20%')).tx)).readbackVerified, true);
    await assert.rejects(run(transaction(mode, content(linked('<span>Save</span>20%')), linked('Save 20%')).tx), /visible text|node/);
  });
  test(`${mode} excludes inert text from clickable copy as well as body copy`, async () => {
    const linked = copy => wrap(`<a href="https://example.com/shop">${copy}</a>`);
    assert.equal((await run(transaction(mode, content(linked('Save<template>not copy</template>20%')), linked('Save20%')).tx)).readbackVerified, true);
  });
  test(`${mode} verifies a link whose hidden parent has visible child copy`, async () => {
    const expected = wrap('<a style="visibility:hidden" href="https://example.com/shop"><span style="visibility:visible">Save now</span></a>');
    const remote = expected.replace('href="https://example.com/shop"', 'href="https://wrong.example/shop"');
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /URL|node/);
  });
  test(`${mode} verifies visible copy in the Outlook branch`, async () => {
    const expected = wrap('<!--[if mso]><p>OUTLOOK OFFER</p><![endif]-->Regular offer');
    const remote = expected.replace('OUTLOOK OFFER', '<template>OUTLOOK OFFER</template>');
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /visible text.*Outlook/);
  });
  for (const tag of ['template', 'script', 'style']) test(`${mode} rejects copy moved into a non-rendering ${tag} region`, async () => {
    const expected = '<table><tr><td><p>SALE 65% OFF</p><a href="https://example.com/shop">Shop</a><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const remote = expected.replace('<p>SALE 65% OFF</p>', `<${tag}>SALE 65% OFF</${tag}>`);
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /visible text/);
  });
  test(`${mode} ignores nested inert content without losing following visible copy`, async () => {
    const remote = wrap('Save<template title="A > B"><template>hidden</template><script>"<template>"</script><a href="https://wrong.example/">hidden link</a></template>20%');
    assert.equal((await run(transaction(mode, content(remote), wrap('Save20%')).tx)).readbackVerified, true);
  });
  test(`${mode} ignores inert images when binding a visible background`, async () => {
    const expected = wrap('Save20%').replace('<td>', '<td background="https://example.com/bg.png">');
    const remote = expected.replace('Save20%', 'Save<template><img src="https://wrong.example/hidden.png" alt="Hidden"></template>20%');
    assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
  });
  test(`${mode} rejects visible copy replaced by explicitly hidden copy`, async () => {
    for (const attribute of ['hidden', 'style="display:none!important;display:block"', 'style="visibility:hidden"']) {
      await assert.rejects(run(transaction(mode, content(wrap(`<span ${attribute}>Save 20%</span>`)), wrap('Save 20%')).tx), /visible text/);
    }
  });
}
test('update refuses a metadata-only target before issuing any write', async () => {
  const initial = content('');
  initial.sections[0].metadata = { htmlCode: html };
  const { tx, calls } = transaction('updated', initial, html, initial);
  await assert.rejects(tx.run('mock'), /exactly one HTML block/);
  assert.ok(calls.every(request => request.method === 'GET'));
});

test('update changes only the real HTML body while preserving metadata and style', async () => {
  const initial = content(html.replace('NEW SALE 65% OFF', 'OLD SALE 10% OFF'));
  initial.sections[0].metadata = { htmlCode: html };
  initial.sections[0].rows[0].columns[0].blocks[0].htmlCode.style = '.preserve { color: red; }';
  const { tx, calls } = transaction('updated', content(html), html, initial);
  assert.equal((await tx.run('mock')).readbackVerified, true);
  const body = calls.find(request => request.method === 'PUT').body;
  assert.equal(body.sections[0].rows[0].columns[0].blocks[0].htmlCode.body, html);
  assert.equal(body.sections[0].rows[0].columns[0].blocks[0].htmlCode.style, '.preserve { color: red; }');
  assert.deepEqual(body.sections[0].metadata, initial.sections[0].metadata);
  assert.match(initial.sections[0].rows[0].columns[0].blocks[0].htmlCode.body, /OLD SALE/);
});

test('import readback cannot use a flat HTML fallback when sections are malformed', async () => {
  await assert.rejects(transaction('created', { sections: {}, htmlCode: html }).tx.run('mock'), /sections/);
});

for (const mode of ['created', 'updated']) {
  for (const [name, changed, error] of [
    ['stale copy with unchanged links', html.replace('NEW SALE 65% OFF', 'OLD SALE 10% OFF'), /visible text|does not match/],
    ['reordered copy', html.replace('<p>NEW SALE 65% OFF</p><p>Free design help</p>', '<p>Free design help</p><p>NEW SALE 65% OFF</p>'), /visible text|does not match/],
    ['missing image alt', html.replace('alt="Bright room"', ''), /alt text/]
  ]) {
    test(`${mode} draft rejects ${name} even when writes return success`, async () => {
      const { tx, calls } = transaction(mode, content(changed));
      await assert.rejects(tx.run('local-test-key'), error);
      assert.equal(calls.at(-1).method, 'GET', 'validation failure must not trigger another write');
    });
  }
  test(`${mode} draft verifies actual HTML rather than matching copy in response metadata`, async () => {
    const remote = content(html.replace('NEW SALE 65% OFF', 'OLD SALE 10% OFF'));
    remote.expectedHtml = html;
    const { tx } = transaction(mode, remote);
    await assert.rejects(tx.run('local-test-key'), /visible text|does not match/);
  });
  test(`${mode} draft accepts equivalent HTML with normalized whitespace and attribute changes`, async () => {
    const normalized = html.replace('<p>NEW SALE', '<p data-platform="normalized">\nNEW SALE').replace('65% OFF</p>', '65% OFF \n</p>');
    const { tx } = transaction(mode, content(normalized));
    const receipt = await tx.run('local-test-key');
    assert.equal(receipt.operation, mode);
    assert.equal(receipt.readbackVerified, true);
    assert.match(receipt.visibleTextSha256, /^[a-f0-9]{64}$/);
  });
}

for (const mode of ['created', 'updated']) {
  for (const [label, source, remote] of [
    ['decimal ampersand', 'A&amp;B', 'A&#38;B'],
    ['numeric space', 'A&nbsp;B', 'A&#160;B'],
    ['hex and unicode', 'Café &#x1F600;', 'Caf&#233; 😀'],
    ['named punctuation', 'It&rsquo;s &copy; Freshine', 'It&#8217;s © Freshine'],
    ['literal entity text', '&amp;#38;', '&#38;#38;'],
  ]) test(`${mode} accepts equivalent ${label} in actual readback`, async () => {
    const expected = html.replace('NEW SALE 65% OFF', source).replace('Bright room', 'Room &amp; light');
    const readback = expected.replace(source, remote).replace('Room &amp; light', 'Room &#x26; light');
    const { tx } = transaction(mode, content(readback), expected);
    assert.equal((await tx.run('mock')).readbackVerified, true);
  });
  test(`${mode} accepts numeric entity serialization in URL query parameters`, async () => {
    const { tx } = transaction(mode, content(html.replace('?a=1&amp;b=2', '?a=1&#38;b=2')));
    assert.equal((await tx.run('mock')).readbackVerified, true);
  });
  test(`${mode} decodes URL entity sequences exactly once`, async () => {
    for (const source of ['?a=1&amp;amp;b=2', '?a=1&amp;copy;=2']) {
      const expected = html.replace('?a=1&amp;b=2', source);
      for (const remote of [source, source.replace('&amp;', '&#38;')]) {
        const { tx } = transaction(mode, content(expected.replace(source, remote)), expected);
        assert.equal((await tx.run('mock')).readbackVerified, true);
      }
      const { tx } = transaction(mode, content(expected.replace(source, source.replace('&amp;', '&'))), expected);
      await assert.rejects(tx.run('mock'), /missing URL/);
    }
  });
  test(`${mode} rejects double-decoded literal entities and real text changes`, async () => {
    for (const [source, remote] of [['&amp;#38;', '&#38;'], ['A&amp;B', 'A&#38;C']]) {
      const expected = html.replace('NEW SALE 65% OFF', source);
      const { tx } = transaction(mode, content(expected.replace(source, remote)), expected);
      await assert.rejects(tx.run('mock'), /visible text or component order/);
    }
  });
}

for (const mode of ['created', 'updated', 'verified']) {
  const expected = '<table background="https://example.com/bg.png"><tr><td style="background-image:url(https://example.com/css.png)"><a href="https://example.com/first"><img src="https://example.com/one.png" alt="One">First</a><a href="https://example.com/second"><img src="https://example.com/two.png" alt="Two">Second</a><a href="mailto:help@example.com">Help</a><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
  for (const [label, change] of [
    ['URL surviving only in a comment', s => s.replace('href="https://example.com/first"', 'href="https://example.com/wrong"') + '<!-- https://example.com/first -->'],
    ['URL surviving only in metadata', s => s.replace('href="https://example.com/first"', 'href="https://example.com/wrong" data-old="https://example.com/first"')],
    ['URL prefix match', s => s.replace('href="https://example.com/first"', 'href="https://example.com/first-wrong"')],
    ['swapped links', s => s.replace('/first"','/TEMP"').replace('/second"','/first"').replace('/TEMP"','/second"')],
    ['swapped image sources', s => s.replace('/one.png','/TEMP.png').replace('/two.png','/one.png').replace('/TEMP.png','/two.png')],
    ['swapped image alt text', s => s.replace('alt="One"','alt="TEMP"').replace('alt="Two"','alt="One"').replace('alt="TEMP"','alt="Two"')],
    ['background URL surviving only in text-free comment', s => s.replace('background="https://example.com/bg.png"', '') + '<!-- https://example.com/bg.png -->'],
    ['CSS URL surviving only in comment', s => s.replace('url(https://example.com/css.png)', 'none') + '<!-- https://example.com/css.png -->'],
    ['CSS URL surviving only in CSS comment', s => s.replace('background-image:url(https://example.com/css.png)', 'background-image:none/*url(https://example.com/css.png)*/')],
    ['CSS background overridden by a later declaration', s => s.replace('background-image:url(https://example.com/css.png)', 'background-image:url(https://example.com/css.png);background-image:none')],
    ['mailto target replaced', s => s.replace('mailto:help@example.com','mailto:wrong@example.com')],
    ['unsubscribe no longer attached to a link', s => s.replace('href="[[unsubscribe_link]]"', 'href="https://example.com/wrong" data-old="[[unsubscribe_link]]"')],
  ]) test(`${mode} rejects ${label} in readback`, async () => {
    const { tx } = transaction(mode, content(change(expected)), expected);
    await assert.rejects((mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock')), /URL|alt text|node|link/i);
  });
  test(`${mode} accepts node-equivalent serialization and harmless wrappers`, async () => {
    const remote = expected.replace(/<a href="([^"]+)"/gu, "<A data-platform='yes' HREF='$1'").replaceAll('</a>', '</A>').replace('First</A>', '<span>First</span></A>').replace('background-image:url(', 'background-image: url(');
    const { tx } = transaction(mode, content(remote), expected);
    assert.equal((await (mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock'))).readbackVerified, true);
  });
  test(`${mode} rejects a changed Outlook shape link`, async () => {
    const expectedVml = '<table><tr><td><!--[if mso]><v:rect href="https://example.com/product"><v:fill src="https://example.com/vml.png"/><v:textbox><![endif]-->Body<!--[if mso]></v:textbox></v:rect><![endif]--><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const { tx } = transaction(mode, content(expectedVml.replace('/product', '/wrong-product')), expectedVml);
    await assert.rejects((mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock')), /URL|node/i);
  });
  test(`${mode} rejects a changed Outlook VML source even when its URL remains in a comment`, async () => {
    const expectedVml = '<table><tr><td><!--[if mso]><v:rect><v:fill src="https://example.com/vml.png"/><v:textbox><![endif]-->Body<!--[if mso]></v:textbox></v:rect><![endif]--><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const remote = expectedVml.replace('src="https://example.com/vml.png"', 'src="https://example.com/wrong.png"') + '<!-- https://example.com/vml.png -->';
    const { tx } = transaction(mode, content(remote), expectedVml);
    await assert.rejects((mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock')), /URL|node/i);
  });
}

test('read-only recovery rejects reuse of an unrelated existing image for a local asset',async()=>{
  const expected='<table background="asset://hero"><tr><td><img src="https://app.omnisend.com/images/existing" alt="Existing"><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
  const {tx}=transaction('verified',content(expected.replace('asset://hero','https://app.omnisend.com/images/existing')),expected);
  await assert.rejects(tx.verifyExisting('mock'),/replacement|URL/);
});
test('read-only recovery rejects collapsing distinct local assets onto one uploaded URL',async()=>{
  const expected='<table><tr><td><img src="asset://first" alt="First"><img src="asset://second" alt="Second"><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
  const {tx}=transaction('verified',content(expected.replaceAll(/asset:\/\/(?:first|second)/gu,'https://app.omnisend.com/images/one')),expected);
  await assert.rejects(tx.verifyExisting('mock'),/replacement|URL/);
});

for (const mode of ['created', 'updated', 'verified']) {
  test(`${mode} compares effective background declarations including important and shorthand`, async () => {
    const expected = '<table><tr><td style="background-image:url(https://example.com/primary.png) !important;background-image:url(https://example.com/ignored.png)"><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const remote = expected.replace(';background-image:url(https://example.com/ignored.png)', ';background:none');
    const valid = transaction(mode, content(remote), expected).tx;
    assert.equal((await (mode === 'verified' ? valid.verifyExisting('mock') : valid.run('mock'))).readbackVerified, true);
    const invalid = transaction(mode, content(remote.replace('background:none', 'background:none !important')), expected).tx;
    await assert.rejects(mode === 'verified' ? invalid.verifyExisting('mock') : invalid.run('mock'), /URL|node/);
  });
  test(`${mode} preserves comment-like text and semicolons inside quoted CSS URLs`, async () => {
    const expected = '<table><tr><td style="background-image:url(\'https://example.com/a/*literal*/b;v=1.png\')"><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const invalid = transaction(mode, content(expected.replace('a/*literal*/b;v=1.png', 'ab;v=1.png')), expected).tx;
    await assert.rejects(mode === 'verified' ? invalid.verifyExisting('mock') : invalid.run('mock'), /URL|node/);
  });
}

for (const mode of ['created', 'updated', 'verified']) {
  const run = tx => mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock');
  const body = '<table><tr><td background="https://example.com/bg.png" style="background-image:url(https://example.com/css.png)">Hero<img src="https://example.com/photo.png" alt="Room"></td></tr><tr><td>Footer</td></tr><tr><td><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
  for (const [label, changed] of [
    ['a quoted CSS url string', body.replace('url(https://example.com/css.png)', "'url(https://example.com/css.png)'")],
    ['background moved to another content block', body.replace(' background="https://example.com/bg.png"', '').replace('<td>Footer', '<td background="https://example.com/bg.png">Footer')],
    ['CSS background moved to another content block', body.replace(' style="background-image:url(https://example.com/css.png)"', '').replace('<td>Footer', '<td style="background-image:url(https://example.com/css.png)">Footer')],
    ['image moved to another content block', body.replace('<img src="https://example.com/photo.png" alt="Room">', '').replace('Footer</td>', 'Footer<img src="https://example.com/photo.png" alt="Room"></td>')],
  ]) test(`${mode} rejects ${label}`, async () => {
    await assert.rejects(run(transaction(mode, content(changed), body).tx), /URL|node|block/);
  });
  test(`${mode} accepts harmless layout wrappers around image content`, async () => {
    const wrapped = body.replace('Hero<img', '<table><tbody><tr><td><span>Hero</span><img').replace('alt="Room"></td>', 'alt="Room"></td></tr></tbody></table></td>');
    assert.equal((await run(transaction(mode, content(wrapped), body).tx)).readbackVerified, true);
  });
  test(`${mode} rejects moving an image between duplicate-copy blocks`, async () => {
    const expected = '<table><tr><td>Same<img src="https://example.com/photo.png" alt="Room"></td><td>Same</td></tr><tr><td><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
    const remote = expected.replace('Same<img src="https://example.com/photo.png" alt="Room"></td><td>Same', 'Same</td><td>Same<img src="https://example.com/photo.png" alt="Room">');
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /node|block/);
  });
}

for (const mode of ['created', 'updated', 'verified']) {
  const run = tx => mode === 'verified' ? tx.verifyExisting('mock') : tx.run('mock');
  const image = '<img src="https://example.com/photo.png" alt="Room">';
  const body = `<table><tr><td>Hero${image}Text</td><td>Footer</td></tr><tr><td><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
  test(`${mode} accepts inline wrappers around part of an image content block`, async () => {
    for (const tag of ['div', 'p']) for (const style of ['display:inline', 'display:/**/inline!important;display:block']) {
      const remote = body.replace(`Hero${image}`, `<${tag} style="${style}">Hero${image}</${tag}>`);
      assert.equal((await run(transaction(mode, content(remote), body).tx)).readbackVerified, true);
    }
  });
  test(`${mode} preserves link copy across a partial inline wrapper`, async () => {
    const expected = body.replace(`Hero${image}Text`, `<a href="https://example.com/product">Hero${image}Text</a>`);
    const remote = expected.replace(`Hero${image}`, `<div style="display:inline">Hero${image}</div>`);
    assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
  });
  test(`${mode} still rejects an image moved across blocks inside an inline wrapper`, async () => {
    const remote = body.replace(image, '').replace('Footer</td>', `<div style="display:inline">Footer${image}</div></td>`);
    await assert.rejects(run(transaction(mode, content(remote), body).tx), /node|block|visible text/);
  });
  test(`${mode} accepts entity serialization of angle brackets inside quoted attributes`, async () => {
    for (const quote of ['"', "'"]) {
      const expected = body.replace('alt="Room"', `alt=${quote}Room > garden${quote}`).replace('<td>Hero', `<td title=${quote}A > B${quote}>Hero`);
      for (const entity of ['&gt;', '&#62;', '&#x3e;']) {
        const remote = expected.replace('Room > garden', `Room ${entity} garden`).replace('A > B', `A ${entity} B`);
        assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
        assert.equal((await run(transaction(mode, content(expected), remote).tx)).readbackVerified, true);
      }
    }
  });
  test(`${mode} rejects actual copy or alt changes alongside attribute entity serialization`, async () => {
    const expected = body.replace('alt="Room"', 'alt="Room > garden"');
    const equivalent = expected.replace('Room > garden', 'Room &gt; garden');
    await assert.rejects(run(transaction(mode, content(equivalent.replace('Hero', 'Changed')), expected).tx), /visible text/);
    await assert.rejects(run(transaction(mode, content(equivalent.replace('garden', 'kitchen')), expected).tx), /alt text/);
  });
  test(`${mode} accepts wrapping only the image without changing its content block`, async () => {
    for (const wrapper of [`<div style="display:inline">${image}</div>`, `<table><tbody><tr><td>${image}</td></tr></tbody></table>`]) {
      assert.equal((await run(transaction(mode, content(body.replace(image, wrapper)), body).tx)).readbackVerified, true);
    }
  });
  test(`${mode} accepts equivalent omitted table end tags in remote HTML`, async () => {
    assert.equal((await run(transaction(mode, content(body.replaceAll('</td>', '').replaceAll('</tr>', '')), body).tx)).readbackVerified, true);
  });
  for (const kind of ['background', 'image']) test(`${mode} rejects moving ${kind} between inline cards`, async () => {
    const bg = 'background-image:url(https://example.com/bg.png);';
    const expected = `<table><tr><td><span style="display:inline-block;${kind === 'background' ? bg : ''}">First${kind === 'image' ? image : ''}</span> <span style="display:inline-block;">Second</span><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
    const remote = kind === 'background'
      ? expected.replace(bg, '').replace('style="display:inline-block;">Second', `style="display:inline-block;${bg}">Second`)
      : expected.replace(image, '').replace('Second</span>', `Second${image}</span>`);
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /node|block|visible text/);
  });
  test(`${mode} accepts equivalent display declarations on content cards`, async () => {
    const expected = `<table><tr><td><span style="display:inline-block;">First${image}</span><span style="display:inline-block;">Second</span><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
    for (const display of ['display:/**/inline-block;', 'display:inline-block !important;display:inline;', 'display:inline;display:inline-block;']) {
      const remote = expected.replaceAll('display:inline-block;', display);
      assert.equal((await run(transaction(mode, content(remote), expected).tx)).readbackVerified, true);
    }
  });
  test(`${mode} rejects moving backgrounds between empty important display cards`, async () => {
    const bg = 'background-image:url(https://example.com/bg.png);';
    const expected = `<table><tr><td><span style="display:inline-block!important;${bg}"></span><span style="display:inline-block!important;"></span><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
    const remote = expected.replace(bg, '').replace('style="display:inline-block!important;"></span><a', `style="display:inline-block!important;${bg}"></span><a`);
    await assert.rejects(run(transaction(mode, content(remote), expected).tx), /node|block/);
  });
}
