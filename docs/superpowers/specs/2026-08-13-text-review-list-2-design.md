# 双条文字评论组件设计

## 目标

在现有 Omnisend 邮件 HTML 组件库中新增一个独立的“双条文字评论”V1 组件。组件参考 `/Users/ww/Downloads/评论 2/X.png` 的信息层级、留白、分割线和字体气质，使用 `/Users/ww/Downloads/矢量 31.png` 作为固定绿色星形图标，展示一组总评分和两条可替换的文字评论。

- 中文名称：`双条文字评论`
- Component Key：`review.textList2`
- 分类：`评论组件`
- 目录：`评论组件/双条文字评论/`
- 桌面画布：600px
- 移动端目标：约 375px
- 样式方向：已确认的 A“参考图忠实版”

本阶段建立完整、可测试、可独立预览的组件，但不把它加入 Campaign Skill 的区段候选，不编写内容注入脚本，也不改变当前六区段 Campaign 结构。后续 Skill 注册及外部评论数据注入作为独立设计与实施阶段处理。

## 视觉结构

组件使用单列纵向结构，从上到下依次为：

1. 居中的五颗总评分星形；
2. 同一行显示的顶部评分和评论数量；
3. 第一条横向分割线；
4. 第一条评论的五颗星形、作者、日期、标题和正文；
5. 第二条横向分割线；
6. 第二条评论的五颗星形、作者、日期、标题和正文。

组件不使用评论卡片、边框、圆角、阴影、桌面双栏、CTA 或任何点击链接。两条评论固定纵向排列，数量不可增减，顺序不可调整。正文不截断、不隐藏；较长内容通过自然换行扩展组件高度。

外层组件宽度为 100%、最大 600px，左右内边距固定为 24px。约 375px 的移动端继续使用 24px 左右内边距，内容宽度约 327px；字号和星形尺寸保持不变，由文字自然换行完成适配，不依赖媒体查询。

## 视觉参数

默认背景色为 `#FDFCFB`。其余已锁定的默认视觉值如下：

| 元素 | 默认值 |
| --- | --- |
| 主文字颜色 | `#252321` |
| 次文字颜色 | `#89756F` |
| 分割线颜色 | `#DEDAD6` |
| 总评分星形 | 固定 5 颗，每颗显示宽度 17px，间距 3px |
| 单条评论星形 | 固定 5 颗，每颗显示宽度 13px，间距 2px |
| 顶部评分行 | Montserrat/Arial，17px，700，约 23px 行高 |
| 作者与日期 | Montserrat/Arial，14px，400，20px 行高 |
| 评论标题 | Lora/Georgia，18px，400，25px 行高 |
| 评论正文 | Montserrat/Arial，15px，400，22px 行高 |
| 横向分割线 | 1px |

组件顶部内边距为 48px，底部内边距为 38px。总评分文字与星形之间保留 10px；总评分区底部与第一条分割线之间保留 27px。每条评论在分割线后保留 20px 顶部间距；标题与作者信息之间、正文与标题之间各保留 12px。

只有背景色是当前确认的用户可修改视觉设置。后续 Skill 注册时允许用户输入完整 `#RRGGBB` 色号覆盖 `color.surface`，默认仍为 `#FDFCFB`；确认卡必须显示色号、真实色块、600px 桌面预览和约 375px 移动预览。深色背景也允许输入，但组件不会自动改写已锁定的主文字、次文字或分割线颜色，因此必须通过预览检查可读性。

## 内容契约

组件使用完整 `content` 快照。可替换字段为：

| 字段 | 默认值 | 用途 |
| --- | --- | --- |
| `summary.ratingText` | `4.8 / 5` | 顶部评分 |
| `summary.reviewCountText` | `200+ reviews` | 顶部评论数量 |
| `review.1.author` | `Sarah M` | 第一条评论作者 |
| `review.1.date` | `Aug 2, 2026` | 第一条评论日期 |
| `review.1.title` | `Exactly What Our Living Room Needed` | 第一条评论标题 |
| `review.1.body` | `The linen blend drapes beautifully and the custom sizing was spot on. Customer service walked me through the entire measurement process — couldn't be happier with the result.` | 第一条评论正文 |
| `review.2.author` | `James K` | 第二条评论作者 |
| `review.2.date` | `Jul 28, 2026` | 第二条评论日期 |
| `review.2.title` | `Quiet Luxury, Really Well Made` | 第二条评论标题 |
| `review.2.body` | `Ordered pinch-pleat panels for our bedroom bay window. The fabric has this beautiful natural texture and the light filtering is perfect. Worth every penny.` | 第二条评论正文 |

