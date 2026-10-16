# Free Design Service Visualizer - Design QA

- Source visual truth: `reference-visualizer.png`
- Normalized source: `reference-visualizer-600.png`
- Implementation: `service-visualizer-preview.html`
- Implementation screenshots: `visualizer-implementation-600.jpg`, `visualizer-implementation-375.jpg`
- Full-view comparison: `visualizer-comparison-600-final.jpg`
- Desktop viewport / capture: 600 x 758 CSS px, 600 x 758 image px, device pixel ratio 1
- Mobile viewport / capture: 375 x 475 CSS px, 375 x 475 image px, device pixel ratio 1
- Source normalization: resized the supplied 1200 x 1504 reference to 600 x 752 without cropping
- State: default static email state with the CTA visible

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: the title uses Lora 400 at 30/38px; the subtitle uses black Montserrat 500 at 18/27px. The subtitle wraps naturally after `Real-Life`, leaving `Setting Before You Decide.` together on the second line at both target widths.
- Spacing and layout rhythm: title, subtitle, 530 x 361 comparison scene, two 22px benefit icons, and 322 x 56 CTA preserve the existing geometry. The typography update makes the full component about 600 x 758 and 375 x 474.5 with no horizontal overflow.
- Colors and visual tokens: the outer canvas remains white; the warm ivory surface is limited to the centered 600px email container. Near-black copy, white label borders, deep-red After label/icons/CTA, and white CTA copy match the reference palette.
- Image quality and asset fidelity: the exact supplied 1060 x 722 scene and 54 x 54 checkmark asset are used through the public Omnisend URLs; no generated substitutes or placeholders remain.
- Copy and content: all reference copy is preserved exactly, including `Come to LifeSee YourCurtains` and the two benefit sentences.

## Focused Evidence

- `visualizer-comparison-600-final.jpg` places the normalized 600 x 752 source beside the updated 600 x 758 implementation; all typography, image, label, benefit-row, and CTA details remain legible.
- The supplied scene asset contains its own white pill labels. Email-safe opaque HTML label tables cover those pills to reproduce the rectangular white-outline/red treatments shown in the source without absolute positioning or image alteration.
- Browser measurements at 600px: component about 600 x 758, title 30px/38px at weight 400, subtitle 18px/27px at weight 500, scene 530 x 361px, CTA 322 x 56px.
- Browser measurements at 375px: component about 375 x 474.5, title 18.75px/23.75px at weight 400, subtitle 11.25px/16.875px at weight 500, scene about 331.25 x 225.625px, CTA about 201.25 x 35px.
- Browser console: no errors or warnings.
- Wide-canvas boundary check at 900px: outer canvas `rgb(255, 255, 255)` across 900px; centered email container `rgb(251, 240, 219)` from x=150 to x=750 with no horizontal overflow.
- CTA inspection: one independent `VISUALIZE YOUR SPACE` anchor points to `/pages/free-design-service` with `utm_source=omnisend`, `utm_medium=email`, and `utm_id=cover-fc`.

## Comparison History

1. Initial implementation used measured 600px geometry and the exact supplied assets.
2. The equal-size side-by-side comparison found no actionable P0/P1/P2 drift, so no visual correction loop was required.

## Verification

- `xmllint --html --noout output/free-design-service-hero/service-visualizer-preview.html`: passed
- Forbidden email markup scan: no JavaScript, iframe, form, Flex, Grid, fixed/absolute positioning, media queries, `file://`, or `asset://`
- Asset/link contract: exact supplied scene URL, two supplied check icons, and exact escaped tracked CTA URL passed
- `node scripts/normalize-inline-mobile-dimensions.mjs --check`: 52 registered components / 104 files checked / no unscaled declarations
- `node --test tests/mobile-proportional-contract.test.mjs`: 2/2 passed
- Omnisend editor and real Gmail/Outlook/Apple Mail delivery were not tested in this preview-only stage.

final result: passed
