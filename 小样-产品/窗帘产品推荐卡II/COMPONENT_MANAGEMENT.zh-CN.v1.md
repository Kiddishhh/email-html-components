# 窗帘产品推荐卡II（标题版）组件管理说明（V1）

## 组件定位

- 中文名称：窗帘产品推荐卡II（标题版）
- 英文名称：Curtain Recommendation Card — Title Version
- Component Key：`product.curtainRecommendationOverlay`
- 桌面画布：600px
- 移动端目标：375px 流式缩放

组件按“样式XI”设计稿制作：衬线大标题、居中说明、卧室窗帘场景图，以及左侧产品信息与右侧白框面料细节卡。需要无标题的场景请使用独立的 `product.curtainRecommendationNoTitle` 组件。场景图与细节图均可替换，默认演示素材只从设计稿裁取，用于本地视觉核对。

## 文件职责

- `component.template.v1.html`：可直接拼接的邮件安全单根表格，包含内容与设置插槽。
- `component.styles.v1.css`：可内联的安全样式维护源，不直接上传 Omnisend。
- `content.schema.v1.json`：标题、说明、两张图片、产品文字、CTA 与统一链接的内容契约。
- `content.fixture.v1.json`：默认 Celina 内容和本地演示素材映射。
- `settings.schema.v1.json` 与 `settings.defaults.v1.json`：背景、文字、操作色及字体栈的完整设置快照。
- `assets/`：只供本地预览的设计稿裁图；正式使用必须替换为公开 HTTPS 图片。
- `效果演示.html`：可直接打开检查的默认视觉效果，不可直接导入 Omnisend。

## 内容字段

| 位置 | 字段 | 说明 |
| --- | --- | --- |
| 顶部标题 | `intro.title` | 默认 `Upgrade Your Home in Style` |
| 顶部说明 | `intro.subtitle` | 单一字段；邮件客户端按可用宽度自动换行 |
| 场景图与说明 | `product.images.scene.url` / `.alt` | 默认本地裁图；正式使用改为公开 HTTPS 图片 |
| 细节图与说明 | `product.images.detail.url` / `.alt` | 默认本地裁图；正式使用改为公开 HTTPS 图片 |
| 产品名称 | `product.name` | 默认 `Celina Linen Curtains` |
| 颜色标题及值 | `product.color.label` / `.value` | 默认 `Color:` 与 `Khaki 8823-5` |
| CTA | `product.cta.label` | 默认 `SHOP NOW` |
| 统一链接 | `product.url` | 两张图片与 CTA 共用；必须为 HTTPS |

默认链接 `https://freshinelife.com/` 只是安全占位，不代表确认的商品或活动落地页。

## 样式边界

- 组件外层实际输出为 600px 画布，内容最大宽度固定为 548px，左右留白 26px。
- 标题固定为 `Lora, Georgia, Times New Roman, serif`；正文、颜色与 CTA 固定为 `Montserrat, Arial, Helvetica, sans-serif`。
- 顶部标题固定使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`、居中对齐；顶部说明固定使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`、居中对齐；产品名及下方左对齐文字保持组件自身层级。
- 标题、说明、场景图、信息列和细节卡的比例、间距与圆角 CTA 均为已确认版式，不开放为每封 Campaign 的几何设置。
- 主图在设计稿床尾处收束为 `548×495px`；右侧 `237px` 白框细节卡与主图后的下方区域保持 `28px` 间距，不使用负外边距或定位，避免上下脱节与客户端偏移。
- 细节卡采用 `#D8D0C5` 的 1px 暖灰描边与白色内衬，在不使用不稳定阴影的前提下与组件底色形成轻微区分。
- 左列以 `79px` 上留白对齐产品文案。该下方双栏结构在 Gmail、Outlook 与 Apple Mail 中均保持稳定的流式布局。
- `color.surface`、`color.text` 与 `color.action` 可通过完整 settings 快照替换；默认操作色为 `#9D1D20`。

## Omnisend 安全边界

- 仅使用 table/tr/td、内联样式和公开 HTTPS 图片及链接。
- 禁止 JavaScript、iframe、表单、外部 CSS、Flex/Grid、绝对定位、阴影及运行时 Shopify 请求。
- 不包含页脚或 `[[unsubscribe_link]]`；拼接完整邮件时由页脚组件承担退订信息。
- 静态检查只代表符合项目约束。正式导入前仍需在 Omnisend、Gmail、Outlook 与 Apple Mail 检查桌面与移动端效果。
