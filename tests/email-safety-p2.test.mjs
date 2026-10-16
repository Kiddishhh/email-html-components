import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createOmnisendHtmlExportTransaction, createDraftUploadTransaction, sha256 } from '../skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs';
const root = resolve(import.meta.dirname, '..');
const unsafe = [
 ['abrupt comment close', '<!--><img src="x" onerror="alert(1)"> -->'],
 ['alternate comment close', '<!-- hidden --!><img src="x" onerror="alert(1)"> -->'],
 ['event handler', '<img src="https://example.com/a.png" onerror="alert(1)">'],
 ['relative image', '<img src="images/missing.jpg">'],
 ['unbalanced table', '<table><tr><td>broken</tr></table>'],
 ['encoded protocol', '<a href="java&#x73;cript:alert(1)">go</a>'],
 ['CSS image-set string URL', `<td style="background-image:image-set('images/missing.jpg' 1x)">x</td>`],
 ['CSS vendor image-set file URL', `<td style="background-image:-webkit-image-set('file:///tmp/local.png' 1x)">x</td>`],
 ['CSS escaped URL function', '<td style="background-image:u&bsol;rl(images/missing.jpg)">x</td>'],
 ['CSS escaped expression', '<td style="width:e&bsol;xpression(alert(1))">x</td>'],
 ['CSS local image', '<td style="background-image:url(images/missing.jpg)">x</td>'],
 ['script', '<script>alert(1)</script>'],
 ['VML local image', '<!--[if mso]><v:fill src="images/missing.jpg"/><![endif]-->'],
 ['duplicate attribute', '<img src="https://example.com/a.png" src="images/missing.jpg">'],
 ['unresolved placeholder', '<p>{{content.title}}</p>']
];
for (const [label, fragment] of unsafe) {
 test(`export and draft upload reject ${label} before any image or API request`, async () => {
  const html = `<table><tr><td><img src="asset://local">${fragment}<a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>`;
  const assets = {local:{localPath:'fake.png',name:'fake.png',mimeType:'image/png'}};
  const calls = [];
  const options = {html,assets,readFile:async()=>Buffer.from('fake'),transport:async req=>{calls.push(req);return {status:201,json:{id:'img',url:'https://app.omnisend.com/images/img'}};}};
  await assert.rejects(async()=>createOmnisendHtmlExportTransaction(options).run('mock'), /unsafe|relative|unbalanced|placeholder|attribute|HTML|URL/i);
  assert.equal(calls.length,0,'export must validate before uploading images');
  const projectState={assets,finalConfirmation:{status:'confirmed',confirmedStaticHtmlSha256:sha256(html)}};
  await assert.rejects(async()=>createDraftUploadTransaction({...options,projectState}).run('mock'), /unsafe|relative|unbalanced|placeholder|attribute|HTML|URL/i);
  assert.equal(calls.length,0,'draft upload must validate before API requests');
 });
}
for (const [label, mutate] of [
 ['event handler',s=>s.replace('<table','<table onclick="alert(1)"')],
 ['relative image',s=>s.replace('</td>','<img src="images/missing.jpg"></td>')],
 ['unbalanced table',s=>s.replace('</td>','')]
]) test(`builder rejects ${label} without writing final output`,t=>{
 const dir=mkdtempSync(join(tmpdir(),'email-safety-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const source=join(root,'头图/极简标题CTA头图');cpSync(source,join(dir,'component'),{recursive:true});
 const template=join(dir,'component/component.template.v1.html');writeFileSync(template,mutate(readFileSync(template,'utf8')));
 const content=JSON.parse(readFileSync(join(source,'content.fixture.v1.json'),'utf8'));
 const settings=JSON.parse(readFileSync(join(source,'settings.defaults.v1.json'),'utf8'));
 const output=join(dir,'final.html');const file=join(dir,'composition.json');
 writeFileSync(file,JSON.stringify({schemaVersion:1,canvas:{backgroundColor:'#FFFFFF',outerBackgroundColor:'#FFFFFF',contentWidth:600,mobileTargetWidth:375,verticalPadding:0},output,previewOutput:join(dir,'preview.html'),components:[{name:'test',directory:join(dir,'component'),componentKey:content.componentKey,content:content.values,settings:settings.values}]}));
 const result=spawnSync(process.execPath,[join(root,'build-email-template.v1.mjs'),file],{cwd:root,encoding:'utf8'});
 assert.notEqual(result.status,0,result.stdout);assert.match(result.stderr,/unsafe|relative|unbalanced|attribute|HTML/i);assert.equal(existsSync(output),false);
});
test('safe export preserves VML, responsive CSS, mailto/tel, escaping and unsubscribe links byte for byte',async()=>{
 const html='<table><tr><td><!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" href="https://example.com/shop"><v:fill src="https://example.com/a.png"/><v:textbox><![endif]--><img src="https://example.com/a.png?a=1&amp;b=2" alt="Room &amp; curtains" style="width:100%;max-width:600px;height:min(400px,66.666667vw);"><!--[if mso]></v:textbox></v:rect><![endif]--><a href="mailto:help@example.com">Email</a><a href="tel:+123456789">Call</a><a href="[[unsubscribe_link]]">Unsubscribe</a></td></tr></table>';
 const result=await createOmnisendHtmlExportTransaction({html,assets:{},readFile:async()=>{throw Error('unexpected read');},transport:async()=>{throw Error('unexpected request');}}).run('mock');
 assert.equal(result.html,html);assert.deepEqual(result.uploadedImageIDs,[]);
});
