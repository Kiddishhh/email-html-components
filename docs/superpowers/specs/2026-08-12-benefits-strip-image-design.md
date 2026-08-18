# 三项权益整图组件设计

## 目标

在 `通用图片组件` 下新增独立的“三项权益整图”V1 组件，以用户提供的 `/Users/ww/Downloads/权益版块/组合I.png` 作为默认完整视觉，支持 600px 桌面邮件画布和约 375px 移动端渲染，并注册到现有 Campaign Skill 的“整图链接”区段。

## 组件契约

- 中文名称：`三项权益整图`
- Component Key：`image.benefitsStrip3`
- 目录：`通用图片组件/三项权益整图`
- 维护方式：整图；不拆分图片中的三个图标、三段文字或图片内部底色。
- 内容字段：`image.url`、`image.alt`、`image.linkUrl`。
- 设置字段：`color.surface`、`spacing.outer`、`image.maxWidth`。
- 默认整图链接：`https://freshinelife.com/`。
- 用户没有主动要求更换时，Skill 使用当前默认图并在完成卡片中确认。

组件目录必须包含模板、组件 CSS、内容 Schema、内容 Fixture、设置 Schema、设置默认值、本地默认素材、效果演示和中文管理文档。单次 Campaign 只生成完整内容/设置快照，不回写组件默认值。

## 响应式与邮件结构

- 邮件画布宽度为 600px，组件默认 `image.maxWidth` 为 `600px`，`spacing.outer` 为 `0`。
- 默认 1200×584px 图片在桌面端按 600px 全宽显示，高度按比例约为 292px。
- 移动端按容器宽度流式缩放至约 375×182px，不裁切、不改变宽高比。
- 使用单根 presentation table、嵌套 table、`a` 与 `img`；关键样式内联。
- 图片使用 `display:block;width:100%;height:auto`，不使用 Flex、Grid、定位、脚本、媒体查询或图片热区。
- 整张图片只绑定一个链接；三个权益区域不分别链接。

默认素材为 1200×584px 高清完整图片；后续替换时应保持相近宽高比及至少相同分辨率。

## 图片、背景与 Omnisend

- 默认本地图片仅用于组件库和本地预览。
- 最终写入 Omnisend 前，若仍使用默认本地图片，必须先上传到图片仓库并以公开 HTTPS URL 替换。
- `color.surface` 只控制图片外部和图片加载失败时的组件背景，不会修改图片像素内已经烘焙的底色。
- Alt 默认描述三项权益：7–14 天配送、安全支付和免运费；允许 Skill 根据替换后的实际图片建议或修改。
- 正式内容禁止本地路径、`file://`、`data:`、blob URL、相对图片路径和 JavaScript 链接。

## Skill 注册

- 保留当前固定六区段 Campaign 结构，不新增区段。
- 将 `image.benefitsStrip3` 加入 `clickable-image` 区段，与 `image.clickableFullWidth` 并列候选；用户每封邮件只能选其中一种。
- 在交互索引中注册允许来源：组件本地默认快照、用户本地图片、用户公开 HTTPS 图片、用户链接和用户背景色。
- 必需阶段：加载默认快照、收集或确认图片、检查图片、确认链接与背景色、完成卡片。
- 完成卡片展示默认/替换图片、Alt、整图链接、背景色，以及桌面端和 375px 移动端预览；明确说明图片内部内容不可拆分编辑。

## 验证

- 注册表中 `image.benefitsStrip3` 恰好出现一次，所有路径存在，Schema 和 Fixture 的 Component Key 一致。
- 默认 Fixture、设置和模板能由现有拼接器以完整快照成功渲染。
- 最终构建阻止未上传的本地图片，本地预览允许已登记的 `asset://` 图片。
- 效果演示使用本地默认图并在 600px 画布内全宽显示。
- Skill 结构校验器接受同一区段两个候选，并验证新组件交互索引完整。
- 静态扫描确认无脚本、iframe、表单、Flex、Grid、定位、文档级标签或未替换占位符。
