import { shopifyConfig } from './shopify-config.mjs';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverHomepageActivities } from './list-sale-activities.mjs';
import { runReadonlyShopify } from './shopify-readonly.mjs';

const DEFAULT_SHOPIFY_STORE = shopifyConfig.adminStore;
const STOREFRONT_BASE_URL = shopifyConfig.storefrontOrigin;

function sameCandidate(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function templateDigest(snapshotPath, template) {
  return createHash('sha256').update(readFileSync(resolve(snapshotPath, 'templates', template))).digest('hex');
}

function firstRecommendedCollection(snapshotPath, template) {
  const source = readFileSync(resolve(snapshotPath, 'templates', template), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/u, '');
  const sections = Object.entries(JSON.parse(source).sections ?? {}).filter(([, section]) => section && section.disabled !== true);
  const recommended = sections.find(([, section]) => section.type === 'products-grid-v2' && typeof section.settings?.collection === 'string' && section.settings.collection.trim());
  if (!recommended) throw new Error('selected linked Page has no enabled products-grid-v2 Collection');
  return recommended[1].settings.collection.trim();
}

export function fetchSelectedHomepageActivity({ snapshotPath, candidate, pageTemplate, themeId = null }) {
  if (typeof snapshotPath !== 'string' || !snapshotPath) throw new Error('snapshotPath is required');
  if (typeof pageTemplate !== 'string' || !/^page(?:\..+)?\.json$/u.test(pageTemplate)) throw new Error('pageTemplate is required');
  const freshCandidate = discoverHomepageActivities({ themeRoot: snapshotPath }).find(({ slideId }) => slideId === candidate?.slideId);
  if (!freshCandidate || !sameCandidate(candidate, freshCandidate)) throw new Error('candidate no longer matches the locked homepage snapshot');
  const collectionHandle = firstRecommendedCollection(snapshotPath, pageTemplate);
  return {
    activity: {
      name: freshCandidate.activityName,
      eyebrow: freshCandidate.activity.eyebrow,
      title: freshCandidate.activity.title,
      subtitle: freshCandidate.activity.description
    },
    recommendedCollection: {
      handle: collectionHandle,
      url: `${STOREFRONT_BASE_URL}/collections/${collectionHandle}`
    },
    source: {
      pageUrl: freshCandidate.pageUrl,
      template: pageTemplate,
      sectionId: freshCandidate.homepageSectionId,
      themeId,
      snapshotSha256: templateDigest(snapshotPath, pageTemplate),
      readAt: new Date().toISOString()
    }
  };
}

function resolvePageTemplate(pageHandle, store) {
  const query = `query SelectedHomepageSlidePage($query: String!) { pages(first: 1, query: $query) { nodes { handle templateSuffix } } }`;
  const response = JSON.parse(runReadonlyShopify([
    'shopify', 'store', 'execute', '--json', '--query', query,
    '--variables', JSON.stringify({ query: `handle:${pageHandle}` }), '--store', store
  ]));
  const page = (response.data ?? response).pages?.nodes?.[0];
  if (!page || page.handle !== pageHandle) throw new Error(`selected homepage slide Page was not found: ${pageHandle}`);
  return page.templateSuffix ? `page.${page.templateSuffix}.json` : 'page.json';
}

function selectedSnapshot(themeId, pageTemplate, store) {
  const snapshotPath = mkdtempSync(join(tmpdir(), 'freshine-selected-homepage-'));
  runReadonlyShopify([
    'shopify', 'theme', 'pull', '--theme', String(themeId), '--path', snapshotPath,
    '--only', 'templates/index.json', '--only', `templates/${pageTemplate}`, '--store', store
  ]);
  return snapshotPath;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--candidate-list', '--candidate-id', '--store'].includes(option) || !argv[index + 1]) throw new Error(`unsupported selected-activity option: ${option}`);
    options[option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1];
    index += 1;
  }
  if (!options.candidateList || !options.candidateId) throw new Error('--candidate-list and --candidate-id are required');
  return options;
}

function main(options) {
  const candidateList = readJson(options.candidateList);
  const candidate = candidateList.candidates?.find(({ slideId }) => slideId === options.candidateId);
  if (!candidate) throw new Error(`selected candidate not found: ${options.candidateId}`);
  const themeId = candidateList.source?.themeId;
  if (!themeId) throw new Error('selected candidate list is missing live themeId');
  const store = options.store ?? DEFAULT_SHOPIFY_STORE;
  const pageTemplate = resolvePageTemplate(candidate.pageHandle, store);
  const snapshotPath = selectedSnapshot(themeId, pageTemplate, store);
  return fetchSelectedHomepageActivity({ snapshotPath, candidate, pageTemplate, themeId });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(main(parseArgs(process.argv.slice(2))), null, 2));
}
