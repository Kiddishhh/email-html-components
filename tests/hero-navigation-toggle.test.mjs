import { tempPath } from './helpers/temp-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addComponentInstance,
  buildEditorCatalog,
  buildLocalAssetMap,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy,
  editorInputDisplay
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const builder = `${root}/build-email-template.v1.mjs`;
const heroes = [
  {
    componentKey: 'hero.promotionalOverlay',
    navigationMarker: 'freshine-promotional-overlay-navigation',
    retainedMarker: 'freshine-overlay-hero-background'
  },
  {
    componentKey: 'hero.countdownOverlay',
    navigationMarker: 'freshine-countdown-navigation',
    retainedMarker: 'freshine-countdown-hero-shell'
  },
  {
    componentKey: 'hero.countdownOverlay2',
    navigationMarker: 'freshine-countdown-2-promotion',
    retainedMarker: 'freshine-countdown-2-logo'
  },
  {
    componentKey: 'hero.lateSummerSale',
    navigationMarker: 'freshine-late-summer-promotion',
    retainedMarker: 'freshine-late-summer-logo'
  },
  {
    componentKey: 'hero.sceneOverlayCta',
    navigationMarker: 'freshine-scene-overlay-navigation',
    retainedMarker: 'freshine-scene-overlay-hero-background'
  },
  {
    componentKey: 'hero.romanShadeDiscount',
    navigationMarker: 'freshine-roman-shade-navigation',
    retainedMarker: 'freshine-roman-shade-background'
  },
  {
    componentKey: 'hero.sceneOverlayCta2',
    navigationMarker: 'freshine-scene-overlay-hero-2-navigation',
    retainedMarker: 'freshine-scene-overlay-hero-2-background'
  }
];

const defaultNavigationMessage = 'Unlock An Extra 15% Off Your First Order At Freshine';

function renderHero(componentKey, navigationVisible, name) {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  let document = createCampaignDocument({ name });
  document = addComponentInstance(document, catalog, componentKey);
  document.components[0].settings['navigation.visible'] = navigationVisible;
  const output = tempPath(`${name}.html`);
  const previewOutput = tempPath(`${name}.local-preview.html`);
  const compositionPath = tempPath(`${name}.composition.json`);
  const composition = {
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    assets: buildLocalAssetMap(document, { workspaceRoot: root }),
    components: document.components.map(({ name: componentName, directory, componentKey: key, content, settings }) => ({
      name: componentName,
      directory,
      componentKey: key,
      content,
      settings
    }))
  };
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const result = spawnSync(process.execPath, [builder, compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  return {
    result,
    html: result.status === 0 ? readFileSync(previewOutput, 'utf8') : ''
  };
}

test('all registered hero styles expose a default-on navigation checkbox in the editor contract', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });

  for (const { componentKey } of heroes) {
    const component = catalog.find((candidate) => candidate.componentKey === componentKey);
    assert.equal(component.defaultSettings.values['navigation.visible'], true, `${componentKey} navigation must default to visible`);
    assert.equal(component.settingsSchema.properties['navigation.visible']?.type, 'boolean');
    assert.ok(editableFieldKeys(componentKey).settings.includes('navigation.visible'));
  }

  assert.deepEqual(editorFieldCopy('hero.promotionalOverlay', 'settings', 'navigation.visible'), {
    label: '显示顶部导航栏',
    help: '关闭后从最终 HTML 中移除当前头图的顶部导航栏；Logo 和其余头图内容保持不变。'
  });
  assert.deepEqual(editorInputDisplay(true, { type: 'boolean' }), {
    control: 'checkbox',
    checked: true
  });
});

test('the email builder removes a disabled navigation block from every hero without removing the hero body', () => {
  for (const { componentKey, navigationMarker, retainedMarker } of heroes) {
    const visible = renderHero(componentKey, true, `${componentKey.replaceAll('.', '-')}-navigation-visible`);
    assert.equal(visible.result.status, 0, visible.result.stderr || visible.result.stdout);
    assert.match(visible.html, new RegExp(navigationMarker));
    assert.match(visible.html, new RegExp(retainedMarker));

    const hidden = renderHero(componentKey, false, `${componentKey.replaceAll('.', '-')}-navigation-hidden`);
    assert.equal(hidden.result.status, 0, hidden.result.stderr || hidden.result.stdout);
    assert.doesNotMatch(hidden.html, new RegExp(navigationMarker));
    assert.match(hidden.html, new RegExp(retainedMarker));
    assert.doesNotMatch(hidden.html, /FRESHINE_IF_SETTING|FRESHINE_END_IF_SETTING/);
  }
});

test('every hero with a navigation bar renders the approved default left navigation message', () => {
  for (const { componentKey } of heroes) {
    const rendered = renderHero(componentKey, true, `${componentKey.replaceAll('.', '-')}-default-navigation-message`);
    assert.equal(rendered.result.status, 0, rendered.result.stderr || rendered.result.stdout);
    assert.match(rendered.html, new RegExp(defaultNavigationMessage), `${componentKey} must render the approved left navigation default`);
  }
});
