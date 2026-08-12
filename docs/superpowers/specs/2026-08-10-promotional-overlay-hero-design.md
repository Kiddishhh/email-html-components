# Promotional Overlay Hero V1 设计规格

## 1. 目标

根据参考设计 `/Users/ww/Downloads/头图/图文XXIV.png` 新建一个独立 V1 邮件首图组件，在保持设计稿主要视觉层级的同时，使背景图片、促销文案、活动文案、链接、CTA 和主题色均可独立配置，并符合 `Omnisend_HTML_组件与拼接器安全导入规范.md`。

该组件面向后续 `build-omnisend-campaign-draft` Skill 使用。Skill 应根据组件 Schema 询问用户背景主图、文案、链接和主题色，然后将确认数据注入组件；不得修改组件内部结构。

## 2. 组件身份与目录

- 英文名称：`Promotional Overlay Hero`
- 组件 Key：`hero.promotionalOverlay`
- 中文目录：`主视觉组件/促销悬浮首图/`
- 版本：V1
- 目标：`omnisend-html-block`
- 桌面邮件内容宽度：600px
- 移动端目标宽度：375px；Omnisend 实际 Custom HTML 内容区可能约为327–352px

该组件作为新组件存在，不覆盖或重命名现有 `hero.seasonalSale`。

## 3. 视觉结构

组件使用单根展示表格，结构顺序如下：

```text
顶部促销导航条
└── 背景图单元格
    ├── 独立圆形品牌 Logo
    ├── 视觉留白
    └── 半透明文案面板
        ├── 活动名称
        ├── 主折扣标题
        ├── 补充说明
        └── CTA 按钮
```

设计基准来自 430×558px 参考图。放入 600px 邮件画布后，按比例建立以下视觉目标：

- 顶部促销导航条约56px高；
- 背景图区域约722px高；
- Logo 约106px；
- 文案面板最大宽度约472px；
- 文案面板靠近背景图底部，左右居中；
- CTA 桌面宽度约252px，点击高度不低于46px；
- 整体保持窄幅、纵向的品牌促销首图气质。

具体间距允许在浏览器设计 QA 中做小幅调整，但不得改变信息层级和视觉关系。

## 4. 图层与邮件实现

### 4.1 背景主图

背景主图与所有可编辑内容分离。用户或后续 Skill 只需提供一张无文字、无 Logo、无按钮、无透明面板的干净场景图。

实现采用 `<td background="...">` 与内联 `background-image` 双写，并同时提供 `background-color` 降级。背景图是装饰层，不能承载活动信息或 CTA。

背景图默认设置：

- `background-position:center center`；
- `background-repeat:no-repeat`；
- `background-size:cover`；
- 使用明确的桌面高度；
- 移动端允许背景图按容器裁切，但不允许出现横向溢出。

由于背景图在部分旧版 Outlook 中可能不显示，该能力在项目规范中属于“需人工确认的兼容性警告”，不是静态阻断项。

### 4.2 Logo

Logo 是独立图片，不合成进背景图。默认使用 Freshine 品牌素材，后续仍保留 URL、alt 和点击链接字段。

Skill 第一版默认不询问 Logo；只有用户明确要求更换品牌素材时才开放对应字段。

### 4.3 半透明编辑面板

面板使用嵌套展示表格实现，不使用 `div`、绝对定位、Flex、Grid 或伪元素。

- 支持透明的客户端使用浅色 `rgba(...)` 背景；
- 同时设置六位十六进制 `bgcolor` 作为不透明浅米白降级；
- 所有文字与按钮位于面板表格内部；
- 即使背景图完全失效，文案仍保持可读；
- 不使用图片面板承载文字。

### 4.4 主题色

顶部促销导航条和 CTA 默认共用 `settings.color.theme`。

组件同时保留以下内部设置：

- `settings.color.theme`
- `settings.color.themeText`
- `settings.color.panelFallback`
- `settings.color.panelTransparent`
- `settings.color.heading`
- `settings.color.body`

后续 Skill 第一版只主动询问一个“主题色号”，并将其写入 `color.theme`。其余颜色使用组件默认值；高级用户提出要求时才分别开放。

## 5. 内容字段契约

`content.schema.v1.json` 至少包含：

- `promotion.text`：顶部促销说明；
- `promotion.linkText`：顶部链接文字；
- `promotion.url`：顶部链接；
- `hero.backgroundImage.url`：干净背景主图；
- `hero.backgroundImage.alt`：背景图替代说明；
- `hero.backgroundImage.clickUrl`：背景区域点击链接；
- `hero.logo.url`：Logo 图片；
- `hero.logo.alt`：Logo alt；
- `hero.logo.clickUrl`：Logo 链接；
- `hero.eyebrow`：活动名称；
- `hero.title`：主折扣标题；
- `hero.subtitle`：补充优惠说明；
- `hero.cta.text`：CTA 文案；
- `hero.cta.url`：CTA 链接。

