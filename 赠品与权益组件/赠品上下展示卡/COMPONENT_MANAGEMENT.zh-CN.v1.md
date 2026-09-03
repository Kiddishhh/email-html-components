# 赠品上下展示卡（`gift.verticalImagePair`）

## 组件定位

- 所属分类：赠品与权益组件
- 桌面画布：600×676px，由两张 600×338px 整图上下无缝组成
- 移动端目标：375px 宽，纯整图按比例缩放为两张约 375×211.25px 图片
- 点击行为：上、下两张图片各自可点击，但共用同一个公开 HTTPS 链接
- 默认素材：用户提供的抱枕套活动图在上方、眼罩活动图在下方；原图只用于本地预览

该组件独立于现有“双赠品展示卡”“双赠品展示卡2”和“双赠品奖励卡”。图片内的 FREE GIFTS、价格、门槛和其他文字均保留在用户原图中，不拆分、不裁切、不重绘。

## 可编辑内容

| 视觉位置 | 字段 |
| --- | --- |
| 上方赠品整图 / Alt | `images[0].url` / `images[0].alt` |
| 下方赠品整图 / Alt | `images[1].url` / `images[1].alt` |
| 两张图共同点击链接 | `gift.linkUrl` |

默认链接为 `https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。更换图片前请准备相同或接近 1200×676px 比例的公开 HTTPS 图片，避免展示时出现明显比例变化。

## 固定还原参数

- 两张图片均使用 `width="600" height="338"` 与 `width:100%; max-width:600px; height:auto`，不增加分隔线、留白、圆角、文字层或独立 CTA。
- 两张图片独立包裹在链接中，因此均可点击；编辑器只公开一个共享链接字段，避免上下图默认追踪参数不一致。
- 默认本地素材分别为 `asset://gift-vertical-pillow-cover` 和 `asset://gift-vertical-eye-mask`。正式导出或上传 Omnisend 前，现有流程必须将它们替换为公开 HTTPS 地址。

## 邮件兼容性与验收边界

模板仅使用 presentation table、`a`、`img` 与内联 CSS，不含 JavaScript、外部样式、Flex、Grid、定位或媒体查询。纯整图通过流式 `width:100%; height:auto` 在 375px 下按比例收缩。

本地 600px / 375px 预览和静态校验仅证明组件结构、链接和本地素材加载；未替代 Omnisend、Gmail、Outlook 或 Apple Mail 的真实收件箱测试。
