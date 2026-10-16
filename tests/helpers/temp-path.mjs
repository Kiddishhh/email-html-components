import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = mkdtempSync(join(tmpdir(), 'email-tests-'));
process.once('exit', () => rmSync(root, { recursive: true, force: true }));
export function tempPath(name) { return join(root, name); }
