# 品牌信息页脚组件管理说明（V1）

- Component Key：`footer.warm`

## 组件边界

本目录只管理一个可独立拼接的 Omnisend 正文表格片段。模板不包含 `DOCTYPE`、`html/head/body`、`style/link`、`div` 或脚本。该审核页脚为完整 HTML 模板导入保留唯一一个官方 `[[unsubscribe_link]]`；其他平台 token 和网页查看功能仍由部署适配器管理。

## 文件职责

- `component.template.v1.html`：组件表格结构、`{{content.*}}` 内容插槽和 `{{settings.*}}` 高频样式插槽。不要把活动文案、图片地址或链接直接写入此文件。
- `component.styles.v1.css`：组件的安全样式维护源，仅允许简单类或元素规则。拼接器会把可接受的声明内联到最终 HTML；禁止 `@media`、`@import`、CSS 变量、Flex/Grid、定位和阴影。
- `content.schema.v1.json`：内容字段与类型契约。
- `content.fixture.v1.json`：默认测试内容；Skill 可复制 `values` 初始化本次完整内容快照，拼接器不会自动读取。
- `settings.schema.v1.json`：允许修改的高频样式参数；未列出的结构尺寸、列宽和图片高度不对外开放。
- `settings.defaults.v1.json`：默认样式值与历史迁移基线。
- `migration.source.v1.json`：记录本组件一次性迁移自 Omnisend Saved `new FOOT` 的来源 ID、更新时间和快照哈希。该文件只用于审计，不参与构建，也不表示存在持续同步。

`new FOOT` 仅是本组件的初始迁移参考。迁移完成后，本目录中的模板、数据、设置和 Schema 是唯一维护源；后续不再读取、引用或同步 Omnisend Universal Layout。

## 可修改的常用样式参数

| 参数 | 默认值 | 用途 |
|---|---|---|
| `color.background` | `#652a0d` | 页脚区段背景；默认值来自 `new FOOT`；选择本组件时由 Skill 主动询问 |
| `color.text` | `#FFFFFF` | 修改该组件的常用视觉效果 |
| `color.link` | `#F4D8A7` | 联系邮箱与退订链接的浅金色 |
| `font.body` | `Montserrat, Arial, Helvetica, sans-serif` | 页脚文字优先使用 Montserrat，不支持时回退到 Arial |
| `space.sectionX` | `24px` | 页脚区段左右留白 |
| `space.sectionY` | `32px` | 页脚区段上下留白，形成紧凑而不拥挤的暖棕信息卡 |
| `space.block` | `14px` | 电话与联系邮箱信息组的顶部间距 |
| `social.size` | `24px` | 七枚社交图标的显示尺寸 |
| `content.width` | `440px` | 页脚内容列最大宽度；窄屏时随容器流式缩放 |

默认排版采用精致暖棕信息层级：17px 半粗品牌标题、细金棕分隔线、13px 地址与联系信息、11px 预约说明和法律信息、紧凑的七枚社媒图标，以及浅金色链接。修改方式：只改 `settings.defaults.v1.json` 的 `values`，并同步把相同默认值写入 `settings.schema.v1.json` 的 `default`。颜色使用六位十六进制。组件不会加载外部字体；Montserrat 不可用的邮件客户端会自动回退到 Arial。

## Skill 收集规则

当用户选择“品牌信息页脚”加入邮件时，Skill 必须读取 `settings.schema.v1.json`，并对 `skillPrompt: true` 的 `color.background` 主动询问页脚背景色：

1. 用户提供六位十六进制颜色时，将其作为当前组件实例的 `color.background` 设置写入最终 HTML；不要改写组件默认文件。
2. 用户明确沿用默认值，或未提出更换时，使用 `settings.defaults.v1.json` 中的 `#652a0d`。
3. 同一个值必须同时渲染到页脚根表格的 `bgcolor`、根表格内联 `background-color` 以及外层内容单元格的背景，不能只改其中一处。
4. 更换背景色不得联动修改页脚文案、社交链接、邮箱链接、文字颜色、链接颜色或 `[[unsubscribe_link]]`。如果新背景与默认文字颜色对比不足，应单独向用户确认是否调整 `color.text` 或 `color.link`，不能自动改色。

Skill 默认只主动询问 `color.background`；其他页脚样式仍使用 V1 默认值，除非用户主动提出修改。这样可以保持问答简洁，也避免背景调整意外改变从 `new FOOT` 迁移并已确认的内容与链接规则。

## Brand Assets 链接维护

七个社交图标的组件库默认目标地址保存在 `content.fixture.v1.json` 的以下数据字段中；Skill 将它们复制到本次 composition 完整快照，模板只读取实例字段，不写死业务链接。新增 Facebook、WhatsApp、Threads 后，展示顺序固定为 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads：

