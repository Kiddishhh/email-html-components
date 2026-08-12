import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

const scriptUrl = new URL('../skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs', import.meta.url);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function projectState(html) {
  return {
    campaign: {
      name: 'Draft-only test',
      subject: 'Back to School',
      preheader: 'Draft verification',
      audience: 'all-subscribers'
    },
    components: {
      'hero.promotionalOverlay': { status: 'confirmed' },
      'footer.warm': { status: 'confirmed' }
    },
    finalConfirmation: {
      status: 'confirmed',
      confirmedStaticHtmlSha256: sha256(html)
    },
    assets: {
      hero: { localPath: 'hero.jpg', name: 'hero.jpg', mimeType: 'image/jpeg' }
    }
  };
}

function createTransport(expectedHtml) {
  const calls = [];
  const transport = async (request) => {
    calls.push(request);
    if (request.method === 'GET' && request.url.endsWith('/api/brands/current')) {
      return { status: 200, json: { name: 'Freshine Curtains' } };
    }
    if (request.url.endsWith('/api/images/upload')) {
      return { status: 201, json: { id: 'image-1', url: 'https://app.omnisend.com/images/image-1' } };
    }
    if (request.url.endsWith('/api/email-templates/import')) {
      return { status: 201, json: { id: 'template-1' } };
    }
    if (request.method === 'POST' && request.url.endsWith('/api/campaigns')) {
      return {
        status: 201,
        json: { id: 'campaign-1', status: 'draft', content: { email: { contentID: 'content-1' } } }
      };
    }
    if (request.method === 'GET' && request.url.endsWith('/api/campaigns/campaign-1')) {
      return {
        status: 200,
        json: { id: 'campaign-1', status: 'draft', content: { email: { contentID: 'content-1' } } }
      };
    }
    if (request.method === 'GET' && request.url.endsWith('/api/email-content/content-1')) {
      return { status: 200, json: { htmlCode: expectedHtml } };
    }
    throw new Error(`unexpected request ${request.method} ${request.url}`);
  };
  return { calls, transport };
}

test('parses the readback-only recovery flag without accepting a write mode alias', async () => {
  const { parseCliArgs } = await import(scriptUrl);

  const parsed = parseCliArgs(['--project', 'project.json', '--html', 'campaign.html', '--verify-existing']);

  assert.equal(parsed.verifyExisting, true);
  assert.throws(
    () => parseCliArgs(['--project', 'project.json', '--html', 'campaign.html', '--verify-only']),
    /unsupported option/
  );
});

test('creates and verifies a draft without calling send or scheduling endpoints', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const { calls, transport } = createTransport('<table><tr><td background="https://app.omnisend.com/images/image-1">[[unsubscribe_link]]</td></tr></table>');
  const transaction = createDraftUploadTransaction({
    projectState: projectState(html),
    html,
    readFile: async (path) => {
      assert.equal(path, 'hero.jpg');
      return Buffer.from('image-bytes');
    },
    transport,
    now: () => '2026-08-11T00:00:00.000Z'
  });

  const receipt = await transaction.run('test-api-key');

  assert.equal(receipt.status, 'draft');
  assert.equal(receipt.campaignID, 'campaign-1');
  assert.equal(receipt.contentID, 'content-1');
  assert.equal(receipt.templateID, 'template-1');
  assert.deepEqual(receipt.uploadedImageIDs, ['image-1']);
  assert.equal(receipt.htmlSha256, sha256('<table><tr><td background="https://app.omnisend.com/images/image-1">[[unsubscribe_link]]</td></tr></table>'));
  assert.equal(calls.length, 6);
  assert.deepEqual(calls.map(({ method, url }) => [method, new URL(url).pathname]), [
    ['POST', '/api/images/upload'],
    ['GET', '/api/brands/current'],
    ['POST', '/api/email-templates/import'],
    ['POST', '/api/campaigns'],
    ['GET', '/api/campaigns/campaign-1'],
    ['GET', '/api/email-content/content-1']
  ]);
  assert.ok(calls.every(({ url }) => !url.includes('/send')));
  assert.ok(calls.every(({ body }) => !JSON.stringify(body ?? {}).includes('scheduled')));
  const campaignRequest = calls.find(({ method, url }) => method === 'POST' && url.endsWith('/api/campaigns'));
  assert.equal(campaignRequest.body.type, 'regular');
  assert.equal(campaignRequest.body.channel, 'email');
  assert.equal(campaignRequest.body.content.email.senderName, 'Freshine Curtains');
  assert.deepEqual(campaignRequest.body.sendingSettings, { strategy: 'immediate' });
});

