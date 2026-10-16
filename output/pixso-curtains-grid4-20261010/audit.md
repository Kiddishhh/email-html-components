# Delivery audit

Design: Pixso 273:1; framework HTML; current selection successfully retrieved.

| File | Status | Temporary asset URLs found / replaced / retained | Node IDs found / removed / retained | Node class tokens found / renamed / retained |
|---|---|---|---|---|
| 0_0.html | Localized, cleaned reference | 7 / 7 / 0 | 30 / 30 / 0 | 37 / 37 / 0 |
| component.html | Email adaptation, static checks passed | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| effect-preview.html | Standalone wrapper of component | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

Phase A: localized six images and one font; removed unreferenced node IDs. Removed unavailable animation script (static export has no animation handlers).
Phase B: renamed all generated class tokens in DOM and CSS together. Class token count per element unchanged; no state classes added. No CSS declarations changed during cleanup.

Integration: separate table-based email component replaces export-only absolute positioning and masks. Uses permanent user-supplied image URLs, not localized design reference images. Georgia and Verdana use valid system font family names. All four requested image/title links and homepage CTA include utm_source=omnisend, utm_medium=email, utm_id=measurement-tool. Headline, subtitle, background and outlined CTA retained; labels changed to AMARA / IRIS / CELINA / ELARA. Right-bottom replacement image includes No-drill badge.

Known differences: export uses 253px bottom-row cards and 254px top-row cards; email uses aligned equal 254px columns. Images use full supplied assets at natural aspect ratio, capped at 254px wide. Mobile sizes scale proportionally to 375px, following the existing email convention. Title line height explicitly 36px. This is static validation, not browser or inbox visual proof. No optional refinement tags applied.

Follow-up layout correction: the fixed-layout table initially began with a colspan=3 heading and no colgroup, so later product-cell widths did not determine initial column sizing. Added explicit 254/20/254 proportional column definitions plus a zero-height first sizing row as fallback if colgroup is stripped. Removed forced 317px viewport-based image height and cover cropping. Source regression checks pass for both component.html and effect-preview.html; hrefs, images and all visible copy are unchanged. Current Pixso screenshot 273:1 was re-read; actual browser rendering remains unverified.

Verification: balanced table markup; four images; nine correct hrefs and UTM sets; matched image/title pairs; no temporary URLs in final HTML. Local browser file preview was previously policy-blocked; no alternate browser workaround used.
