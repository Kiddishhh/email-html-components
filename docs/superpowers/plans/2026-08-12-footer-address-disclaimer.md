# Footer Address Disclaimer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the confirmed appointment and delivery disclaimer to the `footer.warm` address group without changing its established typography or footer order.

**Architecture:** Extend the existing full-component footer content contract with one required field. Render it between country and phone through the same inline-address span contract, then update every complete content snapshot and regenerated artifact so the assembler remains deterministic.

**Tech Stack:** Node.js test runner, JSON snapshots, table/inline-CSS email HTML builder.

## Global Constraints

- Render `(Appointment Only. No Mail, Packages, Or Deliveries Accepted.)` after `footer.address.line4` and before `footer.address.line5`.
- Reuse the existing footer address typography: `settings.font.body`, 13px, 400 weight, 1.5 line-height, `settings.color.text`.
- Keep the footer last, preserve `[[unsubscribe_link]]`, and keep all existing address-line meanings.
- Update local previews only; do not call Omnisend, send, publish, or schedule.

---

### Task 1: Protect the footer disclaimer rendering contract

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: the footer template, schema, fixture and complete campaign composition snapshots.
- Produces: a regression test that detects a missing disclaimer field, wrong location, or typography drift.

- [x] **Step 1: Write the failing test**

Add a test named `the footer renders its appointment disclaimer as an address-style line before the phone number`. Read the footer template, schema, fixture and both compositions. Assert the schema/fixture/snapshots contain `footer.address.disclaimer`; then assert its slot occurs after `footer.address.line4` and before `footer.address.line5`, with the literal inline address style `font-family:{{settings.font.body}};font-size:13px;font-weight:400;line-height:1.5` and `color:{{settings.color.text}}`.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `node --test --test-name-pattern='footer renders its appointment disclaimer' tests/build-email-template.v1.test.mjs`

Expected: FAIL because the field and slot do not yet exist.

- [x] **Step 3: Add the minimum contract implementation**

Add `footer.address.disclaimer` to the footer content schema, fixture, template, default six-component composition and both current test campaign compositions. Keep existing line keys and use an explicit `<br>` after the new span.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `node --test --test-name-pattern='footer renders its appointment disclaimer' tests/build-email-template.v1.test.mjs`

Expected: PASS.

### Task 2: Synchronize demos, documentation and generated previews

**Files:**
- Modify: `页脚组件/品牌信息页脚/效果演示.html`
- Modify: `页脚组件/品牌信息页脚/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `campaign-drafts/test-back-to-school-sale/footer.static-safe.html`
- Modify: `campaign-drafts/test-back-to-school-sale/footer.local-preview.html`
- Modify: `campaign-drafts/test-back-to-school-sale/campaign.static-safe.html`
- Modify: `campaign-drafts/test-back-to-school-sale/campaign.local-preview.html`

**Interfaces:**
- Consumes: the completed contract from Task 1.
- Produces: human-facing documentation and current local preview artifacts consistent with the source component.

- [x] **Step 1: Update demo and component management guidance**

Render the disclaimer in the demo between country and phone using the same inline address style. Document it as a default, editable footer address field and state its fixed placement.

- [x] **Step 2: Rebuild footer and campaign local artifacts**

Run:
`node build-email-template.v1.mjs campaign-drafts/test-back-to-school-sale/footer.composition.v1.json`

Run:
`node build-email-template.v1.mjs campaign-drafts/test-back-to-school-sale/campaign.composition.v1.json --defer-local-assets`

Run the second command again with `--preview-local-assets` to leave the asset-resolving browser preview in place.

- [x] **Step 3: Verify end-to-end contracts**

Run: `node --test tests/*.test.mjs`

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: all tests and the six-slot contract pass; generated footer places the appointment disclaimer before the phone in the declared address typography.

## Self-Review

- Spec coverage: Task 1 implements the schema, data, ordering and typography contract; Task 2 synchronizes preview, documentation and built artifacts.
- Placeholder scan: no unfinished placeholders are present.
- Type consistency: `footer.address.disclaimer` is the same exact JSON key in template slot, schema, fixture, test and compositions.
