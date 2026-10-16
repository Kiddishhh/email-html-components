# Design QA — center offer detail correction

Source visual truth: reference.png (original 888 × 1012).
Comparison normalization: remove the gray outer frame from comparison coordinates; the 856 px content width is rendered at 600 CSS px (scale 600/856). Original assets are unmodified.
Implementation: preview.html renders the exact component.html contents with zero browser body margin; email.html retains the supplied Liquid suffix (final newline normalization only).
Evidence: comparison-600.png (1300 × 850); implementation-600.png (600 × 750); implementation-375.png (375 × 750).

Scope: user-highlighted split offer, divider, SITEWIDE label, and spacing before tier cards.
Previous reports overstated fidelity. The previous divider was off-center due to padded 50% table columns, and its lower endpoint overlapped the label. Moving the label alone then collapsed its gap to the cards. Those reports are superseded.

Current structure: three fixed percentage columns; the center column owns an 11 px top spacer, 73 px divider, 13 px gap, 26 px label, and 30 px bottom spacer. Images sit in their own nested side tables. No negative margins or overlap.
Desktop measured relative to the 600 px shell: divider center x=300, y=185–258; label center x=300, y=271–297; card start y=327. The original reference predicts approximately x=299–300, divider y=185–258, label y=271–297, cards y=327.
Mobile measured: viewport and document width 375; line and label centers both x=187.5; divider-to-label gap 8.125 px. No overflow.

Required fidelity surfaces:
- Typography: existing text families preserved; supplied UP TO / EXTRA and discount typography remain in the actual PNGs. Local text falls back to installed fonts; inbox font rendering is unverified.
- Spacing: center alignment and both vertical gaps match normalized reference geometry; no touching or crossing borders.
- Colors: inherited near-black, warm gray dashed border, and off-white retained.
- Images: real supplied PNGs retained with intrinsic aspect ratio via height:auto, no stretching.
- Copy: SITEWIDE and all offers unchanged.

Full comparison: comparison-600.png reviewed with both source and implementation in one input. Focused review: numeric bounding boxes of the divider and label plus the 375 px screenshot show separated borders and correct centering.
No actionable P0/P1/P2 issues remain in the highlighted center detail. Other differences outside this correction include fallback typography, logo-strip color, and previously chosen card/CTA dimensions; this is not a claim of a pixel-identical whole email.
CTA href verified in browser; no console errors. Local HTML checks only, not email-client testing.

final result: passed
