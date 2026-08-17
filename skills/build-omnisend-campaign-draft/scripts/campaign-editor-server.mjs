import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_HOST = '127.0.0.1';
const APPROVED_SLOT_IDS = ['hero', 'sale-grid', 'clickable-image', 'gift', 'location', 'footer'];
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const IMAGE_EXTENSIONS = new Map([
  ['image/jpeg', new Set(['.jpeg', '.jpg'])],
  ['image/png', new Set(['.png'])],
  ['image/gif', new Set(['.gif'])],
  ['image/webp', new Set(['.webp'])]
]);
const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isWithin(parent, child) {
  const pathFromParent = relative(parent, child);
  return pathFromParent && !pathFromParent.startsWith(`..${sep}`) && pathFromParent !== '..' && !pathFromParent.includes(`${sep}..${sep}`);
}

function demoUrlFor(entry) {
  const templatePath = entry.路径?.组件模板;
  if (typeof templatePath !== 'string') throw new Error(`Campaign candidate has no template path: ${entry.componentKey}`);
  return `/components/${relative('.', join(templatePath, '..', '效果演示.html'))}`;
}

function demoDirectoryFor(workspaceRoot, entry) {
  const demoPath = resolve(workspaceRoot, demoUrlFor(entry).replace('/components/', ''));
  if (!existsSync(demoPath)) throw new Error(`Campaign candidate preview is unavailable: ${entry.componentKey}`);
  return resolve(demoPath, '..');
}

