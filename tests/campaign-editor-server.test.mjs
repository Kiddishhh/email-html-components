import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCampaignEditorServer, formatSaleGridImportFailure } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';

const workspaceRoot = '/Users/ww/Desktop/邮件营销运营/邮件html组件';
const currentComponentCount = JSON.parse(readFileSync(`${workspaceRoot}/组件清单.json`, 'utf8')).length;

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.text();
  return { response, body: body ? JSON.parse(body) : null };
}

test('sale-grid importer exposes the actionable script error rather than the Node stack trace', () => {
  const error = formatSaleGridImportFailure('file:///script.mjs:46\n  throw new Error(...)\nError: sale-grid collection not found: custom-curtains\n    at loadPayload (file:///script.mjs:141:10)');

  assert.equal(error.message, 'sale-grid collection not found: custom-curtains');
});

test('sale-grid importer exposes an invalid activity page error rather than the Node stack trace', () => {
  const error = formatSaleGridImportFailure('file:///script.mjs:20\nError: activity page URL must use /pages/<handle>\n    at parseActivityPageUrl (file:///script.mjs:20:1)');

  assert.equal(error.message, 'activity page URL must use /pages/<handle>');
});

test('editor server creates a free-form campaign, renders it, and serves the generated preview', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-server-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());

  const catalog = await request(baseUrl, '/api/catalog');
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.body.components.length, currentComponentCount);

  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '可视化草稿' })
  });
  assert.equal(created.response.status, 201);
  const draftId = created.body.draft.id;

  for (const componentKey of ['footer.warm', 'hero.promotionalOverlay', 'footer.warm']) {
    const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey })
    });
    assert.equal(added.response.status, 200);
  }

  const current = await request(baseUrl, `/api/drafts/${draftId}`);
  const hero = current.body.draft.components.find(({ componentKey }) => componentKey === 'hero.promotionalOverlay');
  const edited = await request(baseUrl, `/api/drafts/${draftId}/components/${hero.instanceId}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: { 'hero.title': '仅剩三天' } })
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.body.draft.components.find(({ instanceId }) => instanceId === hero.instanceId).content['hero.title'], '仅剩三天');

  const confirmed = await request(baseUrl, `/api/drafts/${draftId}/components/${hero.instanceId}/confirm`, { method: 'POST' });
  assert.equal(confirmed.response.status, 200);
  assert.equal(confirmed.body.draft.components.find(({ instanceId }) => instanceId === hero.instanceId).confirmed, true);

  const reordered = await request(baseUrl, `/api/drafts/${draftId}/reorder`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fromIndex: 2, toIndex: 0 })
  });
  assert.equal(reordered.response.status, 200);
  assert.equal(reordered.body.draft.components[0].componentKey, 'footer.warm');

  const removable = reordered.body.draft.components.find(({ componentKey, instanceId }) => componentKey === 'footer.warm' && instanceId !== reordered.body.draft.components[0].instanceId);
  const removed = await request(baseUrl, `/api/drafts/${draftId}/components/${removable.instanceId}`, { method: 'DELETE' });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body.draft.components.some(({ instanceId }) => instanceId === removable.instanceId), false);

  const preview = await request(baseUrl, `/api/drafts/${draftId}/preview`, { method: 'POST' });
  assert.equal(preview.response.status, 200, preview.body?.error);
  assert.match(preview.body.previewUrl, /^\/previews\//);

  const previewResponse = await fetch(`${baseUrl}${preview.body.previewUrl}`);
  assert.equal(previewResponse.status, 200);
  assert.match(await previewResponse.text(), /促销悬浮首图/);

  const editor = await fetch(baseUrl);
  assert.equal(editor.status, 200);
  const editorHtml = await editor.text();
  assert.match(editorHtml, /Freshine Campaign Editor/);
  assert.match(editorHtml, /id="structure-select"/);
  assert.match(editorHtml, /id="style-select"/);
  assert.match(editorHtml, /id="upload-omnisend-draft"/);
});

test('editor server rejects an unregistered component rather than inferring a replacement', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-reject-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  const rejected = await request(baseUrl, `/api/drafts/${created.body.draft.id}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'hero.unknown' })
  });

  assert.equal(rejected.response.status, 400);
  assert.match(rejected.body.error, /unknown selectable component/);
});

