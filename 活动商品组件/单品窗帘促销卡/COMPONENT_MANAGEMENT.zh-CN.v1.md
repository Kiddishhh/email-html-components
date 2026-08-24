# 单品窗帘促销卡（标题款）组件管理说明（V1）

## 组件定位

- 中文名称：单品窗帘促销卡（标题款）
- 英文名称：Single Curtain Promotion Card
- Component Key：`collection.curtainPromotionCard`
- 分类：活动商品组件
- 桌面画布：600px
- 移动端目标：375px 流式单列

组件复现“居中活动标题与说明＋带促销角标的大图＋单品标题、说明与文字 CTA”的邮件卡片。图片区域以邮件安全的表格背景图承载，顶部角标和整张图片都使用商品图片链接。

## 文件职责

- `component.template.v1.html`：单根 Omnisend 正文表格片段及全部内容、设置插槽。
- `component.styles.v1.css`：可安全内联的组件样式维护源，不直接上传 Omnisend。
- `content.schema.v1.json`：可替换图文与链接字段。
- `content.fixture.v1.json`：默认本地预览数据及本地素材映射。
- `settings.schema.v1.json`：背景色、角标色和高级样式字段。
- `settings.defaults.v1.json`：默认完整设置快照。
- `assets/default-celina-linen-curtains-clean.png`：按设计稿生成的默认参考图，仅供本地预览；图片不包含角标，角标由可编辑 HTML 字段渲染。
- `效果演示.html`：默认素材的浏览器预览，不能直接导入 Omnisend。

## 可编辑内容

| 位置 | 字段 | 要求 |
| --- | --- | --- |
| 顶部标题 | `promotion.title` | 纯文本 |
| 顶部说明 | `promotion.subtitle` | 纯文本 |
| 红色角标 | `product.badge` | 纯文本 |
| 商品主图 | `product.image.url` | 正式邮件必须为公开 HTTPS URL |
| 主图说明 | `product.image.alt` | 纯文本 alt |
| 主图和商品标题链接 | `product.image.clickUrl` | 完整 HTTPS URL |
| 商品名 | `product.title` | 纯文本 |
| 商品卖点 | `product.description` | 纯文本 |
| 下划线 CTA 文案 | `product.cta.text` | 纯文本 |
| 下划线 CTA 链接 | `product.cta.url` | 完整 HTTPS URL |

默认图通过 `asset://curtain-promotion-default` 供本地预览使用。最终 Omnisend 构建会拒绝本地素材；请上传至公开 CDN 或由上传流程替换为 HTTPS URL。

## 可配置样式

`color.surface` 是默认向用户询问的整个组件背景色；`color.badge` 可独立更改促销角标色。顶部标题默认使用 Lora 字体栈，顶部说明默认使用 Montserrat 字体栈；两者遵循设计稿但不作为编辑器字段开放。文字色、字体、间距与角标圆角均是完整设置快照的一部分。任何单封邮件的调整都应写入该 composition 实例，不能改写共享默认文件。

顶部标题固定使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`、居中对齐；顶部说明固定使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`、居中对齐。卡内商品名使用 Montserrat `22px / 500 / 30px`，商品卖点使用 Montserrat `15px / 400 / 22px`，以低于顶部活动标题的清晰层级呈现。

参考稿的视觉尺寸为：左右内容边距 28px、主图宽 544px 高 371px。模板不使用媒体查询、Flex、Grid、绝对定位或脚本，600px 画布会在 375px 目标宽度中等比例流式缩放。

## Omnisend 安全边界

- 仅输出一个根 `<table>`，布局只使用 table/tr/td；
- 关键样式内联，不含外部 CSS、脚本、表单或 iframe；
- 所有文本在注入时转义；链接必须是完整 HTTPS URL；
- 静态构建通过仅表示符合静态规范。正式发信前仍需在 Omnisend 预览并使用 Gmail、Outlook 与 Apple Mail 发送测试。
