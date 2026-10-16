import { fileURLToPath } from 'node:url';
import { tempPath } from './helpers/temp-path.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url)).slice(0, -1);
const script = `${root}/skills/build-omnisend-campaign-draft/scripts/prepare-countdown-hero-2-image.mjs`;
const source = `${root}/头图/促销悬浮首图/assets/default-background.reference.png`;
const output = tempPath('countdown-hero-2-centered-crop.png');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

test('prepares a centered 1200 by 1200 derivative without overwriting the source image', () => {
  rmSync(output, { force: true });
  const sourceHash = sha256(source);
  const result = spawnSync(process.execPath, [script, '--input', source, '--output', output], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(sha256(source), sourceHash, 'source image must stay unchanged');
  const metadata = JSON.parse(result.stdout);
  assert.deepEqual(metadata.outputSize, { width: 1200, height: 1200 });
  assert.equal(metadata.crop.mode, 'center');
  assert.equal(metadata.sourcePath, source);
  assert.equal(metadata.outputPath, output);

  const bytes = readFileSync(output);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 1200);
});

test('rejects an output path that would overwrite the source image', () => {
  const result = spawnSync(process.execPath, [script, '--input', source, '--output', source], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /output must not overwrite input/i);
});
