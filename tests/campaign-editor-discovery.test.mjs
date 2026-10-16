import test from 'node:test';
import assert from 'node:assert/strict';
const catalog=[{componentKey:'footer.example',demoPath:'/workspace/页脚/效果演示.html',defaultContent:{values:{text:'current'}},category:'页脚组件'}];
const response=components=>({ok:true,json:async()=>({components})});
test('editor discovery reuses the preferred current workspace catalog without starting a new service',async()=>{
 const {findCampaignEditor}=await import('../skills/build-omnisend-campaign-draft/scripts/resolve-campaign-editor.mjs');
 const calls=[];const result=await findCampaignEditor({catalog,candidateUrls:['http://127.0.0.1:4194','http://127.0.0.1:4173'],fetchImpl:async url=>{calls.push(url);return response(catalog.map(c=>({...c,thumbnailUrl:'/preview'})));}});
 assert.equal(result.status,'ready');assert.equal(result.url,'http://127.0.0.1:4194');assert.equal(calls.length,1);
});
test('editor discovery skips stale defaults and another workspace and finds the matching service',async()=>{
 const {findCampaignEditor}=await import('../skills/build-omnisend-campaign-draft/scripts/resolve-campaign-editor.mjs');
 const result=await findCampaignEditor({catalog,candidateUrls:['http://127.0.0.1:4173','http://127.0.0.1:4190','http://127.0.0.1:4194'],fetchImpl:async url=>response(url.includes('4173')?[{...catalog[0],defaultContent:{values:{text:'old'}}}]:url.includes('4190')?[{...catalog[0],demoPath:'/another/效果演示.html'}]:catalog)});
 assert.equal(result.status,'ready');assert.equal(result.url,'http://127.0.0.1:4194');assert.ok(result.staleUrls.includes('http://127.0.0.1:4173'));
});
test('editor discovery provides a start port on connection refusal and rejects external URLs',async()=>{
 const {findCampaignEditor}=await import('../skills/build-omnisend-campaign-draft/scripts/resolve-campaign-editor.mjs');
 const result=await findCampaignEditor({catalog,candidateUrls:['http://127.0.0.1:4173'],fetchImpl:async()=>{throw Object.assign(Error('not running'),{cause:{code:'ECONNREFUSED'}});}});
 assert.equal(result.status,'start-required');assert.equal(result.startPort,4173);
 let called=false;await assert.rejects(findCampaignEditor({catalog,candidateUrls:['https://example.com'],fetchImpl:async()=>{called=true;}}),/loopback/u);assert.equal(called,false);
});
