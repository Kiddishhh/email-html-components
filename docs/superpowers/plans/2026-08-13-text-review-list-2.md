# 双条文字评论组件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可独立渲染和预览的 `review.textList2` 双条文字评论组件，并登记到通用组件库，但不注册到 Campaign Skill，也不创建内容注入脚本。

**Architecture:** 组件继续使用项目现有的完整 `content/settings` 快照和单根 table 模板；固定星形通过一个 `asset://review-star` 本地资产槽重复渲染 15 次。拼接器增加可选的 settings Schema `pattern` 校验，只影响显式声明 pattern 的字段，以落实 `color.surface` 的 `#RRGGBB` 运行时约束。

**Tech Stack:** Node.js 20+、原生 `node:test`、HTML table/inline CSS、JSON V1 schemas、项目现有 `build-email-template.v1.mjs`。

## Global Constraints

- 保留已确认的 A“参考图忠实版”：总评分、两条纵向评论、两条 1px 分割线；无卡片、圆角、阴影、双栏、CTA 或链接。
- 桌面最大宽度固定 600px，约 375px 移动端保持 24px 左右留白并自然换行；不使用必要媒体查询。
- 顶部和每条评论都固定 5 颗绿色星形，共 15 颗；固定使用 `/Users/ww/Downloads/矢量 31.png` 的原始 PNG，不开放替换或改色。
- 可替换内容只能是 `summary.ratingText`、`summary.reviewCountText` 和 `review.1/2.author/date/title/body`；所有字段必填并执行 HTML 转义。
- `color.surface` 默认 `#FDFCFB`，只接受完整 `#RRGGBB`；其他颜色、字体、字号、行高和间距保持组件固定。
- 本阶段只更新通用组件库、拼接器和通用测试；不得修改 Campaign Skill、Campaign 区段配置、交互索引、注入脚本或默认六组件 composition。
- 最终 Omnisend HTML 不得保留 `asset://`、相对路径、`file://` 或 `data:` 图片；本地 `asset://review-star` 只用于预览/待上传源。
- 当前工作区已有组件目录迁移和多个未提交文件。任何编辑都必须基于当前工作副本窄范围追加；不得恢复、覆盖或顺带提交既有改动。
- 当前基线证据：`node --test tests/*.test.mjs` 为 91/91；`node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs` 为 valid。
- 提交前必须检查 `git diff --cached --name-only`。若无法把本任务 hunks 与既有未提交 hunks 精确隔离，跳过该提交并在交付说明中列出未提交文件；不得把既有改动混入本任务提交。

---

### Task 1: 可渲染组件核心与 Schema pattern 校验

**Files:**
- Create: `评论组件/双条文字评论/component.template.v1.html`
- Create: `评论组件/双条文字评论/component.styles.v1.css`
- Create: `评论组件/双条文字评论/content.schema.v1.json`
- Create: `评论组件/双条文字评论/content.fixture.v1.json`
- Create: `评论组件/双条文字评论/settings.schema.v1.json`
- Create: `评论组件/双条文字评论/settings.defaults.v1.json`
- Create: `评论组件/双条文字评论/assets/review-star.png`
- Modify: `build-email-template.v1.mjs:94-104`
- Modify: `tests/build-email-template.v1.test.mjs:1-5, after current final test`

**Interfaces:**
- Consumes: V1 component instance `{name, directory, componentKey, content, settings}` and `composition.assets['review-star']`.
- Produces: `review.textList2` with exact content keys `star.image.url`, `summary.ratingText`, `summary.reviewCountText`, `review.1.author`, `review.1.date`, `review.1.title`, `review.1.body`, `review.2.author`, `review.2.date`, `review.2.title`, `review.2.body`.
- Produces: `validateSettings()` support for an optional string `definition.pattern`; invalid regex reports a Schema error, nonmatching value reports the specific settings key.

- [ ] **Step 1: Add focused failing render and validation tests**

Extend the imports at the top of `tests/build-email-template.v1.test.mjs`:

```js
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
```

Keep the existing imports and append this helper and three tests after the current final test:

