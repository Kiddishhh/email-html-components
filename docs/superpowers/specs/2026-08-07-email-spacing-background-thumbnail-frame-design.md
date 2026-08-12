# 邮件组件间距、背景与布料小图框架调整规格

日期：2026-08-07

## 目标

在不改变六个 V1 组件顺序、文案、图片数据、字体、按钮颜色、页脚规则和 600px / 375px 响应式结构的前提下，完成以下视觉调整：

1. 增加节日促销首图底部留白。
2. 略微增加编辑式叠放商品正文区域的水平边距及正文到主图的垂直间距。
3. 为编辑式叠放商品与免费设计咨询中的布料小图增加邮件客户端安全的白色框和模拟阴影。
4. 将邮件画布内部空白及首图主体背景改为 `#FBFAF8`，画布外部恢复 `#FFFFFF`。

## 采用方案

采用嵌套表格模拟阴影，不使用 `box-shadow`。该结构由浅色右下衬底、白色框、浅色边线和内部图片组成，保持 Omnisend、Outlook、Gmail 与 Apple Mail 的表格邮件兼容性。

不采用：

- CSS `box-shadow`：部分邮件客户端会忽略，且不符合当前安全规则。
- 将框和阴影烘焙进图片：不利于后续脚本替换 Shopify 商品图片。

## 精确视觉参数

### 节日促销首图

- `color.surface`：`#F7F3EF` → `#FBFAF8`
- `spacing.image`：`29px 0 0` → `29px 0 32px`
- Logo 区背景继续使用 `#FFFFFF`。

### 编辑式叠放商品

- `spacing.header`：`8px 32px 0` → `8px 36px 0`
- `spacing.content`：`0 32px 32px` → `0 36px 32px`
- 正文到主图的垂直间距：`4px` → `16px`
- 其他字体、字号、CTA、双列比例和图片内容保持不变。

### 布料小图框架

应用范围：

- `editorial.detailImage`
- `consultation.sketchImage`

结构参数：

- 白色框：`6px`
- 边线：`1px solid #E7E1DA`
- 右下模拟阴影：`6px`
- 阴影色：`#EFEAE4`
- 图片保持 `width:100%; height:auto;`
- 不使用脚本、定位、Flex/Grid、媒体查询或 `box-shadow`。

### 画布内外背景

- `themes/default-canvas.theme.v1.json`：画布内容背景改为 `#FBFAF8`。
- 新增画布外背景参数 `outerBackgroundColor`，默认 `#FFFFFF`。
- `build-email-template.v1.mjs`：外层 100% 表格和本地预览 `body` 使用外背景；600px 内容表格及内容单元格使用画布内容背景。
- `themes/seasonal-sale-hero.theme.v1.json` 同步采用内容 `#FBFAF8`、外部 `#FFFFFF`。

## 组件边界和维护

- 首图间距和背景继续由首图 settings schema/defaults 管理。
- 编辑式叠放商品的常用间距继续由该组件 settings schema/defaults 管理；新增正文到主图间距设置，避免把常用间距写死。
- 布料框和模拟阴影属于各组件自己的表格结构与默认样式，不进入整体主题。
- 整体主题只负责画布内外背景和画布宽度。
- 同步更新三个相关组件的中文维护说明。

## 测试与验收

自动测试必须证明：

1. 首图底部间距为 `32px`，背景为 `#FBFAF8`。
2. 编辑式叠放商品水平边距为 `36px`，正文到主图间距为 `16px`。
3. 两张布料小图均存在白框、浅色边线和表格模拟阴影，且最终 HTML 不含 `box-shadow`。
4. 画布内容背景为 `#FBFAF8`，外部和本地预览 `body` 为 `#FFFFFF`。
5. 最终模板仍为六个 V1 组件、只有一个 `[[unsubscribe_link]]`，且无禁止标签或不安全链接。
6. 浏览器实测桌面内容最大宽度 600px；375px 下邮件宽度和页面滚动宽度均为 375px，无横向溢出。

## 非目标

- 不修改内容 fixture、Shopify 图片 URL、文字、CTA 链接或字体。
- 不修改双赠品、六宫格、页脚的组件结构。
- 不上传或发布到 Omnisend。
