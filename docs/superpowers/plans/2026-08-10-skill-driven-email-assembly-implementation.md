# Skill-Driven Email Assembly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将拼接器改为只消费 Skill 已确认的完整组件内容与样式快照，先生成指定五组件的准确本地预览，并在最终导入阶段上传本地图片后生成 Omnisend 正文 HTML。

**Architecture:** 组合配置直接包含画布参数及有序组件实例；每个实例携带完整 `content` 与 `settings`。拼接器只验证、转义、注入、内联和组合，不再读取主题文件或执行共享组件样式覆盖。

**Tech Stack:** Node.js ESM、JSON、table-based email HTML、inline CSS。

## Global Constraints

- 组件源文件不得被拼接器写入或修改。
- 正式组合实例必须包含对应 Schema 定义的全部 `content` 和 `settings` 字段。
- 画布保持桌面 600px、移动目标 375px、外部背景 `#FFFFFF`。
- 输出必须符合项目中的 Omnisend 静态安全规则。
- 当前阶段不得调用 Omnisend API、创建 Campaign 或发送邮件。
- 未上传的本地图片必须登记为 `asset://`，只能用于本地预览；正式构建必须拒绝未解析资产。
- 当前目录不是 Git 仓库，因此本计划不包含提交步骤。

---

### Task 1: 建立严格组合配置契约

**Files:**
- Create: `tests/build-email-template.v1.test.mjs`
- Modify: `build-email-template.v1.mjs`

**Interfaces:**
- Consumes: `composition.canvas`、`composition.components[].content`、`composition.components[].settings`
- Produces: Omnisend 正文 HTML 文件及 `.local-preview.html` 文件

- [ ] **Step 1: 编写失败测试**

测试构造一个最小临时组件与完整配置，断言构建器能使用实例内容和实例设置渲染；再分别删除一个内容字段、删除一个设置字段及加入旧 `theme` 字段，断言构建失败。

```js
assert.equal(run(validComposition).status, 0);
assert.match(readOutput(), /Instance title/);
assert.match(readOutput(), /background-color:#123456/);
assert.notEqual(run(withMissingContent).status, 0);
assert.notEqual(run(withMissingSetting).status, 0);
assert.notEqual(run(withLegacyTheme).status, 0);
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node tests/build-email-template.v1.test.mjs`

Expected: FAIL，因为当前构建器读取 `composition.theme`，且只使用 fixture 数据。

- [ ] **Step 3: 实现严格配置读取与校验**

在 `build-email-template.v1.mjs` 中：

```js
const composition = readJson(process.argv[2]);
validateComposition(composition);
const canvas = composition.canvas;

function requireCompleteSnapshot(values, schema, namespace, componentKey) {
  const expected = Object.keys(schema.properties);
  const missing = expected.filter((key) => !(key in values));
  const unknown = Object.keys(values).filter((key) => !(key in schema.properties));
  if (missing.length) throw new Error(`${componentKey}: missing ${namespace} keys: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`${componentKey}: unknown ${namespace} keys: ${unknown.join(', ')}`);
}
```

移除 theme 文件读取、`sharedComponentSettings`、`componentOverrides`、fixture 内容回退和 settings defaults 回退。fixture/defaults 文件不参与正式拼接。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node tests/build-email-template.v1.test.mjs`

Expected: PASS，且临时输出没有未解析插槽、禁止标签或禁止 CSS。

---

### Task 2: 生成五组件完整配置快照

**Files:**
- Create: `compositions/hero-grid-review-gifts-location.default.v1.json`
- Update: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: 五个组件当前 `content.fixture.v1.json` 与 `settings.defaults.v1.json` 的 `values`
- Produces: 不依赖主题合并或默认回退的完整邮件配置

- [ ] **Step 1: 增加失败测试**

读取正式五组件配置，断言顺序和 Key 精确匹配：

```js
assert.deepEqual(composition.components.map(({ componentKey }) => componentKey), [
  'hero.promotionalOverlay',
  'collection.saleGrid6',
  'image.clickableFullWidth',
  'gift.rewardGrid2',
  'location.showroomCard'
]);
```

并对每个实例断言 `content`、`settings` 与对应 Schema 的字段集合完全一致。

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node tests/build-email-template.v1.test.mjs`

Expected: FAIL，因为正式五组件配置尚不存在。

- [ ] **Step 3: 写入完整快照配置**

配置使用：

```json
{
  "schemaVersion": 1,
  "canvas": {
    "backgroundColor": "#FBFAF8",
    "outerBackgroundColor": "#FFFFFF",
    "contentWidth": 600,
    "mobileTargetWidth": 375,
    "verticalPadding": 0
  },
  "output": "头图-六宫格-评论整图链接-免费礼物-地址.html",
  "previewOutput": "头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html",
  "components": []
}
```

五个实例分别复制当前 fixture/defaults 中的完整 `values`，不修改任何默认文案、图片、链接或样式。

首图背景、评论整图和两张赠品图使用顶层 `assets` 登记，并把对应图片字段替换为 `asset://hero-background`、`asset://review-collage`、`asset://gift-pillow-cover` 和 `asset://gift-eye-mask`。

- [ ] **Step 4: 运行测试并确认通过**

Run: `node tests/build-email-template.v1.test.mjs`

Expected: PASS，顺序正确且每个实例均为完整快照。

---

### Task 3: 构建并验收本地预览

**Files:**
- Create: `头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html`

**Interfaces:**
- Consumes: `compositions/hero-grid-review-gifts-location.default.v1.json`
- Produces: 待用户确认的本地预览；正式正文文件留到图片上传并替换 HTTPS 地址后生成

- [ ] **Step 1: 构建正式输出**

Run: `node build-email-template.v1.mjs compositions/hero-grid-review-gifts-location.default.v1.json --preview-local-assets`

Expected: 输出 `status: "local-preview"`、`generated: null`、`components: 5`、`desktopWidth: 600`、`mobileTargetWidth: 375`。

- [ ] **Step 2: 验证静态安全与确定性**

连续构建两次并比较预览 SHA-256；检查五个组件注释顺序、零未解析插槽、四个本地资产均已显示且没有破损图片。另运行一次不带预览参数的构建，确认它因未上传资产而失败。

```js
assert.equal(firstHash, secondHash);
assert.equal(unresolvedSlots.length, 0);
assert.equal(forbiddenTags.length, 0);
assert.equal(nonHttpsImages.length, 0);
```

- [ ] **Step 3: 验证未发生外部操作**

确认改动文件仅限构建器、测试、组合配置、规格/计划和两个生成文件；不存在 Omnisend API 请求、Campaign ID 或发送状态。

- [ ] **Step 4: 交付预览等待确认**

向用户提供正文 HTML 与本地预览文件。只有收到针对该版本的明确确认后，才进入 Omnisend 草稿创建流程。
