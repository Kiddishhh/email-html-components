import { shopifyConfig } from './shopify-config.mjs';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReadonlyShopify } from './shopify-readonly.mjs';

const HERO_SECTION_TYPE = 'slideshow-v2';
const DEFAULT_SHOPIFY_STORE = shopifyConfig.adminStore;
const STOREFRONT_BASE_URL = shopifyConfig.storefrontOrigin;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/u, ''));
}

function enabledSections(template) {
  return Object.entries(template.sections ?? {}).filter(([, section]) => section && section.disabled !== true);
}

function pageHandleFromLink(link) {
  const match = typeof link === 'string' && link.match(/^shopify:\/\/pages\/([^/?#]+)$/u);
  return match?.[1] ?? null;
}

export function discoverHomepageActivities({ themeRoot }) {
  if (typeof themeRoot !== 'string' || !themeRoot) throw new Error('themeRoot is required');
  const homepage = readJson(join(themeRoot, 'templates', 'index.json'));
  const heroes = enabledSections(homepage).filter(([, section]) => section.type === HERO_SECTION_TYPE);
  if (heroes.length !== 1) throw new Error(`expected one enabled ${HERO_SECTION_TYPE} on the homepage, found ${heroes.length}`);
  const [homepageSectionId, hero] = heroes[0];
  const order = Array.isArray(hero.block_order) ? hero.block_order : Object.keys(hero.blocks ?? {});
  const candidates = [];
  for (const slideId of order) {
    const slide = hero.blocks?.[slideId];
    const settings = slide?.settings ?? {};
    const pageHandle = pageHandleFromLink(settings.link);
    if (slide?.disabled === true || typeof settings.subheading !== 'string' || !settings.subheading.trim() || typeof settings.heading !== 'string' || !settings.heading.trim() || !pageHandle) continue;
    candidates.push({
      slideId,
      activityName: settings.subheading.trim(),
      pageHandle,
      pageUrl: `${STOREFRONT_BASE_URL}/pages/${pageHandle}`,
      homepageSectionId,
      activity: {
        eyebrow: settings.subheading.trim(),
        title: settings.heading.trim(),
        description: typeof settings.description === 'string' ? settings.description.trim() : ''
      }
    });
  }
  return candidates;
}

function liveHomepageSnapshot(store) {
  const themes = JSON.parse(runReadonlyShopify(['shopify', 'theme', 'list', '--json', '--store', store]));
  const liveThemes = themes.filter((theme) => theme.role === 'live');
  if (liveThemes.length !== 1) throw new Error(`expected one live theme, found ${liveThemes.length}`);
  const snapshotPath = mkdtempSync(join(tmpdir(), 'freshine-homepage-theme-'));
  runReadonlyShopify([
    'shopify', 'theme', 'pull', '--theme', String(liveThemes[0].id), '--path', snapshotPath,
    '--only', 'templates/index.json', '--store', store
  ]);
  return { themeId: String(liveThemes[0].id), snapshotPath };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--theme-dir', '--store'].includes(option) || !argv[index + 1]) throw new Error(`unsupported activity-list option: ${option}`);
    options[option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1];
    index += 1;
  }
  return options;
}

function main(options) {
  const store = options.store ?? DEFAULT_SHOPIFY_STORE;
  const source = options.themeDir
    ? { themeId: null, snapshotPath: resolve(options.themeDir) }
    : liveHomepageSnapshot(store);
  return {
    source: { ...source, snapshotName: basename(source.snapshotPath), template: 'index.json' },
    candidates: discoverHomepageActivities({ themeRoot: source.snapshotPath })
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(JSON.stringify(main(parseArgs(process.argv.slice(2))), null, 2));
}
