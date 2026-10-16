import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
test('builder resolves repository components independently of caller cwd',t=>{
 const dir=mkdtempSync(join(tmpdir(),'email-moved-cwd-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const directory='头图/极简标题CTA头图';
 const content=JSON.parse(readFileSync(join(root,directory,'content.fixture.v1.json'),'utf8'));
 const settings=JSON.parse(readFileSync(join(root,directory,'settings.defaults.v1.json'),'utf8'));
 const path=join(dir,'composition.json');
 writeFileSync(path,JSON.stringify({schemaVersion:1,canvas:{backgroundColor:'#FFFFFF',outerBackgroundColor:'#FFFFFF',contentWidth:600,mobileTargetWidth:375,verticalPadding:0},output:join(dir,'final.html'),previewOutput:join(dir,'preview.html'),components:[{name:'portable',directory,componentKey:content.componentKey,content:content.values,settings:settings.values}]}));
 const result=spawnSync(process.execPath,[join(root,'build-email-template.v1.mjs'),path],{cwd:dir,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.match(readFileSync(join(dir,'final.html'),'utf8'),/<table/);
});
test('normalization check resolves the registry independently of caller cwd',()=>{
 const result=spawnSync(process.execPath,[join(root,'scripts/normalize-inline-mobile-dimensions.mjs'),'--check'],{cwd:tmpdir(),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/114/);
});
test('missing image backends produce actionable dependency error without writing output',t=>{
 const dir=mkdtempSync(join(tmpdir(),'email-image-backend-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const result=spawnSync(process.execPath,[join(root,'skills/build-omnisend-campaign-draft/scripts/prepare-countdown-hero-2-image.mjs'),'--input',join(root,'头图/促销悬浮首图/assets/default-background.reference.png'),'--output',join(dir,'out.jpg')],{env:{...process.env,PATH:dir},encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/sips.*ImageMagick|ImageMagick.*sips/);assert.doesNotMatch(result.stderr,/TypeError/);
});
test('importers share configurable storefront and admin store with offline fixtures',t=>{
 const dir=mkdtempSync(join(tmpdir(),'email-store-config-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const config=join(dir,'shopify.json');writeFileSync(config,JSON.stringify({storefrontOrigin:'https://shop.example.com',adminStore:'example-shop.myshopify.com'}));
 const code=`
  import assert from 'node:assert/strict';
  import { parseSaleGridArgs, normalizeSaleGrid } from ${JSON.stringify(new URL('../skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs',import.meta.url).href)};
  import { parseShopifyProductImportUrl } from ${JSON.stringify(new URL('../skills/build-omnisend-campaign-draft/scripts/fetch-activity-page-sale-grid.mjs',import.meta.url).href)};
  assert.equal(parseSaleGridArgs(['--collection-handle','sale','--count','6']).store,'example-shop.myshopify.com');
  assert.equal(parseSaleGridArgs(['--collection-handle','sale','--count','6','--store','override.myshopify.com']).store,'override.myshopify.com');
  assert.equal(parseShopifyProductImportUrl('https://shop.example.com/collections/sale').handle,'sale');
  assert.throws(()=>parseShopifyProductImportUrl('https://freshinelife.com/collections/sale'));
 `;
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd:dir,env:{...process.env,FRESHINE_SHOPIFY_CONFIG:config},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
