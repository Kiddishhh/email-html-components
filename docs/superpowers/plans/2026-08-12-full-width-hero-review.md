# 600px 全宽首图与评论图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the promotional hero and clickable review image use the 600px email canvas as their documented default, with the review image full width and zero outer spacing.

**Architecture:** The parent campaign composition remains the sole owner of the 600px canvas. The hero retains its existing `width:100%` background behavior. The clickable-image component changes only its default settings from 552px to 600px, so every full settings snapshot remains editable and backwards-compatible.

**Tech Stack:** Node.js test runner, JSON component contracts, table-based inline email HTML, Markdown Skill references.

## Global Constraints

- Keep the desktop email canvas at 600px and mobile target at 375px.
- Preserve email-safe table layouts and inline styles; do not add JavaScript, Flex, Grid, media queries, absolute positioning, or external CSS.
- Keep `spacing.outer` and `image.maxWidth` user-overridable through complete settings snapshots.
- Do not modify the existing Omnisend Campaign or use any Omnisend API.

---

### Task 1: Lock the full-width defaults with regression tests

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs:292-305`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs:124-138`

**Interfaces:**
- Consumes: `通用图片组件/可链接整图/settings.defaults.v1.json`, `settings.schema.v1.json`, `效果演示.html`, and Skill interaction references.
- Produces: Regression coverage requiring default `600px`, `0` outer spacing, hero full-width behavior, and a 600px review-image instruction.

- [x] **Step 1: Write failing expectations for the new defaults**

```js
assert.equal(defaults.values['spacing.outer'], '0');
assert.equal(defaults.values['image.maxWidth'], '600px');
assert.equal(schema.properties['image.maxWidth'].default, '600px');
assert.match(demo, /max-width:600px/);
assert.match(interactions, /600px.*全宽.*零外边距/s);
```

- [x] **Step 2: Run targeted tests and verify the old 552px default fails**

Run: `node --test --test-name-pattern='clickable image width|clickable image uses' tests/build-email-template.v1.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the component default and demo still use `552px`.

- [x] **Step 3: Implement the minimum defaults and documentation changes in Tasks 2–3**

No additional runtime API or CSS behavior is introduced; only the existing dynamic setting default changes.

- [x] **Step 4: Re-run targeted tests**

Run: `node --test --test-name-pattern='clickable image width|clickable image uses' tests/build-email-template.v1.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: PASS.

### Task 2: Change the clickable image component default presentation

**Files:**
- Modify: `通用图片组件/可链接整图/settings.defaults.v1.json`
- Modify: `通用图片组件/可链接整图/settings.schema.v1.json`
- Modify: `通用图片组件/可链接整图/效果演示.html`
- Modify: `通用图片组件/可链接整图/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: Existing `spacing.outer` and `image.maxWidth` template placeholders.
- Produces: Default demo and contract values of `0` outer spacing and `600px` maximum width; existing per-instance settings remain valid.

- [x] **Step 1: Change default settings and Schema default**

```json
"spacing.outer": "0",
"image.maxWidth": "600px"
```

- [x] **Step 2: Synchronize the demo and management guidance**

Set the demo wrapper to `max-width:600px`; describe 600px full width and zero outer spacing as the default. Retain explicit overrides as an advanced option.

- [x] **Step 3: Confirm only dynamic style placeholders remain in the template and stylesheet**

Run: `rg -n '552px|max-width:600px|image.maxWidth|spacing.outer' '通用图片组件/可链接整图'`

Expected: No stale `552px`; template still uses `{{settings.image.maxWidth}}` and `{{settings.spacing.outer}}`.

### Task 3: Synchronize hero and Skill guidance

**Files:**
- Modify: `头图/促销悬浮首图/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`

**Interfaces:**
- Consumes: Hero template's `width="100%"` and `background-size:cover`, plus the clickable component default values from Task 2.
- Produces: One consistent user-facing rule: hero fills the 600px canvas; review image defaults to 600px full width with zero outer spacing.

- [x] **Step 1: Update hero management guidance without changing its height or logo settings**

Add a short contract statement that the hero's outer component is `width:100%` and fills the 600px canvas supplied by the composition.

- [x] **Step 2: Replace old review-image guidance in Skill references**

Use: “默认 600px 画布全宽、零外边距；1200×2186 图片约为 600×1093px，移动端约为 375×683px。”

- [x] **Step 3: Update the main Skill workflow sentence**

State that `image.clickableFullWidth` starts from the 600px full-width default and still collects the image source after showing its mobile scaling.

### Task 4: Run complete regression verification

**Files:**
- Verify: `tests/*.test.mjs`
- Verify: `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

**Interfaces:**
- Consumes: Updated component defaults, demo, docs, and Skill.
- Produces: Evidence that the default change preserves all six-component assembly contracts.

- [x] **Step 1: Run the full test suite**

Run: `node --test tests/*.test.mjs`

Expected: All tests pass.

- [x] **Step 2: Validate six-component Campaign contracts**

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: JSON output with `"status": "valid"` and six slots.

- [x] **Step 3: Build a local campaign preview without writing to Omnisend**

Run: `node build-email-template.v1.mjs campaign-drafts/test-back-to-school-sale/campaign.composition.v1.json --preview-local-assets`

Expected: JSON output with `desktopWidth: 600`, `mobileTargetWidth: 375`, and `status: "local-preview"`.
