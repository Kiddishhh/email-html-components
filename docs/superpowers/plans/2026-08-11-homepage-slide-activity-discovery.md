# Homepage Slide Activity Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover Campaign activities exclusively from the live homepage slides, then read only the selected slide's linked activity page to obtain the six-grid Collection.

**Architecture:** Keep `list-sale-activities.mjs` as the entrypoint but replace its menu/Page scan with a partial live-theme pull of `templates/index.json`. It emits one candidate per enabled readable homepage slide. After the user chooses one, `fetch-sale-activity.mjs` resolves only that linked Page's template, pulls only `index.json` plus that page template into a new temporary snapshot, and rejects any source mismatch before returning the Collection.

**Tech Stack:** Node.js ESM, `node:test`, Shopify CLI query-only `store execute`, read-only `theme list` and `theme pull --only`.

## Global Constraints

- Do not read Shopify navigation menus or enumerate all Pages.
- Accept homepage candidates only from the one enabled `slideshow-v2` in `templates/index.json`.
- Require an enabled slide with readable `heading`, `subheading`, and a `shopify://pages/<handle>` link; skip invalid slides without inventing a fallback.
- Map homepage `subheading` to the activity name/hero eyebrow, `heading` to the offer/hero title, and `description` to hero subtitle.
- Query only the selected link's Page metadata after the user selects a slide; validate the returned handle exactly.
- Pull only `templates/index.json` for discovery, then only `templates/index.json` and the selected page template for confirmation.
- Preserve Shopify's existing strict read-only command guard. Never write Shopify data or a theme.

---

### Task 1: Make homepage-only discovery deterministic

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/list-sale-activities.mjs`
- Modify: `tests/list-sale-activities.test.mjs`

**Interfaces:**
- Produce `{ source, candidates }`, where each candidate has `slideId`, `activityName`, `pageHandle`, `pageUrl`, `activity`, and `homepageSectionId`.
- `source` records the live `themeId`, temporary `snapshotPath`, and `template: "index.json"`.

- [x] **Step 1: Write the failing tests**

Add a fixture `templates/index.json` containing one enabled `slideshow-v2` with two readable slides and one disabled slide. Assert that `discoverHomepageActivities({ themeRoot })` returns exactly the two enabled slides in `block_order`, maps `subheading` to `activityName`/`activity.eyebrow`, maps `heading` to `activity.title`, derives `https://freshinelife.com/pages/<handle>` from each `shopify://pages/<handle>` link, and never accepts menu/Page arguments.

- [x] **Step 2: Run the focused test and observe RED**

Run: `node --test tests/list-sale-activities.test.mjs`

Expected: FAIL because homepage discovery is not exported and the current code requires menu/Page inputs.

- [x] **Step 3: Implement the minimal discovery path**

Replace the production `menus`/`pages` GraphQL reads with `theme list` followed by `theme pull --only templates/index.json`. Parse `templates/index.json`, require exactly one enabled `slideshow-v2`, and return the normalized candidates. Retain fixture mode as `--theme-dir <path>` only; remove menu/page fixture options.

- [x] **Step 4: Verify GREEN**

Run: `node --test tests/list-sale-activities.test.mjs`

Expected: PASS with two candidates and no Shopify menu/Page request fixtures.

### Task 2: Reconfirm only the selected slide and linked Page

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-activity.mjs`
- Modify: `tests/fetch-sale-activity.test.mjs`

**Interfaces:**
- Consume the selected `slideId` and discovery source.
- Produce activity copy, one Collection handle/URL, and source metadata for the fresh two-file snapshot.

- [x] **Step 1: Write the failing tests**

Use an index fixture plus a linked `page.back-to-school-refresh.json`. Assert that `fetchSelectedHomepageActivity({ snapshotPath, candidate, themeId })` re-finds the exact `slideId`, rejects changed home-slide content/link, and reads the first enabled `products-grid-v2` Collection only from the linked page template.

- [x] **Step 2: Run the focused test and observe RED**

Run: `node --test tests/fetch-sale-activity.test.mjs`

Expected: FAIL because the current implementation requires a Page candidate and re-reads its slideshow instead of the homepage slide.

- [x] **Step 3: Implement the minimal selected-slide path**

Resolve the selected Page's `templateSuffix` by one guarded query, validate the returned handle, then pull `templates/index.json` and that exact `templates/page.<suffix>.json` into a new temporary directory. Re-parse the selected homepage slide and the page Collection, and stop on a mismatch.

- [x] **Step 4: Verify GREEN**

Run: `node --test tests/fetch-sale-activity.test.mjs`

Expected: PASS for matching snapshots and FAIL for a changed slide/link.

### Task 3: Synchronize the Campaign workflow and verify the full contract

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- The user sees each homepage slide's activity name and public Page URL, chooses one when multiple candidates exist, then sees imported copy and Collection source without an extra confirmation.

- [x] **Step 1: Write the failing contract assertions**

Assert that the Skill and Shopify contract state homepage-slide discovery, prohibit menu/all-Page scans, require user selection for multiple homepage slides, and obtain the grid Collection only after a selected slide's linked page is re-read.

- [x] **Step 2: Run the focused test and observe RED**

Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL because the documents still require all-menu Sale Page discovery.

- [x] **Step 3: Update only the affected workflow instructions**

Replace Sale-menu/Page candidate discovery with homepage `slideshow-v2` discovery; preserve the six fixed component order, public HTTPS/image rules, content-hash confirmation, and all read-only/draft-only gates.

- [x] **Step 4: Run full verification**

Run: `node --test tests/*.test.mjs && node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: all tests pass and the six-slot contract remains valid.
