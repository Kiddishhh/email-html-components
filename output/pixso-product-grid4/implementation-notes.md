# Pixso four-product email component

Source selection: 243:4043. Framework: HTML.

- component.html: paste-ready responsive email table. Content width 536px inside 600px, two 255px images, 26px gutter; proportional scaling at 375px. Uses supplied product data, including all image/CTA URLs and UTM parameters. Full names retained in HTML, visually clamped to two lines. Heading/subtitle, round top-right badges and buttons follow Pixso.
- effect-preview.html: local preview using project fonts. Measured 600×955 and 375×596.875; document scrollWidth equals viewport width. Four source Shopify images loaded in screenshots.
- 0_0.html: saved Pixso reference, class semanticization and unused numeric IDs removed. No layout dimensions changed. Integration repairs: missing animation script removed, font family aliases normalized, invalid color resolved to #7C706A, broken Lora export replaced by existing project font.
- Resources: 11 successful exported assets (4 images, 4 SVGs, 3 fonts); failed export assets/images/undefinedundefined (HTTP 415, Lora) repaired using ../pixso-exclusive-20260914/hero-source/fonts/Lora-Medium.ttf. Manifest retained for traceability. Actual component uses user-supplied remote product images, not Pixso placeholder images.

## Cleanup and data audit

```json
{
  "reference": {
    "idsFound": 63,
    "idsRemaining": 0,
    "classTokensFound": 63,
    "classTokensRemaining": 0,
    "temporaryUrlsRemaining": 0
  },
  "component": {
    "temporaryUrlsRemaining": 0,
    "products": [
      {
        "name": "Celina Linen Curtains – Elegant Floor-to-Ceiling Drapes for Living Room",
        "allFieldsRetained": true,
        "discountRetained": true
      },
      {
        "name": "Elara Linen Blend Curtains for Large Windows - Extra Long Luxurious Drapes for Every Room",
        "allFieldsRetained": true,
        "discountRetained": true
      },
      {
        "name": "Freshine Vaila Kenaf Bamboo Woven Shade Natural Elegance for Light &amp; Privacy",
        "allFieldsRetained": true,
        "discountRetained": true
      },
      {
        "name": "Avenia Linen Beige Cordless Light Filtering Cellular Shades",
        "allFieldsRetained": true,
        "discountRetained": true
      }
    ]
  }
}
```

Generated reference resource URLs were localized by resource-fetch; original temporary endpoint remains only in resource-manifest.json as provenance, not rendered HTML. Numeric class mappings were one-to-one. Semantic data-freshine-slot attributes retained intentionally for product integration.

Email adaptation is separate from export cleanup: absolute-position design DOM converted to inline presentation tables, with VML product backgrounds for classic Outlook. Browser preview does not prove inbox rendering; classic Outlook may render circular badges as rectangles, webfont support and mobile min()/line clamping vary by client. Email webfont link included; fallback fonts are Georgia and Arial.

