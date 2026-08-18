# Omnisend HTML Clipboard Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export the editor's confirmed component HTML by uploading only its local image assets to Omnisend, replacing every local reference with the returned HTTPS URL, and copying the final HTML to the browser clipboard without writing a Campaign.

**Architecture:** Add a narrow image-only export transaction to the existing Omnisend uploader module. The editor server builds a transient deferred-local-assets HTML source, invokes that transaction, and returns the complete replacement HTML without persisting it. The browser owns clipboard delivery through a dedicated dialog and keeps a visible manual-copy fallback only when the Clipboard API rejects the write.

**Tech Stack:** Node.js ES modules, Node test runner, local HTTP editor server, native `fetch`/`FormData`/`Blob`, browser `navigator.clipboard`, Omnisend Images API.

**Spec:** `docs/superpowers/specs/2026-08-18-omnisend-html-clipboard-export-design.md`

## Global Constraints

- Only `POST https://api.omnisend.com/api/images/upload` is permitted for the export transaction; Campaign, Email Content, Template, send, schedule, and publish endpoints are forbidden.
- Require a non-empty runtime API Key, never store or log it, and clear request/UI references on all terminal paths.
- Require a non-empty fully confirmed editor draft before export; compose with `--defer-local-assets`.
- Each unique `asset://<id>` is uploaded once and every occurrence is replaced by its Omnisend public HTTPS URL.
- Reject output containing unresolved `asset://`, local/relative image paths, or unresolved `{{content.*}}` / `{{settings.*}}` placeholders.
- Copy only complete validated HTML; Clipboard API failure must expose a manual-copy fallback and must not trigger any further Omnisend requests.
- Do not persist exported HTML, API Keys, or export receipts in project state, draft state, files, logs, or UI state.
- This export is not proof of Omnisend import or inbox-client rendering.
- Preserve unrelated dirty-worktree changes; do not commit unless the user explicitly requests a scoped commit.

---

### Task 1: Add the image-only HTML export transaction

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs:1-410`
- Test: `tests/upload-omnisend-draft.test.mjs`

**Interfaces:**
- Consumes: `{ html, assets, readFile, transport }`, where each `assets[id]` is `{ localPath, name, mimeType }` and `transport(request)` returns `{ status, json }`.
- Produces: `createOmnisendHtmlExportTransaction(...).run(apiKey) -> Promise<{ html, htmlSha256, uploadedImageIDs }>`.
- Preserves: `createDraftUploadTransaction` and `runDraftUploadWithApiKey` behavior and endpoint allowlist.

- [ ] **Step 1: Write the failing image-only export tests**

  Add tests that call the new transaction with one `asset://hero` used in `background`, `src`, and `background-image`, then assert one image request, three replacements, no `asset://`, and the returned Omnisend HTTPS URL. Add a second test whose transport records every request and assert `calls.map(({ method, url }) => [method, new URL(url).pathname])` equals only `[['POST', '/api/images/upload']]`. Add failure tests for an empty runtime key, a 5 MB-plus image, a non-image MIME type, and an upload response without a public HTTPS URL.

  ```js
  const transaction = createOmnisendHtmlExportTransaction({
    html: '<table background="asset://hero"><tr><td style="background-image:url(asset://hero)"><img src="asset://hero"></td></tr></table>',
    assets: { hero: { localPath: 'hero.png', name: 'hero.png', mimeType: 'image/png' } },
    readFile: async () => new Uint8Array([1, 2, 3]),
    transport
  });
  const result = await transaction.run('runtime-key');
  assert.equal(calls.filter(({ url }) => url.endsWith('/api/images/upload')).length, 1);
  assert.equal((result.html.match(/https:\/\/app\.omnisend\.com\/images\/hero-1/g) ?? []).length, 3);
  assert.doesNotMatch(result.html, /asset:\/\//);
  ```

