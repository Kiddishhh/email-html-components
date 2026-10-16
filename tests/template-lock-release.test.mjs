import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withTemplateStoreLock } from '../skills/build-omnisend-campaign-draft/editor/template-store-lock.mjs';
function setup(t) {
  const root = fs.mkdtempSync(join(tmpdir(), 'template-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, lock: join(root, '.templates.lock') };
}
function fault(t, method, predicate) {
  const original = fs[method];
  const mocked = t.mock.method(fs, method, (...args) => {
    if (predicate(...args)) throw Object.assign(Error('release EIO'), { code: 'EIO' });
    return original(...args);
  });
  syncBuiltinESMExports();
  const restore = () => { mocked.mock.restore(); syncBuiltinESMExports(); };
  t.after(restore);
  return restore;
}
test('release failure does not mask the protected operation error', async t => {
  const { root, lock } = setup(t);
  const undoRename = fault(t, 'renameSync', path => path === lock);
  const undoRm = fault(t, 'rmSync', path => path === lock);
  const original = Error('original operation failure');
  const warnings = [];
  await assert.rejects(withTemplateStoreLock(root, () => { throw original; }, { onReleaseWarning: w => warnings.push(w) }), e => e === original);
  undoRename(); undoRm();
  assert.equal(warnings[0].code, 'template-lock-release-pending');
  assert.equal(await withTemplateStoreLock(root, () => 'recovered'), 'recovered');
});
test('transient release failures retry without repeating the operation', async t => {
  const { root, lock } = setup(t);
  let failures = 0, operations = 0;
  const undoRename = fault(t, 'renameSync', path => path === lock && failures++ < 2);
  const undoRm = fault(t, 'rmSync', path => path === lock);
  const warnings = [];
  const result = await withTemplateStoreLock(root, () => { operations++; return 'committed'; }, { onReleaseWarning: w => warnings.push(w) });
  undoRename(); undoRm();
  assert.equal(result, 'committed'); assert.equal(operations, 1); assert.deepEqual(warnings, []);
  assert.equal(fs.existsSync(lock), false);
});
test('a pending release never removes a replacement lock belonging to another owner', async t => {
  const { root, lock } = setup(t);
  const undoRename = fault(t, 'renameSync', path => path === lock);
  const undoRm = fault(t, 'rmSync', path => path === lock);
  await withTemplateStoreLock(root, () => 'committed');
  undoRename(); undoRm();
  fs.renameSync(lock, join(root, 'original-owner'));
  fs.mkdirSync(lock); fs.writeFileSync(join(lock, 'owner.json'), '{"pid":"other-owner"}');
  let ran = false;
  const next = withTemplateStoreLock(root, () => { ran = true; return 'next'; });
  await new Promise(r => setTimeout(r, 40));
  assert.equal(ran, false);
  assert.equal(fs.readFileSync(join(lock, 'owner.json'), 'utf8'), '{"pid":"other-owner"}');
  fs.rmSync(lock, { recursive: true });
  assert.equal(await next, 'next');
});
test('failure to write lock metadata leaves no blocked lock', async t => {
  const { root, lock } = setup(t);
  const undo = fault(t, 'writeFileSync', path => path === join(lock, 'owner.json'));
  let ran = false;
  await assert.rejects(withTemplateStoreLock(root, () => { ran = true; }), /release EIO/);
  undo();
  assert.equal(ran, false); assert.equal(fs.existsSync(lock), false);
  assert.equal(await withTemplateStoreLock(root, () => 'next'), 'next');
});

for (const persistent of [false, true]) test(`${persistent ? 'persistent' : 'one-time'} lock identity read failure leaves the next operation recoverable`, async t => {
  const { root, lock } = setup(t);
  let failures = 0, ran = false;
  const undo = fault(t, 'lstatSync', path => path === lock && (persistent || failures++ === 0));
  await assert.rejects(withTemplateStoreLock(root, () => { ran = true; }), /release EIO/);
  undo();
  assert.equal(ran, false);
  assert.equal(fs.existsSync(lock), false, 'failed acquisition must remove its empty lock');
  assert.equal(await withTemplateStoreLock(root, () => 'recovered'), 'recovered');
});

test('unidentified lock cleanup never recursively deletes unexpected contents', async t => {
  const { root, lock } = setup(t);
  const undo = fault(t, 'lstatSync', path => {
    if (path !== lock) return false;
    fs.writeFileSync(join(lock, 'unexpected-owner'), 'preserve');
    return true;
  });
  let ran = false;
  await assert.rejects(withTemplateStoreLock(root, () => { ran = true; }), error => {
    assert.equal(error.code, 'EIO');
    assert.match(error.message, /release EIO.*cleanup failed.*stop all editors/);
    return true;
  });
  undo();
  assert.equal(ran, false);
  assert.equal(fs.readFileSync(join(lock, 'unexpected-owner'), 'utf8'), 'preserve');
});
