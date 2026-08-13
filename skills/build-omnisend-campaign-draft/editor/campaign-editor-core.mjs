import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function componentDirectory(workspaceRoot, entry) {
  return dirname(resolve(workspaceRoot, entry.路径.组件模板));
}

function componentRole(category) {
  const roleByCategory = {
    '头图': 'hero',
    '活动商品组件': 'product',
    '评论组件': 'review',
    '赠品与权益组件': 'benefit',
    '地址组件': 'location',
    '页脚组件': 'footer'
  };
  return roleByCategory[category] ?? 'other';
}

export function buildEditorCatalog({ workspaceRoot }) {
  const registry = readJson(resolve(workspaceRoot, '组件清单.json'));
  return registry.map((entry) => {
    const directory = componentDirectory(workspaceRoot, entry);
    const defaultContent = readJson(resolve(workspaceRoot, entry.路径.默认测试数据));
    const defaultSettings = readJson(resolve(workspaceRoot, entry.路径.默认设置));
    const contentSchema = readJson(resolve(workspaceRoot, entry.路径.内容契约));
    const settingsSchema = readJson(resolve(workspaceRoot, entry.路径.设置契约));
    const demoPath = resolve(directory, '效果演示.html');
    if (!existsSync(demoPath)) throw new Error(`${entry.componentKey}: missing 效果演示.html`);
    if (defaultContent.componentKey !== entry.componentKey || defaultSettings.componentKey !== entry.componentKey) {
      throw new Error(`${entry.componentKey}: default snapshot key mismatch`);
    }
    return {
      componentKey: entry.componentKey,
      name: entry.中文名称,
      category: entry.分类,
      role: componentRole(entry.分类),
      variant: entry.默认变体,
      directory: directory.slice(workspaceRoot.length + 1),
      demoPath,
      contentSchema,
      settingsSchema,
      defaultContent,
      defaultSettings
    };
  });
}

export function createCampaignDocument({ name = '未命名 Campaign' } = {}) {
  return {
    schemaVersion: 1,
    name,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    localAssets: {},
    components: [],
    confirmed: false
  };
}

export function addComponentInstance(document, catalog, componentKey) {
  const component = catalog.find((candidate) => candidate.componentKey === componentKey);
  if (!component) throw new Error(`unknown selectable component: ${componentKey}`);
  const count = document.components.filter((instance) => instance.componentKey === componentKey).length + 1;
  const instance = {
    instanceId: `${componentKey}-${count}`,
    name: component.name,
    directory: component.directory,
    componentKey,
    content: clone(component.defaultContent.values),
    settings: clone(component.defaultSettings.values),
    source: 'component-defaults',
    confirmed: false
  };
  return { ...clone(document), components: [...document.components, instance], confirmed: false };
}

export function reorderComponentInstances(document, fromIndex, toIndex) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= document.components.length || toIndex >= document.components.length) {
    throw new Error('component reorder index is out of range');
  }
  const components = clone(document.components);
  const [instance] = components.splice(fromIndex, 1);
  components.splice(toIndex, 0, instance);
  return { ...clone(document), components, confirmed: false };
}

