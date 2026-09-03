---
name: build-omnisend-campaign-draft
description: Use when creating, editing, previewing, exporting, or uploading a Freshine component-based Omnisend Campaign draft in the local HTML editor.
---

# Build Omnisend Campaign Draft

## Current editor entry

Run:

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

Open `http://127.0.0.1:4173`. The editor reads every component from `组件清单.json`; do not maintain a separate selectable-component list. Before changing registration or assembling a Campaign, run:

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

A valid result means the registry paths, component Schemas, default snapshots, demos, and editor field contracts agree for all current components.

## Workflow

1. Create or resume a local draft. Campaign name is for internal identification; Subject is the inbox title; Preheader is the inbox preview summary.
2. Add any registered component, including repeated instances, and arrange the instances in the required order. No component is required to occupy a particular position.
3. Edit only the fields exposed by the selected component's editor contract. Each edit clears that instance's confirmation and refreshes the preview.
4. Check the generated email at the fixed 600px desktop canvas and the 375px mobile target. Selecting a structure item moves that instance to the top of the preview and briefly outlines it.
5. Confirm each component, then confirm the complete HTML. Final confirmation is bound to the HTML content hash; any edit invalidates it.
6. Choose one output:
   - `导出 Omnisend HTML`: upload unresolved local images, replace `asset://` references with public HTTPS URLs, and copy the complete HTML. This does not create or update a Campaign.
   - `上传 Omnisend 草稿`: update the most recently updated exact-name Draft, or create a Draft only when no match exists. Never send, schedule, or publish.

## Current editor capabilities

- Free composition from all registered components: add, repeat, drag-sort, select, edit, confirm, and delete.
- Named local templates: save the current complete snapshot only after confirmation, select a template to create a new editable draft, overwrite only after confirmation, and delete the template together with its dedicated local-image copies.
- Local image upload and preview exist only for the current editor run. Saving a template copies its selected local images into that template's dedicated asset directory; component-directory assets are never copied or deleted.
- Desktop/mobile preview switching and selected-component positioning.
- `navigation.visible` toggle for the four navigation-capable head-image styles. When disabled, the navigation markup and its height are removed from generated HTML while the saved copy, URL, and colors remain available for re-enabling.
- Shopify read-only import for the six-product grid, registered four-product grid styles (one selected product per card), and the two single-curtain promotion cards. The navigation promotion CTA is text, color, divider-image, and CTA-link only.
- `collection.productGrid4NoSidePadding` is the independent full-width four-product layout: 600px with 289×361px cards and a 22px gutter. Its four Shopify imports update only the selected card, including its CTA text.
- Runtime-only Omnisend API Key dialogs with show/hide support. Keys are cleared after success, failure, or cancellation and are never written to drafts, files, parameters, environment variables, logs, or chat.

## Component and style rules

- `review.sceneComparison` is the independent “场景对比评论卡” under “评论组件”. Preserve its VIII.jpg checkerboard layout (600×677px, two columns at 375px), 17 editable content fields, three scoped colors, and four exact source crops via `localReferenceAssets`. Only the lower-left CTA links to the supplied Marisol product with `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`. Default assets are local preview inputs; use the existing confirmed export flow to upload and resolve them. Do not replace the scene imagery or reviewer with generated assets.
- `gift.doubleGiftAddressShowcase` is the independent “双赠品展示卡2” under “赠品与权益组件”. Preserve its approved 600px side-by-side tiered layout, 262px cards, 12px gap, exact crops from `容器 117.png`, two CTA-only links, and proportional 375px rendering. Its four local assets are preview inputs; only the red `SPEND` bars link, and the component does not create Shopify gift rules. Keep `gift.showcase2` and `gift.rewardGrid2` unchanged.
- `image.benefitsAddressCard` is the independent “权益+地址组合卡” under “赠品与权益组件”. Preserve the approved 1200×1704px source as one unlinked image: 600×852px desktop and 375×532.5px mobile. Expose only image URL, Alt and outer surface color; do not split, crop, redraw, add hotspots, or replace the showroom/address content with HTML fields.

