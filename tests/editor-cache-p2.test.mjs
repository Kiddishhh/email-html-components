import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createCampaignEditorServer } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';
const workspaceRoot=resolve(import.meta.dirname,'..');
test('default exporter reuses persisted image bytes and isolates API key namespaces',async t=>{
 const root=mkdtempSync(join(workspaceRoot,'build/cache-p2-'));const originalFetch=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{
  if(new URL(url).hostname==='127.0.0.1')return originalFetch(url,options);
  assert.equal(String(url),'https://api.omnisend.com/api/images/upload');assert.equal(options.method,'POST');calls.push(options);
  return new Response(JSON.stringify({id:`image-${calls.length}`,url:`https://app.omnisend.com/images/image-${calls.length}`}),{status:201});
 };
 let server; t.after(async()=>{if(server)await server.close();globalThis.fetch=originalFetch;rmSync(root,{recursive:true,force:true});});
 const start=async()=>{server=await createCampaignEditorServer({workspaceRoot,sessionRoot:root,templateRoot:join(root,'templates')});return server.listen();};
 let base=await start();
 const post=async(path,body={})=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.ok,true,data.error);return data;};
 const setup=async()=>{
  const {draft}=await post('/api/drafts',{name:'cache regression'});const path=`/api/drafts/${draft.id}`;
  for(const key of ['footer.warm','image.clickableFullWidth']){
   const {draft:added}=await post(path+'/components',{componentKey:key});const item=added.components.at(-1);
   if(key==='image.clickableFullWidth')await post(path+`/components/${item.instanceId}/upload-image`,{fieldKey:'image.url',filename:'same.png',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg=='});
   await post(path+`/components/${item.instanceId}/confirm`);
  }
  return path;
 };
 let path=await setup();
 const first=await post(path+'/export-omnisend-html',{apiKey:'mock-account-a'});
 const second=await post(path+'/export-omnisend-html',{apiKey:'mock-account-a'});
 assert.equal(calls.length,1);assert.equal(second.html,first.html);assert.deepEqual(second.reusedImageIDs,['image-1']);
 path=await setup();
 await post(path+'/export-omnisend-html',{apiKey:'mock-account-a'});assert.equal(calls.length,1,'cache is reused by a second draft in the same session');
 await post(path+'/export-omnisend-html',{apiKey:'mock-account-b'});assert.equal(calls.length,2,'different account must upload separately');
 const persisted=readFileSync(join(root,'omnisend-image-cache.v1.json'),'utf8');assert.doesNotMatch(persisted,/mock-account-[ab]/);
});
