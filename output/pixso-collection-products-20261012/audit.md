# Find Your Perfect Fit 六商品组件

设计来源：Pixso 当前选中节点 `293:4023`；HTML；原设计 600 × 1217px。

## 输出

- `0_0.html`：本地化并完成清理的 Pixso 原始参考。
- `component.html`：邮件正文片段，table 布局、内联样式、HTTPS 资源，无文档标签或脚本。
- `effect-preview.html`：独立浏览器预览，使用本地 Montserrat 字体。
- `product-sources.json`：六款商品的官网地址、图片、原价、现价及折扣。

## 清理审计

| 项目 | 发现 | 替换或移除 | 保留 |
| --- | ---: | ---: | ---: |
| 临时素材地址 | 8 | 8，本地化 6 张图及 2 个字体 | 0 |
| Pixso 节点 ID | 50 | 50，无外部引用 | 0 |
| Pixso 节点类名 | 50 | 50，DOM 和 CSS 成对重命名 | 0 |

原参考文件标题改为 h2，区域改为 section，类名 token 数量一致，移除了无内容脚本和未使用的动画脚本引用。class-map.json 保存了配对映射。

## 商品及排版

- 官网公开商品 .js 数据核对日期：2026-10-12。
- 商品顺序：Celina Linen Curtains、Celina Smart Roman Shade、Elara Smart Motorized Linen Roman Shade、Ilythra Cotton Linen Roman Shades、Marisol Linen Curtains、Orianne Smart Blackout Roller Shades。
- 对应折扣：50%、50%、45%、40%、50%、50%；按官网选中可售变体的 price / compare_at_price 计算并四舍五入。
- 商品展示名按设计稿简写；完整官网名称、图片及价格见 product-sources.json。设计未展示价格，因此正文中没有新增价格栏。
- 图片和商品名称分别链接到对应产品页，共 12 个商品链接；CTA 链接到 freshine-sale 活动页。
- 全部 13 个链接沿用 utm_source=omnisend、utm_medium=email、utm_id=Columbus_Day_Sale。
- 背景 #F5F1ED 限定在 600px 邮件容器中；标题 Georgia 30px/45px、400，副标题 Verdana 16px/24px、400；商品名 Montserrat 18px/22px、400；角标和 CTA Montserrat 18px、500。
- 六张官网图片都是方图，以 247px 卡宽展示。图片区域按设计稿使用 246/247px 高度；列间距 16px；模块桌面高度 1217px。

## 适配和验证边界

- 邮件表格布局是项目导入适配，单独保存于 component.html；不在原始导出清理步骤中重写布局。
- 为保留图片左上角的可编辑角标，图片使用表格 background 和内联背景图，设置了底色及完整可点击区域；关闭图片时商品名称仍可读、可点击。
- 官网图片可能与 Pixso 的手工裁切位置略有差异。Montserrat 在效果稿中使用本地字体；邮件客户端未载入 Montserrat 时回退到 Arial / Helvetica。
- 已对照 Pixso 截图、检查所用官网图片，并验证标签闭合、13 个 href、六组图片/折扣数据、临时地址清除及类名 token 数量。
- 375px 尺寸为比例计算结果，未进行本轮浏览器及真实收件箱渲染验证；经典 Outlook 的背景图片显示仍需真实测试邮件验证。