```js
const textReviewDirectory = `${root}/评论组件/双条文字评论`;

function makeTextReviewComposition(name, {
  directory = textReviewDirectory,
  background = '#FDFCFB',
  content = {}
} = {}) {
  const textReviewFixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const textReviewDefaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = `/private/tmp/${name}.html`;
  const previewOutput = `/private/tmp/${name}.local-preview.html`;
  const path = `/private/tmp/${name}.composition.json`;
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FDFCFB',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    assets: {
      'review-star': {
        path: '评论组件/双条文字评论/assets/review-star.png',
        name: 'review-star.png'
      }
    },
    components: [{
      name: '双条文字评论',
      directory,
      componentKey: 'review.textList2',
      content: { ...textReviewFixture.values, ...content },
      settings: { ...textReviewDefaults.values, 'color.surface': background }
    }]
  }, null, 2));
  return { output, previewOutput, path };
}

test('the text review list renders fifteen fixed decorative stars and escaped editable copy', () => {
  const { previewOutput, path } = makeTextReviewComposition('text-review-list-2-render', {
    background: '#EAF8F3',
    content: { 'review.1.author': 'A & <B>' }
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /freshine-review-list-2/);
  assert.equal((html.match(/class="freshine-review-summary-star"/g) ?? []).length, 5);
  assert.equal((html.match(/class="freshine-review-item-star"/g) ?? []).length, 10);
  assert.equal((html.match(/alt=""/g) ?? []).length, 15);
  assert.match(html, /A &amp; &lt;B&gt;/);
  assert.match(html, /4\.8 \/ 5[\s\S]*200\+ reviews/);
  assert.match(html, /Exactly What Our Living Room Needed/);
  assert.match(html, /Quiet Luxury, Really Well Made/);
  assert.match(html, /background-color:#EAF8F3/);
  assert.match(html, /review-star\.png/);
  assert.doesNotMatch(html, /<a\b|\bCTA\b/i);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

test('the text review list rejects a surface color that is not full #RRGGBB', () => {
  const { path } = makeTextReviewComposition('text-review-list-2-invalid-surface', { background: '#FFF' });
  const result = run(path, '--preview-local-assets');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /review\.textList2: settings\.color\.surface does not match pattern/);
});

test('the assembler reports an invalid settings Schema pattern separately from a bad value', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'freshine-review-pattern-'));
  const tempDirectory = join(tempRoot, '双条文字评论');
  cpSync(textReviewDirectory, tempDirectory, { recursive: true });
  const schemaPath = join(tempDirectory, 'settings.schema.v1.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  schema.properties['color.surface'].pattern = '[';
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  const { path } = makeTextReviewComposition('text-review-list-2-invalid-pattern', { directory: tempDirectory });
  const result = run(path, '--preview-local-assets');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /review\.textList2: settings schema color\.surface has invalid pattern/);
});
```

