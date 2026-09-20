import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  addComponentInstance,
  applySaleGrid6WithTitleProductImport,
  buildEditorCatalog,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/u, '');
const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));

test('titled six-grid sale component is registered with synchronized 600px-to-375px inline rendering', () => {
  const component = registry.find(({ componentKey }) => componentKey === 'collection.saleGrid6WithTitle');
  assert.ok(component, 'collection.saleGrid6WithTitle must be registered');
  assert.equal(component.分类, '活动商品组件');
  assert.equal(component.输出宽度, 600);
  assert.equal(component.移动端断点, 375);

  const templatePath = resolve(root, component.路径.组件模板);
  const demoPath = resolve(root, '活动商品组件/六宫格折扣推荐（标题款）/效果演示.html');
  assert.ok(existsSync(templatePath), 'component template must exist');
  assert.ok(existsSync(demoPath), 'component demo must exist');

  const template = readFileSync(templatePath, 'utf8');
  const demo = readFileSync(demoPath, 'utf8');

  for (const source of [template, demo]) {
    assert.match(source, /font-size:30px;font-size:min\(30px,5vw\);/);
    assert.match(source, /line-height:38px;line-height:min\(38px,6\.333333vw\);/);
    assert.match(source, /font-size:18px;font-size:min\(18px,3vw\);/);
  }

  assert.match(template, /height:236px;height:min\(236px,39\.333333vw\);/);
  assert.match(demo, /height:min\(236px,46vw\)/);
});

test('editor catalog exposes six separately importable product cards with UTM defaults', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const component = catalog.find(({ componentKey }) => componentKey === 'collection.saleGrid6WithTitle');
  assert.ok(component, 'component must be selectable in the editor catalog');
  assert.equal(component.name, '六宫格折扣推荐（标题款）');
  assert.match(component.defaultContent.values['saleItems[0].image.clickUrl'], /utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
  assert.match(component.defaultContent.values['saleCollection.cta.url'], /utm_source=omnisend&utm_medium=email&utm_id=cover-rc$/);
  assert.deepEqual(editableFieldKeys(component.componentKey).content.filter((key) => key.endsWith('.name')), [
    'saleItems[0].name', 'saleItems[1].name', 'saleItems[2].name',
    'saleItems[3].name', 'saleItems[4].name', 'saleItems[5].name'
  ]);

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

test('title-card typography and two-column styles preserve the approved visual system', () => {
  const base = resolve(root, '活动商品组件/六宫格折扣推荐（标题款）');
  const template = readFileSync(resolve(base, 'component.template.v1.html'), 'utf8');
  const defaults = JSON.parse(readFileSync(resolve(base, 'settings.defaults.v1.json'), 'utf8'));
  const styles = readFileSync(resolve(base, 'component.styles.v1.css'), 'utf8');

  assert.equal(defaults.values['color.theme'], '#8D1B1B');
  assert.match(template, /font-size:18px;font-size:min\(18px,3vw\);font-weight:500;line-height:22px;line-height:min\(22px,3\.666667vw\);text-align:center;text-decoration:none;">\<span data-freshine-slot="saleItems\[0\]\.name"/);
  assert.match(template, /font-size:16px;font-size:min\(16px,2\.666667vw\);font-weight:500;line-height:20px;line-height:min\(20px,3\.333333vw\);text-align:center;text-decoration:none;">\<span data-freshine-slot="saleItems\[0\]\.discountLabel"/);
  assert.match(template, /class="freshine-sale-title-card"/);
  assert.match(template, /class="freshine-sale-title-spacer"/);
  assert.match(template, /class="freshine-sale-title-image-link"/);
  assert.match(styles, /\.freshine-sale-title-card \{ width:46%; max-width:236px; \}/);
  assert.match(styles, /\.freshine-sale-title-spacer \{ width:8%; max-width:42px; \}/);
  assert.match(styles, /\.freshine-sale-title-image \{ width:100%; height:min\(236px,46vw\); \}/);
});