test('updates the existing confirmed draft content without creating or sending a campaign', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const finalHtml = '<table><tr><td background="https://app.omnisend.com/images/image-1">[[unsubscribe_link]]</td></tr></table>';
  const state = projectState(html);
  state.finalConfirmation.campaignID = 'campaign-existing';
  state.finalConfirmation.contentID = 'content-existing';
  const existingContent = {
    generalSettings: { content: { width: '600px' }, body: { backgroundColor: '#FFFFFF' } },
    sections: [{
      id: 'section-existing',
      rows: [{ id: 'row-existing', columns: [{
        id: 'column-existing',
        blocks: [{
          id: 'block-existing',
          type: 'htmlCode',
          htmlCode: {
            style: '.legacy { color: #000000; }',
            body: '<table>old [[unsubscribe_link]]</table>'
          }
        }]
      }] }]
    }]
  };
  let storedContent = structuredClone(existingContent);
  const calls = [];
  const transport = async (request) => {
    calls.push(request);
    if (request.method === 'GET' && request.url.endsWith('/api/campaigns/campaign-existing')) {
      return { status: 200, json: { id: 'campaign-existing', status: 'draft', content: { email: { contentID: 'content-existing' } } } };
    }
    if (request.method === 'GET' && request.url.endsWith('/api/email-content/content-existing')) {
      return { status: 200, json: structuredClone(storedContent) };
    }
    if (request.method === 'POST' && request.url.endsWith('/api/images/upload')) {
      return { status: 201, json: { id: 'image-1', url: 'https://app.omnisend.com/images/image-1' } };
    }
    if (request.method === 'PUT' && request.url.endsWith('/api/email-content/content-existing')) {
      storedContent = structuredClone(request.body);
      return { status: 200, json: structuredClone(storedContent) };
    }
    throw new Error(`unexpected request ${request.method} ${request.url}`);
  };
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport,
    now: () => '2026-08-11T00:00:00.000Z'
  });

  const receipt = await transaction.run('test-api-key');

  assert.equal(receipt.status, 'draft');
  assert.equal(receipt.operation, 'updated');
  assert.equal(receipt.campaignID, 'campaign-existing');
  assert.equal(receipt.contentID, 'content-existing');
  assert.deepEqual(storedContent.generalSettings, existingContent.generalSettings);
  assert.equal(storedContent.sections[0].id, 'section-existing');
  assert.equal(storedContent.sections[0].rows[0].id, 'row-existing');
  assert.equal(storedContent.sections[0].rows[0].columns[0].id, 'column-existing');
  assert.equal(storedContent.sections[0].rows[0].columns[0].blocks[0].id, 'block-existing');
  assert.equal(storedContent.sections[0].rows[0].columns[0].blocks[0].htmlCode.body, finalHtml);
  assert.equal(storedContent.sections[0].rows[0].columns[0].blocks[0].htmlCode.style, '.legacy { color: #000000; }');
  assert.deepEqual(calls.map(({ method, url }) => [method, new URL(url).pathname]), [
    ['GET', '/api/campaigns/campaign-existing'],
    ['GET', '/api/email-content/content-existing'],
    ['POST', '/api/images/upload'],
    ['PUT', '/api/email-content/content-existing'],
    ['GET', '/api/campaigns/campaign-existing'],
    ['GET', '/api/email-content/content-existing']
  ]);
  assert.ok(calls.every(({ method, url }) => !(method === 'POST' && new URL(url).pathname === '/api/campaigns')));
  assert.ok(calls.every(({ url }) => !url.includes('/send')));
});

test('refuses to update a non-draft existing campaign before uploading images', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const state = projectState(html);
  state.finalConfirmation.campaignID = 'campaign-existing';
  state.finalConfirmation.contentID = 'content-existing';
  const calls = [];
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport: async (request) => {
      calls.push(request);
      return { status: 200, json: { id: 'campaign-existing', status: 'scheduled', content: { email: { contentID: 'content-existing' } } } };
    }
  });

  await assert.rejects(() => transaction.run('test-api-key'), /not draft/i);
  assert.deepEqual(calls.map(({ method, url }) => [method, new URL(url).pathname]), [
    ['GET', '/api/campaigns/campaign-existing']
  ]);
});

