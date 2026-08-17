import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createCampaignEditorServer, loadEditorBootstrap } from '../skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs';

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const startScript = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs', import.meta.url));

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

test('starter validates contracts and prints one loopback URL without opening a browser', () => {
  const result = spawnSync(process.execPath, [startScript, '--port', '0', '--no-open'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    timeout: 10_000
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^http:\/\/127\.0\.0\.1:\d+\/$/m);
});
