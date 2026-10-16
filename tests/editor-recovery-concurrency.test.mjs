import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { request as httpRequest } from 'node:http';
import { resolve, join } from 'node:path';
import { createCampaignEditorServer } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs';
const workspaceRoot = resolve(import.meta.dirname, '..');
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg==';
async function setup(t, options = {}) {
  fs.mkdirSync(join(workspaceRoot, 'build'), { recursive: true });
  const root = fs.mkdtempSync(join(workspaceRoot, 'build/recovery-'));
  const server = await createCampaignEditorServer({ workspaceRoot, sessionRoot: join(root, 'session'), templateRoot: join(root, 'templates'),
    runDraftUploader: async () => { throw Error('external writes forbidden'); }, runHtmlExporter: async () => { throw Error('external writes forbidden'); }, ...options });
  let listening = false;
  t.after(async () => {
    try { if (listening) await server.close(); }
    finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  const base = await server.listen();
  listening = true;
  const api = async (path, body, method = body === undefined ? 'GET' : 'POST') => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, ...await r.json() };
  };
  const { draft } = await api('/api/drafts', { name: 'Recovery' });
  const path = `/api/drafts/${draft.id}`;
  const added = await api(path + '/components', { componentKey: 'hero.minimalTitleCta' });
  const hero = added.draft.components[0];
  return { root, base, api, path, id: draft.id, hero };
}
function failFs(t, method, predicate) {
  const original = fs[method];
  const mock = t.mock.method(fs, method, (...args) => {
    if (predicate(...args)) throw Object.assign(Error('injected filesystem failure'), { code: 'EIO' });
    return original(...args);
  });
  syncBuiltinESMExports();
  const restore = () => { mock.mock.restore(); syncBuiltinESMExports(); };
  t.after(restore);
  return restore;
}
for (const mode of ['create', 'overwrite']) for (const phase of ['copy', 'assets', 'index']) {
  test(`template ${mode} survives ${phase} failure and retry`, async t => {
    const { root, api, path, id, hero } = await setup(t);
    await api(`${path}/components/${hero.instanceId}/upload-image`, { fieldKey: 'hero.image.url', dataUrl: `data:image/png;base64,${png}` });
    if (mode === 'overwrite') assert.equal((await api('/api/templates', { name: 'Saved', draftId: id })).status, 201);
    const storePath = join(root, 'templates/saved-templates.v1.json');
    const oldBytes = fs.existsSync(storePath) ? fs.readFileSync(storePath) : null;
    await api(`${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'NEW TITLE' } }, 'PATCH');
    const restore = failFs(t, phase === 'copy' ? 'copyFileSync' : 'renameSync', (source, target) => phase === 'copy'
      ? String(target).includes('/.staging-')
      : phase === 'assets' ? String(source).includes('/.staging-') : target === storePath);
    const failed = await api('/api/templates', { name: 'Saved', draftId: id, overwrite: mode === 'overwrite' });
    restore();
    assert.equal(failed.status, 400);
    if (oldBytes) {
      assert.deepEqual(fs.readFileSync(storePath), oldBytes, 'failed save must preserve committed index bytes');
      const saved = JSON.parse(oldBytes).templates[0];
      for (const asset of Object.values(saved.snapshot.localAssets)) assert.deepEqual(fs.readFileSync(resolve(workspaceRoot, asset.path)), Buffer.from(png, 'base64'));
      const loaded = await api(`/api/templates/${saved.id}/drafts`, {});
      assert.equal(loaded.status, 201);
      assert.notEqual(loaded.draft.components[0].content['hero.title'], 'NEW TITLE');
    } else assert.equal((await api('/api/templates')).templates.length, 0, 'failed creation must not publish a broken template');
    const retry = await api('/api/templates', { name: 'Saved', draftId: id, overwrite: mode === 'overwrite' });
    assert.equal(retry.status, mode === 'overwrite' ? 200 : 201, retry.error);
    const loaded = await api(`/api/templates/${retry.template.id}/drafts`, {});
    assert.equal(loaded.draft.components[0].content['hero.title'], 'NEW TITLE');
  });
}
async function slowPatch(base, path, body) {
  let result;
  const done = new Promise((resolveResult, reject) => {
    result = httpRequest(base + path, { method: 'PATCH', headers: { 'content-type': 'application/json' } }, r => {
      let data = ''; r.on('data', chunk => data += chunk); r.on('end', () => resolveResult({ status: r.statusCode, ...JSON.parse(data) }));
    });
    result.on('error', reject);
  });
  result.write('{');
  // The first chunk reaches the real route before a competing full request.
  await new Promise(resolveWait => setTimeout(resolveWait, 40));
  return { finish: () => { result.end(JSON.stringify(body).slice(1)); return done; } };
}
test('streamed PATCH merges into the latest draft instead of losing another field', async t => {
  const { base, api, path, hero } = await setup(t);
  const slow = await slowPatch(base, `${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'SLOW TITLE' } });
  const fast = await api(`${path}/components/${hero.instanceId}`, { content: { 'hero.image.alt': 'FAST ALT' } }, 'PATCH');
  assert.equal(fast.status, 200);
  assert.equal((await slow.finish()).status, 200);
  const final = (await api(path)).draft.components[0];
  assert.equal(final.content['hero.title'], 'SLOW TITLE');
  assert.equal(final.content['hero.image.alt'], 'FAST ALT');
});
test('streamed PATCH cannot resurrect a deleted component', async t => {
  const { base, api, path, hero } = await setup(t);
  const slow = await slowPatch(base, `${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'STALE' } });
  assert.equal((await api(`${path}/components/${hero.instanceId}`, undefined, 'DELETE')).status, 200);
  assert.notEqual((await slow.finish()).status, 200);
  assert.deepEqual((await api(path)).draft.components, []);
});
test('an in-flight export serializes same-draft edits, releases after failure and does not block other drafts', async t => {
  let begin, release;
  const started = new Promise(r => begin = r), blocked = new Promise(r => release = r);
  const { api, path, hero } = await setup(t, { runHtmlExporter: async () => { begin(); await blocked; throw Error('mock export failure'); } });
  t.after(() => release());
  const footer = await api(path + '/components', { componentKey: 'footer.warm' });
  for (const c of footer.draft.components) await api(`${path}/components/${c.instanceId}/confirm`, {});
  const exporting = api(path + '/export-omnisend-html', { apiKey: 'mock' });
  await started;
  let edited = false;
  const editing = api(`${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'AFTER EXPORT' } }, 'PATCH').then(r => { edited = true; return r; });
  await api('/api/drafts', { name: 'Independent draft' });
  await new Promise(r => setTimeout(r, 30));
  const editedBeforeRelease = edited;
  release();
  assert.equal(editedBeforeRelease, false, 'same draft must wait until output completes');
  assert.equal((await exporting).status, 400);
  assert.equal((await editing).status, 200);
  assert.equal((await api(path)).draft.components[0].content['hero.title'], 'AFTER EXPORT');
  assert.equal((await api(path)).draft.confirmed, false);
});

