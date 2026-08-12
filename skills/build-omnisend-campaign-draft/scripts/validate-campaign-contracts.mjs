import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const skillDirectory = resolve(scriptDirectory, '..');
const workspaceDirectory = resolve(skillDirectory, '../..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv) {
  const options = {
    structure: resolve(skillDirectory, 'references/campaign-structure.v1.json'),
    interactions: resolve(skillDirectory, 'references/campaign-component-interactions.v1.json'),
    registry: resolve(workspaceDirectory, '组件清单.json')
  };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--structure', '--interactions', '--registry'].includes(option) || !argv[index + 1]) {
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
  requireExactKeys(structure, ['schemaVersion', 'slots'], 'campaign structure');
  if (structure.schemaVersion !== 1) throw new Error('campaign structure schemaVersion must be 1');
  if (!Array.isArray(structure.slots) || structure.slots.length === 0) throw new Error('campaign structure slots must be a non-empty array');
  const terminalSlots = [];
  const seenIds = new Set();
  const expectedOrders = [];
  for (const slot of structure.slots) {
    const allowed = ['id', 'label', 'order', 'required', 'candidateComponentKeys', 'terminal'];
    requireExactKeys(slot, slot.terminal === undefined ? allowed.filter((key) => key !== 'terminal') : allowed, `slot ${slot.id ?? '<unknown>'}`);
    if (typeof slot.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(slot.id)) throw new Error('slot id is invalid');
    if (seenIds.has(slot.id)) throw new Error(`duplicate slot id: ${slot.id}`);
    seenIds.add(slot.id);
    if (typeof slot.label !== 'string' || !slot.label) throw new Error(`slot ${slot.id} label is required`);
    if (!Number.isInteger(slot.order) || slot.order <= 0) throw new Error(`slot ${slot.id} order must be a positive integer`);
    expectedOrders.push(slot.order);
    if (slot.required !== true) throw new Error(`slot ${slot.id} must be required`);
    if (!Array.isArray(slot.candidateComponentKeys) || slot.candidateComponentKeys.length === 0) throw new Error(`slot ${slot.id} must have candidates`);
    if (new Set(slot.candidateComponentKeys).size !== slot.candidateComponentKeys.length) throw new Error(`slot ${slot.id} has duplicate candidates`);
    if (slot.candidateComponentKeys.some((key) => typeof key !== 'string' || !key)) throw new Error(`slot ${slot.id} has invalid candidate`);
    if (slot.terminal === true) terminalSlots.push(slot);
    if (slot.terminal !== undefined && slot.terminal !== true) throw new Error(`slot ${slot.id} terminal must be true when present`);
  }
  expectedOrders.sort((left, right) => left - right);
  if (expectedOrders.some((value, index) => value !== index + 1)) throw new Error('campaign structure orders must be contiguous from 1');
  if (terminalSlots.length !== 1 || terminalSlots[0].id !== 'footer' || terminalSlots[0].candidateComponentKeys.length !== 1 || terminalSlots[0].candidateComponentKeys[0] !== 'footer.warm' || terminalSlots[0].order !== structure.slots.length) {
    throw new Error('footer.warm must be the only terminal slot');
  }
}

function validateInteractions(index) {
  requireExactKeys(index, ['schemaVersion', 'interactions'], 'campaign interaction index');
  if (index.schemaVersion !== 1) throw new Error('campaign interaction index schemaVersion must be 1');
  if (!Array.isArray(index.interactions)) throw new Error('campaign interaction index interactions must be an array');
  const byComponentKey = new Map();
  for (const interaction of index.interactions) {
    requireExactKeys(interaction, ['componentKey', 'interactionReference', 'allowedSources', 'requiredStages', 'completion'], `interaction ${interaction.componentKey ?? '<unknown>'}`);
    if (typeof interaction.componentKey !== 'string' || !interaction.componentKey) throw new Error('interaction componentKey is required');
    if (byComponentKey.has(interaction.componentKey)) throw new Error(`duplicate interaction componentKey: ${interaction.componentKey}`);
    if (typeof interaction.interactionReference !== 'string' || !interaction.interactionReference) throw new Error(`interaction ${interaction.componentKey} reference is required`);
    for (const key of ['allowedSources', 'requiredStages']) {
      if (!Array.isArray(interaction[key]) || interaction[key].length === 0 || interaction[key].some((value) => typeof value !== 'string' || !value)) {
        throw new Error(`interaction ${interaction.componentKey} ${key} must be a non-empty string array`);
      }
    }
    requireExactKeys(interaction.completion, ['card', 'previews'], `interaction ${interaction.componentKey} completion`);
    if (interaction.completion.card !== true) throw new Error(`interaction ${interaction.componentKey} completion card must be true`);
    if (!Array.isArray(interaction.completion.previews) || interaction.completion.previews.join(',') !== 'desktop,mobile') throw new Error(`interaction ${interaction.componentKey} completion previews must be desktop,mobile`);
    byComponentKey.set(interaction.componentKey, interaction);
  }
  return byComponentKey;
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
    if (contentSchema.componentKey !== componentKey) {
      throw new Error(`${componentKey} content Schema componentKey is ${contentSchema.componentKey ?? '<missing>'}`);
    }
    if (settingsSchema.componentKey !== componentKey) {
      throw new Error(`${componentKey} settings Schema componentKey is ${settingsSchema.componentKey ?? '<missing>'}`);
    }
    registered.set(componentKey, entry);
  }
  return registered;
}

function validateCandidates(structure, interactions, registry, registryPath) {
  const registered = validateRegistry(registry, registryPath);
  for (const slot of structure.slots) {
    for (const componentKey of slot.candidateComponentKeys) {
      if (!registered.has(componentKey)) throw new Error(`slot ${slot.id} references unregistered component: ${componentKey}`);
      if (!interactions.has(componentKey)) throw new Error(`slot ${slot.id} component is preparing: ${componentKey}`);
    }
  }
}

const options = parseArgs(process.argv.slice(2));
const structure = readJson(options.structure);
const interactions = readJson(options.interactions);
const registry = readJson(options.registry);
validateStructure(structure);
validateCandidates(structure, validateInteractions(interactions), registry, options.registry);
console.log(JSON.stringify({ status: 'valid', slots: structure.slots.map(({ id, candidateComponentKeys }) => ({ id, candidateComponentKeys })) }, null, 2));