test('reports sanitized HTML block counts before uploading when the existing content shape is unsupported', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const state = projectState(html);
  state.finalConfirmation.campaignID = 'campaign-existing';
  state.finalConfirmation.contentID = 'content-existing';
  const calls = [];
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport: async (request) => {
      calls.push(request);
      if (request.url.endsWith('/api/campaigns/campaign-existing')) {
        return { status: 200, json: { id: 'campaign-existing', status: 'draft', content: { email: { contentID: 'content-existing' } } } };
      }
      if (request.url.endsWith('/api/email-content/content-existing')) {
        return {
          status: 200,
          json: {
            generalSettings: { content: { width: '600px' } },
            sections: [{ rows: [{ columns: [{ blocks: [{ type: 'html', htmlCode: '<table>no token</table>' }] }] }] }]
          }
        };
      }
      throw new Error(`unexpected request ${request.method} ${request.url}`);
    }
  });

  await assert.rejects(
    () => transaction.run('test-api-key'),
    /htmlBlocks=1, unsubscribeBlocks=0, blockTypes=html:1, tokenFields=none/
  );
  assert.equal(calls.some(({ url }) => url.endsWith('/api/images/upload')), false);
});

test('rejects unconfirmed state and stale HTML before any network request', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table>[[unsubscribe_link]]</table>';
  const state = projectState(html);
  state.finalConfirmation.status = 'pending';
  let called = false;
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => Buffer.from('unused'),
    transport: async () => { called = true; throw new Error('must not run'); },
    now: () => '2026-08-11T00:00:00.000Z'
  });

  await assert.rejects(() => transaction.run('test-api-key'), /final confirmation/i);
  assert.equal(called, false);
});

test('rejects a non-draft readback and does not leak the runtime key in its error', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const { transport } = createTransport('<table><tr><td background="https://app.omnisend.com/images/image-1">[[unsubscribe_link]]</td></tr></table>');
  const transaction = createDraftUploadTransaction({
    projectState: projectState(html),
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport: async (request) => {
      if (request.method === 'GET' && request.url.endsWith('/api/campaigns/campaign-1')) {
        return { status: 200, json: { id: 'campaign-1', status: 'scheduled', content: { email: { contentID: 'content-1' } } } };
      }
      return transport(request);
    },
    now: () => '2026-08-11T00:00:00.000Z'
  });

  await assert.rejects(() => transaction.run('runtime-secret-value'), (error) => {
    assert.match(error.message, /draft/i);
    assert.doesNotMatch(error.message, /runtime-secret-value/);
    return true;
  });
});

test('uploads each named local asset once even when it appears in multiple HTML attributes', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero" style="background-image:url(asset://hero)">[[unsubscribe_link]]</td></tr></table>';
  const finalHtml = '<table><tr><td background="https://app.omnisend.com/images/image-1" style="background-image:url(https://app.omnisend.com/images/image-1)">[[unsubscribe_link]]</td></tr></table>';
  const { calls, transport } = createTransport(finalHtml);
  const transaction = createDraftUploadTransaction({
    projectState: projectState(html),
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport,
    now: () => '2026-08-11T00:00:00.000Z'
  });

  const receipt = await transaction.run('test-api-key');

  assert.deepEqual(receipt.uploadedImageIDs, ['image-1']);
  assert.equal(calls.filter(({ url }) => url.endsWith('/api/images/upload')).length, 1);
});

test('rejects an unsupported local image type before the first API request', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const state = projectState(html);
  state.assets.hero.mimeType = 'image/svg+xml';
  let requestCount = 0;
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => Buffer.from('<svg/>'),
    transport: async () => { requestCount += 1; return { status: 201, json: {} }; },
    now: () => '2026-08-11T00:00:00.000Z'
  });

  await assert.rejects(() => transaction.run('test-api-key'), /JPEG, PNG, GIF, or WebP/);
  assert.equal(requestCount, 0);
});

