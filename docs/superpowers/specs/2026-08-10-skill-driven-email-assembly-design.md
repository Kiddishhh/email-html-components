# Skill 驱动的邮件组件拼接设计

## 目标

使用 Skill 完成组件选择、顺序确认、逐组件内容与样式确认，再由拼接器确定性生成 Omnisend 可导入 HTML。拼接器不得自行选择组件、推断主题、统一样式或修改组件源文件。用户确认最终预览后，后续流程才能调用 Omnisend API 创建未发送的 Campaign 草稿；任何预览、创建或更新步骤都不得发送邮件。

## 职责边界

### Skill

1. 读取可用组件及其内容和设置 Schema。
2. 询问用户需要的组件和排列顺序。
3. 逐个组件收集或确认文案、图片、链接与开放的常用样式。
4. 用户选择默认内容或默认样式时，也将解析后的默认值记录到本次邮件配置。
5. 用户要求跨组件统一主题色时，由 Skill 明确映射到每个组件支持的设置字段，并逐组件记录最终值。
6. 生成完整、可审计的邮件配置清单，并在拼接前让用户确认。
7. 展示拼接后的本地预览并等待最终确认。
8. 只有获得针对当前预览的明确确认后，才允许调用 Omnisend API 创建未发送的 Campaign 草稿。

### 拼接器

1. 按邮件配置中的顺序读取组件。
2. 接收每个组件已经确认的完整 `content` 和 `settings`。
3. 使用组件 Schema 校验字段、必填项、链接协议和设置字段白名单。
4. 将内容与设置注入模板，将安全的组件 CSS 内联。
5. 组合为单根表格的 Omnisend 正文 HTML，并生成独立的浏览器预览文件。
6. 拦截禁止标签、禁止 CSS、不安全链接、未知字段和未解析插槽。

拼接器不得自动选择组件、自动调整主题色或背景色、自动统一组件样式、根据内容改变布局，或写回任何组件模板、Schema、fixture、默认设置与 CSS 文件。

## 配置模型

邮件配置包含画布信息和有序组件实例。画布只管理邮件外壳，不覆盖组件内部设置。

```json
{
  "schemaVersion": 1,
  "canvas": {
    "contentWidth": 600,
    "mobileTargetWidth": 375,
    "backgroundColor": "#FBFAF8",
    "outerBackgroundColor": "#FFFFFF",
    "verticalPadding": 0
  },
  "output": "邮件模版.html",
  "previewOutput": "邮件模版.local-preview.html",
  "assets": {
    "hero-background": {
      "path": "主视觉组件/促销悬浮首图/assets/default-background.reference.png",
      "name": "promotional-overlay-hero-background.png"
    }
  },
  "components": [
    {
      "name": "促销悬浮首图",
      "directory": "主视觉组件/促销悬浮首图",
      "componentKey": "hero.promotionalOverlay",
      "content": {
        "promotion.text": "Unlock $100 Off Your First Order At Freshine.",
        "promotion.linkText": "SIGN UP",
        "promotion.url": "https://freshinelife.com/",
        "hero.backgroundImage.url": "asset://hero-background",
        "hero.backgroundImage.alt": "Warm modern living room with sheer curtains",
        "hero.logo.url": "https://cdn.shopify.com/example/logo.webp",
        "hero.logo.alt": "Freshine",
        "hero.logo.clickUrl": "https://freshinelife.com/",
        "hero.eyebrow": "Memorial Day Sale",
        "hero.title": "UP TO 65% OFF",
        "hero.subtitle": "EXTRA $600 OFF & UP TO 20% OFF SITEWIDE",
        "hero.cta.text": "SHOP NOW",
        "hero.cta.url": "https://freshinelife.com/pages/freshine-sale"
      },
      "settings": {
        "color.theme": "#9D1D20",
        "color.themeText": "#FFFFFF",
        "color.heroFallback": "#E9E4DC",
        "color.logoBadge": "#A79689",
        "color.panelFallback": "#F4F1EC",
        "color.panelTransparent": "rgba(247, 244, 239, 0.88)",
        "color.heading": "#1E1D1B",
        "color.body": "#2B2825",
        "font.heading": "Lora, Georgia, Times New Roman, serif",
        "font.body": "Montserrat, Arial, Helvetica, sans-serif",
        "font.action": "Montserrat, Arial, Helvetica, sans-serif",
        "spacing.promotion": "0",
        "spacing.logoTop": "48px",
        "spacing.panelBottom": "32px",
        "background.position": "center center",
        "logo.maxWidth": "80px",
        "panel.maxWidth": "472px",
        "panel.padding": "26px 28px 30px",
        "cta.maxWidth": "252px",
        "radius.button": "0px"
      }
    }
  ]
}
```

