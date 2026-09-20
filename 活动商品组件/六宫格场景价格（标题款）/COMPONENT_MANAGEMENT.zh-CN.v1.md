# 六宫格场景价格（标题款）组件管理说明

- 组件键：`collection.sceneSaleGrid6PriceWithTitle`
- 分类：活动商品组件
- 输出：600px 桌面宽度，375px 按 62.5% 等比缩放并保持两列三行
- 布局：标题、植物分隔、副标题、六张 264px 方形场景图、左上矩形折扣标、商品名、折扣价与划线原价、底部 CTA

## 可编辑内容

标题、副标题、顶部/底部装饰图、六组商品信息及底部 CTA 均可编辑。每件商品包含折扣标签、图片 URL、Alt、商品链接、商品名、折扣价和原价。商品图与底部 CTA 是独立链接；默认链接保留 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。

## Shopify 导入

编辑器提供“导入商品 1–6”。每次导入只更新选中卡片的首张商品图片、Alt、商品链接、完整标题、首个可售变体价格、有效 compare-at 原价与自动计算的折扣标签；其他五张卡、顶部文案、装饰、底部 CTA 和颜色不变。无有效 compare-at 价时原价和折扣标签清空，矩形折扣标隐藏。Shopify 访问仅查询，不会修改商品或主题。

## 字体与颜色

- 主标题：Lora 400，30px/38px，居中。
- 副标题：Montserrat 500，18px/27px，黑色，居中。
- 商品名：Montserrat 500，16px/20px，左对齐。
- 可编辑颜色：组件背景、标题、副标题、商品名、折扣标及其文字、折扣价、划线原价、CTA 及其文字。

## 素材与导出

默认预览使用组件目录内六张场景图和两张透明装饰图。`asset://` 只用于本地预览；Omnisend 或 Shopify Messaging 导入前必须替换为公开 HTTPS 地址。组件输出为 body-only、table/inline-CSS 邮件 HTML，不包含脚本、表单、iframe 或运行时 Shopify 请求。
