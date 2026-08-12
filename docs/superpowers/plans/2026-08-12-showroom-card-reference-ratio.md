# Showroom Card Reference Ratio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `location.showroomCard` to the confirmed 600px reference layout while preserving per-instance editable surface colors.

**Architecture:** Keep the existing table-based email component and content contract. Change only geometry defaults and inline template layout, then carry the full settings snapshots through the default composition and current test campaign. The final HTML remains email-safe and has no new runtime behavior.

**Tech Stack:** Node.js test runner, JSON component contracts, table/inline-CSS HTML email builder.

## Global Constraints

- Keep `color.surface` as a full, user-editable component setting; do not hard-code `#FDF9F8` into the component.
- Preserve all showroom text, image destination, Alt text and component keys.
- Use a 600px desktop / 375px mobile email canvas with table layout and inline styles only.
- Do not call Omnisend, schedule, send, publish, or change remote campaign state.

---

### Task 1: Capture the full-width showroom layout contract

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: the location component template, its JSON defaults/schema, and both checked-in compositions.
- Produces: a regression test that fails if the card regresses to its 430px / 392px geometry or stops carrying the editable surface setting.

- [x] **Step 1: Write the failing test**

Add a `node:test` case that reads `赠品与权益组件/展厅地址卡` and asserts the generated contract uses `content.maxWidth = 600px`, `image.maxWidth = 548px`, an image width/height of `548`/`324`, and still declares `color.surface` as a promptable setting. Assert the default composition uses the 600/548 values and the test campaign uses the same geometry with `#FDF9F8`.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `node --test --test-name-pattern='showroom card' tests/build-email-template.v1.test.mjs`

Expected: FAIL because the existing values are `430px`, `392px`, `392`, and `232`.

- [x] **Step 3: Implement the minimum component contract changes**

Update the template, CSS where needed, defaults, schema, default composition and campaign showroom snapshots to use the confirmed geometry. Retain `color.surface` and preserve image `height:auto`.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `node --test --test-name-pattern='showroom card' tests/build-email-template.v1.test.mjs`

Expected: PASS.

### Task 2: Synchronize human-facing demo and operational documentation

**Files:**
- Modify: `赠品与权益组件/展厅地址卡/效果演示.html`
- Modify: `赠品与权益组件/展厅地址卡/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: the dimensions established by Task 1.
- Produces: a standalone demonstration and maintenance guide that accurately describe the layout and editable color contract.

- [x] **Step 1: Update the demo markup**

Replace the embedded old 430px / 392px address-card markup with the exact new 600px / 548px / 324px layout, retaining the `#FFFFFF` component-default demonstration surface.

- [x] **Step 2: Update component documentation**

Document the 600px full card, 548px × 324px image, 460px title measure, 480px address measure, and that `color.surface` stays editable per composition instance. Update the CDN double-resolution dimensions to 1096×648.

- [x] **Step 3: Review the demo for stale layout values**

Run: `rg -n '430px|392px|width="392"|height="232"' '赠品与权益组件/展厅地址卡'`

Expected: no old geometry remains.

### Task 3: Regenerate checked-in local artifacts and verify end-to-end

**Files:**
- Modify: `campaign-drafts/test-back-to-school-sale/showroom.static-safe.html`
- Modify: `campaign-drafts/test-back-to-school-sale/showroom.local-preview.html`
- Modify: `campaign-drafts/test-back-to-school-sale/campaign.static-safe.html`
- Modify: `campaign-drafts/test-back-to-school-sale/campaign.local-preview.html`

**Interfaces:**
- Consumes: the revised compositions and component.
- Produces: the current test campaign’s matching static upload source and local preview, without a remote write.

- [x] **Step 1: Rebuild the isolated showroom artifacts**

Run: `node build-email-template.v1.mjs campaign-drafts/test-back-to-school-sale/showroom.composition.v1.json --preview-local-assets`

- [x] **Step 2: Rebuild the current campaign artifacts**

Run: `node build-email-template.v1.mjs campaign-drafts/test-back-to-school-sale/campaign.composition.v1.json --preview-local-assets`

- [x] **Step 3: Run the full verification set**

Run: `node --test tests/*.test.mjs`

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: both commands exit 0; local generated artifacts show 600px address-card geometry and the campaign keeps `#FDF9F8` for only that component.

## Self-Review

- Spec coverage: Task 1 implements reference geometry and preserves editable surface color; Task 2 synchronizes user-facing component materials; Task 3 verifies the exact test campaign preview and static source without an external update.
- Placeholder scan: no TBD/TODO/implement-later placeholders found.
- Type consistency: all modified keys already exist in the `location.showroomCard` settings contract; no new fields or interfaces are introduced.
