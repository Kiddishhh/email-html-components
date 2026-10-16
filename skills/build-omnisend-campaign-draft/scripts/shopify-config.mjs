import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// No credentials belong in this file. --store continues to override adminStore.
const path = process.env.FRESHINE_SHOPIFY_CONFIG
  ? resolve(process.env.FRESHINE_SHOPIFY_CONFIG)
  : new URL('../../../shopify.config.json', import.meta.url);
const config = JSON.parse(readFileSync(path, 'utf8'));
let storefront;
try { storefront = new URL(config.storefrontOrigin); } catch { throw new Error('shopify config storefrontOrigin must be an HTTPS origin'); }
if (storefront.protocol !== 'https:' || storefront.username || storefront.password || storefront.pathname !== '/' || storefront.search || storefront.hash) {
  throw new Error('shopify config storefrontOrigin must be an HTTPS origin without a path, query, or credentials');
}
if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/u.test(config.adminStore ?? '')) throw new Error('shopify config adminStore must be a myshopify.com hostname');
export const shopifyConfig = Object.freeze({ storefrontOrigin: storefront.origin, adminStore: config.adminStore });
