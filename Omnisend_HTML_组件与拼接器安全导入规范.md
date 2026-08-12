# Omnisend HTML 组件与拼接器安全导入规范

版本：1.0
更新日期：2026-08-07
适用范围：Omnisend Email Builder 的 Custom HTML 区块，以及通过 `Store Settings → Saved Templates → Import Template` 导入的外部 HTML 模板。

## 1. 目标与原则

本规范用于约束组件源码和拼接器最终产物，使其能够尽可能稳定地保存、预览并导入 Omnisend，同时兼容 Gmail、Apple Mail 和 Outlook。

核心原则：

1. 采用 Omnisend 官方文档各项要求的“安全交集”，不依赖存在冲突或仅部分支持的能力。
2. 所有布局使用 `<table>/<tr>/<td>`；不用网页布局方式实现邮件布局。
3. 关键视觉效果必须由内联 CSS 和 HTML 属性实现，不能依赖 `<style>`、媒体查询或外部样式表。
4. 组件必须是可独立拼接的正文片段，不能包含文档级标签或影响其他组件的全局规则。
5. 最终能否发送不能只根据浏览器预览判断；必须经过 Omnisend 保存、预览和真实测试邮件验证。

> 说明：Omnisend 的 Custom HTML 文档对 `<div>` 存在互相冲突的描述：标签表中称其可谨慎使用，但前置说明、故障排查和 Email HTML 基础规范又建议避免或列为可能导致错误的标签。本规范按更严格规则处理：禁止 `<div>`。

## 2. 两种导入目标

### 2.1 Custom HTML 组件片段

用于拖入 Email Builder 的单个 HTML 区块。

必须满足：

- 只输出正文片段。
- 不包含 `<!DOCTYPE>`、`<html>`、`<head>`、`<body>`。
- 不包含全局 `<style>`、`<link>` 或脚本。
- 根节点使用展示型 `<table width="100%">`。
- 组件自身不能假设它可以修改整个邮件的背景、字体或移动端断点。

### 2.2 拼接器生成的完整模板内容

用于 `Saved Templates → Import Template → Paste in code`，也可将同一内容保存成 `.html` 后上传。

安全模式下仍输出“完整邮件正文片段”，而不是网页文档：

- 不输出 `<!DOCTYPE>` 和 `<head>`。
- 建议不输出 `<html>` 和 `<body>`，以便同一产物也能通过片段验证器。
- 拼接器负责唯一的 100% 外层背景表格和 600px 内容容器。
- 优先使用 `Paste in code`；上传文件时文件后缀必须为 `.html`。
- 不携带其他 ESP 的个性化、网页查看或退订标签；完整 HTML 模板使用经过审核的品牌页脚时，只允许保留唯一一个 Omnisend `[[unsubscribe_link]]`。

## 3. HTML 标签策略

### 3.1 允许标签

布局标签：

```text
table, tr, td, th
```

内容标签：

```text
a, p, br, span, strong, b, em, i, u, s, del,
h1, h2, h3, h4, h5, h6, img, ul, ol, li, hr
```

约束：

- `<span>` 只能修饰行内文字，不能用于布局。
- `<p>`、标题、列表必须显式重置 `margin`、`padding`、字号和行高，不能依赖邮箱默认样式。
- 布局表格建议设置 `role="presentation"`。
- 不使用 `<thead>/<tbody>/<tfoot>`，除非内容确实是数据表格。

### 3.2 禁止标签

以下标签出现即阻断构建：

```text
doctype, html, head, body, link, style, script, iframe,
div, font, video, audio, object, embed, form, input,
button, canvas, svg
```

补充禁止项：

- 所有 `on*` 事件属性，例如 `onclick`、`onload`。
- JavaScript URL，例如 `href="javascript:..."`。
- 依赖 JavaScript 的倒计时、商品加载或交互。
- iframe 视频、表单、Canvas 和客户端动态请求。

如果业务需要 SVG、视频或复杂动画，应转换为托管的 PNG/JPG/GIF 预览图，并链接到网页。

