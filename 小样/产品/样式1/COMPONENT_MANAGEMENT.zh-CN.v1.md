# 产品样式1组件管理说明（V1）

- Component Key：`product.sampleStyle1`
- 当前状态：已注册到 Campaign 可视化编辑器，并开放图片、文案、链接和常用颜色字段。

## 用途与版式

该组件用于单品展示：600px 邮件画布上的主视觉、覆盖主图右下的材质图，以及产品标题、副标题与 CTA。桌面参考宽度为 600px，移动端检查目标为 375px；所有内容保持在流式表格内。

## 可替换内容

- `product.mainImage.url` / `product.mainImage.alt`：主图与替代文本。
- `product.detailImage.url` / `product.detailImage.alt`：右下材质图与替代文本。
- `product.title`：产品标题。
- `product.subtitle`：产品副标题。
- `product.cta.text` / `product.cta.url`：按钮文案与 HTTPS 目标链接。

两张图片都是 `image-source`。本地预览可在 composition 的 `assets` 中登记后使用 `asset://product-main` 与 `asset://product-detail`；正式 Omnisend HTML 前必须由固定上传流程转换为公开 HTTPS 图片。

## 小样框与移动端排版

小样框最大宽度为 202px，并以 56px `position:relative` 位移覆盖主图右下；不支持该位移的客户端会按正常文档流放在主图之后。框体使用 4px 暖白留边、`color.detailBorder` 细描边与 `color.detailShadow` 单层右下投影，不依赖 `box-shadow`。

桌面端采用左侧产品信息、右侧小样框的紧凑双栏；当前受邮件安全构建规则限制，375px 端按比例缩放该表格。若需独立的移动端单列结构，必须先启用受限的响应式 CSS 契约。

## 设置与维护

默认表面色为 `#F8F5F1`，主图最大宽度为 548px；下半区使用 42px 内容边距，小样框最大宽度为 202px，叠加距离为 56px，并使用 4px 右下投影。修改任何字段、默认素材或比例时，必须同步模板、CSS、Schema、fixture/defaults、效果演示、注册表、索引、README 和测试。

默认文字规范：标题为 Montserrat SemiBold（600）、桌面 22px / 375px 20px、150% 行高、0px 字间距、左对齐；副标题为 Montserrat Regular（400）、桌面 17px / 375px 14px、150% 行高、0px 字间距、左对齐；CTA 为 Montserrat Medium（500）、桌面 16px / 375px 15px、15px 行高、0px 字间距、文字居中。使用固定桌面值后叠加 `min()` 响应式值；不支持该函数的客户端保留桌面字号。邮件客户端未安装 Montserrat 时会回退至 Arial / Helvetica / sans-serif。

## 编辑器边界

组件可在 Campaign 可视化编辑器中自由添加、重复、排序或删除。编辑器开放“可替换内容”中的全部字段，以及 `color.surface`、`color.title`、`color.subtitle`、`color.action`、`color.detailFrame`、`color.detailBorder` 和 `color.detailShadow`；其余尺寸、间距和字体保持当前组件设计。

## Omnisend 验收边界

模板仅使用 Omnisend 可接受的表格、图片、链接和内联 CSS；但本组件选择视觉优先的相对位移实现，Windows Outlook 可能忽略位移而让小样图按正常流显示。本地静态与浏览器检查只表示符合静态规范；正式使用前仍需 Omnisend Desktop/Mobile/Dark Mode 预览，以及 Gmail、Outlook、Apple Mail 测试邮件。