- [ ] **Step 2: Run the new focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern='text review list|settings Schema pattern' tests/build-email-template.v1.test.mjs
```

Expected: FAIL because `评论组件/双条文字评论/content.fixture.v1.json` does not exist. If the failure is a syntax/import error, fix the test before proceeding.

- [ ] **Step 3: Copy the approved fixed star asset**

Create `评论组件/双条文字评论/assets/` with `apply_patch` for the parent component files, then reuse the user-provided binary asset:

```bash
mkdir -p '评论组件/双条文字评论/assets'
cp '/Users/ww/Downloads/矢量 31.png' '评论组件/双条文字评论/assets/review-star.png'
sips -g pixelWidth -g pixelHeight -g format -g hasAlpha '评论组件/双条文字评论/assets/review-star.png'
```

Expected metadata: PNG, 512×472, alpha present. Do not resize, recolor, crop, optimize, or overwrite the source file.

- [ ] **Step 4: Create the exact content and settings contracts**

Create `content.schema.v1.json`:

```json
{
  "schemaVersion": 1,
  "componentKey": "review.textList2",
  "injectionMode": "full-component-rerender",
  "properties": {
    "star.image.url": { "type": "url", "role": "fixed-image-source", "protocol": "https", "required": true, "editable": false, "skillPrompt": false },
    "summary.ratingText": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "summary.reviewCountText": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.1.author": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.1.date": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.1.title": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.1.body": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.2.author": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.2.date": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.2.title": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
    "review.2.body": { "type": "text", "required": true, "editable": true, "skillPrompt": false }
  },
  "additionalProperties": false
}
```

Create `content.fixture.v1.json`:

```json
{
  "schemaVersion": 1,
  "componentKey": "review.textList2",
  "fixture": "default-two-review-demo",
  "values": {
    "star.image.url": "asset://review-star",
    "summary.ratingText": "4.8 / 5",
    "summary.reviewCountText": "200+ reviews",
    "review.1.author": "Sarah M",
    "review.1.date": "Aug 2, 2026",
    "review.1.title": "Exactly What Our Living Room Needed",
    "review.1.body": "The linen blend drapes beautifully and the custom sizing was spot on. Customer service walked me through the entire measurement process — couldn't be happier with the result.",
    "review.2.author": "James K",
    "review.2.date": "Jul 28, 2026",
    "review.2.title": "Quiet Luxury, Really Well Made",
    "review.2.body": "Ordered pinch-pleat panels for our bedroom bay window. The fabric has this beautiful natural texture and the light filtering is perfect. Worth every penny."
  },
  "localReferenceAssets": {
    "review-star": "assets/review-star.png"
  }
}
```

Create `settings.schema.v1.json`:

```json
{
  "schemaVersion": 1,
  "componentKey": "review.textList2",
  "themeMode": "component-owned-styles",
  "snapshotPolicy": "full-settings-snapshot",
  "properties": {
    "color.surface": { "type": "string", "default": "#FDFCFB", "pattern": "^#[0-9A-Fa-f]{6}$", "themeable": true, "skillPrompt": true },
    "color.primaryText": { "type": "string", "default": "#252321", "themeable": false, "skillPrompt": false },
    "color.secondaryText": { "type": "string", "default": "#89756F", "themeable": false, "skillPrompt": false },
    "color.divider": { "type": "string", "default": "#DEDAD6", "themeable": false, "skillPrompt": false },
    "font.heading": { "type": "string", "default": "Lora, Georgia, Times New Roman, serif", "themeable": false, "skillPrompt": false },
    "font.body": { "type": "string", "default": "Montserrat, Arial, Helvetica, sans-serif", "themeable": false, "skillPrompt": false },
    "content.maxWidth": { "type": "string", "default": "600px", "themeable": false, "skillPrompt": false },
    "spacing.horizontal": { "type": "string", "default": "24px", "themeable": false, "skillPrompt": false }
  },
  "additionalProperties": false
}
```

Create `settings.defaults.v1.json`:

```json
{
  "schemaVersion": 1,
  "componentKey": "review.textList2",
  "values": {
    "color.surface": "#FDFCFB",
    "color.primaryText": "#252321",
    "color.secondaryText": "#89756F",
    "color.divider": "#DEDAD6",
    "font.heading": "Lora, Georgia, Times New Roman, serif",
    "font.body": "Montserrat, Arial, Helvetica, sans-serif",
    "content.maxWidth": "600px",
    "spacing.horizontal": "24px"
  }
}
```

- [ ] **Step 5: Create the email-safe table template and CSS source**

Create one root table with these exact classes and rows:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{{settings.color.surface}}" style="width:100%;border-collapse:collapse;background-color:{{settings.color.surface}};">
  <tr><td align="center" valign="top" bgcolor="{{settings.color.surface}}" style="background-color:{{settings.color.surface}};text-align:center;vertical-align:top;">
    <table class="freshine-component freshine-review-list-2" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="{{settings.color.surface}}" style="width:100%;max-width:{{settings.content.maxWidth}};border-collapse:collapse;margin:0 auto;background-color:{{settings.color.surface}};">
      <tr><td align="center" style="padding:48px {{settings.spacing.horizontal}} 27px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;"><tr>
          <td style="padding:0 1.5px;"><img class="freshine-review-summary-star" src="{{content.star.image.url}}" alt="" width="17" border="0" style="display:block;width:17px;height:auto;border:0;"></td>
          <td style="padding:0 1.5px;"><img class="freshine-review-summary-star" src="{{content.star.image.url}}" alt="" width="17" border="0" style="display:block;width:17px;height:auto;border:0;"></td>
          <td style="padding:0 1.5px;"><img class="freshine-review-summary-star" src="{{content.star.image.url}}" alt="" width="17" border="0" style="display:block;width:17px;height:auto;border:0;"></td>
          <td style="padding:0 1.5px;"><img class="freshine-review-summary-star" src="{{content.star.image.url}}" alt="" width="17" border="0" style="display:block;width:17px;height:auto;border:0;"></td>
          <td style="padding:0 1.5px;"><img class="freshine-review-summary-star" src="{{content.star.image.url}}" alt="" width="17" border="0" style="display:block;width:17px;height:auto;border:0;"></td>
        </tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td height="10" style="height:10px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <span class="freshine-review-summary-copy" style="display:inline;color:{{settings.color.primaryText}};font-family:{{settings.font.body}};font-size:17px;font-weight:700;line-height:23px;text-align:center;"><!-- FRESHINE_SLOT_START:summary.ratingText --><span data-freshine-slot="summary.ratingText">{{content.summary.ratingText}}</span><!-- FRESHINE_SLOT_END:summary.ratingText --> · <!-- FRESHINE_SLOT_START:summary.reviewCountText --><span data-freshine-slot="summary.reviewCountText">{{content.summary.reviewCountText}}</span><!-- FRESHINE_SLOT_END:summary.reviewCountText --></span>
      </td></tr>
      <tr><td style="padding:0 {{settings.spacing.horizontal}};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td height="1" bgcolor="{{settings.color.divider}}" style="height:1px;background-color:{{settings.color.divider}};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
      <tr><td align="left" style="padding:20px {{settings.spacing.horizontal}} 18px;text-align:left;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
          <td width="75" valign="middle" style="width:75px;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
          </tr></table></td>
          <td width="9" style="width:9px;font-size:0;line-height:0;">&nbsp;</td>
          <td valign="middle" style="color:{{settings.color.secondaryText}};font-family:{{settings.font.body}};font-size:14px;font-weight:400;line-height:20px;vertical-align:middle;"><!-- FRESHINE_SLOT_START:review.1.author --><span data-freshine-slot="review.1.author">{{content.review.1.author}}</span><!-- FRESHINE_SLOT_END:review.1.author --> · <!-- FRESHINE_SLOT_START:review.1.date --><span data-freshine-slot="review.1.date">{{content.review.1.date}}</span><!-- FRESHINE_SLOT_END:review.1.date --></td>
        </tr></table>
        <!-- FRESHINE_SLOT_START:review.1.title --><span class="freshine-review-title" data-freshine-slot="review.1.title" style="display:block;padding-top:12px;color:{{settings.color.primaryText}};font-family:{{settings.font.heading}};font-size:18px;font-weight:400;line-height:25px;text-align:left;">{{content.review.1.title}}</span><!-- FRESHINE_SLOT_END:review.1.title -->
        <!-- FRESHINE_SLOT_START:review.1.body --><span class="freshine-review-body" data-freshine-slot="review.1.body" style="display:block;padding-top:12px;color:{{settings.color.secondaryText}};font-family:{{settings.font.body}};font-size:15px;font-weight:400;line-height:22px;text-align:left;">{{content.review.1.body}}</span><!-- FRESHINE_SLOT_END:review.1.body -->
      </td></tr>
      <tr><td style="padding:0 {{settings.spacing.horizontal}};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr><td height="1" bgcolor="{{settings.color.divider}}" style="height:1px;background-color:{{settings.color.divider}};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
      <tr><td align="left" style="padding:20px {{settings.spacing.horizontal}} 38px;text-align:left;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>
          <td width="75" valign="middle" style="width:75px;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
            <td style="padding:0 1px;"><img class="freshine-review-item-star" src="{{content.star.image.url}}" alt="" width="13" border="0" style="display:block;width:13px;height:auto;border:0;"></td>
          </tr></table></td>
          <td width="9" style="width:9px;font-size:0;line-height:0;">&nbsp;</td>
          <td valign="middle" style="color:{{settings.color.secondaryText}};font-family:{{settings.font.body}};font-size:14px;font-weight:400;line-height:20px;vertical-align:middle;"><!-- FRESHINE_SLOT_START:review.2.author --><span data-freshine-slot="review.2.author">{{content.review.2.author}}</span><!-- FRESHINE_SLOT_END:review.2.author --> · <!-- FRESHINE_SLOT_START:review.2.date --><span data-freshine-slot="review.2.date">{{content.review.2.date}}</span><!-- FRESHINE_SLOT_END:review.2.date --></td>
        </tr></table>
        <!-- FRESHINE_SLOT_START:review.2.title --><span class="freshine-review-title" data-freshine-slot="review.2.title" style="display:block;padding-top:12px;color:{{settings.color.primaryText}};font-family:{{settings.font.heading}};font-size:18px;font-weight:400;line-height:25px;text-align:left;">{{content.review.2.title}}</span><!-- FRESHINE_SLOT_END:review.2.title -->
        <!-- FRESHINE_SLOT_START:review.2.body --><span class="freshine-review-body" data-freshine-slot="review.2.body" style="display:block;padding-top:12px;color:{{settings.color.secondaryText}};font-family:{{settings.font.body}};font-size:15px;font-weight:400;line-height:22px;text-align:left;">{{content.review.2.body}}</span><!-- FRESHINE_SLOT_END:review.2.body -->
      </td></tr>
    </table>
  </td></tr>
</table>
```