## 4. CSS 安全规范

### 4.1 强制规则

- 所有关键样式使用元素的 `style="..."` 内联声明。
- 每条 CSS 属性单独书写，不使用复合缩写。
- 颜色统一使用六位十六进制，例如 `#000000`，不用 `#000`。
- 使用邮件安全字体：`Arial, Helvetica, sans-serif`、`Georgia, Times New Roman, serif`。
- 设置明确的 `font-size`、`line-height`、`font-family`、`color` 和 `text-align`。
- 表格同时使用 HTML 属性和必要的内联 CSS，例如 `width`、`cellpadding`、`cellspacing`、`border`、`align`、`valign`。
- 背景图片必须同时提供 `background-color` 降级；关键内容不得只存在于背景图片中。

### 4.2 禁止或不得作为关键能力

禁止：

```text
display:flex
display:grid
position:absolute/fixed/sticky
float
clear
CSS variables
@font-face
box-shadow
border-image
复杂选择器或伪元素
```

不得作为关键布局依赖：

```text
@media
max-width / min-width
background-image / background-size / background-position
border-radius
固定 height
letter-spacing
```

上述“不得依赖”属性可以作为渐进增强，但移除后必须仍能阅读、点击和完成转化。

### 4.3 响应式策略

- Custom HTML 组件的关键内容必须在没有媒体查询时仍然可用。
- 图片使用明确的 `width` 属性，并配合 `style="display:block; width:100%; height:auto;"`。
- 优先采用单列或简单流式布局。
- 需要可靠移动端堆叠、设备显隐或复杂多列重排时，优先使用 Omnisend 原生 Layout，而不是在 Custom HTML 中实现。
- 完整导入模板若必须使用媒体查询，应视为“兼容增强”，并单独测试 Gmail、Apple Mail、Outlook Web 和经典版 Outlook Windows。

## 5. 表格布局规范

所有组件使用以下结构：

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
  <tr>
    <td align="center" valign="top" style="padding:0;">
      <!-- component content -->
    </td>
  </tr>
</table>
```

规则：

- 一个组件只能有一个根表格。
- 组件根表格宽度为 100%，不能创建新的 `<body>` 级容器。
- 组件内部固定宽度不能超过宿主容器宽度。
- 默认邮件内容宽度为 600px。
- 间距使用 `<td style="padding:...">`，不要依赖元素默认 margin。
- 空白间距优先使用单元格 padding；必要时使用独立 spacer 行。
- 不用空图片、连续 `<br>` 或不可见字符制造间距。
- 所有标签必须正确闭合；禁止浏览器自动纠错才能成立的结构。

## 6. 图片规范

每张图片必须：

- 使用公开可访问的绝对 HTTPS 地址。
- 禁止本地路径、相对路径、`file://`、`data:` 和临时预览 URL。
- 包含有意义的 `alt`；纯装饰图片使用 `alt=""`。
- 写明 `width`；已知时同时写明 `height`，减少加载时布局跳动。
- 使用 `display:block` 去除图片底部空隙。
- 不依赖图片表达全部正文或 CTA。
- 不使用只在登录状态下可访问的 CDN 地址。

推荐写法：

```html
<img
  src="https://cdn.example.com/email/hero.jpg"
  width="600"
  alt="Summer collection"
  style="display:block; width:100%; height:auto; border:0; outline:none; text-decoration:none;"
>
```

## 7. 链接与按钮规范

- `href` 必须是完整的 `https://`、`mailto:` 或 `tel:` 地址。
- URL 属性中的 `&` 写成 `&amp;`。
- 禁止空 `href`、`href="#"` 和 JavaScript URL。
- 图片链接必须由 `<a>` 包裹 `<img>`，不得嵌套两个 `<a>`。
- CTA 使用 HTML 文字按钮，不使用图片按钮。
- 点击区域建议至少 46×46px。
- 按钮背景和内边距放在 `<td>` 上，链接同时设置 `display:block`，降低 Outlook 对链接 padding 支持不一致的影响。
- `border-radius` 只能作为增强效果；即使 Outlook 显示为直角也必须可接受。

