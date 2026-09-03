# 六宫格折扣推荐（标题款）选择性集成设计

## 目标

将来源工作树 `/Users/ww/.codex/worktrees/sale-grid6-title` 中未提交的 `collection.saleGrid6WithTitle` 组件安全纳入当前 `main`，使其符合全库 600px 桌面 / 375px 移动端等比规范，并能在 Campaign HTML 编辑器中被选择、编辑和按格只读导入 Shopify 商品。

## 来源与范围

来源分支为 `codex/sale-grid6-title`。其分支提交与 `main` 相同，组件和登记改动仍在来源工作树中，因而不能通过普通 Git merge 获得差异。

仅迁入下列范围：

1. `活动商品组件/六宫格折扣推荐（标题款）/` 的模板、演示、Schema、默认快照、说明与 CSS。
2. `组件清单.json`、`组件索引.md` 中 `collection.saleGrid6WithTitle` 的登记。
3. 编辑器的字段白名单、文案、六个独立导入按钮和服务端导入路由。
4. 交互/工作流文档中该组件的入口说明。
5. 该组件及移动端适配所需的测试。

明确排除来源工作树的 `design-qa.md` 大幅删改，以及与该组件无关的 README 或其他文件变化。

## 组件与移动端契约

- 保持 600px 画布、两列三行六卡布局和现有链接/UTM 边界。
- 在 `component.template.v1.html` 与 `效果演示.html` 中同步使用桌面值优先、后接 inline `min()` 的 600px → 375px 等比声明。
- 同步收缩标题、副标题、商品名、折扣条、CTA、图片显示高度、卡片间距、边距和圆角；保持两列，不切换为单列。
- 不改写百分比、`auto`、`0`、`font-size:0` 或 1px 分隔线；纯流式图片继续用 `width:100%;height:auto`。
- 邮件输出继续使用 table 布局和 inline CSS；组件 CSS 仅保留编辑器/演示辅助用途，不能成为最终邮件的唯一移动端适配来源。

## 编辑器集成

组件 key 固定为 `collection.saleGrid6WithTitle`，分类为“活动商品组件”。编辑器显示标题、说明、六张商品的名称/折扣/图片/Alt/链接及底部 CTA；六个 Shopify 导入按钮只能改写被选中的卡片，并复用既有只读单品导入链路。

## 安全集成与验证

在当前 `main` 的工作树中选择性迁入，保留其中其他未提交内容。只 stage 并提交本设计列出的文件，形成独立组件集成提交；不重置、清理或覆盖来源与 `main` 的其他文件。

交付前运行：

1. 新组件聚焦测试、移动端守卫测试和编辑器相关测试。
2. `node scripts/normalize-inline-mobile-dimensions.mjs --check`。
3. `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`。
4. 完整 `node --test tests/*.test.mjs`、`git diff --check`。
5. 使用新的本地编辑器端口验证组件可选、600px / 375px 预览和无控制台错误。

本地测试和编辑器预览不替代 Omnisend、Gmail、Outlook 或 Apple Mail 的实际收件箱验证。
