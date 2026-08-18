# Flexible Campaign Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed six-slot Campaign Draft workflow with a user-directed ordered component list resolved from the current registry.

**Architecture:** `campaign-structure.v1.json` becomes a compact flexible-contract declaration rather than a list of slots. The validator checks that declaration, then validates the full live registry and interaction index; Campaign assembly uses the user's component sequence as the only ordering source. Component-level interaction contracts and all campaign-level delivery safeguards remain unchanged.

**Tech Stack:** Node.js ESM, Node built-in test runner, JSON contracts, Markdown Skill documentation.

## Global Constraints

- Resolve directories only through `组件清单.json`; do not restore retired directory paths.
- Do not prescribe a component order, required component, terminal component, or component count.
- Allow only registered component keys with a matching interaction contract.
- Preserve `[[unsubscribe_link]]`, static-safe HTML, local desktop/mobile previews, hash-bound final confirmation, draft-only Omnisend writes, and Shopify read-only access.
- Preserve unrelated working-tree changes.

---

### Task 1: Specify the flexible contract in failing tests

**Files:**
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Test: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: `validate-campaign-contracts.mjs --structure <path> --interactions <path> --registry <path>`.
- Produces: tests that define `{"schemaVersion": 2, "selection": "user-ordered-registered-components"}` as valid and reject fixed-slot-only or malformed flexible contracts.

- [ ] **Step 1: Replace the fixed-slot expectation with a flexible-contract expectation**

```js
assert.deepEqual(structure, {
  schemaVersion: 2,
  selection: 'user-ordered-registered-components'
});
```

- [ ] **Step 2: Add a test that supplies a malformed flexible structure**

```js
writeFileSync(structurePath, JSON.stringify({ schemaVersion: 2, selection: 'slots' }));
const result = spawnSync(process.execPath, [validator, '--structure', structurePath], { encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.match(result.stderr, /selection/);
```

- [ ] **Step 3: Run the focused test to verify RED**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the production contract and validator still require `slots` and the existing test expects six fixed slots.

### Task 2: Implement registry-driven flexible validation and documentation

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`
- Modify: `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: a version-2 JSON object with `selection: "user-ordered-registered-components"`.
- Produces: validator output `{ status: "valid", selection: "user-ordered-registered-components", components: [...] }`; the component list comes from the validated intersection of registry and interaction index, never from a fixed slot map.

- [ ] **Step 1: Replace the contract JSON with the exact minimal flexible form**

```json
{
  "schemaVersion": 2,
  "selection": "user-ordered-registered-components"
}
```

- [ ] **Step 2: Make the validator accept only the flexible form and validate the eligible intersection**

```js
function validateStructure(structure) {
  requireExactKeys(structure, ['schemaVersion', 'selection'], 'campaign structure');
  if (structure.schemaVersion !== 2) throw new Error('campaign structure schemaVersion must be 2');
  if (structure.selection !== 'user-ordered-registered-components') {
    throw new Error('campaign structure selection must be user-ordered-registered-components');
  }
}
```

```js
const components = [...interactions.keys()].filter((componentKey) => registered.has(componentKey));
if (components.length === 0) throw new Error('campaign structure has no registered interaction-ready components');
```

- [ ] **Step 3: Rewrite only the fixed-order wording in the Skill and safety reference**

Document that the supplied list controls order and membership, each listed key must be registered and interaction-ready, components are collected and confirmed one at a time in list order, and no component is structurally required or terminal. Retain every delivery, asset, Shopify, preview, confirmation, unsubscribe, and Omnisend draft restriction.

- [ ] **Step 4: Update assertions that mention a fixed footer/slot order**

Replace them with assertions for user-directed ordering and retained campaign-level safety gates. Keep existing current-directory assertions and component-specific interaction assertions intact.

- [ ] **Step 5: Run the focused test to verify GREEN**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: PASS with the flexible contract and all prior safety assertions.

### Task 3: Prove the requested component order can render without a slot map

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Test: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: full fixture and settings snapshots resolved from the registry for `hero.countdownOverlay`, `collection.saleGrid6`, `image.clickableFullWidth`, `image.benefitsStrip3`, `gift.rewardGrid2`, and `footer.warm`.
- Produces: a local preview whose rendered marker order exactly matches the requested sequence.

- [ ] **Step 1: Add a failing composition test for the requested order**

```js
assert.deepEqual(composition.components.map(({ componentKey }) => componentKey), [
  'hero.countdownOverlay',
  'collection.saleGrid6',
  'image.clickableFullWidth',
  'image.benefitsStrip3',
  'gift.rewardGrid2',
  'footer.warm'
]);
```

- [ ] **Step 2: Run the focused builder test to verify RED**

Run: `node --test tests/build-email-template.v1.test.mjs`

Expected: FAIL because no complete requested-order composition fixture exists yet.

- [ ] **Step 3: Add the smallest complete fixture composition or test helper**

Use the registry’s live directories and complete `content.fixture.v1.json` / `settings.defaults.v1.json` snapshots. Generate only a local preview with `--preview-local-assets`; do not turn local `asset://` URLs into an Omnisend upload and do not contact Omnisend.

- [ ] **Step 4: Run the focused builder test to verify GREEN**

Run: `node --test tests/build-email-template.v1.test.mjs`

Expected: PASS and the generated local preview contains the six requested components in exact order.

### Task 4: Full validation and handoff to Campaign assembly

**Files:**
- Verify: `skills/build-omnisend-campaign-draft/`
- Verify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Verify: `tests/build-email-template.v1.test.mjs`

- [ ] **Step 1: Run contract validation**

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: `status: "valid"`, flexible selection mode, and only live registered interaction-ready components.

- [ ] **Step 2: Validate the Skill package**

Run: `python3 /Users/ww/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/build-omnisend-campaign-draft`

Expected: successful frontmatter and directory validation.

- [ ] **Step 3: Run the targeted test suites**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs tests/build-email-template.v1.test.mjs`

Expected: PASS with no failures.

- [ ] **Step 4: Begin the updated Campaign Draft interaction**

Use the user-specified order `hero.countdownOverlay → collection.saleGrid6 → image.clickableFullWidth → image.benefitsStrip3 → gift.rewardGrid2 → footer.warm`. Collect Campaign metadata and shared colors, then request or load the selected components’ permitted content sources one component at a time. Generate local previews and final static-safe HTML only after the required component confirmations; do not create an Omnisend draft until the later hash-bound final approval.
