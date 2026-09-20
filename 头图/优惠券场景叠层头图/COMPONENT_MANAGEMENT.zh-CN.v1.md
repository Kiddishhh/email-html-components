# 优惠券场景叠层头图管理说明

- `componentKey`：`hero.couponSceneOverlay`
- 分类：头图
- 默认主题：`coupon-scene-overlay`
- 默认变体：`promo-bar-centered-copy-coupon-cta-overlap-scene`
- 输出：600px 桌面画布；375px 窄屏按内联 `min()` 等比例收缩。

## 可编辑内容

- 顶部导航：促销文案、右侧链接文字与 HTTPS 链接；`navigation.visible` 可关闭整行导航。
- 文案：主标题、副标题、主 CTA 文字与 HTTPS 链接。
- 图片：完整优惠券图及 Alt、正方形场景图及 Alt。
- 颜色：组件画布、顶部导航、主标题、副标题、主 CTA 背景色。

默认主 CTA 为 `https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=cover-fs`。顶部 `SIGN UP` 独立使用导航链接，不与主 CTA 共用。

## 固定版式与字体

- 组件外部预览页保持白色；`#F5F2ED` 只用于 600px / 375px 组件画布内。
- 顶部导航为 56px 双栏：左 `75.5%`、右 `24.5%`。两侧均为 Montserrat Medium `16px / 20px / 500`、字间距 `0px`、居中，使用 `white-space: nowrap` 单行显示；右侧链接保留下划线。
- 主标题为 Montserrat Medium `36px / 54px / 500`；副标题为 Montserrat Medium `16px / 24px / 500`、`#7C706A`、居中。
- 完整优惠券图最大宽度 528px；正方形场景图为最大 `528×528px`。CTA 最大 `266×56px`，与场景图上沿重叠 28px，使用 Montserrat SemiBold `20px / 24px / 600`；窄屏仍保留至少 44px 的可触摸高度。
- 几何、间距、字体与叠层关系不在编辑器中开放，避免破坏邮件客户端兼容性。

## 素材与导出边界

默认优惠券和场景素材在 `assets/` 中，仅供本地演示使用。`asset://` 路径不能直接导出到 Omnisend；导出或上传前，编辑器内图片字段必须替换为公开 HTTPS URL。组件不执行 Shopify 导入、网络请求或运行时脚本。

## 本地验证

```bash
node 头图/优惠券场景叠层头图/render-demo.mjs
node --test tests/coupon-scene-overlay-hero.test.mjs
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

效果演示文件为 [`效果演示.html`](效果演示.html)。本地演示和编辑器目录验证不等同于 Omnisend 或实际收件箱客户端验证。
