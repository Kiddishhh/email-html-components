import test from 'node:test';
import assert from 'node:assert/strict';
import { addComponentInstance, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
const workflow = await import('../skills/build-omnisend-campaign-draft/editor/public/editor-workflow.mjs').catch(() => ({}));
const catalog = [{ componentKey: 'test.card', name: '卡片', directory: 'test', defaultContent: { values: {} }, defaultSettings: { values: {} } }];

test('deleting a repeated instance does not reuse another live instance ID', () => {
  let draft = createCampaignDocument();
  for (let i = 0; i < 3; i++) draft = addComponentInstance(draft, catalog, 'test.card');
  const removed = draft.components[1].instanceId;
  draft.components = draft.components.filter(({ instanceId }) => instanceId !== removed);
  draft = addComponentInstance(draft, catalog, 'test.card');
  assert.equal(new Set(draft.components.map(x => x.instanceId)).size, 3);
});

test('save queue serializes requests and preserves newer input over an older response', async () => {
  assert.equal(typeof workflow.createSaveQueue, 'function');
  let release;
  const requests = [];
  let active = 0;
  let maximum = 0;
  const queue = workflow.createSaveQueue({ send: async (instanceId, patch) => {
    active++; maximum = Math.max(maximum, active); requests.push({ instanceId, patch });
    if (requests.length === 1) await new Promise(resolve => { release = resolve; });
    active--;
    return { draft: { confirmed: true, components: [{ instanceId, content: patch.content, settings: {}, confirmed: true }] } };
  }, onSaved: ({ draft }) => {
    if (requests.length === 1) assert.equal(queue.overlay(draft).components[0].content.title, 'new');
  } });
  queue.enqueue('card', 'content', 'title', 'old');
  const first = queue.flush();
  await Promise.resolve();
  queue.enqueue('card', 'content', 'title', 'new');
  const second = queue.flush();
  release();
  await Promise.all([first, second]);
  assert.equal(maximum, 1);
  assert.deepEqual(requests.map(x => x.patch.content.title), ['old', 'new']);
  assert.equal(queue.hasPending(), false);
});

test('failed saves retain the patch and retry with the newest values', async () => {
  assert.equal(typeof workflow.createSaveQueue, 'function');
  let fail = true;
  let patch;
  const queue = workflow.createSaveQueue({ send: async (id, next) => {
    if (fail) throw new Error('offline');
    patch = next; return { draft: { components: [] } };
  } });
  queue.enqueue('card', 'content', 'title', 'old');
  await assert.rejects(queue.flush(), /offline/);
  assert.equal(queue.hasPending(), true);
  queue.enqueue('card', 'content', 'title', 'new');
  fail = false;
  await queue.flush();
  assert.equal(patch.content.title, 'new');
  assert.equal(queue.hasPending(), false);
});

test('product groups preserve all fields and put each card in its own group', () => {
  assert.equal(typeof workflow.groupEditorFields, 'function');
  const keys = ['saleCollection.title', 'saleItems[0].name', 'saleItems[0].image.url', 'saleItems[1].name', 'saleCollection.cta.url'];
  const groups = workflow.groupEditorFields(keys, 'content');
  assert.deepEqual(groups.map(x => x.label), ['顶部文案', '商品 1', '商品 2', '底部 CTA']);
  assert.deepEqual(groups.flatMap(x => x.keys), keys);
});

test('catalog search respects category and matches Chinese names and component keys', () => {
  assert.equal(typeof workflow.searchCatalog, 'function');
  const items = [{name:'四宫格价格',category:'活动商品组件',componentKey:'collection.grid4',variant:'标准'}, {name:'优惠头图',category:'头图',componentKey:'hero.offer',variant:'标准'}];
  assert.deepEqual(workflow.searchCatalog(items, '活动商品组件', '价格').map(x => x.componentKey), ['collection.grid4']);
  assert.deepEqual(workflow.searchCatalog(items, '', 'HERO').map(x => x.componentKey), ['hero.offer']);
  assert.equal(workflow.searchCatalog(items, '头图', '价格').length, 0);
});

test('link inventory includes fixed links but excludes unrendered navigation and image sources', () => {
  assert.equal(typeof workflow.linkInventory, 'function');
  const draft = { components: [{instanceId:'card',name:'商品卡',componentKey:'test.card',content:{'cta.url':'https://shop.test/p?a=1&b=2','image.url':'https://shop.test/photo.jpg','navigation.url':'https://shop.test/nav'}}] };
  const html = '<!-- 组件：商品卡 --><a href="https://shop.test/p?a=1&amp;b=2" data-freshine-editor-link-field="cta.url">购买</a><a href="[[unsubscribe_link]]">退订</a><!-- /组件：商品卡 -->';
  const defs = [{componentKey:'test.card',contentSchema:{properties:{'cta.url':{type:'url',role:'action-link'},'image.url':{type:'url',role:'image-source'},'navigation.url':{type:'url',role:'navigation-link'}}}}];
  const rows = workflow.linkInventory(draft, defs, html, () => ({content:['cta.url','navigation.url','image.url']}));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].fieldKeys, ['cta.url']);
  assert.equal(rows[0].url, 'https://shop.test/p?a=1&b=2');
  assert.equal(rows[1].editable, false);
});