- `footer.social.instagramUrl`
- `footer.social.pinterestUrl`
- `footer.social.youtubeUrl`
- `footer.social.tiktokUrl`
- `footer.social.facebookUrl`
- `footer.social.whatsappUrl`
- `footer.social.threadsUrl`

默认数据由 `new FOOT` 一次性迁移而来，其中 YouTube 地址包含 `/shorts`。迁移后如账号发生变化，需要更新组件库默认值时修改 fixture，并确保后续 composition 使用更新后的完整快照；不再修改 Saved Universal Layout。单封邮件临时变化只写入本次 composition，不回写 fixture。邮箱链接由 `footer.contactUrl` 管理；退订链接必须继续使用 Omnisend 的 `[[unsubscribe_link]]`，不能替换成普通网址。

## 可修改的内容字段

- `footer.brand`：纯文本，必填。
- `footer.address.line1`：地址第一行，纯文本且必填。
- `footer.address.line2`：地址第二行，纯文本且必填。
- `footer.address.line3`：城市、州和邮编，纯文本且必填。
- `footer.address.line4`：国家，纯文本且必填。
- `footer.address.disclaimer`：预约与收件限制说明，纯文本且必填；固定显示在国家和电话之间，使用辅助信息样式以避免与地址和电话混读。
- `footer.address.line5`：电话，纯文本且必填。

以上地址字段必须保持独立，模板通过显式 `<br>` 分行，避免 Omnisend 折叠换行。
- `footer.contact`：纯文本，必填。
- `footer.contactUrl`：邮箱使用 `mailto:`，也可填写经过审核的 HTTPS 联系页面，必填。
- `footer.copyright`：纯文本，必填。
- `footer.legalBrand`：纯文本，必填。
- `footer.social.instagramUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.pinterestUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.youtubeUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.tiktokUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.facebookUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.whatsappUrl`：HTTPS 链接或图片地址，必填。
- `footer.social.threadsUrl`：HTTPS 链接或图片地址，必填。
- `footer.image.1.url`：HTTPS 链接或图片地址，必填。
- `footer.image.1.alt`：纯文本，必填。
- `footer.image.2.url`：HTTPS 链接或图片地址，必填。
- `footer.image.2.alt`：纯文本，必填。
- `footer.image.3.url`：HTTPS 链接或图片地址，必填。
- `footer.image.3.alt`：纯文本，必填。
- `footer.image.4.url`：HTTPS 链接或图片地址，必填。
- `footer.image.4.alt`：纯文本，必填。
- `footer.image.5.url`：Facebook 图标 HTTPS 地址，必填。
- `footer.image.5.alt`：纯文本，必填。
- `footer.image.6.url`：WhatsApp 图标 HTTPS 地址，必填。
- `footer.image.6.alt`：纯文本，必填。
- `footer.image.7.url`：Threads 图标 HTTPS 地址，必填。
- `footer.image.7.alt`：纯文本，必填。

文案按纯文本处理；不要放入 HTML 标签。网页和图片必须使用公开可访问的 `https://` 地址，邮箱使用 `mailto:`，图片必须保留有意义的 alt 文本。

## CSS 与模板维护规则

1. 改组件整体布局、图片流式宽度或通用视觉规则时，优先改 `component.styles.v1.css`。
2. 改颜色、字体、间距、圆角等高频值时，改 settings，不要复制出新的内联 style。
3. 改表格层级、增加图片或 CTA 时，同时更新模板、content schema、fixture 和本说明文档。
4. 禁止在模板或 CSS 中新增 `div`、`style`、`link`、脚本、外部字体、`box-shadow`、Flex/Grid 或媒体查询。
5. 七枚社交图标的默认尺寸由 `social.size` 管理，HTML 的兼容宽高属性保持 `24 × 24`；不要用通用图片规则覆盖其尺寸。
6. `Unsubscribe` 使用唯一受保护的 `[[unsubscribe_link]]`，并保留 `data-translation-key="unsubscribe"` 与 `target="_blank"`。不得修改、转义、复制或替换为其他 ESP 的退订变量。
7. 如果把该组件放入已经自带原生页脚的 Branded 邮件布局，应关闭其中一个页脚，避免重复公司信息和退订链接。

## 安全导入与验收

生成后以根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md` 为准检查：最终产物必须是表格正文片段、关键样式均内联、无禁止标签、图片与普通网页链接均为 HTTPS，并且整封邮件只保留一个原样的 Omnisend `[[unsubscribe_link]]`。

通过本地静态检查只能标记为“符合静态规范”。仍需在 Omnisend 通过导入保存、Desktop/Mobile/Dark Mode 预览以及 Gmail、Outlook、Apple Mail 测试邮件后，才能标记为可发布。
