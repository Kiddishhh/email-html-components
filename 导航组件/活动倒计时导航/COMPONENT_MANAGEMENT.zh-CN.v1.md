# 活动倒计时导航（`navigation.eventCountdown`）

这是注册在“导航组件”分类中的静态活动倒计时、三项权益和 CTA 区块。组件高度还原用户提供的 600px 邮件代码模板，并在 375px 窄屏中使用 inline `min()` 等比缩放。

## 可编辑内容

- `countdown.title`：静态倒计时标题，默认 `ONLY 3 DAYS!`。可修改文字，但不会按日期自动递减。
- `benefit.1.text` / `benefit.2.text` / `benefit.3.text`：三项权益文案。
- `promotion.cta.text` / `promotion.cta.url`：活动按钮文案和公开 HTTPS 链接。

## 可编辑颜色

- `color.surface`：组件背景色，默认 `#F5F1ED`。
- `color.text`：倒计时标题、权益及两条分隔线颜色，默认 `#1F1F1F`。
- `color.action`：CTA 按钮底色，默认 `#8D1B1B`；按钮文字固定白色。

## 固定版式

桌面画布最大宽度为 600px，组件参考高度为 282px。标题使用 Lora `30px / 400 / 40px`、字间距 `0.7px`；三项权益使用 Montserrat `18px / 400 / 22px`，以两条 `1×20px` 竖线分隔；CTA 为 `334×55px`、3px 圆角，Montserrat `18px / 500 / 55px`。顶部、标题后、权益后和底部间距分别为 45px、34px、36px 和 50px。

模板仅使用邮件安全 table 与 inline CSS，不包含 JavaScript、Shopify 导入或运行时请求。组件已注册到 `组件清单.json` 和 Campaign HTML 编辑器；本地验证不等同于 Omnisend 保存或真实邮箱客户端测试。
