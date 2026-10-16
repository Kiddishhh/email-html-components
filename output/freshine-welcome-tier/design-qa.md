# Single-coupon email visual QA

Source: assets/reference.png, user screenshot 1188 × 956. Supplied artwork: assets/coupon.png, 926 × 238. Source image is shown at 612px wide including its surrounding canvas; coded component at 600px. Reference is approximate; the user's previous typography, capitalization, CTA URL and proportional sizing requirements supersede screenshot text styling.

Implementation: http://127.0.0.1:8769/index.html
Evidence: comparison.png (1240 × 600 browser screenshot, reference and implementation together); mobile.png (375 × 450). Browser provider renders content smaller within returned images; both desktop comparison panels use the same capture scale. Geometry verified independently from DOM CSS pixels. Desktop state is static 600px email; mobile state is static 375px email.

## Findings
No actionable P0/P1/P2 mismatch for the requested approximate reproduction with prior component configuration.
- Typography: Lora 400, 36/46 heading; Montserrat 500, 20/30 subtitle; Montserrat 500, 16/20 coupon labels/code; Montserrat 500 italic, 16/20 terms; Montserrat 600, 16/20 CTA. Exact coupon-code typography is intentionally smaller/lighter than the screenshot to preserve the previous configuration.
- Layout: original single wide coupon, off-center perforation from supplied artwork, two coupon content columns, centered header, outlined rounded CTA. Coupon 463 × 119 exactly preserves 926 × 238 asset ratio.
- Color: warm header and body contained within component. Document body transparent. Red and perforation supplied by original asset.
- Images: supplied HTTPS logo and coupon, no generated substitutes. Artwork and text alignment inspected in comparison.png; focused extra crop unnecessary because the small component and its complete coupon/CTA are visible in the same image.
- Content: Welcome To Freshine, On Top Of Your Tier Discount., Your Extra, Use Code, NEW15, NEW CUSTOMERS ONLY. ONE-TIME USE., SHOP CUSTOM CURTAINS. off and NEW15 preserved. Reference's bottom blue annotation excluded as external screenshot content.

## Verification
600px root has no overflow; coupon 463 × 119. At 375px no overflow; coupon 289.375 × 74.375. Heading 22.5/28.75, subtitle 12.5/18.75, small text 10/12.5. 1px borders retained per contract. CTA href inspected with all three original UTM parameters; destination was not visited to avoid campaign tracking during QA.
Standalone HTML audit: 40 inline proportional overrides, single root presentation table, no scripts/div/style/iframe/document wrapper/footer/unsubscribe, three coupon URL references and original CTA retained. Shared registry normalizer and 2 proportional tests pass; these registry tests do not cover this standalone file, hence separate audit. git diff --check passed.
Browser logs contain a MutationObserver error without a page-script source. Component has no scripts; source of browser instrumentation error not established. Visual rendering and DOM checks succeeded.

## Comparison history
Initial comparison accepted approximate layout with intentional typography and uppercase terms differences from prior user configuration. No visual fix loop was needed.

## Follow-up limitations
No Shopify Send test, Outlook VML, Gmail or Apple Mail validation. Remote fonts and min() may fall back. Image-blocking clients can hide white coupon text. CSS rounded corners may square off in older Outlook. Component is standalone and is not registered in the Omnisend editor.

final result: passed

## Coupon detail revision
New visual target: assets/detail-reference.png (926 × 238). Comparison evidence: detail-comparison.png, reference at 463 × 119 and coded coupon at 463 × 119 within two 600px panels. Viewport 1240 × 220, same provider scaling in both panels. Mobile evidence: detail-mobile.png, 375 × 500 viewport.
Earlier P2: labels/code too small and light relative to the new detailed reference. Fixed coupon labels to Montserrat 20/24 weight 500, 15 to 64/68 weight 500, NEW15 to 20/24 weight 700 with original underline. Right content inset 11px with 13px label-to-code gap. Code box stays 123 × 38, radius 2. New reference overrides prior coupon-only 16px typography.
Recomparison inspected both coupon images together, including letters, code box, red artwork, perforation alignment and content. No remaining actionable P0/P1/P2 differences for the requested detail adjustment. Mobile labels/code 12.5px; 15 40px; ticket 289.375 × 74.375, code box 76.875 × 23.7422. No horizontal overflow. Source-diff assertions confirm everything outside coupon unchanged. All inline sizing overrides verified.
final result: passed
