# Build Omnisend Campaign Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` task-by-task. This workspace is not a Git repository, so do not create commits.

**Goal:** Make the Campaign draft Skill enforce the confirmed six-slot workflow, validate selectable styles, and supply deterministic Shopify read-only data scripts.

**Architecture:** Keep the existing component registry and email assembler unchanged in responsibility. Add Campaign-only structure and interaction-index JSON under the Skill, then add deterministic scripts that emit normalized JSON and share one strict Shopify CLI guard. The Skill and Chinese references orchestrate these assets; the assembler only renders complete snapshots.

**Tech Stack:** Node.js ESM, `node:test`, JSON fixtures, Shopify CLI read-only subprocesses, existing HTML assembler.

## Global Constraints

- Shopify subprocesses may only use `store info`, GraphQL `query` through `store execute`, `theme list`, and `theme pull`; reject every other command, mutation, and `--allow-mutations`.
- Do not send, schedule, publish, or otherwise move an Omnisend Campaign out of draft.
- No V1 fallback/degeneration flow for missing Sale Page candidates, missing activity fields, non-unique live themes, or insufficient products.
- The six fixed slots are hero, sale grid, clickable image, gift, location, footer; footer is unique and terminal.
- Build only complete content/settings snapshots. The assembler does not collect data, access Shopify, merge themes, or alter component styles.
- Write a failing test before every production/documentation behavior change; run the entire test suite after each task.

---

### Task 1: Campaign structure and interaction-index validation

**Files:**
- Create: `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`
- Create: `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`
- Create: `scripts/validate-campaign-contracts.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`

**Interfaces:**
- Consumes: root `组件清单.json`; `campaign-structure.v1.json`; `campaign-component-interactions.v1.json`.
- Produces: process exit `0` only when every slot has one or more registered, interaction-ready candidates and one unique terminal footer slot is last.

- [ ] **Step 1: Write the failing tests**

Add tests that run `node scripts/validate-campaign-contracts.mjs` and assert success for the six slots in order, with candidates `hero.promotionalOverlay`, `collection.saleGrid6`, `image.clickableFullWidth`, `gift.rewardGrid2`, `location.showroomCard`, and `footer.warm`. Add an isolated malformed fixture with a non-terminal footer and assert the validator exits non-zero with `footer.warm must be the only terminal slot`.

- [ ] **Step 2: Run the targeted test to verify RED**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: failure because `validate-campaign-contracts.mjs` and the two JSON files do not exist.

- [ ] **Step 3: Write the minimal configuration and validator**

Create the structure JSON with the exact slot fields `id`, `label`, `order`, `required`, `candidateComponentKeys`, and `terminal` only for footer. Create an interaction-index entry for every current candidate with exactly `componentKey`, `interactionReference`, `allowedSources`, `requiredStages`, and `completion`. Implement the validator with Node built-ins: read the root registry, reject unknown keys, require contiguous orders 1–6, require exactly one terminal `footer.warm` at order 6, verify every candidate is registered and has all interaction-index fields, and reject duplicate candidate keys inside a slot.

- [ ] **Step 4: Synchronize the Skill and interaction reference**

Replace the old “first five components can be reordered” directions with the six fixed slots and one-style-per-slot process. Point the Skill to the two JSON contracts. Mark only components that have an index entry as selectable.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: all contract tests pass, including direct validator execution and malformed-fixture rejection.

- [ ] **Step 6: Run full verification**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

