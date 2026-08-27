# 活动促销 CTA（`navigation.promotionCta`）

这是放置在“导航组件”分类中的独立活动文案与 CTA 区块，复现参考稿的 600px 居中表格、分隔线、三层居中文案和描边胶囊按钮。

## 可编辑内容

- `promotion.title`：活动名称。
- `promotion.divider.url` / `promotion.divider.alt`：标题下方的公开 HTTPS 分隔图及说明。
- `promotion.offer`：大号折扣主文案。
- `promotion.body`：活动补充说明。
- `promotion.cta.text` / `promotion.cta.url`：CTA 文字与公开 HTTPS 跳转链接。

## 可编辑颜色

- `color.surface`：组件背景色，默认 `#F5EFDF`。
- `color.text`：标题、折扣与说明文字色，默认 `#1F1F1F`。
- `color.action`：CTA 描边与文字主题色，默认 `#8D1B1B`。

## 固定版式

桌面画布上限为 600px；上下各 45px 留白。标题为 Montserrat `30px / 600 / 37px`，折扣为 `50px / 700 / 62px`，说明为 `18px / 400 / 27px`，CTA 外框为 `284×55px`。375px 窄屏通过原参考代码中的 inline `min()` 等比缩小，不使用媒体查询、Flex 或 Grid。

模板仅使用邮件安全 table、inline CSS、公开 HTTPS 图片和链接；不包含 Shopify 导入、脚本或运行时请求。完成本地预览后，仍需在 Omnisend 与实际邮箱客户端完成发布前测试。
