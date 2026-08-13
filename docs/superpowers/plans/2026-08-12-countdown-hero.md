# 倒计时头图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可编辑、邮件安全的 600px “倒计时头图”组件，并登记为独立组件，不改变既有六组件 Campaign 组合。

**Architecture:** 新组件位于 `头图/倒计时头图`，以完整 `content` 与 `settings` 快照为输入。模板使用单根 table、内联 CSS 和现有拼接器；默认演示仅以工作区内登记背景资源作本地预览，最终构建仍要求公开 HTTPS 图片。

**Tech Stack:** Node.js 内置测试框架、JSON Schema 快照、邮件 table HTML、受限内联 CSS、现有 `build-email-template.v1.mjs`。

## Global Constraints

- Component Key 固定为 `hero.countdownOverlay`，中文名称为“倒计时头图”。
- 组件画布为 600px，移动端目标为 375px；不得改动既有六组件 Campaign 的顺序或成员。
- 不使用 JavaScript、外部 CSS、Flex、Grid、绝对定位、`<style>`、`<div>` 或图片内置文案。
- 顶部导航默认展示 `Unlock $100 Off Your First Order At Freshine`、`SIGN UP`，链接为 `https://freshinelife.com/`，三项可编辑。
- 倒计时默认 `Only 3 Days Left`，是可编辑静态文本；补充说明默认 `UP TO 65% OFF | Free Gift On $259+ | Free Shipping`；CTA 默认 `SHOP NOW`。
- 背景、Logo 与装饰分隔图都是独立图片字段；本地 `asset://` 仅可用于预览，最终 Omnisend 输出只能接受公开 HTTPS URL。

---

### Task 1: 建立组件契约的失败测试

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `组件清单.json`
- Create: `头图/倒计时头图/*`（由后续任务完成）

**Interfaces:**
- Consumes: 注册表条目中的 `componentKey`、`路径` 和组件目录中的完整契约文件。
- Produces: 约束 `hero.countdownOverlay` 的测试；之后的模板和登记实现必须满足其文件路径和内容字段要求。

- [x] **Step 1: 写入失败测试**

在 `tests/build-email-template.v1.test.mjs` 的 registry 测试之后添加：

```js
test('the countdown hero is an independently registered 600px component with editable navigation and countdown copy', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entry = registry.find(({ componentKey }) => componentKey === 'hero.countdownOverlay');

  assert.ok(entry, 'countdown hero must be registered');
  assert.equal(entry.中文名称, '倒计时头图');
  assert.equal(entry.输出宽度, 600);
  const directory = `${root}/${entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/u, '')}`;
  const content = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));

  assert.equal(content.componentKey, 'hero.countdownOverlay');
  assert.equal(fixture.values['navigation.url'], 'https://freshinelife.com/');
  assert.equal(fixture.values['countdown.title'], 'Only 3 Days Left');
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tests/build-email-template.v1.test.mjs`

Expected: FAIL，错误信息包含 `countdown hero must be registered`。

- [x] **Step 3: 保持既有 Campaign 组合不变**

将原“组件清单恰有六项”的测试改为断言前六个既有 Campaign 组件保持原顺序，并单独断言新增 `hero.countdownOverlay`。`campaignComponentKeys` 和 `hero-grid-review-gifts-location.default.v1.json` 的六项 Campaign 断言保持不变；新组件仅登记到组件库。

### Task 2: 建立倒计时头图的完整快照与邮件模板

**Files:**
- Create: `头图/倒计时头图/component.template.v1.html`
- Create: `头图/倒计时头图/component.styles.v1.css`
- Create: `头图/倒计时头图/content.schema.v1.json`
- Create: `头图/倒计时头图/settings.schema.v1.json`
- Create: `头图/倒计时头图/content.fixture.v1.json`
- Create: `头图/倒计时头图/settings.defaults.v1.json`

