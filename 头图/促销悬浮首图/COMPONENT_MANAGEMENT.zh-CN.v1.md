# Promotional Overlay Hero V1 组件管理说明

## 组件定位

- 中文名称：促销悬浮首图
- 英文名称：Promotional Overlay Hero
- Component Key：`hero.promotionalOverlay`
- 目标环境：Omnisend Custom HTML / HTML Import
- 桌面宽度：600px
- 移动端目标：375px 流式可读

本组件复现“顶部促销条＋房间背景图＋独立 Logo＋悬浮编辑面板”的首图结构。背景主图只负责视觉，促销文案、活动标题、说明和 CTA 都是独立 HTML 内容，可以由后续 Skill 注入。组件外层保持 `width="100%"`，由组合文件提供 600px 邮件画布，因此首图默认随画布全宽铺满。

## 文件职责

- `component.template.v1.html`：邮件安全的单根表格结构；关键样式已内联。
- `component.styles.v1.css`：组件主要样式的维护源，不直接上传 Omnisend。
- `content.schema.v1.json`：Skill 可收集和注入的内容字段。
- `content.fixture.v1.json`：默认演示文案与公开 HTTPS 演示地址，供 Skill 初始化完整内容快照；拼接器不会自动读取。
- `settings.schema.v1.json`：允许修改的主题与常用样式字段。
- `settings.defaults.v1.json`：默认设置值。
- `assets/default-background.reference.png`：根据设计稿生成的无文字默认背景参考，只供本地设计与预览。
- `效果演示.html`：使用当前默认数据、Logo、主题色和本地背景图生成的完整浏览器演示；仅用于预览，不作为 Omnisend 导入片段。

## 后续 Skill 默认询问项

Skill 第一版应询问：

1. 背景主图：用户上传图片或提供公开 HTTPS URL。
2. 顶部促销说明、链接文字和链接。
3. 活动名称、主折扣标题和补充说明。
4. CTA 文案和链接。
5. 主题色号 `color.theme`。

Skill 默认不询问 Logo、字体、面板透明度和详细间距。Logo 使用组件中的 Freshine 默认值；高级用户明确要求时，才开放这些字段。

顶部促销条和 CTA 默认共用 `color.theme`。修改一个主题色即可同时换色；文字色由 `color.themeText` 控制。

## 顶部导航栏开关

可视化编辑器以“显示顶部导航栏”复选框开放 `navigation.visible`，默认值为 `true`。关闭后，构建器会从最终 HTML 中完整移除顶部促销条及其占位高度；背景主图、Logo、活动文案和 CTA 保持不变。促销条文案、链接和颜色仍保存在当前组件快照中，重新开启即可恢复。不得用 CSS `display:none` 模拟隐藏。

顶部促销条与夏末折扣促销首图使用相同的响应式双栏规格：左侧 `75.5%`、右侧 `24.5%`；桌面高度 `71px`，移动端按 `min(71px,11.833333vw)` 缩放。两侧文字均使用 Montserrat Regular `18px / 24px` 并按移动宽度等比缩小，右侧链接保留下划线；本组件左右两侧继续共用 `color.theme`。

## 背景图维护方法

背景图必须是干净场景图，不应包含：

- 活动文字；
- Logo；
- CTA；
- 顶部促销条；
- 半透明文案框；
- 水印。

推荐使用接近参考稿的竖版构图，人物或视觉主体放在中间偏左，底部保留沙发或桌面层次。组件通过 `<td background>` 和内联 `background-image` 显示图片，并提供 `color.heroFallback` 降级色。支持视口单位和 `max-height` 的客户端使用 `height:120vw`，在桌面端不超过 722px、移动端不低于 560px；`display:block` 用于保证表格单元格在宽屏浏览器中正确执行高度上限。不支持该规则的旧客户端读取 `height="722"` 作为稳定降级。中间留白行不设置固定高度，会根据 Logo 与面板所占空间自动伸缩。

悬浮文案框的外层水平边距固定为 10px，但文案框本身仍由 `panel.maxWidth`（默认 472px）控制。因此 600px 桌面端保持原有 472px 宽度；只有窄屏空间不足时，文案框才扩展到更接近屏幕两侧，从而减少主标题换行和背景画面被文案框过度遮挡的问题。不要把该边距恢复为左右不同的值，也不要使用媒体查询或定位实现覆盖。

`assets/default-background.reference.png` 是本地参考素材，不能直接上传 Omnisend。正式生成邮件前，Skill 必须将用户图片上传到公开 CDN，或要求用户提供公开 HTTPS 地址，再写入 `hero.backgroundImage.url`。

## 文案与链接维护

所有文案按纯文本处理，不得放入 HTML 标签。URL 必须使用完整 `https://` 地址。禁止空链接、`#`、本地路径、`file://`、`data:` 和 JavaScript URL。

