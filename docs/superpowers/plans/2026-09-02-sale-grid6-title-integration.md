# Sale Grid 6 With Title Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selectively integrate `collection.saleGrid6WithTitle` into `main`, enforce 600px-to-375px proportional rendering, and expose it as an editable, six-slot Shopify-importable Campaign Editor component.

**Architecture:** The source worktree is uncommitted, so migrate only the component-specific file set into the current dirty `main` worktree and preserve all unrelated source and target changes. The final HTML uses presentation tables and inline desktop-first declarations paired with `min()` proportional overrides; editor metadata and import handlers extend the existing per-card import pattern.

**Tech Stack:** Node.js ESM, HTML email presentation tables, inline CSS, JSON Schema/default snapshots, Node test runner, local Campaign Editor.

**Spec:** `docs/superpowers/specs/2026-09-02-sale-grid6-title-integration-design.md`

## Global Constraints

- Source is `/Users/ww/.codex/worktrees/sale-grid6-title` on `codex/sale-grid6-title`; its component files are uncommitted and `HEAD` equals `main`.
- Exclude the source worktree's `design-qa.md` deletion and unrelated README changes.
- Preserve all unrelated uncommitted work in both source and current `main`.
- Keep component key `collection.saleGrid6WithTitle`, category `活动商品组件`, 600px canvas, 375px target, and two-column mobile layout.
- Use inline desktop fallback plus `min()`/`max()` proportional declarations; do not send, schedule, publish, upload Omnisend assets, or write Shopify data.

---

## File Structure

- Create: `活动商品组件/六宫格折扣推荐（标题款）/` — template, CSS, content/settings Schema, fixture/defaults, management guide, demo.
- Modify: `组件清单.json`, `组件索引.md`, editor core/server/UI/field contract, component-interaction and editor-workflow references.
- Test: `tests/sale-grid6-with-title.test.mjs`, plus relevant campaign editor, Skill contract, and mobile contract tests.

### Task 1: Selectively stage source component changes

**Files:**
- Create: `活动商品组件/六宫格折扣推荐（标题款）/*`
- Modify: only the component-specific registry, index, editor, reference, and test files.

**Interfaces:**
- Consumes: uncommitted source files from `/Users/ww/.codex/worktrees/sale-grid6-title`.
- Produces: the same selected integration surface in current `main`, with no `design-qa.md` or README migration.

- [ ] **Step 1: Record the source allowlist and reject unrelated files**

Run:

```bash
git -C /Users/ww/.codex/worktrees/sale-grid6-title diff --name-status
git -C /Users/ww/.codex/worktrees/sale-grid6-title ls-files --others --exclude-standard
```

Expected: select the title-grid directory, its test, registry/index/editor/reference files; exclude `design-qa.md` and `README.md`.

- [ ] **Step 2: Apply only the allowlisted source changes to current main**

Generate and apply a patch limited to the allowlisted paths. Then run:

```bash
git diff -- design-qa.md README.md
node -e 'const r=require("./组件清单.json"); console.log(r.filter(x=>x.componentKey==="collection.saleGrid6WithTitle").length)'
```

Expected: no task-created `design-qa.md`/README diff and exactly one registered component.

### Task 2: Make email markup proportionally responsive

**Files:**
- Modify: `活动商品组件/六宫格折扣推荐（标题款）/component.template.v1.html`
- Modify: `活动商品组件/六宫格折扣推荐（标题款）/效果演示.html`
- Modify: `活动商品组件/六宫格折扣推荐（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Test: `tests/sale-grid6-with-title.test.mjs`

**Interfaces:**
- Consumes: component Schema/defaults and `scripts/normalize-inline-mobile-dimensions.mjs`.
- Produces: table/inline CSS where relevant desktop px declarations have proportional duplicates.

- [ ] **Step 1: Add failing mobile assertions**

```js
assert.match(source, /font-size:30px;font-size:min\(30px,5vw\);/);
assert.match(source, /line-height:45px;line-height:min\(45px,7\.5vw\);/);
assert.match(source, /height:236px;height:min\(236px,39\.333333vw\);/);
assert.match(source, /font-size:18px;font-size:min\(18px,3vw\);/);
```

- [ ] **Step 2: Run the focused test to verify failure**

Run: `node --test tests/sale-grid6-with-title.test.mjs`

Expected: FAIL until template and demo have synchronized inline proportional declarations.

- [ ] **Step 3: Implement desktop-first inline declarations**

Add each fixed declaration before its matching `min()` declaration for nonzero `font-size`, pixel `line-height`, `height`, `padding`, `margin`, and `border-radius`. Preserve percentage widths, `height:auto`, zero spacers, and 1px lines.

- [ ] **Step 4: Verify the component contract**

Run:

```bash
node scripts/normalize-inline-mobile-dimensions.mjs --check
node --test tests/sale-grid6-with-title.test.mjs
```

Expected: no `unscaledDeclarations`; focused test passes.

### Task 3: Register editor fields and selected-card imports

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs`
- Modify: `skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/app.js`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs`
- Test: `tests/sale-grid6-with-title.test.mjs`, `tests/campaign-editor-core.test.mjs`, `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Produces: `applySaleGrid6WithTitleProductImport(document, instanceId, itemIndex, productImport)`; `itemIndex` is 0–5 and only the matching `saleItems[index]` fields change.

