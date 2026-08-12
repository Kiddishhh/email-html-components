# 600px 全宽首图与评论图设计

## 目标

将首图和可链接评论整图统一为 600px 邮件画布内的全宽默认样式，同时保留移动端按容器比例缩放。

## 范围

- `hero.promotionalOverlay`：保持现有 `width:100%` 背景结构，明确其在 600px 邮件画布内全宽铺满；不调整高度、内容面板、Logo 或 CTA。
- `image.clickableFullWidth`：默认 `spacing.outer` 为 `0`，默认 `image.maxWidth` 从 `552px` 改为 `600px`；图片继续使用 `width:100%; height:auto`。
- 同步整图组件的默认快照、Schema、演示页、组件说明、Skill 交互说明和自动化测试。

## 视觉与兼容性规则

- 桌面端：内容宽度为 600px；评论图无左右留白，按原始比例显示。1200×2186 评论图显示为约 600×1093px。
- 移动端：容器宽度缩至约 375px，图片按比例显示为约 375×683px。
- 首图继续用 `background` 属性和内联 `background-image` 配合 `background-size:cover`，不引入 Flex、Grid、绝对定位或客户端脚本。
- 邮件画布宽度仍由组合文件的 `canvas.contentWidth: 600` 管理；组件不自行创建第二层固定宽度画布。

## Skill 规则

当用户选择评论图或评论拼图时，默认完成卡片说明为“600px 画布全宽、零外边距”；用户仍可在完整 settings 快照中显式覆盖该组件设置。首图图片说明明确为“跟随 600px 画布全宽铺满”。

## 验收

- 可链接整图默认 JSON 与 Schema 均为 `600px` 和 `0`。
- 默认演示页的图片容器为 `max-width:600px`，无外边距。
- 首图与评论整图在渲染输出中都位于 600px 内容画布内并使用 `width:100%`。
- 组件管理文档和 Skill 不再将 `552px`/左右 24px 留白描述为默认规则。
- 现有 Campaign 组合仍可用，且全量 Node 测试通过。