- [ ] **Step 2: Run the new exporter tests and confirm RED**

  Run: `node --test tests/upload-omnisend-draft.test.mjs`

  Expected: the newly added tests fail because `createOmnisendHtmlExportTransaction` is not exported.

- [ ] **Step 3: Implement shared local-asset replacement and the export transaction**

  Extract an internal helper that validates asset metadata, uploads each `new Set(assetReferences(html))` entry with the existing `FormData` payload, and substitutes a returned image URL in every `asset://<id>` occurrence. Add `assertExportSafeHtml(html)` to reject unresolved asset references, `file:` URLs, relative `src` paths, and `{{content.` / `{{settings.` placeholders. Export the new factory and make its `request()` helper allow only the images-upload endpoint.

  ```js
  export function createOmnisendHtmlExportTransaction({ html, assets, readFile, transport }) {
    return {
      async run(apiKey) {
        assert(typeof apiKey === 'string' && apiKey.trim(), 'a non-empty runtime API key is required');
        const { finalHtml, uploadedImageIDs } = await uploadAndReplaceLocalAssets({ html, assets, readFile, request });
        assertExportSafeHtml(finalHtml);
        return { html: finalHtml, htmlSha256: sha256(finalHtml), uploadedImageIDs };
      }
    };
  }
  ```

- [ ] **Step 4: Run exporter and existing Draft-upload tests to confirm GREEN**

  Run: `node --test tests/upload-omnisend-draft.test.mjs`

  Expected: all export and existing Draft transaction tests pass; no test observes a non-image export request.

- [ ] **Step 5: Review the extraction boundary**

  Confirm the Draft transaction uses the same replacement helper while retaining its preflight, unsubscribe, Campaign, Template, and readback rules. Keep export-specific checks separate so export never inherits Draft writes.

### Task 2: Expose a transient editor export endpoint

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs:1-430`
- Test: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Consumes: `POST /api/drafts/:draftId/export-omnisend-html` with JSON `{ apiKey }`.
- Produces: `{ html, htmlSha256, uploadedImageIDs }` on success; no `project-state.v1.json`, receipt, Campaign, or Template write.
- Uses: `createOmnisendHtmlExportTransaction` from Task 1, the existing `compositionFor` and builder path, plus a new in-memory `assetExportMap(draft, workspaceRoot)` that resolves each asset to an absolute `localPath`.

- [ ] **Step 1: Write failing endpoint tests**

  Inject an `runHtmlExporter` dependency into `createCampaignEditorServer` in the same way the existing `runDraftUploader` is injected. Assert an unconfirmed draft returns 400; a confirmed footer-only draft calls the exporter once with its generated `campaign.static-safe.html`; the successful JSON includes replacement HTML; the API key is absent from session files; and no `project-state.v1.json` or `omnisend-draft-receipt.v1.json` exists.

  ```js
  const exported = await request(baseUrl, `/api/drafts/${draftId}/export-omnisend-html`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: 'one-time-export-key' })
  });
  assert.equal(exported.response.status, 200, exported.body?.error);
  assert.match(exported.body.html, /https:\/\/app\.omnisend\.com\/images\/hero-1/);
  assert.equal(existsSync(join(sessionDirectory, 'project-state.v1.json')), false);
  assert.doesNotMatch(readFileSync(calls[0].htmlPath, 'utf8'), /one-time-export-key/);
  ```

- [ ] **Step 2: Run the editor-server tests and confirm RED**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: the new route tests fail with an endpoint-not-found response or missing injected exporter.

- [ ] **Step 3: Implement `exportOmnisendHtml` and its POST route**

  Add `assetExportMap(draft, workspaceRoot)` that returns the `buildLocalAssetMap` entries with absolute `localPath`, filename, and MIME type in memory. Add `defaultHtmlExporter({ html, assets, apiKey })` that constructs Task 1's transaction using `readFileFromDisk` and the existing Omnisend transport. In `exportOmnisendHtml`, call `assertFullyConfirmed`, write the transient composition only to the existing draft session directory, run the builder with `--defer-local-assets`, build export metadata in memory, invoke the exporter, and return its result. In a `finally`, clear `apiKey` and `body.apiKey`; do not update `draft.upload` or write project/receipt files.

  ```js
  const exportMatch = path.match(/^\/api\/drafts\/([0-9a-f-]+)\/export-omnisend-html$/u);
  if (exportMatch && request.method === 'POST') {
    const draft = drafts.get(exportMatch[1]);
    if (!draft) return json(response, 404, { error: 'draft not found' });
    const body = await readBody(request);
    let apiKey = body.apiKey;
    try { return json(response, 200, await exportOmnisendHtml(draft, apiKey)); }
    finally { apiKey = ''; body.apiKey = ''; }
  }
  ```

- [ ] **Step 4: Run the editor-server tests and confirm GREEN**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: all endpoint tests pass, including rejection of unconfirmed or empty drafts and zero Draft-upload calls for export.

- [ ] **Step 5: Inspect the response persistence boundary**

  Verify `draftSummary`, `draft.upload`, and any session receipt writer do not receive the returned HTML, hash, uploaded IDs, or API key.

### Task 3: Add the one-click clipboard export UI and fallback

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/editor/public/index.html:1-60`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/app.js:1-390`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/styles.css`
- Test: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Consumes: `POST /api/drafts/:draftId/export-omnisend-html` response from Task 2.
- Produces: a Clipboard API write or a modal textarea containing the exact server-returned final HTML.
- Does not call: `/prepare-omnisend-draft` or `/upload-omnisend-draft` from the export handler.

