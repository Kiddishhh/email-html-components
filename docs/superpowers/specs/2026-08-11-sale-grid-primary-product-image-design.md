# 六宫格商品第一张图片设计

## 目标

六宫格导入每个 Shopify 商品时，图片必须来自商品媒体按 `POSITION` 排序后的第一张图片，与商品详情页的图片顺序一致；不再使用已废弃的 `featuredImage`。

## 数据规则

- Collection 仍按当前排序读取前六个商品。
- 每个商品查询 `media(first: 1, query: "media_type:IMAGE", sortKey: POSITION)`。
- 只接受首个 `MediaImage.image.url`；Alt 优先使用该媒体的 `alt`，为空时使用“商品标题 + product image”。
- 商品没有图片时明确报错并标出 handle；不得退回 `featuredImage`、变体图、视频缩略图或下一商品。
- 商品链接、可售变体分页、价格与折扣计算保持不变。
- Shopify 调用保持 query-only 只读。

## 同步范围

更新 `fetch-sale-grid.mjs`、GraphQL fixture、回归测试、Skill Shopify 数据契约和组件交互说明。测试必须构造不同的 `featuredImage` 与第一张媒体图，以证明输出只选择媒体排序第一张图。
