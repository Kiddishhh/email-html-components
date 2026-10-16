# Freshine Welcome / Swatch email draft

- component.html: reusable email body fragment, with proportional inline styles. No footer.
- email.code-your-own.html: full HTML document for Shopify Messaging Code your own, with documented Shopify footer variables. About 6KB. Official image URLs and CTA URL have been inserted.
- index.html: local preview only, using official CDN images and the approved CTA URL.
- compare.html / mobile.html: visual review pages, never import into Messaging.

Configured URLs are stored in build.py. Logo is a standalone 180 × 58 PNG displayed at 90 × 29 in a centered 55px header. Coupon URL is used in all six HTML/CSS/VML references. CTA: https://freshinelife.com?utm_source=shopify-flow&utm_medium=email&utm_id=cover-rc
The copy icon is provisionally omitted; no JavaScript or Clipboard API is included.

The two images are already uploaded and linked. Source reference screenshot is not required for sending. 复制 1.png is needed only if the icon is later retained as a link affordance, not as actual copy functionality.

Shopify requires unsubscribe_url or unsubscribe_link in a full custom email, and open_tracking when tracking is enabled. Footer uses shop.name, shop.address and these documented outputs. Confirm rendered address in Messaging.

Sources (verified 2026-09-08):
https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/create-email/custom-liquid
https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/create-email/create-campaigns
https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads
https://help.shopify.com/en/manual/discounts/managing-discounts
https://mailchimp.com/help/limitations-of-html-email/

Email clients may replace fonts or block background images. Outlook VML is untested. Send test and check intended inbox clients before sending. Offer codes and combinations have not been queried or changed.

2026-09-08 typography update: Lora 400 title, Montserrat 500 body and coupon copy, 500 italic terms, 600 CTA. Background is component-scoped. All controlled geometry scales through inline min() at 375/600, except 1px borders. fonts.css contains official @font-face declarations, embedded into the full email head and preview. When using component.html alone, put these declarations in the host head; unsupported clients fall back. See 规范检查.md.
