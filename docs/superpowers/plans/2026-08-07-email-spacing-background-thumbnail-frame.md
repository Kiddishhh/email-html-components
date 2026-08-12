# Email Spacing, Background, and Thumbnail Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整首图和编辑式商品间距、为两处布料小图增加邮件安全框架与模拟阴影，并将画布内外背景解耦为 `#FBFAF8` 与 `#FFFFFF`。

**Architecture:** 组件间距继续由各自 V1 settings 管理；小图框架由组件模板的嵌套表格和组件 CSS 维护；整体主题只提供画布内容背景和画布外背景。拼接器把两种背景分别写入外层表格、600px 内容表格和本地预览 body。

**Tech Stack:** Node.js ESM、`node:test`、表格邮件 HTML、内联 CSS、JSON V1 schema/defaults、Omnisend Custom HTML。

## Global Constraints

- 保留六个 V1 组件的顺序、内容 fixture、字体、CTA、页脚 `[[unsubscribe_link]]` 和 600px / 375px 响应式结构。
- 首图主体背景和邮件画布内容背景使用 `#FBFAF8`；画布外部使用 `#FFFFFF`。
- 不使用 `box-shadow`、脚本、定位、Flex/Grid、媒体查询或外部样式表。
- 布料小图使用 6px 白框、`1px solid #E7E1DA` 边线和 6px 右下 `#EFEAE4` 表格模拟阴影。
- 不上传或发布到 Omnisend。
- 当前目录不是 Git 仓库；不执行 commit 步骤。

---

### Task 1: 解耦画布内容背景与画布外背景

**Files:**
- Modify: `five-components-safe-email.test.mjs`
- Modify: `build-email-template.v1.mjs`
- Modify: `themes/default-canvas.theme.v1.json`
- Modify: `themes/seasonal-sale-hero.theme.v1.json`

**Interfaces:**
- Consumes: `theme.canvas.backgroundColor`、`contentWidth`、`mobileTargetWidth`、`verticalPadding`。
- Produces: 可选 `theme.canvas.outerBackgroundColor`；缺省回退 `#FFFFFF`。外层 100% 表格和预览 body 使用外背景，600px 内容容器使用内容背景。

- [ ] **Step 1: 写入失败测试**

在 `five-components-safe-email.test.mjs` 中把主题背景断言改为：

```js
assert.match(html, /^<table[^>]*bgcolor="#FFFFFF"[^>]*background-color:#FFFFFF/);
assert.match(html, /<table role="presentation" width="600"[^>]*bgcolor="#FBFAF8"/);
assert.match(html, /<td align="center" valign="top" bgcolor="#FBFAF8" style="padding:16px 0;background-color:#FBFAF8;"/);
assert.match(previewHtml, /<body[^>]*background-color:#FFFFFF/);
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test --test-name-pattern='默认主题|本地预览' five-components-safe-email.test.mjs`

Expected: FAIL，因为当前内容背景为 `#FAF9F7`，外层和 body 未独立使用 `#FFFFFF`。

- [ ] **Step 3: 实现最小背景解耦**

在两个 theme 文件的 `canvas` 中写入：

```json
"backgroundColor": "#FBFAF8",
"outerBackgroundColor": "#FFFFFF"
```

在拼接器中读取：

```js
const { backgroundColor, outerBackgroundColor = '#FFFFFF', contentWidth, verticalPadding = 0 } = theme.canvas;
```

外层表格与外层 `td` 使用 `outerBackgroundColor`；600px 内容表格与内容 `td` 使用 `backgroundColor`；本地预览 body 使用 `outerBackgroundColor`。

- [ ] **Step 4: 运行目标测试确认绿灯**

Run: `node --test --test-name-pattern='默认主题|本地预览' five-components-safe-email.test.mjs`

Expected: PASS。

---

### Task 2: 调整首图背景与底部间距

