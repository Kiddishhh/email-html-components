# 三图推荐（CTA+标题）

## 组件定位

- Component Key：`collection.romanShadeMultiRecommendation`
- 桌面画布：600px；目标移动画布：375px。
- 依据用户提供的“多类推荐 V”设计稿复现：顶部标题与两行说明、带独立折扣标的大场景图、两张独立跳转的智能遮阳产品图，以及描边 CTA。

## 可编辑内容

| 区域 | 字段 |
| --- | --- |
| 顶部 | `intro.title`、`intro.subtitle` |
| 主图 | `hero.image.*`、`hero.discountLabel` |
| 左下图 | `pair.left.image.*`、`pair.left.discountLabel` |
| 右下图 | `pair.right.image.*`、`pair.right.discountLabel` |
| CTA | `cta.text`、`cta.url` |

每张图片和 CTA 均为独立的公开 HTTPS 跳转。默认链接均带 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。默认图片使用用户指定的 Omnisend 公开图片 URL；右下默认源文件为 192×192px，按设计稿显示约 256px，保留原始内容，不生成替代图。

## 固定版式

- 组件底色默认 `#FCF9F5`；标题和主体文字 `#724E30`，折扣标 `#A71E22`，CTA 描边和文字 `#724E30`。
- 顶部依次为 42px 留白、Montserrat `30px / 500 / 38px` 标题、7px 间距、Montserrat `18px / 400 / 27px` 说明、9px 间距。
- 主图容器为 `536×595px`；下方双图为 `256×256px`、中间 20px；图片均保留原图比例及内嵌的权益、Matter/智能家居标识。
- CTA 为 536px 宽、2px 描边、66px 高的 Montserrat `18px / 500` 文字链接；375px 下保持单行并至少 44px 可点击高度。
- 使用 presentation table、内联 CSS 与 Outlook VML 背景图回退；不使用 JavaScript、Flex、Grid、绝对定位或外部 Web Font。375px 使用内联 `min()` 缩放，保持两列且不溢出。

## 同步与验证

模板、Schema、默认快照、演示和本说明位于当前目录；注册信息、编辑器字段说明、组件交互说明和回归测试同步在根目录与 Campaign Skill 下。运行 `node render-demo.mjs` 重建 `效果演示.html`，再运行组件测试、完整合约校验和全量回归。

本地浏览器预览不等同 Omnisend 或实际收件箱。正式投递前需在 Omnisend Desktop/Mobile 预览，并向 Gmail、Outlook、Apple Mail 发测试邮件。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：intro.title
- subtitle：intro.subtitle

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
