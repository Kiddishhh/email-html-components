# Non-Hero Centered Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the top-level centered title and subtitle typography of the three confirmed non-hero components with `gift.rewardGrid2` while preserving all other component styling and content.

**Architecture:** Keep typography values local to the existing email-safe inline styles. Add one focused Node test file that treats the double-gift card as the baseline, then update the three templates, their standalone demos, current component documentation, and the active Skill reference without adding Schema or editor fields.

**Tech Stack:** HTML email tables with inline CSS, Node.js 24 built-in test runner, JSON component registry/contracts, Markdown component and Skill documentation, local Campaign editor browser QA.

**Spec:** `docs/superpowers/specs/2026-08-20-non-hero-centered-typography-design.md`

## Global Constraints

- Only `collection.curtainPromotionCard`, `product.curtainRecommendationOverlay`, and `location.showroomCard` receive typography changes.
- Top-level centered titles use Lora `26px / 400 / 36px`; immediate centered subtitles use Montserrat `15px / 400 / 22px`.
- `showroom.address.line1` and `showroom.address.line2` remain Montserrat `16px / 400 / 25px`.
- Preserve every title/subtitle spacer, padding, maximum width, color, image, link, CTA, badge, product-level title, and component order.
- Do not modify any `hero.*` file, no-title variant, settings Schema/defaults, content Schema/fixture, component registry, editor registration, or shared renderer.
- Preserve all user-owned changes already present in the dirty worktree. Do not stage or commit implementation files unless the user explicitly asks for an implementation commit after QA.
- Before Task 1 and after Task 5, compare SHA-256 manifests for the complete `头图/` tree; identical manifests are required.
- Local browser QA proves only the current editor rendering, not Omnisend or inbox-client behavior.

---

## File Map

**Create**

- `tests/non-hero-centered-typography.test.mjs` — focused typography, baseline, preservation, demo, and documentation contract.

**Modify**

- `活动商品组件/单品窗帘促销卡/component.template.v1.html` — top promotion title/subtitle inline typography only.
- `活动商品组件/单品窗帘促销卡/效果演示.html` — synchronized rendered values and Lora 400 font request.
- `活动商品组件/单品窗帘促销卡/COMPONENT_MANAGEMENT.zh-CN.v1.md` — replace obsolete top typography numbers.
- `小样-产品/窗帘产品推荐卡II/component.template.v1.html` — `intro.title`/`intro.subtitle` inline typography only.
- `小样-产品/窗帘产品推荐卡II/效果演示.html` — synchronized values and Lora 400/500 font request.
- `小样-产品/窗帘产品推荐卡II/COMPONENT_MANAGEMENT.zh-CN.v1.md` — document the current top typography and exclusions.
- `地址组件/展厅地址卡/component.template.v1.html` — `showroom.title` weight and line-height only.
- `地址组件/展厅地址卡/效果演示.html` — synchronized title values only.
- `地址组件/展厅地址卡/COMPONENT_MANAGEMENT.zh-CN.v1.md` — document title baseline and unchanged address typography.
- `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md` — replace the obsolete blanket “no cross-component typography standard” statement with the scoped current rule.

**Inspect but do not modify**

- `赠品与权益组件/双赠品奖励卡/settings.defaults.v1.json`
- `赠品与权益组件/双赠品奖励卡/component.template.v1.html`
- `活动商品组件/六宫格折扣商品组件/component.template.v1.html`
- all files under `头图/`

---

### Task 1: Lock and implement `collection.curtainPromotionCard`

**Files:**

- Create: `tests/non-hero-centered-typography.test.mjs`
- Modify: `活动商品组件/单品窗帘促销卡/component.template.v1.html:8,12`
- Modify: `活动商品组件/单品窗帘促销卡/效果演示.html:9,15,17`

**Interfaces:**

- Consumes: existing `promotion.title`, `promotion.subtitle`, `settings.font.heading`, and `settings.font.body` slots.
- Produces: reusable real-builder `renderComponent`, `styleForSlot`, and `assertTypography` test helpers; the title/subtitle baseline constants used by later tasks.

- [ ] **Step 1: Capture the safety baseline before any implementation edit**

