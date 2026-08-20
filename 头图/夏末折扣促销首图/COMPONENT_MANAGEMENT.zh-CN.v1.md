# 夏末折扣促销首图组件管理说明

## 组件定位

- 中文名称：夏末折扣促销首图
- Component Key：`hero.lateSummerSale`
- 所属结构：头图
- 目标环境：Omnisend Custom HTML / HTML Import
- 桌面画布：600px
- 移动端目标：约 375px 流式可读

组件复现“品牌 Logo＋首单优惠条＋三行活动文案＋悬浮 CTA＋房间主图”的夏末促销首图。桌面端按设计稿使用 600px 外层、542×527px 主图、275×54px CTA，CTA 向主图上沿外溢 27px。移动端除主标题与主图外，Logo 区、优惠条、文案垂直间距及底部留白也随视口等比收缩，避免桌面固定像素使组件纵向拉长。

## 文件职责

- `component.template.v1.html`：邮件安全的单根表格模板。
- `component.styles.v1.css`：组件样式维护源；构建时内联。
- `content.schema.v1.json`：可替换内容及链接契约。
- `content.fixture.v1.json`：默认文案与本地参考素材。
- `settings.schema.v1.json`：组件颜色、字体和几何设置契约。
- `settings.defaults.v1.json`：完整默认设置快照。
- `assets/default-room.png`：用户确认的默认房间主图，仅用于本地预览。
- `assets/default-logo-brown.png`：默认深棕色 FreShine Logo，仅用于本地预览。
- `效果演示.html`：已注入默认内容的浏览器验收文件。

## 顶部导航栏开关

可视化编辑器以“显示顶部导航栏”复选框开放 `navigation.visible`，默认值为 `true`。关闭后，构建器会从最终 HTML 中完整移除 Logo 下方的 71px 优惠导航及其占位高度；顶部 Logo、三行活动文案、CTA 和主图保持不变。导航文案、链接和颜色仍保存在当前组件快照中，重新开启即可恢复。不得用 CSS `display:none` 模拟隐藏。

## 可替换内容

| 视觉位置 | 字段 |
| --- | --- |
| 优惠条文案 | `promotion.text` |
| 优惠条链接文字 | `promotion.linkText` |
| 优惠条链接 | `promotion.url` |
| Logo 图片 | `brand.logo.url` |
| Logo Alt | `brand.logo.alt` |
| Logo 点击链接 | `brand.logo.clickUrl` |
| 活动名称 | `hero.eyebrow` |
| 主折扣标题 | `hero.title` |
| 活动补充说明 | `hero.subtitle` |
| 主图 | `hero.image.url` |
| 主图 Alt | `hero.image.alt` |
| 主图点击链接 | `hero.image.clickUrl` |
| CTA 文案 | `hero.cta.text` |
| CTA 链接 | `hero.cta.url` |

`hero.image.url` 默认指向 `asset://late-summer-room`，用于本地效果演示。正式构建 Omnisend HTML 前必须替换成公开 HTTPS 图片 URL；构建器会阻止本地素材进入正式输出。建议替换图保持约 1084×1054px 或相同宽高比，避免 `background-size:cover` 产生明显裁切。

## 固定还原参数

- Logo 区桌面最大高度：67px；Logo 桌面最大宽度：106px；移动端按 600px 设计基准等比缩放。
- 优惠条桌面最大高度：71px；左右宽度保持 75.5% / 24.5%；移动端高度、文字行高及左右内边距等比缩放，优惠条仍保持全宽。这也是全部头图导航栏的统一响应式基准：文案与链接使用 Montserrat Regular `18px / 24px`，右侧链接保留下划线。
- 主图宽度：542px（画布的 90.333%）；桌面高度固定上限为 527px，不随外部浏览器窗口继续放大；600px 以下按相同比例缩放。
- CTA 宽度：275px；高度：54px；向主图上沿外溢：27px。
- 主标题桌面端：Lora Medium，68px / 79px；移动端随视口缩小。
- 其他文字与操作文字：Montserrat。
- 主图下方桌面最大留白：52px；移动端按比例缩小。

上述几何参数用于保持设计稿还原度，常规内容编辑不应调整。主题色和背景色可在完整 `settings` 快照中修改。

## 邮件兼容性与降级

组件不使用 JavaScript、`div`、Flex、Grid、绝对定位或媒体查询。悬浮 CTA 通过表格负上边距实现；不支持负边距的 Outlook 会把 CTA 降级为显示在主图顶部，但文案、链接和图片仍可用。主图使用 `<td background>` 和内联 `background-image`；不支持背景图的客户端会显示组件底色，CTA 仍保留。

正式使用前需完成 Omnisend Desktop、Mobile、Dark Mode 预览，以及 Gmail、Outlook 和 Apple Mail 测试邮件。本地浏览器预览只能证明组件结构与浏览器渲染，不等同于真实收件箱验证。

## Skill 与编辑器注册

组件已注册到 `组件清单.json` 的“头图”分类，Component Key 为 `hero.lateSummerSale`。在 Campaign 可视化编辑器中可自由添加、重复、排序或删除。

编辑器开放本说明“可替换内容”中的全部字段，并开放 `navigation.visible`、`color.surface`、`color.promotionLeft`、`color.promotionRight`、`color.heading`、`color.body` 与 `color.action`。600px 画布、542×527px 桌面主图、CTA 尺寸及重叠量等固定还原参数不作为编辑字段。组件交互与预览要求已同步至 Campaign Skill、`component-interactions.zh-CN.md` 和 `visual-editor-workflow.zh-CN.md`。
