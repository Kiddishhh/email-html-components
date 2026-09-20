# 暖红双赠品卡IV — Design QA

final result: passed

## 六宫格场景价格（标题款）Design QA（2026-09-17）

### Source and implementation evidence

- Source visual truth: `/var/folders/qb/gfhrch2s3n19l1hfdcyw2yd80000gn/T/codex-clipboard-f9d4cf18-b8a8-4891-a86d-6e5fae1d4fa8.png`，1024×1536px；项目归档为 `audit/scene-sale-grid6-price-with-title/reference-square.png`。
- Implementation: `http://127.0.0.1:4173/` 中实际添加 `collection.sceneSaleGrid6PriceWithTitle`；桌面 600px 与移动 375px 按钮均实测。静态实现为 `活动商品组件/六宫格场景价格（标题款）/效果演示.html`。
- Same-input comparison artifact: `audit/scene-sale-grid6-price-with-title/reference-vs-preview.html`。参考图按 600/1024 归一化显示；实现以 600 CSS px、1× 浏览器密度检查，移动实现以 375 CSS px 检查。
- State: 默认六商品、全部折扣标签显示、折扣价与划线原价显示、底部 CTA 显示；六个 Shopify 导入入口可见。浏览器截图在本次 Codex 内置浏览器会话中检查，未单独持久化为 PNG。

### Findings and comparison history

- 首次浏览器检查发现 P2：商品 3 使用了不对应设计稿的生活场景图。已替换为项目现有 Ilythra Roman Shades 场景素材，重新创建草稿并在 600px/375px 预览中复核；商品类型与卡片文案重新一致。
- 修复后无剩余 P0/P1/P2。设计稿原价格行仅显示单一价格；本实现按用户明确要求有意改为折扣价 + 划线原价。参考图画布为 1024px，组件实现遵循项目强制的 600px/375px 邮件规范，因此副标题在 600px 下自然换为两行，属于字体规范约束下的可接受差异。
- P3：默认商品图来自项目现有场景素材，构图与参考图同类但不是参考 PNG 的逐像素裁片；Shopify 导入后会由实际商品首图替换。

### Required fidelity surfaces

- Typography: 主标题 Lora 400、30px/38px；副标题 Montserrat 500、18px/27px、黑色；商品名 Montserrat 500、16px/20px。600px/375px 均无截断或重叠。
- Spacing/layout: 600px 内 552px 网格、264px 方图、24px 列间距；375px 保持两列并等比缩放为 165px 方图、15px 列间距。三行卡片、价格行和 CTA 无横向溢出。
- Colors/tokens: 暖白 `#FBF6EC`、品牌红 `#A7191C` / `#B01E20`、深棕标题及灰色划线原价与参考秋季配色一致；全部限制在组件内部。
- Image quality: 六张真实场景图使用 `background-size:cover` 方形裁切；顶部与底部装饰为独立透明 PNG，无 CSS/SVG/文字图形替代。375px 下图像清晰、无拉伸。
- Copy/content: 标题、副标题、六个商品名、折扣文案和 CTA 与方图版设计一致；价格按用户要求扩展为折扣价与划线原价。
- Accessibility/interactions: 六张图有独立 Alt 与 HTTPS 链接；CTA 独立链接；标签空值可隐藏；编辑器中商品 1–6 导入按钮均可用。未执行真实 Shopify 查询，也未跳转外部链接。

### Validation

- 聚焦测试 3/3；完整测试 286/286；组件契约 53/53。
- 106 个已登记模板/演示文件通过 600px→375px 检查，未缩放声明为 0；`git diff --check` 通过。
- 本地浏览器覆盖编辑器注册、组件加入、600px/375px 切换、默认素材、价格与 CTA。未上传 Omnisend、未创建/发送 Campaign，也未做 Gmail、Outlook、Apple Mail 收件箱测试。

final result: passed
+
## 权益+地址组合卡设计 QA（2026-09-08）

- `image.benefitsAddressCard` 已使用用户本次提供的 `服务+店面.png`：1200×1698px，哈希 `48a8bfc0d46142b2d92864835243406c8156f607d4fc1bd0f8ef37e9f3b2198f`。完整图像作为单张无链接图片输出，不拆分、不裁切、不重绘。
- 桌面显示600×849px，375px移动端显示375×530.625px；通过 `width:100%;height:auto` 等比缩放。编辑器仅暴露整图URL、Alt和组件外部背景色。
- 独立端口4192实际添加“赠品与权益组件 → 权益+地址组合卡”成功，桌面与375px预览均加载本次精确原图。视觉证据位于 `audit/benefits-address-card/`。
- 当前验证限于本地组件、HTML编辑器和浏览器；未上传Omnisend、未创建/发送Campaign，未进行收件箱测试。

final result: passed
+
## 四宫格场景折扣（标题款）设计 QA（2026-09-08）

