# Freshine welcome email draft QA

Source: assets/reference.png (1318 × 1170). Supplied coupon 486 × 290, logo 1200 × 110, copy icon 40 × 40.
Implementation: http://127.0.0.1:8768/index.html
Comparison: http://127.0.0.1:8768/compare.html
Mobile: http://127.0.0.1:8768/mobile.html
Browser screenshots were inspected inline in the task; no screenshot file was exported.
Desktop comparison viewport 1240 × 640; reference displayed at 606px wide (including source canvas margin), implementation iframe 600px wide. Mobile iframe 375 × 650. Browser reports DPR 1; screenshot provider appears to scale page content, so exact pixel fidelity is not certified.

Fonts: replaced first-pass Georgia with Times New Roman to better match the supplied serif title. Arial fallback is narrower than the apparent Montserrat reference; exact font parity remains unresolved. Layout: side-by-side tickets, headline, terms and outlined CTA maintained. Mobile copy wraps and tickets stay side by side. Colors: source logo and coupon preserved without modifications, warm off-white content background. Assets: original PNGs, no generated substitutes. Copy: reference wording retained, copy icon omitted as a stated provisional email-safe choice.

Comparison history: first desktop comparison found title-family drift; second comparison inspected Times New Roman correction. Mobile screenshot showed all text and CTA visible. Focused pixel comparison remains limited by screenshot scaling.

Open issues:
- Resolved: user supplied both CDN image URLs and CTA destination. All three exports updated; placeholders removed. Browser showed both assets and exact CTA query parameters. New standalone logo measured 180 × 58 and resized to 90 × 29 with a 55px centered header; corrected oversized first replacement. Remaining QA issues below are unchanged.
- Offer combination claim requires merchant confirmation.
- The original apparent Montserrat typography has not been reproduced exactly.
- No Shopify Send test or inbox validation. VML Outlook background is present but untested. Clients blocking background images can hide white coupon text; alternative text-only or image-safe fallback should be finalized after target-client requirements are known.
- Browser log contains MutationObserver observe error with no application-script source; source files contain no scripts. Cause not established.

final result: blocked

This is a reviewable draft, not a production-sendable or design-QA-passed handoff.

## Typography and responsive revision, 2026-09-08
User typography requirements supersede the original image typography and capitalization. Lora 400 title 36/46, Montserrat 500 body 20/150%, coupon copy 16/20, terms 500 italic 16/20, CTA 600 16/20 are now implemented with 0 letter spacing and center alignment. Prior Arial/Times New Roman-only observation is superseded. Official font-face declarations are embedded in the full email, with fallback families retained.

Inspected browser output at 600 × 700 and 375 × 550; exact DOM metrics recorded in task tool outputs. Desktop title 36/46, subtitle 20/30, code 16/20; mobile title 22.5/28.75, subtitle 12.5/18.75, code 10/12.5. Ticket width/height 243/145 → 151.875/90.625. Document scroll width matches viewport in both cases. Body computed background rgba(0,0,0,0). Latest browser error log is empty, superseding earlier log entry. Screenshots inspected inline; no exported screenshot file.

Standalone static audit: 45 responsive overrides, no div/style/script in the component fragment, one root table, all six coupon background URLs and CTA parameters preserved. Shared registry normalizer, 2 proportional tests, component contracts, and git diff --check passed. Registry checks do not cover this standalone component; explicit standalone audit does. See 规范检查.md.

Requested typography/background/responsiveness changes verified locally. Full original-image design QA remains uncertified because screenshot provider scales content and no complete normalized screenshot artifact was exported. Inbox and Shopify send tests remain unperformed.
