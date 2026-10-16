import {realpathSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildEditorCatalog} from '../editor/campaign-editor-core.mjs';

function loopbackUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='http:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname!=='/')throw Error('editor discovery only accepts root HTTP loopback URLs');
  return url.origin;
}
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='thumbnailUrl').sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));
  return value;
}
export async function findCampaignEditor({catalog,candidateUrls,fetchImpl=fetch,timeoutMs=1500}) {
  if(!Array.isArray(catalog)||!catalog.length)throw Error('workspace catalog must not be empty');
  const urls=[...new Set(candidateUrls.map(loopbackUrl))],expected=JSON.stringify(canonical(catalog));
  const probe=async url=>{
    try {
      const response=await fetchImpl(`${url}/api/catalog`,{signal:AbortSignal.timeout(timeoutMs)});
      if(!response.ok)return {url,state:'occupied'};
      const {components}=await response.json();
      if(!Array.isArray(components))return {url,state:'occupied'};
      if(JSON.stringify(canonical(components))===expected)return {url,state:'ready'};
      const sameWorkspace=components.some(c=>catalog.some(local=>local.demoPath===c.demoPath));
      return {url,state:sameWorkspace?'stale':'occupied'};
    } catch(error) {return {url,state:(error.cause?.code??error.code)==='ECONNREFUSED'?'free':'unavailable'};}
  };
  const results=[];
  if(urls.length)results.push(await probe(urls[0]));
  if(results[0]?.state==='ready')return {status:'ready',url:results[0].url,componentCount:catalog.length,staleUrls:[]};
  results.push(...await Promise.all(urls.slice(1).map(probe)));
  const ready=results.find(r=>r.state==='ready'),staleUrls=results.filter(r=>r.state==='stale').map(r=>r.url);
  if(ready)return {status:'ready',url:ready.url,componentCount:catalog.length,staleUrls};
  const free=results.find(r=>r.state==='free');
  return {status:'start-required',startPort:free?Number(new URL(free.url).port||80):null,staleUrls,componentCount:catalog.length};
}

async function main() {
  const preferred=[];
  for(let index=2;index<process.argv.length;index++) {
    if(process.argv[index]==='--url' && process.argv[index+1])preferred.push(process.argv[++index]);
    else if(process.argv[index]==='--help'){console.log('node resolve-campaign-editor.mjs [--url http://127.0.0.1:PORT/]\nRead-only lookup of matching editor catalog on loopback ports 4173–4205.');return;}
    else throw Error(`unknown or incomplete option: ${process.argv[index]}`);
  }
  const workspaceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
  const defaults=[4173,...Array.from({length:32},(_,i)=>4205-i)].map(port=>`http://127.0.0.1:${port}`);
  const result=await findCampaignEditor({catalog:buildEditorCatalog({workspaceRoot}),candidateUrls:[...preferred,...defaults]});
  console.log(JSON.stringify({...result,workspaceRoot},null,2));
}
if(process.argv[1] && realpathSync(resolve(process.argv[1]))===fileURLToPath(import.meta.url))await main();
