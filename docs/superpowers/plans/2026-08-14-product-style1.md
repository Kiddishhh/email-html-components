# 产品样式1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建未注册到 Campaign Skill 的“产品样式1”邮件组件，以可替换的双图片、文案和 CTA 复原参考稿的主图与右下叠图版式。

**Architecture:** 组件以单根邮件安全 table 模板和内联 CSS 来源构成，完整 content/settings 快照由现有拼接器渲染。右下图片的叠加用 `valign`、负上边距和表格式右下投影实现；当邮件客户端忽略增强样式时，图片自然保持在文字右侧。

**Tech Stack:** Node.js 内置测试运行器、JSON Schema 契约、静态 HTML、table/inline-CSS 邮件布局、macOS `sips`。

## Global Constraints

- 所有邮件组件片段使用单根 `table`、内联样式和 600px 最大宽度；移动端检查目标为 375px。
- 禁止 `div`、JavaScript、媒体查询、Flex/Grid、绝对定位、`box-shadow`、外部 CSS 和非 HTTPS 正式图片。
- `product.sampleStyle1` 只加入通用注册表；不得加入 `campaign-structure.v1.json`、`campaign-component-interactions.v1.json` 或 Campaign Skill 的六区段。
- `product.mainImage.url` 与 `product.detailImage.url` 都是 `image-source`、HTTPS 字段；仅预览/上传源模式可使用登记的 `asset://`。
- 主图、小图、标题、副标题、CTA 文案、CTA 链接均可由完整 content 快照替换。
- 不执行 Omnisend 上传、Campaign 写入、发送、排期或 Shopify 写操作。

---

### Task 1: 定义产品组件的回归契约

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Create: `小样/产品/样式1/`（由下一任务实现）

**Interfaces:**
- Consumes: 组件注册表条目的 `路径` 格式、拼接器既有的 `asset://` 解析规则。
- Produces: `productStyle1Directory`、`makeProductStyle1Composition()` 和两个针对组件接口的失败测试，供模板实现与完整套件验证使用。

- [ ] **Step 1: 写入会失败的注册表与字段测试**

  在测试文件常量区加入：

  ```js
  const productStyle1Directory = `${root}/小样/产品/样式1`;
  ```

  新测试读取 `组件清单.json`、content schema、settings schema、fixture、defaults、template、demo 和管理说明，并断言：

  ```js
  assert.equal(entry.componentKey, 'product.sampleStyle1');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'product.mainImage.url', 'product.mainImage.alt',
    'product.detailImage.url', 'product.detailImage.alt',
    'product.title', 'product.subtitle', 'product.cta.text', 'product.cta.url'
  ]);
  assert.equal(contentSchema.properties['product.mainImage.url'].role, 'image-source');
  assert.equal(contentSchema.properties['product.detailImage.url'].role, 'image-source');
  assert.equal(contentSchema.properties['product.cta.url'].protocol, 'https');
  assert.match(template, /width="548"/);
  assert.match(template, /margin-top:-\{\{settings\.spacing\.detailOverlap\}\}/);
  assert.match(template, /padding:0 \{\{settings\.spacing\.detailShadow\}\} \{\{settings\.spacing\.detailShadow\}\} 0/);
  assert.equal(defaults.values['spacing.detailOverlap'], '96px');
  assert.equal(defaults.values['spacing.detailShadow'], '8px');
  assert.doesNotMatch(template, /box-shadow|position\s*:/i);
  assert.match(demo, /375px/);
  assert.match(management, /尚未加入 Campaign Skill/);
  ```

- [ ] **Step 2: 运行测试，确认因目录尚不存在而失败**

  Run: `node --test tests/build-email-template.v1.test.mjs --test-name-pattern "product style1"`

  Expected: FAIL，错误指向不存在的 `小样/产品/样式1/content.schema.v1.json`；不得因为语法错误或测试名不匹配而失败。

