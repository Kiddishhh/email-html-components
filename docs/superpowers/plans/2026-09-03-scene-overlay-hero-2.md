# 场景文字叠层头图2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the editable `hero.sceneOverlayCta2` Labor Day scene-overlay hero and make it selectable in the local Campaign HTML editor.

**Architecture:** The component is an email-safe nested-table hero under `头图/场景文字叠层头图2`. Its schemas and fixtures own all editable values; `组件清单.json` supplies the catalog entry and `editor-ui-contract.mjs` supplies the editor whitelist.

**Tech Stack:** Node.js ESM, JSON schemas, table HTML with inline CSS, Node test runner, Campaign editor catalog.

**Spec:** `docs/superpowers/specs/2026-09-03-scene-overlay-hero-2-design.md`

## Global Constraints

- Use component key `hero.sceneOverlayCta2` and Chinese name `场景文字叠层头图2`.
- Keep a 600px canvas: 56px navigation plus 632px hero; use inline `min()` overrides for every nonzero fixed visual dimension at 375px.
- Use email-safe table HTML only; do not introduce JavaScript, Flex, Grid, positioning, `<style>`, iframe or form markup.
- Keep fixture assets as `asset://` local-preview references and resolve public HTTPS assets only during existing export flow.
- Do not alter unrelated dirty worktree changes or write to Omnisend.

---

### Task 1: Define component contract and registration