- [ ] **Step 1: Write failing static UI-contract tests**

  Assert `index.html` includes `id="export-omnisend-html"`, a separate `id="omnisend-export-dialog"`, an export-key input, and a readonly fallback textarea. Assert `app.js` contains `navigator.clipboard.writeText(exported.html)`, clears the export API key in `finally`, calls `/export-omnisend-html`, and the extracted `exportOmnisendHtml()` function does not contain Draft preparation/upload route strings.

  ```js
  assert.match(editorHtml, /id="export-omnisend-html"/);
  assert.match(editorHtml, /id="omnisend-export-dialog"/);
  assert.match(client, /navigator\.clipboard\.writeText\(exported\.html\)/);
  const handler = client.match(/async function exportOmnisendHtml\(\) \{([\s\S]*?)\n\}/u)?.[1] ?? '';
  assert.match(handler, /\/export-omnisend-html/);
  assert.doesNotMatch(handler, /prepare-omnisend-draft|upload-omnisend-draft/);
  ```

- [ ] **Step 2: Run the editor UI-contract tests and confirm RED**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: the new UI assertions fail because no export control, dialog, or Clipboard API handler exists.

- [ ] **Step 3: Implement separate export dialog, handler, and fallback**

  Add a top-level “导出 Omnisend HTML” button and a dialog containing only API Key, show/hide control, cancel, and “上传图片并复制 HTML” submit button. Implement `requestOmnisendHtmlExport()` with its own resolver and cleanup. In `exportOmnisendHtml()`, flush pending edits, collect the key, call the export endpoint, then attempt `await navigator.clipboard.writeText(exported.html)`. On Clipboard API rejection, place the returned string into the readonly fallback textarea, open its dialog, and do not repeat the server export call.

  ```js
  let exported;
  try {
    exported = await api(`/api/drafts/${state.draft.id}/export-omnisend-html`, {
      method: 'POST', body: JSON.stringify({ apiKey: request.apiKey })
    });
    await navigator.clipboard.writeText(exported.html);
    window.alert(`已上传 ${exported.uploadedImageIDs.length} 张图片并复制 Omnisend HTML。`);
  } catch (error) {
    showHtmlCopyFallback(exported?.html ?? '');
    if (!exported?.html) window.alert(error.message);
  } finally {
    request.apiKey = '';
    omnisendExportApiKeyInput.value = '';
  }
  ```

