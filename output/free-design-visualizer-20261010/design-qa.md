# Design QA

Source: reference.png (1200 × 1504, supplied screenshot).
Implementation: component.html / effect-preview.html, intended 600px desktop / 375px mobile.
State: standard email component, supplied before/after raster, existing check icon, active CTA.

final result: blocked

Browser refused file:// navigation under its security policy. No workaround or alternate browser was attempted. No implementation screenshot is available, so no visual fidelity or mobile-rendering pass is claimed.

Static checks: source background sampled #F6F1E6. Image source is user-provided. CTA resolves to free-design-service with utm_source=omnisend, utm_medium=email, utm_id=measurement-tool. Background is confined to the max-width 600px component, not the outer canvas. Fonts are Georgia/Verdana and existing Montserrat, inferred from supplied screenshot. Original unusual title wording retained.

Pending fidelity checks: typography and line wraps; spacing and total height; background, subtitle and CTA colors; check icon and image quality; copy comparison. Email-client rendering remains untested.

