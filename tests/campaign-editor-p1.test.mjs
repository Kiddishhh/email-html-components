import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
async function editors(t) {
  const root = mkdtempSync(join(workspaceRoot, 'build/p1-regression-'));
  const children = [];
  t.after(async () => {
    await Promise.all(children.map(async child => {
      if (child.exitCode !== null) return;
      const closed = once(child, 'exit');
      child.send('close');
      await closed;
    }));
    rmSync(root, { recursive: true, force: true });
  });
  const urls = [];
  for (let i = 0; i < 2; i++) {
    const child = fork(new URL('./helpers/editor-server-child.mjs', import.meta.url),
      [workspaceRoot, join(root, `session-${i}`), join(root, 'templates')], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    children.push(child);
    const [message] = await once(child, 'message');
    urls.push(message.url);
  }
  return { urls, root };
}
async function request(base, path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, ...await response.json() };
}
async function draft(base) {
  const created = await request(base, '/api/drafts', { name: 'P1 regression' });
  const path = `/api/drafts/${created.draft.id}`;
  await request(base, path + '/components', { componentKey: 'hero.minimalTitleCta' });
  const added = await request(base, path + '/components', { componentKey: 'footer.warm' });
  assert.equal(added.status, 200);
  return { path, draft: added.draft };
}

test('separate editor processes preserve each other’s templates and read the latest list', async t => {
  const { urls: [a, b], root } = await editors(t);
  const da = await draft(a), db = await draft(b);
  const first = await request(a, '/api/templates', { name: 'A', draftId: da.draft.id });
  const second = await request(b, '/api/templates', { name: 'B', draftId: db.draft.id });
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  const names = JSON.parse(readFileSync(join(root, 'templates/saved-templates.v1.json'), 'utf8')).templates.map(x => x.name).sort();
  assert.deepEqual(names, ['A', 'B']);
  for (const base of [a, b]) assert.deepEqual((await request(base, '/api/templates')).templates.map(x => x.name), ['A', 'B']);
  assert.equal((await request(b, `/api/templates/${first.template.id}/drafts`, {})).status, 201);
  assert.equal((await request(b, `/api/templates/${first.template.id}`, undefined, 'DELETE')).status, 200);
  await request(a, '/api/templates', { name: 'C', draftId: da.draft.id });
  for (const base of [a, b]) assert.deepEqual((await request(base, '/api/templates')).templates.map(x => x.name), ['B', 'C']);
  assert.equal((await request(a, `/api/templates/${first.template.id}/drafts`, {})).status, 404);
});

test('simultaneous saves from separate processes retain both templates and enforce name conflicts', async t => {
  const { urls: [a, b] } = await editors(t);
  const da = await draft(a), db = await draft(b);
  const results = await Promise.all([
    request(a, '/api/templates', { name: 'A', draftId: da.draft.id }),
    request(b, '/api/templates', { name: 'B', draftId: db.draft.id })
  ]);
  assert.deepEqual(results.map(x => x.status), [201, 201]);
  assert.deepEqual((await request(a, '/api/templates')).templates.map(x => x.name), ['A', 'B']);
  const same = await Promise.all([
    request(a, '/api/templates', { name: 'Shared', draftId: da.draft.id }),
    request(b, '/api/templates', { name: 'Shared', draftId: db.draft.id })
  ]);
  assert.deepEqual(same.map(x => x.status).sort(), [201, 409]);
  const saved = same.find(x => x.status === 201).template;
  const overwritten = await request(b, '/api/templates', { name: 'Shared', draftId: db.draft.id, overwrite: true });
  assert.equal(overwritten.status, 200); assert.equal(overwritten.template.id, saved.id);
  assert.deepEqual((await request(a, '/api/templates')).templates.map(x => x.name), ['A', 'B', 'Shared']);
});

test('a busy template store refuses writes without stealing its lock and can be retried', async t => {
  const { urls: [a, b], root } = await editors(t);
  const { draft: current } = await draft(a);
  const lockPath = join(root, 'templates/.templates.lock');
  mkdirSync(lockPath, { recursive: true });
  const blocked = await request(a, '/api/templates', { name: 'Blocked', draftId: current.id });
  assert.equal(blocked.status, 400);
  assert.match(blocked.error, /template store is busy/);
  assert.equal(existsSync(lockPath), true, 'a waiting process must not remove another owner’s lock');
  assert.equal(existsSync(join(root, 'templates/saved-templates.v1.json')), false);
  rmSync(lockPath, { recursive: true });
  assert.equal((await request(a, '/api/templates', { name: '', draftId: current.id })).status, 400);
  assert.equal(existsSync(lockPath), false, 'failed operations must release their own lock');
  assert.equal((await request(a, '/api/templates', { name: 'Retried', draftId: current.id })).status, 201);
  assert.deepEqual((await request(b, '/api/templates')).templates.map(x => x.name), ['Retried']);
});

