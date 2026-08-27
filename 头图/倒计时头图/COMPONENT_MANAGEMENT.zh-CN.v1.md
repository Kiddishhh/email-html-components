# 倒计时头图 V1 组件管理说明

## 组件定位

- 中文名称：倒计时头图
- Component Key：`hero.countdownOverlay`
- 目标环境：Omnisend Custom HTML / HTML Import
- 桌面画布：600px
- 移动端目标：约 375px 流式可读

本组件复现“双段顶部导航＋室内背景图＋居中半透明内容面板”的倒计时首图。倒计时是发送前可修改的静态文本，不使用 JavaScript 或实时日期计算。

## 内容字段

| 视觉位置 | 字段 | 默认内容 |
| --- | --- | --- |
| 左侧导航 | `navigation.text` | `Unlock $100 Off Your First Order At Freshine` |
| 右侧导航文字 | `navigation.linkText` | `SIGN UP` |
| 右侧导航链接 | `navigation.url` | `https://freshinelife.com/` |
| 背景图与 Alt | `hero.backgroundImage.url` / `.alt` | 独立、可替换图片 |
| 品牌 Logo 与链接 | `brand.logo.url` / `.alt` / `brand.clickUrl` | 复用促销悬浮首图 Logo 的深色派生图 / 首页 |
| 装饰分隔图 | `decoration.dividerImage.url` / `.alt` | 线条与菱形装饰；空 Alt |
| 倒计时 | `countdown.title` | `Only 3 Days Left` |
| 补充说明 | `hero.subtitle` | `UP TO 65% OFF | Free Gift On $259+ | Free Shipping` |
| CTA | `hero.cta.text` / `.url` | `SHOP NOW` / 首页 |

所有字段写入单次 composition 的完整 `content` 快照。拼接器不读取组件 fixture、不会补默认值，也不会合并主题。

## 顶部导航栏开关

可视化编辑器以“显示顶部导航栏”复选框开放 `navigation.visible`，默认值为 `true`。关闭后，构建器会从最终 HTML 中完整移除双段导航及其占位高度；背景主图、Logo、倒计时面板和 CTA 保持不变。导航文案、链接和颜色仍保存在当前组件快照中，重新开启即可恢复。不得用 CSS `display:none` 模拟隐藏。

导航栏对齐夏末折扣促销首图：左侧 `75.5%`、右侧 `24.5%`；桌面高度 `71px`，移动端采用 `min(71px,11.833333vw)`。左右文字均使用 Montserrat Regular `18px / 24px` 并按移动宽度等比缩小，右侧 `SIGN UP` 保留下划线。`color.navigationLeft` 与 `color.navigationRight` 的独立配色不变。

## 图片与布局边界

背景图必须为干净场景图，不能包含导航、品牌字标、倒计时、说明或 CTA。组件通过 `<td background>` 与内联 `background-image` 显示背景，并提供 `color.heroFallback` 作为降级色；面板同时提供实色和 RGBA 背景，确保不支持透明色的客户端仍可阅读关键内容。

默认演示使用组件自有的 `assets/default-background.jpg`（1200×1443）、`assets/brand-logo-dark.png` 和 `assets/divider-ornament.png`。深色 Logo 由 `头图/促销悬浮首图/assets/default-logo-white.png` 保持原透明轮廓派生；分隔图使用用户提供的 512×27 PNG，不再使用文本符号模拟。三项仅用于本地预览，最终 Omnisend HTML 必须将对应 URL 全部替换为公开 HTTPS 图片地址；不得使用本地路径、`file://`、`data:` 或 `asset://`。

组件外层为 `width:100%;max-width:600px`：桌面画布固定在 600px 上限，移动端只把画布宽度收进可用屏幕，不强制保持 600px 实际宽度。主视觉沿用默认背景 1200×1443 的比例：在桌面 600px 画布中显示为约 600×722px，加 56px 顶部导航后组件总高约 778px；推荐直接上传 600×722px 背景，高清源图使用与默认图相同的 1200×1443px。移动端主视觉使用 `120vw`，约 375px 时约为 450px；仅保留 368px 下限，避免把移动端固定拉高。中央半透明面板桌面为 440×480px，375px 时约为 275×300px；面板内的 Logo、分隔图、标题框和字号、说明、CTA、内边距及 8/14/22/22px 间距均以 600px 为桌面上限，并用 `min()` 随视口按同一比例收缩，确保编辑文本层与背景图保持相近构图。倒计时标题仍只使用一个可编辑字段 `countdown.title`，默认内容为 `Only 3 Days Left`；模板不插入固定换行标签。导航下方的跨两列外壳 `td` 必须维持 table-cell；背景放入其内部的单列 `td`，只在内层应用 `display:block`，避免破坏导航双列后的 `colspan` 并使右侧出现空白。

响应式内层背景使用 `height:120vw`、`min-height:368px` 和 `max-height:722px`。600px 桌面主视觉稳定为 722px；375px 移动端约为 450px。导航栏与面板内全部视觉元素均从桌面上限以 `min()` 等比例收缩，补充文字允许自然换行。HTML 的 `height="722"` 尺寸属性继续保留，供不能识别流式高度的 Outlook 等客户端使用桌面构图降级。

## 样式与导入检查

`SHOP NOW` 使用 `color.theme`，右侧 `SIGN UP` 使用独立的 `color.navigationRight`；参考图两者默认均为 `#725A4B`，左侧导航参考图默认色为 `#97866D`。初始完整快照把这三项颜色标记为 `reference-default`，不以混色结果覆盖。用户主动修改 CTA 主题色且未单独指定左侧导航色时，再由确定性脚本按 CTA 主题色 35%、浅色基准 65% 计算协调色，浅色基准为 `#F4F1EC`；用户也可单独覆盖左侧或右侧导航色，存在覆盖时保持该值，直到明确恢复自动配色。其余样式字段必须作为完整 `settings` 快照写入。不要以共享 CSS、媒体查询、Flex、Grid、绝对定位或 JavaScript 改写布局。

静态检查通过后，正式使用前仍需在 Omnisend 检查 Desktop、Mobile 和 Dark Mode，并向 Gmail、Outlook、Apple Mail 发送测试邮件。
