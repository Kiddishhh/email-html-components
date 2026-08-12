# Omnisend Draft Upload Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide one deterministic script that uploads approved Campaign assets and creates then verifies an Omnisend Campaign draft without ever sending or scheduling it.

**Architecture:** Add a Node ESM module that owns request construction, key acquisition, immutable HTML transformation, and draft-only response validation. Keep network transport injectable for fixture tests. The CLI wrapper obtains an API key from a hidden terminal prompt and never persists or prints it; the Skill invokes only this wrapper for Omnisend writes.

**Tech Stack:** Node.js ESM, built-in `node:test`, `fetch`, `node:readline/promises`, existing Campaign composition and static HTML artifacts.

## Global Constraints

- Never call `/send`, schedule endpoints, publish endpoints, or any endpoint that can move a Campaign out of `draft`.
- Prompt for the API key only at runtime through a hidden terminal input; do not accept it as an option or environment variable and never print or persist it.
- Do not make a network request before verifying final confirmation and the current static-HTML SHA-256.
- Require public HTTPS image URLs after upload and require a `draft` Campaign response plus a successful Campaign/Email Content readback.
- Preserve the original project state on every failure; write only a minimized receipt after readback succeeds.

---

### Task 1: Draft-only request policy and transaction unit tests

**Files:**
- Create: `tests/upload-omnisend-draft.test.mjs`
- Create: `skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs`

**Interfaces:**
- `createDraftUploadTransaction({ projectState, html, readFile, transport, now })` returns `{ run(apiKey) }`.
- `run(apiKey)` returns a minimized receipt only after all readback assertions pass.
- `transport(request)` receives `{ method, url, headers, body }` and returns `{ status, json }`.

- [ ] **Step 1: Write failing policy tests**

Add fixture states and a fake transport. Assert that a verified run calls only image-upload, email-template, campaign-create, campaign-GET, and email-content-GET URLs; creates a Campaign with `type: regular`, `channel: email`, `sendingSettings.strategy: immediate`; and never uses a URL containing `/send` or a body containing `scheduled`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/upload-omnisend-draft.test.mjs`

Expected: FAIL because `upload-omnisend-draft.mjs` does not exist.

- [ ] **Step 3: Implement the minimal transaction module**

Implement URL allowlisting, request construction, SHA-256 validation, public-HTTPS validation, an in-memory asset URL replacement, template import, Campaign creation, and readback validation. Reject an absent/blank key, unresolved local assets, `/send`, `scheduled`, non-201 create result, non-draft readback, mismatched `contentID`, missing unsubscribe token, and mismatched output HTML hash.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/upload-omnisend-draft.test.mjs`

Expected: PASS with no real network calls.

### Task 2: Failure contracts and zero-secret persistence

**Files:**
- Modify: `tests/upload-omnisend-draft.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs`

**Interfaces:**
- A failed `run(apiKey)` rejects without invoking a later transaction endpoint.
- `toReceipt(result)` returns only Campaign ID, content ID, image IDs, timestamps, `draft` status, hash, component order, and validation result.

- [ ] **Step 1: Write failing failure-path tests**

Assert rejection before transport for unconfirmed state and hash mismatch. Assert upload responses without an HTTPS URL stop template/Campaign calls. Assert non-draft readback and email-content mismatch stop before receipt generation. Assert serialized receipt and captured stdout/stderr do not include the supplied key or full HTML.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/upload-omnisend-draft.test.mjs`

Expected: FAIL on the new negative cases.

- [ ] **Step 3: Implement the smallest guards and receipt serializer**

Add explicit preflight predicates, phase-by-phase stop behavior, JSON-safe receipt projection, and redaction of values matching the supplied runtime key before CLI diagnostics are printed.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/upload-omnisend-draft.test.mjs`

Expected: PASS for success and every injected failure.

### Task 3: CLI key prompt and Skill contract

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- CLI accepts only `--project <path>` and `--html <path>`.
- The CLI displays a hidden `Omnisend API Key:` prompt only after local preflight succeeds.

- [ ] **Step 1: Write failing contract assertions**

Assert the Skill names `upload-omnisend-draft.mjs`, requires runtime key prompting, forbids both key persistence and the send/schedule/publish endpoints, and requires a draft readback. Add CLI parsing tests that reject `--api-key` and unknown arguments before the prompt.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/upload-omnisend-draft.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the CLI and Skill are not yet wired to the new contract.

- [ ] **Step 3: Implement CLI and minimal Skill integration**

Read project/HTML paths, perform non-secret preflight, prompt with terminal echo disabled, invoke the transaction, print only a minimized receipt, and clear the key reference in a `finally` block. Replace the manual Omnisend-write directions with an instruction to run this script after final confirmation.

- [ ] **Step 4: Verify GREEN and validate the Skill**

Run: `node --test tests/upload-omnisend-draft.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs && ruby -e 'require "yaml"; YAML.load_file("skills/build-omnisend-campaign-draft/SKILL.md") rescue nil' && node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: all tests pass, YAML frontmatter parses, and Campaign contracts remain valid.

### Task 4: Full regression and local dry run

**Files:**
- Modify: `campaign-drafts/test-back-to-school-sale/project-state.v1.json` only if a dry-run receipt format must be recorded without external API calls.

- [ ] **Step 1: Run the full local suite**

Run: `node --test tests/*.test.mjs`

Expected: new upload tests pass. Document separately any existing unrelated failures caused by moved component directories.

- [ ] **Step 2: Run a no-network preflight failure**

Run the CLI with a deliberately unconfirmed copied state and a known local HTML file. Verify it fails before prompting for a key or making HTTP requests.

- [ ] **Step 3: Inspect repository changes**

Run: `git diff --no-index /dev/null skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs` and `git status` only if a Git repository becomes available.

- [ ] **Step 4: Report verified limits**

State that local validation covers the draft-only request policy. Do not claim a live Campaign exists unless a later user-authorized run returns and readbacks `draft`; never send it.
