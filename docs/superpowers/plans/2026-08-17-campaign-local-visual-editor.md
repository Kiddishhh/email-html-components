# Campaign Local Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Campaign Skill automatically open a local editor that builds and uploads only verified Omnisend drafts.

**Architecture:** Add a loopback-only Node HTTP server and a small static editor. The server reads the current registry and Campaign contracts, persists only scoped local drafts/assets, delegates local email rendering to the current assembler, and delegates remote writes exclusively to the existing Draft-safe uploader.

**Tech Stack:** Node.js built-ins (`http`, `fs`, `child_process`), vanilla HTML/CSS/JavaScript, `node:test`.

## Global Constraints

- Bind the editor only to `127.0.0.1`.
- Expose exactly the six Campaign structure slots; never add optional registry components.
- Use component `效果演示.html` for selection previews.
- Store drafts only below `campaign-drafts/<safe-slug>/`.
- Accept local images only as JPEG, PNG, GIF, or WebP no larger than 5 MB.
- Build previews locally at 600px and 375px; do not emit sendable HTML from the editor UI.
- Call Omnisend only via `upload-omnisend-draft.mjs` after a matching final content hash confirmation.
- Permit only create/update/readback of Campaigns with `status: draft`; never expose publish, send, schedule, or activate actions.

---

## File Structure

- Create: `skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs` — loopback HTTP handler, data loading, draft and asset persistence, local rendering, Draft upload delegation.
- Create: `skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs` — validates contracts, starts the detached loopback server, returns the URL.
- Create: `skills/build-omnisend-campaign-draft/editor/index.html` — accessible editor structure and controls.
- Create: `skills/build-omnisend-campaign-draft/editor/app.js` — bootstrap fetch, editing state, preview loading, asset upload, confirmation and Draft upload actions.
- Create: `skills/build-omnisend-campaign-draft/editor/styles.css` — desktop application shell and 600px/375px preview frames.
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md` — require editor startup and in-app opening before content collection.
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs` — Skill/editor contract assertions.
- Create: `tests/campaign-editor-server.test.mjs` — server, persistence, preview and upload safety tests.

### Task 1: Loopback server bootstrap and Campaign data boundary

**Files:**
- Create: `skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs`
- Create: `skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs`
- Test: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Produces `createCampaignEditorServer({ workspaceRoot, host, port })` returning `{ server, url, close }`.
- Produces `loadEditorBootstrap(workspaceRoot)` returning `{ slots, components }`.
- Consumes `组件清单.json`, `campaign-structure.v1.json`, `campaign-component-interactions.v1.json`, and the existing validator.

- [ ] **Step 1: Write the failing bootstrap test**

```js
test('editor bootstrap exposes only validated six-slot Campaign candidates', async () => {
  const payload = loadEditorBootstrap(workspaceRoot);
  assert.deepEqual(payload.slots.map(({ id }) => id), ['hero', 'sale-grid', 'clickable-image', 'gift', 'location', 'footer']);
  assert.equal(payload.components.every(({ componentKey }) => !componentKey.startsWith('review.')), true);
  assert.equal(payload.components.every(({ demoUrl }) => demoUrl.endsWith('/效果演示.html')), true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: FAIL because `campaign-editor-server.mjs` does not exist.

- [ ] **Step 3: Implement the validated bootstrap and server factory**

```js
export function loadEditorBootstrap(workspaceRoot) {
  const slots = readJson(join(workspaceRoot, 'skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json')).slots;
  const interactions = new Map(readJson(join(workspaceRoot, 'skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json')).interactions.map((entry) => [entry.componentKey, entry]));
  const registry = readJson(join(workspaceRoot, '组件清单.json'));
  const components = slots.flatMap((slot) => slot.candidateComponentKeys).map((componentKey) => {
    const entry = registry.find((item) => item.componentKey === componentKey);
    if (!entry || !interactions.has(componentKey)) throw new Error(`Campaign candidate is unavailable: ${componentKey}`);
    return { slotId: slots.find((slot) => slot.candidateComponentKeys.includes(componentKey)).id, componentKey, name: entry.中文名称, demoUrl: demoUrlFor(entry) };
  });
  return { slots, components };
}

