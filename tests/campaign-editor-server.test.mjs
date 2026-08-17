import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createCampaignEditorServer,
  loadEditorBootstrap,
  safeDraftPath,
  saveAsset,
  writeDraft
} from '../skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const startScript = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs', import.meta.url));
const serverScript = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs', import.meta.url));
const editorIndex = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/editor/index.html', import.meta.url));
const editorApp = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/editor/app.js', import.meta.url));
const defaultComposition = JSON.parse(readFileSync(join(workspaceRoot, 'compositions/hero-grid-review-gifts-location.default.v1.json'), 'utf8'));
const validProjectState = {
  campaign: {
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    assets: {}
  },
  components: []
};

test('static editor provides local image inputs and fixed desktop and mobile previews without remote Campaign actions', () => {
  const html = readFileSync(editorIndex, 'utf8');
  const app = readFileSync(editorApp, 'utf8');
  const server = readFileSync(serverScript, 'utf8');

  assert.match(html, /data-editor-preview="desktop"/);
  assert.match(html, /data-editor-preview="mobile"/);
  assert.match(html, /type="file"[^>]*accept="image\/jpeg,image\/png,image\/gif,image\/webp"/);
  assert.match(app, /\/api\/bootstrap/);
  assert.match(app, /default-logo-white\.png/);
  assert.match(html, /data-confirm-static-html/);
  assert.match(html, /data-upload-draft[^>]*disabled/);
  assert.match(app, /\/confirm/);
  assert.match(app, /\/upload/);
  const invalidationFunction = app.match(/function invalidateConfirmation\(\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(invalidationFunction, /editor\.lastPreviewHtml = null;/);
  assert.match(invalidationFunction, /elements\.uploadDraft\.disabled = true;/);
  assert.doesNotMatch(`${html}\n${app}`, /api\.omnisend\.com|\/send|publish|schedule|activate/);
  assert.doesNotMatch(server, /\/send|\/publish|\/schedule|\/activate/);
});

test('scoped draft helpers reject unsafe paths and keep persisted drafts and images under the draft directory', () => {
  const temporaryWorkspace = mkdtempSync(join(tmpdir(), 'freshine-campaign-editor-draft-'));

  try {
    assert.throws(() => safeDraftPath(temporaryWorkspace, '../outside'), /slug/);

    const saved = writeDraft({
      workspaceRoot: temporaryWorkspace,
      slug: 'late-summer-sale',
      state: validProjectState
    });
    assert.deepEqual(JSON.parse(readFileSync(saved, 'utf8')), validProjectState);
    assert.match(relative(temporaryWorkspace, saved), /^campaign-drafts\/late-summer-sale\/project-state\.v1\.json$/);

    assert.throws(
      () => saveAsset({
        workspaceRoot: temporaryWorkspace,
        slug: 'late-summer-sale',
        filename: 'bad.svg',
        contentType: 'image/svg+xml',
        bytes: Buffer.from('<svg/>')
      }),
      /supported image/
    );
    assert.throws(
      () => saveAsset({
        workspaceRoot: temporaryWorkspace,
        slug: 'late-summer-sale',
        filename: 'too-large.png',
        contentType: 'image/png',
        bytes: Buffer.alloc(5 * 1024 * 1024 + 1)
      }),
      /supported image/
    );

    const asset = saveAsset({
      workspaceRoot: temporaryWorkspace,
      slug: 'late-summer-sale',
      filename: '../summer.png',
      contentType: 'image/png',
      bytes: Buffer.from('png-data')
    });
    assert.match(asset.assetId, /^[a-z0-9-]+$/);
    assert.match(asset.localPath, /^campaign-drafts\/late-summer-sale\/assets\/[a-z0-9-]+-summer\.png$/);
    assert.equal(readFileSync(resolve(temporaryWorkspace, asset.localPath), 'utf8'), 'png-data');
  } finally {
    rmSync(temporaryWorkspace, { recursive: true, force: true });
  }
});

function completePreviewState(asset) {
  const components = defaultComposition.components.map((component) => ({
    ...component,
    content: Object.fromEntries(Object.entries(component.content).map(([key, value]) => [
      key,
      typeof value === 'string' && value.startsWith('asset://') ? 'https://example.invalid/local-preview-image.png' : value
    ]))
  }));
  components[0].content['hero.backgroundImage.url'] = `asset://${asset.assetId}`;
  return {
    campaign: {
      canvas: defaultComposition.canvas,
      assets: {
        [asset.assetId]: {
          path: asset.localPath,
          name: 'editor-image.png'
        }
      }
    },
    components
  };
}

test('editor routes persist scoped binary assets and generate only a local six-component preview', async () => {
  const slug = `local-preview-${process.pid}`;
  const draftDirectory = join(workspaceRoot, 'campaign-drafts', slug);
  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0 });

  try {
    const savedAsset = await fetch(new URL(`api/drafts/${slug}/assets`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Filename': '../editor-image.png' },
      body: Buffer.from('png-data')
    });
    assert.equal(savedAsset.status, 201);
    const asset = await savedAsset.json();
    assert.match(asset.localPath, new RegExp(`^campaign-drafts/${slug}/assets/[a-z0-9-]+-editor-image\\.png$`));

    const saved = await fetch(new URL(`api/drafts/${slug}`, editor.url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: completePreviewState(asset) })
    });
    assert.equal(saved.status, 200);
    assert.match((await saved.json()).draftPath, new RegExp(`^campaign-drafts/${slug}/project-state\\.v1\\.json$`));

    const preview = await fetch(new URL(`api/drafts/${slug}/preview`, editor.url), { method: 'POST' });
    assert.equal(preview.status, 200);
    const previewPayload = await preview.json();
    assert.deepEqual(Object.keys(previewPayload), ['previewUrl']);
    assert.equal(previewPayload.previewUrl, `/drafts/${slug}/preview`);
    assert.equal(existsSync(join(draftDirectory, 'campaign.local-preview.html')), true);
    assert.equal(existsSync(join(draftDirectory, 'campaign.static-safe.html')), false);

    const renderedPreview = await fetch(new URL(previewPayload.previewUrl.slice(1), editor.url));
    assert.equal(renderedPreview.status, 200);
    const previewHtml = await renderedPreview.text();
    assert.match(previewHtml, /Freshine Email Local Preview/);
    assert.match(previewHtml, new RegExp(`assets/${basename(asset.localPath)}`));
    assert.doesNotMatch(previewHtml, /fonts\.googleapis\.com|fonts\.gstatic\.com/);

    const renderedAsset = await fetch(new URL(`drafts/${slug}/assets/${basename(asset.localPath)}`, editor.url));
    assert.equal(renderedAsset.status, 200);
    assert.equal(await renderedAsset.text(), 'png-data');

    const traversal = await fetch(new URL(`drafts/${slug}/assets/..%2fproject-state.v1.json`, editor.url));
    assert.equal(traversal.status, 400);
  } finally {
    await editor.close();
    rmSync(draftDirectory, { recursive: true, force: true });
  }
});

