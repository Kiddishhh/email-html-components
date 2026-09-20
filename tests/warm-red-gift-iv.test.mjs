import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {editableFieldKeys} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
const key='gift.warmRedPairIV', dir='赠品与权益组件/暖红双赠品卡IV';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
test('warm red gift IV registers independent source cards and exact tracked image links',()=>{
 assert.ok(json('组件清单.json').find(e=>e.componentKey===key));
 const f=json(`${dir}/content.fixture.v1.json`),s=json(`${dir}/content.schema.v1.json`);
 assert.deepEqual(editableFieldKeys(key).content,Object.keys(s.properties));
 assert.deepEqual(Object.keys(f.values),Object.keys(s.properties));
 const t=readFileSync(`${dir}/component.template.v1.html`,'utf8');
 assert.equal((t.match(/<img\b/g)||[]).length,2);assert.equal((t.match(/<a\b/g)||[]).length,2);
 for(let i=0;i<2;i++) assert.equal(f.values[`gifts[${i}].clickUrl`],'https://freshinelife.com?utm_source=omnisend&utm_medium=email&utm_id=cover-rc');
 for(const p of Object.values(f.localReferenceAssets)) assert.ok(existsSync(`${dir}/${p}`));
 assert.doesNotMatch(t,/<script|<iframe|<form|<svg|<div|display:(?:flex|grid)|position:absolute/);
 assert.equal((t.match(/colspan="3"/g)||[]).length,0,'single-column wrapper must not acquire three-column spacers');
});
