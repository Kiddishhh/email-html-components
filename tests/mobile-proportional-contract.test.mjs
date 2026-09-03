import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/u, '');
const normalizer = resolve(root, 'scripts/normalize-inline-mobile-dimensions.mjs');
const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));

test('every registered component has a matching template and demo for the proportional mobile contract', () => {
  for (const component of registry) {
    const template = resolve(root, component.路径.组件模板);
    const demo = resolve(root, dirname(component.路径.组件模板), '效果演示.html');
    assert.ok(existsSync(template), `${component.componentKey}: template must exist`);
    assert.ok(existsSync(demo), `${component.componentKey}: demo must exist`);
  }
});

test('the current registered component corpus passes the 600px-to-375px proportional mobile contract', () => {
  const result = spawnSync(process.execPath, [normalizer, '--check'], { cwd: root, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.componentCount, registry.length);
  assert.equal(summary.targetWidth, 375);
  assert.equal(summary.desktopWidth, 600);
  assert.equal(summary.unscaledDeclarations.length, 0, JSON.stringify(summary.unscaledDeclarations, null, 2));
});