test('explicit confirmation generates and hashes static-safe HTML separately from the local preview', async () => {
  const slug = `static-confirmation-${process.pid}`;
  const draftDirectory = join(workspaceRoot, 'campaign-drafts', slug);
  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0 });

  try {
    const savedAsset = await fetch(new URL(`api/drafts/${slug}/assets`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Filename': 'editor-image.png' },
      body: Buffer.from('png-data')
    });
    const asset = await savedAsset.json();
    const state = completePreviewState(asset);
    const saved = await fetch(new URL(`api/drafts/${slug}`, editor.url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: { ...state, finalConfirmation: { status: 'confirmed', confirmedStaticHtmlSha256: 'client-forged' } } })
    });
    assert.equal(saved.status, 200);
    assert.equal(JSON.parse(readFileSync(join(draftDirectory, 'project-state.v1.json'), 'utf8')).finalConfirmation, null);

    const preview = await fetch(new URL(`api/drafts/${slug}/preview`, editor.url), { method: 'POST' });
    assert.equal(preview.status, 200);
    const localPreviewBeforeConfirmation = readFileSync(join(draftDirectory, 'campaign.local-preview.html'), 'utf8');

    const confirmation = await fetch(new URL(`api/drafts/${slug}/confirm`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true })
    });
    assert.equal(confirmation.status, 200);
    const payload = await confirmation.json();
    assert.deepEqual(Object.keys(payload), ['confirmedStaticHtmlSha256']);
    assert.match(payload.confirmedStaticHtmlSha256, /^[a-f0-9]{64}$/);

    const staticHtml = readFileSync(join(draftDirectory, 'campaign.static-safe.html'), 'utf8');
    assert.equal(createHash('sha256').update(staticHtml).digest('hex'), payload.confirmedStaticHtmlSha256);
    assert.doesNotMatch(staticHtml, /Freshine Email Local Preview/);
    assert.equal(readFileSync(join(draftDirectory, 'campaign.local-preview.html'), 'utf8'), localPreviewBeforeConfirmation);
    const persisted = JSON.parse(readFileSync(join(draftDirectory, 'project-state.v1.json'), 'utf8'));
    assert.deepEqual(persisted.finalConfirmation, {
      status: 'confirmed',
      confirmedStaticHtmlSha256: payload.confirmedStaticHtmlSha256
    });
  } finally {
    await editor.close();
    rmSync(draftDirectory, { recursive: true, force: true });
  }
});

