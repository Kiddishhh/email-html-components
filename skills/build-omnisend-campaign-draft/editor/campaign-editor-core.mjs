import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

function defaultComponentAsset(component, assetId, workspaceRoot) {
  const assetDirectory = resolve(workspaceRoot, component.directory, 'assets');
  if (!existsSync(assetDirectory)) return null;
  const hint = assetId.split('-').slice(1).join('-');
  if (!hint) return null;
  const matches = readdirSync(assetDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.replace(/\.[^.]+$/u, '').includes(hint))
    .map((entry) => entry.name);
  if (matches.length !== 1) return null;
  return `assets/${matches[0]}`;
}

function scopedDefaultAssetId(componentKey, assetId) {
  return `${componentKey.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}-${assetId}`;
}

function conflictingDefaultAssetIds(document, catalog, workspaceRoot) {
  const pathsByAssetId = new Map();
  for (const instance of document.components) {
    const component = catalog.find((candidate) => candidate.componentKey === instance.componentKey);
    if (!component) throw new Error(`unknown selected component: ${instance.componentKey}`);
    for (const [assetId, relativePath] of Object.entries(component.defaultContent.localReferenceAssets ?? {})) {
      const paths = pathsByAssetId.get(assetId) ?? new Set();
      paths.add(resolve(workspaceRoot, component.directory, relativePath));
      pathsByAssetId.set(assetId, paths);
    }
  }
  return new Set([...pathsByAssetId].filter(([, paths]) => paths.size > 1).map(([assetId]) => assetId));
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
  if (!saleGrid?.collection?.handle || !Array.isArray(saleGrid.items) || saleGrid.items.length !== 6) {
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
  const ctaUrl = saleGrid.ctaUrl ?? (saleGrid.collectionSource?.type === 'admin-handle' ? null : saleGrid.collection.url);
  if (ctaUrl) content['saleCollection.cta.url'] = ctaUrl;
  const components = document.components.map((instance, componentIndex) => componentIndex === index ? {
    ...instance,
    content,
    source: saleGrid.activityPage ? `shopify-activity-page:${saleGrid.activityPage.handle}:${saleGrid.collection.handle}` : saleGrid.collectionSource?.type === 'admin-handle' ? `shopify-sale-grid-admin:${saleGrid.collection.handle}` : `shopify-sale-grid:${saleGrid.collection.handle}`,
    confirmed: false
  } : instance);
  return { ...clone(document), components, confirmed: false };
}

export function applyCurtainPromotionProductImport(document, instanceId, productImport) {
  const index = document.components.findIndex((instance) => instance.instanceId === instanceId);
  if (index === -1) throw new Error('component instance not found');
  const current = document.components[index];
  if (!['collection.curtainPromotionCard', 'collection.curtainPromotionCardNoTitle'].includes(current.componentKey)) {
    throw new Error('curtain promotion product import requires a curtain promotion card instance');
  }
  const product = productImport?.product;
  if (!product?.handle || !product?.image?.url || !product?.linkUrl || typeof product.title !== 'string' || typeof product.description !== 'string' || typeof product.discountLabel !== 'string') {
    throw new Error('curtain promotion product import returned incomplete product data');
  }
  const content = {
    ...current.content,
    'product.badge': product.discountLabel,
    'product.image.url': product.image.url,
    'product.image.alt': product.image.alt ?? '',
    'product.image.clickUrl': product.linkUrl,
    'product.title': product.title,
    'product.description': product.description,
    'product.cta.url': product.linkUrl
  };
  const components = document.components.map((instance, componentIndex) => componentIndex === index ? {
    ...instance,
    content,
    source: `shopify-product:${product.handle}`,
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

export function normalizeDefaultLocalAssetReferences(document, { workspaceRoot }) {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const conflictingAssetIds = conflictingDefaultAssetIds(document, catalog, workspaceRoot);
  const components = document.components.map((instance) => {
    const component = catalog.find((candidate) => candidate.componentKey === instance.componentKey);
    if (!component) throw new Error(`unknown selected component: ${instance.componentKey}`);
    const references = component.defaultContent.localReferenceAssets ?? {};
    const content = Object.fromEntries(Object.entries(instance.content).map(([key, value]) => {
      if (typeof value !== 'string' || !value.startsWith('asset://')) return [key, value];
      const assetId = value.slice('asset://'.length);
      return [key, Object.hasOwn(references, assetId) && conflictingAssetIds.has(assetId) ? `asset://${scopedDefaultAssetId(instance.componentKey, assetId)}` : value];
    }));
    return { ...clone(instance), content };
  });
  return { ...clone(document), components };
}

export function buildLocalAssetMap(document, { workspaceRoot }) {
  const catalog = buildEditorCatalog({ workspaceRoot });
  const conflictingAssetIds = conflictingDefaultAssetIds(document, catalog, workspaceRoot);
  const normalizedDocument = normalizeDefaultLocalAssetReferences(document, { workspaceRoot });
  const assets = {};
  for (const instance of normalizedDocument.components) {
    const component = catalog.find((candidate) => candidate.componentKey === instance.componentKey);
    if (!component) throw new Error(`unknown selected component: ${instance.componentKey}`);
    const assetIds = Object.values(instance.content).filter((value) => typeof value === 'string' && value.startsWith('asset://')).map((value) => value.slice('asset://'.length));
    const references = component.defaultContent.localReferenceAssets ?? {};
    for (const [assetId, relativePath] of Object.entries(references)) {
      const path = resolve(workspaceRoot, component.directory, relativePath);
      if (!existsSync(path)) throw new Error(`${instance.componentKey}: missing local asset ${relativePath}`);
      const value = { path: path.slice(workspaceRoot.length + 1), name: basename(relativePath) };
      const outputAssetId = conflictingAssetIds.has(assetId) ? scopedDefaultAssetId(instance.componentKey, assetId) : assetId;
      if (assets[outputAssetId] && assets[outputAssetId].path !== value.path) throw new Error(`duplicate local asset id with different files: ${outputAssetId}`);
      assets[outputAssetId] = value;
    }
    const localPreviewAsset = component.defaultContent.localPreviewAsset;
    if (localPreviewAsset) {
      for (const assetId of assetIds) {
        if (normalizedDocument.localAssets?.[assetId]) continue;
        const path = resolve(workspaceRoot, component.directory, localPreviewAsset);
        if (!existsSync(path)) throw new Error(`${instance.componentKey}: missing local preview asset ${localPreviewAsset}`);
        const value = { path: path.slice(workspaceRoot.length + 1), name: basename(localPreviewAsset) };
        if (assets[assetId] && assets[assetId].path !== value.path) throw new Error(`duplicate local asset id with different files: ${assetId}`);
        assets[assetId] = value;
      }
    }
    for (const assetId of assetIds) {
      if (normalizedDocument.localAssets?.[assetId] || assets[assetId]) continue;
      const relativePath = defaultComponentAsset(component, assetId, workspaceRoot);
      if (!relativePath) throw new Error(`${instance.componentKey}: unknown local asset ${assetId}`);
      const path = resolve(workspaceRoot, component.directory, relativePath);
      assets[assetId] = { path: path.slice(workspaceRoot.length + 1), name: basename(relativePath) };
    }
  }
  for (const [assetId, asset] of Object.entries(normalizedDocument.localAssets ?? {})) {
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