- [ ] **Step 3: 写入会失败的本地双图片预览与最终构建拦截测试**

  添加工厂函数，写出仅含该组件的 composition：

  ```js
  function makeProductStyle1Composition(name, overrides = {}) {
    return writeComposition(name, {
      canvas: { backgroundColor: '#F8F5F1', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
      assets: {
        'product-main': { path: '小样/产品/样式1/assets/default-main-image.png', name: 'product-main.png' },
        'product-detail': { path: '小样/产品/样式1/assets/default-detail-image.png', name: 'product-detail.png' }
      },
      components: [{
        name: '产品样式1', directory: '小样/产品/样式1', componentKey: 'product.sampleStyle1',
        content: {
          'product.mainImage.url': 'asset://product-main', 'product.mainImage.alt': 'Living room with sheer curtains',
          'product.detailImage.url': 'asset://product-detail', 'product.detailImage.alt': 'White sheer curtain fabric',
          'product.title': 'Liana Sheer Curtains', 'product.subtitle': 'Extra Long Sheer Light Drapes For Living Room & Bedroom...',
          'product.cta.text': 'SHOP NOW', 'product.cta.url': 'https://freshinelife.com/collections/sheer-curtains'
        },
        settings: productStyle1Settings,
        ...overrides
      }]
    });
  }
  ```

  断言 `run(path, '--preview-local-assets')` 成功，生成的预览同时含有 `default-main-image.png` 和 `default-detail-image.png` 的相对路径；无 flag 的 `run(path)` 必须失败并含 `local asset product-main must be uploaded before final build`。

- [ ] **Step 4: 运行新增本地素材测试，确认同样失败**

  Run: `node --test tests/build-email-template.v1.test.mjs --test-name-pattern "product style1 local"`

  Expected: FAIL，原因是组件目录或素材尚不存在。

- [ ] **Step 5: 提交测试红灯状态不得提交；保留工作区用于下一任务**

  不创建提交。TDD 红灯是下一任务实现的唯一输入。

### Task 2: 实现组件契约、默认素材与邮件安全模板

**Files:**
- Create: `小样/产品/样式1/assets/default-main-image.png`
- Create: `小样/产品/样式1/assets/default-detail-image.png`
- Create: `小样/产品/样式1/component.template.v1.html`
- Create: `小样/产品/样式1/component.styles.v1.css`
- Create: `小样/产品/样式1/content.schema.v1.json`
- Create: `小样/产品/样式1/settings.schema.v1.json`
- Create: `小样/产品/样式1/content.fixture.v1.json`
- Create: `小样/产品/样式1/settings.defaults.v1.json`

**Interfaces:**
- Consumes: Task 1 的 `productStyle1Settings` 完整设置及 8 个内容字段。
- Produces: 可被 `build-email-template.v1.mjs` 直接渲染的 `product.sampleStyle1` 组件目录。

- [ ] **Step 1: 从用户提供的参考稿生成两份默认预览素材**

  在组件目录创建 `assets/`。保留原截图不作为邮件图片；从 `样式IX.png` 提取主视觉和材质图，分别输出为 `default-main-image.png` 与 `default-detail-image.png`。先以 `sips` 建立裁切，再用 `sips -g pixelWidth -g pixelHeight` 记录主图约 784×778、小图约 284×284；若裁切坐标有一像素偏差，以视觉检查为准微调，但不得包含标题、CTA 或截图外框。

- [ ] **Step 2: 实现内容契约和默认 fixture**

  `content.schema.v1.json` 使用：

  ```json
  {
    "schemaVersion": 1,
    "componentKey": "product.sampleStyle1",
    "injectionMode": "full-component-rerender",
    "properties": {
      "product.mainImage.url": { "type": "url", "role": "image-source", "protocol": "https", "required": true, "editable": true, "skillPrompt": false },
      "product.mainImage.alt": { "type": "text", "role": "image-alt", "required": true, "editable": true, "skillPrompt": false },
      "product.detailImage.url": { "type": "url", "role": "image-source", "protocol": "https", "required": true, "editable": true, "skillPrompt": false },
      "product.detailImage.alt": { "type": "text", "role": "image-alt", "required": true, "editable": true, "skillPrompt": false },
      "product.title": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
      "product.subtitle": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
      "product.cta.text": { "type": "text", "required": true, "editable": true, "skillPrompt": false },
      "product.cta.url": { "type": "url", "role": "link-target", "protocol": "https", "required": true, "editable": true, "skillPrompt": false }
    },
    "additionalProperties": false
  }
  ```

  fixture 使用两个 `asset://` 值、标题 `Liana Sheer Curtains`、参考稿副标题与 Freshine sheer-curtains 链接。