- 新组件 `collection.sceneSaleGrid4WithTitle` 已按样式XXVII参考稿注册到“活动商品组件”。600px版面为927px高，508px内容区、246px方图、16px列间距；375px保持双列等比缩放。
- 可编辑22项内容与6项颜色。四张图片和对应商品名称成对使用同一链接，无底部CTA；四个默认商品链接和Shopify导入后的链接均使用cover-rc UTM。
- 独立端口4191的实际编辑器已成功添加该组件，商品1–4导入按钮和全部字段可见。浏览器桌面与移动预览均加载四张本地默认素材，未发现需要修复的视觉偏差。
- 验证结果：聚焦测试4/4、完整测试270/270、组件契约52/52；104个模板/演示文件的移动尺寸检查为0个未缩放声明；`git diff --check`通过。视觉证据与说明保存在 `audit/scene-sale-grid4-with-title/`。
- 当前证据仅覆盖本地HTML、编辑器和浏览器预览；未上传Omnisend、未创建/发送Campaign，未做真实邮件客户端测试。

final result: passed

## Reference and evidence
- Source: `/Users/ww/Downloads/赠品版块_暖红IV 1.png`, 1200×1156. Normalize at 0.5 to 600×578 and 0.3125 to 375×361.25.
- Implementation: `http://127.0.0.1:4289/赠品与权益组件/暖红双赠品卡IV/效果演示.html`.
- Editor: `http://127.0.0.1:4188/`, 赠品与权益组件 → 暖红双赠品卡IV.
- Browser: Codex in-app Browser; CSS viewports 600×650 and 375×420. Viewport screenshots have one pixel per CSS pixel. Extra white area below component is outside the design.
- Desktop: `audit/warm-red-gift-iv/desktop-600.png`; mobile: `mobile-375.png`; source: `reference-600.png`.
- Same-input full comparisons opened: `comparison-desktop.png` and `comparison-mobile.png`. Focused header comparison opened: `comparison-typography.png`.
- Default state, two linked cards. Both images complete and loaded.

## Findings and comparison history
- First visual pass has no actionable P0/P1/P2 finding. Source geometry matches the intended two-column layout. No layout fix required after browser capture.
- P3: editable live heading is slightly wider than raster reference due to inferred Lora size and raster/font rendering differences. Font remains Lora 500 34px/44px; it does not wrap or clip at either viewport.
- A regression fixture enumerated the old gift catalog; updated expected list to include this newly registered component. This was a catalog expectation change, not a visual correction.

## Required fidelity surfaces
- Typography: editable Lora 500 heading, 34px/44px; Montserrat 500 condition text, 17px/25px. Both are centered, letter spacing 0. Mobile sizes are 21.25px/27.5px and 10.625px/15.625px. Exact reference wording retained, including $699+, $999+, and the en dash.
- Spacing/layout: measured desktop 600×577.98, mobile 375×361.23. Desktop card positions x=26.5/313.5, y=189.48, size260×340; mobile x=16.56/195.94, y=118.42, size162.5×212.5. Desktop gap27px. No horizontal overflow; scrollWidth equals 600/375 respectively. Editor measurements independently agree.
- Colors: source background sampled #FAF9F7; live text #222222. Original warm-red labels remain in source crops. No recoloring of source artwork. Minor screenshot/raster color appearance differences remain uncorrected to preserve original image pixels.
- Imagery: exact lossless independent crops [53,379,573,1059] and [627,379,1147,1059], each520×680. Value badges, photo, bottom caption and rounded corners remain part of each image; no invented icons, redrawn product photos or placeholders.
- Copy/content: title and two lines editable. Original image labels $59.9/$89.9 Value, ICE SILK EYE MASK and RANDOM PILLOW COVER preserved as image content and reflected in image Alt text. Image labels require whole-card replacement to change.

## Interaction and validation
- Component added through editor catalog. Nine content fields and two scoped color settings visible.
- Desktop/mobile preview buttons exercised; both cards loaded in both modes.
- Exactly two normal image anchors, both use the user-provided `https://freshinelife.com?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`. DOM href and generated-template contract verified. External destination/new-window navigation was not independently browser-tested.
- No browser console errors in preview or editor.
- Full tests: 261/261 pass. Registry/editor contract: 50/50 valid. Proportional normalization:100 files, zero unscaled dimensions. git diff --check clean.

## Implementation checklist
- [x] Registered component template/CSS, schemas, fixtures, source crops, demo and management guide.
- [x] Editor contract, index, interaction reference, README/Skill note and regression coverage.
- [x] Both viewport captures, full and focused visual comparisons, measured geometry and link checks.

## Delivery boundaries
Local source assets use asset:// in the fixture and local URLs in the demo. Final Omnisend export requires the existing confirmed public-HTTPS asset upload flow. No upload, campaign write, send, schedule, gift-rule creation or Git commit/push performed. Omnisend and inbox clients have not been tested; web-font and min() fallbacks remain client-dependent.

final result: passed
