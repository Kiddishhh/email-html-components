# 六宫格夏季促销组件管理说明（V1）

- Component Key：`collection.saleGrid6`

## 组件用途与边界

本组件用于“标题与简介 + 六张促销图片 + 六个折扣标签 + 底部 CTA”的邮件促销区块。六张图片在桌面端维持两列三行；在窄屏邮件客户端中，六个 250px 包装表格按内容顺序自动换行为居中单列。

组件是可独立拼接的 Omnisend 正文表格片段，不包含 `DOCTYPE`、`html/head/body`、`style/link`、`div`、脚本、退订链接或网页查看链接。平台级合规内容由 Omnisend 邮件布局负责。

## 文件职责

- `component.template.v1.html`：组件表格结构及 `{{content.*}}`、`{{settings.*}}` 插槽。
- `component.styles.v1.css`：可由构建器安全内联的组件基础样式；不保存主题值。
- `content.schema.v1.json`：Skill 可收集的文案、六张图片、折扣标签和链接契约。
- `content.fixture.v1.json`：默认测试数据，包含参考稿中的六个折扣文案；供 Skill 初始化完整内容快照，拼接器不会自动读取。
- `settings.schema.v1.json`：允许 Skill 写入本次完整设置快照的样式字段。
- `settings.defaults.v1.json`：组件默认样式值；供 Skill 初始化完整设置快照，拼接器不会自动补缺失字段。
- `效果演示.html`：使用默认数据生成的浏览器预览；不能直接作为 Omnisend Custom HTML 正文导入。

## Skill 必问项

用户选择本组件后，Skill 必须收集并确认以下两项样式：

1. `color.theme`：主题色，默认 `#9D1D20`。一个值同时替换六个折扣标签和底部 `SHOP NOW` 按钮，禁止为单个标签再创建独立颜色字段。
2. `color.surface`：组件背景色，默认 `#FBFAF8`。该值同时写入组件根表格及内部画布，避免 Omnisend 出现白色断层。

Skill 还应收集标题、正文、CTA 文案与链接，以及每个格子的图片、图片说明、跳转链接和折扣标签。收集完成后必须把最终内容与颜色汇总给用户确认，再生成 HTML。

## 六个折扣标签

以下字段是独立可编辑的纯文本：

- `saleItems[0].discountLabel`，默认 `SAVE 50%`
- `saleItems[1].discountLabel`，默认 `SAVE 50%`
- `saleItems[2].discountLabel`，默认 `SAVE 65%`
- `saleItems[3].discountLabel`，默认 `SAVE 15%`
- `saleItems[4].discountLabel`，默认 `SAVE 18%`
- `saleItems[5].discountLabel`，默认 `SAVE 50%`

建议标签使用 5–12 个英文字符，例如 `SAVE 30%`、`NEW`、`BEST SELLER`。过长文本会占用更多图片宽度；不要在字段中写 HTML、换行标签或内联样式。

## 内容字段维护

每个 `saleItems[n]` 包含：

- `discountLabel`：左上角折扣标签，纯文本。
- `image.url`：公开可访问的 HTTPS 图片地址。
- `image.alt`：图片含义说明；背景图单元通过 `role="img"` 与 `aria-label` 保留可访问性信息。
- `image.clickUrl`：点击标签或图片主体后的 HTTPS 跳转地址。

六个格子的图片字段必须保持以下精确名称；增删或换序时不能只修改模板：

| 格子 | 图片 | 图片说明 | 点击链接 |
| --- | --- | --- | --- |
| 1 | `saleItems[0].image.url` | `saleItems[0].image.alt` | `saleItems[0].image.clickUrl` |
| 2 | `saleItems[1].image.url` | `saleItems[1].image.alt` | `saleItems[1].image.clickUrl` |
| 3 | `saleItems[2].image.url` | `saleItems[2].image.alt` | `saleItems[2].image.clickUrl` |
| 4 | `saleItems[3].image.url` | `saleItems[3].image.alt` | `saleItems[3].image.clickUrl` |
| 5 | `saleItems[4].image.url` | `saleItems[4].image.alt` | `saleItems[4].image.clickUrl` |
| 6 | `saleItems[5].image.url` | `saleItems[5].image.alt` | `saleItems[5].image.clickUrl` |

公共促销内容包含：

- `saleCollection.title`：区块标题。
- `saleCollection.body`：区块说明。
- `saleCollection.cta.text`：底部按钮文字。
- `saleCollection.cta.url`：底部按钮链接。