顶部评分和评论数量是两个独立字段，视觉上以固定的 ` · ` 分隔并显示在同一行；如果替换内容过长则允许自然换行。每条评论的作者和日期也是独立字段，视觉上以固定的 ` · ` 分隔。两条评论的作者、日期、标题和正文均可分别替换。

所有字段都是纯文本且必填。渲染器必须执行 HTML 转义，不把内容解释为 HTML。组件不为评论建立详情链接，不从作者、标题或正文自动生成链接。

## 固定星形资产

实现时把用户提供的 `/Users/ww/Downloads/矢量 31.png` 原样复制为 `评论组件/双条文字评论/assets/review-star.png`。星形是组件固定视觉资产，不向用户开放替换、改色或按评分数量增减。

内容快照以 `star.image.url` 保存同一个图片地址。默认 fixture 使用 `asset://review-star`，并通过 `localReferenceAssets.review-star` 映射到组件目录内的图片，供本地效果演示和构建预览解析。模板在总评分处重复使用该地址 5 次，在两条评论处各重复使用 5 次，总计渲染 15 个星形 `<img>`。

所有星形图片使用空 `alt`，作为装饰图从辅助技术中隐藏；可读评分由 `summary.ratingText` 提供。最终生成 Omnisend HTML 前，`star.image.url` 必须解析为公开 HTTPS 地址；未上传的本地路径、`asset://`、`file://`、相对路径或 `data:` 地址不得进入正式 HTML。

## 设置契约

组件使用完整 `settings` 快照，至少包含以下字段：

- `color.surface`：默认 `#FDFCFB`，允许后续 Skill 提示用户输入完整 `#RRGGBB`；
- `color.primaryText`：默认 `#252321`，组件固定；
- `color.secondaryText`：默认 `#89756F`，组件固定；
- `color.divider`：默认 `#DEDAD6`，组件固定；
- `font.heading`：默认 `Lora, Georgia, Times New Roman, serif`，组件固定；
- `font.body`：默认 `Montserrat, Arial, Helvetica, sans-serif`，组件固定；
- `content.maxWidth`：默认 `600px`，组件固定；
- `spacing.horizontal`：默认 `24px`，组件固定。

`settings.schema.v1.json` 和 `settings.defaults.v1.json` 必须保持默认值一致。`color.surface` 必须校验为完整六位十六进制色号；无效或缩写色号在生成前直接拒绝，不自动猜测或补全。

当前拼接器不会执行设置字段的 Schema `pattern`。为落实上述生成前校验，本阶段对 `build-email-template.v1.mjs` 增加通用的可选 pattern 校验：只有字段定义显式包含 `pattern` 时才构造正则并校验对应设置值；pattern 本身无效时报告组件 Schema 错误，值不匹配时报告具体设置字段错误。现有未声明 pattern 的组件保持原行为。

## 邮件结构与响应式约束

组件模板必须是一个独立、单一根 `<table>` 的 Omnisend 正文片段，不包含 `DOCTYPE`、`html`、`head`、`body`、外部样式表、脚本、表单、iframe 或退订区。布局仅使用 presentation table、`tr`、`td`、`span`、`img` 和必要的文本节点。

关键颜色、字体、字号、行高、间距与宽度必须内联。禁止 Flex、Grid、绝对定位、JavaScript、CSS 变量、外部字体导入和依赖媒体查询的必要布局。分割线使用表格单元格背景色实现，避免依赖邮件客户端不一致的复杂边框行为。

组件在 600px 桌面画布和约 375px 移动端都保持相同的信息顺序、星形数量和文本内容。移动端不隐藏日期、不缩短正文、不把评论改为横向滚动，也不降低星形数量。

## 组件文件与通用注册

