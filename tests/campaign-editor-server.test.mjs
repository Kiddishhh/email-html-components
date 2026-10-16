import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createCampaignEditorServer, formatSaleGridImportFailure } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url)).slice(0, -1);
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
  assert.match(editorHtml, /id="template-select"/);
  assert.match(editorHtml, /id="use-template"/);
  assert.match(editorHtml, /id="save-template"/);
  assert.match(editorHtml, /id="delete-template"/);
  assert.match(editorHtml, /id="template-save-dialog"/);
  assert.match(editorHtml, /id="upload-omnisend-draft"/);
  assert.match(editorHtml, /id="export-omnisend-html"/);
  assert.match(editorHtml, /id="omnisend-api-key"/);
  assert.match(editorHtml, /id="omnisend-export-api-key"/);
  assert.match(editorHtml, /id="omnisend-html-copy-fallback"/);
  const client = await (await fetch(`${baseUrl}/editor/app.js`)).text();
  const uploadHandler = client.match(/async function uploadOmnisendDraft\(\) \{([\s\S]*?)\n\}\n\n\$\('#new-campaign'\)/u)?.[1] ?? '';
  assert.match(client, /requestOmnisendUpload/);
  assert.doesNotMatch(uploadHandler, /粘贴下方完整 SHA-256/);
  assert.doesNotMatch(uploadHandler, /启动编辑器的终端中输入 Omnisend API Key/);
  assert.doesNotMatch(uploadHandler, /window\.prompt/);
  assert.match(client, /async function exportOmnisendHtml\(\)/);
  assert.match(client, /navigator\.clipboard\.writeText/);
  assert.match(client, /export-omnisend-html/);
  assert.match(client, /function captureFieldFocus\(\)/);
  assert.match(client, /function restoreFieldFocus\(focus\)/);
  assert.match(client, /setDraft\(result\.draft, \{ fieldFocus \}\)/);
  assert.match(client, /selectionStart/);
  assert.match(client, /selectionEnd/);
  assert.match(client, /className = 'color-control'/);
  assert.match(client, /placeholder = '#RRGGBB'/);
  assert.match(client, /normalizeHexColor/);
  assert.match(client, /collection\.curtainPromotionCard/);
  assert.match(client, /collection\.curtainPromotionCardNoTitle/);
  assert.match(client, /collectionHandle/);
  assert.match(client, /import-shopify-product/);
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

