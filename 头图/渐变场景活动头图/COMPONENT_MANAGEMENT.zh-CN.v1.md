# 渐变场景活动头图（`hero.gradientScenePromotion`）

## 组件定位

- 所属分类：头图
- 桌面画布：600×761px
- 移动端目标：375px 宽，主体按比例收缩至约 475.6px 高
- 点击行为：整张头图共用一个 HTTPS 链接
- 默认素材：用户提供的 Omnisend 场景图和圆形 Logo，本地副本仅用于组件预览

组件复现“明亮窗帘场景＋底部暖白渐变＋圆形 Logo＋三层活动文案”的整块可点击头图。现有 `hero.lateSummerSale` 保持不变，本组件是独立样式，可在 Campaign 编辑器中自由添加、重复、排序或删除。

## 可编辑内容

| 视觉位置 | 字段 |
| --- | --- |
| 场景背景图 | `hero.backgroundImage.url` |
| 场景图 Alt | `hero.backgroundImage.alt` |
| 整张头图点击链接 | `hero.linkUrl` |
| 圆形 Logo | `brand.logo.url` |
| Logo Alt | `brand.logo.alt` |
| 活动名称 | `hero.eyebrow` |
| 主折扣标题 | `hero.title` |
| 补充说明 | `hero.subtitle` |
| 背景/降级色 | `color.surface` |
| 三层文案文字色 | `color.text` |

默认背景图和 Logo 分别使用 `asset://gradient-scene-background` 与 `asset://gradient-scene-logo`。它们只用于本地预览；正式导出或上传 Omnisend 前必须解析为公开 HTTPS 图片地址。

## 固定还原参数

- 内层画布：`width:100%; max-width:600px`，桌面高度 761px，375px 下使用 `min(761px,126.833333vw)` 等比缩放。
- 背景：1522×1522px 源图使用 `cover`，横向定位 `50.310559%`、纵向顶部对齐。
- 渐变：180°；44.7% 前透明，82.5% 为 `rgba(251,250,248,0.85)`，底部收束至 `#FBFAF8`。
- Logo：桌面 97×97px，顶部内边距 370px，底部 24px，水平向右补偿 7px。
- 活动名称：Lora Regular `30px / 38px`；主标题：Montserrat Medium `66px / 80px`；补充说明：Montserrat Regular `19px / 23px`。
- 三段文字和相邻留白均使用与 600px 画布对应的内联 `min()`，不开放编辑器几何设置。
- 组件没有顶部导航、CTA 按钮、倒计时或 Shopify 导入行为。

## 邮件兼容性与验收边界

模板使用单根表格、嵌套表格与内联 CSS，不使用 JavaScript、Flex、Grid、绝对定位或媒体查询。背景图同时保留 `<td background>` 降级；不支持 CSS 渐变的客户端可能只显示原场景图或背景色。整块链接按用户提供的模板结构包裹 600px 内层表格。

本地 600px/375px 预览只能证明浏览器中的结构和几何，不等同于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱测试。正式使用前仍需完成 Omnisend Desktop/Mobile/Dark Mode 与目标邮件客户端验证。