export async function createCampaignEditorServer({ workspaceRoot, host = '127.0.0.1', port = 0 }) { /* serve GET /api/bootstrap only on loopback */ }
```

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: PASS, with a loopback-only URL and the six fixed slots in order.

- [ ] **Step 5: Add a failing startup-script test and implementation**

```js
const result = spawnSync(process.execPath, [startScript, '--port', '0', '--no-open'], { cwd: workspaceRoot, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /http:\/\/127\.0\.0\.1:\d+\//);
```

Implement `start-campaign-editor.mjs` to run the validator, spawn the server detached with the approved loopback host, and print one URL. `--no-open` is test-only; the normal invocation opens the URL through the local app/browser.

- [ ] **Step 6: Run the startup test and commit**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: PASS.

```bash
git add skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs tests/campaign-editor-server.test.mjs
git commit -m "feat: add local Campaign editor server"
```

### Task 2: Scoped drafts, local images, and local previews

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs`
- Modify: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Produces `safeDraftPath(workspaceRoot, slug)` and `writeDraft({ workspaceRoot, slug, state })`.
- Produces `saveAsset({ workspaceRoot, slug, filename, contentType, bytes })` returning `{ assetId, localPath }`.
- Provides `PUT /api/drafts/:slug`, `POST /api/drafts/:slug/assets`, and `POST /api/drafts/:slug/preview`.
- Consumes the existing `build-email-template.v1.mjs` via `--preview-local-assets` only.

- [ ] **Step 1: Write failing persistence and path-safety tests**

```js
assert.throws(() => safeDraftPath(workspaceRoot, '../outside'), /slug/);
const saved = writeDraft({ workspaceRoot, slug: 'late-summer-sale', state: validProjectState });
assert.deepEqual(readJson(saved), validProjectState);
assert.throws(() => saveAsset({ workspaceRoot, slug: 'late-summer-sale', filename: 'bad.svg', contentType: 'image/svg+xml', bytes: Buffer.from('<svg/>') }), /supported image/);
```

- [ ] **Step 2: Run the persistence tests to verify they fail**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: FAIL because scoped persistence helpers are absent.

- [ ] **Step 3: Implement scoped storage and preview generation**

```js
export function safeDraftPath(workspaceRoot, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('draft slug is invalid');
  return join(workspaceRoot, 'campaign-drafts', slug);
}

export function saveAsset({ workspaceRoot, slug, filename, contentType, bytes }) {
  if (!IMAGE_TYPES.has(contentType) || bytes.length > 5 * 1024 * 1024) throw new Error('unsupported image');
  const path = join(safeDraftPath(workspaceRoot, slug), 'assets', `${randomUUID()}-${basename(filename)}`);
  writeFileSync(path, bytes, { flag: 'wx' });
  return { assetId: basename(path).split('.')[0], localPath: relative(workspaceRoot, path) };
}
```

Generate a validated composition with exactly six complete snapshots and invoke the assembler with `--preview-local-assets`; return the generated preview URL only.

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: PASS; all written paths stay under `campaign-drafts/` and preview generation uses local mode.

- [ ] **Step 5: Commit scoped persistence and preview support**

```bash
git add skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs tests/campaign-editor-server.test.mjs
git commit -m "feat: persist Campaign editor drafts locally"
```

### Task 3: Editor interface and live preview controls

**Files:**
- Create: `skills/build-omnisend-campaign-draft/editor/index.html`
- Create: `skills/build-omnisend-campaign-draft/editor/app.js`
- Create: `skills/build-omnisend-campaign-draft/editor/styles.css`
- Modify: `tests/campaign-editor-server.test.mjs`

**Interfaces:**
- Consumes `GET /api/bootstrap`, `PUT /api/drafts/:slug`, `POST /api/drafts/:slug/assets`, and `POST /api/drafts/:slug/preview`.
- Produces `window.editorState` with `{ slug, campaign, components, finalConfirmation: null }` for deterministic UI tests. Task 4 alone creates the static-safe HTML hash and replaces this `null` value after an explicit final confirmation.

- [ ] **Step 1: Write failing static editor contract tests**

```js
const html = readFileSync(editorIndex, 'utf8');
const app = readFileSync(editorApp, 'utf8');
assert.match(html, /data-editor-preview="desktop"/);
assert.match(html, /data-editor-preview="mobile"/);
assert.match(html, /type="file"[^>]*accept="image\/jpeg,image\/png,image\/gif,image\/webp"/);
assert.match(app, /\/api\/bootstrap/);
assert.doesNotMatch(`${html}\n${app}`, /api\.omnisend\.com|\/send|publish|schedule|activate/);
```

- [ ] **Step 2: Run the UI contract tests to verify they fail**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: FAIL because editor assets do not exist.

- [ ] **Step 3: Implement the static editor**

```html
<main class="editor-shell">
  <aside aria-label="Campaign settings" data-editor-panel="settings"></aside>
  <section aria-label="Component fields" data-editor-panel="fields"></section>
  <section aria-label="Email previews"><iframe data-editor-preview="desktop" title="600px desktop preview"></iframe><iframe data-editor-preview="mobile" title="375px mobile preview"></iframe></section>
</main>
```

Implement `app.js` with `fetch('/api/bootstrap')`, schema-driven fields, binary local-image uploads using `fetch` to the scoped asset endpoint, and debounced save/preview. Keep `finalConfirmation` as `null`; this task must not create static-safe HTML, calculate a confirmation hash, or expose an upload action. Use no third-party scripts and no external service calls.

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `node --test tests/campaign-editor-server.test.mjs`

Expected: PASS; the page has both preview frames and local-image control with no remote call path.

- [ ] **Step 5: Commit the editor interface**

```bash
git add skills/build-omnisend-campaign-draft/editor tests/campaign-editor-server.test.mjs
git commit -m "feat: add Campaign visual editor interface"
```

### Task 4: Confirmed Draft-only upload and Skill handoff

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs`
- Modify: `skills/build-omnisend-campaign-draft/editor/index.html`
- Modify: `skills/build-omnisend-campaign-draft/editor/app.js`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `tests/campaign-editor-server.test.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Provides `POST /api/drafts/:slug/upload` with `{ confirmedStaticHtmlSha256 }`.
- Consumes `upload-omnisend-draft.mjs --project <project-state.v1.json> --html <campaign.static-safe.html>` exactly once after confirmation.
- Produces a sanitized `{ campaignID, contentID, status: 'draft' }` receipt.

- [ ] **Step 1: Write failing Draft-only upload tests**

```js
const stale = await request(server.url, '/api/drafts/late-summer-sale/upload', { method: 'POST', body: JSON.stringify({ confirmedStaticHtmlSha256: 'stale' }) });
assert.equal(stale.status, 409);
assert.match(stale.text, /confirmation/i);
assert.match(readFileSync(skillPath, 'utf8'), /start-campaign-editor\.mjs/);
assert.match(readFileSync(skillPath, 'utf8'), /Draft|draft/);
assert.doesNotMatch(readFileSync(serverPath, 'utf8'), /\/send|\/publish|\/schedule|\/activate/);
```

- [ ] **Step 2: Run the Draft-only tests to verify they fail**

Run: `node --test tests/campaign-editor-server.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the endpoint and Skill startup instruction are absent.

- [ ] **Step 3: Implement the upload guard and Skill entry**

```js
if (request.method === 'POST' && pathname === `/api/drafts/${slug}/upload`) {
  const state = readDraft(workspaceRoot, slug);
  if (body.confirmedStaticHtmlSha256 !== state.finalConfirmation?.confirmedStaticHtmlSha256) return json(response, 409, { error: 'final confirmation does not match current HTML' });
  return runFixedDraftUploader({ workspaceRoot, slug, state });
}
```

Add a disabled-by-default “上传 Omnisend 草稿” button. Enable it only after the exact preview hash is confirmed; prompt for the API key only in the server process; display the returned `draft` receipt. Update Skill step 1 to run the starter and open its printed URL in the in-app Browser. State that the UI must never expose sending, publishing, scheduling, or activation.

Task 4 must first generate the static-safe HTML on the local server, calculate its SHA-256, and write the exact value into `finalConfirmation`; it must not reuse the local-preview HTML or permit Task 3's preview state to satisfy the confirmation gate.

- [ ] **Step 4: Run all tests and manually verify the editor**

Run: `node --test tests/*.test.mjs`

Expected: PASS.

Run: `node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs --port 4317 --no-open`

Expected: a loopback URL; opening it shows the six fixed components, 600px and 375px preview frames, and a disabled Draft upload button before confirmation.

- [ ] **Step 5: Commit the Draft-only handoff**

```bash
git add skills/build-omnisend-campaign-draft tests/campaign-editor-server.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs
git commit -m "feat: open a Draft-only Campaign editor from the Skill"
```
