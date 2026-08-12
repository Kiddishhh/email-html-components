# Double Gift Vertical Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将双赠品奖励卡改为可由后续 Skill 注入文案、完整图片、链接和背景色的上下单列 Omnisend V1 组件。

**Architecture:** 保留 `gift.rewardGrid2` 与现有 V1 七文件契约，模板改为表格单列；参考图中的图片内文字保留在位图中。独立演示 HTML 使用本地裁切素材，生产 fixture 保持公开 HTTPS 地址要求。

**Tech Stack:** 邮件安全 HTML 表格、内联 CSS、JSON Schema、Node.js 静态测试、浏览器视觉验收。

## Global Constraints

- 单根 100% 表格；禁止文档级标签、`div`、脚本、Flex/Grid 和定位。
- 图片内部文案不可编辑，只能整体替换图片。
- 600px 桌面画布和 375px 移动端均为上下单列且无横向溢出。
- 只可将静态检查结果称为“符合静态规范”。

### Task 1: V1 契约与上下结构

**Files:**
- Modify: `活动与赠品组件/双赠品奖励卡/component.template.v1.html`
- Modify: `活动与赠品组件/双赠品奖励卡/component.styles.v1.css`
- Modify: `活动与赠品组件/双赠品奖励卡/content.schema.v1.json`
- Modify: `活动与赠品组件/双赠品奖励卡/content.fixture.v1.json`
- Modify: `活动与赠品组件/双赠品奖励卡/settings.schema.v1.json`
- Modify: `活动与赠品组件/双赠品奖励卡/settings.defaults.v1.json`
- Test: `/private/tmp/double-gift-vertical-v1.test.mjs`

- [ ] 编写断言上下图片顺序、Skill 字段、主题背景和禁止标签的失败测试。
- [ ] 运行测试并确认旧左右布局导致失败。
- [ ] 最小化修改模板、Schema、fixture 和 CSS。
- [ ] 运行测试并确认全部通过。

### Task 2: 默认素材、演示与文档

**Files:**
- Create: `活动与赠品组件/双赠品奖励卡/assets/default-pillow-cover.png`
- Create: `活动与赠品组件/双赠品奖励卡/assets/default-eye-mask.png`
- Create: `活动与赠品组件/双赠品奖励卡/效果演示.html`
- Modify: `活动与赠品组件/双赠品奖励卡/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `design-qa.md`

- [ ] 从指定参考稿裁切两张完整赠品图片作为本地默认演示素材。
- [ ] 用默认设置和文案生成无占位符演示 HTML。
- [ ] 更新中文维护和 Skill 使用说明。
- [ ] 在浏览器完成 600px、375px 和参考图并排验收，记录最终结果。
- [ ] 重新运行完整静态测试和 JSON 校验。
