import { spawnSync } from 'node:child_process';

const allowedFamilies = new Set([
  'shopify store info',
  'shopify store execute',
  'shopify theme list',
  'shopify theme pull'
]);

function commandFamily(argv) {
  return argv.slice(0, 3).join(' ');
}

function queryValue(argv) {
  const index = argv.indexOf('--query');
  if (index === -1 || typeof argv[index + 1] !== 'string') throw new Error('shopify store execute requires a GraphQL query');
  return argv[index + 1];
}

export function assertReadonlyShopifyCommand(argv) {
  if (!Array.isArray(argv) || argv.some((value) => typeof value !== 'string' || !value)) throw new Error('Shopify command must be a non-empty string array');
  const family = commandFamily(argv);
  if (!allowedFamilies.has(family)) throw new Error(`Shopify command is not allowed: ${family || '<empty>'}`);
  if (argv.includes('--allow-mutations')) throw new Error('Shopify --allow-mutations is forbidden');
  if (argv.some((value) => /\bmutation\b/i.test(value))) throw new Error('Shopify GraphQL mutation is forbidden');
  if (family === 'shopify store execute') {
    const source = queryValue(argv).trim().replace(/^#[^\n]*\n/gm, '').trim();
    if (!/^query\b/i.test(source)) throw new Error('shopify store execute accepts query operations only');
  }
  return argv;
}

export function runReadonlyShopify(argv, options = {}) {
  assertReadonlyShopifyCommand(argv);
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env ?? process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Shopify command failed with exit code ${result.status}`);
  return result.stdout;
}