Create `component.styles.v1.css` with simple selectors accepted by the current CSS inliner:

```css
/* review.textList2 component style source. */
.freshine-component { width:100%; border-collapse:collapse; }
.freshine-review-list-2 { width:100%; border-collapse:collapse; }
.freshine-review-summary-star { display:block; width:17px; height:auto; border:0; outline:none; }
.freshine-review-item-star { display:block; width:13px; height:auto; border:0; outline:none; }
.freshine-review-title { display:block; }
.freshine-review-body { display:block; }
```

- [ ] **Step 6: Add optional Schema pattern enforcement to the assembler**

Change the settings loop in `validateSettings()` to preserve the existing safety scan and add this exact behavior:

```js
for (const [key, definition] of Object.entries(schema.properties)) {
  const value = values[key];
  if (typeof value !== 'string') throw new Error(`${componentKey}: settings.${key} must be text`);
  if (/["'<> {};]/.test(value.replaceAll(' ', ''))) throw new Error(`${componentKey}: settings.${key} contains unsafe characters`);
  if (definition.pattern !== undefined) {
    if (typeof definition.pattern !== 'string' || definition.pattern.length === 0) {
      throw new Error(`${componentKey}: settings schema ${key} has invalid pattern`);
    }
    let matcher;
    try {
      matcher = new RegExp(definition.pattern);
    } catch {
      throw new Error(`${componentKey}: settings schema ${key} has invalid pattern`);
    }
    if (!matcher.test(value)) throw new Error(`${componentKey}: settings.${key} does not match pattern`);
  }
}
```

