import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { addComponentInstance, applySaleGridImport, applySaleGrid6ProductImport, buildEditorCatalog, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { editableFieldKeys, editorFieldCopy } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const catalog = buildEditorCatalog({ workspaceRoot });
function draft() {
  let doc = createCampaignDocument({ name: 'Summer product names' });
  doc = addComponentInstance(doc, catalog, 'collection.saleGrid6');
  return addComponentInstance(doc, catalog, 'collection.saleGrid6');
}
const product = { handle: 'amara', title: 'Amara', fullTitle: 'Amara Linen Curtains', image: { url: 'https://example.com/amara.jpg', alt: 'Curtains in a room' }, linkUrl: 'https://example.com/products/amara', discountLabel: 'SAVE 40%' };
test('summer single import fills full product name only in the selected card', () => {
  const doc = draft();
  const result = applySaleGrid6ProductImport(doc, doc.components[1].instanceId, 4, { product });
  assert.equal(result.components[1].content['saleItems[4].name'], 'Amara Linen Curtains');
  assert.deepEqual(result.components[0], doc.components[0]);
  assert.equal(result.components[1].content['saleItems[0].name'], doc.components[1].content['saleItems[0].name']);
  const fallback = applySaleGrid6ProductImport(doc, doc.components[1].instanceId, 4, { product: { ...product, fullTitle: undefined } });
  assert.equal(fallback.components[1].content['saleItems[4].name'], 'Amara');
});
test('summer collection import fills all six names and exposes them for editing', () => {
  const doc = draft();
  const result = applySaleGridImport(doc, doc.components[1].instanceId, { collection: { handle: 'summer' }, items: Array.from({ length: 6 }, (_, i) => ({ ...product, fullTitle: undefined, title: `Product ${i + 1}` })) });
  for (let i = 0; i < 6; i++) {
    const key = `saleItems[${i}].name`;
    assert.equal(result.components[1].content[key], `Product ${i + 1}`);
    assert.ok(editableFieldKeys('collection.saleGrid6').content.includes(key));
    assert.equal(editorFieldCopy('collection.saleGrid6', 'content', key).label, `商品 ${i + 1} 名称`);
  }
  assert.deepEqual(result.components[0], doc.components[0]);
});
