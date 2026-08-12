# Mobile Hero and Grid Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the desktop email design while centering the six-card grid and reducing hero obstruction in Omnisend mobile preview.

**Architecture:** Keep the existing table-only components and use hybrid responsive constraints that are valid without media queries. Component templates remain the source of structure; generated demos and the composition are rebuilt from those sources before the same Campaign draft is fully replaced.

**Tech Stack:** HTML tables, inline CSS, Node.js builder/tests, Omnisend Email Content API.

## Global Constraints

- Desktop canvas remains 600px; mobile target remains 375px.
- Do not use media queries, Flex, Grid, positioning, scripts, or external CSS.
- Do not send or schedule the Campaign.
- Preserve all content, links, theme colors, images, and `[[unsubscribe_link]]`.

---

### Task 1: Lock the responsive contract with failing tests

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: hero and grid V1 templates/styles.
- Produces: assertions for `min-height:560px`, `padding:0 10px 32px`, six centered 274px wrappers, and six symmetric 19px paddings.

- [ ] Add assertions that fail against the current templates.
- [ ] Run `node --test tests/build-email-template.v1.test.mjs` and confirm failure is caused by the old 480px/left-right structure.

### Task 2: Implement the minimum component changes

**Files:**
- Modify: `主视觉组件/促销悬浮首图/component.template.v1.html`
- Modify: `主视觉组件/促销悬浮首图/component.styles.v1.css`
- Modify: `活动与赠品组件/六宫格夏季促销/component.template.v1.html`
- Modify: `活动与赠品组件/六宫格夏季促销/component.styles.v1.css`
- Modify: both component management documents.
- Regenerate: both `效果演示.html` files.

**Interfaces:**
- Consumes: existing content/settings schemas unchanged.
- Produces: table-only responsive V1 components with unchanged content contracts.

- [ ] Change hero minimum height and panel horizontal outer padding.
- [ ] Remove grid wrapper left/right alignment and make all six wrappers/paddings identical.
- [ ] Update component maintenance instructions and generated demos.
- [ ] Run the full test suite and confirm all tests pass.

### Task 3: Rebuild, upload, and verify

**Files:**
- Regenerate: `头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html`
- Regenerate: `头图-六宫格-评论整图链接-免费礼物-地址.html`

**Interfaces:**
- Consumes: six-component composition and existing Omnisend HTTPS image URLs.
- Produces: updated local/formal HTML and Campaign draft content.

- [ ] Build local preview and static-safe formal HTML.
- [ ] Verify six components, HTTPS images, no forbidden tags/placeholders, and one unsubscribe token.
- [ ] GET Campaign and Email Content, require `draft`, replace the complete HTML content, and re-GET.
- [ ] Verify Omnisend mobile card coordinates and hero measurements; verify desktop two-column/722px/472px measurements.