```bash
git status --short > /private/tmp/non-hero-typography-worktree.before.txt
find 头图 -type f -exec shasum -a 256 {} \; | LC_ALL=C sort > /private/tmp/non-hero-typography-hero.before.sha256
```

Expected: both commands exit 0. Do not clean, reset, or stage the existing dirty worktree.

- [ ] **Step 2: Write the first failing focused test**

Create `tests/non-hero-centered-typography.test.mjs` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const read = (relativePath) => readFileSync(`${root}/${relativePath}`, 'utf8');
const builder = `${root}/build-email-template.v1.mjs`;
const registry = JSON.parse(read('组件清单.json'));

const TITLE = { size: '26px', weight: '400', lineHeight: '36px' };
const SUBTITLE = { size: '15px', weight: '400', lineHeight: '22px' };
const ADDRESS = { size: '16px', weight: '400', lineHeight: '25px' };

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function styleForSlot(markup, slot) {
  const match = markup.match(new RegExp(`data-freshine-slot="${escapeRegExp(slot)}"[^>]*style="([^"]+)"`));
  assert.ok(match, `missing slot style: ${slot}`);
  return match[1];
}

function assertTypography(style, { family, size, weight, lineHeight }) {
  const declarations = new Set(style.split(';').filter(Boolean));
  assert.ok(declarations.has(`font-family:${family}`), style);
  assert.ok(declarations.has(`font-size:${size}`), style);
  assert.ok(declarations.has(`font-weight:${weight}`), style);
  assert.ok(declarations.has(`line-height:${lineHeight}`), style);
  assert.ok(declarations.has('text-align:center'), style);
}

