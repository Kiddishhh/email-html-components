import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEditorCatalog } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { createSaveQueue } from '../skills/build-omnisend-campaign-draft/editor/public/editor-workflow.mjs';
const workspaceRoot = decodeURI(new URL('..', import.meta.url).pathname);
const load = () => import('../skills/build-omnisend-campaign-draft/editor/public/text-style-contract.mjs');
const schema = {properties:{title:{type:'string'}, subtitle:{type:'string'}, url:{type:'url'}, alt:{type:'string',role:'image-alt'}}};
const source = '<table><tr><td style="padding:24px 5%;padding:min(24px,4vw) 5%;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-size:min(30px,5vw);line-height:38px;color:{{settings.color.heading}};text-align:center;">{{content.title}}</td></tr><tr><td style="font-size:18px;">{{content.subtitle}}<a href="{{content.url}}"><img alt="{{content.alt}}"></a></td></tr></table>';
test('catalog derives text controls only from rendered text and resolves original styles', async () => {
  const { describeTextFields } = await load();
  const fields = describeTextFields(source, schema, {'color.heading':'#123456'});
  assert.deepEqual(Object.keys(fields), ['title','subtitle']);
  assert.equal(fields.title.defaults.fontSize,30);
  assert.equal(fields.title.defaults.color,'#123456');
  assert.equal(fields.title.defaults.spaceBefore,24);
  assert.ok(buildEditorCatalog({workspaceRoot}).find(x=>x.componentKey==='hero.minimalTitleCta').textFields['hero.title']);
});
test('text overrides are isolated, keep horizontal padding and emit desktop and mobile declarations', async () => {
  const { applyTextStyles } = await load();
  assert.equal(applyTextStyles(source,{},schema),source);
  const html=applyTextStyles(source,{title:{fontSize:36,lineHeight:44,letterSpacing:-1,color:'#ABCDEF',spaceBefore:12,textAlign:'left'}},schema);
  assert.match(html,/font-size:36px;font-size:min\(36px,6vw\)/);
  assert.match(html,/line-height:44px;line-height:min\(44px,7\.333333vw\)/);
  assert.match(html,/letter-spacing:-1px;letter-spacing:max\(-1px,-0\.166667vw\)/);
  assert.match(html,/padding:12px 5% 24px 5%;padding:min\(12px,2vw\) 5% min\(24px,4vw\) 5%/);
  assert.match(html,/<td style="font-size:18px;">\{\{content.subtitle\}\}/);
  assert.doesNotMatch(html,/data-freshine-editor-text/);
});
test('mixed text uses isolated text spans rather than changing a sibling field or link', async () => {
  const {applyTextStyles}=await load();
  const mixed='<td style="font-size:18px;"><a href="{{content.url}}">{{content.title}} / {{content.subtitle}}</a></td>';
  const result=applyTextStyles(mixed,{title:{color:'#FF0000'}},schema);
  assert.match(result,/<span style="color:#FF0000;">\{\{content.title\}\}<\/span> \/ \{\{content.subtitle\}\}/);
  assert.match(result,/<a href="\{\{content.url\}\}">/);
});
test('style validation rejects CSS injection, unsafe values and non-text fields',async()=>{
  const {applyTextStyles}=await load();
  for(const styles of [{title:{fontFamily:'Arial;position:fixed'}},{title:{color:'red'}},{title:{fontSize:999}},{title:{lineHeight:NaN}},{title:{unknown:1}},{url:{color:'#FFFFFF'}},{alt:{fontSize:12}},{title:[]},[]]) assert.throws(()=>applyTextStyles(source,styles,schema));
});
test('save queue retains and overlays text styles and resets after a failed save',async()=>{
  let fail=true; const sent=[];
  const queue=createSaveQueue({send:async(id,patch)=>{sent.push(patch);if(fail)throw Error('offline');return{};}});
  queue.enqueue('hero-1','textStyles','title',{fontSize:32},'draft-1');
  await assert.rejects(queue.flush());
  queue.enqueue('hero-1','textStyles','title',{},'draft-1');
  assert.deepEqual(queue.overlay({id:'draft-1',confirmed:true,components:[{instanceId:'hero-1',content:{},settings:{},textStyles:{title:{fontSize:32}},confirmed:true}]}).components[0].textStyles.title,{});
  fail=false; await queue.flush(); assert.deepEqual(sent.at(-1).textStyles.title,{});
});
test('alignment moves an inline title within its dedicated row without affecting other rows',async()=>{
 const {applyTextStyles}=await load();
 const template='<table><tr><td align="center" style="text-align:center;padding:0 5%;"><span style="display:inline-block;font-size:30px;text-align:center;">{{content.title}}</span></td></tr><tr><td align="center">{{content.subtitle}}</td></tr></table>';
 const html=applyTextStyles(template,{title:{textAlign:'right'}},schema);
 assert.match(html,/<td align="right" style="padding:0 5%;text-align:right;">/);
 assert.match(html,/<td align="center">\{\{content.subtitle\}\}/);
});
test('spacing respects existing directional padding and preserves untouched horizontal dimensions',async()=>{
 const {describeTextFields,applyTextStyles}=await load();
 const template='<td style="padding:0 5%;"><span style="display:block;padding-top:12px;padding-top:min(12px,2vw);padding-left:7px;padding-left:min(7px,1.166667vw);font-size:18px;">{{content.title}}</span></td>';
 assert.equal(describeTextFields(template,schema).title.defaults.spaceBefore,12);
 const html=applyTextStyles(template,{title:{spaceBefore:0,spaceAfter:16}},schema);
 assert.match(html,/padding:0px 0 16px 7px;padding:0 0 min\(16px,2\.666667vw\) min\(7px,1\.166667vw\)/);
 assert.doesNotMatch(html,/padding-top:12px/);
});
test('changing a color preserves an entity-quoted font family and shows its readable default name',async()=>{
 const {describeTextFields,applyTextStyles}=await load();
 const template='<td style="font-family:&#39;Lora&#39;,Georgia,serif;font-size:30px;">{{content.title}}</td>';
 assert.equal(describeTextFields(template,schema).title.defaults.fontFamily,'Lora');
 assert.match(applyTextStyles(template,{title:{color:'#123456'}},schema),/font-family:&#39;Lora&#39;,Georgia,serif;/);
});
test('vertical spacing on an explicitly inline note occupies layout space',async()=>{
 const {applyTextStyles}=await load();
 const template='<td><span style="display:inline;font-size:14px;line-height:20px;">{{content.title}}</span></td>';
 const html=applyTextStyles(template,{title:{spaceBefore:40,spaceAfter:40}},schema);
 assert.match(html,/display:inline-block/);assert.doesNotMatch(html,/display:inline;/);
 assert.equal(applyTextStyles(template,{},schema),template);
});
test('existing Chinese font is selectable with an email fallback stack',async()=>{
 const {applyTextStyles}=await load();
 assert.match(applyTextStyles(source,{title:{fontFamily:'Noto Sans SC'}},schema),/font-family:Noto Sans SC,Arial,Helvetica,sans-serif/);
});
test('unitless and percentage line heights display desktop pixels instead of a misleading multiplier',async()=>{
 const {describeTextFields}=await load();
 for(const value of ['1.5','150%'])assert.equal(describeTextFields(`<span style="font-size:16px;line-height:${value};">{{content.title}}</span>`,schema).title.defaults.lineHeight,24);
});
