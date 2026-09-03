import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addComponentInstance, buildEditorCatalog } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('six-grid title sale component is registered with UTM defaults and six independently importable cards', async () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const component = catalog.find(({ componentKey }) => componentKey === 'collection.saleGrid6WithTitle');
  assert.ok(component, 'component must be selectable in the editor catalog');
  assert.equal(component.name, '六宫格折扣推荐（标题款）');
  assert.equal(component.defaultContent.values['saleCollection.title'], 'FIND YOUR PERFECT FIT');
  assert.equal(component.defaultContent.values['saleCollection.body'], 'Designed Around Your Windows, Your Style, Your Home.');
  assert.match(component.defaultContent.values['saleItems[0].image.clickUrl'], /utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
  assert.match(component.defaultContent.values['saleCollection.cta.url'], /utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
  assert.deepEqual(editableFieldKeys(component.componentKey).content.filter((key) => key.endsWith('.name')), [
    'saleItems[0].name', 'saleItems[1].name', 'saleItems[2].name',
    'saleItems[3].name', 'saleItems[4].name', 'saleItems[5].name'
  ]);

  const { applySaleGrid6WithTitleProductImport } = await import('../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs');
  let document = createCampaignDocument({ name: '六宫格标题款导入测试' });
  document = addComponentInstance(document, catalog, component.componentKey);
  const imported = applySaleGrid6WithTitleProductImport(document, document.components[0].instanceId, 5, {
    product: {
      handle: 'marisol-linen-curtains',
      image: { url: 'https://cdn.example.com/marisol.webp', alt: 'Marisol linen curtains' },
      linkUrl: 'https://freshinelife.com/products/marisol-linen-curtains',
      title: 'Marisol Linen Curtains',
      discountLabel: 'SAVE 50%'
    }
  });
  assert.equal(imported.components[0].content['saleItems[5].name'], 'Marisol');
  assert.equal(imported.components[0].content['saleItems[5].discountLabel'], 'SAVE 50%');
  assert.equal(imported.components[0].content['saleItems[0].name'], 'Elara');
});

test('six-grid title sale component uses the confirmed red and type scale for cards and CTA', () => {
  const base = `${workspaceRoot}/活动商品组件/六宫格折扣推荐（标题款）`;
  const template = readFileSync(`${base}/component.template.v1.html`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${base}/settings.defaults.v1.json`, 'utf8'));

  assert.equal(defaults.values['color.theme'], '#8D1B1B');
  assert.match(template, /font-size:18px;font-weight:500;line-height:22px;text-align:center;text-decoration:none;">\<span data-freshine-slot="saleItems\[0\]\.name"/);
  assert.match(template, /font-size:16px;font-weight:500;line-height:20px;text-align:center;text-decoration:none;">\<span data-freshine-slot="saleItems\[0\]\.discountLabel"/);
  assert.match(template, /font-size:18px;font-weight:500;line-height:22px;text-align:center;text-decoration:none;">\<span data-freshine-slot="saleCollection\.cta\.text"/);
});

test('six-grid title sale component keeps two fluid columns inside a 375px email canvas', () => {
  const base = `${workspaceRoot}/活动商品组件/六宫格折扣推荐（标题款）`;
  const template = readFileSync(`${base}/component.template.v1.html`, 'utf8');
  const styles = readFileSync(`${base}/component.styles.v1.css`, 'utf8');

  assert.match(template, /class="freshine-sale-title-card"/);
  assert.match(template, /class="freshine-sale-title-spacer"/);
  assert.match(template, /class="freshine-sale-title-image-link"/);
  assert.match(template, /class="freshine-sale-title-badge"/);
  assert.match(styles, /\.freshine-sale-title-card \{ width:46%; max-width:236px; \}/);
  assert.match(styles, /\.freshine-sale-title-spacer \{ width:8%; max-width:42px; \}/);
  assert.match(styles, /\.freshine-sale-title-image \{ width:100%; height:min\(236px,46vw\); \}/);
  assert.match(styles, /\.freshine-sale-title-image-link \{ height:calc\(min\(236px,46vw\) - min\(33px,6\.4vw\)\); \}/);
});