推荐写法：

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" bgcolor="#1D1D1F" style="background-color:#1D1D1F; padding:14px 24px;">
      <a href="https://example.com/collection" style="display:block; color:#FFFFFF; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:20px; font-weight:bold; text-decoration:none;">
        Shop now
      </a>
    </td>
  </tr>
</table>
```

## 8. 文案、动态变量与安全转义

- 文案数据默认按纯文本处理并进行 HTML 转义。
- 只有经过审核的字段才允许写入 HTML。
- 不允许用户输入控制标签名、属性名或 `style` 内容。
- 动态 URL必须校验协议并进行属性转义。
- Omnisend `[[ ... ]]` 个性化标签必须作为受保护 token 处理，拼接、清理和压缩过程不得修改其括号、引号或过滤器。
- 不得自行发明 Omnisend 变量；变量名称和过滤器必须来自当前账户编辑器或官方文档。
- 从 Mailchimp、Klaviyo 等平台迁移时，删除原平台的个性化、网页查看和退订标签，再通过 Omnisend UI 配置对应能力。
- 普通组件中不硬编码退订链接；平台级页脚由 Omnisend 或已审核的品牌页脚负责。审核页脚只允许精确的 `[[unsubscribe_link]]`，并且整封邮件只能出现一次。

## 9. Custom HTML 验证占位段

Omnisend 官方文档提示，不应删除验证所需的空 `<p></p>`。为避免默认段落间距影响布局，部署适配器可在组件根表格内部的最后一个 `<td>` 中保留零尺寸验证段：

```html
<p style="margin:0; padding:0; font-size:0; line-height:0;"></p>
```

该段不能作为根表格之外的第二个根节点。如果当前 Omnisend 账户保存和预览均不要求该段，可由部署适配器关闭；不能由普通组件自行决定删除。

## 10. 组件接口约定

每个组件至少提供：

```json
{
  "name": "hero",
  "version": "1.0.0",
  "target": "omnisend-html-block",
  "props": {
    "imageUrl": "https://cdn.example.com/email/hero.jpg",
    "imageAlt": "Summer collection",
    "headline": "Summer starts here",
    "ctaLabel": "Shop now",
    "ctaUrl": "https://example.com/collection"
  }
}
```

组件实现必须满足：

- 相同 props 生成确定性一致的 HTML。
- 不能访问网络、读取浏览器状态或在邮件客户端运行代码。
- 不能输出 document 级标签。
- 不能改变其他组件的样式。
- 不能依赖组件拼接顺序才能闭合标签。
- 未提供的必填 props 必须构建失败，不能生成空链接或猜测文案。
- 所有图片、链接和 alt 文本都由显式 props 提供。

## 11. 拼接器输出规范

拼接器按以下顺序处理：

1. 校验组件 schema 和必填字段。
2. 对普通文案进行 HTML 转义。
3. 校验和转义 URL。
4. 渲染每个组件的单根表格片段。
5. 按配置顺序拼接组件。
6. 完整模板模式下添加唯一的外层背景表格和 600px 内容表格。
7. 保护并校验 Omnisend token。
8. 执行 HTML 结构校验和禁止项扫描。
9. 生成未压缩审阅版与最终导入版。
10. 在 Omnisend 中导入、保存、预览并发送真实测试邮件。

禁止拼接器：

- 自动把网页 DOM/Flex/Grid 转成“看起来相近”的邮件代码后直接发布。
- 自动删除无法识别的 Omnisend token。
- 自动补造缺失链接、优惠条件或个性化字段。
- 合并标签时跨组件移动 `<tr>`、`<td>` 或关闭标签。
- 用正则表达式直接重写任意 HTML 结构。
- 在未知错误后自动发布或发送。

## 12. 构建阻断规则

以下任一情况必须阻断导出：

- 出现禁止标签或 `on*` 事件属性。
- 出现 `<!DOCTYPE>`、`<head>`、`<link>`、`<style>` 或 `<script>`。
- 出现相对图片 URL、HTTP 图片 URL或本地路径。
- `<img>` 缺少 `src` 或 `alt`。
- `<a>` 缺少有效 `href`。
- 出现 `javascript:`、`data:` 或未知 URL 协议。
- 出现未闭合、错误嵌套的 table/tr/td。
- 组件存在多个根节点或跨组件闭合标签。
- Omnisend token 不完整或被转义。
- 从其他 ESP 迁移的退订、网页查看或个性化 token 未清理。
- 拼接后内容为空。

以下情况生成警告，但可在人工确认后继续：

- 使用背景图片、圆角、媒体查询、固定高度或复杂多列。
- 图片没有明确 `height`。
- 组件宽度接近或超过 600px。
- 使用非系统字体。
- 使用 `<span>`、列表或标题默认样式风险较高。

## 13. 导入前检查清单

### 静态检查

- [ ] 无 DOCTYPE、html、head、body、style、link、script。
- [ ] 无 div、iframe、font、video、audio、object、embed。
- [ ] 所有布局为 table/tr/td。
- [ ] 所有关键 CSS 已内联。
- [ ] 所有图片为公开 HTTPS 地址并含 alt。
- [ ] 所有链接有效且已正确转义。
- [ ] 无空链接和嵌套链接。
- [ ] 所有文案与链接和需求数据一致。
- [ ] 所有 Omnisend token 原样保留。
- [ ] HTML 标签闭合和嵌套正确。

### Omnisend 检查

- [ ] Custom HTML 区块可以保存且不会消失。
- [ ] Desktop Preview 正常。
- [ ] Mobile Preview 正常。
- [ ] Dark Mode Preview 可读。
- [ ] 图片关闭时 alt 文本仍能传达含义。
- [ ] Gmail、Outlook、Apple Mail 测试邮件正常。
- [ ] 所有 CTA、商品链接、网页查看和退订路径有效。
- [ ] 动态变量使用真实测试联系人或真实测试分群验证。

## 14. 最小安全组件示例

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:#FFFFFF;">
  <tr>
    <td align="center" valign="top" style="padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td align="left" style="padding:0 0 12px 0; color:#1D1D1F; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:32px; font-weight:bold;">
            Component headline
          </td>
        </tr>
        <tr>
          <td align="left" style="padding:0 0 20px 0; color:#4A4A4A; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:24px;">
            Component body copy.
          </td>
        </tr>
        <tr>
          <td align="left" style="padding:0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#1D1D1F" style="background-color:#1D1D1F; padding:14px 24px;">
                  <a href="https://example.com/" style="display:block; color:#FFFFFF; font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:20px; font-weight:bold; text-decoration:none;">
                    Learn more
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:0; padding:0; font-size:0; line-height:0;"></p>
    </td>
  </tr>
</table>
```

## 15. 发布边界

通过静态规则不等于已经验证兼容。只有同时满足以下条件，才能标记为“Omnisend 可发布”：

1. Omnisend 成功导入和保存。
2. Desktop、Mobile、Dark Mode 预览通过。
3. Gmail、Outlook、Apple Mail 的真实测试邮件通过。
4. 链接、图片、个性化和法定页脚均通过人工检查。
5. 最终发布仍由具备权限的人在 Omnisend 中确认。

任何未完成真实导入验证的产物只能标记为“符合静态规范”，不能声明“已安全完整导入”。

## 16. 官方依据

- Omnisend：Add & Configure Custom HTML Item
  https://support.omnisend.com/en/articles/1061866-add-configure-custom-html-item
- Omnisend：Import Custom HTML Email Templates
  https://support.omnisend.com/en/articles/2964086-import-custom-html-email-templates
- Omnisend：Understand Email HTML Basics
  https://support.omnisend.com/en/articles/1061843-understand-email-html-basics
