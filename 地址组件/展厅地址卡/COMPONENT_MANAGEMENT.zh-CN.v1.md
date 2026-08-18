# 展厅地址卡组件管理说明（V1）

- Component Key：`location.showroomCard`

## 组件用途

本组件用于展示 Freshine 加州展厅，包括标题、官方展厅照片和地址说明。默认内容属于长期稳定的品牌信息，生成邮件时直接使用默认值，不要求用户逐项确认。

组件是独立的 Omnisend 正文表格片段，不包含 `DOCTYPE`、`html/head/body`、外部样式、脚本、页脚或退订功能。

## 文件职责

- `component.template.v1.html`：邮件安全表格结构及内容/设置插槽。
- `component.styles.v1.css`：构建时内联的基础样式。
- `content.schema.v1.json`：默认内容及用户主动替换时可使用的字段契约。
- `content.fixture.v1.json`：长期默认标题、官方图片、地址和图片链接；供 Skill 初始化完整内容快照，拼接器不会自动读取。
- `settings.schema.v1.json`：背景色及高级样式设置契约。
- `settings.defaults.v1.json`：默认样式值。
- `效果演示.html`：默认内容浏览器演示，不能直接作为 Omnisend Custom HTML 片段上传。

## Skill 询问规则

选择本组件后，Skill 的正常流程如下：

1. 必须询问并确认 `color.surface` 背景色，默认值为 `#FFFFFF`。
2. 标题、照片、图片链接和地址默认不询问；Skill 从 `content.fixture.v1.json` 复制默认值到本次 composition 的完整内容快照。
3. 只有用户主动提出“更换展厅图片”“修改地址”“修改标题”或“更换点击链接”时，才开放相应内容字段并重新确认。
4. 用户没有主动提出内容修改时，Skill 不得用活动文案、Shopify 商品数据或其他地址覆盖默认值。

`content.schema.v1.json` 使用顶层 `promptPolicy = use-defaults-unless-user-requests-change` 表达这项规则；各内容字段同时声明 `editable: true` 和 `skillPrompt: false`，表示“允许修改，但默认不主动询问”。

## 默认内容

- 标题：`Freshine Has A Showroom In The California`
- 官方图片：Freshine Shopify CDN 展厅原图
- 图片跳转：`https://freshinelife.com/pages/contact`
- 地址第一行：`43 Corporate Park, Irvine, CA 92606, United States`
- 地址说明：`(Appointment Only. No Mail, Packages, Or Deliveries Accepted.)`

默认图片使用公开 HTTPS 地址，可直接由邮件客户端读取；图片 URL 由 Shopify CDN 预裁剪为 1096×648px（548×324px 的双倍清晰度），因此在移动端可保持相同比例等比缩放。不要替换为本地路径、`file://`、相对路径或 `data:` 图片。

## 可主动替换的内容字段

| 字段 | 用途 | 默认询问 |
|---|---|---:|
| `showroom.title` | 标题 | 否 |
| `showroom.image.url` | 展厅图片 HTTPS 地址 | 否 |
| `showroom.image.alt` | 图片无障碍说明 | 否 |
| `showroom.image.clickUrl` | 点击图片后的跳转地址 | 否 |
| `showroom.address.line1` | 主地址 | 否 |
| `showroom.address.line2` | 预约与收件说明 | 否 |

如果用户主动替换图片，建议使用约 1.69:1 的横向图片，并同步提供准确的 `alt` 文本和 HTTPS 点击链接。

## 样式参数

| 参数 | 默认值 | Skill 是否询问 | 用途 |
|---|---|---:|---|
| `color.surface` | `#FFFFFF` | 是 | 组件所有空白区域的统一背景色 |
| `color.text` | `#1F1F1F` | 否 | 标题和地址颜色 |
| `font.heading` | `Lora, Georgia, Times New Roman, serif` | 否 | 标题字体栈 |
| `font.body` | `Montserrat, Arial, Helvetica, sans-serif` | 否 | 地址字体栈 |
| `content.maxWidth` | `600px` | 否 | 组件参考宽度 |
| `image.maxWidth` | `548px` | 否 | 展厅图片最大宽度 |

修改组件库默认背景时，必须同步修改 `settings.defaults.v1.json` 的 `values` 和 `settings.schema.v1.json` 对应字段的 `default`。单封邮件的背景调整应写入 composition 实例完整设置快照，避免改动所有未来邮件的默认值；拼接器不会自动读取 defaults 或补缺失字段。

## 布局维护

1. 桌面 600px 邮件画布中，组件主体满宽为 600px；展厅图片以 548×324px（约 1.69:1）居中显示，左右各留 26px。
2. 标题文本最大宽度为 460px，地址文本最大宽度为 480px；以标题、横向图片、地址的顺序形成约 600×592px 的整体比例。
3. 在 375px 移动端，组件与图片按可用宽度等比缩放，正文自然换行，不使用媒体查询、Flex、Grid 或定位。
4. `color.surface` 继续是可编辑的组件背景色：默认组件用 `#FFFFFF`，单封邮件须在完整 settings 快照中保留用户提供的色号，不得把参考图颜色写死。
5. 标题与地址均为 HTML 文本，不烧录进图片，因此更换背景色后空白区域能完整同步。
6. 模板中不得硬编码默认文案、图片或链接；默认数据只存放在 fixture。
7. 修改结构或字段时，必须同步更新模板、schema、fixture、本说明和效果演示。

## Omnisend 验收边界

最终 HTML 应按根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md` 检查：单一根表格、关键样式内联、无禁止标签、无未解析占位符，图片与链接均为公开 HTTPS 地址。

本地测试和浏览器预览通过后只能标记为“符合静态规范”。仍需在 Omnisend 完成导入保存、Desktop/Mobile/Dark Mode 预览以及主流邮箱测试邮件，才能判断为可发布。
