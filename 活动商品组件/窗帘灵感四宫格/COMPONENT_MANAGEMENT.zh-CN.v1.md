# 窗帘灵感四宫格组件管理说明（V1）

## 组件定位

- 中文名称：窗帘灵感四宫格
- Component Key：`collection.curtainInspirationGrid4`
- 桌面画布：600px；内容表宽 `85%`、最大 510px，因此桌面为 510px、两侧各 45px。
- 移动端目标：375px；内容表约 319px，四张图约为 154px 宽，保持两列布局。

该组件复现“Upgrade Your Home in Style”设计稿：居中标题和说明下排列四张独立可点击的窗帘灵感图。默认 PNG 为经用户授权从设计稿裁切的四个正方形图块；它已注册到 Campaign 可视化编辑器，可自由加入、重复及排序。图片下方标题默认关闭，开启后才展示与参考图相同的居中商品标题效果。

## 文件职责

- `component.template.v1.html`：Omnisend 安全的单根 table 片段与完整插槽。
- `component.styles.v1.css`：由拼接器内联的组件级安全样式。
- `content.schema.v1.json`、`content.fixture.v1.json`：标题、说明、四组图片/Alt/链接/下方标题的内容契约和默认素材映射。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：图片标题开关、组件底色和固定文字样式快照。
- `assets/default-curtain-grid-*.png`：按设计稿裁切的四张本地预览图。
- `效果演示.html`：600px 和约 375px 浏览器视觉检查用文件，不能直接导入 Omnisend。

## 内容字段

| 区域 | 字段 | 说明 |
| --- | --- | --- |
| 顶部 | `promotion.title` / `promotion.subtitle` | 居中标题和可自然换行的说明。 |
| 左上 | `grid.image1.url` / `.alt` / `.clickUrl` / `.caption` | 第一张灵感图、独立跳转与下方标题。 |
| 右上 | `grid.image2.url` / `.alt` / `.clickUrl` / `.caption` | 第二张灵感图、独立跳转与下方标题。 |
| 左下 | `grid.image3.url` / `.alt` / `.clickUrl` / `.caption` | 第三张灵感图、独立跳转与下方标题。 |
| 右下 | `grid.image4.url` / `.alt` / `.clickUrl` / `.caption` | 第四张灵感图、独立跳转与下方标题。 |

默认 `asset://` 地址只用于本地预览。导出或上传 Omnisend 前，四个图片地址都必须替换为公开 HTTPS URL；每个链接也必须为公开 HTTPS URL。

## HTML 编辑器登记

- 已登记于根目录 `组件清单.json`，类别为“活动商品组件”，Component Key 为 `collection.curtainInspirationGrid4`。
- 在 Campaign HTML 编辑器中依次选择“活动商品组件”→“窗帘灵感四宫格”，即可添加、重复使用、排序和确认该组件。
- 编辑器开放 18 个内容字段：标题、说明，以及四组图片 URL、Alt、点击链接和图片下方标题；样式设置新增 `grid.showCaptions`（显示图片下方标题，默认关闭）与 `color.surface`。关闭开关时，渲染结果不含标题标签或额外留白，保持原有无标题版式；标题字段可预先填写，待开启时显示。字体、图片比例、两列结构及间距固定，避免单封编辑破坏设计稿对齐。

## 固定版式

- 顶部留白 52px；标题为 Lora `30px / 500（Medium） / 38px`，标题与说明相隔 22px。
- 说明为 Montserrat `18px / 500 / 27px`，宽度上限 510px，自然换行；说明与图片区相隔 40px。
- 图片区桌面为 `510px` 宽的两列：每张 `247 × 247px`，横向间隔为 `16px`；标题关闭时上下两行间隔为 `16px`。内容表采用 `width:85%; max-width:510px`，所以在 375px 下四张图约为 `154 × 154px`，仍保留两列阅读关系；底部留白 52px。
- 开启图片标题后，每张图与标题之间留 11px；标题为 Montserrat `16px / 500 / 22px`、居中且自然换行。上下两行图片（含上行标题与下行图片）之间增加为 `32px`，避免视觉拥挤；标题行随内容增高，不会压缩图片或改变正方形比例；`效果演示.html` 展示此开启状态。
- 结构和几何参数不在单封 Campaign 中开放编辑，以保持参考稿的对齐关系。

## Omnisend 安全边界

- 只使用 table/tr/td、img、a 与 span 的内联邮件样式；不使用脚本、iframe、表单、Flex、Grid、定位或外部 CSS。
- 四张图片各自包裹独立 `<a>`，从而在邮件客户端中保留四个可验证的点击目标；不得回退为一张长图的单一链接。
- 静态校验与本地预览不代表真实收件箱效果。正式发送前仍需在 Omnisend Desktop/Mobile 预览，并向 Gmail、Outlook 和 Apple Mail 发送测试邮件。
