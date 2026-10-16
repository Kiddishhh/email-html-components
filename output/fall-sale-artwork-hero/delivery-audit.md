# Three-day sale hero delivery

- Pixso selection: 243:3823; reference 600 × 813.
- Supplied background: 1200 × 1626; retained remote URL unchanged.
- Updated navigation to Pixso selection 243:3576: 600 × 56; left 457px #8D1B1B; right 143px #6B1414; Montserrat 500/16px; underlined SIGN UP, no divider. CTA remains 245 × 53 at x177.5/y717 within artwork.
- Both links include utm_source=omnisend, utm_medium=email, utm_id=cover-rc.

## Export cleanup

| File | Found | Replaced/removed | Retained |
| --- | --- | --- | --- |
| source/0_0.html temporary asset URLs | 1 | 1 localized | 0 |
| source/0_0.html generated class names | 2 | 2 renamed with selectors | 0 |
| source/0_0.html node IDs | 2 | 2 removed | 0 |
| source/0_0.html missing CSS/JS references | 2 | 2 removed | 0 |
| source/0_0.html decorative divs | 3 | 0 | 3 layout wrappers/artwork |

Source background image is the exported visual reference, not the production artwork. Production email uses presentation tables, inline CSS, the supplied HTTPS artwork, and a live HTML CTA. Outlook VML background fallback included.

## Browser verification

| Viewport | Rendered size | CTA size | Horizontal overflow |
| --- | --- | --- | --- |
| 600 | 600 × 869 | 245 × 53 | None |
| 375 | 375 × 543.125 | 153.125 × 33.125 | None |

Both screenshots reviewed. Background loaded at natural 1200 × 1626. Local Chromium checks only; not an Omnisend send or inbox compatibility test. Clients without CSS min() may use desktop fallback sizing; clients without web fonts use Arial.

Background replaced with supplied asset 6abb7e4eee659070d2075139 in HTML, CSS, and Outlook VML. It corrects the repeated TO. CTA and navigation destinations/UTMs unchanged.

## Navigation export audit (HTML)

File: nav-source/0_0.html; source node 243:3576; saved and screenshot reviewed.

| Category | Found | Replaced/removed | Retained |
| --- | --- | --- | --- |
| Temporary font URL | 1 | 1 localized | 0 |
| Node IDs | 6 | 6 removed | 0 |
| Generated class names | 6 | 6 paired renames | 0 |
| Missing script reference | 1 | 1 removed | 0 |

One Montserrat font downloaded. Corrected generated font-family mismatch to reference that font. Layout-only/decorative divs retained; p tags retained as text. Production integration uses email tables instead of absolute-positioned source layers. No inbox test performed.
