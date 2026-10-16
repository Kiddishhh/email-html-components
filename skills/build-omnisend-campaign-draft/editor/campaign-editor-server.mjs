import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runDraftUploadWithApiKey, runOmnisendHtmlExportWithApiKey, sha256 } from '../scripts/upload-omnisend-draft.mjs';
import { editableFieldKeys } from './public/editor-ui-contract.mjs';
import { validateTextStyles, editorFontDefaults } from './public/text-style-contract.mjs';
import { linkInventory } from './public/editor-workflow.mjs';
import { withTemplateStoreLock } from './template-store-lock.mjs';
import {
  addComponentInstance,
  attachLocalImage,
  applyCurtainPromotionProductImport,
  applySaleGrid4ProductImport,
  applySaleGrid6ProductImport,
  applySaleGrid6WithTitleProductImport,
  applySaleGridImport,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument,
  normalizeDefaultLocalAssetReferences,
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
    request.on('aborted', () => reject(new Error('request body was aborted')));
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

function loadOmnisendImageCache(path) {
  if (!existsSync(path)) return { schemaVersion: 1, accounts: {} };
  try {
    const cache = readJson(path);
    if (cache?.schemaVersion !== 1 || !cache.accounts || typeof cache.accounts !== 'object' || Array.isArray(cache.accounts)) {
      return { schemaVersion: 1, accounts: {} };
    }
    return cache;
  } catch {
    return { schemaVersion: 1, accounts: {} };
  }
}

function imageCacheForApiKey(cache, apiKey) {
  const accountKey = sha256(apiKey);
  const imageCache = cache.accounts[accountKey];
  if (!imageCache || typeof imageCache !== 'object' || Array.isArray(imageCache)) cache.accounts[accountKey] = {};
  return cache.accounts[accountKey];
}

function requireInstance(document, instanceId) {
  const index = document.components.findIndex((component) => component.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  return { index, current: document.components[index] };
}

// 路由共用的「取草稿 + 定位实例」前置；命中失败时返回可直接响应的 404 文案。
function locateDraftInstance(drafts, draftId, instanceId) {
  const draft = drafts.get(draftId);
  if (!draft) return { error: 'draft not found' };
  const instance = draft.components.find((component) => component.instanceId === instanceId);
  if (!instance) return { error: 'component instance not found' };
  return { draft, instance };
}

function updateInstance(document, instanceId, patch, catalog) {
  const { index, current } = requireInstance(document, instanceId);
  for (const group of ['content', 'settings']) {
    if (patch[group] === undefined) continue;
    if (!patch[group] || typeof patch[group] !== 'object' || Array.isArray(patch[group])) throw new Error(`${group} patch must be an object`);
    for (const key of Object.keys(patch[group])) {
      if (!(key in current[group])) throw new Error(`unknown ${group} field: ${key}`);
    }
  }
  validateTextStyles(patch.textStyles, catalog.find(x => x.componentKey === current.componentKey).textFields);
  const components = document.components.map((component, componentIndex) => componentIndex === index ? {
    ...component,
    ...(patch.textStyles ? { textStyles: { ...component.textStyles, ...patch.textStyles } } : {}),
    content: { ...component.content, ...(patch.content ?? {}) },
    settings: { ...component.settings, ...(patch.settings ?? {}) },
    confirmed: false
  } : component);
  return { ...document, components, confirmed: false };
}

function confirmInstance(document, instanceId) {
  const { index } = requireInstance(document, instanceId);
  const components = document.components.map((component, componentIndex) => componentIndex === index ? {
    ...component,
    confirmed: true
  } : component);
  return { ...document, components, confirmed: components.length > 0 && components.every((component) => component.confirmed) };
}

export function formatSaleGridImportFailure(output) {
  const actionable = String(output).match(/Error:\s*((?:sale-grid|activity page|shopify (?:URL|collection handle)) [^\n\r]+)/u)?.[1];
  return new Error(actionable ?? 'Shopify sale-grid import failed');
}

function formatCurtainPromotionProductImportFailure(output) {
  const actionable = String(output).match(/Error:\s*((?:shopify product|curtain promotion product|shopify URL) [^\n\r]+)/u)?.[1];
  return new Error(actionable ?? 'Shopify curtain promotion product import failed');
}

function importSaleGrid({ workspaceRoot, instance, shopifyUrl, collectionHandle }) {
  if (instance.componentKey !== 'collection.saleGrid6') throw new Error('sale-grid import requires a collection.saleGrid6 instance');
  const hasShopifyUrl = typeof shopifyUrl === 'string' && Boolean(shopifyUrl.trim());
  const hasCollectionHandle = typeof collectionHandle === 'string' && Boolean(collectionHandle.trim());
  if (hasShopifyUrl === hasCollectionHandle) throw new Error('provide exactly one Shopify URL or collection handle');
  const script = resolve(workspaceRoot, 'skills/build-omnisend-campaign-draft/scripts/fetch-activity-page-sale-grid.mjs');
  const result = spawnSync(process.execPath, [script, hasCollectionHandle ? '--collection-handle' : '--shopify-url', hasCollectionHandle ? collectionHandle.trim() : shopifyUrl.trim()], {
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

function importCurtainPromotionProduct({ workspaceRoot, instance, shopifyUrl }) {
  if (!['collection.curtainPromotionCard', 'collection.curtainPromotionCardNoTitle'].includes(instance.componentKey)) {
    throw new Error('curtain promotion product import requires a curtain promotion card instance');
  }
  if (typeof shopifyUrl !== 'string' || !shopifyUrl.trim()) throw new Error('shopify product URL is required');
  const script = resolve(workspaceRoot, 'skills/build-omnisend-campaign-draft/scripts/fetch-single-product.mjs');
  const result = spawnSync(process.execPath, [script, '--shopify-url', shopifyUrl.trim()], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) throw formatCurtainPromotionProductImportFailure(result.stderr || result.stdout);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error('Shopify curtain promotion product import returned invalid JSON');
  }
}

function importSaleGrid4Product({ workspaceRoot, instance, shopifyUrl }) {
  if (!['collection.saleGrid4', 'collection.saleGrid4WithTitle', 'collection.sceneSaleGrid4WithTitle', 'collection.productGrid4NoSidePadding', 'collection.saleGrid4DetailWithTitle', 'collection.saleGrid6DetailWithTitle', 'collection.sceneSaleGrid6PriceWithTitle', 'collection.saleGrid6', 'collection.saleGrid6WithTitle'].includes(instance.componentKey)) throw new Error('grid product import requires a product-grid component instance');
  if (typeof shopifyUrl !== 'string' || !shopifyUrl.trim()) throw new Error('shopify product URL is required');
  const script = resolve(workspaceRoot, 'skills/build-omnisend-campaign-draft/scripts/fetch-single-product.mjs');
  const result = spawnSync(process.execPath, [script, '--shopify-url', shopifyUrl.trim()], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) throw formatCurtainPromotionProductImportFailure(result.stderr || result.stdout);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error('Shopify four-grid product import returned invalid JSON');
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
  const normalizedDocument = normalizeDefaultLocalAssetReferences(document, { workspaceRoot });
  return {
    schemaVersion: 1,
    canvas: normalizedDocument.canvas,
    fontDefaults: normalizedDocument.fontDefaults ?? editorFontDefaults,
    output: normalizedDocument.outputPath,
    previewOutput: normalizedDocument.previewPath,
    assets: buildLocalAssetMap(normalizedDocument, { workspaceRoot }),
    components: normalizedDocument.components.map(({ name, directory, componentKey, content, settings, textStyles }) => ({
      name, directory, componentKey, content, settings, ...(textStyles ? {textStyles} : {})
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

function assetExportMap(composition, workspaceRoot) {
  return Object.fromEntries(Object.entries(composition.assets ?? {}).map(([id, asset]) => [id, {
    localPath: resolve(workspaceRoot, asset.path),
    name: asset.name,
    mimeType: mimeType(asset.name)
  }]));
}

async function defaultDraftUploader({ projectPath, htmlPath, apiKey }) {
  return runDraftUploadWithApiKey({ projectPath, htmlPath, apiKey });
}

async function defaultHtmlExporter({ html, assets, apiKey, imageCache }) {
  return runOmnisendHtmlExportWithApiKey({ html, assets, apiKey, imageCache });
}

export async function createCampaignEditorServer({
  workspaceRoot,
  sessionRoot,
  templateRoot = resolve(workspaceRoot, 'campaign-drafts/editor-templates'),
  runDraftUploader = defaultDraftUploader,
  runHtmlExporter = defaultHtmlExporter
}) {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const drafts = new Map();
  const draftOperations = new Map();
  const catalogPreviews = new Map();
  const builderPath = resolve(workspaceRoot, 'build-email-template.v1.mjs');
  const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'public');
  const omnisendImageCachePath = resolve(sessionRoot, 'omnisend-image-cache.v1.json');
  const savedTemplatesPath = resolve(templateRoot, 'saved-templates.v1.json');
  const templateAssetsRoot = resolve(templateRoot, 'assets');
  mkdirSync(sessionRoot, { recursive: true });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadSavedTemplates() {
    if (!existsSync(savedTemplatesPath)) return [];
    const store = readJson(savedTemplatesPath);
    if (store?.schemaVersion !== 1 || !Array.isArray(store.templates)) throw new Error('saved template store is invalid');
    return store.templates;
  }

  function writeSavedTemplates(savedTemplates) {
    mkdirSync(templateRoot, { recursive: true });
    const temporaryPath = resolve(templateRoot, `.templates-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporaryPath, JSON.stringify({ schemaVersion: 1, templates: savedTemplates }, null, 2));
      renameSync(temporaryPath, savedTemplatesPath);
    } finally {
      removeTemplateGarbage(temporaryPath);
    }
  }

  async function templateOperation(operation) {
    const warnings = [];
    const result = await withTemplateStoreLock(templateRoot, operation, { onReleaseWarning: warning => warnings.push(warning) });
    return { result, warnings };
  }

  function templateSummary(template) {
    return {
      id: template.id,
      name: template.name,
      componentCount: template.snapshot.components.length,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };
  }

  function templateSummaries() {
    return loadSavedTemplates().map(templateSummary).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
  }

  function normalizedTemplateName(value) {
    const name = typeof value === 'string' ? value.trim() : '';
    if (!name || name.length > 80 || /[\u0000-\u001F\u007F]/u.test(name)) throw new Error('template name must contain 1 to 80 visible characters');
    return name;
  }

  function templateAssetDirectory(templateId) {
    return resolve(templateAssetsRoot, templateId);
  }

  function templateSnapshot(draft, templateId) {
    const assetDirectory = resolve(templateAssetDirectory(templateId), `.revision-${randomUUID()}`);
    const stagingDirectory = resolve(templateAssetsRoot, `.staging-${randomUUID()}`);
    const localAssets = {};
    mkdirSync(stagingDirectory, { recursive: true });
    try {
      for (const [assetId, asset] of Object.entries(draft.localAssets ?? {})) {
        const source = resolve(workspaceRoot, asset.path);
        const sourceRelative = relative(workspaceRoot, source);
        if (!sourceRelative || sourceRelative.startsWith('..') || !existsSync(source)) throw new Error(`template local asset is missing: ${asset.name}`);
        const targetDirectory = resolve(stagingDirectory, assetId);
        mkdirSync(targetDirectory, { recursive: true });
        const target = resolve(targetDirectory, asset.name);
        copyFileSync(source, target);
        localAssets[assetId] = {
          path: relative(workspaceRoot, resolve(assetDirectory, assetId, asset.name)),
          name: asset.name
        };
      }
      return {
        snapshot: {
          canvas: clone(draft.canvas),
          fontDefaults: draft.fontDefaults ?? editorFontDefaults,
          localAssets,
          components: draft.components.map(({ name, directory, componentKey, content, settings, textStyles }) => ({
            ...(textStyles ? {textStyles: clone(textStyles)} : {}),
            name,
            directory,
            componentKey,
            content: clone(content),
            settings: clone(settings)
          }))
        },
        stagingDirectory,
        assetDirectory
      };
    } catch (error) {
      removeTemplateGarbage(stagingDirectory);
      throw error;
    }
  }

  // Unreferenced files never determine whether a committed save succeeded.
  // Retry cleanup under the store lock on the next mutation after an I/O failure.
  function removeTemplateGarbage(path) {
    try { rmSync(path, { recursive: true, force: true }); } catch { /* retry later */ }
  }

  function cleanTemplateGarbage(savedTemplates) {
    try {
      for (const name of readdirSync(templateRoot)) {
        if (/^\.templates-.+\.tmp$/u.test(name)) removeTemplateGarbage(resolve(templateRoot, name));
      }
      if (!existsSync(templateAssetsRoot)) return;
      const current = new Map(savedTemplates.map(template => [template.id, template]));
      for (const entry of readdirSync(templateAssetsRoot, { withFileTypes: true })) {
        const directory = resolve(templateAssetsRoot, entry.name);
        if (entry.name.startsWith('.staging-')) { removeTemplateGarbage(directory); continue; }
        if (!entry.isDirectory() || !/^[0-9a-f-]+$/u.test(entry.name)) continue;
        const template = current.get(entry.name);
        if (!template) { removeTemplateGarbage(directory); continue; }
        const paths = Object.values(template.snapshot.localAssets ?? {}).map(asset => resolve(workspaceRoot, asset.path));
        for (const version of readdirSync(directory, { withFileTypes: true })) {
          if (!version.isDirectory() || !version.name.startsWith('.revision-')) continue;
          const versionPath = resolve(directory, version.name);
          if (!paths.some(path => { const child = relative(versionPath, path); return child && !child.startsWith('..'); })) removeTemplateGarbage(versionPath);
        }
      }
    } catch { /* committed templates remain usable; retry cleanup later */ }
  }

  function saveTemplate({ name: rawName, draftId, overwrite = false }) {
    // Called under the cross-process lock; conflict checks always use fresh data.
    const savedTemplates = loadSavedTemplates();
    const name = normalizedTemplateName(rawName);
    const draft = drafts.get(draftId);
    if (!draft) throw new Error('draft not found');
    const existingIndex = savedTemplates.findIndex((template) => template.name.localeCompare(name, 'zh-CN', { sensitivity: 'accent' }) === 0);
    if (existingIndex !== -1 && overwrite !== true) return { conflict: savedTemplates[existingIndex] };
    const now = new Date().toISOString();
    const existing = existingIndex === -1 ? null : savedTemplates[existingIndex];
    const templateId = existing?.id ?? randomUUID();
    cleanTemplateGarbage(savedTemplates);
    const snapshot = templateSnapshot(draft, templateId);
    const template = {
      schemaVersion: 1,
      id: templateId,
      name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      snapshot: snapshot.snapshot
    };
    try {
      if (existingIndex === -1) savedTemplates.push(template);
      else savedTemplates[existingIndex] = template;
      // Publish immutable assets first. The atomic index rename is the commit.
      mkdirSync(templateAssetDirectory(templateId), { recursive: true });
      renameSync(snapshot.stagingDirectory, snapshot.assetDirectory);
      writeSavedTemplates(savedTemplates);
    } catch (error) {
      if (existingIndex === -1) savedTemplates.pop();
      else savedTemplates[existingIndex] = existing;
      removeTemplateGarbage(snapshot.stagingDirectory);
      removeTemplateGarbage(snapshot.assetDirectory);
      throw error;
    }
    cleanTemplateGarbage(savedTemplates);
    return { template, overwritten: existingIndex !== -1 };
  }

  function draftSummary(draft) {
    return {
      id: draft.id,
      name: draft.name,
      canvas: draft.canvas,
      fontDefaults: draft.fontDefaults ?? editorFontDefaults,
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

  function copyTemplateAssetsToDraft(template, draft) {
    const uploadDirectory = resolve(dirname(draft.previewPath), 'uploads');
    const localAssets = {};
    for (const [assetId, asset] of Object.entries(template.snapshot.localAssets ?? {})) {
      const source = resolve(workspaceRoot, asset.path);
      const sourceRelative = relative(workspaceRoot, source);
      if (!sourceRelative || sourceRelative.startsWith('..') || !existsSync(source)) throw new Error(`template local asset is missing: ${asset.name}`);
      // Keep copies stable even when loading a legacy name with repeated prefixes.
      const filename = `${assetId}${extname(asset.name)}`;
      const target = resolve(uploadDirectory, filename);
      mkdirSync(uploadDirectory, { recursive: true });
      copyFileSync(source, target);
      localAssets[assetId] = { path: relative(workspaceRoot, target), name: filename };
    }
    return localAssets;
  }

  function createDraftFromTemplate(template) {
    const document = createDraft(template.name);
    const counts = new Map();
    document.canvas = clone(template.snapshot.canvas);
    document.fontDefaults = template.snapshot.fontDefaults ?? editorFontDefaults;
    document.localAssets = copyTemplateAssetsToDraft(template, document);
    document.components = template.snapshot.components.map((component) => {
      const count = (counts.get(component.componentKey) ?? 0) + 1;
      counts.set(component.componentKey, count);
      return {
        ...clone(component),
        instanceId: `${component.componentKey}-${count}`,
        source: `saved-template:${template.id}`,
        confirmed: false
      };
    });
    document.confirmed = false;
    drafts.set(document.id, document);
    return document;
  }

  function savePreview(draft, { inspectLinks = false } = {}) {
    const compositionPath = resolve(dirname(draft.previewPath), 'composition.v1.json');
    const composition = compositionFor(draft, workspaceRoot);
    if (inspectLinks) composition.previewOutput = resolve(dirname(draft.previewPath), 'links-inspection.html');
    writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
    const result = spawnSync(process.execPath, [builderPath, compositionPath, '--preview-local-assets', ...(inspectLinks ? ['--editor-link-metadata'] : [])], {
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

  async function exportOmnisendHtml(draft, apiKey) {
    assertFullyConfirmed(draft);
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('a non-empty runtime API key is required');
    const directory = dirname(draft.outputPath);
    const compositionPath = resolve(directory, 'omnisend-html-export.composition.v1.json');
    const htmlPath = resolve(directory, 'omnisend-html-export.static-safe.html');
    const composition = { ...compositionFor(draft, workspaceRoot), output: htmlPath };
    writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
    try {
      const result = spawnSync(process.execPath, [builderPath, compositionPath, '--defer-local-assets'], { cwd: workspaceRoot, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || 'Omnisend HTML export build failed');
      const cache = loadOmnisendImageCache(omnisendImageCachePath);
      const imageCache = imageCacheForApiKey(cache, apiKey);
      const exported = await runHtmlExporter({ html: readFileSync(htmlPath, 'utf8'), assets: assetExportMap(composition, workspaceRoot), apiKey, imageCache });
      writeFileSync(omnisendImageCachePath, JSON.stringify(cache, null, 2));
      return exported;
    } finally {
      apiKey = '';
      if (existsSync(htmlPath)) rmSync(htmlPath);
    }
  }

  async function handleRequest(request, response, path, body) {
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
      if (request.method === 'GET' && path === '/api/catalog') return json(response, 200, { components: catalog.map(component => ({ ...component, thumbnailUrl: `/catalog-previews/${encodeURIComponent(component.componentKey)}/` })) });
      const catalogPreviewMatch = path.match(/^\/catalog-previews\/([\w.-]+)\/?$/u);
      if (request.method === 'GET' && catalogPreviewMatch) {
        const key = catalogPreviewMatch[1];
        if (!catalog.some(component => component.componentKey === key)) return json(response, 404, { error: 'component not found' });
        if (!catalogPreviews.has(key)) {
          const document = createDraft(`组件缩略图 ${key}`);
          Object.assign(document, addComponentInstance(document, catalog, key));
          catalogPreviews.set(key, savePreview(document));
        }
        response.writeHead(302, { location: catalogPreviews.get(key), 'cache-control': 'no-store' });
        return response.end();
      }
      const linksMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/links$/u);
      if (request.method === 'GET' && linksMatch) {
        const draft = drafts.get(linksMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        savePreview(draft, { inspectLinks: true });
        const inspectionPath = resolve(dirname(draft.previewPath), 'links-inspection.html');
        return json(response, 200, { links: linkInventory(draft, catalog, readFileSync(inspectionPath, 'utf8'), editableFieldKeys) });
      }
      if (request.method === 'GET' && path === '/api/templates') return json(response, 200, { templates: templateSummaries() });
      if (request.method === 'POST' && path === '/api/templates') {
        const { result: saved, warnings } = await templateOperation(() => saveTemplate(body));
        if (saved.conflict) return json(response, 409, {
          error: `template name already exists: ${saved.conflict.name}`,
          code: 'template-name-conflict',
          template: templateSummary(saved.conflict)
        });
        return json(response, saved.overwritten ? 200 : 201, { template: templateSummary(saved.template), templates: templateSummaries(), warnings });
      }
      const templateDraftMatch = path.match(/^\/api\/templates\/([0-9a-f-]+)\/drafts$/u);
      if (templateDraftMatch && request.method === 'POST') {
        const { result: draft, warnings } = await templateOperation(() => {
          const template = loadSavedTemplates().find(({ id }) => id === templateDraftMatch[1]);
          return template ? draftSummary(createDraftFromTemplate(template)) : null;
        });
        if (!draft) return json(response, 404, { error: 'template not found' });
        return json(response, 201, { draft, warnings });
      }
      const templateMatch = path.match(/^\/api\/templates\/([0-9a-f-]+)$/u);
      if (templateMatch && request.method === 'DELETE') {
        const { result: deleted, warnings } = await templateOperation(() => {
          const savedTemplates = loadSavedTemplates();
          const index = savedTemplates.findIndex(({ id }) => id === templateMatch[1]);
          if (index === -1) return null;
          const [template] = savedTemplates.splice(index, 1);
          writeSavedTemplates(savedTemplates);
          cleanTemplateGarbage(savedTemplates);
          return template;
        });
        if (!deleted) return json(response, 404, { error: 'template not found' });
        return json(response, 200, { deleted: templateSummary(deleted), templates: templateSummaries(), warnings });
      }
      if (request.method === 'POST' && path === '/api/drafts') {
        return json(response, 201, { draft: draftSummary(createDraft(body.name)) });
      }
      const draftMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)(?:\/(components|preview))?$/u);
      if (draftMatch) {
        const [, draftId, action] = draftMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        if (request.method === 'GET' && !action) return json(response, 200, { draft: draftSummary(draft) });
        if (request.method === 'POST' && action === 'components') {
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
        return json(response, 200, prepareOmnisendDraft(draft, body.campaign));
      }
      const uploadDraftMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/upload-omnisend-draft$/u);
      if (uploadDraftMatch && request.method === 'POST') {
        const draft = drafts.get(uploadDraftMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        let apiKey = body.apiKey;
        try {
          return json(response, 200, { receipt: await uploadOmnisendDraft(draft, apiKey) });
        } finally {
          apiKey = '';
          body.apiKey = '';
        }
      }
      const exportHtmlMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/export-omnisend-html$/u);
      if (exportHtmlMatch && request.method === 'POST') {
        const draft = drafts.get(exportHtmlMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        let apiKey = body.apiKey;
        try {
          return json(response, 200, await exportOmnisendHtml(draft, apiKey));
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
        const updated = updateInstance(draft, instanceId, body, catalog);
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      if (instanceMatch && request.method === 'DELETE') {
        const [, draftId, instanceId] = instanceMatch;
        const draft = drafts.get(draftId);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        if (!draft.components.some((component) => component.instanceId === instanceId)) return json(response, 404, { error: 'component instance not found' });
        const updated = { ...draft, components: draft.components.filter((component) => component.instanceId !== instanceId)
          .map(component => ({ ...component, confirmed: false })), confirmed: false };
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
        const located = locateDraftInstance(drafts, draftId, instanceId);
        if (located.error) return json(response, 404, { error: located.error });
        const { draft, instance } = located;
        const updated = applySaleGridImport(draft, instanceId, importSaleGrid({ workspaceRoot, instance, shopifyUrl: body.shopifyUrl, collectionHandle: body.collectionHandle }));
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const curtainPromotionProductImportMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/import-shopify-product$/u);
      if (curtainPromotionProductImportMatch && request.method === 'POST') {
        const [, draftId, instanceId] = curtainPromotionProductImportMatch;
        const located = locateDraftInstance(drafts, draftId, instanceId);
        if (located.error) return json(response, 404, { error: located.error });
        const { draft, instance } = located;
        const updated = applyCurtainPromotionProductImport(draft, instanceId, importCurtainPromotionProduct({ workspaceRoot, instance, shopifyUrl: body.shopifyUrl }));
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const saleGrid4ProductImportMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/import-shopify-product\/([0-5])$/u);
      if (saleGrid4ProductImportMatch && request.method === 'POST') {
        const [, draftId, instanceId, itemIndex] = saleGrid4ProductImportMatch;
        const located = locateDraftInstance(drafts, draftId, instanceId);
        if (located.error) return json(response, 404, { error: located.error });
        const { draft, instance } = located;
        const productImport = importSaleGrid4Product({ workspaceRoot, instance, shopifyUrl: body.shopifyUrl });
        const updated = instance.componentKey === 'collection.saleGrid6WithTitle'
          ? applySaleGrid6WithTitleProductImport(draft, instanceId, Number(itemIndex), productImport)
          : instance.componentKey === 'collection.saleGrid6'
            ? applySaleGrid6ProductImport(draft, instanceId, Number(itemIndex), productImport)
          : applySaleGrid4ProductImport(draft, instanceId, Number(itemIndex), productImport);
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const reorderMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/reorder$/u);
      if (reorderMatch && request.method === 'POST') {
        const draft = drafts.get(reorderMatch[1]);
        if (!draft) return json(response, 404, { error: 'draft not found' });
        const { fromIndex, toIndex } = body;
        const updated = reorderComponentInstances(draft, fromIndex, toIndex);
        drafts.set(draft.id, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const uploadMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/components\/([\w.-]+)\/upload-image$/u);
      if (uploadMatch && request.method === 'POST') {
        const [, draftId, instanceId] = uploadMatch;
        const located = locateDraftInstance(drafts, draftId, instanceId);
        if (located.error) return json(response, 404, { error: located.error });
        const { draft, instance } = located;
        const updated = uploadLocalImage({ draft, instance, fieldKey: body.fieldKey, body, workspaceRoot, catalog });
        drafts.set(draftId, updated);
        return json(response, 200, { draft: draftSummary(updated) });
      }
      const previewAssetMatch = path.match(/^\/previews\/([0-9a-f-]+)\/uploads\/([a-z0-9-]+\.(?:png|jpe?g|webp|gif))$/u);
      if (request.method === 'GET' && previewAssetMatch) {
        const [, draftId, filename] = previewAssetMatch;
        const file = resolve(sessionRoot, draftId, 'uploads', filename);
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
  }

  const server = createServer(async (request, response) => {
    let release;
    let pending;
    let draftId;
    try {
      const path = new URL(request.url, 'http://127.0.0.1').pathname;
      const body = ['POST', 'PATCH', 'DELETE'].includes(request.method) ? await readBody(request) : {};
      draftId = path.match(/^\/api\/drafts\/([0-9a-f-]+)(?:\/|$)/u)?.[1]
        ?? (path === '/api/templates' && request.method === 'POST' ? body.draftId : undefined);
      if (draftId) {
        const previous = draftOperations.get(draftId);
        pending = new Promise(resolveOperation => { release = resolveOperation; });
        draftOperations.set(draftId, pending);
        await previous;
      }
      await handleRequest(request, response, path, body);
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    } finally {
      release?.();
      if (pending && draftOperations.get(draftId) === pending) draftOperations.delete(draftId);
    }
  });

  return {
    async listen(port = 0) {
      await new Promise((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));
      const address = server.address();
      return `http://127.0.0.1:${address.port}`;
    },
    async close() {
      try {
        await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
      } finally {
        rmSync(sessionRoot, { recursive: true, force: true });
      }
    }
  };
}
