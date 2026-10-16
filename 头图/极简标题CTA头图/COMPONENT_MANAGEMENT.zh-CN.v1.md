# 极简标题CTA头图（`hero.minimalTitleCta`）

以用户提供的 IRIS 邮件参考图为依据，复现奶油底色画布、衬线大标题、居中副标题、暗红实底 CTA 与下方大图的极简头图版式。没有顶部导航、Logo 或 Shopify 导入功能，是最轻量的头图组件。

## 可编辑字段

| 字段 | 默认值 / 用途 |
| --- | --- |
| `hero.title` | IRIS；Lora Regular 衬线主标题，建议保持单行短文案 |
| `hero.subtitle` | Rich linen texture…；Montserrat Medium 副标题，按画布宽度自动换行 |
| `hero.cta.text` | SHOP NOW；实底按钮内的文字 |
| `hero.cta.url` | 按钮点击后打开的公开 HTTPS 页面；默认 `https://freshinelife.com/`，正式使用时替换为实际活动页 |
| `hero.image.url` | 下方大图；填写公开 HTTPS 图片地址或上传替换 |
| `hero.image.alt` | 大图无法显示时供读屏工具识别的简短说明 |
| `hero.image.clickUrl` | 大图整图点击链接，独立于按钮链接；默认 `https://freshinelife.com/` |
| `color.surface` | 组件底色，默认 `#F7ECDE` 奶油色 |
| `color.title` | 主标题颜色，默认 `#1F1F1F` |
| `color.body` | 副标题颜色，默认 `#5F5F5F` |
| `color.action` | 按钮底色，默认 `#9C1C23`；按钮文字固定白色 |

按钮链接与大图链接是两个独立字段，不自动同步；修改活动地址时需分别检查。

## 固定版式与响应式

- 居中 600px 上限画布；内容左右页边距统一为 `47px`，上下内边距为 `36px / 40px`（底部保留 40px 留白），375px 下按 62.5% 等比收缩为 `22.5px 29.375px 25px`。
- 主标题使用 Lora `36px / 400 / 54px`，字间距 `0px`、居中；副标题使用 Montserrat `16px / 500 / 24px`，字间距 `0px`、居中，位于标题下方 `24px`。不支持 Web 字体的客户端回退 Georgia / Arial。
- CTA 按钮采用防弹按钮写法：内边距 `13px 30px` 放在 `display:block` 的链接上（而非 `<td>`），使整个红色按钮区域均为点击热区，而非仅文字可点；`<td>` 仅保留底色与 `2px` 圆角（仅增强，不支持圆角的客户端显示直角）。按钮文字 Montserrat `16px / 600 / 20px`、字间距 `1px`、白色，位于副标题下方 `24px`。375px 下整高约 35.5px，仍高于 44px 触控建议的部分场景请保持文案简短。
- 大图通过 `width:100%;max-width:506px;height:auto` 流式保持比例，不裁切、不强制高度；与文本列同宽（600px 画布减去左右各 47px 页边距后的 506px），位于按钮下方 `28px`。默认图片为 Freshine CDN 公开 HTTPS 地址（1600px 宽源图），替换任意比例图片时组件自动适配高度。
- 标题、副标题、按钮之间的间距（`24px / 24px / 28px`）随 375px 按 `min()` 等比收缩；图片为纯流式比例，不写无意义的 `min()`。
- HTML 为单根 presentation table、嵌套表格及行内 CSS；不影响相邻组件。

## 重建与验证

运行 `node 头图/极简标题CTA头图/render-demo.mjs`，从默认 fixture/settings 通过正式拼接器生成 `效果演示.html`，避免维护第二套排版。

回归：`node --test tests/minimal-title-cta.test.mjs`；全量验证见仓库新组件规范。编辑器通过 `组件清单.json` 注册，并在“头图”下选择本组件。

## 兼容性边界

不支持 Web Font 的邮件客户端回退 Georgia / Arial；圆角在旧版 Outlook 中降级为直角。浏览器预览不等于 Omnisend 或真实收件箱验证；未发送测试邮件、未上传素材、未修改线上 Campaign。正式导出前请确认按钮与大图链接均已替换为实际活动地址。
