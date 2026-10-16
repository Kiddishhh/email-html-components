# Free Design Service Hero - Design QA

- Source visual truth: `reference-design.png`
- Normalized source: `reference-600-normalized.png`
- Implementation: `effect-preview.html`
- Implementation screenshots: `implementation-600-final.jpg`, `implementation-375-final.jpg`
- Full-view comparison: `comparison-600-final.jpg`
- Desktop viewport / capture: 600 x 654 CSS px, 600 x 654 image px, device pixel ratio 1
- Mobile viewport / capture: 375 x 409 CSS px, 375 x 409 image px, device pixel ratio 1
- Source normalization: cropped the supplied 880 x 958 screenshot to its visible 874 x 952 design area, then resized it to 600 x 654 for equal-size comparison
- State: default static email state; both links visible; remote logo loaded at its intrinsic 158 x 158 size; background verified from the supplied 1200 x 1198 JPEG

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: Lora/Georgia serif treatment, Montserrat/Arial sans-serif hierarchy, weight, italic subtitle, underlined navigation CTA, wrapping, and letter spacing match the reference closely. All text remains on one line at both target widths.
- Spacing and layout rhythm: 600 x 56 navigation plus 600 x 598 hero matches the normalized source. Logo, title, subtitle, and 288 x 50 CTA align to the reference; mobile values contract to 62.5% at 375px without changing the structure.
- Colors and tokens: navigation red, white copy, white divider, white pill CTA, and dark CTA text match the visible source palette.
- Image quality and asset fidelity: the exact user-supplied background and transparent logo are used. No substitute illustration, generated image, CSS drawing, or placeholder remains.
- Copy and content: all visible copy matches the supplied reference, including `Unlock Extra 15% Off Your First Order At Freshine`, `SIGN UP`, `Free Design`, the italic subtitle, and `DESIGN YOUR HOME →`.

## Focused Evidence

- The equal-size side-by-side comparison checks the navigation divider, circular logo, serif title, italic subtitle, and CTA geometry at readable size; separate focused crops were not needed because all critical details are legible in the 1200 x 654 comparison.
- Browser measurements at 600px: page width 600px, title 66px/80px, subtitle 20px/28px, CTA 288 x 50px, no horizontal overflow.
- Browser measurements at 375px: page width 375px, title 41.25px/50px, subtitle 12.5px/17.5px, CTA 180 x 31.25px, no horizontal overflow.
- Browser console: no errors or warnings.
- Link inspection: `SIGN UP` points to the tracked Freshine homepage; `DESIGN YOUR HOME` points to the tracked `/pages/free-design-service` destination. The two click areas remain independent.

## Comparison History

1. Initial comparison found the title about 6px low, subtitle about 5px high, CTA about 2px high, and the navigation divider spanning the full bar height.
2. Fixed the divider with a centered 36px inner table; changed the title to 66px/80px; redistributed logo/title/subtitle/CTA padding while preserving the exact 598px hero height.
3. Post-fix comparison in `comparison-600-final.jpg` shows the reference and implementation aligned with no remaining actionable P0/P1/P2 difference.

## Verification

- `xmllint --html --noout output/free-design-service-hero/effect-preview.html`: passed
- Forbidden email markup scan: no JavaScript, iframe, form, Flex, Grid, fixed/absolute positioning, media queries, `file://`, or `asset://`
- `node scripts/normalize-inline-mobile-dimensions.mjs --check`: 52 registered components / 104 files checked / no unscaled declarations
- `node --test tests/mobile-proportional-contract.test.mjs`: 2/2 passed
- Omnisend editor and real Gmail/Outlook/Apple Mail delivery were not tested in this preview-only stage.

final result: passed
