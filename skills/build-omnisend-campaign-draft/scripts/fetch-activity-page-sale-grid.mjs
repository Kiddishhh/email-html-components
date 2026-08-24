import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSaleGridPayload, normalizeSaleGrid } from './fetch-sale-grid.mjs';
import { runReadonlyShopify } from './shopify-readonly.mjs';

const DEFAULT_SHOPIFY_STORE = '0qsgrb-pe.myshopify.com';
const STOREFRONT_ORIGIN = 'https://freshinelife.com';
const COLLECTION_HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;

function readTemplate(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/u, ''));
}

export function parseShopifyProductImportUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('shopify URL must be a valid HTTPS URL'); }
  if (url.protocol !== 'https:' || url.origin !== STOREFRONT_ORIGIN) throw new Error('shopify URL must use https://freshinelife.com/pages/<handle> or /collections/<handle>');
  const match = url.pathname.match(/^\/(pages|collections)\/([a-z0-9][a-z0-9-]*)\/?$/u);
  if (!match) throw new Error('shopify URL must use /pages/<handle> or /collections/<handle>');
  return { type: match[1] === 'pages' ? 'page' : 'collection', handle: match[2], url: url.href };
}

export function parseCollectionHandle(value) {
  const handle = typeof value === 'string' ? value.trim() : '';
  if (!COLLECTION_HANDLE_PATTERN.test(handle)) throw new Error('shopify collection handle is required');
  return handle;
}

export function parseActivityPageUrl(value) {
  const source = parseShopifyProductImportUrl(value);
  if (source.type !== 'page') throw new Error('activity page URL must use /pages/<handle>');
  return { handle: source.handle, url: source.url };
}

export function activityPageProductGridSources({ snapshotPath, pageTemplate }) {
  const template = readTemplate(resolve(snapshotPath, 'templates', pageTemplate));
  const sections = template.sections ?? {};
  const sectionIds = Array.isArray(template.order) ? template.order : Object.keys(sections);
  const sources = sectionIds.map((sectionId) => [sectionId, sections[sectionId]])
    .filter(([, section]) => section?.type === 'products-grid-v2' && section.disabled !== true && typeof section.settings?.collection === 'string' && section.settings.collection.trim())
    .map(([sectionId, section]) => ({
      sectionId,
      handle: section.settings.collection.trim(),
      itemsToShow: Number.isFinite(Number(section.settings.items_to_show)) ? Number(section.settings.items_to_show) : null
    }));
  if (!sources.length) throw new Error('activity page has no enabled products-grid-v2 Collection');
  return { primary: sources[0], sources };
}

function resolvePageTemplate(pageHandle, store) {
  const query = `query ActivityPage($query: String!) { pages(first: 1, query: $query) { nodes { handle templateSuffix } } }`;
  const response = JSON.parse(runReadonlyShopify([
    'shopify', 'store', 'execute', '--json', '--query', query,
    '--variables', JSON.stringify({ query: `handle:${pageHandle}` }), '--store', store
  ]));
  const page = (response.data ?? response).pages?.nodes?.[0];
  if (!page || page.handle !== pageHandle) throw new Error(`activity page was not found: ${pageHandle}`);
  return page.templateSuffix ? `page.${page.templateSuffix}.json` : 'page.json';
}

function liveThemeId(store) {
  const themes = JSON.parse(runReadonlyShopify(['shopify', 'theme', 'list', '--json', '--store', store]));
  const liveThemes = themes.filter((theme) => theme.role === 'live');
  if (liveThemes.length !== 1) throw new Error(`expected one live theme, found ${liveThemes.length}`);
  return String(liveThemes[0].id);
}

function pullActivityPageTemplate({ themeId, pageTemplate, store }) {
  const snapshotPath = mkdtempSync(join(tmpdir(), 'freshine-activity-page-grid-'));
  runReadonlyShopify([
    'shopify', 'theme', 'pull', '--theme', themeId, '--path', snapshotPath,
    '--only', `templates/${pageTemplate}`, '--store', store
  ]);
  return snapshotPath;
}

export function loadActivityPageSaleGrid({ activityPageUrl, store = DEFAULT_SHOPIFY_STORE }) {
  const activityPage = parseActivityPageUrl(activityPageUrl);
  const pageTemplate = resolvePageTemplate(activityPage.handle, store);
  const themeId = liveThemeId(store);
  const snapshotPath = pullActivityPageTemplate({ themeId, pageTemplate, store });
  const productGrids = activityPageProductGridSources({ snapshotPath, pageTemplate });
  const collectionHandle = productGrids.primary.handle;
  const saleGrid = normalizeSaleGrid(loadSaleGridPayload({ collectionHandle, count: '6', store }), collectionHandle);
  return {
    ...saleGrid,
    ctaUrl: activityPage.url,
    activityPage: {
      handle: activityPage.handle,
      template: pageTemplate,
      themeId,
      primaryProductGrid: productGrids.primary,
      productGrids: productGrids.sources
    }
  };
}

export function loadShopifyProductImport({ shopifyUrl, collectionHandle, store = DEFAULT_SHOPIFY_STORE }) {
  if (collectionHandle !== undefined) {
    if (shopifyUrl !== undefined) throw new Error('choose either shopify URL or collection handle');
    const handle = parseCollectionHandle(collectionHandle);
    return {
      ...normalizeSaleGrid(loadSaleGridPayload({ collectionHandle: handle, count: '6', store }), handle),
      collectionSource: { type: 'admin-handle', handle }
    };
  }
  const source = parseShopifyProductImportUrl(shopifyUrl);
  if (source.type === 'page') return loadActivityPageSaleGrid({ activityPageUrl: source.url, store });
  const saleGrid = normalizeSaleGrid(loadSaleGridPayload({ collectionHandle: source.handle, count: '6', store }), source.handle);
  return {
    ...saleGrid,
    ctaUrl: source.url,
    collectionSource: { handle: source.handle }
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--shopify-url', '--activity-page-url', '--collection-handle', '--store'].includes(option) || !argv[index + 1]) throw new Error(`unsupported Shopify sale-grid option: ${option}`);
    options[option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1];
    index += 1;
  }
  options.shopifyUrl ??= options.activityPageUrl;
  if (options.shopifyUrl && options.collectionHandle) throw new Error('choose either shopify URL or collection handle');
  if (!options.shopifyUrl && !options.collectionHandle) throw new Error('shopify URL or collection handle is required');
  options.store ??= DEFAULT_SHOPIFY_STORE;
  return options;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(loadShopifyProductImport(parseArgs(process.argv.slice(2))), null, 2));
}