- [ ] **Step 3: 实现设置契约和默认值**

  Schema 和 defaults 定义下列完整设置，所有颜色以 `^#[0-9A-Fa-f]{6}$` 校验、所有尺寸以 `^\\d+px$` 校验：

  ```json
  {
    "color.surface": "#F8F5F1",
    "color.title": "#242424",
    "color.subtitle": "#303033",
    "color.action": "#242424",
    "color.detailFrame": "#FFFFFF",
    "color.detailShadow": "#D8D1CA",
    "font.body": "Arial,Helvetica,sans-serif",
    "content.maxWidth": "600px",
    "image.mainWidth": "548px",
    "image.detailWidth": "205px",
    "spacing.horizontal": "26px",
    "spacing.detailOverlap": "96px",
    "spacing.detailShadow": "8px"
  }
  ```

- [ ] **Step 4: 实现单根 table 模板与 CSS 来源**

  模板必须由一个 `table.freshine-product-style1` 根节点开始。顶行置入主图链接，使用 `width="548"`、`width:100%;max-width:{{settings.image.mainWidth}};height:auto`。下行用左右两列：左列标题（34px/41px）、副标题（22px/31px）与 48px 高边框按钮；右列用内嵌灰褐表格和 `padding:0 {{settings.spacing.detailShadow}} {{settings.spacing.detailShadow}} 0` 形成右下投影。

  小图容器在右列使用 `style="padding-top:{{settings.spacing.detailOverlap}};margin-top:-{{settings.spacing.detailOverlap}};"`，图片前置 8px 白边。CTA 以 `<a href="{{content.product.cta.url}}">` 包裹文字，图片均以 `<a>` 包裹。CSS 只列出允许的 `width`、`max-width`、`border-collapse`、`display`、`height`、`border` 和 `outline` 声明，且不使用 `box-shadow`、`position` 或媒体查询。

- [ ] **Step 5: 运行两项红灯测试并确认转绿**

  Run: `node --test tests/build-email-template.v1.test.mjs --test-name-pattern "product style1"`

  Expected: PASS，预览可解析两张本地素材；最终静态构建拒绝未上传的 `asset://product-main`。

- [ ] **Step 6: 运行完整组件模板安全验证**

  Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

  Expected: 现有 Campaign 六区段验证仍然通过；新增通用组件不会出现在固定区段。

### Task 3: 加入通用注册表、可审阅演示与维护文档

**Files:**
- Modify: `组件清单.json`
- Modify: `组件索引.md`
- Modify: `README.md`
- Create: `小样/产品/样式1/效果演示.html`
- Create: `小样/产品/样式1/COMPONENT_MANAGEMENT.zh-CN.v1.md`

**Interfaces:**
- Consumes: Task 2 的组件目录和 `product.sampleStyle1` Schema。
- Produces: 可从通用组件清单、索引和真实演示页发现的组件；Campaign Skill 保持不变。

- [ ] **Step 1: 扩展注册表但不扩展 Campaign 结构**

  在 `组件清单.json` 末尾追加：

  ```json
  {
    "中文名称": "产品样式1",
    "分类": "小样/产品",
    "componentKey": "product.sampleStyle1",
    "默认主题": "reference-editorial",
    "默认变体": "main-image-with-overlapped-detail",
    "fixedTheme": false,
    "输出宽度": 600,
    "路径": {
      "组件模板": "小样/产品/样式1/component.template.v1.html",
      "内容契约": "小样/产品/样式1/content.schema.v1.json",
      "设置契约": "小样/产品/样式1/settings.schema.v1.json",
      "默认测试数据": "小样/产品/样式1/content.fixture.v1.json",
      "默认设置": "小样/产品/样式1/settings.defaults.v1.json",
      "中文管理说明": "小样/产品/样式1/COMPONENT_MANAGEMENT.zh-CN.v1.md",
      "组件样式": "小样/产品/样式1/component.styles.v1.css"
    },
    "移动端断点": 375,
    "规范版本": 1
  }
  ```

  不修改 `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`、`campaign-component-interactions.v1.json` 或 `SKILL.md`。

