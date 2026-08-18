import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runDraftUploadWithApiKey } from '../scripts/upload-omnisend-draft.mjs';
import {
  addComponentInstance,
  attachLocalImage,
  applySaleGridImport,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument,
  reorderComponentInstances
} from './campaign-editor-core.mjs';

function json(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      if (!body) return resolveBody({});
      try { return resolveBody(JSON.parse(body)); } catch { return reject(new Error('request body must be JSON')); }
    });
    request.on('error', reject);
  });
}

function decodeLocalImageUpload(body) {
  if (typeof body?.dataUrl !== 'string' || body.dataUrl.length > 7_000_000) throw new Error('uploaded image is too large');
  const match = body.dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/u);
  if (!match) throw new Error('uploaded file must be a PNG, JPEG, WEBP, or GIF image');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) throw new Error('uploaded image must be no larger than 5 MB');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  return { buffer, extension };
}

function safeFile(root, pathname) {
  const candidate = resolve(root, `.${decodeURIComponent(pathname)}`);
  const fromRoot = relative(root, candidate);
  if (fromRoot.startsWith('..') || fromRoot === '') return null;
  return candidate;
}

function mimeType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function updateInstance(document, instanceId, patch) {
  const index = document.components.findIndex((component) => component.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  const current = document.components[index];
  for (const group of ['content', 'settings']) {
    if (patch[group] === undefined) continue;
    if (!patch[group] || typeof patch[group] !== 'object' || Array.isArray(patch[group])) throw new Error(`${group} patch must be an object`);
    for (const key of Object.keys(patch[group])) {
      if (!(key in current[group])) throw new Error(`unknown ${group} field: ${key}`);
    }
  }
  const components = document.components.map((component, componentIndex) => componentIndex === index ? {
    ...component,
    content: { ...component.content, ...(patch.content ?? {}) },
    settings: { ...component.settings, ...(patch.settings ?? {}) },
    confirmed: false
  } : component);
  return { ...document, components, confirmed: false };
}

function confirmInstance(document, instanceId) {
  const index = document.components.findIndex((component) => component.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  const components = document.components.map((component, componentIndex) => componentIndex === index ? {
    ...component,
    confirmed: true
  } : component);
  return { ...document, components, confirmed: components.length > 0 && components.every((component) => component.confirmed) };
}

export function formatSaleGridImportFailure(output) {
  const actionable = String(output).match(/Error:\s*((?:sale-grid|activity page|shopify URL) [^\n\r]+)/u)?.[1];
  return new Error(actionable ?? 'Shopify sale-grid import failed');
}

function importSaleGrid({ workspaceRoot, instance, shopifyUrl }) {
  if (instance.componentKey !== 'collection.saleGrid6') throw new Error('sale-grid import requires a collection.saleGrid6 instance');
  if (typeof shopifyUrl !== 'string' || !shopifyUrl.trim()) throw new Error('shopify URL is required');
  const script = resolve(workspaceRoot, 'skills/build-omnisend-campaign-draft/scripts/fetch-activity-page-sale-grid.mjs');
  const result = spawnSync(process.execPath, [script, '--shopify-url', shopifyUrl.trim()], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) throw formatSaleGridImportFailure(result.stderr || result.stdout);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error('Shopify sale-grid import returned invalid JSON');
  }
}

function uploadLocalImage({ draft, instance, fieldKey, body, workspaceRoot, catalog }) {
  const component = catalog.find((candidate) => candidate.componentKey === instance.componentKey);
  const definition = component?.contentSchema?.properties?.[fieldKey];
  if (!definition?.role?.endsWith('image-source')) throw new Error('this field does not accept an uploaded image');
  const { buffer, extension } = decodeLocalImageUpload(body);
  const assetId = `editor-upload-${randomUUID()}`;
  const filename = `${assetId}.${extension}`;
  const uploadDirectory = resolve(dirname(draft.previewPath), 'uploads');
  mkdirSync(uploadDirectory, { recursive: true });
  const path = resolve(uploadDirectory, filename);
  writeFileSync(path, buffer);
  const relativePath = relative(workspaceRoot, path);
  return attachLocalImage(draft, instance.instanceId, fieldKey, { id: assetId, path: relativePath, name: filename });
}

function compositionFor(document, workspaceRoot) {
  return {
    schemaVersion: 1,
    canvas: document.canvas,
    output: document.outputPath,
    previewOutput: document.previewPath,
    assets: buildLocalAssetMap(document, { workspaceRoot }),
    components: document.components.map(({ name, directory, componentKey, content, settings }) => ({
      name, directory, componentKey, content, settings
    }))
  };
}

function assertFullyConfirmed(draft) {
  if (!draft.confirmed || draft.components.length === 0 || draft.components.some((component) => !component.confirmed)) {
    throw new Error('confirm every selected component before preparing an Omnisend draft');
  }
}

function normalizeCampaignMetadata(campaign) {
  if (!campaign || typeof campaign !== 'object' || Array.isArray(campaign)) throw new Error('campaign metadata is required');
  const name = typeof campaign.name === 'string' ? campaign.name.trim() : '';
  const subject = typeof campaign.subject === 'string' ? campaign.subject.trim() : '';
  const preheader = typeof campaign.preheader === 'string' ? campaign.preheader.trim() : '';
  if (!name || !subject) throw new Error('campaign name and subject are required');
  return { name, subject, preheader };
}

function assetUploadState(draft, workspaceRoot, projectPath) {
  const assets = buildLocalAssetMap(draft, { workspaceRoot });
  return Object.fromEntries(Object.entries(assets).map(([id, asset]) => {
    const localPath = relative(dirname(projectPath), resolve(workspaceRoot, asset.path));
    return [id, { localPath, name: asset.name, mimeType: mimeType(asset.name) }];
  }));
}

async function defaultDraftUploader({ projectPath, htmlPath, apiKey }) {
  return runDraftUploadWithApiKey({ projectPath, htmlPath, apiKey });
}

export async function createCampaignEditorServer({ workspaceRoot, sessionRoot, runDraftUploader = defaultDraftUploader }) {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const drafts = new Map();
  const builderPath = resolve(workspaceRoot, 'build-email-template.v1.mjs');
  const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'public');

  function draftSummary(draft) {
    return {
      id: draft.id,
      name: draft.name,
      canvas: draft.canvas,
      components: draft.components,
      confirmed: draft.confirmed
    };
  }

  function createDraft(name) {
    const id = randomUUID();
    const directory = resolve(sessionRoot, id);
    mkdirSync(directory, { recursive: true });
    const document = createCampaignDocument({ name: typeof name === 'string' && name.trim() ? name.trim() : '未命名 Campaign' });
    document.id = id;
    document.outputPath = resolve(directory, 'campaign.static-safe.html');
    document.previewPath = resolve(directory, 'campaign.local-preview.html');
    drafts.set(id, document);
    return document;
  }

  function savePreview(draft) {
    const compositionPath = resolve(dirname(draft.previewPath), 'composition.v1.json');
    writeFileSync(compositionPath, JSON.stringify(compositionFor(draft, workspaceRoot), null, 2));
    const result = spawnSync(process.execPath, [builderPath, compositionPath, '--preview-local-assets'], {
      cwd: workspaceRoot,
      encoding: 'utf8'
    });
    if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || 'preview build failed');
    return `/previews/${draft.id}/`;
  }

  function prepareOmnisendDraft(draft, campaign) {
    assertFullyConfirmed(draft);
    const normalizedCampaign = normalizeCampaignMetadata(campaign);
    const directory = dirname(draft.outputPath);
    const compositionPath = resolve(directory, 'composition.v1.json');
    const projectPath = resolve(directory, 'project-state.v1.json');
    writeFileSync(compositionPath, JSON.stringify(compositionFor(draft, workspaceRoot), null, 2));
    const result = spawnSync(process.execPath, [builderPath, compositionPath, '--defer-local-assets'], { cwd: workspaceRoot, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || 'static-safe source build failed');
    const html = readFileSync(draft.outputPath, 'utf8');
    const staticHtmlSha256 = sha256(html);
    const projectState = {
      schemaVersion: 1,
      campaign: normalizedCampaign,
      components: Object.fromEntries(draft.components.map((component) => [component.instanceId, { componentKey: component.componentKey, status: 'confirmed' }])),
      finalConfirmation: {
        status: 'pending',
        confirmedStaticHtmlSha256: staticHtmlSha256,
        ...(draft.upload?.receipt?.campaignID ? { campaignID: draft.upload.receipt.campaignID, contentID: draft.upload.receipt.contentID } : {})
      },
      assets: assetUploadState(draft, workspaceRoot, projectPath)
    };
    writeFileSync(projectPath, JSON.stringify(projectState, null, 2));
    draft.upload = { projectPath, staticHtmlSha256 };
    return { ready: true };
  }

  async function uploadOmnisendDraft(draft, apiKey) {
    assertFullyConfirmed(draft);
    if (!draft.upload?.projectPath || !draft.upload.staticHtmlSha256) throw new Error('prepare the Omnisend draft before uploading');
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('a non-empty runtime API key is required');
    const projectState = readJson(draft.upload.projectPath);
    projectState.finalConfirmation.status = 'confirmed';
    projectState.finalConfirmation.confirmedStaticHtmlSha256 = draft.upload.staticHtmlSha256;
    writeFileSync(draft.upload.projectPath, JSON.stringify(projectState, null, 2));
    try {
      const receipt = await runDraftUploader({ workspaceRoot, projectPath: draft.upload.projectPath, htmlPath: draft.outputPath, apiKey });
      if (receipt?.status !== 'draft') throw new Error('Omnisend upload did not return a draft receipt');
      projectState.finalConfirmation.remoteStatus = 'draft';
      if (receipt.campaignID && receipt.contentID) {
        projectState.finalConfirmation.campaignID = receipt.campaignID;
        projectState.finalConfirmation.contentID = receipt.contentID;
      }
      writeFileSync(draft.upload.projectPath, JSON.stringify(projectState, null, 2));
      writeFileSync(resolve(dirname(draft.upload.projectPath), 'omnisend-draft-receipt.v1.json'), JSON.stringify(receipt, null, 2));
      draft.upload = { ...draft.upload, receipt };
      return receipt;
    } finally {
      apiKey = '';
    }
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const path = url.pathname;
      if (request.method === 'GET' && path === '/') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return response.end(readFileSync(resolve(publicRoot, 'index.html')));
      }
      if (request.method === 'GET' && path.startsWith('/editor/')) {
        const file = safeFile(publicRoot, path.slice('/editor'.length));
        if (!file || !existsSync(file)) return json(response, 404, { error: 'not found' });
        response.writeHead(200, { 'content-type': mimeType(file), 'cache-control': 'no-store' });
        return response.end(readFileSync(file));
      }
      if (request.method === 'GET' && path === '/api/catalog') return json(response, 200, { components: catalog });
      if (request.method === 'POST' && path === '/api/drafts') {
        const body = await readBody(request);
        return json(response, 201, { draft: draftSummary(createDraft(body.name)) });
      }
      const draftMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)(?:\/(components|preview))?$/u);
      if (draftMatch) {
        const [, draftId, action] = draftMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        if (request.method === 'GET' && !action) return json(response, 200, { draft: draftSummary(draft) });
        if (request.method === 'POST' && action === 'components') {
          const body = await readBody(request);
          const updated = addComponentInstance(draft, catalog, body.componentKey);
          updated.id = draft.id;
          updated.outputPath = draft.outputPath;
          updated.previewPath = draft.previewPath;
          drafts.set(draftId, updated);
          return json(response, 200, { draft: draftSummary(updated) });
        }
        if (request.method === 'POST' && action === 'preview') {
          return json(response, 200, { previewUrl: savePreview(draft) });
        }
      }
      const prepareUploadMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/prepare-omnisend-draft$/u);
      if (prepareUploadMatch && request.method === 'POST') {
        const draft = drafts.get(prepareUploadMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const body = await readBody(request);
        return json(response, 200, prepareOmnisendDraft(draft, body.campaign));
      }
      const uploadDraftMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/upload-omnisend-draft$/u);
      if (uploadDraftMatch && request.method === 'POST') {
        const draft = drafts.get(uploadDraftMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const body = await readBody(request);
        let apiKey = body.apiKey;
        try {
          return json(response, 200, { receipt: await uploadOmnisendDraft(draft, apiKey) });
        } finally {
          apiKey = '';
          body.apiKey = '';
        }
      }
      const instanceMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)$/u);
      if (instanceMatch && request.method === 'PATCH') {
        const [, draftId, instanceId] = instanceMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const updated = updateInstance(draft, instanceId, await readBody(request));
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      if (instanceMatch && request.method === 'DELETE') {
        const [, draftId, instanceId] = instanceMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        if (!draft.components.some((component) => component.instanceId === instanceId)) return json(response, 404, { error: 'component instance not found' });
        const updated = { ...draft, components: draft.components.filter((component) => component.instanceId !== instanceId), confirmed: false };
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const confirmMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/confirm$/u);
      if (confirmMatch && request.method === 'POST') {
        const [, draftId, instanceId] = confirmMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const updated = confirmInstance(draft, instanceId);
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const saleGridImportMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/import-sale-grid$/u);
      if (saleGridImportMatch && request.method === 'POST') {
        const [, draftId, instanceId] = saleGridImportMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const instance = draft.components.find((component) => component.instanceId === instanceId);
        if (!instance) return json(response, 404, { error: 'component instance not found' });
        const body = await readBody(request);
        const updated = applySaleGridImport(draft, instanceId, importSaleGrid({ workspaceRoot, instance, shopifyUrl: body.shopifyUrl }));
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const reorderMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/reorder$/u);
      if (reorderMatch && request.method === 'POST') {
        const draft = drafts.get(reorderMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const { fromIndex, toIndex } = await readBody(request);
        const updated = reorderComponentInstances(draft, fromIndex, toIndex);
        drafts.set(draft.id, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const uploadMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/upload-image$/u);
      if (uploadMatch && request.method === 'POST') {
        const [, draftId, instanceId] = uploadMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const instance = draft.components.find((component) => component.instanceId === instanceId);
        if (!instance) return json(response, 404, { error: 'component instance not found' });
        const body = await readBody(request);
        const updated = uploadLocalImage({ draft, instance, fieldKey: body.fieldKey, body, workspaceRoot, catalog });
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const previewAssetMatch = path.match(/^\/previews\/([0-9a-f-]+)\/uploads\/([a-z0-9-]+\.(?:png|jpe?g|webp|gif))$/u);
      if (request.method === 'GET' && previewAssetMatch) {
        const [, draftId, filename] = previewAssetMatch;
        const draft = drafts.get(draftId);
        const file = draft ? resolve(dirname(draft.previewPath), 'uploads', filename) : null;
        if (!file || !existsSync(file)) return json(response, 404, { error: 'preview asset not found' });
        response.writeHead(200, { 'content-type': mimeType(file), 'cache-control': 'no-store' });
        return response.end(readFileSync(file));
      }
      const previewMatch = path.match(/^\/previews\/([0-9a-f-]+)\/?$/u);
      if (request.method === 'GET' && previewMatch) {
        const draft = drafts.get(previewMatch[1]);
        if (!draft || !existsSync(draft.previewPath)) return json(response, 404, { error: 'preview not found' });
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return response.end(readFileSync(draft.previewPath));
      }
      if (request.method === 'GET') {
        const file = safeFile(workspaceRoot, path);
        if (file && existsSync(file)) {
          response.writeHead(200, { 'content-type': mimeType(file), 'cache-control': 'no-store' });
          return response.end(readFileSync(file));
        }
      }
      return json(response, 404, { error: 'not found' });
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  });

  return {
    async listen(port = 0) {
      await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));
      const address = server.address();
      return `http://127.0.0.1:${address.port}`;
    },
    async close() {
      await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
    }
  };
}