test('another process loads the latest template content and its own image copy survives template deletion', async t => {
  const { urls: [a, b], root } = await editors(t);
  const { path, draft: current } = await draft(a);
  const hero = current.components[0];
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg==';
  assert.equal((await request(a, `${path}/components/${hero.instanceId}/upload-image`, {
    fieldKey: 'hero.image.url', dataUrl: `data:image/png;base64,${png}`
  })).status, 200);
  const saved = await request(a, '/api/templates', { name: 'Image template', draftId: current.id });
  await request(a, `${path}/components/${hero.instanceId}`, { content: { 'hero.title': 'UPDATED TITLE' } }, 'PATCH');
  assert.equal((await request(a, '/api/templates', { name: 'Image template', draftId: current.id, overwrite: true })).status, 200);
  const loaded = await request(b, `/api/templates/${saved.template.id}/drafts`, {});
  assert.equal(loaded.status, 201);
  assert.equal(loaded.draft.components[0].content['hero.title'], 'UPDATED TITLE');
  const assetId = loaded.draft.components[0].content['hero.image.url'].slice('asset://'.length);
  const store = JSON.parse(readFileSync(join(root, 'templates/saved-templates.v1.json'), 'utf8'));
  const savedImage = resolve(workspaceRoot, store.templates[0].snapshot.localAssets[assetId].path);
  assert.equal(existsSync(savedImage), true);
  assert.equal((await request(a, `/api/templates/${saved.template.id}`, undefined, 'DELETE')).status, 200);
  assert.equal(existsSync(savedImage), false);
  const preview = await request(b, `/api/drafts/${loaded.draft.id}/preview`, {});
  assert.equal(preview.status, 200);
  const rendered = await (await fetch(b + preview.previewUrl)).text();
  const imageSource = [...rendered.matchAll(/<img[^>]+src="([^"]+)"/giu)].map(m => m[1]).find(src => src.includes(assetId));
  assert.ok(imageSource);
  const imageResponse = await fetch(new URL(imageSource, b + preview.previewUrl));
  assert.equal(imageResponse.status, 200);
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), Buffer.from(png, 'base64'));
});

for (const action of ['reorder', 'delete']) {
  test(`${action} after confirmation reopens confirmation and allows preparing the changed email`, async t => {
    const { urls: [base] } = await editors(t);
    const { path, draft: initial } = await draft(base);
    for (const c of initial.components) await request(base, `${path}/components/${c.instanceId}/confirm`, {});
    const changed = action === 'reorder'
      ? await request(base, path + '/reorder', { fromIndex: 0, toIndex: 1 })
      : await request(base, `${path}/components/${initial.components[0].instanceId}`, undefined, 'DELETE');
    assert.equal(changed.status, 200);
    assert.equal(changed.draft.confirmed, false);
    assert.ok(changed.draft.components.every(c => c.confirmed === false), 'remaining components must offer confirmation again');
    const metadata = { campaign: { name: 'P1', subject: 'P1', preheader: '' } };
    assert.equal((await request(base, path + '/prepare-omnisend-draft', metadata)).status, 400);
    let confirmed;
    for (const c of changed.draft.components) confirmed = await request(base, `${path}/components/${c.instanceId}/confirm`, {});
    assert.equal(confirmed.draft.confirmed, true);
    assert.equal((await request(base, path + '/prepare-omnisend-draft', metadata)).status, 200);
    if (action === 'delete') {
      const emptied = await request(base, `${path}/components/${changed.draft.components[0].instanceId}`, undefined, 'DELETE');
      assert.equal(emptied.draft.confirmed, false);
      assert.equal((await request(base, path + '/prepare-omnisend-draft', metadata)).status, 400);
    }
  });
}


test('legacy image templates can be reused and overwritten repeatedly without filename growth', async t => {
  const { urls: [base], root } = await editors(t);
  const { path, draft: initial } = await draft(base);
  const hero = initial.components[0];
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLz8QAAAABJRU5ErkJggg==', 'base64');
  await request(base, `${path}/components/${hero.instanceId}/upload-image`, {fieldKey:'hero.image.url',dataUrl:`data:image/png;base64,${bytes.toString('base64')}`});
  const saved = await request(base, '/api/templates', {name:'Reusable image',draftId:initial.id});
  const storePath = join(root,'templates/saved-templates.v1.json');
  const store = JSON.parse(readFileSync(storePath,'utf8'));
  const [assetId, asset] = Object.entries(store.templates[0].snapshot.localAssets)[0];
  // A real older template with repeated prefixes must load without a manual migration.
  const source = resolve(workspaceRoot,asset.path);
  const legacyName = `${assetId}-${assetId}-${asset.name}`;
  const legacyPath = join(dirname(source),legacyName);
  copyFileSync(source,legacyPath);asset.path=legacyPath;asset.name=legacyName;
  writeFileSync(storePath,JSON.stringify(store));
  let previousName;
  for(let i=0;i<8;i++) {
    const loaded=await request(base,`/api/templates/${saved.template.id}/drafts`,{});
    assert.equal(loaded.status,201,loaded.error);
    assert.equal(loaded.draft.components[0].content['hero.image.url'],`asset://${assetId}`);
    const overwritten=await request(base,'/api/templates',{name:'Reusable image',draftId:loaded.draft.id,overwrite:true});
    assert.equal(overwritten.status,200,overwritten.error);
    const current=JSON.parse(readFileSync(storePath,'utf8')).templates[0].snapshot.localAssets[assetId];
    if(previousName)assert.equal(current.name,previousName,'copy filename must be stable across generations');
    previousName=current.name;
    assert.deepEqual(readFileSync(resolve(workspaceRoot,current.path)),bytes,'image bytes must remain unchanged');
    assert.equal(current.name,`${assetId}.png`);
  }
});
