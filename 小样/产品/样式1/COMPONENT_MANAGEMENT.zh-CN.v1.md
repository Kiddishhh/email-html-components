# 产品样式1组件管理说明（V1）

- Component Key：`product.sampleStyle1`
- 当前状态：已登记到通用组件库，尚未加入 Campaign Skill。

## 用途与版式

该组件用于单品展示：600px 邮件画布上的主视觉、左下标题/副标题/CTA，以及覆盖主图右下的小幅材质图。桌面参考宽度为 600px，移动端检查目标为 375px；所有内容保持在流式表格内。

## 可替换内容

- `product.mainImage.url` / `product.mainImage.alt`：主图与替代文本。
- `product.detailImage.url` / `product.detailImage.alt`：右下材质图与替代文本。
- `product.title`：产品标题。
- `product.subtitle`：产品副标题。
- `product.cta.text` / `product.cta.url`：按钮文案与 HTTPS 目标链接。

两张图片都是 `image-source`。本地预览可在 composition 的 `assets` 中登记后使用 `asset://product-main` 与 `asset://product-detail`；正式 Omnisend HTML 前必须由固定上传流程转换为公开 HTTPS 图片。

## 阴影与移动端降级

小图使用负上边距覆盖主图右下。它的投影由右侧和底部留白的 `color.detailShadow` 表格底板实现，不依赖 `box-shadow`。若邮箱客户端忽略负上边距，小图会自然位于文字右侧，标题、副标题与 CTA 仍可读可点击。

## 设置与维护

默认表面色为 `#F8F5F1`，主图最大宽度为 548px；下半区使用 42px 内容边距，小图外框宽度为 213px，叠加距离为 10px，右侧与底部 6px 阴影底板。修改任何字段、默认素材或比例时，必须同步模板、CSS、Schema、fixture/defaults、效果演示、注册表、索引、README 和测试。

默认文字规范：标题为 Montserrat SemiBold（600）、22px、150% 行高、0px 字间距、左对齐；副标题为 Montserrat Regular（400）、17px、150% 行高、0px 字间距、左对齐；CTA 为 Montserrat Medium（500）、16px、15px 行高、0px 字间距、文字居中。邮件客户端未安装 Montserrat 时会回退至 Arial / Helvetica / sans-serif。

## Skill 边界

尚未加入 Campaign Skill。待用户确认最终样式，并另行确认数据来源、字段映射、失败处理和完成卡片后，才可注册到 Campaign 的交互结构中。

## Omnisend 验收边界

本地静态与浏览器检查只表示符合静态规范；正式使用前仍需 Omnisend Desktop/Mobile/Dark Mode 预览，以及 Gmail、Outlook、Apple Mail 测试邮件。