Do not add automatic color normalization and do not apply a global color rule to schemas that omit `pattern`.

- [ ] **Step 7: Run the focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern='text review list|settings Schema pattern' tests/build-email-template.v1.test.mjs
```

Expected: 3 matching tests PASS. Also run the pre-existing assembler tests to confirm optional pattern support is backward compatible:

```bash
node --test tests/build-email-template.v1.test.mjs
```

Expected at this point: current 27 baseline tests plus 3 new tests PASS; no existing test fails.

- [ ] **Step 8: Commit only if scope can be isolated**

New component files are safe to stage independently:

```bash
git add -- '评论组件/双条文字评论/component.template.v1.html' '评论组件/双条文字评论/component.styles.v1.css' '评论组件/双条文字评论/content.schema.v1.json' '评论组件/双条文字评论/content.fixture.v1.json' '评论组件/双条文字评论/settings.schema.v1.json' '评论组件/双条文字评论/settings.defaults.v1.json' '评论组件/双条文字评论/assets/review-star.png'
git diff --cached --name-only
```

Expected: only the seven listed new paths. Commit those paths:

```bash
git commit -m "feat: add text review list component core"
```

`build-email-template.v1.mjs` and `tests/build-email-template.v1.test.mjs` already contain pre-existing working-tree changes. Do not stage either whole file. Leave their new hunks unstaged unless exact hunk isolation is proven from the index diff.

---

### Task 2: 真实效果演示、通用注册与维护文档

**Files:**
- Create: `评论组件/双条文字评论/效果演示.html`
- Create: `评论组件/双条文字评论/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `组件清单.json` after the current final entry
- Modify: `组件索引.md` under `## 评论组件`
- Modify: `README.md` after the six Campaign section explanation
- Modify: `tests/build-email-template.v1.test.mjs` after Task 1 tests
- Create temporarily: `/private/tmp/text-review-list-2.demo.composition.json`