test('Draft upload rejects stale confirmation and calls the fixed uploader once for the exact confirmed hash', async () => {
  const slug = `confirmed-upload-${process.pid}`;
  const draftDirectory = join(workspaceRoot, 'campaign-drafts', slug);
  const calls = [];
  const draftUploader = (options) => {
    calls.push(options);
    return { campaignID: 'campaign-1', contentID: 'content-1', status: 'draft', ignored: 'not exposed' };
  };
  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0, draftUploader });

  try {
    const savedAsset = await fetch(new URL(`api/drafts/${slug}/assets`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Filename': 'editor-image.png' },
      body: Buffer.from('png-data')
    });
    const asset = await savedAsset.json();
    await fetch(new URL(`api/drafts/${slug}`, editor.url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: completePreviewState(asset) })
    });

    const unconfirmed = await fetch(new URL(`api/drafts/${slug}/upload`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256: 'stale' })
    });
    assert.equal(unconfirmed.status, 409);
    assert.match((await unconfirmed.json()).error, /confirmation/i);
    assert.equal(calls.length, 0);

    const confirmation = await fetch(new URL(`api/drafts/${slug}/confirm`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true })
    });
    const { confirmedStaticHtmlSha256 } = await confirmation.json();

    const stale = await fetch(new URL(`api/drafts/${slug}/upload`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256: 'stale' })
    });
    assert.equal(stale.status, 409);
    assert.match((await stale.json()).error, /confirmation/i);
    assert.equal(calls.length, 0);

    const upload = await fetch(new URL(`api/drafts/${slug}/upload`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256 })
    });
    assert.equal(upload.status, 200);
    assert.deepEqual(await upload.json(), { campaignID: 'campaign-1', contentID: 'content-1', status: 'draft' });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      workspaceRoot: resolve(workspaceRoot),
      projectPath: join(draftDirectory, 'project-state.v1.json'),
      htmlPath: join(draftDirectory, 'campaign.static-safe.html')
    });

    const repeated = await fetch(new URL(`api/drafts/${slug}/upload`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256 })
    });
    assert.equal(repeated.status, 200);
    assert.deepEqual(await repeated.json(), { campaignID: 'campaign-1', contentID: 'content-1', status: 'draft' });
    assert.equal(calls.length, 1);
  } finally {
    await editor.close();
    rmSync(draftDirectory, { recursive: true, force: true });
  }
});

test('editor persistence rejects a state that references a local asset from another draft', async () => {
  const slug = `cross-draft-preview-${process.pid}`;
  const otherSlug = `other-draft-${process.pid}`;
  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0 });

  try {
    const savedAsset = await fetch(new URL(`api/drafts/${otherSlug}/assets`, editor.url), {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Filename': 'other-draft.png' },
      body: Buffer.from('other-draft-png')
    });
    assert.equal(savedAsset.status, 201);
    const otherDraftAsset = await savedAsset.json();

    const saved = await fetch(new URL(`api/drafts/${slug}`, editor.url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: completePreviewState(otherDraftAsset) })
    });
    assert.equal(saved.status, 400);
    assert.match((await saved.json()).error, /asset.*draft/i);
    assert.equal(existsSync(join(workspaceRoot, 'campaign-drafts', slug, 'project-state.v1.json')), false);
  } finally {
    await editor.close();
    rmSync(join(workspaceRoot, 'campaign-drafts', slug), { recursive: true, force: true });
    rmSync(join(workspaceRoot, 'campaign-drafts', otherSlug), { recursive: true, force: true });
  }
});

test('editor bootstrap exposes only validated six-slot Campaign candidates', () => {
  const payload = loadEditorBootstrap(workspaceRoot);

  assert.deepEqual(payload.slots.map(({ id }) => id), [
    'hero',
    'sale-grid',
    'clickable-image',
    'gift',
    'location',
    'footer'
  ]);
  assert.equal(payload.components.every(({ componentKey }) => !componentKey.startsWith('review.')), true);
  assert.equal(payload.components.every(({ demoUrl }) => demoUrl.endsWith('/效果演示.html')), true);
});

test('editor server is loopback-only and returns the validated bootstrap', async () => {
  await assert.rejects(
    () => createCampaignEditorServer({ workspaceRoot, host: '0.0.0.0', port: 0 }),
    /127\.0\.0\.1/
  );

  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0 });
  try {
    assert.match(editor.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    const response = await fetch(new URL('api/bootstrap', editor.url));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).slots.map(({ id }) => id), [
      'hero',
      'sale-grid',
      'clickable-image',
      'gift',
      'location',
      'footer'
    ]);
  } finally {
    await editor.close();
  }
});