test('editor persists a named template and creates an editable draft from its complete local snapshot', async (t) => {
  const firstSessionRoot = mkdtempSync(join(workspaceRoot, 'build/editor-runtime-test-'));
  const templateRoot = mkdtempSync(join(workspaceRoot, 'build/editor-templates-test-'));
  rmSync(templateRoot, { recursive: true, force: true });
  const firstServer = await createCampaignEditorServer({ workspaceRoot, sessionRoot: firstSessionRoot, templateRoot });
  const firstUrl = await firstServer.listen();
  t.after(async () => {
    try { await firstServer.close(); } catch {}
    rmSync(firstSessionRoot, { recursive: true, force: true });
    rmSync(templateRoot, { recursive: true, force: true });
  });
  assert.equal(existsSync(templateRoot), false, 'template storage must not be created until the user saves a template');

  const created = await request(firstUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '夏末活动编辑稿' })
  });
  const draftId = created.body.draft.id;
  const heroAdded = await request(firstUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'hero.lateSummerSale' })
  });
  const heroId = heroAdded.body.draft.components[0].instanceId;
  await request(firstUrl, `/api/drafts/${draftId}/components/${heroId}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: { 'hero.title': 'TEMPLATE SALE' } })
  });
  const imageAdded = await request(firstUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'image.clickableFullWidth' })
  });
  const imageId = imageAdded.body.draft.components[1].instanceId;
  const uploaded = await request(firstUrl, `/api/drafts/${draftId}/components/${imageId}/upload-image`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      fieldKey: 'image.url',
      filename: 'template-reference.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg=='
    })
  });
  const localImageReference = uploaded.body.draft.components[1].content['image.url'];

  const saved = await request(firstUrl, '/api/templates', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '夏末双区块模板', draftId })
  });
  assert.equal(saved.response.status, 201, saved.body?.error);
  assert.equal(saved.body.template.name, '夏末双区块模板');
  assert.equal(saved.body.template.componentCount, 2);
  const localAssetId = localImageReference.slice('asset://'.length);
  assert.equal(existsSync(join(templateRoot, 'saved-templates.v1.json')), true);
  const storedTemplates = JSON.parse(readFileSync(join(templateRoot, 'saved-templates.v1.json'), 'utf8'));
  const storedAsset = storedTemplates.templates[0].snapshot.localAssets[localAssetId];
  assert.equal(existsSync(resolve(workspaceRoot, storedAsset.path)), true);

  await firstServer.close();
  assert.equal(existsSync(firstSessionRoot), false, 'ordinary editor drafts must be removed when the editor closes');
  const secondSessionRoot = mkdtempSync(join(workspaceRoot, 'build/editor-runtime-test-'));
  const secondServer = await createCampaignEditorServer({ workspaceRoot, sessionRoot: secondSessionRoot, templateRoot });
  const secondUrl = await secondServer.listen();
  t.after(async () => {
    try { await secondServer.close(); } catch {}
    rmSync(secondSessionRoot, { recursive: true, force: true });
  });

  const listed = await request(secondUrl, '/api/templates');
  assert.equal(listed.response.status, 200);
  assert.deepEqual(listed.body.templates.map(({ name }) => name), ['夏末双区块模板']);

  const loaded = await request(secondUrl, `/api/templates/${saved.body.template.id}/drafts`, { method: 'POST' });
  assert.equal(loaded.response.status, 201, loaded.body?.error);
  assert.equal(loaded.body.draft.name, '夏末双区块模板');
  assert.deepEqual(loaded.body.draft.components.map(({ componentKey }) => componentKey), ['hero.lateSummerSale', 'image.clickableFullWidth']);
  assert.equal(loaded.body.draft.components[0].content['hero.title'], 'TEMPLATE SALE');
  assert.equal(loaded.body.draft.components[1].content['image.url'], localImageReference);
  assert.equal(loaded.body.draft.components.every(({ confirmed }) => confirmed === false), true);
  assert.equal(loaded.body.draft.confirmed, false);

  const preview = await request(secondUrl, `/api/drafts/${loaded.body.draft.id}/preview`, { method: 'POST' });
  assert.equal(preview.response.status, 200, preview.body?.error);
  const previewHtml = await (await fetch(`${secondUrl}${preview.body.previewUrl}`)).text();
  assert.match(previewHtml, /TEMPLATE SALE/);
  const localImageSource = [...previewHtml.matchAll(/<img[^>]+src="([^"]+)"/giu)].map((match) => match[1]).find((source) => source.includes(localAssetId));
  assert.ok(localImageSource, 'template preview should resolve the saved local image reference');
  assert.equal((await fetch(new URL(localImageSource, `${secondUrl}${preview.body.previewUrl}`).href)).status, 200);
});

test('editor requires explicit overwrite for a duplicate template name', async (t) => {
  const templateRoot = mkdtempSync(join(workspaceRoot, 'build/editor-templates-test-'));
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-template-overwrite-')),
    templateRoot
  });
  const baseUrl = await server.listen();
  t.after(async () => {
    try { await server.close(); } catch {}
    rmSync(templateRoot, { recursive: true, force: true });
  });
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '覆盖测试' })
  });
  const draftId = created.body.draft.id;
  const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'hero.lateSummerSale' })
  });
  const heroId = added.body.draft.components[0].instanceId;
  await request(baseUrl, '/api/templates', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '重复名称', draftId })
  });

  await request(baseUrl, `/api/drafts/${draftId}/components/${heroId}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: { 'hero.title': 'UPDATED TEMPLATE' } })
  });
  const duplicate = await request(baseUrl, '/api/templates', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '重复名称', draftId })
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.code, 'template-name-conflict');

  const overwritten = await request(baseUrl, '/api/templates', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '重复名称', draftId, overwrite: true })
  });
  assert.equal(overwritten.response.status, 200, overwritten.body?.error);
  const loaded = await request(baseUrl, `/api/templates/${overwritten.body.template.id}/drafts`, { method: 'POST' });
  assert.equal(loaded.body.draft.components[0].content['hero.title'], 'UPDATED TEMPLATE');
});

