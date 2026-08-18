# Editor Structure Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the all-component catalogue and generic schema editor with structure-first selection and Skill-directed editing.

**Architecture:** A small client-side contract maps registered categories to the first selector and maps each component key to the focused fields explicitly described in the Campaign interaction contract. The existing server, full snapshot storage, confirmation behavior, and free ordering remain unchanged.

**Tech Stack:** Vanilla ES modules, Node test runner, existing local HTTP editor.

## Global Constraints

- Components remain freely repeatable, removable, and reorderable.
- The default fixture/settings snapshot remains the preview source.
- Only fields named by the Skill interaction should be editable; full CSS remains hidden.
- Shopify import stays confined to `collection.saleGrid6`.

---

### Task 1: Add focused editor selection contracts

**Files:**
- Create: `skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs`
- Modify: `tests/campaign-editor-core.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
assert.deepEqual(structuresForCatalog(catalog), ['头图', '活动商品组件', '评论组件', '赠品与权益组件', '地址组件', '页脚组件']);
assert.deepEqual(styleKeysForStructure(catalog, '头图'), ['hero.promotionalOverlay', 'hero.countdownOverlay', 'hero.countdownOverlay2']);
assert.deepEqual(editableFieldKeys('footer.warm'), { content: [], settings: ['color.background'] });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/campaign-editor-core.test.mjs`

- [ ] **Step 3: Write minimal implementation**

```js
export function structuresForCatalog(catalog) { /* registered-category order */ }
export function styleKeysForStructure(catalog, category) { /* same category only */ }
export function editableFieldKeys(componentKey) { /* Skill-directed field map */ }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/campaign-editor-core.test.mjs`

### Task 2: Render the compact editor controls

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/editor/public/index.html`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/styles.css`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/app.js`

- [ ] **Step 1: Replace catalogue cards with structure and style selects**
- [ ] **Step 2: Populate styles only after a structure is selected**
- [ ] **Step 3: Use `editableFieldKeys` when building the inspector form**
- [ ] **Step 4: Keep confirmation and six-grid import actions unchanged**
- [ ] **Step 5: Run core/server tests and exercise the browser flow**
