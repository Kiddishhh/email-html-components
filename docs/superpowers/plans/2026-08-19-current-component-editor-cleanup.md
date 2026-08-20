# Current Component Editor Cleanup Implementation Plan

> **For agentic workers:** Execute inline in the current user worktree because it contains confirmed, pre-existing component changes that must be preserved. Follow test-driven development and verify each task before continuing.

**Goal:** Align the visual editor, component registry, validator, documentation, and Skill around the current 19-component free-composition workflow.

**Architecture:** Keep the registry and editor whitelist as the two executable sources of registration truth. Remove the detached legacy editor and interaction index, make the current editor responsive and safe, then rewrite the Skill references around observable current behavior.

**Tech Stack:** Node.js ESM, Node test runner, static HTML/CSS/JavaScript, email-safe table HTML.

**Spec:** `docs/superpowers/specs/2026-08-19-current-component-editor-cleanup-design.md`

## Global Constraints

- Preserve intentional component-specific visual styles.
- Preserve all unrelated dirty-worktree changes.
- Do not add dependencies or use network access.
- Do not send, schedule, or publish Omnisend Campaigns.
- Shopify access remains read-only.

---

### Task 1: Lock the current registry and mobile editor contracts

**Files:**
- Modify: `tests/campaign-editor-server.test.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `tests/build-email-template.v1.test.mjs`

- [ ] Add a failing route-level test for the narrow single-column editor stylesheet.
- [ ] Add a failing validator test requiring every registered key to be editor-editable.
- [ ] Replace assertions that treat current components as non-Campaign candidates.
- [ ] Run focused tests and confirm the expected failures.

### Task 2: Fix responsive layout and runtime DOM insertion

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/editor/public/styles.css`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/app.js`

- [ ] Add the narrow single-column breakpoint and viewport-safe control sizing.
- [ ] Replace runtime `innerHTML` interpolation with DOM creation and `textContent`.
- [ ] Run focused editor tests until green.

### Task 3: Make registration validation match the current editor

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`
- Delete: `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`
- Delete: legacy editor files listed in the spec.

- [ ] Validate the structure declaration and all registry files.
- [ ] Import the editor whitelist and require an exact component-key match.
- [ ] Remove obsolete interaction-index CLI options and legacy runtime files.
- [ ] Run validator and focused contract tests until green.

### Task 4: Rewrite current Skill and guides

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `Campaign组件要求.v1.md`
- Modify: `组件索引.md`

- [ ] Capture the current reference-skill failure using focused contract tests.
- [ ] Rewrite the documents as current-state references without legacy/fixed-slot language.
- [ ] Run the Skill validator and focused documentation tests until green.

### Task 5: Full verification and visual QA

**Files:**
- Modify only if verification exposes a task-scope defect.

- [ ] Run the complete Node test suite.
- [ ] Run the component contract validator and syntax checks.
- [ ] Run `git diff --check`.
- [ ] Verify desktop and 375px editor flows in the in-app browser.
- [ ] Verify all registered components in 600px and 375px previews and capture final screenshots.