`content` 与 `settings` 必须是完整快照，而不是依赖后续主题合并的差异项。组件 fixture 和 settings defaults 只供 Skill 展示默认值与生成完整快照；拼接器收到正式邮件配置后不再通过共享主题覆盖组件。

## 数据与样式处理

- 内容字段只允许出现在对应 `content.schema.v1.json` 中。
- 设置字段只允许出现在对应 `settings.schema.v1.json` 中。
- URL 字段只接受当前构建器允许的 `https:`、`mailto:` 或 `tel:` 协议；Omnisend 受保护变量按安全规范单独处理。
- 文本必须转义后注入，URL 必须按属性上下文转义。
- 组件内部视觉效果完全由组件模板、组件 CSS 和本次已确认的 `settings` 决定。
- 邮件画布宽度、画布背景和画布外背景属于邮件外壳，不属于组件样式。
- 不再使用 `sharedComponentSettings` 或 `componentOverrides` 对组件进行隐式覆盖。

## 本地图片与最终上传

- 本地图片使用组合配置顶层 `assets` 登记，图片内容字段保存为 `asset://<asset-id>`，不得用本地路径冒充正式 URL。
- 本地预览模式把已登记资产解析为工作目录内的相对 URL，只生成 `.local-preview.html`，不生成可导入 Omnisend 的正式正文文件。
- 用户确认预览后，导入流程通过 Omnisend Images API 将每个本地文件上传到共享 Image Library。
- 上传流程必须把 API 返回的公开 HTTPS 地址写回本次邮件配置中的对应图片字段，并移除未解析的 `asset://` 引用，然后重新运行拼接器生成正式 HTML。
- 任一 `asset://` 尚未替换时，拼接器必须拒绝正式构建；不得把本地路径、`file://`、`data:` 或预览服务器地址写入 Omnisend HTML。
- 上传图片与创建 Campaign 都属于最终导入阶段，只能在用户确认当前预览后执行；创建的 Campaign 必须保持草稿且不得发送。

## 本次五组件输出

第一份使用新职责边界生成的邮件按以下顺序组合默认演示内容和默认设置：

1. 促销悬浮首图
2. 六宫格夏季促销
3. 评论整图链接（可链接整图）
4. 双赠品奖励卡
5. 展厅地址卡

桌面画布宽度为 600px，移动端目标宽度为 375px。当前阶段生成包含本地设计图的浏览器预览和待上传资产清单，不调用 API、不创建 Campaign、不发送邮件。用户确认后才上传本地图片、生成只含公开 HTTPS 图片的 Omnisend 正文 HTML，并创建未发送草稿。

## 错误处理

- 缺少完整 `content` 或 `settings` 时停止构建并指出组件与缺失字段。
- 出现未知内容字段或未知设置字段时停止构建。
- 组件目录、组件 Key 与 Schema 不一致时停止构建。
- 出现未解析插槽、不安全链接、禁止标签或禁止 CSS 时停止构建。
- 输出文件只在所有组件均验证成功后写入。

## 验收标准

1. 五个组件严格按指定顺序出现且各出现一次。
2. 输出为单根表格正文片段，不包含 `DOCTYPE`、`html`、`head`、`body`、外部样式或脚本。
3. 所有内容和设置插槽都被解析，组件 CSS 已内联。
4. 拼接器不读取共享组件主题覆盖，也不修改组件源文件。
5. 同一配置重复构建得到相同 HTML。
6. 本地预览在 600px 桌面画布和 375px 移动目标下保持组件顺序及基本布局。
7. 当前阶段不存在 Omnisend API 调用或发送行为。
