import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptUrl = new URL('../skills/build-omnisend-campaign-draft/scripts/derive-countdown-theme.mjs', import.meta.url);
const scriptPath = fileURLToPath(scriptUrl);

test('derives the approved lighter navigation color from the default theme', async () => {
  const { deriveCountdownTheme } = await import(scriptUrl);

  assert.deepEqual(deriveCountdownTheme('#9d1d20'), {
    theme: '#9D1D20',
    navigationLeft: '#D6A7A5',
    navigationLeftSource: 'derived'
  });
});

test('preserves an explicit left-navigation override and marks its source', async () => {
  const { deriveCountdownTheme } = await import(scriptUrl);

  assert.deepEqual(deriveCountdownTheme('#9D1D20', '#ABCDEF'), {
    theme: '#9D1D20',
    navigationLeft: '#ABCDEF',
    navigationLeftSource: 'user-override'
  });
});

test('rejects non-hex color input instead of guessing', async () => {
  const { deriveCountdownTheme } = await import(scriptUrl);

  assert.throws(() => deriveCountdownTheme('red'), /#RRGGBB/);
  assert.throws(() => deriveCountdownTheme('#9D1D20', '#FFF'), /#RRGGBB/);
});

test('CLI emits a JSON-only settings fragment', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--theme', '#9D1D20'], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    theme: '#9D1D20',
    navigationLeft: '#D6A7A5',
    navigationLeftSource: 'derived'
  });
});