test('queued edits retain their originating draft even when the active draft changes', async () => {
  const sends = [];
  let activeDraft = 'old-draft';
  const queue = workflow.createSaveQueue({send:async (instanceId, patch, draftId) => { sends.push({instanceId, patch, draftId}); return {draft:{id:draftId,components:[]}}; }});
  queue.enqueue('shared-id', 'content', 'title', 'old draft edit', activeDraft);
  activeDraft = 'new-draft';
  const current = queue.overlay({id:activeDraft,confirmed:true,components:[{instanceId:'shared-id',confirmed:true,content:{title:'new draft title'},settings:{}}]});
  assert.equal(current.components[0].content.title, 'new draft title');
  assert.equal(current.confirmed, true);
  await queue.flush();
  assert.equal(sends[0].draftId, 'old-draft');
});

test('equal URLs do not make an unselected slot or a fixed anchor editable', () => {
  const url = 'https://shop.test/same';
  const draft = {components:[{instanceId:'card',name:'商品卡',componentKey:'test.card',content:{'saleItems[0].image.clickUrl':url,'saleItems[4].image.clickUrl':url}}]};
  const defs = [{componentKey:'test.card',contentSchema:{properties:{'saleItems[0].image.clickUrl':{type:'url',role:'link-target'},'saleItems[4].image.clickUrl':{type:'url',role:'link-target'}}}}];
  const html = `<!-- 组件：商品卡 --><a href="${url}" data-freshine-editor-link-field="saleItems[0].image.clickUrl">商品 1</a><a href="${url}" data-freshine-editor-link-field="saleItems[4].image.clickUrl">商品 5</a><a href="${url}">固定地址</a><!-- /组件：商品卡 -->`;
  const rows = workflow.linkInventory(draft, defs, html, () => ({content:Object.keys(draft.components[0].content)}));
  assert.deepEqual(rows.map(x => x.fieldKeys), [['saleItems[0].image.clickUrl'],['saleItems[4].image.clickUrl'],[]]);
  assert.equal(rows[2].editable, false);
});

test('UTM changes preserve unrelated parameters and hash, and leave special links unchanged', () => {
  assert.equal(typeof workflow.applyUtm, 'function');
  assert.equal(workflow.applyUtm('https://shop.test/p?discount=SAVE&utm_source=old#details', {utm_source:'omnisend',utm_medium:'email',utm_id:'Fall Sale'}), 'https://shop.test/p?discount=SAVE&utm_source=omnisend&utm_medium=email&utm_id=Fall+Sale#details');
  for (const url of ['mailto:help@shop.test','tel:123','[[unsubscribe_link]]']) assert.equal(workflow.applyUtm(url, {utm_source:'new'}), url);
  assert.equal(workflow.applyUtm('https://shop.test/?utm_id=keep', {utm_id:''}), 'https://shop.test/?utm_id=keep');
});
