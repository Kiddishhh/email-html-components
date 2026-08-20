# 三项权益整图组件管理说明（V1）

## 组件定位

- 中文名称：三项权益整图
- 英文名称：Three-Benefit Image Strip
- Component Key：`image.benefitsStrip3`
- 用途：以一张完整图片展示“7–14 天配送、安全支付、免运费”三项权益；图片不提供点击跳转。
- 桌面邮件画布：600px；图片默认 600px 全宽、零外边距。
- 移动端目标：375px 流式缩放，不裁切、不改变宽高比。

该组件不会拆分图片内部的图标、文案或底色。需要调整某项权益、图标、字体或图片内部背景时，必须替换整张完整图片。

## 文件职责

- `component.template.v1.html`：Omnisend 静态安全的无链接整图片段。
- `component.styles.v1.css`：组件图片流式样式维护源，由拼接器内联。
- `content.schema.v1.json`：Skill 收集的图片与 Alt 字段；其中保留的旧链接字段只用于兼容历史组合，不参与渲染。
- `content.fixture.v1.json`：默认内容完整快照和本地素材引用。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：组件外部背景、外边距和图片最大宽度。
- `assets/default-benefits-strip-rights-2.jpg`：用户确认使用的默认三项权益图（1290×627px）。
- `效果演示.html`：600px 浏览器效果演示，不是正式 Omnisend 导入片段。

## Skill 使用与修改

用户选择此样式时，Skill 默认保留当前三项权益图，不强制重新上传。完成卡片必须展示：

1. 当前默认或替换后的图片；
2. `image.alt`；
3. `color.surface`；
4. 600px 桌面端和约 375px 移动端预览。

图片内部内容不可拆分编辑，整张图片不绑定链接，也不使用图片热区。

## 图片规格与响应式

- 当前默认源图：1290 × 627px。
- 桌面端：在 600px 邮件画布中显示为 600px 全宽，预计高度约 292px。
- 移动端：按容器宽度缩放到约 375 × 182px。
- 模板固定使用 `width:100%; max-width:100%; height:auto`，因此不会裁切图片。
- 后续生产素材建议保持当前约 2.06:1 的比例，并使用至少 `1290 × 627px` 的 PNG、JPG 或 WebP，以提升高密度屏幕清晰度。
- 图片内的小字号必须在 375px 宽度下仍可读；替换前应检查实机缩放效果。

## 内容字段

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `image.url` | `asset://benefits-strip-3` | 当前默认的本地组件图片；可替换为其他公开 HTTPS 地址 |
| `image.alt` | 三项权益英文说明 | 图片加载失败与无障碍描述，应随替换图片同步更新 |

## 设置字段

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `color.surface` | `#F7F3F0` | 图片外部和加载失败时的组件背景色，不会改变图片像素内的底色 |
| `spacing.outer` | `0` | 图片容器外层内边距 |
| `image.maxWidth` | `600px` | 桌面端最大显示宽度 |

Skill 必须把全部内容字段和设置字段写入当前 composition 的完整快照。单封邮件的修改不得回写组件默认文件。

## Omnisend 安全边界

- 模板使用单根 100% presentation table、嵌套 table 和 `img`。
- 关键样式内联，不使用脚本、iframe、表单、Flex、Grid、定位或外部 CSS。
- 当前默认本地素材会在导出时上传至 Omnisend 图片仓库；手动替换图仍需在最终导入前上传到 Omnisend 图片仓库或其他公开 CDN，并把返回的 HTTPS URL 写回 `image.url`。
- 组件不包含页脚或退订令牌。

静态检查通过只表示符合静态规范。正式发送前仍需在 Omnisend 完成 Desktop/Mobile 预览和测试邮件验证。
