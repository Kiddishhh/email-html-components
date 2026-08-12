# Append Brand Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append the existing `footer.warm` component to the six-section email and update only the existing Omnisend draft content.

**Architecture:** The composition remains the ordered source of truth. The builder renders each complete component snapshot without changing component styles; a separate API step replaces the draft email content only after draft-state validation.

**Tech Stack:** JSON composition, Node.js builder/tests, table-based email HTML, Omnisend REST API.

## Global Constraints

- Do not call any send or schedule endpoint.
- Preserve the first five component snapshots unchanged.
- Keep `[[unsubscribe_link]]` intact.
- Final email images must use public HTTPS URLs.

---

### Task 1: Add the footer to the ordered composition

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `compositions/hero-grid-review-gifts-location.default.v1.json`

**Interfaces:**
- Consumes: `页脚组件/品牌信息页脚/content.fixture.v1.json` and `settings.defaults.v1.json`
- Produces: a complete `footer.warm` instance at `components[5]`

- [ ] Add `footer.warm` to the expected ordered component-key assertion and assert that the last component contains `[[unsubscribe_link]]` after rendering.
- [ ] Run `node --test tests/build-email-template.v1.test.mjs` and verify failure because the footer is absent.
- [ ] Append the full default footer content/settings snapshot to the composition.
- [ ] Run the full test file and verify it passes.

### Task 2: Rebuild and validate local/formal HTML

**Files:**
- Regenerate: `头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html`
- Regenerate: `头图-六宫格-评论整图链接-免费礼物-地址.html`

**Interfaces:**
- Consumes: the six-component composition and the four existing Omnisend HTTPS asset URLs
- Produces: local preview and static-safe formal HTML

- [ ] Run the builder in local-preview mode.
- [ ] Build the formal HTML from a temporary composition whose four `asset://` values are replaced by the existing Omnisend HTTPS URLs.
- [ ] Check component count, footer placement, HTTPS images, `[[unsubscribe_link]]`, forbidden tags, and unresolved placeholders.

### Task 3: Update and verify the existing Omnisend draft

**Files:**
- No persistent API script or credential file.

**Interfaces:**
- Consumes: Campaign `6a797c4980f0da1327f1fe53` and regenerated formal HTML
- Produces: the same Campaign with updated draft email content

- [ ] GET the Campaign and stop unless status is exactly `draft`.
- [ ] GET the current email-content resource and preserve required identifiers/structure.
- [ ] Replace only the email HTML through the supported content update/import flow; never call send or schedule.
- [ ] Re-GET Campaign and email content, then verify `draft`, the footer marker, `[[unsubscribe_link]]`, and all required Omnisend image URLs.