**Interfaces:**
- Consumes: `build-email-template.v1.mjs` 的 `content` URL/文本校验、`settings` 安全字符校验和 CSS 属性白名单。
- Produces: 可由 builder 以 `{ name, directory, componentKey, content, settings }` 完整实例渲染的 `hero.countdownOverlay`。

- [x] **Step 1: 定义完整内容 Schema**

`content.schema.v1.json` 的 `properties` 必须包含并只包含：

```js
[
  'navigation.text', 'navigation.linkText', 'navigation.url',
  'hero.backgroundImage.url', 'hero.backgroundImage.alt',
  'brand.logo.url', 'brand.logo.alt', 'brand.clickUrl',
  'decoration.dividerImage.url', 'decoration.dividerImage.alt',
  'countdown.title', 'hero.subtitle',
  'hero.cta.text', 'hero.cta.url'
]
```

将 `navigation.url`、`hero.backgroundImage.url`、`brand.logo.url`、`brand.clickUrl`、`decoration.dividerImage.url`、`hero.cta.url` 标为 `type: "url"`；背景字段带 `role: "background-image-source"`，Logo 与分隔图带 `role: "image-source"`，链接字段带 `role: "link-target"`。所有字段 `required: true`；Logo 与分隔图为组件固定注入资源，不新增主动收集问题。

- [x] **Step 2: 定义完整设置 Schema 与默认值**

`settings.defaults.v1.json` 与 `settings.schema.v1.json` 使用同一组完整键：

```js
{
  'color.navigationLeft': '#A79689',
  'color.navigationRight': '#652A0D',
  'color.navigationText': '#FFFFFF',
  'color.heroFallback': '#E9E4DC',
  'color.panelFallback': '#F4F1EC',
  'color.panelTransparent': 'rgba(247, 244, 239, 0.88)',
  'color.heading': '#1E1D1B',
  'color.body': '#2B2825',
  'color.theme': '#9D1D20',
  'color.themeText': '#FFFFFF',
  'font.heading': 'Lora, Georgia, Times New Roman, serif',
  'font.body': 'Montserrat, Arial, Helvetica, sans-serif',
  'font.action': 'Montserrat, Arial, Helvetica, sans-serif',
  'background.position': 'center center',
  'content.maxWidth': '600px',
  'panel.maxWidth': '444px',
  'panel.padding': '55px 28px 55px',
  'brand.logoWidth': '120px',
  'decoration.dividerWidth': '200px',
  'cta.maxWidth': '200px',
  'cta.height': '43px',
  'radius.button': '0px'
}
```

所有 default 必须和 defaults values 一致；`color.navigationLeft`、`color.navigationRight` 与 `color.theme` 为 `skillPrompt: true`，其它样式字段为 `false`。

- [x] **Step 3: 写入最小邮件安全模板与 CSS 维护源**

模板以 `<table class="freshine-component freshine-countdown-overlay-hero" role="presentation" width="100%">` 为唯一根节点，并顺序渲染：双列导航、带 `background` 属性和内联背景图的主视觉、居中面板、`brand.logo.url`、`decoration.dividerImage.url`、`countdown.title`、`hero.subtitle` 和可点击 CTA。CTA 必须是 `https:` 链接中的 HTML 文本按钮。主视觉 desktop `height="751"`，CSS 内联保留 `height:125vw;max-height:751px;min-height:600px`，面板最大宽度引用 `panel.maxWidth`。

`component.styles.v1.css` 只记录和模板相同的 class 规则，且只使用 builder 已允许的属性：`display`、`width`、`height`、`max-width`、`max-height`、`min-height`、`background-color`、`background-image`、`background-position`、`background-repeat`、`background-size`、`color`、`font-family`、`font-size`、`font-weight`、`line-height`、`text-align`、`padding`、`margin`、`border`、`border-radius`、`vertical-align`、`text-decoration`、`word-break`、`overflow-wrap`。

- [x] **Step 4: 写入默认 fixture**

