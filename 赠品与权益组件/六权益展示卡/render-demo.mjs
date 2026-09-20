import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../..');
const fixture = JSON.parse(readFileSync(resolve(directory, 'content.fixture.v1.json')));
const settings = JSON.parse(readFileSync(resolve(directory, 'settings.defaults.v1.json')));
const build = resolve(root, 'build/benefits-showcase-6-card');
const outputArgumentIndex = process.argv.indexOf('--output');
const previewOutput = outputArgumentIndex >= 0 && process.argv[outputArgumentIndex + 1]
  ? resolve(process.argv[outputArgumentIndex + 1])
  : resolve(directory, '效果演示.html');
mkdirSync(build, { recursive: true });
const composition = {
  schemaVersion: 1,
  canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
  output: resolve(build, 'email.html'),
  previewOutput,
  assets: Object.fromEntries(Object.entries(fixture.localReferenceAssets).map(([key, file]) => [key, { path: resolve(directory, file), name: basename(file) }])),
  components: [{ name: '六权益展示卡', directory, componentKey: fixture.componentKey, content: fixture.values, settings: settings.values }]
};
const input = resolve(build, 'composition.json');
writeFileSync(input, JSON.stringify(composition, null, 2));
const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input, '--preview-local-assets'], { cwd: root, encoding: 'utf8' });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
