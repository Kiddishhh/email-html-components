# 六宫格折扣推荐（标题款）组件管理说明（V1）

- Component Key：`collection.saleGrid6WithTitle`
- 画布：600px 桌面 / 375px 移动目标；组件底色默认 `#FFFDFA`。

本组件复刻“标题 + 副标题 + 两列三行商品卡 + 底部 CTA”样式。标题固定 Lora 30px / 45px / 500，副标题固定 Montserrat 16px / 24px / 500，使用 `#7C706A`。每张商品图为 236×236px 居中 cover 裁切，底部有 `#8D1B1B` 统一折扣条，图片与商品名均可点击。商品名与 CTA 均为 Montserrat 18px / 22px / 500；折扣文案为 Montserrat 16px / 20px / 500。

在 375px 目标画布中，六张卡维持两列三行：每列占内容区 46%，中间间距占 8%，图片、图片点击区和折扣条通过内联 `min()` 等比缩小，避免固定 236px 宽高导致的横向溢出。标题、商品名和 CTA 保持居中并允许自然换行。

## Shopify 商品导入

编辑器为六个格子分别提供“导入商品 1–6”。支持 Freshine 的 `/products/<handle>` 和 `/collections/<collection>/products/<handle>` URL，只读取得首图、Alt、商品 URL、首个可售变体折扣及商品名。导入只覆盖被选中的一格；商品名称取标题的第一个品牌名词，仍可在编辑器内手动修改。

默认六个商品链接和底部 CTA 均包含 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。最终 HTML 会将查询参数安全转义为 `&amp;`。

## 可编辑字段

- `saleCollection.title`、`saleCollection.body`、`saleCollection.cta.text`、`saleCollection.cta.url`
- 每个 `saleItems[n]` 的 `name`、`discountLabel`、`image.url`、`image.alt`、`image.clickUrl`

组件不包含网页级标签、脚本、样式标签或退订内容。导入 Omnisend 前，仍应完成 Desktop/Mobile/Dark Mode 预览和邮件客户端测试。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：saleCollection.title
- subtitle：saleCollection.body
- caption：saleItems[0].name, saleItems[1].name, saleItems[2].name, saleItems[3].name, saleItems[4].name, saleItems[5].name

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
