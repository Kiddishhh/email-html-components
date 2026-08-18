# Countdown Hero Proportion And Theme Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct `hero.countdownOverlay` to a 600×751px total header, bind `SIGN UP` and `SHOP NOW` to one theme color, derive an editable lighter navigation color, and make the Campaign Skill execute those rules automatically.

**Architecture:** Keep the component as an explicit complete `content`/`settings` snapshot rendered by the existing table-based assembler. Remove the independent right-navigation color from the component contract so the template reads `color.theme` for both action regions. Add one deterministic local color helper for the Skill and register the countdown hero as a selectable hero style with its own interaction contract.

**Tech Stack:** Node.js built-in test runner, ESM scripts, JSON contracts, table-based email HTML, inline CSS, Markdown Skill references.

## Global Constraints

- Total desktop component size is 600×751px: one 61px navigation row plus a 600×690px hero area.
- Recommend 600×690px background images or 1200×1380px 2× assets.
- Keep `countdown.title` editable and rendered with Lora at 67px / 81px.
- Keep `hero.subtitle` editable and rendered with Montserrat at 13px / 20px.
- Bind the right `SIGN UP` area and `SHOP NOW` CTA to one `color.theme` setting.
- Derive `color.navigationLeft` as 35% theme color plus 65% `#F4F1EC`; allow an explicit per-component override.
- Do not add extra confirmations for typography or automatic color derivation; show them in the single completion card.
- Preserve table layout, inline CSS, complete snapshots, local-asset preview rules, and Omnisend draft-only safety gates.

---

### Task 1: Lock The New Component And Skill Contracts

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Create: `tests/derive-countdown-theme.test.mjs`

**Interfaces:**
- Consumes: `hero.countdownOverlay` template/defaults, Campaign structure JSON, interaction index, Skill Markdown.
- Produces: failing assertions for the exact 690px hero height, shared action color, deterministic lighter color, selectable style, and automatic Skill interaction.

- [ ] **Step 1: Replace the incorrect geometry assertions**

```js
assert.match(template, /height="690"/);
assert.match(template, /height:115vw;max-height:690px;min-height:600px/);
assert.doesNotMatch(template, /height="751"/);
```

- [ ] **Step 2: Add component color-binding assertions**

```js
assert.equal(defaults.values['color.theme'], '#9D1D20');
assert.equal(defaults.values['color.navigationLeft'], '#D6A7A5');
assert.equal('color.navigationRight' in defaults.values, false);
assert.match(template, /<td[^>]*bgcolor="\{\{settings\.color\.theme\}\}"[^>]*>[\s\S]*?\{\{content\.navigation\.linkText\}\}/);
```

- [ ] **Step 3: Add Skill selection and interaction assertions**

```js
assert.deepEqual(structure.slots[0].candidateComponentKeys, [
  'hero.promotionalOverlay',
  'hero.countdownOverlay'
]);
assert.match(interactions, /hero\.countdownOverlay/);
assert.match(interactions, /600×751px.*600×690px/s);
assert.match(interactions, /Lora.*countdown\.title.*Montserrat.*hero\.subtitle/s);
assert.match(interactions, /SIGN UP.*SHOP NOW.*color\.theme/s);
assert.match(interactions, /35%.*65%.*#F4F1EC.*单独.*修改/s);
```

- [ ] **Step 4: Add deterministic color-helper tests**

```js
import { deriveCountdownTheme } from '../skills/build-omnisend-campaign-draft/scripts/derive-countdown-theme.mjs';

assert.deepEqual(deriveCountdownTheme('#9d1d20'), {
  theme: '#9D1D20',
  navigationLeft: '#D6A7A5',
  navigationLeftSource: 'automatic'
});
assert.equal(deriveCountdownTheme('#9d1d20', '#abcdef').navigationLeft, '#ABCDEF');
assert.throws(() => deriveCountdownTheme('#fff'), /#RRGGBB/);
```

- [ ] **Step 5: Run the targeted tests and verify RED**

Run:

```bash
node --test --test-name-pattern='countdown hero' tests/build-email-template.v1.test.mjs
node --test --test-name-pattern='countdown' tests/build-omnisend-campaign-draft-skill.contract.test.mjs
node --test tests/derive-countdown-theme.test.mjs
```

Expected: failures show the old 751px hero area, independent `color.navigationRight`, missing countdown Skill interaction, and missing color helper.

### Task 2: Implement Deterministic Skill Color Derivation

**Files:**
- Create: `skills/build-omnisend-campaign-draft/scripts/derive-countdown-theme.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`
- Modify: `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`

**Interfaces:**
- Consumes: `deriveCountdownTheme(theme, navigationLeftOverride?)` with uppercase-normalized `#RRGGBB` inputs.
- Produces: `{ theme, navigationLeft, navigationLeftSource }` and a selectable `hero.countdownOverlay` interaction contract.

- [ ] **Step 1: Implement the color helper**