`content.fixture.v1.json` 使用 `componentKey: "hero.countdownOverlay"` 和以下已确认默认内容：

```js
{
  'navigation.text': 'Unlock $100 Off Your First Order At Freshine',
  'navigation.linkText': 'SIGN UP',
  'navigation.url': 'https://freshinelife.com/',
  'hero.backgroundImage.url': 'asset://countdown-background',
  'hero.backgroundImage.alt': 'Woman standing beside floor-to-ceiling sheer curtains in a neutral living room',
  'brand.logo.url': 'asset://countdown-brand-logo',
  'brand.logo.alt': 'FreShine',
  'brand.clickUrl': 'https://freshinelife.com/',
  'decoration.dividerImage.url': 'asset://countdown-divider',
  'decoration.dividerImage.alt': '',
  'countdown.title': 'Only 3 Days Left',
  'hero.subtitle': 'UP TO 65% OFF | Free Gift On $259+ | Free Shipping',
  'hero.cta.text': 'SHOP NOW',
  'hero.cta.url': 'https://freshinelife.com/'
}
```

本地 fixture 使用 `asset://` 注册三项组件资源：1200×1443 背景、由促销悬浮首图 Logo 保持透明轮廓派生的深色 Logo、用户提供的 512×27 分隔装饰图；正式构建前由上传器替换为公开 HTTPS URL。

- [x] **Step 5: 运行针对性测试确认通过**

Run: `node --test tests/build-email-template.v1.test.mjs`

Expected: 新 registry 测试通过；既有六组件 Campaign 断言仍通过。

### Task 3: 登记、演示与渲染验证

**Files:**
- Modify: `组件清单.json`
- Create: `头图/倒计时头图/效果演示.html`
- Create: `头图/倒计时头图/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: Task 2 的 component directory 和 Schema；builder 的 `--preview-local-assets` 本地资源相对路径策略。
- Produces: 可在组件清单发现、可本地预览、可由管理说明正确配置的独立组件。

- [x] **Step 1: 完成注册表条目**

在 `组件清单.json` 追加：

```json
{
  "中文名称": "倒计时头图",
  "分类": "头图",
  "componentKey": "hero.countdownOverlay",
  "默认主题": "countdown-overlay",
  "默认变体": "split-navigation-editable-panel",
  "fixedTheme": false,
  "输出宽度": 600,
  "移动端断点": 375,
  "规范版本": 1
}
```

其 `路径` 填入 Task 2 的模板、内容契约、设置契约、fixture、defaults、管理说明和 CSS 文件的相对路径。

- [x] **Step 2: 生成本地演示**

演示页使用 Task 2 的默认文案、内联后的模板、组件自有 `./assets/default-background.jpg`、`./assets/brand-logo-dark.png`、`./assets/divider-ornament.png`，以及与 defaults 完全一致的设置值。演示页是浏览器预览包装，不得被加入 Omnisend 组件模板。

- [x] **Step 3: 写管理说明**

说明写明：600px / 375px 尺寸边界、顶部双段导航与所有可编辑字段、静态倒计时限制、背景图不得包含文字、本地资产不能直接作为 Omnisend 最终地址、完整快照要求和 Omnisend Desktop/Mobile/Gmail/Outlook/Apple Mail 验证清单。

- [x] **Step 4: 增加真实渲染断言**

追加一个临时 composition 测试，实例必须带齐 Task 2 内容和 settings，并断言 builder 成功后 HTML 同时包含：

```js
assert.match(html, /Only 3 Days Left/);
assert.match(html, /Unlock \$100 Off Your First Order At Freshine/);
assert.match(html, /href="https:\/\/freshinelife\.com\/"/);
assert.match(html, /freshine-countdown-overlay-hero/);
assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
```

- [x] **Step 5: 运行全量验证**

Run: `node --test tests/*.test.mjs`

Expected: 全部测试通过，且原始六组件 Campaign 仍严格为六项、不包含 `hero.countdownOverlay`。
