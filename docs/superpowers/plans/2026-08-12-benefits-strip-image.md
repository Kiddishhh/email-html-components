# 三项权益整图组件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可由现有拼接器渲染的 `image.benefitsStrip3` 组件，并把它注册为 Skill “整图链接”区段的第二种可选样式。

**Architecture:** 组件按现有 V1 完整快照模式维护，使用单张完整图片、一个整图链接和组件外部背景色。根注册表负责定位组件；Campaign 结构只把新 Component Key 加入既有 `clickable-image` 槽位，交互索引负责声明 Skill 数据来源和确认阶段。

**Tech Stack:** HTML presentation tables、内联 CSS、JSON Schema 风格契约、Node.js `node:test`、现有 `build-email-template.v1.mjs` 与 Campaign 契约校验器。

## Global Constraints

- Component Key 固定为 `image.benefitsStrip3`，目录固定为 `通用图片组件/三项权益整图`。
- 默认图片是用户提供的 512×249px 完整图片；600px 桌面端全宽显示，375px 移动端流式缩放，不裁切。
- 图片内部图标、文案和底色不可拆分编辑；整张图只绑定一个链接。
- 默认链接为 `https://freshinelife.com/`，用户未主动替换时保留默认图。
- 正式 Omnisend HTML 只能使用公开 HTTPS 图片；本地素材只用于预览并在最终上传门前转换。
- 不修改拼接器职责，不新增 Campaign 区段，不改变现有候选组件。

---

### Task 1: 定义组件与注册失败契约

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: 根注册表 `组件清单.json`、现有 Campaign 结构与交互索引。
- Produces: 对 `image.benefitsStrip3` 文件契约、600/375 响应式行为和 Skill 注册的可重复断言。

- [ ] **Step 1: Write the failing component test**

新增测试，查找 `image.benefitsStrip3` 注册项，断言组件路径存在、Schema/Fixture Key 一致、默认图片为 `asset://benefits-strip-3`、默认链接为首页、默认最大宽度为 `600px`，并由拼接器生成无未替换占位符的 HTML。

- [ ] **Step 2: Write the failing Skill registration test**

断言 `clickable-image` 槽位候选为 `image.clickableFullWidth` 与 `image.benefitsStrip3`；交互索引包含本地默认快照、用户图片/链接/背景色来源、完整阶段和双端预览；中文交互文档说明默认保留、内部不可拆分和整图单链接。

- [ ] **Step 3: Run tests to verify RED**

Run: `node --test tests/build-email-template.v1.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

Expected: FAIL，指出注册表或 Skill 中缺少 `image.benefitsStrip3`。

---

### Task 2: 实现三项权益整图 V1 组件

**Files:**
- Create: `通用图片组件/三项权益整图/component.template.v1.html`
- Create: `通用图片组件/三项权益整图/component.styles.v1.css`
- Create: `通用图片组件/三项权益整图/content.schema.v1.json`
- Create: `通用图片组件/三项权益整图/content.fixture.v1.json`
- Create: `通用图片组件/三项权益整图/settings.schema.v1.json`
- Create: `通用图片组件/三项权益整图/settings.defaults.v1.json`
- Create: `通用图片组件/三项权益整图/assets/default-benefits-strip.png`
- Create: `通用图片组件/三项权益整图/效果演示.html`
- Create: `通用图片组件/三项权益整图/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `组件清单.json`

**Interfaces:**
- Consumes: 内容快照字段 `image.url`, `image.alt`, `image.linkUrl`；设置快照字段 `color.surface`, `spacing.outer`, `image.maxWidth`。
- Produces: 可由 `renderComponent(instance)` 渲染的 `image.benefitsStrip3` V1 组件。

- [ ] **Step 1: Add the complete component contract**

模板使用根 100% presentation table，内部图片 table 为 `max-width:{{settings.image.maxWidth}}`；`a` 绑定 `{{content.image.linkUrl}}`；`img` 使用 `{{content.image.url}}`、`{{content.image.alt}}` 和 `width="100%"`。

- [ ] **Step 2: Add the default asset and fixture**

把 `/Users/ww/Downloads/权益版块/组合I.png` 复制为组件自有 `assets/default-benefits-strip.png`。Fixture 使用 `asset://benefits-strip-3`、Alt `Freshine benefits: 7–14 day delivery, secure payments, and free shipping` 与首页链接。

- [ ] **Step 3: Add settings and documentation**

默认设置使用 `color.surface: #F7F3F0`、`spacing.outer: 0`、`image.maxWidth: 600px`。中文文档说明全宽放大、375px 比例缩放、推荐高清尺寸 1200×584px、整图链接和本地素材上传门。

- [ ] **Step 4: Add the standalone demo and registry entry**

演示页在 600px 画布中使用本地图片全宽显示。根注册表新增唯一 `image.benefitsStrip3` 条目并指向所有 V1 文件。

- [ ] **Step 5: Run the component tests**

Run: `node --test tests/build-email-template.v1.test.mjs`

Expected: 新组件测试 PASS，已有组件测试保持 PASS。

---

### Task 3: 注册 Skill 候选与验证完整工作区

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`
- Modify: `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`

**Interfaces:**
- Consumes: `image.benefitsStrip3` 注册项和完整组件快照。
- Produces: “整图链接”区段二选一候选、可校验交互流程和用户完成卡片规则。

- [ ] **Step 1: Register the candidate**

把 `image.benefitsStrip3` 加入 `clickable-image.candidateComponentKeys`，不改变区段顺序、必选状态或页脚终止规则。

- [ ] **Step 2: Register the interaction contract**

新增交互索引：来源为 `component.localDefaultSnapshot`, `user.publicHttpsImage`, `user.localImage`, `user.link`, `user.color`；阶段为 `loadDefaultSnapshot`, `collectOrConfirmImage`, `inspectImage`, `confirmLinkAndBackground`, `completionCard`；完成要求桌面和移动预览。

- [ ] **Step 3: Document the user interaction**

Skill 主文档把新样式列入“整图链接”候选；中文交互文档明确默认保留图片、整图单链接、Alt 与背景色确认、图片内部内容不可拆分，以及替换图建议尺寸。

- [ ] **Step 4: Run contract validation and tests**

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

Expected: `Campaign contracts valid: 6 slots, 9 selectable component styles.`

Run: `node --test tests/*.test.mjs`

Expected: 全部测试 PASS。

- [ ] **Step 5: Perform static and visual checks**

扫描新组件确认没有 JavaScript、iframe、form、Flex、Grid、定位、文档级标签或未替换占位符；以本地 HTTP 预览检查 600px 与 375px 图片完整、无裁切、链接覆盖整张图片。
