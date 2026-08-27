# 双分割线页脚组件管理说明（V1）

- Component Key：`footer.doubleDivider`

## 组件边界

这是可自由加入、重复和排序的 Omnisend 正文表格片段，不替换现有 `footer.warm`。组件使用 600px 流式画布与 375px 移动目标；内容最大宽度为 508px。模板只保留一个原样的 `[[unsubscribe_link]]`，不包含 `DOCTYPE`、`html/head/body`、`div`、脚本或外部样式。

## 固定视觉契约

- 外层画布为 `#FAF9F7`，内容区为 `#F9F6EE`。
- 顶部和社媒下方各有一条 508px 宽、1px 高、`#E3E0DE` 的分割线；顶部线没有额外顶部留白，底部线前保留 24px 间距。
- 社媒顺序为 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads。每枚图标位于 `26 × 26px` 居中单元，尺寸为 YouTube `24px`、Instagram `24px`、Facebook `23px`、TikTok `24px`、Pinterest `24px`、WhatsApp `24px`、Threads `23px`。

## 可编辑范围

HTML 编辑器只开放 `color.canvas`、`color.background`、`color.text` 与 `color.link`。品牌、地址、联系信息、社媒链接与素材以及所有几何、间距、字体和图标尺寸均由完整默认快照固定，避免常规编辑破坏双分割线布局。

## 文件职责

- `component.template.v1.html`：邮件安全表格结构与 `footer.*` 内容插槽。
- `component.styles.v1.css`：仅包含可安全内联的基础表格和图片声明。
- `content.schema.v1.json` / `content.fixture.v1.json`：完整品牌、地址、社媒与法律信息快照。
- `settings.schema.v1.json` / `settings.defaults.v1.json`：两层背景色与文本/链接色等设置默认值。
- `效果演示.html`：以默认快照渲染的 600px 本地视觉参考。

导出前，所有图片和常规网页链接必须保持公开 HTTPS，且不可创建、更新、发送、排期或发布 Omnisend Campaign/Draft。
