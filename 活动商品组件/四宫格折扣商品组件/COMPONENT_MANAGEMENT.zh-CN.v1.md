# 四宫格折扣商品组件管理说明（V1）

- Component Key：`collection.saleGrid4`

## 组件用途与边界

本组件复现确认的四款促销商品版式：600px 邮件画布内使用 `508px` 内容区，按两列两行显示四张 `246×246px` 商品主图。商品间横向间距为 `16px`、两行间距为 `20px`，组件底部留白为 `52px`。每格整张主图可点击，左上角保留纯文本折扣标签。

组件不包含标题、正文、CTA、脚本、退订链接或网页查看链接；它是可自由拼接的 Omnisend 正文表格片段。

## 可编辑内容

全局样式只开放两项：

| 字段 | 默认值 | 用途 |
| --- | --- | --- |
| `color.surface` | `#F5EFDF` | 根表格与内部 600px 画布的背景色 |
| `color.theme` | `#8D1B1B` | 四个折扣标签的统一背景色 |

四款商品各自拥有以下独立字段：

| 商品 | 折扣标签 | 主图 | 图片说明 | 点击链接 |
| --- | --- | --- | --- | --- |
| 1 | `saleItems[0].discountLabel` | `saleItems[0].image.url` | `saleItems[0].image.alt` | `saleItems[0].image.clickUrl` |
| 2 | `saleItems[1].discountLabel` | `saleItems[1].image.url` | `saleItems[1].image.alt` | `saleItems[1].image.clickUrl` |
| 3 | `saleItems[2].discountLabel` | `saleItems[2].image.url` | `saleItems[2].image.alt` | `saleItems[2].image.clickUrl` |
| 4 | `saleItems[3].discountLabel` | `saleItems[3].image.url` | `saleItems[3].image.alt` | `saleItems[3].image.clickUrl` |

图片与跳转链接必须为公开 HTTPS 地址；折扣标签为纯文本，可留空，不允许 HTML。

## Shopify 单款导入

编辑器在本组件选中时显示“导入商品 1”至“导入商品 4”。每个按钮只接受对应的一条 Freshine 商品 URL：

- `https://freshinelife.com/products/<handle>`
- `https://freshinelife.com/collections/<collection-handle>/products/<handle>`

导入复用只读 `fetch-single-product.mjs`：只覆盖该格的首张商品图、Alt、产品链接及根据可售变体售价/划线价计算的折扣标签。无有效划线价折扣时，旧标签会被清空。导入不会改动其余三格、`color.surface`、`color.theme` 或任何其他组件实例。

## 视觉与验收

- 桌面端固定保留 `246px` 图块；窄屏通过已有 `min()` 渐进值按比例缩至 375px 目标宽度，不依赖媒体查询、Flex 或 Grid。
- 使用嵌套 presentation table、内联样式、`td background` 与 `background-image` 双写，保留色块降级与 `role="img"`/Alt 语义。
- 本地结构测试和编辑器 600px/375px 预览通过后，仅代表静态与本地预览已验证；Omnisend、Gmail、Outlook、Apple Mail 仍需分别验证。