**Interfaces:**
- Consumes: Task 1 fixture/defaults/template/CSS and `assets/review-star.png`.
- Produces: component library registry entry and real component-local `效果演示.html`.
- Preserves: Campaign Skill structure and interactions unchanged; `review.textList2` is registered generally but absent from all `candidateComponentKeys`.

- [ ] **Step 1: Add a failing registration/demo contract test**

Append:

```js
test('the two-review list is registered generally without becoming a Campaign Skill candidate', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'review.textList2');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].中文名称, '双条文字评论');
  assert.equal(entries[0].分类, '评论组件');
  assert.equal(entries[0].输出宽度, 600);

  const directory = `${root}/评论组件/双条文字评论`;
  const schema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));
  const candidateKeys = structure.slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys);

  assert.deepEqual(Object.keys(fixture.values).sort(), Object.keys(schema.properties).sort());
  assert.deepEqual(Object.keys(defaults.values).sort(), Object.keys(settingsSchema.properties).sort());
  assert.equal(fixture.values['star.image.url'], 'asset://review-star');
  assert.deepEqual(fixture.localReferenceAssets, { 'review-star': 'assets/review-star.png' });
  assert.equal(settingsSchema.properties['color.surface'].pattern, '^#[0-9A-Fa-f]{6}$');
  assert.equal((template.match(/content\.star\.image\.url/g) ?? []).length, 15);
  assert.equal((demo.match(/\.\/assets\/review-star\.png/g) ?? []).length, 15);
  assert.doesNotMatch(template, /<a\b|href=|cta/i);
  assert.doesNotMatch(demo, /\{\{(?:content|settings)\./);
  assert.match(management, /尚未加入.*Campaign Skill/s);
  assert.equal(candidateKeys.includes('review.textList2'), false);
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'review.textList2'), false);
});
```

- [ ] **Step 2: Run the registration test and verify RED**

Run:

```bash
node --test --test-name-pattern='registered generally' tests/build-email-template.v1.test.mjs
```

Expected: FAIL because the registry entry, management doc, and effect demo do not exist.

- [ ] **Step 3: Generate the real effect demo from the component source**

Create `/private/tmp/text-review-list-2.demo.composition.json` with the same complete fixture/default values from Task 1 and this structure:

```json
{
  "schemaVersion": 1,
  "canvas": {
    "backgroundColor": "#FDFCFB",
    "outerBackgroundColor": "#FFFFFF",
    "contentWidth": 600,
    "mobileTargetWidth": 375,
    "verticalPadding": 0
  },
  "output": "/private/tmp/text-review-list-2.static-safe.html",
  "previewOutput": "评论组件/双条文字评论/效果演示.html",
  "assets": {
    "review-star": {
      "path": "评论组件/双条文字评论/assets/review-star.png",
      "name": "review-star.png"
    }
  },
  "components": [{
    "name": "双条文字评论",
    "directory": "评论组件/双条文字评论",
    "componentKey": "review.textList2",
    "content": {
      "star.image.url": "asset://review-star",
      "summary.ratingText": "4.8 / 5",
      "summary.reviewCountText": "200+ reviews",
      "review.1.author": "Sarah M",
      "review.1.date": "Aug 2, 2026",
      "review.1.title": "Exactly What Our Living Room Needed",
      "review.1.body": "The linen blend drapes beautifully and the custom sizing was spot on. Customer service walked me through the entire measurement process — couldn't be happier with the result.",
      "review.2.author": "James K",
      "review.2.date": "Jul 28, 2026",
      "review.2.title": "Quiet Luxury, Really Well Made",
      "review.2.body": "Ordered pinch-pleat panels for our bedroom bay window. The fabric has this beautiful natural texture and the light filtering is perfect. Worth every penny."
    },
    "settings": {
      "color.surface": "#FDFCFB",
      "color.primaryText": "#252321",
      "color.secondaryText": "#89756F",
      "color.divider": "#DEDAD6",
      "font.heading": "Lora, Georgia, Times New Roman, serif",
      "font.body": "Montserrat, Arial, Helvetica, sans-serif",
      "content.maxWidth": "600px",
      "spacing.horizontal": "24px"
    }
  }]
}
```

