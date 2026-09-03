# 场景文字叠层头图2（`hero.sceneOverlayCta2`）

## 组件定位

- 所属分类：头图
- 桌面画布：600px 宽；默认显示 56px 双栏导航和 632px 场景主体
- 移动端目标：375px 宽；所有固定视觉尺寸以 inline `min()` 按 62.5% 等比收缩
- 点击行为：顶部右侧 `SIGN UP` 使用独立链接；导航下方的整张场景头图使用另一条统一 HTTPS 链接
- 默认素材：用户提供的 Labor Day 场景与 Freshine Logo 均保存在本地，仅用于编辑器预览

这是独立于“场景文字叠层头图”的 Labor Day 活动样式。它可以在 Campaign 编辑器中自由添加、重复、排序或删除，不会修改任何旧头图。

## 可编辑内容

| 视觉位置 | 字段 |
| --- | --- |
| 顶部左侧促销文案 | `navigation.message` |
| 顶部右侧链接文字 / 链接 | `navigation.cta.text` / `navigation.cta.url` |
| 场景背景图 / Alt | `hero.backgroundImage.url` / `hero.backgroundImage.alt` |
| 整张场景头图链接 | `hero.linkUrl` |
| 顶部 Logo / Alt | `brand.logo.url` / `brand.logo.alt` |
| 活动名称、主折扣、补充说明 | `hero.eyebrow` / `hero.title` / `hero.subtitle` |
| 顶部导航显示开关 | `navigation.visible` |
| 顶部左 / 右 / 文字颜色 | `color.navigationLeft` / `color.navigationRight` / `color.navigationText` |
| 场景降级底色 / 叠加文案颜色 | `color.surface` / `color.text` |

默认素材以 `asset://labor-day-scene` 和 `asset://labor-day-logo` 保存；它们只能用于本地预览。导出或上传 Omnisend 前，现有导出流程必须把它们替换为公开 HTTPS 图片。

## 固定还原参数

- 顶部导航桌面为 600×56px，左/右宽度固定为 76% / 24%；关闭 `navigation.visible` 时完整移除该行及其高度。
- 场景主体为 600×632px，使用 `center top`、`cover` 裁切，并保留从浅到深的 180° 黑色叠层渐变；降级底色为 `#3C2D25`。
- Logo 为 104×104px，距主体顶部 58px；Logo 后的固定留白将活动名称置于设计稿对应的下方区域。
- 三层活动文案固定为 Lora Medium `39px / 50px`、Montserrat ExtraBold `62px / 76px`、Montserrat Regular `21px / 31.5px`。补充说明位于 410px 内容区并自然换行，建议控制在两行以内。
- 默认顶部链接保留 `https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc`；默认整图链接保留 `https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=cover-fc`。

## 邮件兼容性与验收边界

模板只使用 presentation table、`td`、`img`、`a`、`p` 及内联 CSS；不含 JavaScript、外部样式、Flex、Grid、绝对定位或媒体查询。背景单元格同时保留 HTML `background` 属性与降级底色；不支持 CSS 背景图的客户端可能只显示降级色。

本地 600px / 375px 预览与静态校验只证明组件结构、默认素材和编辑器合同，不等同于 Omnisend、Gmail、Outlook 或 Apple Mail 的真实收件箱测试。
