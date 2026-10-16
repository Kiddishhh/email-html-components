# Pixso Columbus hero delivery

Navigation update: selected node298:3840, screenshot and HTML retrieved. Navigation600x56, #8D1B1B, Verdana14/400 white; underlined SIGN UP points to homepage with current Columbus_Day_Sale UTM. Added before hero in component.html and effect-preview.html. Reverse comparison confirms pre-existing hero unchanged byte-for-byte. New total height914px at600px width. Navigation reference:0 temporary assets,4 node IDs removed,4 class names renamed in both markup and CSS; unavailable font stylesheet and animation references removed. No new local upload requirements. Actual browser/inbox visual validation remains pending.

Design node: 298:3843. HTML email adaptation. Design screenshot retrieved successfully.

## Files and cleanup
| File | Temporary asset URLs found/replaced/retained | Node IDs found/removed/retained | Generated classes found/renamed/retained |
|---|---|---|---|
| 0_0.html | 5/5/0 | 17/17/0 | 17/17/0 |
| component.html | 0/0/0 | 0/0/0 | 0/0/0 |
| effect-preview.html | 0/0/0 | 0/0/0 | 0/0/0 |

Five Pixso assets localized (four graphics and one font). Generated class names changed in CSS and markup in pairs. No state classes introduced. All unused node IDs removed. Static export animation reference removed because no animation script or handlers exist. CSS declarations unchanged during export cleanup. Separate email adaptation uses tables rather than export positioning; no optional design refinement applied.

## Geometry
600x858 canvas. Card x36 y43 width528 height766 (#F7F4EC). Title y87 width380 height66 (original vector rasterized at 3x). Subtitle y171 line36 font24 Montserrat500. Image x73 y265 width454 height405. CTA x173 y703 width254 height56, Verdana18/400, #8D1B1B. Card bottom809; section bottom858. Proportional min(px,vw) mobile scaling retained from project convention.

User background source1545x866, crop rectangle x302,y4,width600,height858 matching exported offset and bleed. Component uses equivalent CSS background-size257.5% 100.932401%, position31.957672% 50% against the supplied hosted URL. A separately cropped PNG is provided as an optional upload artifact, not currently referenced. Supplied mask908x810 displayed454x405 without recropping.

## Verification and limitations
Static table nesting, exact case-sensitive CTA UTM, asset presence, arithmetic858px section height checked. Title and crop assets visually inspected. Whole-component browser rendering and real Gmail/Outlook inbox behavior untested. Classic Outlook may not honor the CSS background crop without an uploaded pre-cropped background and VML adaptation. Montserrat falls back to Arial where webfonts are unsupported. Browser screenshot restriction from earlier in this chat was not bypassed.

## Required before email deployment
Countdown upload completed: component.html and effect-preview.html now use https://app.omnisend.com/images/6acc86a5a29dcc0ffc64fc9a. All component image references use user-supplied hosted URLs. Local effect-preview.html embeds localized Montserrat font; component uses a Google Fonts link with fallbacks. Saved-source readback verified; image dimensions and rendering were not revalidated in this URL-only update.

CTA https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=Columbus_Day_Sale