- [ ] **Step 4: Run UI-contract tests and confirm GREEN**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: all UI contract tests pass and the export handler is independent of Draft upload.

- [ ] **Step 5: Check dialog accessibility and sensitive-data clearing**

  Confirm each dialog has a labelled heading, focus is placed on its API Key field, API Key inputs use `type="password"` with `autocomplete="off"`, and cancel/close/error paths clear the input and resolver.

### Task 4: Update the Campaign Skill instructions and safety reference

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Test: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Documents: the export button's image-only behavior, confirmation precondition, one-time key handling, clipboard fallback, and non-equivalence to a real Omnisend/inbox render test.
- Preserves: existing Draft-upload instructions and their stronger Campaign readback behavior.

- [ ] **Step 1: Write failing documentation assertions**

  Add assertions that `SKILL.md` names “导出 Omnisend HTML”, says it uploads local images and copies final HTML, and explicitly says it does not create or update Campaign. Add assertions that the safety reference forbids persistence of the API key, returned HTML, and export receipt.

  ```js
  assert.match(skill, /导出 Omnisend HTML/);
  assert.match(skill, /不创建、不更新.*Campaign/);
  assert.match(safety, /不.*持久化.*API Key.*HTML.*收据/s);
  ```

- [ ] **Step 2: Run the documentation assertions and confirm RED**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: the new documentation assertions fail before the workflow language is added.

- [ ] **Step 3: Add the narrow export workflow documentation**

  In `SKILL.md`, add a short visual-editor paragraph describing the distinct export button and the fact that only images are uploaded. In the safety reference, add a dedicated export subsection that requires all components confirmed, a transient final HTML response, key and response cleanup, and a clear boundary that static export is not platform/client validation.

- [ ] **Step 4: Run documentation assertions and confirm GREEN**

  Run: `node --test tests/campaign-editor-server.test.mjs`

  Expected: all documentation and editor-server tests pass.

### Task 5: Run end-to-end local verification and validate the updated Skill

**Files:**
- Verify: `tests/upload-omnisend-draft.test.mjs`
- Verify: `tests/campaign-editor-server.test.mjs`
- Verify: `tests/campaign-editor-core.test.mjs`
- Verify: `tests/build-email-template.v1.test.mjs`
- Verify: `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`
- Verify: `skills/build-omnisend-campaign-draft/`

**Interfaces:**
- Verifies: Task 1 export transaction, Task 2 HTTP endpoint, Task 3 clipboard UI contract, and Task 4 Skill instructions.

- [ ] **Step 1: Run focused exporter and editor tests**

  Run: `node --test tests/upload-omnisend-draft.test.mjs tests/campaign-editor-server.test.mjs tests/campaign-editor-core.test.mjs`

  Expected: all focused tests pass with mocked Omnisend transport; no live Omnisend API request occurs.

- [ ] **Step 2: Run the component assembler regression suite**

  Run: `node --test tests/build-email-template.v1.test.mjs`

  Expected: all component build and preview regression tests pass.

- [ ] **Step 3: Run the Campaign contract validator**

  Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

  Expected: the validator reports the current selectable catalog and no contract error.

- [ ] **Step 4: Validate the updated Skill package**

  Run: `python3 /Users/ww/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/build-omnisend-campaign-draft`

  Expected: the skill validator exits 0 without frontmatter or unfinished-placeholder errors.

- [ ] **Step 5: Inspect the scoped diff and report known runtime boundaries**

  Run: `git diff --check -- skills/build-omnisend-campaign-draft tests/upload-omnisend-draft.test.mjs tests/campaign-editor-server.test.mjs docs/superpowers/specs/2026-08-18-omnisend-html-clipboard-export-design.md docs/superpowers/plans/2026-08-18-omnisend-html-clipboard-export.md`

  Expected: no whitespace errors. Report that the tests mock Omnisend and that a real editor export still requires the user to enter an API Key and verify the copied code in Omnisend.
