# Columbus Day Sale hero — local draft

- Selection: 243:4045, HTML; source saved to source/0_0.html, screenshot inspected.
- Production background: supplied HTTPS image, 1200 × 1726. Photo crop differs slightly from selected Pixso screenshot; supplied artwork is authoritative.
- Hero 600 × 863; appended top navigation 600 × 56; total 600 × 919.
- Transparent outlined CTA 242 × 52 at x179/y778 within artwork, Montserrat 600/18. URL and both UTMs retained from approved prior component.
- 375px render: total height574.375, CTA151.25 × 32.5; no horizontal overflow. Table nesting tests passed for email.html and effect-preview.html.

## Source cleanup

| File | Category | Found | Replaced/removed | Retained |
| --- | --- | --- | --- | --- |
| source/0_0.html | Temporary resource URLs | 6 | 6 localized | 0 |
| source/0_0.html | Generated classes | 20 | 20 paired semantic renames | 0 |
| source/0_0.html | Node IDs | 18 | 18 removed | 0 |
| source/0_0.html | Missing script reference | 1 | 1 removed | 0 |

Five images and one font localized. Source references one additional unresolved relative underlay image (image/7bff4bddb5395eb56a6a72797bfdd256dafc8531.webp); unavailable from export, retained only in archival source rather than replaced with invented content. Production does not use this underlay or any source assets. Source decorative raster wrappers retained to preserve reference layering. Font family alias corrected. No optional redesign performed.

## Limitations

Browser renders checked at600/375, not an inbox or Omnisend-send test. Proportional min()/calc() scaling, background images and rounded outline may differ in email clients. VML background fallback included, but Outlook button radius is not guaranteed. Campaign copy is baked into user-supplied artwork. No UP TO65% OFF added because current selected design and supplied artwork do not contain it.