**Files:**
- Modify: `seasonal-sale-hero-v1.test.mjs`
- Modify: `主视觉组件/节日促销首图/settings.defaults.v1.json`
- Modify: `主视觉组件/节日促销首图/settings.schema.v1.json`
- Modify: `主视觉组件/节日促销首图/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: `settings.color.surface`、`settings.spacing.image`。
- Produces: 默认 `color.surface = #FBFAF8`、`spacing.image = 29px 0 32px`。

- [ ] **Step 1: 写入失败测试**

在 `seasonal-sale-hero-v1.test.mjs` 中断言：

```js
assert.equal(defaults.values['color.surface'], '#FBFAF8');
assert.equal(defaults.values['spacing.image'], '29px 0 32px');
assert.match(html, /bgcolor="#FBFAF8"/);
assert.match(html, /padding:29px 0 32px/);
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test seasonal-sale-hero-v1.test.mjs`

Expected: FAIL，实际仍为 `#F7F3EF` 与 `29px 0 0`。

- [ ] **Step 3: 同步 defaults、schema 和中文说明**

把两个 JSON 中的默认值同步改为 `#FBFAF8` 和 `29px 0 32px`；说明文档分别描述首图主体背景和“图片区上 29px、下 32px”。

- [ ] **Step 4: 运行首图测试确认绿灯**

Run: `node --test seasonal-sale-hero-v1.test.mjs`

Expected: PASS。

---

### Task 3: 增加编辑式商品正文边距和正文到主图间距

