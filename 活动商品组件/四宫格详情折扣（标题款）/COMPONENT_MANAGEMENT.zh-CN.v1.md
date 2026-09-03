# 四宫格详情折扣（标题款）V1

- Component Key：`collection.saleGrid4DetailWithTitle`
- 分类：活动商品组件；独立新增，不覆盖其他四宫格组件。
- 设计来源：用户提供的 `样式XXVII.png`（1200×2114px），按 600px 邮件画布高保真复现。

## 组件结构

顶部为 `promotion.title` 与 `promotion.subtitle`。四张商品卡按左上、右上、左下、右下排列；每格包含折扣标签、正方形商品图、商品名称、折扣价、划线原价和 `SHOP NOW` CTA。

用户已确认：商品名称、折扣标签、折扣价与原价均为纯文本，不附带链接；只有商品图片和下方 CTA 可点击，两处共用该格的 `saleItems[n].image.clickUrl`。默认商品链接全部带 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。

## 编辑器字段

- 顶部：标题、说明。
- 每格：`discountLabel`、`image.url`、`image.alt`、`image.clickUrl`、`name`、`price.current`、`price.compareAt`、`cta.text`。
- 样式：组件底色、标题、说明、商品文字、折扣标签底色/文字、划线原价、CTA 底色/文字。
- 几何、列数、字体尺寸和间距固定，不在单封 Campaign 中开放。

## Shopify 逐格只读导入

编辑器提供“导入商品 1–4”。导入只更新当前选中组件实例的指定商品格：首张商品图、Alt、完整商品名、商品链接、首个可售变体价格、有效划线价和计算后的折扣标签。CTA 文案保持当前值；商品链接自动追加或覆盖指定 UTM。无有效划线价时，原价和折扣标签清空。其他三格、顶部文案和颜色不变。

Shopify 读取复用 `fetch-single-product.mjs` 的 query-only 链路，不修改商品、主题或其他 Shopify 数据。最终邮件不包含运行时 Shopify 请求。

## 固定视觉契约

- 桌面画布 600px；商品内容区 519px，两列各 247px，中间 25px。
- 顶部留白 40px；Montserrat 主标题 30px/400/40px；标题后 20px；说明 16px/400/24px；说明后 38px进入商品区。
- 商品图 247×247px；折扣标签高 31px，仅右下角 6px 圆角。
- 图片后 16px进入商品信息；商品名固定双行视觉区并保持纯文本；价格与划线原价同一行；CTA 高约 38px、整列宽。
- 两行商品之间 26px；组件底部 80px。375px 下保持两列，图片约 154px，并使用内联 `min()`/`max()` 渐进缩放，避免横向溢出。

## 默认商品快照

默认依次为 Marisol、Evelora、Nova、Ilythra。价格、划线价、折扣和主图来自 2026-08-31 读取的 Freshine 公开 Shopify 商品数据；它们是默认快照，不表示未来实时价格。使用编辑器导入可在制作 Campaign 时重新读取。

## 邮件与验证边界

模板只使用 table/tr/td、span、a 与邮件安全内联样式，不使用脚本、Flex、Grid、定位或外部 CSS。商品图提供 CSS/background 属性及 Outlook VML 降级；VML 存在不等于 Outlook 已完成收件箱验证。

本地测试与 600px/375px 浏览器 QA 只证明组件和编辑器当前工作正常；不等同于 Omnisend、Gmail、Outlook 或 Apple Mail 真实收件箱验收。本组件制作不授权上传、发送、排期或发布任何 Campaign。
