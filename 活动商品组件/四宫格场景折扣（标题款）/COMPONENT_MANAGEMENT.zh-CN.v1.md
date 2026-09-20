# 四宫格场景折扣（标题款）组件管理说明

- 组件键：`collection.sceneSaleGrid4WithTitle`
- 分类：活动商品组件
- 输出：600px 桌面宽度，按 375px 目标宽度等比缩放
- 布局：Lora 标题、Montserrat 副标题、两行两列 246px 场景商品图、左上角折扣标签及商品名称；无底部 CTA
- 默认主题：暖白背景、深色文字、红色折扣标签

## 可编辑内容

标题和副标题可编辑。商品 1–4 分别支持折扣文案、图片 URL、Alt 文本、商品链接和商品名称。

图片与对应商品名称共用同一个链接。默认链接带有 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。

## Shopify 导入

编辑器中的商品 1–4 导入按钮只更新所选卡片的首张图片、Alt、链接、商品名称和折扣文案。导入后重新写入 cover-rc UTM；其他商品、标题、副标题和颜色保持不变。

## 可编辑颜色

背景色、标题色、副标题色、商品名称色、折扣标签背景色和折扣标签文字色均可独立修改。

## 素材与导出

默认预览使用组件目录内的四张本地参考图。正式 Omnisend 导出前必须将所有 `asset://` 图片发布为公共 HTTPS 地址，最终 HTML 不允许残留本地素材协议。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：saleCollection.title
- subtitle：saleCollection.body
- caption：saleItems[0].name, saleItems[1].name, saleItems[2].name, saleItems[3].name

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
