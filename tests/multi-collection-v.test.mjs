import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {editableFieldKeys} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
const key='collection.multiCategoryRecommendationV';
const dir='活动商品组件/多类推荐V';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
test('multi collection V registers six paired image/title links and complete editable fields',()=>{
 const entry=json('组件清单.json').find(x=>x.componentKey===key);assert.ok(entry);
 const f=json(`${dir}/content.fixture.v1.json`);const s=json(`${dir}/content.schema.v1.json`);
 assert.deepEqual(editableFieldKeys(key).content,Object.keys(s.properties));
 assert.deepEqual(Object.keys(f.values),Object.keys(s.properties));
 const t=readFileSync(`${dir}/component.template.v1.html`,'utf8');
 assert.equal((t.match(/<img\b/g)||[]).length,6);assert.equal((t.match(/<a\b/g)||[]).length,12);
 for(let i=0;i<6;i++){
  assert.equal(t.split(`data-freshine-href-slot="collections[${i}].clickUrl"`).length-1,2);
  assert.ok(new URL(f.values[`collections[${i}].clickUrl`]).pathname.startsWith('/collections/'));
 }
 for(const p of Object.values(f.localReferenceAssets))assert.ok(existsSync(`${dir}/${p}`));
 assert.match(t,/font-family:Lora, Georgia/);assert.match(t,/font-size:min\(30px,5vw\)/);assert.match(t,/line-height:min\(38px,6.333333vw\)/);
 assert.equal((t.match(/text-decoration:underline/g)||[]).length,6);
 assert.doesNotMatch(t,/<script|<iframe|<form|<svg|<div|display:(flex|grid)|position:absolute/);
});