### Task 2: Synchronize the six component interaction contracts and clickable-image geometry

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `通用图片组件/可链接整图/component.template.v1.html`
- Modify: `通用图片组件/可链接整图/settings.defaults.v1.json`
- Modify: `通用图片组件/可链接整图/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: confirmed interaction design and existing component content/settings schemas.
- Produces: 552px maximum-width clickable image rendered at 552 × 1006 reference geometry; machine-readable index references matching narrative instructions.

- [ ] **Step 1: Write the failing tests**

Replace the old assertion for `430 × 783px` with assertions for `552 × 1006px`, a 600px canvas with 24px side breathing room, and approximately `375 × 683px` mobile scaling. Add renderer assertions requiring table/image width `552`, image height `1006`, and default `image.maxWidth` `552px`. Add interaction assertions covering generated content-specific Alt, default homepage link displayed only in the completion card, local-or-public image inspection, and one completion card with both previews.

- [ ] **Step 2: Run the targeted tests to verify RED**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs tests/build-email-template.v1.test.mjs`

Expected: failures showing old 430px/783px geometry and missing confirmed image interaction text.

- [ ] **Step 3: Make the smallest component changes**

Change the clickable-image table and image attributes to 552/1006 and set `image.maxWidth` to `552px`; preserve responsive `width:100%;height:auto`. Update its management guide and composition snapshots using this component so each settings snapshot supplies `552px`.

- [ ] **Step 4: Synchronize six interaction narratives**

Write the complete, confirmed flows for hero, sale grid, clickable image, gift, location, and footer. Preserve existing sale-grid product, CTA, color, and one-card rules. Add the fixed gift position and its local default snapshot card; add address and footer cards, with footer’s separately confirmed `#652A0D` background. Keep all choices user-facing; omit `componentKey` from selection cards.

- [ ] **Step 5: Verify GREEN and full suite**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass and all committed compositions render in local preview mode.

### Task 3: Shared read-only Shopify CLI guard and Sale Page discovery script

**Files:**
- Create: `skills/build-omnisend-campaign-draft/scripts/shopify-readonly.mjs`
- Create: `skills/build-omnisend-campaign-draft/scripts/list-sale-activities.mjs`
- Create: `tests/fixtures/shopify-live-theme/` with a minimal `config/settings_data.json`, navigation/page/template/section fixture set
- Create: `tests/list-sale-activities.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- `assertReadonlyShopifyCommand(argv)` rejects mutation flags and non-whitelisted command families before spawning.
- `list-sale-activities.mjs --theme-dir <path>` emits one JSON object with `source` and `candidates`; production mode obtains the directory only by `theme list` then `theme pull` of the unique live theme into a new temporary directory, and uses query-only `store execute` to paginate all menus and Pages. It recursively keeps Page links only, then requires exactly one enabled `slideshow-v2` with a readable first slide and the first enabled `products-grid-v2` Collection setting.
- Candidate JSON contains internal `id`, `label`, `pageUrl`; source JSON contains `themeId`, `snapshotPath`, `readAt`.

- [ ] **Step 1: Write failing tests**

Create a fixture live theme with two Sale navigation links. Assert the list script emits two ordered candidates with public page URLs and source metadata. Assert `assertReadonlyShopifyCommand` rejects `theme push`, `theme dev`, `--allow-mutations`, and `store execute` payloads beginning with `mutation`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/list-sale-activities.test.mjs`

Expected: failure because neither module exists.

- [ ] **Step 3: Implement the guard and deterministic fixture mode**

Use `node:child_process` only behind the guard. In fixture mode, parse the supplied pulled-theme directory without invoking Shopify. In production mode, first run guarded `shopify theme list`, select exactly one live theme, create a fresh temporary directory, run guarded `shopify theme pull`, then parse the same directory. Output JSON only to stdout; diagnostics go to stderr. Never retain credentials.

- [ ] **Step 4: Update the data contract**

Replace the old single-script plan with `list-sale-activities.mjs` and describe the unique-live-theme requirement, same-snapshot reuse, user-visible candidate fields, and stop-only V1 failure policy.

- [ ] **Step 5: Verify GREEN and full suite**

Run: `node --test tests/list-sale-activities.test.mjs && node --test tests/*.test.mjs`

Expected: all tests pass without real Shopify access.

### Task 4: Selected Sale Page parsing and six-product normalization

