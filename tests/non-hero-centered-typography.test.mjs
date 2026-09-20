import { assertTextRole } from './helpers/typography.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const read = (relativePath) => readFileSync(`${root}/${relativePath}`, 'utf8');
const builder = `${root}/build-email-template.v1.mjs`;
const registry = JSON.parse(read('组件清单.json'));

function renderComponent(componentKey) {
  const entry = registry.find((candidate) => candidate.componentKey === componentKey);
  assert.ok(entry, `missing registry entry: ${componentKey}`);
  const directory = entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/, '');
  const fixture = JSON.parse(read(`${directory}/content.fixture.v1.json`));
  const defaults = JSON.parse(read(`${directory}/settings.defaults.v1.json`));
  if ('grid.showCaptions' in defaults.values) defaults.values['grid.showCaptions'] = true;
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-typography-'));
  const compositionPath = join(temporary, 'composition.json');
  const previewOutput = join(temporary, 'preview.html');
  if (componentKey === 'product.sampleStyle1') fixture.localReferenceAssets = { 'product-main':'assets/default-main-image.png','product-detail':'assets/default-detail-image.png' };
  const assets = Object.fromEntries(Object.entries(fixture.localReferenceAssets ?? {}).map(([id, relativePath]) => [id, {
    path: `${directory}/${relativePath}`,
    name: relativePath.split('/').at(-1)
  }]));
  writeFileSync(compositionPath, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: join(temporary, 'component.html'),
    previewOutput,
    assets,
    components: [{
      name: entry.中文名称,
      directory,
      componentKey,
      content: fixture.values,
      settings: defaults.values
    }]
  }, null, 2));
  const result = spawnSync(process.execPath, [builder, compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return readFileSync(previewOutput, 'utf8');
}


const roles = JSON.parse(read('skills/build-omnisend-campaign-draft/references/typography-roles.v1.json'));
for (const [key, definition] of Object.entries(roles)) {
  test(key + ' exports the shared typography with editable content intact', () => {
    const html = renderComponent(key);
    for (const [slot, role] of Object.entries(definition.slots)) {
      assertTextRole(html, slot, role, { rendered: true });
      const demo = read(definition.directory + '/效果演示.html');
      if (demo.includes('data-freshine-slot="' + slot + '"')) assertTextRole(demo, slot, role, { rendered: true });
    }
  });
}

test('shared typography migration is restricted to the activity-product category', () => {
  for (const key of Object.keys(roles)) {
    assert.equal(registry.find(entry => entry.componentKey === key)?.分类, '活动商品组件', key);
  }
});
