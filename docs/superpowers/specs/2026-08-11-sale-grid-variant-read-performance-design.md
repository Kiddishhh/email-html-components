# Sale-grid variant read performance design

## Goal

Reduce the Shopify payload used to populate the six-item Campaign sale grid without changing product order, image/link sources, or the `SAVE xx%` calculation. Shopify remains query-only.

## Observed constraint

The live `back-to-school-home` query returned many variants per product because the current script requests `variants(first: 250)`, although it only uses the first available variant. The live CLI response also returns `collectionByHandle` at the top level and `price`/`compareAtPrice` as scalar money values.

## Design

1. Keep one query for the selected Collection and its first six products.
2. Prefer an exact server-side "selected or first available" variant field or filter that returns one variant per product. Verify this capability with a query-only compatibility test before adopting it.
3. If that exact server-side selector is unavailable, request an initial small variant page only. Paginate only the individual product(s) whose page contains no available variant; do not restore the six-products-by-250-variants query.
4. Stop with a product-specific error if no available variant exists. Do not substitute a different product or treat an unavailable first variant as saleable.
5. Normalize both observed Shopify CLI response envelopes and scalar money values. Preserve public product URLs, image Alt fallbacks, and discount rounding.

## Verification

- Unit tests cover the direct selector/filter query shape, the narrow-page fallback, scalar money values, and top-level CLI response envelopes.
- A live query-only run against the locked Collection verifies six products, one selected sale variant per product, independent product URLs, and no `variants(first: 250)` request.
- Update the Shopify data contract and Skill so all future Campaign runs use the same bounded-read rule.

## Failure handling

An unsupported selector/filter, missing image, unavailable product, or failed pagination stops the sale-grid stage and preserves the local draft. It never triggers a Shopify write or a broader menu/Page scan.
