# Design QA — Fall Home Refresh Countdown Hero

## Evidence

- Source visual truth: `/Users/ww/Desktop/邮件营销运营/邮件html组件/output/fall-home-refresh-countdown-hero-design-v6.png`
- HTML implementation: `/Users/ww/Desktop/邮件营销运营/邮件html组件/output/fall-home-refresh-countdown-hero/effect-preview.html`
- Browser-rendered implementation screenshot: `/Users/ww/Desktop/邮件营销运营/邮件html组件/output/fall-home-refresh-countdown-hero/preview-600.png`
- Mobile proportional evidence: `/Users/ww/Desktop/邮件营销运营/邮件html组件/output/fall-home-refresh-countdown-hero/preview-375.png`
- Same-input full-view comparison: `/Users/ww/Desktop/邮件营销运营/邮件html组件/output/fall-home-refresh-countdown-hero/comparison-1200.png`
- Viewports: 600 × 760 CSS px and 375 × 475 CSS px.
- Source pixels: 1114 × 1412. The source was normalized to 600 × 760 in the comparison page.
- Implementation pixels: 600 × 760 at device scale factor 1. The local 375 × 475 evidence image is the 62.5% normalized copy of that capture; a separate live in-app-browser check measured the responsive HTML itself at exactly 375 × 475 with `scrollWidth: 375`.
- State: default loaded state; all three links present; both local images loaded; no console errors or warnings.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: Lora and Montserrat preserve the intended hierarchy, weight contrast, tracking, and single-line wrapping at both target widths. Small raster-metric differences from the generated design lettering are P3 only.
- Spacing and layout rhythm: navigation, 360px scene, 62px urgency ribbon, and 300px offer panel align to the reference proportions at 600px and contract to 62.5% at 375px.
- Colors and visual tokens: deep brand red, terracotta offer type, warm ivory panel, and gold botanical decoration match the source palette closely.
- Image quality and asset fidelity: the clean background plate preserves the reference room, side botanicals, urgency ornaments, and soft offer-panel shadows. The logo is a dedicated alpha PNG. Its missing ivory border is an intentional user-requested deviation.
- Copy and content: navigation, three-day urgency, Fall Home Refresh theme, discount, benefits, and `SHOP NOW` copy match the approved content. `SIGN UP` has no filled button background and `SHOP NOW` has no arrow.

## Full-view comparison evidence

The 1200 × 760 comparison places the normalized source at left and the browser-rendered implementation at right. Major section boundaries, subjects, navigation allocation, logo placement, urgency composition, offer hierarchy, and CTA geometry align visibly.

Focused crops were not required: the combined 1:1 comparison keeps the smallest navigation and benefit copy legible while showing every fidelity surface on one canvas.

## Comparison history

1. Initial responsive pass: the 375px render expanded to 481.23px because the enlarged display typography plus spacers exceeded the proportional 187.5px offer region. This was a P2 proportional-height mismatch.
2. Fix: reduced only the offer panel's top/title and trailing spacer budget while retaining the approved type sizes and content.
3. Post-fix evidence: the live browser measured 600 × 760 and 375 × 475 exactly, with no horizontal overflow and no failed images.
4. Logo follow-up: removed the logo from the background plate, reconstructed the curtain behind it, exported an independent transparent circular logo, and removed its ivory outline per the latest user instruction.

## Implementation checklist

- [x] Outer canvas stays white; design background is limited to the 600px email canvas.
- [x] Table-based email structure with inline styles and no JavaScript, form, iframe, flex, grid, or absolute positioning.
- [x] Desktop dimensions first, followed by proportional inline `min()` values for 375px.
- [x] Independent linked Logo, `SIGN UP`, and `SHOP NOW` click areas.
- [x] UTM parameters retained in current preview links.
- [x] Local asset references clearly isolated for later HTTPS replacement.

## Follow-up polish

- P3: final inbox rendering may substitute fallback fonts when Lora or Montserrat are unavailable; Gmail, Outlook, Apple Mail, and Omnisend inbox tests have not yet been run.

final result: passed