所有文案按纯文本转义。URL 必须是允许协议的完整地址；图片必须是公开 HTTPS 地址。

## 6. 默认演示数据

默认文案沿用参考设计：

- Promotion：`Unlock $100 Off Your First Order At Freshine.`
- Promotion link：`SIGN UP`
- Eyebrow：`Memorial Day Sale`
- Title：`UP TO 65% OFF`
- Subtitle：`EXTRA $600 OFF & UP TO 20% OFF SITEWIDE`
- CTA：`SHOP NOW`

默认链接应使用可公开访问的 Freshine 页面；不得使用空链接或 `#`。

默认背景图通过 ImageGen 参考设计稿生成：米白色现代客厅、通高半透明窗帘、自然柔光、浅灰米色沙发、左侧站立女性、克制的暖中性色调。生成图不得包含文字、Logo、按钮、促销条、透明面板或水印，仅作为默认演示素材。

生成后的本地图片只用于组件开发预览。写入正式 fixture 前必须取得公开 HTTPS 地址；在没有公开地址时，组件只能标记为本地演示，不能标记为可导入 Omnisend。

## 7. 设置字段契约

`settings.schema.v1.json` 和 `settings.defaults.v1.json` 至少覆盖：

- 颜色：主题色、主题文字色、面板降级色、面板透明色、标题色、正文色；
- 字体：标题、正文、操作文字；
- Logo：最大宽度；
- 背景：桌面高度、背景定位、降级色；
- 面板：最大宽度、内边距；
- 间距：顶部导航、Logo、面板底部；
- CTA：最大宽度、高度、圆角。

第一版 Skill 常用可询问设置仅包含：

- `color.theme`
- 可选的 `color.themeText`

其余字段作为组件默认值保留，避免向普通用户暴露过多 CSS 参数。

## 8. 文件清单

组件目录应包含：

```text
主视觉组件/促销悬浮首图/
├── COMPONENT_MANAGEMENT.zh-CN.v1.md
├── component.styles.v1.css
├── component.template.v1.html
├── content.fixture.v1.json
├── content.schema.v1.json
├── settings.defaults.v1.json
└── settings.schema.v1.json
```

同时更新：

- `组件清单.json`
- `组件索引.md`

不修改其他 V1 组件，不把该组件自动加入现有 `邮件html模版.html`。

## 9. Omnisend 静态安全要求

组件必须满足：

- 单根 `<table>`；
- 不包含 `DOCTYPE/html/head/body/style/link/script/div/button/svg`；
- 所有关键样式内联；
- 不使用绝对定位、Flex、Grid、CSS 变量或媒体查询；
- CTA 使用嵌套表格和文字链接；
- 所有图片和链接字段均显式提供；
- 关键文案不依赖背景图；
- 组件本身不包含退订 token；
- 标签闭合和表格嵌套正确；
- 600px 桌面与375px移动端无横向溢出。

## 10. 降级与错误处理

- 背景图加载失败：显示背景降级色，Logo、面板和 CTA 保持可用；
- 透明色不支持：面板显示不透明浅米白；
- 圆角不支持：CTA 变为直角但仍可点击；
- 非系统字体不加载：回退到 Georgia 或 Arial 字体栈；
- 缺少必填图片、文案或链接：停止渲染，不生成空字段或猜测内容；
- 背景图片仍为本地路径：只允许本地预览，禁止 Omnisend 导入。

## 11. 验收标准

### 本地静态验收

1. 七个组件文件齐全，Schema 与 defaults 一致。
2. 默认数据可生成完整组件片段。
3. 顶部导航条和 CTA 读取同一主题色。
4. 背景图、Logo、面板和文字在结构上完全分离。
5. 不含规范禁止的标签、属性和 URL。
6. 600px 桌面端无横向溢出。
7. 375px 移动端文字可读、CTA 可点击、背景裁切可接受。
8. 与参考图进行同状态视觉对比，修复所有 P0、P1 和 P2 偏差。

### Omnisend 验收边界

本地通过后只能标记为“符合静态规范”。只有完成以下检查，才能标记为 Omnisend 可用：

1. Custom HTML 或 Saved Template 成功保存；
2. Desktop、Mobile 和 Dark Mode 预览通过；
3. Gmail、Outlook 和 Apple Mail 测试邮件通过；
4. 背景图降级、CTA、顶部链接和图片链接通过人工检查。

本次任务默认只创建本地组件，不上传、不发布、不发送 Omnisend 邮件。
