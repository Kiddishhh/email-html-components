import { shopifyConfig } from './shopify-config.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReadonlyShopify } from './shopify-readonly.mjs';

const storefrontBaseUrl = shopifyConfig.storefrontOrigin;
const DEFAULT_SHOPIFY_STORE = shopifyConfig.adminStore;
const productUrlHelp = `shopify product URL must use ${storefrontBaseUrl}/products/<handle> or ${storefrontBaseUrl}/collections/<collection-handle>/products/<handle>`;

function parseSingleProductArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--shopify-url', '--fixture', '--store'].includes(option) || !argv[index + 1]) {
      throw new Error(`unsupported single-product option: ${option}`);
    }
    options[option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1];
    index += 1;
  }
  if (typeof options.shopifyUrl !== 'string' || !options.shopifyUrl.trim()) throw new Error('shopify product URL is required');
  options.store ??= DEFAULT_SHOPIFY_STORE;
  return options;
}

function parseShopifyProductUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(productUrlHelp);
  }
  const match = url.pathname.match(/^\/(?:collections\/[a-z0-9][a-z0-9-]*\/)?products\/([a-z0-9][a-z0-9-]*)\/?$/u);
  if (url.origin !== storefrontBaseUrl || !match) {
    throw new Error(productUrlHelp);
  }
  return { handle: match[1], url: `${storefrontBaseUrl}/products/${match[1]}` };
}

function asNumber(money) {
  const value = Number(typeof money === 'object' && money !== null ? money.amount : money);
  return Number.isFinite(value) ? value : null;
}

function discountLabel(price, compareAtPrice) {
  if (compareAtPrice === null || compareAtPrice <= price || compareAtPrice <= 0) return '';
  return `SAVE ${Math.round(((compareAtPrice - price) * 100) / compareAtPrice)}%`;
}

function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}

function graphQlRoot(payload) {
  return payload?.data ?? payload;
}

function splitProductTitle(value) {
  const title = String(value ?? '').trim();
  const separatorIndex = title.indexOf('–');
  if (separatorIndex === -1) return { title, description: '' };
  return {
    title: title.slice(0, separatorIndex).trim(),
    description: title.slice(separatorIndex + 1).trim()
  };
}

function hasAvailableVariant(product) {
  return product?.variants?.nodes?.some(({ availableForSale }) => availableForSale) === true;
}

function resolveSingleProductVariants(payload, fetchProductVariantPage, handle = '<unknown>') {
  const product = graphQlRoot(payload)?.productByHandle;
  if (!product) throw new Error(`shopify product not found: ${handle}`);
  while (!hasAvailableVariant(product)) {
    const pageInfo = product?.variants?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    const pagePayload = fetchProductVariantPage({ productId: product.id, after: pageInfo.endCursor });
    const pagedProduct = graphQlRoot(pagePayload)?.product;
    if (!pagedProduct || pagedProduct.id !== product.id || !pagedProduct.variants) {
      throw new Error(`shopify product variant page does not match product: ${handle}`);
    }
    product.variants.nodes.push(...pagedProduct.variants.nodes);
    product.variants.pageInfo = pagedProduct.variants.pageInfo;
  }
  return payload;
}

function normalizeSingleProduct(payload, handle) {
  const product = graphQlRoot(payload)?.productByHandle;
  if (!product || product.handle !== handle) throw new Error(`shopify product not found: ${handle}`);
  const primaryMedia = product?.media?.nodes?.[0];
  const primaryImage = primaryMedia?.image;
  if (!primaryImage?.url) throw new Error(`shopify product has no first product image: ${handle}`);
  const variant = product.variants?.nodes?.find(({ availableForSale }) => availableForSale);
  if (!variant) throw new Error(`shopify product has no available variant: ${handle}`);
  const price = asNumber(variant.price);
  if (price === null) throw new Error(`shopify product has invalid price: ${handle}`);
  const compareAtPrice = asNumber(variant.compareAtPrice);
  const title = splitProductTitle(product.title);
  return {
    product: {
      handle,
      image: {
        url: primaryImage.url,
        alt: primaryMedia.alt || `${product.title} product image`
      },
      linkUrl: product.onlineStoreUrl || `${storefrontBaseUrl}/products/${handle}`,
      fullTitle: String(product.title).trim(),
      title: title.title,
      description: title.description,
      price: formatUsd(price),
      compareAtPrice: compareAtPrice !== null && compareAtPrice > price ? formatUsd(compareAtPrice) : '',
      discountLabel: discountLabel(price, compareAtPrice)
    }
  };
}

function singleProductGraphQlQuery() {
  return `query SingleProduct($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      onlineStoreUrl
      media(first: 1, query: "media_type:IMAGE", sortKey: POSITION) {
        nodes { alt ... on MediaImage { image { url width height } } }
      }
      variants(first: 8) {
        nodes { availableForSale price compareAtPrice }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;
}

function singleProductVariantGraphQlQuery() {
  return `query SingleProductVariants($id: ID!, $after: String!) {
    product(id: $id) {
      id
      variants(first: 8, after: $after) {
        nodes { availableForSale price compareAtPrice }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;
}

function loadSingleProductPayload(options, handle) {
  if (options.fixture) return JSON.parse(readFileSync(options.fixture, 'utf8'));
  const argv = ['shopify', 'store', 'execute', '--query', singleProductGraphQlQuery(), '--variables', JSON.stringify({ handle })];
  if (options.store) argv.push('--store', options.store);
  const payload = JSON.parse(runReadonlyShopify(argv));
  return resolveSingleProductVariants(payload, ({ productId, after }) => JSON.parse(runReadonlyShopify([
    'shopify', 'store', 'execute', '--query', singleProductVariantGraphQlQuery(),
    '--variables', JSON.stringify({ id: productId, after }), '--store', options.store
  ])), handle);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options = parseSingleProductArgs(process.argv.slice(2));
  const source = parseShopifyProductUrl(options.shopifyUrl.trim());
  console.log(JSON.stringify(normalizeSingleProduct(loadSingleProductPayload(options, source.handle), source.handle), null, 2));
}
