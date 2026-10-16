import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createOmnisendHtmlExportTransaction, createDraftUploadTransaction, sha256 } from '../skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs';
import { buildEditorCatalog, createCampaignDocument, addComponentInstance, buildLocalAssetMap } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
const workspaceRoot=resolve(import.meta.dirname,'..');
for (const reversed of [false,true]) test(`real benefits components keep distinct image URLs, reversed=${reversed}`, async t=>{
 const dir=mkdtempSync(join(tmpdir(),'email-asset-prefix-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const catalog=buildEditorCatalog({workspaceRoot});let document=createCampaignDocument();
 const keys=['image.benefitsStrip4','image.benefitsStrip4TwoRows'];if(reversed)keys.reverse();
 for(const key of keys)document=addComponentInstance(document,catalog,key);
 const assets=buildLocalAssetMap(document,{workspaceRoot});
 const path=join(dir,'composition.json'),output=join(dir,'email.html');
 writeFileSync(path,JSON.stringify({schemaVersion:1,canvas:document.canvas,fontDefaults:document.fontDefaults,output,previewOutput:join(dir,'preview.html'),assets,components:document.components.map(({name,directory,componentKey,content,settings})=>({name,directory,componentKey,content,settings}))}));
 const result=spawnSync(process.execPath,[join(workspaceRoot,'build-email-template.v1.mjs'),path,'--defer-local-assets'],{encoding:'utf8',cwd:workspaceRoot});assert.equal(result.status,0,result.stderr);
 const html=readFileSync(output,'utf8');const calls=[];const imageCache={};
 const exportOnce=()=>createOmnisendHtmlExportTransaction({html,assets:Object.fromEntries(Object.entries(assets).map(([id,a])=>[id,{localPath:resolve(workspaceRoot,a.path),name:id+extname(a.name),mimeType:'image/png'}])),imageCache,readFile:async path=>readFileSync(path),transport:async request=>{
  assert.equal(new URL(request.url).pathname,'/api/images/upload');const id=request.body.get('name');calls.push(id);return {status:201,json:{id,url:`https://example.com/${id}`}};
 }}).run('mock');
 const first=await exportOnce();const expected=keys.map(key=>catalog.find(c=>c.componentKey===key).defaultContent.values).flatMap(values=>Object.values(values).filter(value=>value.startsWith('asset://')).map(value=>value.slice(8))).map(id=>`https://example.com/${id}${extname(assets[id].name)}`);
 assert.deepEqual([...first.html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gu)].map(m=>m[1]),expected);
 const second=await exportOnce();assert.equal(second.html,first.html);assert.equal(calls.length,2);assert.equal(second.reusedImageIDs.length,2);
});
test('prefix-related tokens are replaced exactly in img, background, CSS and VML attributes',async()=>{
 const html='<table background="asset://a"><tr><td style="background-image:url(asset://a-long)"><!--[if mso]><v:rect><v:fill src="asset://a-long"/><v:textbox><![endif]--><img src="asset://a"><!--[if mso]></v:textbox></v:rect><![endif]--></td></tr></table>';
 const urls={a:'https://example.com/a.png?x=$&', 'a-long':'https://example.com/long.png'};
 const result=await createOmnisendHtmlExportTransaction({html,assets:Object.fromEntries(Object.keys(urls).map(id=>[id,{localPath:id,name:id+'.png',mimeType:'image/png'}])),readFile:async path=>Buffer.from(path),transport:async req=>{const id=req.body.get('name').replace('.png','');return {status:201,json:{id,url:urls[id]}};}}).run('mock');
 assert.equal(result.html,html.replaceAll('asset://a-long',urls['a-long']).replaceAll('asset://a',()=>urls.a));
});

for (const mode of ['created','updated']) test(`${mode} draft preserves both prefix-related images through upload and readback`,async()=>{
 const html='<table><tr><td><img src="asset://a" alt="First"><img src="asset://a-long" alt="Second"><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
 const content=body=>({generalSettings:{content:{width:'600px'}},sections:[{rows:[{columns:[{blocks:[{id:'html',type:'htmlCode',htmlCode:{body}}]}]}]}]});
 const assets=Object.fromEntries(['a','a-long'].map(id=>[id,{localPath:id,name:id+'.png',mimeType:'image/png'}]));
 let written;
 const receipt=await createDraftUploadTransaction({html,projectState:{campaign:{name:'Prefix regression',subject:'Images'},assets,finalConfirmation:{status:'confirmed',confirmedStaticHtmlSha256:sha256(html)}},readFile:async path=>Buffer.from(path),transport:async req=>{
  const path=new URL(req.url).pathname;
  if(path==='/api/images/upload'){const id=req.body.get('name');return {status:201,json:{id,url:`https://example.com/${id}`}};}
  if(path==='/api/campaigns'&&req.method==='GET')return {status:200,json:{items:mode==='updated'?[{id:'campaign',name:'Prefix regression',status:'draft'}]:[]}};
  if(path==='/api/brands/current')return {status:200,json:{name:'Freshine'}};
  if(path==='/api/email-templates/import'){written=req.body.html;return {status:201,json:{id:'template'}};}
  if(path==='/api/campaigns'&&req.method==='POST')return {status:201,json:{id:'campaign',status:'draft',content:{email:{contentID:'content'}}}};
  if(path==='/api/campaigns/campaign')return {status:200,json:{id:'campaign',status:'draft',content:{email:{contentID:'content'}}}};
  if(path==='/api/email-content/content'&&req.method==='PUT'){written=req.body.sections[0].rows[0].columns[0].blocks[0].htmlCode.body;return {status:200,json:req.body};}
  if(path==='/api/email-content/content')return {status:200,json:content(written??'<table><tr><td>Old <a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>')};
  throw Error('Unexpected mocked request '+req.method+' '+path);
 }}).run('mock');
 assert.equal(receipt.readbackVerified,true);assert.equal(receipt.operation,mode);
 assert.equal(written,html.replace('asset://a-long','https://example.com/a-long.png').replace('asset://a','https://example.com/a.png'));
});
