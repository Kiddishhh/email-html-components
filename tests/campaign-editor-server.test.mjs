import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

    const renderedAsset = await fetch(new URL(`drafts/${slug}/assets/${basename(asset.localPath)}`, editor.url));
    assert.equal(renderedAsset.status, 200);
    assert.equal(await renderedAsset.text(), 'png-data');
  } finally {
    await editor.close();
    rmSync(draftDirectory, { recursive: true, force: true });
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

test('starter reports a test-only PID for cleanup while stdout remains a single URL', async () => {
  const testDirectory = mkdtempSync(join(tmpdir(), 'freshine-campaign-editor-start-'));
  const pidFile = join(testDirectory, 'server.pid');
  let serverPid;

  try {
    const result = spawnSync(process.execPath, [
      startScript,
      '--port', '0',
      '--no-open',
      '--test-pid-file', pidFile
    ], {
      cwd: workspaceRoot,
      encoding: 'utf8',
      timeout: 10_000
    });

    if (existsSync(pidFile)) serverPid = Number(readFileSync(pidFile, 'utf8').trim());
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout.trim(), /^http:\/\/127\.0\.0\.1:\d+\/$/);
    assert.equal(result.stdout, `${result.stdout.trim()}\n`);
    assert.equal(existsSync(pidFile), true);
    assert.equal(Number.isInteger(serverPid), true);
    assert.doesNotThrow(() => process.kill(serverPid, 0));
  } finally {
    if (serverPid) process.kill(serverPid, 'SIGTERM');
    rmSync(testDirectory, { recursive: true, force: true });
  }
});