文案一律按纯文本转义。图片和链接必须使用公开 HTTPS 地址；Shopify 图片可通过 CLI/API 获取后写入本次 composition 完整快照。只有需要修改组件库默认演示时才更新 fixture；客户端邮件中不能运行脚本读取 Shopify。

## 样式参数

| 参数 | 默认值 | 是否由 Skill 询问 | 用途 |
|---|---|---:|---|
| `color.surface` | `#FBFAF8` | 是 | 整个组件背景色 |
| `color.theme` | `#9D1D20` | 是 | 六个折扣标签与 CTA 的统一主题色 |
| `color.text` | `#1F1F1F` | 否 | 标题和正文颜色 |
| `color.buttonText` | `#FFFFFF` | 否 | 标签及按钮文字颜色 |
| `font.heading` | `Lora, Georgia, Times New Roman, serif` | 否 | 标题字体栈 |
| `font.body` | `Montserrat, Arial, Helvetica, sans-serif` | 否 | 正文字体栈 |
| `font.action` | `Montserrat, Arial, Helvetica, sans-serif` | 否 | 标签和按钮字体栈 |
| `radius.image` | `4px` | 否 | 图片、标签角及按钮圆角 |

修改默认值时，必须同时修改 `settings.defaults.v1.json` 的 `values` 与 `settings.schema.v1.json` 中对应字段的 `default`。颜色使用六位十六进制。邮件客户端无法使用 Lora/Montserrat 时会自动回退到 Georgia/Arial。

标题固定为 `26px / 400 / 36px`，说明固定为 `15px / 400 / 22px`；二者与双赠品奖励卡保持同一排版层级，不作为可编辑 CSS 字段。

## 图片与布局规则

1. 六个图片区统一为 236×236px 视觉窗口，使用 `background-size:cover` 居中裁切；建议上传 1:1 图片，并将主体放在中间安全区。
2. 折扣标签使用 HTML 文字叠放在图片左上角，因此可被 Skill 替换，不应烧录进图片。
3. 图片单元使用 `<td background>` 和内联 `background-image`。提供 `bgcolor` 降级色及可访问性说明；极少数不支持背景图的客户端仍会显示标签和背景色，但可能不显示图片，因此实际发送前仍须做客户端测试。
4. 桌面 600px 画布中保持两列；移动端 375px 目标中按混合响应式表格自然堆叠为居中单列，不使用媒体查询、Flex、Grid 或定位。
5. 每个包装表格统一宽 250px，内部 236px 图片使用左右各 7px 的对称空间。这样两个包装表格刚好适配桌面端约 500px 的内容区，同时移动端保持居中。禁止恢复奇偶卡片的 `align="left/right"` 或不对称边距，否则移动端会再次出现左右交错。
6. 底部 CTA 使用居中的固定 `486px` 表格（同时保留 `width:100%; max-width:486px`），与两张 `236px` 商品图及其各 7px 外侧空间完全同宽；不得依赖固定左右内边距，否则 Gmail 缩窄邮件容器时会使按钮变窄。
7. 更换图片时只更新 `content.*`，不要把活动图片或折扣文字硬编码进模板。

## CSS 与模板维护规则

1. 结构、列宽和图片区高度由组件模板/CSS 自己维护；Skill 收集的整体主题只能映射到 Schema 已声明的当前实例字段。
2. 禁止新增 `div`、`style`、`link`、脚本、外部 CSS、CSS 变量、Flex/Grid、绝对定位、阴影和媒体查询。
3. 增删格子或字段时，必须同步修改模板、content schema、fixture、本说明及效果演示。
4. `color.theme` 是唯一促销主题色来源；不要恢复旧字段 `color.accent`，也不要在标签或 CTA 内硬编码红色。
5. Skill 可用 defaults 初始化，但必须把用户确认后的全部设置字段写入本次 composition 完整快照。拼接器不读取共享主题、不执行差异覆盖，也不会自动补默认值。

## Omnisend 导入与验收

生成结果应按根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md` 扫描：单一根表格、关键样式内联、无禁止标签、无本地图片路径、链接和图片均为 HTTPS、所有模板占位符均已解析。

本地结构测试和浏览器预览通过后，只能称为“符合静态规范”。仍需在 Omnisend 中完成导入保存、Desktop/Mobile/Dark Mode 预览，以及 Gmail、Outlook、Apple Mail 测试邮件，才能判断为可发布。