function renderComponent(componentKey) {
  const entry = registry.find((candidate) => candidate.componentKey === componentKey);
  assert.ok(entry, `missing registry entry: ${componentKey}`);
  const directory = entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/, '');
  const fixture = JSON.parse(read(`${directory}/content.fixture.v1.json`));
  const defaults = JSON.parse(read(`${directory}/settings.defaults.v1.json`));
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-typography-'));
  const compositionPath = join(temporary, 'composition.json');
  const previewOutput = join(temporary, 'preview.html');
  const assets = Object.fromEntries(Object.entries(fixture.localReferenceAssets ?? {}).map(([id, relativePath]) => [id, {
    path: `${directory}/${relativePath}`,
    name: relativePath.split('/').at(-1)
  }]));
  writeFileSync(compositionPath, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: join(temporary, 'component.html'),
    previewOutput,
    assets,
    components: [{
      name: entry.中文名称,
      directory,
      componentKey,
      content: fixture.values,
      settings: defaults.values
    }]
  }, null, 2));
  const result = spawnSync(process.execPath, [builder, compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return readFileSync(previewOutput, 'utf8');
}

test('collection.curtainPromotionCard matches the double-gift header scale', () => {
  const output = renderComponent('collection.curtainPromotionCard');
  assertTypography(styleForSlot(output, 'promotion.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(output, 'promotion.subtitle'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
  const productTitle = new Set(styleForSlot(output, 'product.title').split(';').filter(Boolean));
  assert.ok(productTitle.has('font-size:27px'));
  assert.ok(productTitle.has('font-weight:600'));
  assert.ok(productTitle.has('line-height:34px'));
});
```

- [ ] **Step 3: Run the test and verify the red state**

Run:

```bash
node --test tests/non-hero-centered-typography.test.mjs
```

Expected: FAIL in `collection.curtainPromotionCard matches the double-gift header scale`, with the real builder output reporting the current 31/500/39 or 18/500/27 declarations.

- [ ] **Step 4: Apply the minimal template and demo changes**

In the template, replace only the top two typography declarations:

```html
<span class="freshine-curtain-promotion-title" data-freshine-slot="promotion.title" style="display:inline-block;max-width:100%;color:{{settings.color.text}};font-family:{{settings.font.heading}};font-size:26px;font-weight:400;line-height:36px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">{{content.promotion.title}}</span>
<span data-freshine-slot="promotion.subtitle" style="display:inline-block;max-width:100%;color:{{settings.color.body}};font-family:{{settings.font.body}};font-size:15px;font-weight:400;line-height:22px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">{{content.promotion.subtitle}}</span>
```

In `效果演示.html`, request Lora 400 instead of Lora 500 and render the same two values:

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400&amp;family=Montserrat:wght@400;500;600&amp;display=swap" rel="stylesheet">
<span style="color:#242321;font-family:Lora, Georgia, Times New Roman, serif;font-size:26px;font-weight:400;line-height:36px;text-align:center;">Upgrade Your Home in Style</span>
<span style="color:#3B3936;font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:22px;text-align:center;">Refresh Your Home With Our Latest Curtain Designs-Crafted To Bring A Clean, Modern Look And Effortless Comfort For The Year Ahead.</span>
```

- [ ] **Step 5: Verify the green state and the untouched card-level title**

Run:

```bash
node --test tests/non-hero-centered-typography.test.mjs
git diff --check -- tests/non-hero-centered-typography.test.mjs '活动商品组件/单品窗帘促销卡/component.template.v1.html' '活动商品组件/单品窗帘促销卡/效果演示.html'
```

Expected: 1/1 test passes; the whitespace check exits 0.

---

### Task 2: Lock and implement `product.curtainRecommendationOverlay`

**Files:**

- Modify: `tests/non-hero-centered-typography.test.mjs`
- Modify: `小样-产品/窗帘产品推荐卡II/component.template.v1.html:8,12`
- Modify: `小样-产品/窗帘产品推荐卡II/效果演示.html:7,16,18`

**Interfaces:**

- Consumes: test helpers and `TITLE`/`SUBTITLE` constants from Task 1.
- Produces: a locked top intro scale while preserving the 24/500/32 product name below the image.

- [ ] **Step 1: Append the failing recommendation-card test**

```js
test('product.curtainRecommendationOverlay matches the double-gift header scale', () => {
  const output = renderComponent('product.curtainRecommendationOverlay');
  assertTypography(styleForSlot(output, 'intro.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(output, 'intro.subtitle'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
  const productName = new Set(styleForSlot(output, 'product.name').split(';').filter(Boolean));
  assert.ok(productName.has('font-size:24px'));
  assert.ok(productName.has('font-weight:500'));
  assert.ok(productName.has('line-height:32px'));
});
```

- [ ] **Step 2: Run the test and verify the red state**

```bash
node --test --test-name-pattern='curtainRecommendationOverlay' tests/non-hero-centered-typography.test.mjs
```

Expected: FAIL, exposing the current title 34/600/42 and subtitle 18/500/26.

- [ ] **Step 3: Apply the minimal template and demo changes**

Use these exact template values:

```html
<span data-freshine-slot="intro.title" style="display:block;color:{{settings.color.text}};font-family:{{settings.font.display}};font-size:26px;font-weight:400;line-height:36px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">{{content.intro.title}}</span>
<span data-freshine-slot="intro.subtitle" style="display:block;color:{{settings.color.text}};font-family:{{settings.font.body}};font-size:15px;font-weight:400;line-height:22px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">{{content.intro.subtitle}}</span>
```

In `效果演示.html`, retain Lora 500 for `product.name`, add 400 for the top title, and remove unused 600:

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500&amp;family=Montserrat:wght@400;500;700&amp;display=swap" rel="stylesheet">
<span data-freshine-slot="intro.title" style="display:block;color:#202020;font-family:Lora, Georgia, Times New Roman, serif;font-size:26px;font-weight:400;line-height:36px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">Upgrade Your Home in Style</span>
<span data-freshine-slot="intro.subtitle" style="display:block;color:#202020;font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:15px;font-weight:400;line-height:22px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">Refresh Your Home With Our Latest Curtain Designs-Crafted To Bring A Clean, Modern Look And Effortless Comfort For The Year Ahead.</span>
```

- [ ] **Step 4: Run both focused tests**

```bash
node --test tests/non-hero-centered-typography.test.mjs
git diff --check -- '小样-产品/窗帘产品推荐卡II/component.template.v1.html' '小样-产品/窗帘产品推荐卡II/效果演示.html'
```

Expected: 2/2 tests pass; the existing product name assertion remains green.

---

### Task 3: Lock and implement `location.showroomCard`, plus the two baselines

**Files:**

- Modify: `tests/non-hero-centered-typography.test.mjs`
- Modify: `地址组件/展厅地址卡/component.template.v1.html:8`
- Modify: `地址组件/展厅地址卡/效果演示.html:22`

**Interfaces:**

- Consumes: Task 1 test helpers, `TITLE`, `SUBTITLE`, and `ADDRESS` constants.
- Produces: a standardized showroom title, explicit address preservation, and regression coverage for `gift.rewardGrid2` and `collection.saleGrid6`.

- [ ] **Step 1: Append the failing showroom and baseline tests**

```js
test('location.showroomCard aligns only its title and preserves both address lines', () => {
  const output = renderComponent('location.showroomCard');
  assertTypography(styleForSlot(output, 'showroom.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });

  for (const slot of ['showroom.address.line1', 'showroom.address.line2']) {
    assertTypography(styleForSlot(output, slot), {
      family: 'Montserrat, Arial, Helvetica, sans-serif',
      ...ADDRESS
    });
  }
});

test('double-gift and sale-grid retain the confirmed baseline', () => {
  const gift = renderComponent('gift.rewardGrid2');
  assertTypography(styleForSlot(gift, 'reward.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(gift, 'reward.rules[0]'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
  assertTypography(styleForSlot(gift, 'reward.rules[1]'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });

  const saleGrid = renderComponent('collection.saleGrid6');
  assertTypography(styleForSlot(saleGrid, 'saleCollection.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(saleGrid, 'saleCollection.body'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
});
```

- [ ] **Step 2: Run the test and verify only the showroom test is red**

```bash
node --test tests/non-hero-centered-typography.test.mjs
```

Expected: the baseline test passes; showroom fails on 26/500/37.

- [ ] **Step 3: Change only the showroom title declaration**

```html
<span data-freshine-slot="showroom.title" style="display:inline-block;max-width:460px;color:{{settings.color.text}};font-family:{{settings.font.heading}};font-size:26px;font-weight:400;line-height:36px;text-align:center;word-break:break-word;overflow-wrap:anywhere;">{{content.showroom.title}}</span>
```

Mirror the same 26/400/36 values in `效果演示.html`. Do not edit the two address spans.

- [ ] **Step 4: Run the full focused test file**

```bash
node --test tests/non-hero-centered-typography.test.mjs
git diff --check -- '地址组件/展厅地址卡/component.template.v1.html' '地址组件/展厅地址卡/效果演示.html'
```

Expected: 4/4 tests pass, including both address-line assertions.

---

### Task 4: Synchronize component documentation and the current Skill guide

**Files:**

- Modify: `活动商品组件/单品窗帘促销卡/COMPONENT_MANAGEMENT.zh-CN.v1.md:41-46`
- Modify: `小样-产品/窗帘产品推荐卡II/COMPONENT_MANAGEMENT.zh-CN.v1.md:40-43`
- Modify: `地址组件/展厅地址卡/COMPONENT_MANAGEMENT.zh-CN.v1.md:57-76`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md:3,40-43,74-77,91-94,108-111`

**Interfaces:**

- Consumes: the approved typography values and exclusions from Tasks 1–3.
- Produces: one current description used by humans and the Campaign Skill, plus RED/GREEN pressure-test evidence; no editor or renderer behavior changes.

- [ ] **Step 1: Before editing Skill resources, load the required Skill-authoring guidance**

Read completely:

```text
/Users/ww/.codex/skills/.system/skill-creator/SKILL.md
/Users/ww/.codex/plugins/cache/openai-curated-remote/superpowers/6.3.0/skills/writing-skills/SKILL.md
```

Follow their validation requirements. Do not edit unrelated Skill sections.

- [ ] **Step 2: Run the writing-skills RED pressure test against the current guidance**

Use a fresh agent that receives the current `skills/build-omnisend-campaign-draft/SKILL.md` and its referenced current component guide, then ask it to answer this realistic request without seeing the approved spec:

```text
将当前组件中所有类似的居中标题和副标题统一到双赠品卡的主标题和赠品规则，只调整非头图组件。请列出具体组件、字段、字体、字号、字重、行高，以及明确不调整的层级。
```

Expected RED evidence: the current guide's blanket “不做跨组件强制同款处理” rule prevents a deterministic answer or omits the exact 26/400/36 and 15/400/22 standard and the showroom-address exclusion. Save the pressure-test transcript in this plan's SDD workspace.

- [ ] **Step 4: Update the three component management guides with exact scoped wording**

The promotion-card guide must state:

```markdown
顶部标题固定使用 Lora `26px / 400 / 36px`，顶部说明固定使用 Montserrat `15px / 400 / 22px`。商品名继续使用 `27px / 600 / 34px`，商品卖点继续使用 `18px / 400 / 27px`；卡片内部文字不属于顶部居中排版统一范围。
```

The recommendation-card guide must state:

```markdown
- 顶部标题固定使用 Lora `26px / 400 / 36px`，顶部说明固定使用 Montserrat `15px / 400 / 22px`；产品名及下方左对齐文字保持组件自身层级。
```

The showroom guide must state:

```markdown
标题固定使用 Lora `26px / 400 / 36px`；图片下方地址正文继续使用 Montserrat `16px / 400 / 25px`，不按顶部副标题处理。
```

- [ ] **Step 5: Replace the obsolete Skill statement with the scoped current rule**

At the top of `component-interactions.zh-CN.md`, use:

```markdown
本指南只描述 `组件清单.json` 中当前登记的组件。所有组件使用 600px 邮件画布并在 375px 下验证。非头图组件的顶层居中主标题统一使用 Lora `26px / 400 / 36px`，顶层居中副标题、说明或规则统一使用 Montserrat `15px / 400 / 22px`；卡片内部文字、左对齐文字、页脚、评论与头图仍保持各组件自身层级。按钮和留白不做跨组件强制同款处理。
```

Add the same exact values to the fixed-style bullets for:

- `collection.curtainPromotionCard`
- `product.curtainRecommendationOverlay`
- `gift.rewardGrid2` as the baseline
- `location.showroomCard`, explicitly preserving address 16/400/25

Do not change `skills/build-omnisend-campaign-draft/SKILL.md`, README, component index, Schema, or editor mappings because none contains an obsolete typography value.

- [ ] **Step 6: Run the writing-skills GREEN pressure test and technical validation**

Repeat Step 2 with a fresh agent and the updated Skill resources. Expected GREEN evidence: it identifies exactly the three changed components, uses 26/400/36 and 15/400/22, preserves showroom address 16/400/25, excludes all `hero.*`, and does not expand the rule to card-internal/left-aligned/footer/review typography.

```bash
node --test tests/non-hero-centered-typography.test.mjs
node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
git diff --check -- tests/non-hero-centered-typography.test.mjs '活动商品组件/单品窗帘促销卡/COMPONENT_MANAGEMENT.zh-CN.v1.md' '小样-产品/窗帘产品推荐卡II/COMPONENT_MANAGEMENT.zh-CN.v1.md' '地址组件/展厅地址卡/COMPONENT_MANAGEMENT.zh-CN.v1.md' skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md
```

Expected: focused tests pass; the Skill contract test passes; validator reports `valid` for all registered/editor components; whitespace check exits 0.

Because the showroom guide and Skill reference already contain user-owned uncommitted changes, do not stage or commit these files as part of this task.

---

### Task 5: Full regression, head-image integrity, and 600px/375px visual QA

**Files:**

- Verify: all files from Tasks 1–4
- Verify unchanged: complete `头图/` tree
- Temporary only: a Campaign editor session under `/private/tmp`

**Interfaces:**

- Consumes: the final templates, demos, documentation, and focused tests.
- Produces: automated test evidence, head-image integrity evidence, computed-style evidence at both preview widths, screenshots, and a console-error check.

- [ ] **Step 1: Run focused and existing builder regressions**

```bash
node --test tests/non-hero-centered-typography.test.mjs
node --test --test-name-pattern='sale grid uses the double-gift|renders a linked curtain promotion|showroom card|curtain recommendation overlay' tests/build-email-template.v1.test.mjs
node --test tests/build-email-template.v1.test.mjs
node -e "const fs=require('node:fs'); const source=JSON.parse(fs.readFileSync('compositions/hero-grid-review-gifts-location.default.v1.json','utf8')); source.output='/private/tmp/non-hero-typography-composition.html'; source.previewOutput='/private/tmp/non-hero-typography-composition.preview.html'; fs.writeFileSync('/private/tmp/non-hero-typography-composition.json',JSON.stringify(source,null,2));"
node build-email-template.v1.mjs /private/tmp/non-hero-typography-composition.json --preview-local-assets
```

Expected: all focused tests pass; existing builder tests pass; the composition build exits 0, writes only under `/private/tmp`, and contains no unresolved `{{content.*}}` or `{{settings.*}}` tokens.

- [ ] **Step 2: Run contract and full-suite verification**

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
node --test tests/*.test.mjs
```

Expected: validator reports `valid`. Full suite passes. If the server tests alone fail with loopback `listen EPERM` in the sandbox, rerun the same full-suite command with approved unrestricted local-loopback execution and report both results.

- [ ] **Step 3: Prove the complete head-image tree was not touched**

```bash
find 头图 -type f -exec shasum -a 256 {} \; | LC_ALL=C sort > /private/tmp/non-hero-typography-hero.after.sha256
cmp /private/tmp/non-hero-typography-hero.before.sha256 /private/tmp/non-hero-typography-hero.after.sha256
```

Expected: `cmp` exits 0 with no output.

- [ ] **Step 4: Start an isolated temporary editor for visual QA**

Load `build-web-apps:frontend-testing-debugging` and `browser:control-in-app-browser` completely before browser work. Start a temporary editor without altering the user's current port 4173 sessions:

```bash
typography_qa_root=$(mktemp -d /private/tmp/freshine-typography-qa.XXXXXX)
node --input-type=module -e "import { createCampaignEditorServer } from './skills/build-omnisend-campaign-draft/editor/campaign-editor-server.mjs'; const server = await createCampaignEditorServer({ workspaceRoot: process.cwd(), sessionRoot: process.argv[1] }); console.log(await server.listen(4174)); await new Promise(() => {});" "$typography_qa_root"
```

Expected: server prints `http://127.0.0.1:4174/` and remains running. If 4174 is occupied, use another unused local port and record it.

- [ ] **Step 5: Build a disposable QA draft in the temporary editor**

At the temporary editor URL, create `非头图居中排版 QA` and add, in this order:

1. `gift.rewardGrid2`
2. `collection.saleGrid6`
3. `collection.curtainPromotionCard`
4. `product.curtainRecommendationOverlay`
5. `location.showroomCard`

Generate the preview. Do not upload, export, send, schedule, or publish anything.

- [ ] **Step 6: Verify computed styles and visual continuity at 600px and 375px**

For both toolbar widths, inspect the preview iframe:

- `reward.title`, `saleCollection.title`, `promotion.title`, `intro.title`, and `showroom.title`: computed `font-family` begins with Lora, with `font-size: 26px`, `font-weight: 400`, `line-height: 36px`, `text-align: center`.
- `reward.rules[0]`, `saleCollection.body`, `promotion.subtitle`, and `intro.subtitle`: computed `font-family` begins with Montserrat, with `font-size: 15px`, `font-weight: 400`, `line-height: 22px`, `text-align: center`.
- `showroom.address.line1` and `showroom.address.line2`: `16px / 400 / 25px`, centered.
- Long text wraps naturally; no horizontal overflow or clipping appears.
- Existing spacers, images, badges, CTAs, product-level titles, and address placement are unchanged.

Capture one 600px and one 375px screenshot containing the five-component comparison. Check the browser console after both widths; expected: no new errors.

Then open the three standalone `效果演示.html` files directly and repeat the corresponding computed-style checks at 600px and 375px. This is the explicit synchronization check for the demo artifacts, which are not generated by the integration test.

- [ ] **Step 7: Final scoped diff and whitespace review**

```bash
git diff --check -- tests/non-hero-centered-typography.test.mjs '活动商品组件/单品窗帘促销卡' '小样-产品/窗帘产品推荐卡II' '地址组件/展厅地址卡' skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md
git status --short
```

Expected: no whitespace errors. Review the final status against `/private/tmp/non-hero-typography-worktree.before.txt`; report only the task-specific files changed by this implementation and preserve all pre-existing unrelated entries.