**Files:**
- Create: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-activity.mjs`
- Create: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs`
- Create: `tests/fetch-sale-activity.test.mjs`
- Create: `tests/fetch-sale-grid.test.mjs`
- Create: `tests/fixtures/shopify-graphql/collection-products.json`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`

**Interfaces:**
- `fetch-sale-activity.mjs --snapshot <path> --candidate-list <path> --candidate-id <id>` emits `{ activity, recommendedCollection, source }` with `name`, `eyebrow`, `title`, `subtitle`, `handle`, `url`, `pageUrl`, `template`, `sectionId`, `themeId`, `snapshotSha256`, `readAt`; it re-parses the selected candidate against that exact snapshot and stops on a mismatch.
- `fetch-sale-grid.mjs --collection-handle <handle> --count 6` emits six current-sort products and derives `SAVE n%` only from the first available-for-sale variant.

- [ ] **Step 1: Write failing activity-parser tests**

Use the live-theme fixture and assert selection of one candidate returns all required activity/source keys, maps the declared hero section fields, and returns the recommended Collection URL derived from the handle. Assert a missing required section field exits non-zero with a stop-only error.

- [ ] **Step 2: Run activity RED**

Run: `node --test tests/fetch-sale-activity.test.mjs`

Expected: failure because the parser module is absent.

- [ ] **Step 3: Implement activity parsing**

Read only the supplied snapshot and candidate record, resolve the selected page template and enabled hero section, reject ambiguity/missing data, calculate SHA-256 of the snapshot input, and print the exact normalized object. Do not read an image field into output.

- [ ] **Step 4: Write failing grid tests**

Mock the guarded GraphQL query boundary with a fixture response. Assert it selects the first six Collection-ordered products, prefers `featuredImage`, uses `onlineStoreUrl` or the confirmed `/products/{handle}` fallback, uses the first available variant, calculates integer `SAVE` labels only for valid `compareAtPrice > price`, and emits an empty label otherwise.

- [ ] **Step 5: Run grid RED**

Run: `node --test tests/fetch-sale-grid.test.mjs`

Expected: failure because the grid script is absent.

- [ ] **Step 6: Implement grid normalization**

Build a query-only GraphQL request through the shared guard, paginate until six products and needed variants are collected, then normalize the fixture/live response into exactly six items. Reject fewer than six items, absent featured images, or absent available variants; do not substitute products. Derive the Collection CTA URL from its handle.

- [ ] **Step 7: Verify GREEN and full suite**

Run: `node --test tests/fetch-sale-activity.test.mjs tests/fetch-sale-grid.test.mjs && node --test tests/*.test.mjs`

Expected: all tests pass with no live-store write access.

### Task 5: Final Skill workflow, safety gates, and static validation

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- The Skill uses Tasks 1–4 only in the approved order and produces complete component snapshots for the existing assembler.
- The final Omnisend write is permitted only after local preview, high-level checklist, and explicit content-hash-bound confirmation.

- [ ] **Step 1: Write failing workflow assertions**

Add assertions that the Skill: loads both Campaign JSON contracts; selects six slots individually; invokes candidate discovery before selected-page parsing; invokes grid normalization only after locked hero Collection; uses local assets only for preview; displays a hash-bound final confirmation; and rejects all send/schedule/publish paths.

- [ ] **Step 2: Run RED**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: failures until the old six-component reorder instructions and stale script state are replaced.

- [ ] **Step 3: Update the minimal orchestration instructions**

Keep `SKILL.md` concise and route detailed fields to references. Make the project draft store the selected structure, component snapshots, source metadata, previews, confirmation state, and content hash. State that any content change invalidates final confirmation. Preserve the existing no-write Shopify and Omnisend-draft-only gates.

- [ ] **Step 4: Validate the Skill folder and run all tests**

Run: `python3 /Users/ww/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/build-omnisend-campaign-draft && node --test tests/*.test.mjs`

Expected: validator succeeds and all tests pass.
