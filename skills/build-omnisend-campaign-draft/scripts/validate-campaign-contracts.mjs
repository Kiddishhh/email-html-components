import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editableComponentKeys, editableFieldKeys } from '../editor/public/editor-ui-contract.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const skillDirectory = resolve(scriptDirectory, '..');
const workspaceDirectory = resolve(skillDirectory, '../..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv) {
  const options = {
    structure: resolve(skillDirectory, 'references/campaign-structure.v1.json'),
    registry: resolve(workspaceDirectory, '组件清单.json')
  };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--structure', '--registry'].includes(option) || !argv[index + 1]) {
      throw new Error(`unsupported validator option: ${option}`);
    }
    options[option.slice(2)] = resolve(argv[index + 1]);
    index += 1;
  }
  return options;
}

function requireExactKeys(value, keys, scope) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${scope} must be an object`);
  const missing = keys.filter((key) => !(key in value));
  const unknown = Object.keys(value).filter((key) => !keys.includes(key));
  if (missing.length) throw new Error(`${scope} missing keys: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`${scope} unknown keys: ${unknown.join(', ')}`);
}

function validateStructure(structure) {
  requireExactKeys(structure, ['schemaVersion', 'selection'], 'campaign structure');
  if (structure.schemaVersion !== 2) throw new Error('campaign structure schemaVersion must be 2');
  if (structure.selection !== 'user-ordered-registered-components') {
    throw new Error('campaign structure selection must be user-ordered-registered-components');
  }
}

const registryPathKeys = ['组件模板', '内容契约', '设置契约', '默认测试数据', '默认设置', '中文管理说明', '组件样式'];
const retiredPathPrefixes = ['主视觉组件/', '商品组件/', '活动与赠品组件/', '内容与权益组件/'];

function resolveRegistryFile(registryDirectory, componentKey, relativePath, label) {
  if (typeof relativePath !== 'string' || !relativePath || isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes('..')) {
    throw new Error(`${componentKey} ${label} must be a workspace-relative path`);
  }
  if (retiredPathPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
    throw new Error(`${componentKey} ${label} uses a retired component path: ${relativePath}`);
  }
  const absolutePath = resolve(registryDirectory, relativePath);
  const registryRelative = relative(registryDirectory, absolutePath);
  if (!registryRelative || registryRelative.startsWith('..') || isAbsolute(registryRelative)) {
    throw new Error(`${componentKey} ${label} must stay inside the registry workspace`);
  }
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    throw new Error(`${componentKey} is missing ${label}: ${relativePath}`);
  }
  return absolutePath;
}

function validateRegistry(registry, registryPath) {
  if (!Array.isArray(registry)) throw new Error('component registry must be an array');
  const registryDirectory = dirname(registryPath);
  const registered = new Map();
  for (const entry of registry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('component registry entry must be an object');
    const componentKey = entry.componentKey;
    if (typeof componentKey !== 'string' || !componentKey) throw new Error('component registry entry is missing componentKey');
    if (registered.has(componentKey)) throw new Error(`duplicate registry componentKey: ${componentKey}`);
    requireExactKeys(entry.路径, registryPathKeys, `${componentKey} registry paths`);
    const resolvedPaths = Object.fromEntries(registryPathKeys.map((label) => [
      label,
      resolveRegistryFile(registryDirectory, componentKey, entry.路径[label], label)
    ]));
    const componentDirectory = dirname(resolvedPaths.组件模板);
    const demoPath = resolve(componentDirectory, '效果演示.html');
    if (!existsSync(demoPath) || !statSync(demoPath).isFile()) {
      throw new Error(`${componentKey} is missing 效果演示.html`);
    }
    const contentSchema = readJson(resolvedPaths.内容契约);
    const settingsSchema = readJson(resolvedPaths.设置契约);
    const contentFixture = readJson(resolvedPaths.默认测试数据);
    const settingsDefaults = readJson(resolvedPaths.默认设置);
    if (contentSchema.componentKey !== componentKey) {
      throw new Error(`${componentKey} content Schema componentKey is ${contentSchema.componentKey ?? '<missing>'}`);
    }
    if (settingsSchema.componentKey !== componentKey) {
      throw new Error(`${componentKey} settings Schema componentKey is ${settingsSchema.componentKey ?? '<missing>'}`);
    }
    const editable = editableFieldKeys(componentKey);
    for (const [group, schema, snapshot] of [
      ['content', contentSchema, contentFixture],
      ['settings', settingsSchema, settingsDefaults]
    ]) {
      for (const key of editable[group]) {
        if (!(key in (schema.properties ?? {}))) throw new Error(`${componentKey} editor ${group} field is missing from Schema: ${key}`);
        if (!(key in (snapshot.values ?? {}))) throw new Error(`${componentKey} editor ${group} field is missing from default snapshot: ${key}`);
      }
    }
    registered.set(componentKey, entry);
  }
  return registered;
}

function validateEditorComponents(registry, registryPath) {
  const registered = validateRegistry(registry, registryPath);
  const registeredKeys = [...registered.keys()];
  const editorKeys = editableComponentKeys();
  const missingEditorContracts = registeredKeys.filter((componentKey) => !editorKeys.includes(componentKey));
  const unregisteredEditorContracts = editorKeys.filter((componentKey) => !registered.has(componentKey));
  if (missingEditorContracts.length) throw new Error(`registered components missing editor contracts: ${missingEditorContracts.join(', ')}`);
  if (unregisteredEditorContracts.length) throw new Error(`editor contracts reference unregistered components: ${unregisteredEditorContracts.join(', ')}`);
  return registeredKeys;
}

const options = parseArgs(process.argv.slice(2));
const structure = readJson(options.structure);
const registry = readJson(options.registry);
validateStructure(structure);
const components = validateEditorComponents(registry, options.registry);
console.log(JSON.stringify({
  status: 'valid',
  selection: structure.selection,
  componentCount: components.length,
  editorComponentCount: editableComponentKeys().length,
  components
}, null, 2));
