# 双分割线页脚组件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the free-composition `footer.doubleDivider` Omnisend email footer component with the confirmed double-divider layout and calibrated social-logo sizes.

**Architecture:** The component is a self-contained presentation-table fragment in `页脚组件/双分割线页脚/`. It owns a complete content/settings snapshot and is rendered by the existing assembler through `组件清单.json`. The HTML editor reads the component from that registry and exposes only four color settings via `editor-ui-contract.mjs`; all layout and social-size values remain fixed in the template.

**Tech Stack:** Node.js test runner, JSON Schema contracts, HTML presentation tables with inline CSS, existing Campaign component assembler/editor.

**Spec:** `docs/superpowers/specs/2026-08-27-double-divider-footer-design.md`

## Global Constraints

- Preserve the existing `footer.warm` component without changes.
- Use one root presentation table, inline CSS, public HTTPS image URLs, and exactly one unmodified `[[unsubscribe_link]]` token.
- Use a 600px fluid shell with a 508px maximum content column and a 375px mobile target.
- Use `#FAF9F7` canvas and `#F9F6EE` content backgrounds, with two `#E3E0DE` 1px dividers.
- Keep the social display order YouTube, Instagram, Facebook, TikTok, Pinterest, WhatsApp, Threads.
- Keep 26×26px social cells and use image sizes 24, 24, 23, 24, 24, 24, 23px in that order.
- Expose only `color.canvas`, `color.background`, `color.text`, and `color.link` in the HTML editor.
- Do not create, update, send, schedule, publish, or upload an Omnisend Campaign/Draft.

---

### Task 1: Define the component contract and lock its missing-registration failure

