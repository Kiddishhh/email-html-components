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
  requireExactKeys(structure, ['schemaVersion', 'selection'], 'campaign structure');
  if (structure.schemaVersion !== 2) throw new Error('campaign structure schemaVersion must be 2');
  if (structure.selection !== 'user-ordered-registered-components') {
    throw new Error('campaign structure selection must be user-ordered-registered-components');
  }
}

function validateInteractions(index) {
  requireExactKeys(index, ['schemaVersion', 'interactions'], 'campaign interaction index');
  if (index.schemaVersion !== 1) throw new Error('campaign interaction index schemaVersion must be 1');
  if (!Array.isArray(index.interactions)) throw new Error('campaign interaction index interactions must be an array');
  const byComponentKey = new Map();
  for (const interaction of index.interactions) {
    const baseKeys = ['componentKey', 'interactionReference', 'allowedSources', 'requiredStages', 'completion'];
    const detailKeys = ['imageCollection', 'activityMapping', 'editing', 'colors'];
    const hasDetailedContract = detailKeys.some((key) => key in interaction);
    requireExactKeys(interaction, hasDetailedContract ? [...baseKeys, ...detailKeys] : baseKeys, `interaction ${interaction.componentKey ?? '<unknown>'}`);
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
    if (hasDetailedContract) {
      requireExactKeys(interaction.imageCollection, ['required', 'displaySize', 'recommendedSize', 'sources', 'ratioMismatch'], `interaction ${interaction.componentKey} imageCollection`);
      requireExactKeys(interaction.imageCollection.displaySize, ['width', 'height'], `interaction ${interaction.componentKey} imageCollection displaySize`);
      requireExactKeys(interaction.imageCollection.recommendedSize, ['width', 'height'], `interaction ${interaction.componentKey} imageCollection recommendedSize`);
      if (interaction.imageCollection.required !== true) throw new Error(`interaction ${interaction.componentKey} imageCollection must be required`);
      if (interaction.imageCollection.displaySize.width !== 540 || interaction.imageCollection.displaySize.height !== 540) {
        throw new Error(`interaction ${interaction.componentKey} imageCollection displaySize must be 540x540`);
      }
      if (interaction.imageCollection.recommendedSize.width !== 1200 || interaction.imageCollection.recommendedSize.height !== 1200) {
        throw new Error(`interaction ${interaction.componentKey} imageCollection recommendedSize must be 1200x1200`);
      }
      if (!Array.isArray(interaction.imageCollection.sources) || interaction.imageCollection.sources.join(',') !== 'componentDefault,localPath,publicHttps') {
        throw new Error(`interaction ${interaction.componentKey} imageCollection sources must be componentDefault,localPath,publicHttps`);
      }
      if (interaction.imageCollection.ratioMismatch !== 'centerCropDerivativeWithoutOverwrite') {
        throw new Error(`interaction ${interaction.componentKey} imageCollection ratioMismatch must preserve the source`);
      }

      requireExactKeys(interaction.activityMapping, ['slideshow-v2.subheading', 'slideshow-v2.heading', 'slideshow-v2.description', 'selectedPageUrl'], `interaction ${interaction.componentKey} activityMapping`);
      const expectedActivityMapping = {
        'slideshow-v2.subheading': 'hero.eyebrow',
        'slideshow-v2.heading': 'hero.title',
        'slideshow-v2.description': 'hero.subtitle',
        selectedPageUrl: 'hero.cta.url'
      };
      for (const [source, target] of Object.entries(expectedActivityMapping)) {
        if (interaction.activityMapping[source] !== target) throw new Error(`interaction ${interaction.componentKey} activityMapping ${source} must map to ${target}`);
      }

      requireExactKeys(interaction.editing, ['defaultFields', 'benefitCount', 'benefitOrder', 'countdownMode', 'confirmationCount'], `interaction ${interaction.componentKey} editing`);
      if (interaction.editing.defaultFields !== 'completionCardEditable' || interaction.editing.benefitCount !== 3 || interaction.editing.benefitOrder !== 'fixed' || interaction.editing.countdownMode !== 'staticEditable' || interaction.editing.confirmationCount !== 1) {
        throw new Error(`interaction ${interaction.componentKey} editing contract is invalid`);
      }

      requireExactKeys(interaction.colors, ['action', 'bodySurface', 'offerSurface', 'promotionBar'], `interaction ${interaction.componentKey} colors`);
      if (interaction.colors.action !== 'inheritGlobalOrComponentDefault' || interaction.colors.bodySurface !== 'inheritGlobalOrComponentDefault' || interaction.colors.offerSurface !== 'componentDefaultUnlessUserChanges' || interaction.colors.promotionBar !== 'componentDefaultUnlessUserChanges') {
        throw new Error(`interaction ${interaction.componentKey} colors contract is invalid`);
      }
    }
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

function validateSelectableComponents(interactions, registry, registryPath) {
  const registered = validateRegistry(registry, registryPath);
  const selectable = [];
  for (const componentKey of interactions.keys()) {
    if (!registered.has(componentKey)) throw new Error(`interaction references unregistered component: ${componentKey}`);
    selectable.push(componentKey);
  }
  if (selectable.length === 0) throw new Error('campaign structure has no registered interaction-ready components');
  return selectable;
}

const options = parseArgs(process.argv.slice(2));
const structure = readJson(options.structure);
const interactions = readJson(options.interactions);
const registry = readJson(options.registry);
validateStructure(structure);
const selectableComponents = validateSelectableComponents(validateInteractions(interactions), registry, options.registry);
console.log(JSON.stringify({ status: 'valid', selection: structure.selection, components: selectableComponents }, null, 2));