- [ ] **Step 1: Write the selected-card isolation test**

```js
const after = applySaleGrid6WithTitleProductImport(document, instanceId, 5, imported);
assert.equal(after.components[0].content['saleItems[5].name'], 'Marisol');
assert.equal(after.components[0].content['saleItems[0].name'], originalFirstName);
```

- [ ] **Step 2: Run focused tests to verify the pipeline is incomplete**

Run: `node --test tests/sale-grid6-with-title.test.mjs tests/campaign-editor-core.test.mjs`

Expected: FAIL until the function, editor whitelist/help text, button handlers, and existing read-only route integration are present.

- [ ] **Step 3: Implement the import pipeline**

Validate component key and 0–5 index, require product handle/image/link/title/discount, update only the selected card's five content fields, and clear confirmation. Register six UI controls and route them through the current read-only product import endpoint.

- [ ] **Step 4: Verify editor behavior**

Run:

```bash
node --test tests/sale-grid6-with-title.test.mjs tests/campaign-editor-core.test.mjs tests/campaign-editor-server.test.mjs
```

Expected: PASS, with no Shopify mutation route.

### Task 4: Synchronize documentation and validate current registry

**Files:**
- Modify: `组件清单.json`, `组件索引.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md`
- Modify: `活动商品组件/六宫格折扣推荐（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Test: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Produces: one registered `collection.saleGrid6WithTitle` with editor-facing documentation and 600px/375px behavior.

- [ ] **Step 1: Add a failing documentation assertion**

```js
assert.match(interactions, /六宫格折扣推荐（标题款）.*collection\.saleGrid6WithTitle/s);
assert.match(management, /600px.*375px/s);
```

- [ ] **Step 2: Run the focused documentation test**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs tests/sale-grid6-with-title.test.mjs`

Expected: FAIL until all guides document the component.

- [ ] **Step 3: Update registry and guides**

Document editable fields, only six selected-card imports, table/inline output, retained two columns, and UTM/link boundaries.

- [ ] **Step 4: Validate contracts**

Run:

```bash
node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs tests/sale-grid6-with-title.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

Expected: PASS and `status: valid` with the component in both counts.

### Task 5: Visual QA and isolated main commit

**Files:**
- Modify: only the selected component integration surface from Tasks 1–4.

**Interfaces:**
- Consumes: green component/editor tests.
- Produces: one dedicated `main` commit containing only `collection.saleGrid6WithTitle` integration.

- [ ] **Step 1: Start a fresh local editor port and select the component**

Run: `node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4175`

Expected: `/api/catalog` and the chooser list `collection.saleGrid6WithTitle` under `活动商品组件`.

- [ ] **Step 2: Inspect both preview widths**

At 600px and 375px, verify `scrollWidth <= clientWidth`, two columns remain, title/body/CTA/cards contract proportionally, and console errors are absent.

- [ ] **Step 3: Run final checks**

```bash
node scripts/normalize-inline-mobile-dimensions.mjs --check
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
node --test tests/*.test.mjs
git diff --check
```

Expected: all checks pass.

- [ ] **Step 4: Create the isolated main integration commit**

Stage only the allowlisted component, registry/index, editor, reference, and test files. Inspect with `git diff --cached --name-status`, then run:

```bash
git commit -m "feat: add titled six-grid sale component"
```

Expected: `main` receives the component commit while unrelated pre-existing modifications remain unstaged and untouched.

