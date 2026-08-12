# 促销悬浮首图默认 Logo 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保持旧版 106px/80px Logo 尺寸，只将 Pixso 参考图中的半透明圆底和白色 FreShine 字标设为首图组件默认样式，并在 Campaign Skill 中增加独立确认步骤。

**Architecture:** 保留现有 `hero.logo.url/alt/clickUrl` 内容接口，用真实白色透明 PNG 保持品牌字形；圆形用 table、实体 `bgcolor` 和 RGBA 覆盖实现兼容降级。Skill 将底色和透明度作为一组确认值，确定性写入完整设置快照。

**Tech Stack:** Node.js ESM、`node:test`、邮件 table/inline CSS、PNG alpha、Codex ImageGen、Markdown Skill 契约。

## Global Constraints

- 圆形保持旧版 `106 × 106px`、圆角 `53px`，字标最大宽度保持 `80px`，顶部间距保持 `48px`。
- 默认实体底色为 `#A79689`，透明覆盖色为 `rgba(167, 150, 137, 0.70)`。
- 白色字标使用真实透明 PNG；禁止 CSS filter、SVG、系统 cursive 字体和 CSS opacity。
- 不改写已有历史 Campaign 草稿或其确认哈希。
- 每项行为变更必须先观察测试按预期失败，再实现最小修复。
- 不 commit、不配置 remote、不 push。

---

### Task 1: 建立默认 Logo 视觉回归测试

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: 首图模板、CSS、defaults、Schema 和默认六组件 composition。
- Produces: 对圆形尺寸、透明色、白色资源、完整快照和本地解析的行为约束。

- [ ] **Step 1: 写失败测试**

  断言模板保持 `106 × 106px` 徽章、`53px` 圆角和 `80px` 字标；defaults/Schema 包含 `color.logoBadgeTransparent`；默认值为 `#A79689`、70% RGBA、`48px` 和 `80px`；默认 composition 用 `asset://hero-logo-white` 并登记本地 PNG。

- [ ] **Step 2: 运行测试确认 RED**

  Run: `node --test tests/build-email-template.v1.test.mjs`

  Expected: FAIL，显示当前仍为 106px 徽章、80px Logo 且缺少透明色字段。

### Task 2: 生成白色字标并更新组件默认实现

**Files:**
- Create: `头图/促销悬浮首图/assets/default-logo-white.png`
- Modify: `头图/促销悬浮首图/component.template.v1.html`
- Modify: `头图/促销悬浮首图/component.styles.v1.css`
- Modify: `头图/促销悬浮首图/content.fixture.v1.json`
- Modify: `头图/促销悬浮首图/settings.defaults.v1.json`
- Modify: `头图/促销悬浮首图/settings.schema.v1.json`
- Modify: `头图/促销悬浮首图/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `头图/促销悬浮首图/效果演示.html`
- Modify: `compositions/hero-grid-review-gifts-location.default.v1.json`

**Interfaces:**
- Consumes: 当前 FreShine 透明字标和 Task 1 断言。
- Produces: 白色透明 PNG 与邮件安全圆形默认 Logo。

- [ ] **Step 1: 用 ImageGen 编辑当前字标**

  只把现有 FreShine 字标颜色改为纯白，保持文字轮廓、比例、透明留白和透明背景；保存为组件资产并检查 alpha、尺寸和边缘。

- [ ] **Step 2: 更新完整组件契约**

  添加 `color.logoBadgeTransparent`；保持 Logo 顶距 `48px`、最大宽度 `80px`，fixture 指向 `asset://hero-logo-white`。

- [ ] **Step 3: 更新模板和 CSS**

  用旧版 106px table、53px 圆角、实体底色和 RGBA 覆盖渲染；白色 PNG 在圆形内居中，不使用 opacity/filter。

- [ ] **Step 4: 更新默认 composition、管理说明和效果演示**

  登记 `hero-logo-white` 资产并补全 settings 快照；效果演示引用组件内 PNG，展示新的默认样式。

- [ ] **Step 5: 运行组件测试确认 GREEN**

  Run: `node --test tests/build-email-template.v1.test.mjs`

  Expected: PASS。

### Task 3: 增加 Skill Logo 样式确认步骤

**Files:**
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`

**Interfaces:**
- Consumes: `#A79689`、70% 和组件新 settings。
- Produces: 一次独立 Logo 样式确认及颜色/透明度确定性映射规则。

- [ ] **Step 1: 写失败 Skill 契约测试**

  断言主视觉图片之后存在独立 Logo 卡片、桌面/375px 预览和一次确认；允许修改 `#RRGGBB` 与 0–100% 透明度；明确 RGBA 换算、白色字标和固定尺寸。

- [ ] **Step 2: 运行测试确认 RED**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: FAIL，因为当前 Skill 没有 Logo 独立确认。

- [ ] **Step 3: 最小同步 Skill 与参考契约**

  把 Logo 确认插入主视觉图片之后、首图完成卡片之前；用户采用默认值时直接锁定，修改时只重新生成 Logo 卡片及两种预览。

- [ ] **Step 4: 运行 Skill 测试确认 GREEN**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: PASS。

### Task 4: 重新生成预览并完成验证

**Files:**
- Generate: `build/campaign-six-components.local-preview.html`

**Interfaces:**
- Consumes: Tasks 1–3 的最终组件与 Skill。
- Produces: 可检查的新默认 Logo 预览和验证证据。

- [ ] **Step 1: 构建六组件预览**

  Run: `node build-email-template.v1.mjs compositions/hero-grid-review-gifts-location.default.v1.json --preview-local-assets`

  Expected: 六组件预览成功，Logo PNG 从 `build/` 相对解析。

- [ ] **Step 2: 检查预览结构与资产**

  验证 106px 圆形、80px 白色 PNG、实体底色与 RGBA 覆盖；在浏览器中检查原有布局尺寸未改变。

- [ ] **Step 3: 运行完整测试和语法检查**

  Run: `node --test tests/*.test.mjs`

  Run: `for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs; do node --check "$file"; done`

  Expected: 0 failed、exit 0。

- [ ] **Step 4: 验证 Skill 与 Git 边界**

  运行 Campaign 契约校验、Skill 官方校验和密钥形态扫描；确认没有 commit、remote、Shopify 或 Omnisend 写入。
