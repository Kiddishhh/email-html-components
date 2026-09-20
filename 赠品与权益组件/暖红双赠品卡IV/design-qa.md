# 暖红双赠品卡IV — Design QA

final result: passed

## Reference and evidence
- Source: `/Users/ww/Downloads/赠品版块_暖红IV 1.png`, 1200×1156. Normalize at 0.5 to 600×578 and 0.3125 to 375×361.25.
- Implementation: `http://127.0.0.1:4289/赠品与权益组件/暖红双赠品卡IV/效果演示.html`.
- Editor: `http://127.0.0.1:4188/`, 赠品与权益组件 → 暖红双赠品卡IV.
- Browser: Codex in-app Browser; CSS viewports 600×650 and 375×420. Viewport screenshots have one pixel per CSS pixel. Extra white area below component is outside the design.
- Desktop: `audit/warm-red-gift-iv/desktop-600.png`; mobile: `mobile-375.png`; source: `reference-600.png`.
- Same-input full comparisons opened: `comparison-desktop.png` and `comparison-mobile.png`. Focused header comparison opened: `comparison-typography.png`.
- Default state, two linked cards. Both images complete and loaded.

## Findings and comparison history
- First visual pass has no actionable P0/P1/P2 finding. Source geometry matches the intended two-column layout. No layout fix required after browser capture.
- P3: editable live heading is slightly wider than raster reference due to inferred Lora size and raster/font rendering differences. Font remains Lora 500 34px/44px; it does not wrap or clip at either viewport.
- A regression fixture enumerated the old gift catalog; updated expected list to include this newly registered component. This was a catalog expectation change, not a visual correction.

## Required fidelity surfaces
- Typography: editable Lora 500 heading, 34px/44px; Montserrat 500 condition text, 17px/25px. Both are centered, letter spacing 0. Mobile sizes are 21.25px/27.5px and 10.625px/15.625px. Exact reference wording retained, including $699+, $999+, and the en dash.
- Spacing/layout: measured desktop 600×577.98, mobile 375×361.23. Desktop card positions x=26.5/313.5, y=189.48, size260×340; mobile x=16.56/195.94, y=118.42, size162.5×212.5. Desktop gap27px. No horizontal overflow; scrollWidth equals 600/375 respectively. Editor measurements independently agree.
- Colors: source background sampled #FAF9F7; live text #222222. Original warm-red labels remain in source crops. No recoloring of source artwork. Minor screenshot/raster color appearance differences remain uncorrected to preserve original image pixels.
- Imagery: exact lossless independent crops [53,379,573,1059] and [627,379,1147,1059], each520×680. Value badges, photo, bottom caption and rounded corners remain part of each image; no invented icons, redrawn product photos or placeholders.
- Copy/content: title and two lines editable. Original image labels $59.9/$89.9 Value, ICE SILK EYE MASK and RANDOM PILLOW COVER preserved as image content and reflected in image Alt text. Image labels require whole-card replacement to change.

## Interaction and validation
- Component added through editor catalog. Nine content fields and two scoped color settings visible.
- Desktop/mobile preview buttons exercised; both cards loaded in both modes.
- Exactly two normal image anchors, both use the user-provided `https://freshinelife.com?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`. DOM href and generated-template contract verified. External destination/new-window navigation was not independently browser-tested.
- No browser console errors in preview or editor.
- Full tests: 261/261 pass. Registry/editor contract: 50/50 valid. Proportional normalization:100 files, zero unscaled dimensions. git diff --check clean.

## Implementation checklist
- [x] Registered component template/CSS, schemas, fixtures, source crops, demo and management guide.
- [x] Editor contract, index, interaction reference, README/Skill note and regression coverage.
- [x] Both viewport captures, full and focused visual comparisons, measured geometry and link checks.

## Delivery boundaries
Local source assets use asset:// in the fixture and local URLs in the demo. Final Omnisend export requires the existing confirmed public-HTTPS asset upload flow. No upload, campaign write, send, schedule, gift-rule creation or Git commit/push performed. Omnisend and inbox clients have not been tested; web-font and min() fallbacks remain client-dependent.

final result: passed
