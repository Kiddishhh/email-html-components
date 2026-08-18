# 可链接整图组件管理说明（V1）

## 组件定位

- 中文名称：可链接整图
- 英文名称：Clickable Full Image
- Component Key：`image.clickableFullWidth`
- 用途：把用户上传的一张完整设计图作为邮件内容，并给整张图片绑定可替换链接。
- 桌面邮件画布：600px；图片默认 600px 全宽、零外边距。
- 移动端目标：375px 流式缩放。

该组件不会拆分或识别图片内部的文字、头像、星级和照片。所有视觉内容都保留在用户上传的图片中；更换内容时直接替换整张图片。

## 文件职责

- `component.template.v1.html`：Omnisend 静态安全的单根表格图片链接片段。
- `component.styles.v1.css`：组件自身的图片流式样式维护源。
- `content.schema.v1.json`：后续 Skill 收集的图片、alt 和跳转链接字段。
- `content.fixture.v1.json`：公开 HTTPS 默认测试数据，并记录本地演示素材；供 Skill 初始化完整内容快照，拼接器不会自动读取。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：背景、外边距和图片最大宽度。
- `assets/default-review-ix.jpg`：当前默认评论整图（`1200×2186px`），供本地演示与本地草稿预览；最终 Omnisend HTML 仍须替换为公开 HTTPS 图片地址。
- `效果演示.html`：使用默认本地图片生成的完整浏览器预览，不是 Omnisend Custom HTML 导入片段。

## 后续 Skill 采集流程

Skill 默认载入 `content.fixture.v1.json` 的评论整图、Alt 和整图链接，先展示完成卡片与双端预览；不逐字段追问。用户主动提出替换时，才更新以下内容字段：

1. `image.url`：用户手动上传图片，或通过 Shopify CLI/API 取得图片。
2. `image.alt`：图片加载失败及无障碍场景使用的简短说明。
3. `image.linkUrl`：点击整张图片后的完整 HTTPS 地址。

用户上传的是本地文件时，Skill 必须先上传到公开 CDN，再把 HTTPS 地址写入 `image.url`。禁止把本地路径、`file://`、`data:`、blob URL 或临时预览地址写入正式组件。

链接必须经过协议校验和 HTML 属性转义。禁止空链接、`#` 和 JavaScript URL。

## 图片规格

- 默认评论图参考尺寸为 `1200 × 2186px`，在桌面端按比例显示为约 `600 × 1093px`。
- 模板的 table 与 img 使用 `width="100%"`，由 `spacing.outer` 和 `image.maxWidth` 决定实际桌面宽度，并通过 `height:auto` 保持原图比例。默认 `spacing.outer: 0` 与 `image.maxWidth: 600px`，图片占满 600px 画布。
- 用户上传其他比例图片时，图片继续以 `width="100%"` 与 `height:auto` 流式缩放；需要固定视觉构图时再建议先裁切。
- 建议使用经过压缩的 JPG、PNG 或 WebP，并确保图片内的小字号在 375px 宽度仍清晰可读。
- 图片默认在 600px 邮件画布内居中显示，最大宽度由高级设置 `image.maxWidth` 控制。

## 设置字段

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `color.surface` | `#FFFFFF` | 组件图片之外的背景色 |
| `spacing.outer` | `0` | 图片容器外层内边距 |
| `image.maxWidth` | `600px` | 图片显示最大宽度 |

Skill 可以用 `settings.defaults.v1.json` 初始化以上字段，但必须把三项设置全部写入本次 composition 的 `settings` 快照。单封邮件的调整不要回写 defaults；只有修改组件库默认演示时，才同步更新 settings schema、defaults、效果演示和本说明。

## Omnisend 安全边界

模板遵循根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md`：

- 单根 100% `<table>`；
- 仅使用 table/tr/td、a 和 img；
- 无文档级标签、`style` 块、脚本、`div`、Flex/Grid 或定位；
- 关键样式内联；
- 正式图片和链接必须使用公开 HTTPS 地址；
- 不包含页脚或退订 token。

本地检查通过只能标记为“符合静态规范”。正式使用前仍需完成 Omnisend 导入保存、Desktop/Mobile/Dark Mode 预览，以及 Gmail、Outlook 和 Apple Mail 测试邮件。