function contentTypeFor(path) {
  return {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.webp': 'image/webp'
  }[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

export function safeDraftPath(workspaceRoot, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('draft slug is invalid');
  return join(resolve(workspaceRoot), 'campaign-drafts', slug);
}

export function writeDraft({ workspaceRoot, slug, state }) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('draft state must be an object');
  validateDraftAssetPaths(workspaceRoot, slug, state.campaign?.assets);
  const draftDirectory = safeDraftPath(workspaceRoot, slug);
  mkdirSync(draftDirectory, { recursive: true });
  const draftPath = join(draftDirectory, 'project-state.v1.json');
  writeFileSync(draftPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return draftPath;
}

export function saveAsset({ workspaceRoot, slug, filename, contentType, bytes }) {
  const normalizedType = typeof contentType === 'string' ? contentType.split(';', 1)[0].trim().toLowerCase() : '';
  const assetName = typeof filename === 'string' ? filename.split(/[\\/]/).pop() : '';
  if (!IMAGE_TYPES.has(normalizedType) || !Buffer.isBuffer(bytes) || bytes.length > 5 * 1024 * 1024 || !assetName || !IMAGE_EXTENSIONS.get(normalizedType).has(extname(assetName).toLowerCase())) {
    throw new Error('unsupported image');
  }
  const assetDirectory = join(safeDraftPath(workspaceRoot, slug), 'assets');
  mkdirSync(assetDirectory, { recursive: true });
  const assetId = `${randomUUID()}-${assetName}`.split('.')[0];
  const assetPath = join(assetDirectory, `${assetId}${extname(assetName).toLowerCase()}`);
  writeFileSync(assetPath, bytes, { flag: 'wx' });
  return { assetId, localPath: relative(resolve(workspaceRoot), assetPath) };
}

export function loadEditorBootstrap(workspaceRoot) {
  const root = resolve(workspaceRoot);
  const structure = readJson(join(root, 'skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json'));
  const interactions = new Map(
    readJson(join(root, 'skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json'))
      .interactions
      .map((entry) => [entry.componentKey, entry])
  );
  const registry = readJson(join(root, '组件清单.json'));
  const slots = structure.slots;

  if (JSON.stringify(slots.map(({ id }) => id)) !== JSON.stringify(APPROVED_SLOT_IDS)) {
    throw new Error('Campaign structure must contain the approved six slots in order');
  }

  const components = slots.flatMap((slot) => slot.candidateComponentKeys.map((componentKey) => {
    const entry = registry.find((item) => item.componentKey === componentKey);
    if (!entry || !interactions.has(componentKey)) {
      throw new Error(`Campaign candidate is unavailable: ${componentKey}`);
    }
    demoDirectoryFor(root, entry);
    return {
      slotId: slot.id,
      componentKey,
      name: entry.中文名称,
      demoUrl: demoUrlFor(entry)
    };
  }));

  return { slots, components };
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(body));
}

function readRequestBody(request, limit = 5 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        rejectBody(new Error('request body is too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.once('end', () => resolveBody(Buffer.concat(chunks)));
    request.once('error', rejectBody);
  });
}

function readDraft(workspaceRoot, slug) {
  return readJson(join(safeDraftPath(workspaceRoot, slug), 'project-state.v1.json'));
}

function previewComposition(workspaceRoot, slug, state) {
  const expectedComponentKeys = loadEditorBootstrap(workspaceRoot).components.map(({ componentKey }) => componentKey);
  if (!state?.campaign || typeof state.campaign !== 'object' || Array.isArray(state.campaign) || !Array.isArray(state.components)) {
    throw new Error('draft preview requires campaign and components');
  }
  if (state.components.length !== expectedComponentKeys.length || state.components.map(({ componentKey }) => componentKey).join(',') !== expectedComponentKeys.join(',')) {
    throw new Error('draft preview requires exactly six complete snapshots in approved order');
  }
  const draftDirectory = safeDraftPath(workspaceRoot, slug);
  validateDraftAssetPaths(workspaceRoot, slug, state.campaign.assets);
  return {
    schemaVersion: 1,
    canvas: state.campaign.canvas,
    output: relative(workspaceRoot, join(draftDirectory, 'campaign.static-safe.html')),
    previewOutput: relative(workspaceRoot, join(draftDirectory, 'campaign.local-preview.html')),
    assets: state.campaign.assets ?? {},
    components: state.components
  };
}

function validateDraftAssetPaths(workspaceRoot, slug, assets) {
  if (assets === undefined) return;
  if (!assets || typeof assets !== 'object' || Array.isArray(assets)) throw new Error('draft assets must be an object');
  const assetDirectory = join(safeDraftPath(workspaceRoot, slug), 'assets');
  for (const asset of Object.values(assets)) {
    if (!asset || typeof asset.path !== 'string' || !isWithin(assetDirectory, resolve(workspaceRoot, asset.path))) {
      throw new Error('draft asset must stay inside this draft assets directory');
    }
  }
}

function removeExternalPreviewFontLinks(previewPath) {
  const preview = readFileSync(previewPath, 'utf8');
  const localOnlyPreview = preview.replace(/<link\b[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, '');
  writeFileSync(previewPath, localOnlyPreview, 'utf8');
}

function generateLocalPreview(workspaceRoot, slug) {
  const draftDirectory = safeDraftPath(workspaceRoot, slug);
  const compositionPath = join(draftDirectory, 'composition.local-preview.v1.json');
  writeFileSync(compositionPath, `${JSON.stringify(previewComposition(workspaceRoot, slug, readDraft(workspaceRoot, slug)), null, 2)}\n`, 'utf8');
  const result = spawnSync(process.execPath, [
    join(workspaceRoot, 'build-email-template.v1.mjs'),
    compositionPath,
    '--preview-local-assets'
  ], { cwd: workspaceRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'local preview generation failed').trim());
  removeExternalPreviewFontLinks(join(draftDirectory, 'campaign.local-preview.html'));
  return `/drafts/${slug}/preview`;
}

function safeDraftRequestPath(workspaceRoot, slug, requestedPath) {
  const draftDirectory = safeDraftPath(workspaceRoot, slug);
  const resolvedPath = resolve(draftDirectory, requestedPath);
  if (!isWithin(draftDirectory, resolvedPath)) throw new Error('draft path is invalid');
  return resolvedPath;
}

function safeDraftAssetRequestPath(workspaceRoot, slug, requestedPath) {
  const assetDirectory = join(safeDraftPath(workspaceRoot, slug), 'assets');
  const resolvedPath = resolve(assetDirectory, requestedPath);
  if (!isWithin(assetDirectory, resolvedPath)) throw new Error('draft asset path is invalid');
  return resolvedPath;
}

function sendDraftFile(response, path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    writeJson(response, 404, { error: 'not found' });
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypeFor(path), 'Cache-Control': 'no-store' });
  response.end(readFileSync(path));
}

