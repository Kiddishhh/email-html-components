# 小样产品推荐卡（右）组件管理说明（V1）

## 组件定位

- 中文名称：小样产品推荐卡（右）
- 英文名称：Sample Product Recommendation Card
- Component Key：`product.sampleProductRecommendationRight`
- 布局：左侧面料图、名称、副标题与文字链接 CTA＋右侧产品场景图
- 桌面画布：600px
- 移动端目标：375px 流式缩放

组件以设计稿的轻暖白底双图结构为基准。左图为 `197px`、右图为 `319px`，中间固定 `32px` 留白；两张图均保留 `8px` 圆角。左侧文字区从面料图底部起固定 `42px` 间隔，避免后续内容注入改变版式节奏。

## 文件职责

- `component.template.v1.html`：邮件安全的单根表格片段、内容及设置插槽。
- `component.styles.v1.css`：可内联的安全样式维护源，不直接上传 Omnisend。
- `content.schema.v1.json`：两张图片、alt、三处文案及统一跳转链接的契约。
- `content.fixture.v1.json`：默认的 Liana 内容与本地演示素材映射。
- `settings.schema.v1.json` 与 `settings.defaults.v1.json`：组件背景、文字颜色及字体的完整设置快照。
- `assets/`：仅供本地预览的默认场景与面料图片。
- `效果演示.html`：直接打开即可检查的默认视觉效果，不可直接作为 Omnisend Custom HTML 导入。

## 内容字段

| 位置 | 字段 | 说明 |
| --- | --- | --- |
| 左侧面料图 | `product.images.fabric.url` | 默认本地素材；正式使用必须替换成公开 HTTPS 图片 |
| 左侧图片说明 | `product.images.fabric.alt` | 纯文本 alt |
| 右侧场景图 | `product.images.scene.url` | 默认本地素材；正式使用必须替换成公开 HTTPS 图片 |
| 右侧图片说明 | `product.images.scene.alt` | 纯文本 alt |
| 产品名称 | `product.title` | 默认 `Liana` |
| 产品副标题 | `product.subtitle` | 默认 `Sheer Curtains` |
| CTA | `product.cta.label` | 默认 `SHOP NOW <` |
| 统一跳转 | `product.url` | 两张图片和 CTA 共用；默认仅为占位 URL |

默认链接 `https://freshinelife.com/` 仅为后续内容注入前的安全占位，不代表已确认的活动落地页。注入脚本或 Campaign 实例必须提供真实的 HTTPS 产品或集合链接。

## 样式边界

- `color.surface` 默认 `#FAF9F7`，可替换整块组件背景。
- 所有文字统一使用 `Montserrat, Arial, Helvetica, sans-serif`；`font.body` 为固定字体栈，不作为 Campaign 主题覆写项。
- 桌面端标题为 24px/600，副标题为 20px/400，CTA 为 20px/500；窄屏使用 CSS `clamp()` 将标题最小控制为 18px、副标题与 CTA 最小控制为 15px，并同步收紧行高。
- 图文尺寸、两栏比例、间距、圆角和 CTA 的下划线样式属于已确认的版面，不作为每封 Campaign 的可编辑几何参数。
- 窄屏保持左右双列，不改为上下布局；图片、列宽与留白依靠 `width:100%` 与最大宽度表格等比例收缩，文字通过内联 `clamp()` 控制字号与行高，不使用媒体查询、Flex 或 Grid。

## Omnisend 安全边界

- 仅使用 table/tr/td、内联样式、公开 HTTPS 图片与链接。
- 禁止 JavaScript、iframe、表单、外部 CSS、Flex/Grid、绝对定位及运行时 Shopify 请求。
- 不包含页脚或 `[[unsubscribe_link]]`；拼接整封邮件时由页脚组件处理退订信息。
- 静态检查通过不代表已完成邮箱客户端验证；正式使用前仍需在 Omnisend、Gmail、Outlook 与 Apple Mail 中检查桌面及移动端显示。
