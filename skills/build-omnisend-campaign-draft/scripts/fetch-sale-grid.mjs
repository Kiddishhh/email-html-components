import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReadonlyShopify } from './shopify-readonly.mjs';

const storefrontBaseUrl = 'https://freshinelife.com';
const DEFAULT_SHOPIFY_STORE = '0qsgrb-pe.myshopify.com';

export function parseSaleGridArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (!['--collection-handle', '--count', '--fixture', '--store'].includes(option) || !argv[index + 1]) {
      throw new Error(`unsupported sale-grid option: ${option}`);
    }
    options[option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = argv[index + 1];
    index += 1;
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.collectionHandle ?? '')) throw new Error('sale-grid collection handle is required');
  if (options.count !== '6') throw new Error('sale-grid count must be exactly 6');
  options.store ??= DEFAULT_SHOPIFY_STORE;
  return options;
}

function asNumber(money) {
  const value = Number(typeof money === 'object' && money !== null ? money.amount : money);
  return Number.isFinite(value) ? value : null;
}

function discountLabel(price, compareAtPrice) {
  if (compareAtPrice === null || compareAtPrice <= price || compareAtPrice <= 0) return '';
  return `SAVE ${Math.round(((compareAtPrice - price) * 100) / compareAtPrice)}%`;
}

function graphQlRoot(payload) {
  return payload?.data ?? payload;
}

function hasAvailableVariant(product) {
  return product?.variants?.nodes?.some(({ availableForSale }) => availableForSale) === true;
}

export function resolveSaleGridVariants(payload, fetchProductVariantPage, collectionHandle = '<unknown>') {
  const collection = graphQlRoot(payload)?.collectionByHandle;
  if (!collection) throw new Error(`sale-grid collection not found: ${collectionHandle}`);
  const products = collection?.products?.nodes;
  if (!Array.isArray(products)) throw new Error('sale-grid collection has no products');
  for (const product of products) {
    while (!hasAvailableVariant(product)) {
      const pageInfo = product?.variants?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
      const pagePayload = fetchProductVariantPage({ productId: product.id, after: pageInfo.endCursor });
      const pagedProduct = graphQlRoot(pagePayload)?.product;
      if (!pagedProduct || pagedProduct.id !== product.id || !pagedProduct.variants) {
        throw new Error(`sale-grid variant page does not match product: ${product.handle ?? '<unknown>'}`);
      }
      product.variants.nodes.push(...pagedProduct.variants.nodes);
      product.variants.pageInfo = pagedProduct.variants.pageInfo;
    }
  }
  return payload;
}

export function normalizeSaleGrid(payload, collectionHandle) {
  const collection = graphQlRoot(payload)?.collectionByHandle;
  if (!collection || collection.handle !== collectionHandle) throw new Error(`sale-grid collection not found: ${collectionHandle}`);
  const products = collection.products?.nodes;
  if (!Array.isArray(products) || products.length < 6) throw new Error('sale-grid collection must contain at least six products');
  const items = products.slice(0, 6).map((product) => {
    const primaryMedia = product?.media?.nodes?.[0];
    const primaryImage = primaryMedia?.image;
    if (!primaryImage?.url) throw new Error(`sale-grid product has no first product image: ${product?.handle ?? '<unknown>'}`);
    const variant = product.variants?.nodes?.find(({ availableForSale }) => availableForSale);
    if (!variant) throw new Error(`sale-grid product has no available variant: ${product.handle}`);
    const price = asNumber(variant.price);
    if (price === null) throw new Error(`sale-grid product has invalid price: ${product.handle}`);
    const compareAtPrice = asNumber(variant.compareAtPrice);
    const linkUrl = product.onlineStoreUrl || `${storefrontBaseUrl}/products/${product.handle}`;
    return {
      title: product.title,
      handle: product.handle,
      image: {
        url: primaryImage.url,
        alt: primaryMedia.alt || `${product.title} product image`
      },
      linkUrl,
      linkSource: product.onlineStoreUrl ? 'online-store-url' : 'handle-fallback',
      price,
      compareAtPrice,
      discountLabel: discountLabel(price, compareAtPrice)
    };
  });
  return {
    collection: {
      handle: collection.handle,
      url: `${storefrontBaseUrl}/collections/${collection.handle}`
    },
    items
  };
}

export function saleGridGraphQlQuery() {
  return `query SaleGrid($handle: String!) {
    collectionByHandle(handle: $handle) {
      handle
      products(first: 6) {
        nodes {
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
      }
    }
  }`;
}

function saleGridProductVariantsGraphQlQuery() {
  return `query SaleGridProductVariants($id: ID!, $after: String!) {
    product(id: $id) {
      id
      variants(first: 8, after: $after) {
        nodes { availableForSale price compareAtPrice }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;
}

export function loadSaleGridPayload(options) {
  if (options.fixture) return JSON.parse(readFileSync(options.fixture, 'utf8'));
  const argv = ['shopify', 'store', 'execute', '--query', saleGridGraphQlQuery(), '--variables', JSON.stringify({ handle: options.collectionHandle })];
  if (options.store) argv.push('--store', options.store);
  const payload = JSON.parse(runReadonlyShopify(argv));
  return resolveSaleGridVariants(payload, ({ productId, after }) => JSON.parse(runReadonlyShopify([
    'shopify', 'store', 'execute', '--query', saleGridProductVariantsGraphQlQuery(),
    '--variables', JSON.stringify({ id: productId, after }), '--store', options.store
  ])), options.collectionHandle);
}

export function loadSaleGridPayload({ collectionHandle, count = '6', store = DEFAULT_SHOPIFY_STORE }) {
  const options = parseSaleGridArgs(['--collection-handle', collectionHandle, '--count', String(count), '--store', store]);
  return loadPayload(options);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options = parseSaleGridArgs(process.argv.slice(2));
  console.log(JSON.stringify(normalizeSaleGrid(loadSaleGridPayload(options), options.collectionHandle), null, 2));
}