export function applySaleGridImport(document, instanceId, saleGrid) {
  const index = document.components.findIndex((instance) => instance.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  const current = document.components[index];
  if (current.componentKey !== 'collection.saleGrid6') throw new Error('sale-grid import requires a collection.saleGrid6 instance');
  if (!saleGrid?.collection?.handle || !saleGrid?.collection?.url || !Array.isArray(saleGrid.items) || saleGrid.items.length !== 6) {
    throw new Error('sale-grid import must contain one collection and exactly six items');
  }
  const content = { ...current.content };
  for (const [index, item] of saleGrid.items.entries()) {
    if (!item?.image?.url || !item?.linkUrl) throw new Error(`sale-grid item ${index + 1} is missing an image or link`);
    content[`saleItems[${index}].image.url`] = item.image.url;
    content[`saleItems[${index}].image.alt`] = item.image.alt ?? '';
    content[`saleItems[${index}].image.clickUrl`] = item.linkUrl;
    content[`saleItems[${index}].discountLabel`] = item.discountLabel ?? '';
  }
  content['saleCollection.cta.url'] = saleGrid.ctaUrl ?? saleGrid.collection.url;
  const components = document.components.map((instance, componentIndex) => componentIndex === index ? {
    ...instance,
    content,
    source: saleGrid.activityPage ? `shopify-activity-page:${saleGrid.activityPage.handle}:${saleGrid.collection.handle}` : `shopify-sale-grid:${saleGrid.collection.handle}`,
    confirmed: false
  } : instance);
  return { ...clone(document), components, confirmed: false };
}

export function attachLocalImage(document, instanceId, fieldKey, asset) {
  const index = document.components.findIndex((instance) => instance.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  const current = document.components[index];
  if (!(fieldKey in current.content)) throw new Error(`unknown image field: ${fieldKey}`);
  if (!asset || !/^[a-z0-9][a-z0-9-]*$/u.test(asset.id ?? '') || typeof asset.path !== 'string' || !asset.path || typeof asset.name !== 'string' || !asset.name) {
    throw new Error('local image asset is invalid');
  }
  const components = document.components.map((instance, componentIndex) => componentIndex === index ? {
    ...instance,
    content: { ...instance.content, [fieldKey]: `asset://${asset.id}` },
    confirmed: false
  } : instance);
  return {
    ...clone(document),
    localAssets: { ...(document.localAssets ?? {}), [asset.id]: { path: asset.path, name: asset.name } },
    components,
    confirmed: false
  };
}

export function buildLocalAssetMap(document, { workspaceRoot }) {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const assets = {};
  for (const instance of document.components) {
    const component = catalog.find((candidate) => candidate.componentKey === instance.componentKey);
    if (!component) throw new Error(`unknown selected component: ${instance.componentKey}`);
    const references = component.defaultContent.localReferenceAssets ?? {};
    for (const [assetId, relativePath] of Object.entries(references)) {
      const path = resolve(workspaceRoot, component.directory, relativePath);
      if (!existsSync(path)) throw new Error(`${instance.componentKey}: missing local asset ${relativePath}`);
      const value = { path: path.slice(workspaceRoot.length + 1), name: basename(relativePath) };
      if (assets[assetId] && assets[assetId].path !== value.path) throw new Error(`duplicate local asset id with different files: ${assetId}`);
      assets[assetId] = value;
    }
    const localPreviewAsset = component.defaultContent.localPreviewAsset;
    if (localPreviewAsset) {
      const assetIds = Object.values(instance.content).filter((value) => typeof value === 'string' && value.startsWith('asset://')).map((value) => value.slice('asset://'.length));
      for (const assetId of assetIds) {
        if (document.localAssets?.[assetId]) continue;
        const path = resolve(workspaceRoot, component.directory, localPreviewAsset);
        if (!existsSync(path)) throw new Error(`${instance.componentKey}: missing local preview asset ${localPreviewAsset}`);
        const value = { path: path.slice(workspaceRoot.length + 1), name: basename(localPreviewAsset) };
        if (assets[assetId] && assets[assetId].path !== value.path) throw new Error(`duplicate local asset id with different files: ${assetId}`);
        assets[assetId] = value;
      }
    }
  }
  for (const [assetId, asset] of Object.entries(document.localAssets ?? {})) {
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(assetId) || !asset || typeof asset.path !== 'string' || typeof asset.name !== 'string') {
      throw new Error('editor local asset is invalid');
    }
    const path = resolve(workspaceRoot, asset.path);
    if (!existsSync(path)) throw new Error(`editor local asset is missing: ${asset.name}`);
    if (assets[assetId] && assets[assetId].path !== asset.path) throw new Error(`duplicate local asset id with different files: ${assetId}`);
    assets[assetId] = { path: asset.path, name: asset.name };
  }
  return assets;
}
