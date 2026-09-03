# Proportional Email Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every registered Freshine email component render from a 600px desktop baseline to a proportional 375px mobile layout without mixed fixed and scaled content.

**Architecture:** Add one deterministic inline-style normalizer for the current template and demo corpus, then lock the result with a registry-driven mobile contract test. The normalizer only adds a second CSS declaration after an existing desktop pixel declaration, so clients without `min()` preserve the existing desktop fallback. The component Skill defines the same contract for future creation and edits.

**Tech Stack:** Node.js ESM, node:test, existing JSON component registry, email-safe HTML tables and inline CSS.

**Spec:** `docs/superpowers/specs/2026-09-02-proportional-email-mobile-design.md`

## Global Constraints

- Preserve confirmed component visual structure, copy, assets, URLs, colors, keys and editor fields.
- Use 600px desktop values plus inline `min()` proportional overrides for 375px mobile values.
- Do not scale zero values, 1px borders, `font-size:0`, percentages, `auto`, or already-fluid full-width images.
- Modify every registered component template and matching demo when it has an affected pixel value.
- Do not send, schedule, publish, upload, or mutate Omnisend or Shopify.

### Task 1: Registry-driven mobile responsive contract

**Files:**
- Create: `tests/mobile-proportional-contract.test.mjs`
- Test: `tests/mobile-proportional-contract.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('every registered template and demo pairs desktop pixel visual values with an inline min override', () => {
  for (const file of registeredTemplateAndDemoFiles()) {
    assert.deepEqual(unscaledVisualDeclarations(readFileSync(file, 'utf8')), [], file);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/mobile-proportional-contract.test.mjs`

Expected: FAIL listing existing `font-size`, `line-height`, geometry, padding, margin, or radius declarations without a mobile override.

- [ ] **Step 3: Implement the normalizer and test helpers**

Create `scripts/normalize-inline-mobile-dimensions.mjs`. It must process only registered `component.template.v1.html` and sibling `效果演示.html` files, append `min(Npx,N/6vw)` immediately after eligible desktop declarations, and be idempotent.

- [ ] **Step 4: Run the normalizer and focused test**

Run: `node scripts/normalize-inline-mobile-dimensions.mjs && node --test tests/mobile-proportional-contract.test.mjs`

Expected: every registered template and demo has no unscaled eligible inline visual declaration.

### Task 2: New-component Skill standard

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/new-component-standard.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

- [ ] **Step 1: Write failing Skill assertions**

```js
assert.match(standard, /600px.*375px.*62\.5%/su);
assert.match(standard, /font-size:Npx;.*font-size:min/su);
assert.match(skill, /移动端等比.*min\(\)/su);
```

- [ ] **Step 2: Run the focused Skill test to verify it fails**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the current Skill has no complete mandatory proportional declaration matrix.

- [ ] **Step 3: Add the normative rule**

Add a concise `600px → 375px 等比移动端制造规范` section to the component Skill and its creation reference. Include exact syntax, explicit exceptions, template/demo synchronization, and the contract-test command.

- [ ] **Step 4: Run the focused Skill test**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: PASS.

### Task 3: Whole-project verification

**Files:**
- Modify: all registered `component.template.v1.html` / `效果演示.html` pairs with eligible declarations
- Create: `audit/proportional-mobile/summary.md`

- [ ] **Step 1: Run all renderer and contract tests**

Run: `node --test tests/*.test.mjs && node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

- [ ] **Step 2: Confirm generated output preserves the contract**

Run: `node scripts/normalize-inline-mobile-dimensions.mjs --check && git diff --check`

- [ ] **Step 3: Record the audit**

Write a short report with template/demo counts, 600px/375px scaling ratio, exception list, static-test result and local-vs-inbox validation boundary.
