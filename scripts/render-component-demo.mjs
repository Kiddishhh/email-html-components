import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 生成某个组件的 `效果演示.html`。
 *
 * 组件目录下的 `render-demo.mjs` 只声明差异项，拼接 composition、写盘和调用构建器
 * 都集中在这里，避免 19 份同构脚本各自漂移。是否带素材、是否传
 * `--preview-local-assets` 由 fixture 的 `localReferenceAssets` 自动决定：
 * 本地素材是预览输入，没有本地素材的组件不该拿到该开关。
 *
 * 所有组件都接受 `--output <path>` 覆盖演示输出路径（测试用它写到临时目录再比对）。
 *
 * @param {object} options
 * @param {string} options.directory 组件目录，调用方用 `dirname(fileURLToPath(import.meta.url))` 传入。
 * @param {string} options.buildSlug `build/` 下的中间产物目录名，每个组件唯一。
 * @param {string} options.componentName 组件中文名，写入 composition 的 `components[0].name`。
 * @param {string} [options.backgroundColor] 画布底色字面量，默认 `#FFFFFF`。
 * @param {string} [options.backgroundColorSetting] `settings.defaults.v1.json` 中的颜色键；设置后优先于 `backgroundColor`。
 */
export function renderComponentDemo({
  directory,
  buildSlug,
  componentName,
  backgroundColor = '#FFFFFF',
  backgroundColorSetting
}) {
  const fixture = JSON.parse(readFileSync(resolve(directory, 'content.fixture.v1.json'), 'utf8'));
  const settings = JSON.parse(readFileSync(resolve(directory, 'settings.defaults.v1.json'), 'utf8'));
  const outputArgumentIndex = process.argv.indexOf('--output');
  if (outputArgumentIndex !== -1 && !process.argv[outputArgumentIndex + 1]) throw new Error('--output requires a file path');
  const previewOutput = outputArgumentIndex === -1
    ? resolve(directory, '效果演示.html')
    : resolve(process.argv[outputArgumentIndex + 1]);
  const canvasColor = backgroundColorSetting ? settings.values[backgroundColorSetting] : backgroundColor;
  const assetFiles = Object.entries(fixture.localReferenceAssets ?? {});
  const build = resolve(root, `build/${buildSlug}`);
  mkdirSync(build, { recursive: true });
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: canvasColor,
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: resolve(build, 'email.html'),
    previewOutput,
    ...(assetFiles.length === 0 ? {} : {
      assets: Object.fromEntries(assetFiles.map(([key, file]) => [key, { path: resolve(directory, file), name: basename(file) }]))
    }),
    components: [{
      name: componentName,
      directory,
      componentKey: fixture.componentKey,
      content: fixture.values,
      settings: settings.values
    }]
  };
  const input = resolve(build, 'composition.json');
  writeFileSync(input, JSON.stringify(composition, null, 2));
  const args = [resolve(root, 'build-email-template.v1.mjs'), input];
  if (assetFiles.length > 0) args.push('--preview-local-assets');
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
