import { mkdirSync, rmSync, rmdirSync, writeFileSync, lstatSync, readdirSync, renameSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Only this process's completed operations may retry releasing their own lock.
// Never reclaim another process's lock based on its age or a timeout.
const pendingReleases = new Map();
function sameDirectory(path, identity) {
  try {
    const current = lstatSync(path);
    return current.dev === identity.dev && current.ino === identity.ino && current.birthtimeMs === identity.birthtimeMs;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
function cleanReleasedLocks(templateRoot) {
  try {
    for (const name of readdirSync(templateRoot)) {
      if (!/^\.templates-released-[0-9a-f-]+$/u.test(name)) continue;
      try { rmSync(resolve(templateRoot, name), { recursive: true, force: true }); } catch { /* retry next time */ }
    }
  } catch { /* unrelated garbage must not change an operation's result */ }
}
async function releaseLock(lockPath, identity) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!sameDirectory(lockPath, identity)) { pendingReleases.delete(lockPath); return true; }
      // Free the canonical lock name atomically before best-effort file cleanup.
      const releasedPath = resolve(lockPath, '..', `.templates-released-${randomUUID()}`);
      try {
        renameSync(lockPath, releasedPath);
        pendingReleases.delete(lockPath);
        try { rmSync(releasedPath, { recursive: true, force: true }); } catch { /* retry next time */ }
        return true;
      } catch {
        // Some filesystems may refuse directory rename but permit removal.
        if (sameDirectory(lockPath, identity)) rmSync(lockPath, { recursive: true, force: true });
        pendingReleases.delete(lockPath);
        return true;
      }
    } catch { /* bounded retry, without repeating the protected operation */ }
    if (attempt < 2) await delay(25);
  }
  pendingReleases.set(lockPath, identity);
  return false;
}

export async function withTemplateStoreLock(templateRoot, operation, { onReleaseWarning = () => {} } = {}) {
  mkdirSync(templateRoot, { recursive: true });
  const lockPath = resolve(templateRoot, '.templates.lock');
  const pending = pendingReleases.get(lockPath);
  if (pending) await releaseLock(lockPath, pending);
  cleanReleasedLocks(templateRoot);
  const deadline = Date.now() + 5000;
  let identity;
  for (;;) {
    try {
      mkdirSync(lockPath);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error('template store is busy; retry after the other editor finishes (if an editor crashed, stop all editors before removing .templates.lock)');
      await delay(25);
    }
  }
  try {
    identity = lstatSync(lockPath);
  } catch (error) {
    // Acquisition has not written metadata or run the operation, and there is
    // no async gap after mkdir. Remove only our newly created empty directory;
    // without identity evidence, never recursively remove unknown contents.
    try { rmdirSync(lockPath); } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') error.message += '; empty lock cleanup failed; stop all editors before removing .templates.lock';
    }
    throw error;
  }
  try {
    writeFileSync(resolve(lockPath, 'owner.json'), JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    return await operation();
  } finally {
    if (!await releaseLock(lockPath, identity)) onReleaseWarning({
      code: 'template-lock-release-pending',
      message: '模板操作结果已保留，但锁暂未释放。请稍后在当前编辑器重试；若持续提示忙，请先停止全部编辑器，再按恢复说明清理残留锁。'
    });
  }
}