**Files:**
- Create: `页脚组件/双分割线页脚/content.schema.v1.json`
- Create: `页脚组件/双分割线页脚/settings.schema.v1.json`
- Create: `页脚组件/双分割线页脚/content.fixture.v1.json`
- Create: `页脚组件/双分割线页脚/settings.defaults.v1.json`
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/campaign-editor-core.test.mjs`

**Interfaces:**
- Consumes: the `footer.warm` complete content snapshot as the source for identical Freshine copy, social URLs, icon URLs, and Alt fields.
- Produces: a `footer.doubleDivider` content/schema pair with the same required `footer.*` content keys and fixed `settings.*` visual values.

- [ ] **Step 1: Write failing registration and editor-contract tests**

```js
assert.ok(catalog.components.some(({ componentKey }) => componentKey === 'footer.doubleDivider'));
assert.deepEqual(editableFieldKeys('footer.doubleDivider'), {
  content: [],
  settings: ['color.canvas', 'color.background', 'color.text', 'color.link']
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --test --test-name-pattern='double divider|footer\.doubleDivider' tests/build-email-template.v1.test.mjs tests/campaign-editor-core.test.mjs`

Expected: FAIL because `footer.doubleDivider` is not registered and has no editor field contract.

- [ ] **Step 3: Create complete content and settings contracts**

Create the two JSON Schemas and complete fixture/defaults. Reuse the current footer’s content keys and default values, but define settings `color.canvas=#FAF9F7`, `color.background=#F9F6EE`, `color.text=#000000`, `color.link=rgba(0, 87, 184, 1)`, the Montserrat fallback stack, `space.sectionX=24px`, `space.sectionY=32px`, `space.block=14px`, and `content.width=508px`.

- [ ] **Step 4: Register the component and its four editor color fields**

Register the component in `组件清单.json` with `componentKey: 'footer.doubleDivider'`, category `页脚组件`, 600px output width, 375px breakpoint, and all seven required file paths. Add its four setting keys to `editableByComponent` and provide Chinese `copyByField` labels/help text in `editor/public/editor-ui-contract.mjs`.

- [ ] **Step 5: Run the focused tests to verify the contract passes**

Run: `node --test --test-name-pattern='double divider|footer\.doubleDivider' tests/build-email-template.v1.test.mjs tests/campaign-editor-core.test.mjs`

Expected: PASS after the registry resolves the new complete snapshot and editor whitelist.

### Task 2: Render the double-divider email-safe footer and prove its visual contract

**Files:**
- Create: `页脚组件/双分割线页脚/component.template.v1.html`
- Create: `页脚组件/双分割线页脚/component.styles.v1.css`
- Create: `页脚组件/双分割线页脚/效果演示.html`
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: Task 1’s `footer.doubleDivider` complete fixture/defaults and existing component assembler interpolation.
- Produces: a table-only rendered footer with two named 508px dividers, seven named social cells, and one Omnisend unsubscribe token.

- [ ] **Step 1: Add a failing rendered-output test**

```js
assert.match(rendered, /data-freshine-divider="top"[^>]*width="508"/);
assert.match(rendered, /data-freshine-divider="bottom"[^>]*width="508"/);
assert.match(rendered, /data-freshine-social-icon="youtube"[^>]*width="24"/);
assert.match(rendered, /data-freshine-social-icon="threads"[^>]*width="23"/);
assert.equal((rendered.match(/\[\[unsubscribe_link\]\]/g) ?? []).length, 1);
```

- [ ] **Step 2: Run the focused rendering test to verify it fails**

Run: `node --test --test-name-pattern='double divider footer renders' tests/build-email-template.v1.test.mjs`

Expected: FAIL because the new template and demo do not yet exist.

- [ ] **Step 3: Implement the template, styles, and standalone demo**

Use a single root table with `bgcolor` and inline `background-color` bound to the two background settings. Add `data-freshine-divider="top"` with no surrounding top spacer and `data-freshine-divider="bottom"` with `padding:24px 0 0`. Render the current `footer.*` fields in the specified hierarchy. Name every social cell and icon with `data-freshine-social-cell` / `data-freshine-social-icon`; set the seven fixed sizes to 24/24/23/24/24/24/23px and use 26px centered cells. Mirror the same output with fixture values in `效果演示.html`.

- [ ] **Step 4: Run the focused rendering test to verify it passes**

Run: `node --test --test-name-pattern='double divider footer renders' tests/build-email-template.v1.test.mjs`

Expected: PASS with two 508px dividers, all seven calibrated icons, and exactly one unsubscribe token.

### Task 3: Document the reusable component and validate editor discovery

**Files:**
- Create: `页脚组件/双分割线页脚/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `组件索引.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/campaign-editor-core.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–2’s registry path, editor whitelist, layout measurements, content settings, and fixed social calibration.
- Produces: editor-facing guidance that the component is selectable, reusable, and has only four editable color fields.

- [ ] **Step 1: Add a failing documentation/discovery test**

```js
assert.match(index, /双分割线页脚（`footer\.doubleDivider`）/);
assert.match(interactions, /`footer\.doubleDivider`/);
assert.match(interactions, /YouTube `24px`、Instagram `24px`、Facebook `23px`/);
```

- [ ] **Step 2: Run the focused documentation test to verify it fails**

Run: `node --test --test-name-pattern='double divider documentation' tests/build-email-template.v1.test.mjs`

Expected: FAIL because the index and interaction reference have no new component entry.

- [ ] **Step 3: Write the component management and editor-reference documentation**

Document the file responsibilities, content/setting fields, 600px/375px behavior, fixed two-divider and social-size rules, current public HTTPS social assets, and the rule that the HTML editor exposes only the four color settings. Add links to the new component’s management, template, and demo in `组件索引.md`; add the editor selection/fixed-layout summary to `component-interactions.zh-CN.md`.

- [ ] **Step 4: Run focused documentation and editor tests to verify they pass**

Run: `node --test --test-name-pattern='double divider documentation|footer\.doubleDivider' tests/build-email-template.v1.test.mjs tests/campaign-editor-core.test.mjs`

Expected: PASS with the same registry key, directory, and four editable settings across code and documentation.

### Task 4: Complete regression and local editor verification

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/campaign-editor-core.test.mjs`

**Interfaces:**
- Consumes: the registered, renderable, and documented component from Tasks 1–3.
- Produces: fresh regression evidence for static contracts and local editor preview behavior.

- [ ] **Step 1: Run all automated validation**

Run: `node --test tests/*.test.mjs && node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs && git diff --check`

Expected: all tests pass, the validator reports `footer.doubleDivider` as editor-ready, and `git diff --check` emits no output.

- [ ] **Step 2: Start the local editor and verify it is reachable**

Run: `node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173`

Run: `curl -fsS http://127.0.0.1:4173/ | rg -q 'Freshine Campaign Editor'`

Expected: the editor responds successfully at `http://127.0.0.1:4173/`.

- [ ] **Step 3: Verify the new component at both target widths**

In the local HTML editor, add `footer.doubleDivider` to a free-form campaign. Confirm the default preview at 600px and 375px: 508px desktop divider behavior, no horizontal overflow, two divider lines, seven centered icons at the calibrated sizes, and only the four color inputs exposed. Do not create an Omnisend Draft.

- [ ] **Step 4: Review the scoped diff**

Run: `git diff --check && git diff --stat -- '页脚组件/双分割线页脚' '组件清单.json' '组件索引.md' 'skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs' 'skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md' tests/build-email-template.v1.test.mjs tests/campaign-editor-core.test.mjs`

Expected: only the new component and its required registration, documentation, editor-contract, and test references are included; existing `footer.warm` is absent from this task’s diff.