test('reports Omnisend validation details without exposing the runtime key', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const { transport } = createTransport('<table><tr><td background="https://app.omnisend.com/images/image-1">[[unsubscribe_link]]</td></tr></table>');
  const transaction = createDraftUploadTransaction({
    projectState: projectState(html),
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport: async (request) => request.method === 'POST' && request.url.endsWith('/api/campaigns')
      ? { status: 400, json: { errors: [{ message: 'sender identity is required' }] } }
      : transport(request),
    now: () => '2026-08-11T00:00:00.000Z'
  });

  await assert.rejects(() => transaction.run('runtime-secret-value'), (error) => {
    assert.match(error.message, /sender identity is required/);
    assert.doesNotMatch(error.message, /runtime-secret-value/);
    return true;
  });
});

test('accepts normalized multi-block readback when every confirmed URL and token is preserved', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table><tr><td background="asset://hero">[[unsubscribe_link]]</td></tr></table>';
  const finalUrl = 'https://app.omnisend.com/images/image-1';
  const { transport } = createTransport(`<table><tr><td background="${finalUrl}">[[unsubscribe_link]]</td></tr></table>`);
  const transaction = createDraftUploadTransaction({
    projectState: projectState(html),
    html,
    readFile: async () => Buffer.from('image-bytes'),
    transport: async (request) => request.method === 'GET' && request.url.endsWith('/api/email-content/content-1')
      ? {
          status: 200,
          json: {
            sections: [{ rows: [{ columns: [{ blocks: [
              { htmlCode: `<table background="${finalUrl}">` },
              { htmlCode: `<a href="[[unsubscribe_link]]">Unsubscribe</a>` }
            ] }] }] }]
          }
        }
      : transport(request),
    now: () => '2026-08-11T00:00:00.000Z'
  });

  const receipt = await transaction.run('test-api-key');

  assert.equal(receipt.status, 'draft');
  assert.match(receipt.readbackContentSha256, /^[a-f0-9]{64}$/);
});

test('recovers by verifying the existing updated draft without uploading or writing again', async () => {
  const { createDraftUploadTransaction } = await import(scriptUrl);
  const html = '<table background="asset://hero"><tr><td><img src="https://app.omnisend.com/images/existing" alt="Bright room"><span data-freshine-slot="promotion.text">Back to School</span><a href="https://example.com/showroom?a=1&amp;b=2">View</a>[[unsubscribe_link]]</td></tr></table>';
  const remoteHtml = '<table background="https://app.omnisend.com/images/new-hero"><tr><td><img src="https://app.omnisend.com/images/existing" alt="Bright room"><span>Back to School</span><a href="https://example.com/showroom?a=1&amp;b=2">View</a>[[unsubscribe_link]]</td></tr></table>';
  const state = projectState(html);
  state.finalConfirmation.campaignID = 'campaign-existing';
  state.finalConfirmation.contentID = 'content-existing';
  const calls = [];
  const transaction = createDraftUploadTransaction({
    projectState: state,
    html,
    readFile: async () => { throw new Error('verify-only must not read local image bytes'); },
    transport: async (request) => {
      calls.push(request);
      if (request.url.endsWith('/api/campaigns/campaign-existing')) {
        return { status: 200, json: { id: 'campaign-existing', status: 'draft', content: { email: { contentID: 'content-existing' } } } };
      }
      if (request.url.endsWith('/api/email-content/content-existing')) {
        return {
          status: 200,
          json: {
            generalSettings: { content: { width: '600px' } },
            sections: [{ rows: [{ columns: [{ blocks: [{ type: 'htmlCode', htmlCode: { style: '', body: remoteHtml } }] }] }] }]
          }
        };
      }
      throw new Error(`unexpected request ${request.method} ${request.url}`);
    }
  });

  const receipt = await transaction.verifyExisting('test-api-key');

  assert.equal(receipt.operation, 'verified-existing-update');
  assert.equal(receipt.status, 'draft');
  assert.equal(receipt.campaignID, 'campaign-existing');
  assert.equal(receipt.contentID, 'content-existing');
  assert.equal(receipt.readbackVerified, true);
  assert.equal(receipt.verifiedAssetCount, 1);
  assert.deepEqual(calls.map(({ method, url }) => [method, new URL(url).pathname]), [
    ['GET', '/api/campaigns/campaign-existing'],
    ['GET', '/api/email-content/content-existing']
  ]);
});
