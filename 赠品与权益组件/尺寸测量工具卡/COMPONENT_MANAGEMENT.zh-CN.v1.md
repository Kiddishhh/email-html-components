# 尺寸测量工具卡组件管理说明（V1）

## 组件定位

- 中文名称：尺寸测量工具卡
- 英文名称：Measurement Tool Card
- Component Key：`tool.measurementCard`
- 桌面画布：600px；内容区 548px，左右各 26px 留白。
- 移动端目标：375px 流式宽度；正文自动换行，主图以设计稿比例裁切展示。

组件复现“Measure Size Easily”设计稿：上方为测量场景主图，下方为左对齐标题、说明和下划线 CTA。它可自由加入、重复及排序，不属于旧版 CLI Campaign 的六个固定区段。

## 文件职责

- `component.template.v1.html`：Omnisend 安全的单根 table 片段和全部内容、设置插槽。
- `component.styles.v1.css`：可由拼接器内联的安全样式维护源。
- `content.schema.v1.json`、`content.fixture.v1.json`：主图、Alt、文案与 CTA 的内容契约和默认本地快照。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：组件背景、文字、CTA 颜色与字体栈的完整设置快照。
- `assets/default-measurement-tool.jpg`：用户提供的原始测量场景图，保留作为源文件。
- `assets/default-measurement-tool-cropped.png`：按设计稿 `1.111:1` 展示比例裁切的本地预览图，供桌面和移动端等比缩放。
- `效果演示.html`：用于 600px 与约 375px 浏览器视觉检查，不能直接导入 Omnisend。

## 内容字段

| 位置 | 字段 | 默认值 / 说明 |
| --- | --- | --- |
| 主图 | `measurement.image.url` / `.alt` | 默认本地参考图；正式导入前替换成公开 HTTPS 图片和匹配的 Alt |
| 标题 | `measurement.title` | `Measure Size Easily` |
| 副标题 | `measurement.subtitle` | `Not Sure On Size? Our Tool Makesit Easy.` |
| CTA | `measurement.cta.label` / `.url` | `MEASURE NOW` / `https://freshinelife.com/pages/measurement-tool` |

图片不绑定点击链接；只有 CTA 跳转至尺寸测量工具页面。文字输入按纯文本转义，链接必须为公开 HTTPS URL。

## 版式边界

- 主图原始展示比例为 `548 × 493px`，顶部距组件边缘 65px；使用预裁切图和 `width:100%; height:auto` 等比缩放，避免 375px 宽度下的纵向过度裁切。
- 标题从主图下方 50px 开始，额外向右 19px 对齐设计稿文字起点；标题为 26px / 36px、600 字重。
- 副标题为 20px / 28px；CTA 为 20px / 28px 的下划线链接。除颜色外，几何参数不作为单封 Campaign 可编辑项。
- `color.surface`、`color.text` 与 `color.action` 可在编辑器修改；字体栈固定为 `Montserrat, Arial, Helvetica, sans-serif`，确保邮件客户端回退稳定。

## Omnisend 安全边界

- 仅使用 table/tr/td、img、a、span 与内联样式；不使用脚本、iframe、表单、Flex、Grid、定位或外部 CSS。
- 默认 `asset://measurement-tool` 只允许本地预览；上传 Omnisend 草稿或导出 HTML 时须将其替换成公开 HTTPS 图片。
- 静态校验和本地预览不代表真实收件箱效果；正式发送前仍应在 Omnisend Desktop/Mobile 预览，并向 Gmail、Outlook 与 Apple Mail 发送测试邮件。
