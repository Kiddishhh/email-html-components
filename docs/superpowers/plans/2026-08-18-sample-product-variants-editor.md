# 小样产品推荐卡左右版本与 Campaign 编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将左右镜像小样产品推荐卡安全整合到主线，并与当前两张 II 卡一起注册到 Campaign 编辑器。

**Architecture:** 当前主线的未提交注册为基准；从分支导入仅左右卡所需的目录与注册条目。编辑器继续由 `组件清单.json` 建立目录，但需在 UI 契约中显式声明四个组件可编辑字段；现有六槽位 Campaign CLI 不变。

**Tech Stack:** Node.js ESM、Node test、JSON Registry、HTML/CSS email components。

**Spec:** `docs/superpowers/specs/2026-08-18-sample-product-variants-editor-design.md`

## Global Constraints

- 所有组件输出宽度保持 600px；移动端仅按组件既有规则缩放，不重排上下布局。
- 字体延续 Montserrat；小样产品左右卡的标题/副标题/CTA 权重分别为 600/400/500。
- 编辑器可编辑字段必须同时存在于组件 Schema；不得加入 CLI 固定六区段。
- 不覆盖当前主工作区的未提交 II 卡片及其编辑器支持。

---

### Task 1: 锁定编辑器对左右卡的公共编辑契约

**Files:**
- Modify: `tests/campaign-editor-core.test.mjs:39-61`
- Modify: `skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs`

**Interfaces:**
- Consumes: 注册表的 `product.sampleProductRecommendationLeft` 与 `product.sampleProductRecommendationRight`。
- Produces: `editableFieldKeys(componentKey)` 对两个 Key 返回图片、标题、副标题、CTA、链接及 `color.surface` / `color.text`。

- [ ] **Step 1: 写入失败测试**

```js
assert.deepEqual(styleKeysForStructure(catalog, '小样-产品'), [
  'product.sampleProductRecommendationLeft',
  'product.sampleProductRecommendationRight',
  'product.curtainRecommendationOverlay',
  'product.curtainRecommendationNoTitle'
]);
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test tests/campaign-editor-core.test.mjs`
Expected: FAIL，因为当前注册和 UI 契约尚无左右 Key。

- [ ] **Step 3: 最小实现**

将左右卡目录、注册条目和 `editableByComponent` 字段引入当前主线；复用现有 `product.*` 标签与帮助文案。

- [ ] **Step 4: 运行测试**

Run: `node --test tests/campaign-editor-core.test.mjs`
Expected: PASS。

### Task 2: 同步索引与 Skill 使用说明

**Files:**
- Modify: `组件清单.json`
- Modify: `组件索引.md`
- Modify: `README.md`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md`

**Interfaces:**
- Consumes: 四个已经注册的 `product.*` Key。
- Produces: 用户文档与编辑器行为一致的组件清单。

- [ ] **Step 1: 确认文档声明的 Key 集合**

Run: `rg -n "sampleProductRecommendation|curtainRecommendation" 组件清单.json 组件索引.md README.md skills/build-omnisend-campaign-draft`

- [ ] **Step 2: 同步描述**

在小样产品章节写明左、右和两张 II 卡均可在编辑器中自由添加与编辑，并明确不影响 CLI 固定六区段。

- [ ] **Step 3: 校验注册表**

Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`
Expected: `status: valid`。

### Task 3: 全量验证

**Files:**
- Verify: `tests/campaign-editor-core.test.mjs`
- Verify: `tests/campaign-editor-server.test.mjs`
- Verify: `tests/build-email-template.v1.test.mjs`

- [ ] **Step 1: 运行回归测试**

Run: `node --test tests/campaign-editor-core.test.mjs tests/campaign-editor-server.test.mjs tests/build-email-template.v1.test.mjs`
Expected: 所有测试通过。

- [ ] **Step 2: 核对编辑器注册覆盖**

Run: `node --input-type=module -e "import('./skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs').then(async ({buildEditorCatalog}) => { const catalog = buildEditorCatalog({workspaceRoot: process.cwd()}); console.log(catalog.filter((item) => item.category === '小样-产品').map((item) => item.componentKey)); })"`
Expected: 输出四个小样产品组件 Key。

- [ ] **Step 3: 检查差异格式**

Run: `git diff --check`
Expected: exit 0。