async function handleEditorRequest({ request, response, workspaceRoot, bootstrap, demoDirectories }) {
  const url = new URL(request.url, `http://${APPROVED_HOST}`);
  if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
    writeJson(response, 200, bootstrap);
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/components/')) {
    const requestedPath = resolve(workspaceRoot, decodeURIComponent(url.pathname.slice('/components/'.length)));
    if (!demoDirectories.some((directory) => requestedPath === directory || isWithin(directory, requestedPath)) || !existsSync(requestedPath) || !statSync(requestedPath).isFile()) {
      writeJson(response, 404, { error: 'not found' });
      return;
    }
    sendDraftFile(response, requestedPath);
    return;
  }

  const apiMatch = url.pathname.match(/^\/api\/drafts\/([^/]+)(?:\/(assets|preview))?$/);
  if (apiMatch) {
    const slug = decodeURIComponent(apiMatch[1]);
    const action = apiMatch[2];
    if (request.method === 'PUT' && !action) {
      const body = JSON.parse((await readRequestBody(request)).toString('utf8'));
      const draftPath = writeDraft({ workspaceRoot, slug, state: body.state });
      writeJson(response, 200, { draftPath: relative(workspaceRoot, draftPath) });
      return;
    }
    if (request.method === 'POST' && action === 'assets') {
      const asset = saveAsset({
        workspaceRoot,
        slug,
        filename: request.headers['x-filename'],
        contentType: request.headers['content-type'],
        bytes: await readRequestBody(request)
      });
      writeJson(response, 201, asset);
      return;
    }
    if (request.method === 'POST' && action === 'preview') {
      writeJson(response, 200, { previewUrl: generateLocalPreview(workspaceRoot, slug) });
      return;
    }
  }

  const previewMatch = url.pathname.match(/^\/drafts\/([^/]+)\/preview$/);
  if (request.method === 'GET' && previewMatch) {
    sendDraftFile(response, safeDraftRequestPath(workspaceRoot, decodeURIComponent(previewMatch[1]), 'campaign.local-preview.html'));
    return;
  }

  const assetMatch = url.pathname.match(/^\/drafts\/([^/]+)\/assets\/(.+)$/);
  if (request.method === 'GET' && assetMatch) {
    sendDraftFile(response, safeDraftAssetRequestPath(workspaceRoot, decodeURIComponent(assetMatch[1]), decodeURIComponent(assetMatch[2])));
    return;
  }

  writeJson(response, 404, { error: 'not found' });
}

export async function createCampaignEditorServer({ workspaceRoot, host = APPROVED_HOST, port = 0 }) {
  if (host !== APPROVED_HOST) throw new Error(`Campaign editor must bind to ${APPROVED_HOST}`);

  const root = resolve(workspaceRoot);
  const bootstrap = loadEditorBootstrap(root);
  const demoDirectories = bootstrap.components.map((component) => {
    const entry = readJson(join(root, '组件清单.json')).find((item) => item.componentKey === component.componentKey);
    return demoDirectoryFor(root, entry);
  });

  const server = createServer((request, response) => {
    handleEditorRequest({ request, response, workspaceRoot: root, bootstrap, demoDirectories }).catch((error) => {
      if (!response.headersSent) writeJson(response, 400, { error: error.message });
      else response.destroy(error);
    });
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, APPROVED_HOST, () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Campaign editor did not receive a TCP address');
  const url = `http://${APPROVED_HOST}:${address.port}/`;
  return {
    server,
    url,
    close: () => new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()))
  };
}

async function runFromCommandLine() {
  const args = process.argv.slice(2);
  const workspaceOption = args.indexOf('--workspace');
  const portOption = args.indexOf('--port');
  const hostOption = args.indexOf('--host');
  const workspaceRoot = workspaceOption === -1 ? resolve(scriptDirectory, '../../..') : resolve(args[workspaceOption + 1] ?? '');
  const port = portOption === -1 ? 0 : Number(args[portOption + 1]);
  const host = hostOption === -1 ? APPROVED_HOST : args[hostOption + 1];

  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Campaign editor port is invalid');
  const editor = await createCampaignEditorServer({ workspaceRoot, host, port });
  process.stdout.write(`${editor.url}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runFromCommandLine().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