test('a committed overwrite stays successful when old-asset cleanup fails and later retries cleanup', async t => {
  const { root, api, path, id, hero } = await setup(t);
  await api(`${path}/components/${hero.instanceId}/upload-image`, { fieldKey: 'hero.image.url', dataUrl: `data:image/png;base64,${png}` });
  const saved = await api('/api/templates', { name: 'Saved', draftId: id });
  const storePath = join(root, 'templates/saved-templates.v1.json');
  const oldAsset = resolve(workspaceRoot, Object.values(JSON.parse(fs.readFileSync(storePath)).templates[0].snapshot.localAssets)[0].path);
  await api(`${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'COMMITTED' } }, 'PATCH');
  const restore = failFs(t, 'rmSync', path => String(path).includes('/assets/'));
  const overwritten = await api('/api/templates', { name: 'Saved', draftId: id, overwrite: true });
  restore();
  assert.equal(overwritten.status, 200, overwritten.error);
  assert.equal(fs.existsSync(oldAsset), true, 'unreferenced files may remain after cleanup failure');
  const loaded = await api(`/api/templates/${saved.template.id}/drafts`, {});
  assert.equal(loaded.draft.components[0].content['hero.title'], 'COMMITTED');
  assert.equal((await api('/api/templates', { name: 'Saved', draftId: id, overwrite: true })).status, 200);
  assert.equal(fs.existsSync(oldAsset), false, 'next mutation retries unreferenced file cleanup');
});

test('next save recovers unreferenced staging, revision and index temp files without deleting committed images', async t => {
  const { root, api, path, id, hero } = await setup(t);
  await api(`${path}/components/${hero.instanceId}/upload-image`, { fieldKey: 'hero.image.url', dataUrl: `data:image/png;base64,${png}` });
  const saved = await api('/api/templates', { name: 'Saved', draftId: id });
  const garbage = [join(root,'templates/assets/.staging-interrupted'),join(root,`templates/assets/${saved.template.id}/.revision-interrupted`)];
  for (const dir of garbage) { fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(join(dir,'image.png'),'uncommitted'); }
  const tempIndex=join(root,'templates/.templates-interrupted.tmp');fs.writeFileSync(tempIndex,'uncommitted');
  assert.equal((await api('/api/templates',{name:'Other',draftId:id})).status,201);
  for (const path of [...garbage,tempIndex]) assert.equal(fs.existsSync(path),false,`unreferenced artifact was not cleaned: ${path}`);
  const loaded=await api(`/api/templates/${saved.template.id}/drafts`,{});
  assert.equal(loaded.status,201);
  const store=JSON.parse(fs.readFileSync(join(root,'templates/saved-templates.v1.json')));
  for(const template of store.templates)for(const asset of Object.values(template.snapshot.localAssets))assert.deepEqual(fs.readFileSync(resolve(workspaceRoot,asset.path)),Buffer.from(png,'base64'));
});

test('failed deletion preserves the template, while committed deletion tolerates cleanup failure',async t=>{
  const {root,api,id}=await setup(t);
  const saved=await api('/api/templates',{name:'Saved',draftId:id});
  const storePath=join(root,'templates/saved-templates.v1.json');
  let restore=failFs(t,'renameSync',(_,target)=>target===storePath);
  assert.equal((await api(`/api/templates/${saved.template.id}`,undefined,'DELETE')).status,400);
  restore();
  assert.equal((await api(`/api/templates/${saved.template.id}/drafts`,{})).status,201);
  restore=failFs(t,'rmSync',path=>String(path).includes('/assets/'));
  assert.equal((await api(`/api/templates/${saved.template.id}`,undefined,'DELETE')).status,200);
  restore();
  assert.equal((await api('/api/templates')).templates.length,0);
});

test('streamed PATCH preserves a concurrent reorder and the invalidated confirmation', async t=>{
  const {base,api,path,hero}=await setup(t);
  const added=await api(path+'/components',{componentKey:'footer.warm'});
  for(const c of added.draft.components)await api(`${path}/components/${c.instanceId}/confirm`,{});
  const slow=await slowPatch(base,`${path}/components/${hero.instanceId}`,{content:{'hero.title':'AFTER REORDER'}});
  assert.equal((await api(path+'/reorder',{fromIndex:0,toIndex:1})).status,200);
  assert.equal((await slow.finish()).status,200);
  const final=(await api(path)).draft;
  assert.deepEqual(final.components.map(c=>c.componentKey),['footer.warm','hero.minimalTitleCta']);
  assert.equal(final.confirmed,false);
  assert.equal(final.components[1].content['hero.title'],'AFTER REORDER');
});

test('invalid request and missing component do not poison subsequent queued operations',async t=>{
  const {api,path,hero}=await setup(t);
  const responses=await Promise.all([
    api(`${path}/components/${hero.instanceId}`,{content:{invalid:'invalid'}},'PATCH'),
    api(`${path}/components/${hero.instanceId}`,{content:{'hero.title':'VALID'}},'PATCH')
  ]);
  assert.deepEqual(responses.map(r=>r.status),[400,200]);
  assert.equal((await api(path)).draft.components[0].content['hero.title'],'VALID');
});

test('streamed component addition keeps a concurrent addition instead of overwriting it',async t=>{
  const {base,api,path}=await setup(t);
  let send;
  const pending=new Promise((done,reject)=>{
    send=httpRequest(base+path+'/components',{method:'POST',headers:{'content-type':'application/json'}},response=>{
      let data='';response.on('data',chunk=>data+=chunk);response.on('end',()=>done({status:response.statusCode,...JSON.parse(data)}));
    });send.on('error',reject);
  });
  send.write('{');await new Promise(r=>setTimeout(r,40));
  assert.equal((await api(path+'/components',{componentKey:'footer.warm'})).status,200);
  send.end('"componentKey":"footer.warm"}');
  assert.equal((await pending).status,200);
  const final=(await api(path)).draft;
  assert.equal(final.components.length,3);
  assert.equal(new Set(final.components.map(c=>c.instanceId)).size,3);
});

test('streamed PATCH preserves a concurrently attached local image',async t=>{
  const {base,api,path,hero}=await setup(t);
  const slow=await slowPatch(base,`${path}/components/${hero.instanceId}`,{content:{'hero.title':'WITH IMAGE'}});
  const uploaded=await api(`${path}/components/${hero.instanceId}/upload-image`,{fieldKey:'hero.image.url',dataUrl:`data:image/png;base64,${png}`});
  assert.equal(uploaded.status,200);
  assert.equal((await slow.finish()).status,200);
  const final=(await api(path)).draft;
  assert.equal(final.components[0].content['hero.title'],'WITH IMAGE');
  assert.equal(final.components[0].content['hero.image.url'],uploaded.draft.components[0].content['hero.image.url']);
  assert.match(final.components[0].content['hero.image.url'],/^asset:\/\//);
});

for (const action of ['save', 'load', 'delete']) test(`template ${action} keeps its result when lock directory cleanup fails`, async t => {
  const { root, api, id } = await setup(t);
  const original = await api('/api/templates', { name: 'Before', draftId: id });
  const restore = failFs(t, 'rmSync', path => String(path).includes('.templates.lock') || String(path).includes('.templates-released-'));
  const result = action === 'save'
    ? await api('/api/templates', { name: 'After', draftId: id })
    : await api(`/api/templates/${original.template.id}${action === 'load' ? '/drafts' : ''}`, action === 'load' ? {} : undefined, action === 'load' ? 'POST' : 'DELETE');
  restore();
  assert.equal(result.status, action === 'delete' ? 200 : 201, result.error);
  assert.equal((await api('/api/templates', { name: 'Retry', draftId: id })).status, 201);
  assert.equal(fs.existsSync(join(root, 'templates/.templates.lock')), false);
});

test('persistent lock release failure reports a committed save with warning and later recovers its own lock', async t => {
  const { root, api, id } = await setup(t);
  const restoreRm = failFs(t, 'rmSync', path => String(path).includes('.templates.lock'));
  const restoreRename = failFs(t, 'renameSync', path => String(path).endsWith('/.templates.lock'));
  const result = await api('/api/templates', { name: 'Committed despite release error', draftId: id });
  restoreRename(); restoreRm();
  assert.equal(result.status, 201, result.error);
  assert.ok(result.warnings?.some(w => w.code === 'template-lock-release-pending'));
  assert.equal(fs.existsSync(join(root, 'templates/.templates.lock')), true);
  assert.equal((await api('/api/templates')).templates[0].name, 'Committed despite release error');
  assert.equal((await api(`/api/templates/${result.template.id}/drafts`, {})).status, 201);
  assert.equal(fs.existsSync(join(root, 'templates/.templates.lock')), false);
});

test('template save retries after lock identity lookup fails without publishing a template', async t => {
  const { root, api, id } = await setup(t);
  const lock = join(root, 'templates/.templates.lock');
  const restore = failFs(t, 'lstatSync', path => path === lock);
  const failed = await api('/api/templates', { name: 'Retry after identity failure', draftId: id });
  restore();
  assert.equal(failed.status, 400);
  assert.match(failed.error, /injected filesystem failure/);
  assert.equal(fs.existsSync(lock), false);
  assert.deepEqual((await api('/api/templates')).templates, []);
  const saved = await api('/api/templates', { name: 'Retry after identity failure', draftId: id });
  assert.equal(saved.status, 201, saved.error);
  assert.equal((await api('/api/templates')).templates.length, 1);
  assert.equal((await api(`/api/templates/${saved.template.id}/drafts`, {})).status, 201);
});
