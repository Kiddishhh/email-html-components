// Avoid shell-specific glob expansion (notably Windows command shells).
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const tests = readdirSync(resolve(root, 'tests')).filter(name => name.endsWith('.test.mjs')).sort().map(name => resolve(root, 'tests', name));
const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit' });
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exitCode = result.status ?? 1;