test('deleting a saved template leaves an already-created draft editable', async (t) => {
  const templateRoot = mkdtempSync(join(workspaceRoot, 'build/editor-templates-test-'));
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-template-delete-')),
    templateRoot
  });
  const baseUrl = await server.listen();
  t.after(async () => {
    try { await server.close(); } catch {}
    rmSync(templateRoot, { recursive: true, force: true });
  });
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '删除测试' })
  });
  const added = await request(baseUrl, `/api/drafts/${created.body.draft.id}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'footer.warm' })
  });
  const saved = await request(baseUrl, '/api/templates', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '待删除模板', draftId: created.body.draft.id })
  });
  assert.equal(saved.response.status, 201, saved.body?.error);
  const loaded = await request(baseUrl, `/api/templates/${saved.body.template.id}/drafts`, { method: 'POST' });
  assert.equal(loaded.response.status, 201, loaded.body?.error);

  const deleted = await request(baseUrl, `/api/templates/${saved.body.template.id}`, { method: 'DELETE' });
  assert.equal(deleted.response.status, 200, deleted.body?.error);
  assert.equal(deleted.body.deleted.name, '待删除模板');
  assert.deepEqual(deleted.body.templates, []);

  const stillEditable = await request(baseUrl, `/api/drafts/${loaded.body.draft.id}/components/${loaded.body.draft.components[0].instanceId}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: { 'color.background': '#123456' } })
  });
  assert.equal(stillEditable.response.status, 200, stillEditable.body?.error);
  assert.equal(stillEditable.body.draft.components[0].settings['color.background'], '#123456');
});

test('editor server renders both sample product card variants in one local preview', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-sample-products-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());

  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '左右小样产品预览' })
  });
  const draftId = created.body.draft.id;
  for (const componentKey of ['product.sampleProductRecommendationLeft', 'product.sampleProductRecommendationRight']) {
    const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey })
    });
    assert.equal(added.response.status, 200, added.body?.error);
  }

  const preview = await request(baseUrl, `/api/drafts/${draftId}/preview`, { method: 'POST' });
  assert.equal(preview.response.status, 200, preview.body?.error);
  const previewResponse = await fetch(`${baseUrl}${preview.body.previewUrl}`);
  assert.equal(previewResponse.status, 200);
  const previewHtml = await previewResponse.text();
  assert.match(previewHtml, /Liana sheer curtains in a bright living room/);
  assert.equal((previewHtml.match(/height:min\(16px,3\.2vw\)/g) ?? []).length, 2);
  assert.equal((previewHtml.match(/font-size:min\(22px,5\.333vw\)/g) ?? []).length, 2);
  assert.equal((previewHtml.match(/font-size:min\(17px,3\.733vw\)/g) ?? []).length, 2);
  assert.equal((previewHtml.match(/font-size:min\(18px,4vw\)/g) ?? []).length, 2);
  assert.equal((previewHtml.match(/white-space:normal;word-break:normal;overflow-wrap:break-word/g) ?? []).length, 2);
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

