# Delivery audit
- Pixso selection: 243:3502; HTML export page: 0:0.
- Output: email.html (paste-ready table fragment), effect-preview.html (browser wrapper).
- Layout: 600px email, 534px heading, 510px two-column grid, 247px cards with 219px image + 28px discount strip. 375px proportional scaling.
- Six original product names (full text retained), image URLs, product URLs and discounts preserved. No prices invented.
- CTA: REFRESH YOUR HOME; sale-page URL with omnisend/email/cover-rc UTM.
- Component background transparent; preview canvas #FBFAF8.
- Necessary email adaptation: nested presentation tables replace absolute Pixso layout. Long supplied names use two-line bounded blocks, so row spacing is uniform instead of variable as in reference.
## Resource handling
8 resources processed; 7 downloaded. Lora export returned malformed undefinedundefined and HTTP 415, including manual retry. Original failure recorded in source/resource-manifest.json. Preview requests Google Fonts with Georgia/Arial fallbacks; email fragment uses font stacks and relies on host font loading. No temporary URLs in deliverable email.
## Source cleanup (source/0_0.html)
- Temporary resource references: 8 localized path replacements, 0 remaining localhost references; one missing local font path retained for reproducibility.
- Node IDs: found 54, removed 54, retained 0 (no references).
- Generated class names: found 60, renamed 60, retained 0. Paired DOM/CSS mapping saved in source/class-map.json. Class token counts and CSS declarations preserved.
- Original reference crop/mask wrappers retained because they affect appearance. Export reference is not the paste-ready email.
## Verification
node output/pixso-sale-six-grid/verify.cjs passed.
600px and 375px: document scroll width equals viewport; all six images loaded. Product name heights 54px / 33.75px, line heights 27px / 16.875px. Screenshots saved; 375px visually inspected.
Table closing-tag balance, product values, asset URLs and CTA checked.
## Limitations
This is local Chrome proof, not inbox testing. CSS min(), object-fit and multiline clamp have uneven email-client support; clients without clamp may clip text without ellipsis. Web fonts may fall back to Georgia/Arial. Test Omnisend preview and a delivered sample before sending.