```js
export function deriveCountdownTheme(theme, navigationLeftOverride) {
  const normalizedTheme = normalizeColor(theme);
  const navigationLeft = navigationLeftOverride
    ? normalizeColor(navigationLeftOverride)
    : mixColor(normalizedTheme, '#F4F1EC', 0.35);
  return {
    theme: normalizedTheme,
    navigationLeft,
    navigationLeftSource: navigationLeftOverride ? 'override' : 'automatic'
  };
}
```

The CLI accepts `--theme <#RRGGBB>` and optional `--navigation-left <#RRGGBB>`, then prints only the JSON result.

- [ ] **Step 2: Add countdown hero to the hero slot and interaction index**

Set the hero candidates to `hero.promotionalOverlay` then `hero.countdownOverlay`. Add stages `loadDefaultSnapshot`, `collectBackground`, `deriveTheme`, and `completionCard`; allow component defaults, public/local user images, user copy, and user color.

- [ ] **Step 3: Add the countdown interaction recipe**

Document one settings card containing total/background dimensions, background image, editable countdown/subtitle copy, navigation/CTA links, Lora/Montserrat typography, shared theme color, derived left color, and override status. Require one final card confirmation only.

- [ ] **Step 4: Update the main Skill workflow**

Condition the hero flow by selected component key. For `hero.countdownOverlay`, load defaults, collect a 600×690px image, call `derive-countdown-theme.mjs`, show the single card and desktop/mobile previews, and lock only after one explicit confirmation. Do not apply Shopify slide copy mapping to countdown fields.

- [ ] **Step 5: Run Skill tests and validator**

Run:

```bash
node --test tests/derive-countdown-theme.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

Expected: all pass; validator lists both hero candidates.

### Task 3: Correct Component Geometry And Color Binding

**Files:**
- Modify: `头图/倒计时头图/component.template.v1.html`
- Modify: `头图/倒计时头图/component.styles.v1.css`
- Modify: `头图/倒计时头图/settings.schema.v1.json`
- Modify: `头图/倒计时头图/settings.defaults.v1.json`
- Modify: `头图/倒计时头图/效果演示.html`
- Modify: `头图/倒计时头图/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: complete settings without `color.navigationRight`; `color.theme` and `color.navigationLeft` remain required.
- Produces: a 61px navigation row plus 690px hero cell with right navigation and CTA sharing `color.theme`.

- [ ] **Step 1: Update the settings contract**

Remove `color.navigationRight`. Set `color.navigationLeft` default to `#D6A7A5`; preserve `color.theme: #9D1D20`.

- [ ] **Step 2: Update the template and CSS**

Change both hero height attributes to `690`, change responsive height to `115vw` / `690px` / `600px`, and bind the right navigation `bgcolor` and inline background to `settings.color.theme`.

- [ ] **Step 3: Update the standalone demo**

Apply the exact same geometry and default colors in `效果演示.html`; preserve Lora title, Montserrat subtitle, 444px panel, 120px Logo, 200px divider, and 200×43px CTA.

- [ ] **Step 4: Update component management documentation**

State 600×751px total, 600×690px background, 600×690px or 1200×1380px image recommendation, shared action color, automatic lighter color, and optional left-color override.

- [ ] **Step 5: Run component tests**

Run:

```bash
node --test --test-name-pattern='countdown hero' tests/build-email-template.v1.test.mjs
```

Expected: all countdown component tests pass.

### Task 4: Regenerate Preview And Verify The Whole Workspace

**Files:**
- Modify: `countdown-hero.local-preview.html` (generated local artifact)
- Modify: `docs/superpowers/specs/2026-08-12-countdown-hero-design.md`
- Modify: `docs/superpowers/plans/2026-08-12-countdown-hero.md`
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: final component snapshot and registered local assets.
- Produces: updated local preview, consistent documentation, and verification evidence.

- [ ] **Step 1: Regenerate the local preview**

Run the existing temporary countdown composition with `--preview-local-assets` and write `countdown-hero.local-preview.html`.

- [ ] **Step 2: Scan for stale geometry and colors**

```bash
rg -n 'height="751"|max-height:751px|color\.navigationRight|#652A0D' \
  头图/倒计时头图 \
  docs/superpowers/specs/2026-08-12-countdown-hero-design.md
rg -n 'color\.navigationRight' skills/build-omnisend-campaign-draft
```

Expected: no countdown-specific stale geometry or independent right-navigation color remains.

- [ ] **Step 3: Validate the Skill folder**

```bash
python3 /Users/ww/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/build-omnisend-campaign-draft
```

Expected: validation succeeds.

- [ ] **Step 4: Run the full test suite**

```bash
node --test tests/*.test.mjs
```

Expected: zero failures.

- [ ] **Step 5: Record visual QA honestly**

Keep `final result: blocked` in `design-qa.md` until a browser-rendered 600px and approximately 375px screenshot can be compared with the reference. Static tests do not count as visual approval.
