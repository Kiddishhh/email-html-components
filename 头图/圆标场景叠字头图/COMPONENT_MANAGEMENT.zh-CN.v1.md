# 圆标场景叠字头图（`hero.circleLogoSceneOverlay`）

## 组件定位

- 所属分类：头图
- 桌面画布：600×761px
- 移动端目标：375px 宽，主体按比例收缩至约 475.6px 高
- 点击行为：整张头图共用一个 HTTPS 链接
- 默认素材：用户提供的无字场景原图与 238×238px 透明白色圆形 Freshine Logo，本地副本仅用于组件预览

组件使用“顶部圆形 Logo＋全幅场景背景＋底部三层居中文字”的样式命名，不绑定具体节日或活动。现有头图保持不变，本组件可在 Campaign 编辑器中自由添加、重复、排序或删除。

默认整图链接为 `https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc`；编辑器可替换链接，替换时应保留当前活动所需追踪参数。

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
| 图片降级底色 | `color.surface` |
| 三层文案文字色 | `color.text` |

默认背景图和 Logo 分别使用 `asset://circle-logo-scene-background` 与 `asset://circle-logo-scene-logo`。它们只用于本地预览；正式导出或上传 Omnisend 前必须替换为公开 HTTPS 地址。

## 固定还原参数

- 内层画布为 `width:100%; max-width:600px`，桌面高度 761px；375px 下使用内联 `min()` 等比收缩至约 475.6px。
- 默认背景源图为 1216×1522px，按 `cover` 和 `center top` 放入 600×761px 画布，桌面自然裁去左右各 4px，对应源图各 8px，不拉伸主体。
- Logo 为 120×120px，距画布顶部 60px；Logo 下方固定留白将首行活动名称定位到画布约 484px 处。
- 活动名称使用 Montserrat Light `36px / 46px`；主折扣使用 Montserrat Bold `66px / 80px`；补充说明使用 Montserrat Regular `19px / 31px`。
- 补充说明位于 410px 宽内容区；默认文案自然换成两行，不拆成两个编辑字段。
- 组件无顶部导航、独立 CTA、渐变、倒计时或 Shopify 导入；几何不对编辑器开放。

## 邮件兼容性与验收边界

模板使用单根表格、嵌套表格与内联 CSS，不使用 JavaScript、Flex、Grid、绝对定位或媒体查询。背景图保留 `<td background>` 降级；不支持 CSS 背景图的客户端可能仅显示降级底色。

本地 600px/375px 预览只能证明浏览器中的结构和几何，不等同于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱测试。正式使用前仍需完成 Omnisend Desktop/Mobile/Dark Mode 与目标邮件客户端验证。