Run:

```bash
node build-email-template.v1.mjs /private/tmp/text-review-list-2.demo.composition.json --preview-local-assets
```

Expected: `评论组件/双条文字评论/效果演示.html` is created, contains `assets/review-star.png` exactly 15 times, contains no unresolved placeholders, and remains a browser document rather than an Omnisend fragment.

- [ ] **Step 4: Write the Chinese management document**

`COMPONENT_MANAGEMENT.zh-CN.v1.md` must state all of the following explicitly:

```markdown
# 双条文字评论组件管理说明（V1）

- Component Key：`review.textList2`
- 当前状态：已登记到通用组件库，尚未加入 Campaign Skill。

## 用途与固定结构

组件展示顶部总评分和固定两条文字评论。每处固定五颗绿色星形，共十五颗；无链接、CTA、卡片、双栏或正文截断。

## 可替换内容

顶部评分与评论数量独立替换；两条评论的作者、日期、标题和正文分别替换。所有值是必填纯文本并由拼接器转义。

## 背景设置

`color.surface` 默认 `#FDFCFB`，只接受完整 `#RRGGBB`。深色值不会自动改变主文字、次文字或分割线，必须用桌面端和移动端预览检查可读性。

## 固定星形资产

`assets/review-star.png` 来自用户确认的 512×472 透明 PNG，不允许替换、改色、裁切或按评分数增减。本地 fixture 使用 `asset://review-star`；正式 Omnisend HTML 前必须替换为公开 HTTPS 地址。

## 响应式与维护

桌面最大 600px、左右 24px；约 375px 移动端保持单列并自然换行。修改结构或字段时必须同步模板、CSS、schemas、fixture/defaults、效果演示、注册表、索引、README 和测试。

## Skill 边界

本阶段没有 Campaign 区段、交互索引或内容注入脚本。后续只有在另行确认数据来源、映射、失败处理和完成卡片后才注册到 Skill。

## Omnisend 验收边界

本地静态与浏览器检查只表示符合静态规范；正式使用前仍需 Omnisend Desktop/Mobile/Dark Mode 预览及 Gmail、Outlook、Apple Mail 测试邮件。
```

- [ ] **Step 5: Register only in the general component library**

Append this unique object to `组件清单.json` without changing the preceding entries:

```json
{
  "中文名称": "双条文字评论",
  "分类": "评论组件",
  "componentKey": "review.textList2",
  "默认主题": "reference-faithful",
  "默认变体": "two-static-reviews",
  "fixedTheme": false,
  "输出宽度": 600,
  "路径": {
    "组件模板": "评论组件/双条文字评论/component.template.v1.html",
    "内容契约": "评论组件/双条文字评论/content.schema.v1.json",
    "设置契约": "评论组件/双条文字评论/settings.schema.v1.json",
    "默认测试数据": "评论组件/双条文字评论/content.fixture.v1.json",
    "默认设置": "评论组件/双条文字评论/settings.defaults.v1.json",
    "中文管理说明": "评论组件/双条文字评论/COMPONENT_MANAGEMENT.zh-CN.v1.md",
    "组件样式": "评论组件/双条文字评论/component.styles.v1.css"
  },
  "移动端断点": 375,
  "规范版本": 1
}
```

Under `组件索引.md` → `## 评论组件`, append:

```markdown
- 双条文字评论（`review.textList2`）：[管理说明](评论组件/双条文字评论/COMPONENT_MANAGEMENT.zh-CN.v1.md) · [组件模板](评论组件/双条文字评论/component.template.v1.html) · [效果演示](评论组件/双条文字评论/效果演示.html)
```

After the Campaign candidate explanation in `README.md`, add:

```markdown
通用组件库另包含双条文字评论（`review.textList2`，`评论组件/双条文字评论/`）。它目前只提供独立模板和真实效果演示，尚未加入 Campaign Skill，也没有内容注入脚本。
```

Do not add the component to the six Campaign rows or any Skill reference.

