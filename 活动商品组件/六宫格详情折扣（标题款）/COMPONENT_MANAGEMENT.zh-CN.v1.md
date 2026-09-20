# 六宫格详情折扣（标题款）V1

- Component Key：`collection.saleGrid6DetailWithTitle`；分类：活动商品组件。
- 以四宫格详情折扣（标题款）为基础的独立六商品版本，不改变原组件。
- 参考：用户提供的 `组合 2294.png` 及右上角圆形标签效果图。

## 布局与字体

600px 画布，519px 商品区；三行两列，每张商品图 247×247px，列间距 25px，行间距 26px。375px 保持两列，新增组件采用 62.5% 等比 inline min() 缩放。
标题：Lora / Georgia，30px、500、150% 行高、0px 字距、居中。
副标题：Montserrat，16px、500、150% 行高、0px 字距、居中，默认 #7C706A（rgba(124,112,106,1)）。
其他桌面卡片几何延续四宫格：图片后16px、商品名40px双行区、价格18px与原价15px、CTA 247×38px、底部80px。
圆标直径54px，距离图片上边11px、右边12px；上行 SAVE 为 Montserrat 12px/400/15px，下行百分比18px/700/22px。尺寸参考效果图中圆标与247px卡片的比例。

## 字段与主题色

顶部2个字段，六张卡片各8个字段，共50个内容字段：折扣标签、图片URL、Alt、商品链接、完整名称、现价、原价、CTA文案。
九种原有颜色全部保留：surface、heading、body、text、theme、badgeText、compareAt、cta、ctaText。color.theme 控制六个圆标底色；color.badgeText 控制圆标文字。CTA沿用独立色设置。
折扣继续编辑 saleItems[n].discountLabel：SAVE 40% 在渲染时拆为两行；数字百分比加粗，前缀仍可编辑。40% 自动使用 SAVE 前缀；其他纯文本安全转义输出。空值隐藏整枚圆标，避免无折扣商品留下空圆。

## 商品1–6导入

六个按钮使用页面内商品链接对话框（支持内置浏览器），复用 fetch-single-product.mjs 只读查询；读取期间禁用重复提交，失败可重试。逐格导入仅更新指定格的首图、Alt、完整商品名、链接、首个可售变体现价、有效划线价和计算后的折扣；保留CTA文案、顶部内容、其他五格和颜色。
商品链接保留原有查询参数，并设置 utm_source=omnisend&utm_medium=email&utm_id=cover-rc。只有图片（含叠加圆标区域）和CTA是链接；名称、价格无额外链接。
无有效划线价时清空原价和标签，不生成虚假折扣。导入后清除组件及整封邮件确认状态。
默认商品1–4沿用原组件样例快照；5–6暂复用1–2，便于导入真实目标商品。默认价格不是实时数据。

## 文件与验证

模板、Schema、默认快照、样式、演示、目录及编辑器字段同步注册。render-demo.mjs 使用统一拼接器生成演示；scripts/render-detail-discount-badges.mjs 仅由本组件启用。
使用邮件表格与inline CSS，保留商品背景图原有VML回退。圆角不受支持的邮箱可能显示方形标签；本地预览不等同于真实Outlook/Omnisend收件箱验证。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：promotion.title
- subtitle：promotion.subtitle
- caption：saleItems[0].name, saleItems[1].name, saleItems[2].name, saleItems[3].name, saleItems[4].name, saleItems[5].name

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
