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
- `navigation.visible` toggle for all four head-image styles. When disabled, the navigation markup and its height are removed from generated HTML while the saved copy, URL, and colors remain available for re-enabling.
- Shopify read-only import for the six-product grid, four-product discount grid (one selected product per card), and the two single-curtain promotion cards. The navigation promotion CTA is text, color, divider-image, and CTA-link only.
- Runtime-only Omnisend API Key dialogs with show/hide support. Keys are cleared after success, failure, or cancellation and are never written to drafts, files, parameters, environment variables, logs, or chat.

## Component and style rules

- `组件清单.json` is the single source of truth for component paths and order in the catalog.
- A registered component must include its template, content/settings Schema, fixture/defaults, management guide, component CSS, and `效果演示.html`, and must have an explicit field contract in `editor/public/editor-ui-contract.mjs`.
- Preserve each component's confirmed visual design. The shared baseline is a 600px email canvas, 375px mobile verification, proportional images, email-safe table markup and inline CSS, usable link/CTA areas, and no cross-component CSS leakage.
- Default `asset://` images are local-preview inputs. Final Omnisend HTML must contain public HTTPS images.
- The four head-image variants, promotion-card variants, product recommendation cards, reviews, benefits, address, gift, measurement, and footer styles are documented in [component-interactions.zh-CN.md](references/component-interactions.zh-CN.md).

## New component creation from an approved design

When the request is to create a reusable component from a design, read [new-component-standard.zh-CN.md](references/new-component-standard.zh-CN.md) before deciding its name, fields, assets, or implementation scope. It defines the required confirmation boundary, email-safe layout contract, registration and documentation set, and evidence required before reporting the component as complete.

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