- `组件清单.json` is the single source of truth for component paths and order in the catalog.
- A registered component must include its template, content/settings Schema, fixture/defaults, management guide, component CSS, and `效果演示.html`, and must have an explicit field contract in `editor/public/editor-ui-contract.mjs`.
- Preserve each component's confirmed visual design. The shared baseline is a 600px email canvas, 375px mobile verification, proportional images, email-safe table markup and inline CSS, usable link/CTA areas, and no cross-component CSS leakage.
- Default `asset://` images are local-preview inputs. Final Omnisend HTML must contain public HTTPS images.
- `collection.saleGrid4WithTitle` is the independent “四宫格折扣推荐（标题款）” style under “活动商品组件”. It exposes 24 content fields, five scoped colors, and four selected-card Shopify import buttons. Preserve its confirmed Montserrat typography, 600×933px desktop layout and two-column 375px layout. Current default discounts are 30% / 40% / 35% / 50% in top-left, top-right, bottom-left, bottom-right order. All four product destinations and the separate APPLY DISCOUNT CTA include `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`; the CTA uses the user-confirmed `https://freshinelife.com/collections/roman-shades`. Product import replaces only the selected card, including its link and caption; reapply required UTM after importing. See the component management guide and interaction reference.
- `collection.saleGrid4DetailWithTitle` is the independent “四宫格详情折扣（标题款）” style. Preserve its 600px / responsive 375px two-column layout, 519px content table, 247px square images and price-detail cards. Product names, discount labels and prices are plain text; only each image and its SHOP NOW CTA link to the same product URL. Four selected-card Shopify imports update only the chosen card's first image, Alt, full title, tracked URL, first available variant price, valid compare-at price and discount label; they do not change CTA copy, other cards, top copy or colors. Every default and imported product destination must contain `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`.
- `hero.romanShadeDiscount` is a separate 600px / responsive 375px hero with an editable circular logo, translucent panel, two-line discount and tracked CTA. Its `navigation.visible` toggle defaults to `true`; the removable top navigation is 56px high on desktop and 35px at 375px, with fixed copy/link and left/right/text colors `#604211` / `#6B492C` / `#FFFFFF`, without new color inputs. Navigation uses Montserrat 16px / 500 / 20px on desktop and 11.25px / 500 / 15px at 375px. The default CTA text is `Decorate your home now`. Preserve the original 600×761px scene, reference crop, local assets and CTA UTM. With navigation enabled/disabled, total size is 600×817px / 600×761px on desktop and about 375×520.98px / 375×485.98px on mobile; see its management guide and interaction reference for fixed navigation copy, text geometry and the compensated tag offset that aligns its visible top edge to the eyebrow border.
- `hero.gradientScenePromotion` is the independent “渐变场景活动头图”. Preserve its 600×761px full-click canvas, 375px proportional contraction, fixed `50.310559% top` square-scene crop, bottom `#FBFAF8` gradient, 97px circular logo, and three confirmed text layers. Expose the background/Alt, one whole-hero HTTPS link, logo/Alt, the three copy fields, fallback surface, and text color; do not add navigation, a separate CTA, Shopify import, or geometry controls. Keep its supplied Omnisend images as local preview assets only and preserve the full late-summer UTM link.
- `hero.circleLogoSceneOverlay` is the independent “圆标场景叠字头图”. Preserve its 600×761px full-click canvas, 375px proportional contraction, centered `cover` crop of the supplied 1216×1522 scene, 120px top circular Logo, and three white lower text layers. Expose the background/Alt, one whole-hero HTTPS link, Logo/Alt, activity name, main offer, one naturally wrapping subtitle field, fallback surface, and text color; do not add a gradient, navigation, separate CTA, Shopify import, or geometry controls. Keep its local scene and Logo assets preview-only. The default whole-hero link uses `utm_source=omnisend&utm_medium=email&utm_id=cover-fc`.
- `collection.romanShadeMultiRecommendation` is the independent “三图推荐（CTA+标题）” product component. It has an editable title/description, three independently linked source images and discount labels, a separate CTA, and four scoped colors. It preserves the approved 600px geometry: a 536×595 main scene, 256px square pair with a 20px gap, then a 536px outlined CTA; at 375px all geometry contracts proportionally through inline `min()` rules and preserves two product columns. Its supplied default links use `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`; it has no Shopify import behavior.
- The head-image variants (including the centered 600px / responsive 375px scene-overlay hero), promotion-card variants, product recommendation cards, reviews, benefits, address, gift, measurement, and footer styles are documented in [component-interactions.zh-CN.md](references/component-interactions.zh-CN.md).

## New component creation from an approved design

When the request is to create a reusable component from a design, read [new-component-standard.zh-CN.md](references/new-component-standard.zh-CN.md) before deciding its name, fields, assets, or implementation scope. It defines the required confirmation boundary, email-safe layout contract, registration and documentation set, and evidence required before reporting the component as complete.

## 600px → 375px 移动端等比制造规范

Every new component and every approved visual-layout change must follow the 600px-to-375px proportional inline-CSS contract in [new-component-standard.zh-CN.md](references/new-component-standard.zh-CN.md). Keep the 600px desktop declaration first, then add its `min()` proportional override to every relevant nonzero visual size in both `component.template.v1.html` and `效果演示.html`; do not mix scaled images with fixed typography, spacing, or CTA geometry. Before delivery, run `node scripts/normalize-inline-mobile-dimensions.mjs --check` and `node --test tests/mobile-proportional-contract.test.mjs` in addition to the normal component-contract checks.

## References

- Read [visual-editor-workflow.zh-CN.md](references/visual-editor-workflow.zh-CN.md) for editor controls, templates, focus behavior, previews, export, and Draft upload.
- Read [component-interactions.zh-CN.md](references/component-interactions.zh-CN.md) when choosing or editing a component style.
- Read [new-component-standard.zh-CN.md](references/new-component-standard.zh-CN.md) when creating a new reusable component from a design or reference image.
- Read [workflow-and-safety.zh-CN.md](references/workflow-and-safety.zh-CN.md) before exporting HTML or writing an Omnisend Draft.
- Read [shopify-data-contract.zh-CN.md](references/shopify-data-contract.zh-CN.md) only when importing Shopify activity, Collection, or product data.

## Safety gates

- Never send, schedule, publish, or call an endpoint that moves a Campaign out of `draft`.
- Shopify access is query-only and Theme pull-only; never mutate Shopify data or themes.
- Do not upload images or write Omnisend data before final confirmation.
- Email HTML must not contain JavaScript, iframe, forms, local paths, relative image paths, or runtime Shopify requests.
- Preserve `[[unsubscribe_link]]` and the complete Omnisend Email Content structure when updating an existing Draft.
- Treat normal editor drafts, previews, image caches, and export intermediates as transient: remove them when the editor closes. Persist only user-confirmed templates and their dedicated local images; never delete component-directory assets.
