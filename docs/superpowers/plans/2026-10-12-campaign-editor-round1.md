# Campaign editor round 1 implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task with tests and one final review.

**Goal:** Complete the five user-authorized editor improvements without changing component styles or export/upload behavior.

**Architecture:** Add a focused browser-independent editor-workflow module for save ordering, field groups, search, link inspection and UTM changes. Integrate it into the existing vanilla editor; render catalog previews through the existing email builder.

**Tech Stack:** Node.js, native browser JavaScript, node:test, existing static email builder.

**Spec:** ../specs/2026-10-12-campaign-editor-round1-design.md

## Global Constraints

- Preserve existing dirty WIP and component templates, styles and contracts.
- Keep Omnisend HTML safety validation, HTTPS assets, unsubscribe token and 600px/375px proportional mobile rules.
- No remote writes, sends, scheduling, publication or Git commits.

## Review Focus

- Delayed responses during continued typing must not erase input.
- Failed saves must survive switching/confirmation attempts and retry.
- Repeated components after deletion must remain independently editable.
- Fixed/unsubscribe links and image sources must not enter bulk UTM edits.
- Editor-only controls and preview iframes must never enter email output.

## Task 1: State and editing logic

Files: core module, new public/editor-workflow.mjs, new tests/campaign-editor-round1.test.mjs.
Interfaces: createSaveQueue({send,onSaved,onStatus}), groupEditorFields(keys,group), searchCatalog(catalog,category,query), linkInventory(draft,catalog,html,editableFields), applyUtm(url,values).
- [x] Add failing tests for ID reuse, sequential saves, pending overlays, failure retention, product grouping, search, link inventory and UTM preservation.
- [x] Run new tests and inspect expected failures.
- [x] Implement minimal functions and rerun tests to green.

## Task 2: Server and rendered editor

Files: campaign-editor-server.mjs, public/app.js, index.html, styles.css; server tests.
Consumes Task 1 interfaces; produces /api/drafts/:id/links and /catalog-previews/:componentKey/.
- [x] Add server tests for previews, complete link list, preserved safe output and independent repeated-instance edits.
- [x] Implement cached real component thumbnails, grouped forms, save status/retry, serialized mutations, link inventory and explicit UTM diff dialog.
- [x] Exercise desktop and mobile editor flows, pending edit confirmation, error/retry, search, grouping and UTM cancel/apply.

## Task 3: Documentation and full verification

Files: SKILL.md, visual-editor-workflow.zh-CN.md, README.md.
- [x] Document exact new controls, confirmation/save semantics and unchanged output constraints.
- [x] Run node --test tests/*.test.mjs, contract validator, mobile normalization check and git diff --check.
- [x] Review final changes; retain local outputs for user review and report real-platform testing limitations.

## Completion evidence

- First RED run: 7 missing-feature/ID-reuse regressions; GREEN: 7/7.
- Review RED: origin-draft binding and identical-URL slot isolation; GREEN: 9/9 pure tests plus server integration.
- Final fresh independent review found two P1 issues; both fixed with regression evidence. No deferred findings.
- Final suite: 298/298; component contracts: 54 valid; proportional mobile check: 108 files, zero unscaled declarations.
- Real browser checks: desktop 1440×1000, editor mobile 390×844, email mobile viewport/scroll width 375/375; delayed response, failure retention/retry, UTM cancel/apply, shared-URL product isolation and delayed new/delete guard.
- Ruling: use the explicitly requested current checkout and preserve all existing WIP; no branch reset, commit, push or remote write.
- Browser plugin not available; used existing bundled Playwright without adding dependencies. Screenshot and temporary UI scripts remain outside the repository under /tmp.

- Default builder output for a hero + six-product detail grid + footer is byte-identical to the pre-change builder; inspection-only link metadata is rejected for export mode.