- [ ] **Step 6: Run registration, render, and validator checks**

Run:

```bash
node --test --test-name-pattern='text review list|settings Schema pattern|registered generally' tests/build-email-template.v1.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

Expected: 4 matching review tests PASS; validator returns `status: valid` and its six slot candidate arrays are byte-for-byte unchanged from the baseline.

- [ ] **Step 7: Commit only isolated new documents if safe**

Stage only the two new component-local files and confirm scope:

```bash
git add -- '评论组件/双条文字评论/效果演示.html' '评论组件/双条文字评论/COMPONENT_MANAGEMENT.zh-CN.v1.md'
git diff --cached --name-only
```

Expected: only those two paths. Commit:

```bash
git commit -m "docs: add text review component demo"
```

`组件清单.json`、`组件索引.md`、`README.md` 和 the test file already contain pre-existing changes. Do not stage those whole files unless exact hunk isolation is proven.

---

### Task 3: 浏览器视觉验收与全量回归

**Files:**
- Verify: `评论组件/双条文字评论/效果演示.html`
- Verify: `评论组件/双条文字评论/component.template.v1.html`
- Verify: `评论组件/双条文字评论/component.styles.v1.css`
- Verify: all files changed by Tasks 1–2

**Interfaces:**
- Consumes: the real effect demo generated in Task 2.
- Produces: verified 600px/375px visual evidence and a passing static/test baseline; no new production file is required.

- [ ] **Step 1: Load the required browser testing skills and serve the real demo over HTTP**

Before browser operations, read `browser:control-in-app-browser` and `build-web-apps:frontend-testing-debugging`. Start a local HTTP server in a persistent PTY:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory '/Users/ww/Desktop/邮件营销运营/邮件html组件'
```

Open this exact URL in the in-app browser:

```text
http://127.0.0.1:4173/%E8%AF%84%E8%AE%BA%E7%BB%84%E4%BB%B6/%E5%8F%8C%E6%9D%A1%E6%96%87%E5%AD%97%E8%AF%84%E8%AE%BA/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html
```

- [ ] **Step 2: Verify the 600px desktop rendering**

At a viewport wide enough to show the 600px canvas, capture a screenshot and verify:

- centered total stars, exactly five, visually about 17px wide each;
- `4.8 / 5 · 200+ reviews` centered beneath the stars;
- two 1px dividers;
- two vertically stacked reviews with five smaller stars each;
- authors/dates use secondary text, titles use the serif heading face, body copy uses the sans-serif body face;
- background is `#FDFCFB`, horizontal inset is 24px, no cards/borders/shadows/links/CTA;
- all default copy matches the fixture and no content is clipped.

- [ ] **Step 3: Verify the 375px mobile rendering**

Set the viewport to approximately 375px wide, capture a screenshot, and verify:

- no horizontal scrolling or overflow;
- content width is approximately 327px after 24px left/right padding;
- author/date may wrap only when needed; title and body wrap naturally without truncation;
- all 15 stars remain visible and the two reviews stay single-column;
- vertical rhythm remains close to the approved A mockup.

If any check fails, edit only the new component template/CSS, regenerate `效果演示.html` from the same temporary composition, and rerun the four focused review tests before repeating screenshots.

- [ ] **Step 4: Run final static and full regression verification**

Run:

```bash
node --test tests/*.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs; do node --check "$file" || exit 1; done
git diff --check
```

Expected from the current 91-test baseline: at least 95 tests PASS, zero failures; validator remains valid with unchanged six Campaign slots; all syntax checks and `git diff --check` pass.

- [ ] **Step 5: Audit scope before handoff**

Run:

```bash
git status --short
git diff --name-only
git diff -- 'skills/build-omnisend-campaign-draft/SKILL.md' 'skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json' 'skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json' 'skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md' 'skills/build-omnisend-campaign-draft/scripts'
```

The final diff command may show pre-existing changes already present before this task, but must show no new `review.textList2` registration, field mapping, or injection-script logic in those Skill paths. Report separately:

- new component-local files;
- narrow shared-file additions made by this task;
- pre-existing unrelated dirty files left untouched;
- focused/full test counts;
- desktop/mobile browser QA result;
- Omnisend live import/test-email status as not performed.