**Files:**
- Create: `tests/scene-overlay-hero-2.test.mjs`
- Modify: `组件清单.json`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs`

**Interfaces:**
- Consumes: `buildEditorCatalog({ workspaceRoot })`, `editableFieldKeys(componentKey)`, `editorFieldCopy(componentKey, scope, key)`.
- Produces: the registry record and exact editor field whitelist for `hero.sceneOverlayCta2`.

- [ ] **Step 1: Write the failing registration test**

```js
const componentKey = 'hero.sceneOverlayCta2';
const contentFields = [
  'navigation.message', 'navigation.cta.text', 'navigation.cta.url',
  'hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.linkUrl',
  'brand.logo.url', 'brand.logo.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle'
];
assert.ok(buildEditorCatalog({ workspaceRoot: root }).some((item) => item.componentKey === componentKey));
assert.deepEqual(editableFieldKeys(componentKey), {
  content: contentFields,
  settings: ['navigation.visible', 'color.navigationLeft', 'color.navigationRight', 'color.navigationText', 'color.surface', 'color.text']
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: FAIL because `hero.sceneOverlayCta2` is not registered.

- [ ] **Step 3: Add the registry record and editor contract**

Add `场景文字叠层头图2` in the `头图` catalog section with `输出宽度: 600`, `移动端断点: 375`, and all seven component paths. Add the Step 1 content array and settings array to `editableByComponent`; add Chinese field labels for `navigation.message`, `navigation.cta.text`, `navigation.cta.url` and `hero.linkUrl`.

- [ ] **Step 4: Run registration test checkpoint**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: the catalog and field-contract assertions pass, while missing component files still fail.

- [ ] **Step 5: Commit checkpoint**

```bash
git add tests/scene-overlay-hero-2.test.mjs 组件清单.json skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs
git commit -m "test: define scene overlay hero 2 contract"
```

### Task 2: Implement the email-safe component package

**Files:**
- Create: `头图/场景文字叠层头图2/component.template.v1.html`
- Create: `头图/场景文字叠层头图2/component.styles.v1.css`
- Create: `头图/场景文字叠层头图2/content.schema.v1.json`
- Create: `头图/场景文字叠层头图2/settings.schema.v1.json`
- Create: `头图/场景文字叠层头图2/content.fixture.v1.json`
- Create: `头图/场景文字叠层头图2/settings.defaults.v1.json`
- Create: `头图/场景文字叠层头图2/assets/default-labor-day-scene.jpg`
- Create: `头图/场景文字叠层头图2/assets/default-labor-day-logo.png`
- Create: `头图/场景文字叠层头图2/效果演示.html`
- Modify: `tests/scene-overlay-hero-2.test.mjs`

**Interfaces:**
- Consumes: the registry and editor contract from Task 1 plus existing template tokens such as `{{content.hero.title}}`.
- Produces: a `full-component-rerender` package with 11 content fields, six settings fields, two preview assets and a matching demo.

- [ ] **Step 1: Extend the test with render and safety assertions**

```js
assert.match(html, /width="600" height="632"/);
assert.match(html, /height:632px;height:min\(632px,105\.333333vw\)/);
assert.match(html, /height="56"[\s\S]*?height:min\(56px,9\.333333vw\)/);
assert.match(html, /font-size:39px;font-size:min\(39px,6\.5vw\)/);
assert.match(html, /font-size:62px;font-size:min\(62px,10\.333333vw\)/);
assert.doesNotMatch(html, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|<script\b|<iframe\b/i);
```

- [ ] **Step 2: Run test and verify it fails**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: FAIL because the template, fixture and assets are absent.

- [ ] **Step 3: Implement schemas, fixture, template and demo**

Use `full-component-rerender`, HTTPS URL validation and `additionalProperties: false`. Navigation uses `FRESHINE_IF_SETTING:navigation.visible`; when disabled it is omitted entirely. The hero alone is whole-click and retains the supplied gradient, centered cover crop, 104px logo, `Labor Day Sale`, `UP TO 65% Off`, and two-line subtitle.

Use these defaults:

```text
navigation.cta.url=https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc
hero.linkUrl=https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=cover-fc
```

Copy the supplied reference scene and Logo as local preview assets. Fixture values reference `asset://labor-day-scene` and `asset://labor-day-logo`; `效果演示.html` mirrors the template geometry with public preview URLs.

- [ ] **Step 4: Run focused test and verify it passes**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: PASS with local asset rendering, UTM links, dimensions and email safety verified.

- [ ] **Step 5: Commit checkpoint**

```bash
git add 头图/场景文字叠层头图2 tests/scene-overlay-hero-2.test.mjs
git commit -m "feat: add scene overlay hero 2"
```

### Task 3: Add user-facing component documentation

**Files:**
- Create: `头图/场景文字叠层头图2/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `组件索引.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `tests/scene-overlay-hero-2.test.mjs`

**Interfaces:**
- Consumes: the complete package from Task 2.
- Produces: an indexed component, management guide and interaction contract describing exposed fields and fixed visual behavior.

- [ ] **Step 1: Add failing documentation assertions**

```js
assert.ok(existsSync(resolve(componentDirectory, 'COMPONENT_MANAGEMENT.zh-CN.v1.md')));
assert.match(readFileSync(resolve(root, '组件索引.md'), 'utf8'), /场景文字叠层头图2/);
assert.match(readFileSync(resolve(root, 'skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md'), 'utf8'), /hero\.sceneOverlayCta2/);
```

- [ ] **Step 2: Run test and verify it fails**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: FAIL because guide and index entries are absent.

- [ ] **Step 3: Document fixed and editable behavior**

Document the 600px/375px geometry, whole-hero versus SIGN UP link boundaries, navigation toggle, editable content/settings, fixed typography/gradient and HTTPS export boundary. Add management-guide, index and interaction-reference entries.

- [ ] **Step 4: Run focused test and verify it passes**

Run: `node --test tests/scene-overlay-hero-2.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

```bash
git add 头图/场景文字叠层头图2/COMPONENT_MANAGEMENT.zh-CN.v1.md 组件索引.md skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md tests/scene-overlay-hero-2.test.mjs
git commit -m "docs: register scene overlay hero 2 usage"
```

### Task 4: Validate component and editor behavior

**Files:**
- Test: `tests/scene-overlay-hero-2.test.mjs`
- Test: `tests/mobile-proportional-contract.test.mjs`

**Interfaces:**
- Consumes: the registered component package from Tasks 1–3.
- Produces: static, responsive and local-editor evidence for the new component.

- [ ] **Step 1: Run contract validation**

Run: `node --test tests/scene-overlay-hero-2.test.mjs && node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: both commands exit 0.

- [ ] **Step 2: Run mobile proportional validation**

Run: `node scripts/normalize-inline-mobile-dimensions.mjs --check && node --test tests/mobile-proportional-contract.test.mjs`

Expected: both commands exit 0 with no desktop-only fixed visual sizes in the new template or demo.

- [ ] **Step 3: Run full checks**

Run: `node --test tests/*.test.mjs && git diff --check`

Expected: all tests pass and `git diff --check` has no output.

- [ ] **Step 4: Verify in the local editor**

Run: `node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173`

Open `http://127.0.0.1:4173`, add `场景文字叠层头图2`, edit every exposed field, toggle navigation, inspect 600px and 375px previews, and confirm local assets, separate links and zero browser-console errors.

- [ ] **Step 5: Commit verification checkpoint**

```bash
git add tests/scene-overlay-hero-2.test.mjs
git commit -m "test: verify scene overlay hero 2"
```