新增：

- `评论组件/双条文字评论/component.template.v1.html`
- `评论组件/双条文字评论/component.styles.v1.css`
- `评论组件/双条文字评论/content.schema.v1.json`
- `评论组件/双条文字评论/content.fixture.v1.json`
- `评论组件/双条文字评论/settings.schema.v1.json`
- `评论组件/双条文字评论/settings.defaults.v1.json`
- `评论组件/双条文字评论/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- `评论组件/双条文字评论/效果演示.html`
- `评论组件/双条文字评论/assets/review-star.png`

更新：

- `组件清单.json`：以唯一 `componentKey` 登记通用组件及全部文件路径；
- `组件索引.md`：新增“评论组件”分类和真实效果演示入口；
- `README.md`：把新组件列入通用组件库，并明确它尚未加入 Campaign Skill；
- `build-email-template.v1.mjs`：支持设置字段声明的可选 Schema `pattern` 校验；
- `tests/build-email-template.v1.test.mjs`：增加组件渲染与邮件安全契约测试；
- 适合通用注册表的现有契约测试：验证路径、Schema、fixture、defaults 和效果演示完整性。

本阶段明确不修改：

- `skills/build-omnisend-campaign-draft/SKILL.md`；
- `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`；
- `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`；
- `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`；
- `skills/build-omnisend-campaign-draft/scripts/` 下的任何内容注入脚本；
- 当前默认六组件 composition。

因此，新组件在本阶段完成后可由组件库和拼接器独立使用，但不会出现在 Campaign Skill 的样式选择卡中。

## 效果演示

`效果演示.html` 必须是组件目录内可直接打开的真实演示页面，使用默认 fixture、默认 settings 和本地固定星形素材，展示已确认的 A“参考图忠实版”。它不能用孤立参考图、设计截图或另一个临时 HTML 替代。

演示页包含 600px 邮件画布并保持流式宽度，浏览器窗口缩小到约 375px 时必须自然适配。演示内容必须与 fixture 一致，不允许把评论文字烧录成图片。参考图 `/Users/ww/Downloads/评论 2/X.png` 只作为视觉基准，不作为组件内容资产。

## 测试与验收

实施遵循测试先行：先增加聚焦失败测试，确认失败原因是新组件尚不存在，再创建组件文件和通用注册，最后运行全量测试。

自动测试至少覆盖：

- 通用注册表中 `review.textList2` 恰好出现一次，中文名称、分类和路径正确；
- 组件目录要求的九个文件全部存在；
- content/settings schema、fixture 和 defaults 的 Component Key 一致；
- fixture 和 defaults 是完整快照，不缺少字段、不包含额外字段；
- `summary.ratingText`、`summary.reviewCountText` 及两条评论的作者、日期、标题和正文都能独立替换并完成 HTML 转义；
- 模板固定渲染 15 个使用同一 URL 的装饰性星形图片；
- 组件不包含 `<a>`、CTA、链接字段或点击行为；
- `color.surface` 接受完整 `#RRGGBB`，拒绝缩写、缺少 `#`、非十六进制字符和其他格式；
- 拼接器仅对显式声明 `pattern` 的设置字段执行正则校验，并清楚区分无效 Schema pattern 与设置值不匹配；
- 默认 fixture 的 `asset://review-star` 可在本地预览模式解析；
- 最终构建在星形仍为本地资产时停止，不输出包含 `asset://` 或相对图片路径的正式 HTML；
- 输出为单一根表格，不包含脚本、iframe、表单、Flex、Grid、定位、外部 CSS、文档级标签或未解析占位符；
- 600px 与约 375px 下都保持单列、24px 左右留白、两条完整评论和三组五颗星形。

视觉验收必须通过受支持的本地 HTTP 预览执行，并并排检查 600px 桌面端和约 375px 移动端。验收重点是参考图层级、间距、分割线、星形尺寸、字体气质、长文本换行和自定义背景色可读性。静态检查和本地浏览器预览通过只能标记为“符合静态规范”；正式使用前仍需在 Omnisend 完成 Desktop、Mobile 和 Dark Mode 预览，并向 Gmail、Outlook、Apple Mail 发送测试邮件。