**Files:**
- Modify: `five-components-safe-email.test.mjs`
- Modify: `商品组件/编辑式叠放商品/component.template.v1.html`
- Modify: `商品组件/编辑式叠放商品/settings.defaults.v1.json`
- Modify: `商品组件/编辑式叠放商品/settings.schema.v1.json`
- Modify: `商品组件/编辑式叠放商品/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: `settings.spacing.header`、`settings.spacing.content`。
- Produces: `spacing.header = 8px 36px 0`、`spacing.content = 0 36px 32px`、新增 `spacing.mediaGap = 16px`。

- [ ] **Step 1: 写入失败测试**

在生成模板测试中取得“编辑式叠放商品”片段并断言：

```js
assert.match(editorial, /padding:8px 36px 0/);
assert.match(editorial, /padding:0 36px 32px/);
assert.match(editorial, /height:16px;font-size:0;line-height:0/);
```

同时验证 defaults 与 schema 的每个默认值同步。

- [ ] **Step 2: 运行目标测试确认红灯**

Run: `node --test --test-name-pattern='编辑式叠放商品' five-components-safe-email.test.mjs`

Expected: FAIL，实际水平边距为 32px，正文到主图为 4px。

- [ ] **Step 3: 实现最小设置和模板替换**

在 defaults/schema 中新增：

```json
"spacing.mediaGap": "16px"
```

模板的正文到主图间隔单元格改为：

```html
<td style="height:{{settings.spacing.mediaGap}};font-size:0;line-height:0;">&nbsp;</td>
```

同步把 `spacing.header`、`spacing.content` 改为确认值，并更新中文说明。

- [ ] **Step 4: 运行目标测试确认绿灯**

Run: `node --test --test-name-pattern='编辑式叠放商品' five-components-safe-email.test.mjs`

Expected: PASS。

---

### Task 4: 为两张布料小图增加邮件安全框架和模拟阴影

**Files:**
- Modify: `five-components-safe-email.test.mjs`
- Modify: `商品组件/编辑式叠放商品/component.template.v1.html`
- Modify: `商品组件/编辑式叠放商品/component.styles.v1.css`
- Modify: `商品组件/编辑式叠放商品/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `内容与权益组件/免费设计咨询/component.template.v1.html`
- Modify: `内容与权益组件/免费设计咨询/component.styles.v1.css`
- Modify: `内容与权益组件/免费设计咨询/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: `editorial.detailImage`、`consultation.sketchImage` 的现有图片插槽。
- Produces: 每个插槽外层 `.freshine-fabric-shadow` 和内层 `.freshine-fabric-frame` 表格类；构建后所有效果均为内联 CSS。

- [ ] **Step 1: 写入失败测试**

生成邮件后分别截取两个组件片段，断言每个片段包含：

```js
assert.match(section, /class="freshine-fabric-shadow"[^>]*background-color:#EFEAE4[^>]*padding:0 6px 6px 0/);
assert.match(section, /class="freshine-fabric-frame"[^>]*background-color:#FFFFFF[^>]*border:1px solid #E7E1DA[^>]*padding:6px/);
assert.doesNotMatch(section, /box-shadow/);
```

- [ ] **Step 2: 运行目标测试确认红灯**

Run: `node --test --test-name-pattern='布料小图' five-components-safe-email.test.mjs`

Expected: FAIL，因为当前不存在框架类。

- [ ] **Step 3: 实现嵌套表格和组件 CSS**

两个组件模板均按以下结构包裹原图片表格：

```html
<table class="freshine-fabric-shadow" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td class="freshine-fabric-frame">
    <!-- 原图片插槽表格 -->
  </td></tr>
</table>
```

两个组件自己的 `component.styles.v1.css` 均加入：

```css
.freshine-fabric-shadow { background-color:#EFEAE4; padding:0 6px 6px 0; }
.freshine-fabric-frame { background-color:#FFFFFF; border:1px solid #E7E1DA; padding:6px; }
```

更新两份中文说明，注明这是表格模拟阴影，不能替换为 `box-shadow`。

- [ ] **Step 4: 更新经批准变化后的稳定哈希**

运行拼接器，重新计算“编辑式叠放商品”和“免费设计咨询”片段 SHA-256；只更新这两个预期哈希，双赠品和六宫格预期哈希保持不变。

- [ ] **Step 5: 运行完整自动测试**

Run: `node --test seasonal-sale-hero-v1.test.mjs five-components-safe-email.test.mjs`

Expected: 0 failures。

---

### Task 5: 重建输出并完成桌面/移动端设计验收

**Files:**
- Regenerate: `seasonal-sale-hero.v1.html`
- Regenerate: `seasonal-sale-hero.v1.local-preview.html`
- Regenerate: `邮件html模版.html`
- Regenerate: `邮件html模版.local-preview.html`
- Modify: `组件索引.md` only if background responsibilities are currently described inaccurately.

**Interfaces:**
- Consumes: 完成后的主题、组件 defaults/schema、模板与 CSS。
- Produces: Omnisend 安全正文片段和本地字体预览。

- [ ] **Step 1: 生成独立首图和六组件模板**

Run:

```bash
node build-email-template.v1.mjs compositions/seasonal-sale-hero.default.v1.json
node build-email-template.v1.mjs
```

Expected: 两次命令退出码 0，分别报告 1 个和 6 个组件。

- [ ] **Step 2: 静态验收最终产物**

检查：六个组件顺序正确、只有一个退订 token、根外层背景 `#FFFFFF`、600px 内容背景 `#FBFAF8`、首图下边距 32px、两处框架内联完成、无 `box-shadow`。

- [ ] **Step 3: 浏览器桌面验收**

打开 `http://127.0.0.1:4174/邮件html模版.local-preview.html`，确认：

- 内容最大宽度 600px，画布外白色。
- 首图底部留白清晰但不过度。
- 编辑式商品正文和主图不拥挤。
- 两张布料小图有白框与浅色右下阴影。
- 控制台无相关 error/warn。

- [ ] **Step 4: 浏览器 375px 验收**

将视口设为 375×812，确认邮件宽度与页面 scrollWidth 均为 375px、无横向溢出、框架与间距未破坏双列流式布局。

- [ ] **Step 5: 最终完整验证**

Run: `node --test seasonal-sale-hero-v1.test.mjs five-components-safe-email.test.mjs`

Expected: 0 failures；报告浏览器测量值和任何未覆盖的邮件客户端风险。
