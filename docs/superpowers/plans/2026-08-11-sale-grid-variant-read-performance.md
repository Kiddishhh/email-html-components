# Sale-grid variant read performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read exactly the six Campaign sale-grid products while avoiding the current 250-variant payload per product and preserving first-available discount selection.

**Architecture:** First verify whether the live Shopify schema exposes an exact one-variant selected-or-first-available field. Use it when available. Otherwise, query an eight-variant page for each of the six products and query additional pages only for products that contain no available variant in the pages already read.

**Tech Stack:** Node.js ESM, node:test, Shopify CLI `store execute` query-only GraphQL.

## Global Constraints

- Shopify commands remain limited to query-only `shopify store execute`.
- Never read menus, Pages, or more than the locked Collection's first six products.
- Preserve product order, public product links, image Alt fallbacks, scalar money normalization, and `SAVE xx%` rounding.
- Stop on a product without an available variant; never substitute a product.
- This workspace is not a Git repository; do not commit or create a worktree.

---

### Task 1: Verify the exact one-variant Shopify field

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs`
- Test: live query-only probe against `back-to-school-home`

**Interfaces:**
- Consumes: the locked Collection handle.
- Produces: either a confirmed `selectedOrFirstAvailableVariant` field or the bounded-page fallback decision.

- [ ] **Step 1: Run the schema compatibility probe**

Run a query-only operation containing:

```graphql
query SaleGridVariantProbe($handle: String!) {
  collectionByHandle(handle: $handle) {
    products(first: 1) {
      nodes {
        selectedOrFirstAvailableVariant { availableForSale price compareAtPrice }
      }
    }
  }
}
```

- [ ] **Step 2: Record the branch decision**

Use the direct field only when the probe validates and returns one variant. Otherwise continue with Task 2; do not retry the 250-variant query.

### Task 2: Implement the bounded variant query

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs`
- Modify: `tests/fetch-sale-grid.test.mjs`

**Interfaces:**
- Consumes: `saleGridGraphQlQuery()` and a Product ID for any fallback page.
- Produces: `normalizeSaleGrid(payload, collectionHandle)` with an available variant for each selected product.

- [ ] **Step 1: Write failing tests**

Assert that the primary query never contains `variants(first: 250)`, asks for one direct variant when Task 1 succeeds or `variants(first: 8)` plus `pageInfo` when it does not, and still returns the existing fixture's `SAVE 50%` label.

- [ ] **Step 2: Run the focused test**

Run: `node --test tests/fetch-sale-grid.test.mjs`

Expected: failure showing the existing 250-variant query cannot satisfy the bounded-read assertion.

- [ ] **Step 3: Implement the selected branch**

For the direct branch, replace the nested `variants` selection with `selectedOrFirstAvailableVariant { availableForSale price compareAtPrice }` and normalize it as the sole candidate.

For the fallback branch, request `id`, `variants(first: 8) { nodes { availableForSale price compareAtPrice } pageInfo { hasNextPage endCursor } }`; for each product without an available node, call query-only `product(id: $id) { variants(first: 8, after: $cursor) { ... } }` until an available variant is found or `hasNextPage` is false.

- [ ] **Step 4: Run the focused test again**

Run: `node --test tests/fetch-sale-grid.test.mjs`

Expected: pass with no 250-variant query and unchanged discount labels.

### Task 3: Record the bounded-read contract

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: the selected implementation branch from Task 1.
- Produces: a future-run instruction that forbids unbounded variant reads.

- [ ] **Step 1: Write the failing contract assertion**

Require the Skill and Shopify contract to say that the sale grid reads one exact selected/available variant where supported, otherwise eight-variant pages only for unresolved products, and never requests 250 variants per product.

- [ ] **Step 2: Run the contract test**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: failure until the bounded-read rule is documented.

- [ ] **Step 3: Add the minimum rule text**

Add the same branch rule to the Skill workflow and Shopify data contract, including product-specific stop behavior when no variant is available.

- [ ] **Step 4: Run the contract test again**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: pass.

### Task 4: Verify against the locked Collection

**Files:**
- Test: `tests/fetch-sale-grid.test.mjs`
- Test: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

- [ ] **Step 1: Run the full local suite**

Run: `node --test tests/*.test.mjs`

Expected: no failures.

- [ ] **Step 2: Run the production read-only query**

Run: `node skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs --collection-handle back-to-school-home --count 6`

Expected: exactly six items, product-specific public URLs, scalar prices, and no response generated by `variants(first: 250)`.
