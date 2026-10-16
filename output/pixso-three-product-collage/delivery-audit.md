# Pixso three-product collage delivery audit

- Source node: 230:3580; framework: HTML.
- Email adaptation: table layout and inline styles, matching the screenshot's left tall image and two stacked right images; desktop width 600px.
- Images: all three supplied Omnisend HTTPS URLs used verbatim.
- Links: three supplied product URLs and the previously used sale CTA, all with utm_source=omnisend, utm_medium=email, utm_id=cover-rc; ampersands HTML-escaped.
- CTA target: https://freshinelife.com/pages/freshine-sale (inherited from the conversation).
- Background: transparent email container and preview canvas; brand-red CTA retained.
- Fonts: Lora 400 title (30/45px), Montserrat 500 subtitle (16/24px), Montserrat 500 CTA (18px).
- Browser preview loads Google Lora and localized Montserrat. Email component has standard Georgia/Arial fallbacks.
- Pixso Lora asset returned undefinedundefined / HTTP 415. The broken font rule was removed from the saved reference; the other 3 images and 1 font downloaded successfully. Failure details remain in source/resource-manifest.json.
- Generated source cleanup: paired CSS/DOM renaming, unreferenced node IDs removed, heading and linked CTA given appropriate tags; original mask/layout declarations retained.
- The deliverable HTML is adapted to project email table requirements; it is not the original web Flexbox/mask export.
- Browser validation: 600px and 375px, all supplied images loaded, intended fonts loaded, no horizontal overflow. Image bottoms match within 0.02px desktop and exactly on mobile.
- Browser preview is local rendering evidence; no Omnisend send/inbox verification was performed.
- Source artifact is reference only; use email.html for a Custom HTML block.

| File | Temporary URLs found / replaced or removed / retained | Node IDs found / removed / retained | Generated classes found / renamed / retained |
| --- | --- | --- | --- |
| source/0_0.html | 5 / 5 / 0 | 18 / 18 / 0 | 21 / 21 / 0 |
| email.html | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| effect-preview.html | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

Four valid source assets were localized; the fifth URL was the invalid Lora font placeholder, removed with its failed rule. No generated IDs or class names were retained. Source class-token counts were preserved during renaming.