- [ ] **Step 2: 创建真实效果演示页**

  演示页包含 HTML 文档壳、600px 外壳和组件的完整默认渲染；图片仅引用当前目录 `./assets/default-main-image.png` 和 `./assets/default-detail-image.png`，不使用替代示意图。页面在外壳说明文本中显示“桌面：600px / 移动检查：375px”，并以 `width:100%;max-width:600px` 保持窄屏可检查。

- [ ] **Step 3: 创建中文管理说明并同步索引/README**

  管理说明明确列出八个可替换字段、两图本地预览资产、最终 HTTPS 上传要求、600/375 布局、表格投影和无增强回退，以及“尚未加入 Campaign Skill，待样式确认后再注册”。在 `组件索引.md` 增加“小样/产品”章节和三条链接；在 README 的通用组件说明补充该组件并说明它不属于当前 Campaign 六组件。

- [ ] **Step 4: 运行注册表与 Campaign 隔离测试**

  Run: `node --test tests/build-email-template.v1.test.mjs --test-name-pattern "product style1"`

  Expected: PASS，注册表中恰有一个该组件，所有七个路径存在，同时 `campaign-structure` 与交互索引均不含 `product.sampleStyle1`。

### Task 4: 生成可视预览并完成全量验证

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Create: `build/product-style1.local-preview.html`（忽略的验证产物）

**Interfaces:**
- Consumes: 完整组件 fixtures/defaults、Task 1 composition helper。
- Produces: 600px 与 375px 可视检查证据和完整回归结果。

- [ ] **Step 1: 新增完整渲染测试**

  将 Task 1 helper 的 composition 以 `previewOutput: 'build/product-style1.local-preview.html'` 运行，断言：

  ```js
  assert.match(readFileSync(previewOutput, 'utf8'), /data-freshine-slot="product.title"/);
  assert.match(readFileSync(previewOutput, 'utf8'), /href="https:\/\/freshinelife\.com\/collections\/sheer-curtains"/);
  assert.match(readFileSync(previewOutput, 'utf8'), /margin-top:-96px/);
  assert.match(readFileSync(previewOutput, 'utf8'), /padding:0 8px 8px 0/);
  assert.doesNotMatch(readFileSync(previewOutput, 'utf8'), /box-shadow|position\s*:/i);
  ```

- [ ] **Step 2: 运行新增测试，确认通过**

  Run: `node --test tests/build-email-template.v1.test.mjs --test-name-pattern "product style1"`

  Expected: PASS，所有新增断言成功。

- [ ] **Step 3: 生成并检查本地预览**

  Run: `node build-email-template.v1.mjs /private/tmp/product-style1-preview/composition.v1.json --preview-local-assets`

  Expected: 输出 JSON 含 `desktopWidth: 600`、`mobileTargetWidth: 375`、`status: "local-preview"`。在浏览器或本地图片检查中确认：小图位于主图右下，右/下投影可见，标题与 CTA 完整可读；375px 宽度下无横向裁切。

- [ ] **Step 4: 运行全量自动验证与差异检查**

  Run:

  ```bash
  node --test tests/*.test.mjs
  node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
  node --check build-email-template.v1.mjs
  git diff --check
  ```

  Expected: 所有测试通过；Campaign 验证仍显示固定六区段有效；语法检查和 diff 检查均返回 0。

- [ ] **Step 5: 提交可审核的组件实现**

  ```bash
  git add 小样/产品/样式1 组件清单.json 组件索引.md README.md tests/build-email-template.v1.test.mjs docs/superpowers/specs/2026-08-14-product-style1-design.md docs/superpowers/plans/2026-08-14-product-style1.md
  git commit -m "feat: add product sample style1 component"
  ```

  提交前再次运行 `git diff --cached --check`；不得提交 `build/` 预览产物。

## Plan Self-Review

- Spec coverage: 四项任务覆盖目录、可替换字段、600/375 布局、本地双图片、右下叠加/投影、通用注册表、真实演示、Campaign 未注册、自动与视觉验证。
- Placeholder scan: 无 TBD、TODO 或未定义任务；素材裁切只允许一像素级视觉校正，输出文件名和来源明确。
- Type consistency: 所有任务使用同一 `product.sampleStyle1`、八个 `product.*` 内容字段和 `productStyle1Settings` 完整设置。
