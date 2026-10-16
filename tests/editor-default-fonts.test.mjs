import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {buildEditorCatalog} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {createCampaignEditorServer} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';
const workspaceRoot=resolve(import.meta.dirname,'..');
test('default title and body fonts use the requested exact fallbacks and allow explicit overrides',async()=>{
 const {applyDefaultFonts,applyTextStyles}=await import('../skills/build-omnisend-campaign-draft/editor/public/text-style-contract.mjs');
 const schema={properties:{'hero.title':{type:'text'},'hero.subtitle':{type:'text'},'cta.text':{type:'text'},'product.title':{type:'text'}}};
 const source='<td style="font-family:Lora,Georgia,serif;font-size:36px;">{{content.hero.title}}</td><td style="font-family:Montserrat,Arial,sans-serif;padding:12px;">{{content.hero.subtitle}}</td><a href="https://example.com" style="font-family:Arial;">{{content.cta.text}}</a><span style="font-family:Montserrat;">{{content.product.title}}</span>';
 const html=applyDefaultFonts(source,schema);
 assert.match(html,/<td style="font-size:36px;font-family:Georgia,serif;">/);
 assert.match(html,/<td style="font-family:Verdana,sans-serif;padding:12px;">/);
 assert.match(html,/<a href="https:\/\/example.com" style="font-family:Verdana,sans-serif;">/);
 assert.match(html,/<span style="font-family:Georgia,serif;">/);
 assert.match(applyTextStyles(html,{'hero.title':{fontFamily:'Arial'}},schema),/font-family:Arial,Helvetica,sans-serif/);
 assert.equal(applyTextStyles(html,{'hero.title':{}},schema),html);
 const card=buildEditorCatalog({workspaceRoot}).find(c=>c.componentKey==='hero.minimalTitleCta');
 assert.equal(card.textFields['hero.title'].defaults.fontFamily,'Georgia');assert.equal(card.textFields['hero.subtitle'].defaults.fontFamily,'Verdana');
});
test('product names displayed as titles use Georgia across real component schemas',async()=>{
 const {defaultFontForField,applyDefaultFonts}=await import('../skills/build-omnisend-campaign-draft/editor/public/text-style-contract.mjs');
 const catalog=buildEditorCatalog({workspaceRoot});
 const names=catalog.flatMap(card=>Object.entries(card.textFields).filter(([key])=>key==='product.name'||/^saleItems\[\d+\]\.name$/u.test(key)));
 assert.ok(names.length>=7);
 for(const [key,field] of names){assert.equal(defaultFontForField(key),'Georgia',key);assert.equal(field.defaults.fontFamily,'Georgia',key);}
 for(const key of ['product.price','product.description','cta.text'])assert.equal(defaultFontForField(key),'Verdana',key);
 const schema={properties:{'product.name':{type:'text'},'saleItems[0].name':{type:'text'}}};
 const html=applyDefaultFonts('<span>{{content.product.name}}</span><td>{{content.saleItems[0].name}}</td>',schema);
 assert.equal((html.match(/font-family:Georgia,serif/g)||[]).length,2);
});
test('editor defaults reach preview and export while custom fonts remain per field',async t=>{
 const root=mkdtempSync(join(workspaceRoot,'build/default-fonts-test-'));const server=await createCampaignEditorServer({workspaceRoot,sessionRoot:root,templateRoot:join(root,'templates')});const base=await server.listen();t.after(async()=>{await server.close();rmSync(root,{recursive:true,force:true});});
 const request=async(path,body,method='POST')=>{const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(response.ok,true,await response.clone().text());return response.json();};
 const {draft}=await request('/api/drafts',{name:'Fonts'});const path=`/api/drafts/${draft.id}`;const result=await request(path+'/components',{componentKey:'hero.minimalTitleCta'});const instance=result.draft.components[0];
 const preview=async()=>{const {previewUrl}=await request(path+'/preview',{});return (await fetch(base+previewUrl)).text();};
 const baseline=await preview();assert.match(baseline,/font-family:Georgia,serif/);assert.match(baseline,/font-family:Verdana,sans-serif/);assert.doesNotMatch(baseline,/font-family:(?:Lora|Montserrat)/);
 await request(path+`/components/${instance.instanceId}`,{textStyles:{'hero.title':{fontFamily:'Arial'}}},'PATCH');assert.match(await preview(),/font-family:Arial,Helvetica,sans-serif/);
 await request(path+`/components/${instance.instanceId}`,{textStyles:{'hero.title':{}}},'PATCH');assert.equal(await preview(),baseline);
 await request(path+`/components/${instance.instanceId}/confirm`,{});await request(path+'/prepare-omnisend-draft',{campaign:{name:'Fonts',subject:'Fonts',preheader:''}});
 const {readFileSync}=await import('node:fs');const composition=JSON.parse(readFileSync(join(root,draft.id,'composition.v1.json'),'utf8'));const exported=readFileSync(composition.output,'utf8');
 assert.match(exported,/font-family:Georgia,serif/);assert.match(exported,/font-family:Verdana,sans-serif/);assert.doesNotMatch(exported,/<script|<iframe|fonts.googleapis/);
});
test('semantic product captions including legacy cta.text share Georgia in catalog and rendered output',async()=>{
 const {readFileSync}=await import('node:fs');
 const {applyDefaultFonts,applyTextStyles}=await import('../skills/build-omnisend-campaign-draft/editor/public/text-style-contract.mjs');
 const roles=JSON.parse(readFileSync(join(workspaceRoot,'skills/build-omnisend-campaign-draft/references/typography-roles.v1.json'),'utf8'));
 const catalog=buildEditorCatalog({workspaceRoot});let count=0;
 for(const card of catalog){
  const slots=roles[card.componentKey]?.slots??{};
  const template=readFileSync(join(workspaceRoot,card.directory,'component.template.v1.html'),'utf8');
  const html=applyDefaultFonts(template,card.contentSchema,slots);
  for(const [key,role] of Object.entries(slots)){
   if(role!=='caption'||!card.textFields[key])continue;count++;
   assert.equal(card.textFields[key].defaults.fontFamily,'Georgia',`${card.componentKey} ${key}`);
   // Explicit override can still replace the semantic default without changing any other field.
   const overridden=applyTextStyles(html,{[key]:{fontFamily:'Arial'}},card.contentSchema);
   assert.notEqual(overridden,html,`${card.componentKey} ${key}`);
   const field=html.match(new RegExp('<[^>]*data-freshine-slot="'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"[^>]*>'));
   assert.ok(field,`${card.componentKey} ${key}`);assert.match(field[0],/font-family:Georgia,serif/);
  }
 }
 assert.ok(count>=30);
 assert.equal(catalog.find(c=>c.componentKey==='hero.minimalTitleCta').textFields['hero.cta.text'].defaults.fontFamily,'Verdana');
});
test('builder applies semantic fonts to real caption slots while preserving explicit overrides and source geometry',async t=>{
 const {readFileSync,writeFileSync}=await import('node:fs');const {spawnSync}=await import('node:child_process');const {tmpdir}=await import('node:os');
 const dir=mkdtempSync(join(tmpdir(),'email-font-render-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const roles=JSON.parse(readFileSync(join(workspaceRoot,'skills/build-omnisend-campaign-draft/references/typography-roles.v1.json'),'utf8'));
 const catalog=buildEditorCatalog({workspaceRoot});
 for(const componentKey of ['collection.saleGrid4WithTitle','collection.productGrid4NoSidePadding','collection.curtainInspirationGrid4','collection.curtainEditorialTriptych']){
  const card=catalog.find(c=>c.componentKey===componentKey);const slot=Object.entries(roles[componentKey].slots).find(([,role])=>role==='caption')[0];
  const item={name:card.name,directory:card.directory,componentKey,content:Object.fromEntries(Object.entries(card.defaultContent.values).map(([key,value])=>[key,value.startsWith('asset://')?'https://example.com/'+value.slice(8)+'.png':value])),settings:card.defaultSettings.values};
  if ('grid.showCaptions' in item.settings) item.settings={...item.settings,'grid.showCaptions':true};
  const output=join(dir,'out.html');const path=join(dir,'composition.json');const composition={schemaVersion:1,fontDefaults:'georgia-verdana',canvas:{backgroundColor:'#FFFFFF',outerBackgroundColor:'#FFFFFF',contentWidth:600,mobileTargetWidth:375,verticalPadding:0},output,previewOutput:join(dir,'preview.html'),components:[item]};
  const render=()=>{writeFileSync(path,JSON.stringify(composition));const result=spawnSync(process.execPath,[join(workspaceRoot,'build-email-template.v1.mjs'),path],{cwd:workspaceRoot,encoding:'utf8'});assert.equal(result.status,0,result.stderr);return readFileSync(output,'utf8');};
  const defaults=render();assert.match(defaults,/font-family:Georgia,serif/);
  item.textStyles={[slot]:{fontFamily:'Arial'}};const custom=render();assert.notEqual(custom,defaults);assert.match(custom,/font-family:Arial,Helvetica,sans-serif/);
  delete item.textStyles;delete composition.fontDefaults;const original=render();
  const withoutFonts=html=>html.replace(/font-family\s*:\s*(?:&(?:#\d+|#x[\da-f]+|[a-z]+);|[^;"<>])+(?:;|(?="))/giu,'').replace(/;{2,}/gu,';');
  // Only the font declarations may differ; markup, geometry, copy and links stay identical.
  assert.equal(withoutFonts(defaults),withoutFonts(original),componentKey);
 }
});
