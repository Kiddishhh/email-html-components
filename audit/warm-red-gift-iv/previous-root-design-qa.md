# 多类推荐V — Design QA

final result: passed

## Source and implementation
- Source: `/Users/ww/Downloads/产品块/多类推荐V.png`, 1200×2626; normalized to 600×1313 and 375×821. The two blank image slots are explicitly errors in the user brief, not intentional empty cards.
- Implementation: `http://127.0.0.1:4289/活动商品组件/多类推荐V/效果演示.html`; editor: `http://127.0.0.1:4185/` → 活动商品组件 → 多类推荐V.
- Browser: Codex in-app Browser. Desktop viewport 600×900; mobile viewport 375×850. Screenshots normalized to CSS-pixel density (1 image pixel per CSS pixel).
- Evidence: `audit/multi-category-v/desktop-600-final.png` (600×1313), `mobile-375.png` (375×850); `comparison-desktop.png`, `comparison-mobile.png` put source and implementation together in the same image. Focused header comparison: `comparison-typography.png`.
- Full-page capture had a browser stitching/density artifact; final desktop evidence stitches two actual 600×900 viewport captures at scrollY=0 and scrollY=413, using only the last 413 pixels of the second capture. It does not synthesize rendered content.
- State: six default category cards, no hover. Mobile capture includes 29px of empty viewport below the component.

## Comparison history and findings
1. Initial P1: shared spacer helper added colspan=3 to a one-column root table, shrinking main content to one third of canvas width. Browser geometry exposed 86px cards instead of 257px. Corrected colspan only on actual three-column inter-row spacers, regenerated preview, and rechecked both viewports. Historical evidence: `desktop-600.png`.
2. Final: no actionable P0/P1/P2 layout findings. Component is 600×1312.96 at desktop and 375×820.59 at mobile. Six images are 257×322 / 160.63×201.25. document scrollWidth equals viewport width at both widths. Editor iframe measurements independently agree.

## Required fidelity surfaces
- Fonts/typography: Lora 500 30px/38px for heading; Montserrat 500 16px/24px for subtitle and all six captions, centered, letter spacing 0. Mobile 18.75px/23.75px and 10px/15px per project proportional rule. Captions underlined. Focused comparison opened alongside full comparison. Web-font client fallback remains a delivery constraint.
- Spacing/layout: 534px grid, 257px columns, 20px gap; image starts at desktop y=135, 520, 905. 32px top, 48px bottom. Two columns retained on mobile, no clipped caption or horizontal overflow.
- Colors/tokens: source corner sampled #FBFAF8; heading/captions #222222; subtitle #827870. Four component-scoped editable colors.
- Image quality: four independent photo crops extracted from supplied reference; two missing photo slots filled from real Freshine collection images. All six files 514×644, all loaded in independent page and editor. Original missing compositions are unknowable; these two images are explicitly substituted real category material. No generated/placeholder artwork.
- Copy/content: subtitle uses the user's exact sentence casing `From natural linen to smart motorization.` (intentional departure from title case in screenshot). Six uppercase category captions match reference. Heading is editable HTML text.

## Interactions and checks
- Added component through editor's catalog and switched desktop/mobile previews; all 26 content fields and four color settings visible.
- DOM verified twelve distinct anchors: each picture/title pair uses its category HTTPS URL, six distinct category paths confirmed against the public Freshine collections response. A title click was exercised; in-app Browser did not expose a destination tab, so external new-window navigation is not claimed as independently observed.
- Browser error logs: none on preview/editor. Six of six images loaded.
- Focused and proportional tests pass. Full regression: 260/260 pass; registry/editor contracts 49/49 valid; normalization check 98 files, no unscaled declarations; git diff --check clean.

## Implementation checklist
- [x] Component template/CSS, schemas, defaults, local assets, management guide and reproducible demo.
- [x] Registry, editor field contract, index, interaction docs and focused regression test.
- [x] Desktop/mobile browser geometry and same-input visual comparison after correction.

## Follow-up / validation boundaries
- Local preview assets use asset:// in fixture and resolved local files in demo. Export requires existing confirmed public-HTTPS upload flow. Nothing uploaded, sent, scheduled or published.
- Omnisend, Gmail, Outlook and Apple Mail inbox rendering have not been tested; web fonts and min() vary by email client. No inbox-pixel or send-ready guarantee.

final result: passed
