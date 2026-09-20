# new FOOT One-Time Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Omnisend Saved Universal Layout `new FOOT` 一次性迁移为可独立维护的本地 HTML 页脚组件，并用该组件更新“邮件html模版”和现有 Omnisend 草稿。

**Architecture:** 远程 `new FOOT` 只提供本次迁移快照；本地模板、数据、设置和 Schema 在迁移后成为唯一运行源。拼接器继续把页脚作为第五个普通 HTML 组件渲染，最终 Campaign 只包含一个 Custom HTML 区块，不引用 Universal Layout。

**Tech Stack:** Node.js ESM、`node:test`、表格型邮件 HTML、JSON 组件契约、Omnisend Email Content API。

## Global Constraints

- 只迁移 Omnisend Universal Layout `new FOOT`，ID `68fccc3f9541e9f7ebc479eb`。
- 迁移完成后不读取、同步或引用 Omnisend Universal Layout。
- 初始迁移忠实保留 `/shorts`、`Reserived`、`mailto:`、社交链接和退订链接属性。
- 前四个组件不得发生内容变化。
- 整封邮件必须只有一个 `[[unsubscribe_link]]`。
- Campaign 必须保持 `draft`，`scheduledAt` 必须为 `null`；不得发送、测试发送或排期。
- 当前目录不是 Git 仓库，因此本计划不执行提交步骤。

---

### Task 1: 用失败测试固定 new FOOT 迁移契约

**Files:**
- Modify: `five-components-safe-email.test.mjs:89-106`
- Create: `页脚组件/品牌信息页脚/migration.source.v1.json`

**Interfaces:**
- Consumes: 当前 `new FOOT` 只读快照。
- Produces: 本地页脚输出必须满足的固定断言，以及一次性来源记录。

- [ ] **Step 1: 先添加精确迁移断言**

将页脚测试改为检查：

```js
assert.match(footer, /bgcolor="#652a0d"/i);
assert.match(footer, /padding:12px 24px/);
assert.match(footer, /href="https:\/\/www\.youtube\.com\/@freshinecurtains\/shorts"/);
assert.match(footer, /©2024 Freshine\. All Rights Reserived\./);
assert.match(
  footer,
  /href="\[\[unsubscribe_link\]\]"[^>]*data-translation-key="unsubscribe"[^>]*target="_blank"[^>]*>Unsubscribe<\/a>/,
);
assert.equal(footer.match(/\[\[unsubscribe_link\]\]/g)?.length ?? 0, 1);
assert.doesNotMatch(footer, /68fccc3f9541e9f7ebc479eb/);
```

并读取 `migration.source.v1.json`，断言 `sourceID`、`sourceName`、`sourceUpdatedAt` 和 `snapshotSha256` 为固定非空值。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `node --test five-components-safe-email.test.mjs`

Expected: 页脚测试因当前背景大小写、旧间距、缺少 `/shorts`、旧版权文案或缺少退订属性而失败；其他组件测试保持通过。

### Task 2: 将 new FOOT 快照迁移为本地组件契约

**Files:**
- Modify: `页脚组件/品牌信息页脚/component.template.v1.html`
- Modify: `页脚组件/品牌信息页脚/component.styles.v1.css`
- Modify: `页脚组件/品牌信息页脚/content.fixture.v1.json`
- Modify: `页脚组件/品牌信息页脚/content.schema.v1.json`
- Modify: `页脚组件/品牌信息页脚/settings.defaults.v1.json`
- Modify: `页脚组件/品牌信息页脚/settings.schema.v1.json`
- Create: `页脚组件/品牌信息页脚/migration.source.v1.json`

**Interfaces:**
- Consumes: Task 1 的失败断言。
- Produces: `renderComponent(instance) -> string` 可渲染的本地 `footer.warm` 合同。

- [ ] **Step 1: 迁移默认数据**

最小数据变化：

```json
{
  "footer.social.youtubeUrl": "https://www.youtube.com/@freshinecurtains/shorts",
  "footer.copyright": "©2024 Freshine. All Rights Reserived."
}
```

邮箱仍为 `mailto:support@freshinelife.com`，其余社交链接与 `new FOOT` 保持一致。

- [ ] **Step 2: 迁移设置字段**

在 defaults/schema 中加入并使用：

