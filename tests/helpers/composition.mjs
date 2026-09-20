import { writeFileSync } from 'node:fs';

/** 构建器只关心画布底色，其余四项在所有测试里都是常量。 */
const CANVAS_DEFAULTS = {
  outerBackgroundColor: '#FFFFFF',
  contentWidth: 600,
  mobileTargetWidth: 375,
  verticalPadding: 0
};

export function canvas(backgroundColor = '#FBFAF8') {
  return { backgroundColor, ...CANVAS_DEFAULTS };
}

/**
 * 写一份 composition 到 `/private/tmp/<name>.composition.json`，返回四条常用路径。
 *
 * 每个测试文件原本各写一份同构工厂（画布常量、输出路径命名、mutate 钩子、写盘格式
 * 完全一致，只有底色、素材表和组件条目不同），集中到这里避免各自漂移。
 *
 * @param {object} options
 * @param {string} options.name 同时决定三个输出文件名，需在同一测试内唯一。
 * @param {string} [options.backgroundColor] 画布底色，默认 `#FBFAF8`。
 * @param {object} [options.assets] 素材表；省略时不写 `assets` 键。
 * @param {object} options.component 写入 `components[0]` 的组件条目。
 * @param {(composition: object) => void} [options.mutate] 写盘前修改 composition 的钩子。
 * @returns {{ composition: object, path: string, output: string, previewOutput: string }}
 */
export function writeComposition({ name, backgroundColor = '#FBFAF8', assets, component, mutate = () => {} }) {
  const output = `/private/tmp/${name}.html`;
  const previewOutput = `/private/tmp/${name}.local-preview.html`;
  const composition = {
    schemaVersion: 1,
    canvas: canvas(backgroundColor),
    output,
    previewOutput,
    ...(assets === undefined ? {} : { assets }),
    components: [component]
  };
  mutate(composition);
  const path = `/private/tmp/${name}.composition.json`;
  writeFileSync(path, JSON.stringify(composition, null, 2));
  return { composition, path, output, previewOutput };
}