for (const componentKey of ['collection.saleGrid4', 'collection.saleGrid4WithTitle', 'collection.sceneSaleGrid4WithTitle', 'collection.productGrid4NoSidePadding', 'collection.saleGrid4DetailWithTitle', 'collection.saleGrid6DetailWithTitle', 'collection.sceneSaleGrid6PriceWithTitle', 'collection.saleGrid6']) test(`editor server accepts ${componentKey} selected card import route before validating its product URL`, async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-four-grid-import-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  const added = await request(baseUrl, `/api/drafts/${created.body.draft.id}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey })
  });
  assert.equal(added.response.status, 200, added.body.error);
  const instanceId = added.body.draft.components[0].instanceId;

  const rejected = await request(baseUrl, `/api/drafts/${created.body.draft.id}/components/${instanceId}/import-shopify-product/2`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shopifyUrl: 'https://freshinelife.com/pages/not-a-product' })
  });

  assert.equal(rejected.response.status, 400);
  assert.match(rejected.body.error, /shopify product URL must use/);
});

test('editor server limits Shopify single-product import to curtain promotion cards', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-single-product-import-'))
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
  const rejected = await request(baseUrl, `/api/drafts/${draftId}/components/${footer.body.draft.components[0].instanceId}/import-shopify-product`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shopifyUrl: 'https://freshinelife.com/products/amara-extra-long-linen-curtains' })
  });

  assert.equal(rejected.response.status, 400);
  assert.match(rejected.body.error, /curtain promotion product import requires/);
});

test('editor server stores an uploaded local image only in the current draft and renders it', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(workspaceRoot, 'build/editor-runtime-upload-test-'))
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
  const projectSource = readFileSync(calls[0].projectPath, 'utf8');
  assert.doesNotMatch(projectSource, /one-time-editor-key/);
  const projectState = JSON.parse(projectSource);
  assert.equal(projectState.finalConfirmation.status, 'confirmed');
  assert.match(projectState.finalConfirmation.confirmedStaticHtmlSha256, /^[a-f0-9]{64}$/u);
  assert.equal(projectState.finalConfirmation.remoteStatus, 'draft');
});

test('editor exports substituted Omnisend HTML without preparing or creating a campaign draft', async (t) => {
  const calls = [];
  const sessionRoot = mkdtempSync(join(workspaceRoot, 'build/editor-runtime-omnisend-html-export-'));
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot,
    runDraftUploader: () => { throw new Error('draft uploader must not run during HTML export'); },
    runHtmlExporter: ({ html, assets, apiKey }) => {
      calls.push({ html, assets, apiKey });
      return { html: `${html}\n<!-- exported -->`, htmlSha256: 'a'.repeat(64), uploadedImageIDs: [] };
    }
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'HTML export only' })
  });
  const draftId = created.body.draft.id;
  const added = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'footer.warm' })
  });
  const instanceId = added.body.draft.components[0].instanceId;
  const image = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'image.clickableFullWidth' })
  });
  const imageInstanceId = image.body.draft.components.find(({ componentKey }) => componentKey === 'image.clickableFullWidth').instanceId;
  const localImage = await request(baseUrl, `/api/drafts/${draftId}/components/${imageInstanceId}/upload-image`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      fieldKey: 'image.url',
      filename: 'export.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg=='
    })
  });
  assert.equal(localImage.response.status, 200, localImage.body?.error);

  const unconfirmed = await request(baseUrl, `/api/drafts/${draftId}/export-omnisend-html`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: 'one-time-export-key' })
  });
  assert.equal(unconfirmed.response.status, 400);
  assert.match(unconfirmed.body.error, /confirm every selected component/);

  await request(baseUrl, `/api/drafts/${draftId}/components/${instanceId}/confirm`, { method: 'POST' });
  await request(baseUrl, `/api/drafts/${draftId}/components/${imageInstanceId}/confirm`, { method: 'POST' });
  const exported = await request(baseUrl, `/api/drafts/${draftId}/export-omnisend-html`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: 'one-time-export-key' })
  });
  assert.equal(exported.response.status, 200, exported.body?.error);
  assert.match(exported.body.html, /<!-- exported -->/);
  assert.equal(exported.body.htmlSha256, 'a'.repeat(64));
  assert.deepEqual(exported.body.uploadedImageIDs, []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].apiKey, 'one-time-export-key');
  assert.match(calls[0].html, /unsubscribe/);
  const exportedLocalImage = Object.values(calls[0].assets).find(({ name }) => name.startsWith('editor-upload-'));
  assert.ok(exportedLocalImage, 'exporter should receive the editor-local image asset');
  assert.match(exportedLocalImage.localPath, new RegExp(`^${sessionRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`));
  assert.equal(exportedLocalImage.mimeType, 'image/png');
  assert.equal(existsSync(join(sessionRoot, draftId, 'project-state.v1.json')), false);
  assert.equal(existsSync(join(sessionRoot, draftId, 'omnisend-draft-receipt.v1.json')), false);
  assert.equal(existsSync(join(sessionRoot, draftId, 'omnisend-html-export.static-safe.html')), false);
});

test('editor persists the Omnisend image cache across exports without storing the runtime key', async (t) => {
  const calls = [];
  const sessionRoot = mkdtempSync(join(workspaceRoot, 'build/editor-runtime-omnisend-image-cache-'));
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot,
    runHtmlExporter: ({ html, imageCache = {} }) => {
      calls.push(structuredClone(imageCache));
      imageCache['image-content-sha'] = { id: 'cached-image-1', url: 'https://app.omnisend.com/images/cached-image-1' };
      return { html, htmlSha256: 'b'.repeat(64), uploadedImageIDs: [], reusedImageIDs: [] };
    }
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());
  const created = await request(baseUrl, '/api/drafts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'image cache export' })
  });
  const draftId = created.body.draft.id;
  const footer = await request(baseUrl, `/api/drafts/${draftId}/components`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ componentKey: 'footer.warm' })
  });
  const footerId = footer.body.draft.components[0].instanceId;
  await request(baseUrl, `/api/drafts/${draftId}/components/${footerId}/confirm`, { method: 'POST' });

  for (let index = 0; index < 2; index += 1) {
    const exported = await request(baseUrl, `/api/drafts/${draftId}/export-omnisend-html`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: 'runtime-cache-key' })
    });
    assert.equal(exported.response.status, 200, exported.body?.error);
  }

  assert.deepEqual(calls[0], {});
  assert.deepEqual(calls[1], { 'image-content-sha': { id: 'cached-image-1', url: 'https://app.omnisend.com/images/cached-image-1' } });
  const cacheSource = readFileSync(join(sessionRoot, 'omnisend-image-cache.v1.json'), 'utf8');
  assert.match(cacheSource, /cached-image-1/);
  assert.doesNotMatch(cacheSource, /runtime-cache-key/);
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
  assert.match(css, /\.templatebar\s*\{[^}]*min-height:48px/s);
  assert.match(css, /\.workspace\s*\{[^}]*height:calc\(100vh - 126px\)[^}]*overflow:hidden/s);
  assert.match(css, /\.preview-pane\s*\{[^}]*grid-template-rows:auto minmax\(0,1fr\)[^}]*overflow:hidden/s);
  assert.match(css, /\.preview-stage\s*\{[^}]*min-height:0[^}]*overflow:auto/s);
  assert.match(css, /@media \(max-width:720px\)[\s\S]*?\.workspace\s*\{[^}]*grid-template-columns:1fr/s);
  assert.match(css, /@media \(max-width:720px\)[\s\S]*?\.preview-pane\s*\{[^}]*min-height:520px/s);
  assert.match(css, /@media \(max-width:720px\)[\s\S]*?\.topbar input\s*\{[^}]*width:100%/s);
});

test('editor client writes runtime component labels and errors as text rather than HTML', async (t) => {
  const server = await createCampaignEditorServer({
    workspaceRoot,
    sessionRoot: mkdtempSync(join(tmpdir(), 'freshine-editor-safe-dom-'))
  });
  const baseUrl = await server.listen();
  t.after(() => server.close());

  const client = await (await fetch(`${baseUrl}/editor/app.js`)).text();
  assert.doesNotMatch(client, /item\.innerHTML\s*=\s*`[^`]*\$\{instance\.(?:name|componentKey)\}/s);
  assert.doesNotMatch(client, /previewStage\.innerHTML\s*=\s*`[^`]*\$\{error\.message\}/s);
});
