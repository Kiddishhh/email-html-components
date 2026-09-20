import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 仓库根目录。测试里所有路径都相对它解析。 */
export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * 组件清单.json 里的一条注册记录，找不到时返回 `undefined`。
 *
 * 这里刻意不抛错：调用方通常要 `assert.ok(entry, '... must be registered')`，
 * 让失败信息带上组件名，比 helper 里抛一个通用错误更有用。
 */
export function registeredComponent(componentKey) {
  return readJson(resolve(root, '组件清单.json')).find((item) => item.componentKey === componentKey);
}

/**
 * 注册记录 → 组件目录。
 *
 * 默认返回相对仓库根的路径，可直接写进 composition 的 `directory`；
 * 需要读文件时传 `{ absolute: true }`，省得调用方各自 `resolve`。
 */
export function componentDirectory(entry, { absolute = false } = {}) {
  const relative = entry.路径.组件模板.replace('/component.template.v1.html', '');
  return absolute ? resolve(root, relative) : relative;
}

/**
 * 组件目录下的四份契约快照。
 *
 * 键名特意与文件名一一对应，方便和 `editableFieldKeys()` 的结果逐项比对。
 *
 * @param {string} directory 相对仓库根（或绝对）的组件目录。
 */
export function componentContracts(directory) {
  const at = (file) => readJson(resolve(root, directory, file));
  return {
    contentSchema: at('content.schema.v1.json'),
    fixture: at('content.fixture.v1.json'),
    settingsSchema: at('settings.schema.v1.json'),
    settingsDefaults: at('settings.defaults.v1.json')
  };
}