```json
{
  "color.background": "#652a0d",
  "color.text": "#FFFFFF",
  "color.link": "#0094EB",
  "space.sectionX": "24px",
  "space.sectionY": "12px",
  "space.block": "12px",
  "social.size": "24px"
}
```

- [ ] **Step 3: 迁移邮件安全 HTML 结构**

模板保持单根 `<table>`，使用 `padding:{{settings.space.sectionY}} {{settings.space.sectionX}}`；邮箱保持 `mailto:`；社交图标保持四枚 24px 图标。退订锚点精确使用：

```html
<a href="[[unsubscribe_link]]" data-translation-key="unsubscribe" target="_blank" style="color:{{settings.color.link}};text-decoration:none;">Unsubscribe</a>
```

- [ ] **Step 4: 写入一次性来源记录**

```json
{
  "schemaVersion": 1,
  "migrationMode": "one-time-import",
  "sourceName": "new FOOT",
  "sourceID": "68fccc3f9541e9f7ebc479eb",
  "sourceUpdatedAt": "2026-03-20T07:03:55.12Z",
  "snapshotSha256": "3ad37be6d08df643504014c1ab9fa7a218e8920e91099849270637d5f77a4d67",
  "runtimeDependency": false
}
```

`snapshotSha256` 是本次只读获取后，以 `jq -c` 规范化的完整 Universal Layout 对象（含末尾换行）计算所得。

- [ ] **Step 5: 运行页脚测试并确认 GREEN**

Run: `node --test five-components-safe-email.test.mjs`

Expected: 所有测试通过。

### Task 3: 重新拼接并验证前四组件未变化

**Files:**
- Regenerate: `邮件html模版.html`
- Regenerate: `邮件html模版.local-preview.html`
- Modify: `five-components-safe-email.test.mjs`

**Interfaces:**
- Consumes: 本地 `footer.warm` 组件。
- Produces: 五组件 Omnisend Custom HTML 片段和本地预览。

- [ ] **Step 1: 添加前四组件稳定性测试**

测试在构建前后分别抽取前四个 `<!-- 组件：... -->` 区段并计算 SHA-256；仅允许“品牌信息页脚”区段变化。

- [ ] **Step 2: 运行稳定性测试并确认当前基准可检测**

Run: `node --test five-components-safe-email.test.mjs`

Expected: 如果任何前四组件发生变化，测试明确列出组件名并失败。

- [ ] **Step 3: 运行拼接器**

Run: `node build-email-template.v1.mjs`

Expected: 输出 `components: 5`、`desktopWidth: 600`、`mobileTargetWidth: 375`、`status: static-safe`。

- [ ] **Step 4: 完整本地验证**

Run: `node --test five-components-safe-email.test.mjs`

Expected: 全部通过；整封邮件一个退订 token、五组件顺序正确、无 Universal Layout ID。

### Task 4: 更新 Omnisend 草稿并做双端视觉 QA

**Files:**
- Read: `邮件html模版.html`
- External draft only: Campaign `6a7554e6ed3aea11328593d5`

**Interfaces:**
- Consumes: Task 3 生成的完整 Custom HTML 和现有移动端适配 CSS。
- Produces: 仍为草稿的 Omnisend Campaign 预览。

- [ ] **Step 1: 更新前只读校验**

GET Campaign 和 Email Content，确认 Campaign ID、Content ID、`status: draft`、`scheduledAt: null`，并保存完整 `generalSettings` 和有效结构 ID。

- [ ] **Step 2: 完整 PUT Email Content**

保留 `generalSettings`、单一 section/row/column/htmlCode 的有效 ID；只替换 `htmlCode.body` 为新生成 HTML，并保留 `移动端适配样式.css` 作为 `htmlCode.style`（该文件当时位于 `公共样式/`，2026-09-20 整理时已移至 `docs/公共样式参考/`）。

- [ ] **Step 3: 服务端回读验证**

确认：

```text
status = draft
scheduledAt = null
sections = 1
blocks = 1
unsubscribe tokens = 1
YouTube = https://www.youtube.com/@freshinecurtains/shorts
Universal Layout ID absent
```

- [ ] **Step 4: Omnisend Preview & test 视觉 QA**

检查桌面 600px 和移动端 375px：页脚背景、文案、邮箱、四枚图标、版权、退订链接均完整，无横向裁切。只打开预览，不发送测试邮件。
