import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_HOST = '127.0.0.1';
const APPROVED_SLOT_IDS = ['hero', 'sale-grid', 'clickable-image', 'gift', 'location', 'footer'];
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

export async function createCampaignEditorServer({ workspaceRoot, host = APPROVED_HOST, port = 0 }) {
  if (host !== APPROVED_HOST) throw new Error(`Campaign editor must bind to ${APPROVED_HOST}`);

  const root = resolve(workspaceRoot);
  const bootstrap = loadEditorBootstrap(root);
  const demoDirectories = bootstrap.components.map((component) => {
    const entry = readJson(join(root, '组件清单.json')).find((item) => item.componentKey === component.componentKey);
    return demoDirectoryFor(root, entry);
  });

  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${APPROVED_HOST}`);
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      writeJson(response, 200, bootstrap);
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/components/')) {
      const requestedPath = resolve(root, decodeURIComponent(url.pathname.slice('/components/'.length)));
      if (!demoDirectories.some((directory) => requestedPath === directory || isWithin(directory, requestedPath)) || !existsSync(requestedPath) || !statSync(requestedPath).isFile()) {
        writeJson(response, 404, { error: 'not found' });
        return;
      }
      response.writeHead(200, { 'Content-Type': contentTypeFor(requestedPath), 'Cache-Control': 'no-store' });
      response.end(readFileSync(requestedPath));
      return;
    }

    writeJson(response, 404, { error: 'not found' });
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
