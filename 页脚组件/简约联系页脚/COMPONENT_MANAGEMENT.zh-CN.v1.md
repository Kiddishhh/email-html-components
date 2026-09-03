# 简约联系页脚组件管理说明（V1）

- Component Key：`footer.minimalContact`

## 组件边界

这是可自由加入、重复和排序的 Omnisend 正文表格片段，与 `footer.warm`、`footer.doubleDivider` 并存。组件严格按参考图使用 600px 流式画布；375px 下以模板内的 `min()` 声明渐进缩小，不使用媒体查询、Flex、Grid、定位、脚本或外部样式。

## 固定视觉契约

- 默认底色为 `#F9F6EE`，没有品牌名或金色短线。
- 参考图由地址、预约限制、电话/支持邮箱、七枚社媒图标、496px 暖灰分割线、版权/品牌名和退订链接依序构成。
- 图标与跳转沿用现有品牌页脚的完整默认快照，顺序为 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads；各图标仍置于 `26 × 26px` 居中单元，图片尺寸依次为 `24px`、`24px`、`23px`、`24px`、`24px`、`24px`、`23px`。
- 模板只保留一个原样的 `[[unsubscribe_link]]`。邮箱使用既有 `mailto:` 跳转；七个社媒链接与图标素材均为既有公开 HTTPS 值。

## 可编辑范围

HTML 编辑器仅开放 `color.background`、`color.text` 和 `color.link`。地址、电话、邮箱、社媒素材/链接、版权、字体、间距、分割线和图标几何均保持默认快照，避免常规编辑破坏参考图布局。

## 文件职责

- `component.template.v1.html`：邮件安全表格结构与页脚内容插槽。
- `component.styles.v1.css`：可安全内联的基础表格和图片声明。
- `content.schema.v1.json` / `content.fixture.v1.json`：参考图文案、联系信息和复用的社媒快照。
- `settings.schema.v1.json` / `settings.defaults.v1.json`：底色、文字色、弱化文字色、链接色及字体默认值。
- `效果演示.html`：以默认快照渲染的 600px 本地视觉参考。

导出前，图片及网页链接必须保持公开 HTTPS；此组件不创建、更新、发送、排期或发布 Omnisend Campaign/Draft。
