# 单品窗帘促销卡（无标题款）组件管理说明（V1）

## 组件定位

- 中文名称：单品窗帘促销卡（无标题款）
- 英文名称：Single Curtain Promotion Card Without Header
- Component Key：`collection.curtainPromotionCardNoTitle`
- 分类：活动商品组件
- 桌面画布：600px
- 移动端目标：375px 流式单列

本变体从主图开始，不包含活动标题和副标题；适用于邮件前文已经交代活动主题、只需突出一个商品的场景。主图、促销角标、商品图文、两个链接与背景色均可编辑。

## 文件职责

- `component.template.v1.html`：无标题款的单根 Omnisend 正文表格片段。
- `content.schema.v1.json`：主图、角标、商品信息和 CTA 字段；不含 `promotion.title` 或 `promotion.subtitle`。
- `settings.schema.v1.json`：背景色、角标色及当前变体的完整样式快照。
- `content.fixture.v1.json`：默认本地预览数据与本地素材映射。
- `assets/default-celina-linen-curtains-clean.png`：仅供本地预览的默认参考图。
- `效果演示.html`：浏览器预览，不能直接导入 Omnisend。

## 可编辑内容

| 位置 | 字段 | 要求 |
| --- | --- | --- |
| 促销角标 | `product.badge` | 纯文本 |
| 商品主图 | `product.image.url` | 正式邮件必须为公开 HTTPS URL |
| 主图说明 | `product.image.alt` | 纯文本 alt |
| 主图及商品标题链接 | `product.image.clickUrl` | 完整 HTTPS URL |
| 商品名 | `product.title` | 纯文本 |
| 商品卖点 | `product.description` | 纯文本 |
| 下划线 CTA | `product.cta.text` / `product.cta.url` | 纯文本及完整 HTTPS URL |

`color.surface` 是整个组件背景色，`color.badge` 是主图左上角角标色。默认图使用 `asset://curtain-promotion-no-title-default`，仅可用于本地预览；最终 Omnisend 构建必须先替换为公开 HTTPS 图片。

## Omnisend 安全边界

模板仅使用一个根 `<table>` 和 table/tr/td 布局，关键样式内联，不含脚本、外部 CSS、Flex、Grid、绝对定位或退订 token。静态构建通过不等同于真实邮件客户端验证；正式使用前需完成 Omnisend、Gmail、Outlook 和 Apple Mail 测试。