test('editor server keeps Shopify import scoped to a selected sale-grid instance', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-import-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  const draftId = created.body.draft.id;
  const footer = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'footer.warm' })
  });
  const rejected = await request(baseUrl, `/api/drafts/${draftId}/components/${footer.body.draft.components[0].instanceId}/import-sale-grid`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ collectionHandle: 'freshine-sale' })
  });
  assert.equal(rejected.response.status, 400);
  assert.match(rejected.body.error, /sale-grid import requires/);
});

test('editor server stores an uploaded local image only in the current draft and renders it', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(workspaceRoot, 'campaign-drafts/editor-upload-test-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  const draftId = created.body.draft.id;
  const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'image.clickableFullWidth' })
  });
  const instanceId = added.body.draft.components[0].instanceId;
  const uploaded = await request(baseUrl, `/api/drafts/${draftId}/components/${instanceId}/upload-image`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      fieldKey: 'image.url',
      filename: 'review.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg=='
    })
  });
  assert.equal(uploaded.response.status, 200);
  const instance = uploaded.body.draft.components[0];
  assert.match(instance.content['image.url'], /^asset:\/\/editor-upload-/);
  assert.equal(instance.confirmed, false);

  const preview = await request(baseUrl, `/api/drafts/${draftId}/preview`, { method: 'POST' });
  assert.equal(preview.response.status, 200);
  const previewResponse = await fetch(`${baseUrl}${preview.body.previewUrl}`);
  assert.equal(previewResponse.status, 200);
  const previewHtml = await previewResponse.text();
  const imageSource = previewHtml.match(/<img[^>]+src="([^"]+)"/i)?.[1];
  assert.ok(imageSource, 'preview should contain the uploaded image');
  assert.equal((await fetch(new URL(imageSource, `${baseUrl}${preview.body.previewUrl}`).href)).status, 200);
});

test('editor uploads a prepared Omnisend draft with a one-time API key and no manual hash entry', async (t) => {
  const calls = [];
  const sessionRoot = mkdtempSync(join(tmpdir(), 'freshine-editor-omnisend-draft-'));
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot,
    runDraftUploader: ({ projectPath, htmlPath, apiKey }) => {
      calls.push({ projectPath, htmlPath, apiKey });
      return { status: 'draft', campaignID: 'campaign-draft-1', contentID: 'content-draft-1' };
    }
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Late Summer Sale' })
  });
  const draftId = created.body.draft.id;
  const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'footer.warm' })
  });
  const instanceId = added.body.draft.components[0].instanceId;
  await request(baseUrl, `/api/drafts/${draftId}/components/${instanceId}/confirm`, { method: 'POST' });

  const prepared = await request(baseUrl, `/api/drafts/${draftId}/prepare-omnisend-draft`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      campaign: { name: 'Late Summer Sale', subject: 'Your end-of-summer home refresh starts here.', preheader: 'Freshine late summer picks' }
    })
  });
  assert.equal(prepared.response.status, 200, prepared.body?.error);
  assert.equal(prepared.body.ready, true);
  assert.equal('staticHtmlSha256' in prepared.body, false);
  assert.equal(calls.length, 0);

  const uploaded = await request(baseUrl, `/api/drafts/${draftId}/upload-omnisend-draft`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: 'one-time-editor-key' })
  });
  assert.equal(uploaded.response.status, 200, uploaded.body?.error);
  assert.equal(uploaded.body.receipt.status, 'draft');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].apiKey, 'one-time-editor-key');
  const projectState = JSON.parse(readFileSync(calls[0].projectPath, 'utf8'));
  assert.equal(projectState.finalConfirmation.status, 'confirmed');
  assert.match(projectState.finalConfirmation.confirmedStaticHtmlSha256, /^[a-f0-9]{64}$/u);
  assert.equal(projectState.finalConfirmation.remoteStatus, 'draft');
});

test('editor server serves editor ES modules with a JavaScript MIME type', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-modules-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/editor/editor-ui-contract.mjs`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/javascript/);
});

test('editor stylesheet keeps the email preview in an independently scrollable pane', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-scroll-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/editor/styles.css`);
  const css = await response.text();
  assert.match(css, /\.workspace\s*\{[^}]*height:calc\(100vh - 78px\)[^}]*overflow:hidden/s);
  assert.match(css, /\.preview-pane\s*\{[^}]*grid-template-rows:auto minmax\(0,1fr\)[^}]*overflow:hidden/s);
  assert.match(css, /\.preview-stage\s*\{[^}]*min-height:0[^}]*overflow:auto/s);
});