test('editor server serves the local editor application and its static assets', async () => {
  const editor = await createCampaignEditorServer({ workspaceRoot, port: 0 });
  try {
    const page = await fetch(editor.url);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /data-editor-preview="desktop"/);

    const app = await fetch(new URL('editor/app.js', editor.url));
    assert.equal(app.status, 200);
    assert.match(await app.text(), /\/api\/bootstrap/);

    const styles = await fetch(new URL('editor/styles.css', editor.url));
    assert.equal(styles.status, 200);
    assert.match(styles.headers.get('content-type'), /^text\/css/);
  } finally {
    await editor.close();
  }
});

test('starter keeps uploader prompt diagnostics attached while stdout remains a single URL', async () => {
  const testDirectory = mkdtempSync(join(tmpdir(), 'freshine-campaign-editor-start-'));
  const pidFile = join(testDirectory, 'server.pid');
  const slug = `starter-prompt-${process.pid}`;
  const draftDirectory = join(workspaceRoot, 'campaign-drafts', slug);
  let starter;
  let serverPid;
  let cancelUrlWait = () => {};
  let cancelDiagnosticWait = () => {};
  let urlPromise = Promise.resolve(null);
  let diagnosticPromise = Promise.resolve(false);

  try {
    starter = spawn(process.execPath, [
      startScript,
      '--port', '0',
      '--no-open',
      '--test-pid-file', pidFile
    ], {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    urlPromise = new Promise((resolveUrl, rejectUrl) => {
      let settled = false;
      const finish = (error, value = null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        starter.stdout.off('data', onData);
        if (error) rejectUrl(error);
        else resolveUrl(value);
      };
      const onData = (chunk) => {
        stdout += chunk.toString('utf8');
        const url = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
        if (url) finish(null, url);
      };
      const timer = setTimeout(() => finish(new Error('starter URL timeout')), 10_000);
      cancelUrlWait = () => finish(null);
      starter.stdout.on('data', onData);
    });
    diagnosticPromise = new Promise((resolveDiagnostic) => {
      let settled = false;
      const finish = (connected) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        starter.stderr.off('data', onData);
        resolveDiagnostic(connected);
      };
      const onData = (chunk) => {
        stderr += chunk.toString('utf8');
        if (/Omnisend API key must be entered through an interactive terminal/.test(stderr)) {
          finish(true);
        }
      };
      const timer = setTimeout(() => finish(false), 5_000);
      cancelDiagnosticWait = () => finish(false);
      starter.stderr.on('data', onData);
    });
    const starterExit = new Promise((resolveExit, rejectExit) => {
      starter.once('error', rejectExit);
      starter.once('exit', (code) => code === 0 ? resolveExit() : rejectExit(new Error(`starter exited with ${code}: ${stderr}`)));
    });

    const [url] = await Promise.all([urlPromise, starterExit]);
    serverPid = Number(readFileSync(pidFile, 'utf8').trim());
    assert.equal(stdout, `${url}\n`);
    assert.equal(Number.isInteger(serverPid), true);
    assert.doesNotThrow(() => process.kill(serverPid, 0));

    const savedAsset = await fetch(new URL(`api/drafts/${slug}/assets`, url), {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'X-Filename': 'editor-image.png' },
      body: Buffer.from('png-data')
    });
    assert.equal(savedAsset.status, 201);
    const asset = await savedAsset.json();
    const saved = await fetch(new URL(`api/drafts/${slug}`, url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: completePreviewState(asset) })
    });
    assert.equal(saved.status, 200);
    const confirmation = await fetch(new URL(`api/drafts/${slug}/confirm`, url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true })
    });
    assert.equal(confirmation.status, 200);
    const { confirmedStaticHtmlSha256 } = await confirmation.json();
    const upload = await fetch(new URL(`api/drafts/${slug}/upload`, url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedStaticHtmlSha256 })
    });
    assert.equal(upload.status, 400);
    assert.match((await upload.json()).error, /Draft upload failed/);
    assert.equal(await diagnosticPromise, true, 'runtime API-key diagnostic was disconnected');

  } finally {
    cancelUrlWait();
    cancelDiagnosticWait();
    await Promise.allSettled([urlPromise, diagnosticPromise]);
    if (serverPid) process.kill(serverPid, 'SIGTERM');
    else starter?.kill('SIGTERM');
    rmSync(draftDirectory, { recursive: true, force: true });
    rmSync(testDirectory, { recursive: true, force: true });
  }
});