字段对应关系：

| 视觉位置 | 内容字段 |
| --- | --- |
| 顶部促销说明 | `promotion.text` |
| 顶部链接文字 | `promotion.linkText` |
| 顶部链接 | `promotion.url` |
| 背景主图 | `hero.backgroundImage.url` |
| 背景说明 | `hero.backgroundImage.alt` |
| Logo | `hero.logo.url` |
| Logo 说明 | `hero.logo.alt` |
| Logo 点击链接 | `hero.logo.clickUrl` |
| 活动名称 | `hero.eyebrow` |
| 主折扣标题 | `hero.title` |
| 补充说明 | `hero.subtitle` |
| CTA 文字 | `hero.cta.text` |
| CTA 链接 | `hero.cta.url` |

## 样式维护边界

组件布局由自身 CSS 和模板维护。Skill 可以读取 defaults 作为初始值，但必须把以下全部字段写入本次 composition 的 `settings` 完整快照；拼接器不读取共享主题、不合并差异设置，也不会自动补默认值。整体主题只能转换为 Schema 中允许的当前实例字段，不能通过公共 CSS 改写内部表格结构。

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `color.theme` | `#9D1D20` | 顶部促销条和 CTA 的统一主题色 |
| `color.themeText` | `#FFFFFF` | 促销条与 CTA 文字色 |
| `color.heroFallback` | `#E9E4DC` | 背景图不可用时的降级色 |
| `color.logoBadge` | `#A79689` | 不支持透明色时的圆形 Logo 降级底色 |
| `color.logoBadgeTransparent` | `rgba(167, 150, 137, 0.70)` | 支持 rgba 时的 70% 圆形 Logo 背景 |
| `color.panelFallback` | `#F4F1EC` | 不支持透明背景时的面板降级色 |
| `color.panelTransparent` | `rgba(247, 244, 239, 0.88)` | 支持 rgba 时的面板背景 |
| `color.heading` | `#1E1D1B` | 主折扣标题颜色 |
| `color.body` | `#2B2825` | 活动名称与补充说明颜色 |
| `font.heading` | `Lora, Georgia, Times New Roman, serif` | 活动名称和主标题字体栈 |
| `font.body` | `Montserrat, Arial, Helvetica, sans-serif` | 促销说明与副标题字体栈 |
| `font.action` | `Montserrat, Arial, Helvetica, sans-serif` | 链接和 CTA 字体栈 |
| `spacing.promotion` | `0` | 顶部促销条内边距 |
| `spacing.logoTop` | `48px` | Logo 与背景区顶部距离 |
| `spacing.panelBottom` | `32px` | 悬浮面板与背景区底部距离 |
| `background.position` | `center center` | 背景图对齐位置 |
| `logo.maxWidth` | `80px` | 白色 FreShine 字标最大宽度；圆形保持当前 106px |
| `panel.maxWidth` | `472px` | 桌面端悬浮面板最大宽度 |
| `panel.padding` | `26px 28px 30px` | 面板内部间距 |
| `cta.maxWidth` | `252px` | CTA 最大宽度 |
| `radius.button` | `0px` | CTA 圆角 |

修改组件库默认值时，应同时更新 `settings.defaults.v1.json` 的 `values`、`settings.schema.v1.json` 对应字段的 `default`、效果演示和本说明。单封邮件只修改 composition 实例，不回写默认文件。

半透明面板同时设置：

- `bgcolor="color.panelFallback"`：不支持透明色时显示浅米白实体背景；
- `background-color:color.panelTransparent`：支持 `rgba` 的客户端显示半透明效果。

圆形 Logo 背景同样同时设置 `bgcolor="color.logoBadge"` 与 `background-color:color.logoBadgeTransparent`。不要使用 `opacity`，否则白色字标也会一起变透明。编辑器允许修改 `#RRGGBB` 背景色和 0–100% 透明度，并确定性生成 RGBA；白色字标与当前 106px/80px 尺寸固定。

背景图片和透明色属于邮件客户端兼容性警告项。它们失效时，关键文案、Logo 与 CTA 仍必须在降级背景上可读。不要改成绝对定位、Flex、Grid、CSS 变量或 JavaScript。

## Omnisend 导入检查

组件模板遵循根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md`：

- 单根 `<table>`；
- 无 `DOCTYPE/html/head/body/style/link/script/div/button/svg/iframe`；
- 布局只使用 table/tr/td；
- CTA 是 HTML 文字按钮；
- 关键样式内联；
- 关键内容不依赖背景图；
- 组件内不放退订 token；
- 图片与链接由显式字段注入。

本地结构检查通过只能标记为“符合静态规范”。正式使用前仍需完成 Omnisend Desktop、Mobile、Dark Mode 预览，以及 Gmail、Outlook 和 Apple Mail 测试邮件。
