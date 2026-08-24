# 双赠品奖励卡组件管理说明（V1）

## 组件定位

- 中文名称：双赠品奖励卡
- 英文名称：Double Gift Vertical Reward Card
- Component Key：`gift.rewardGrid2`
- 布局：上方活动文案＋上图＋下图
- 桌面画布：600px
- 移动端目标：375px 流式单列

本组件只管理一个可独立拼接的 Omnisend 正文表格片段。图片中的价格、赠品名称和说明属于图片内容，不拆成 HTML 字段；更换活动时直接替换整张图片。

## 文件职责

- `component.template.v1.html`：单根表格结构以及内容、设置插槽。
- `component.styles.v1.css`：组件自身的安全样式维护源，不直接上传 Omnisend。
- `content.schema.v1.json`：后续 Skill 需要收集的文案、图片、alt 和链接字段。
- `content.fixture.v1.json`：默认内容与本地预览素材映射，供编辑器初始化完整内容快照；拼接器不会自动读取。
- `settings.schema.v1.json`：可替换背景色及高级样式参数。
- `settings.defaults.v1.json`：默认主题设置，供 Skill 初始化完整设置快照；拼接器不会自动补缺失字段。
- `assets/default-random-pillow-cover.jpg`：默认上方随机抱枕套奖励图，仅供本地预览。
- `assets/default-silk-eye-mask.jpg`：默认下方丝绸眼罩奖励图，仅供本地预览。
- `效果演示.html`：使用默认文案、背景色和本地参考图片生成的浏览器效果；不能直接作为 Omnisend Custom HTML 片段导入。

## 后续 Skill 应收集的内容

Skill 默认按以下顺序询问：

1. 顶部标题 `reward.title`。
2. 第一条活动规则 `reward.rules[0]`。
3. 第二条活动规则 `reward.rules[1]`。
4. 上方完整图片、alt 和跳转链接。
5. 下方完整图片、alt 和跳转链接。
6. 组件背景色 `color.surface`，默认 `#FBFAF8`。

图片必须包含最终需要显示的价格、赠品名称和说明。Skill 不应询问这些图片内部文案，也不能用 HTML 覆盖图片内容。

用户手动上传或通过 Shopify CLI/API 获取的图片，在生成 Omnisend HTML 前必须转换成公开可访问的 HTTPS URL。不得把本地路径、`file://`、`data:` 或临时预览地址写入正式组件。

当前 HTML 编辑器开放顶部标题、两条规则、上下两张图片及对应 Alt、`color.surface`。图片点击链接仍沿用完整内容快照中的默认值，不在本次编辑器控件范围内；替换图片时可填写公开 HTTPS 地址，或上传仅用于本地预览的图片。

顶部标题固定使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`、居中对齐；两条规则固定使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`、居中对齐。

## 内容字段

| 位置 | 字段 | 说明 |
|---|---|---|
| 顶部标题 | `reward.title` | 纯文本，必填 |
| 第一条规则 | `reward.rules[0]` | 纯文本，必填 |
| 第二条规则 | `reward.rules[1]` | 纯文本，必填 |
| 上方图片 | `reward.items[0].image.url` | 默认使用本地预览素材；正式导入时为完整图片 HTTPS URL |
| 上方图片说明 | `reward.items[0].image.alt` | 纯文本 alt |
| 上方图片链接 | `reward.items[0].url` | 完整 HTTPS URL |
| 下方图片 | `reward.items[1].image.url` | 默认使用本地预览素材；正式导入时为完整图片 HTTPS URL |
| 下方图片说明 | `reward.items[1].image.alt` | 纯文本 alt |
| 下方图片链接 | `reward.items[1].url` | 完整 HTTPS URL |

所有文案必须按纯文本转义，不允许用户输入 HTML 标签。链接不能留空，也不能使用 `#` 或 JavaScript URL。

## 常用样式参数

| 参数 | 默认值 | 维护方法 |
|---|---|---|
| `color.surface` | `#FBFAF8` | Skill 默认询问，可替换整个组件背景 |
| `color.text` | `#1F1D1B` | 高级设置，控制标题和规则文字 |
| `font.heading` | `Lora, Georgia, Times New Roman, serif` | 标题字体及邮件安全回退 |
| `font.body` | `Montserrat, Arial, Helvetica, sans-serif` | 规则字体及邮件安全回退 |
| `spacing.header` | `26px 28px 0` | 顶部文案区间距 |
| `spacing.content` | `20px 19px 26px` | 图片区域外边距，与参考稿的 430px 画布比例一致 |
| `spacing.imageGap` | `4px` | 上下图片间距 |
| `radius.image` | `0px` | 图片圆角渐进增强，默认直角 |

修改默认值时，需要同时更新 `settings.defaults.v1.json` 的 `values` 与 `settings.schema.v1.json` 对应字段的 `default`。

制作单封邮件时，Skill 应把确认后的全部内容和设置写入 composition 实例；不要回写 fixture/defaults。只有需要永久调整组件库默认演示时，才同步更新 fixture/defaults、Schema、效果演示和本说明。

## 图片制作和替换规则

- 推荐图片比例约为 `392:251`，组件模板以 `544 × 348` 声明尺寸。
- 上下图片最好保持相同宽高比，避免邮件中出现不一致的节奏。
- 重要价格与赠品名称应放在图片安全区域内，避免靠近边缘。
- 正式图片建议使用压缩后的 JPG/WebP/PNG，并检查移动端文字是否仍可读。
- 模板通过 `width="544"` 和 `style="width:100%;height:auto"` 流式缩放，不依赖媒体查询。

## Omnisend 安全边界

模板遵循根目录 `Omnisend_HTML_组件与拼接器安全导入规范.md`：

- 单根 `<table>`，仅用 table/tr/td 布局；
- 无 `DOCTYPE/html/head/body/style/link/script/div/button/svg/iframe`；
- 无 Flex、Grid、定位、阴影和 JavaScript；
- 关键样式内联；
- 图片与链接由显式字段注入；
- 不包含页脚或退订 token。

本地静态检查通过只能标记为“符合静态规范”。正式使用前仍需在 Omnisend 完成导入保存、Desktop/Mobile/Dark Mode 预览，以及 Gmail、Outlook 和 Apple Mail 测试邮件。
