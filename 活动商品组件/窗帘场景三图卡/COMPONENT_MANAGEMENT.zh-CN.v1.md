# 窗帘场景三图卡组件管理说明（V1）

## 组件定位

- 中文名称：窗帘场景三图卡
- Component Key：`collection.curtainEditorialTriptych`
- 桌面画布：600px；大图内容区为 `538px`，下方双图内容区为 `524px`。
- 移动端目标：375px；所有图片按各自容器等比缩小，双图仍保持并列关系。

该组件复现“Dining Room”设计稿：上方是一张带设计稿内嵌 CTA 的大场景图；其下为两张各自可点击的竖图和文字链接；底部是居中标题与说明。默认 JPEG 均为根据用户提供设计稿裁切的本地预览素材。

## 内容字段

| 区域 | 字段 | 说明 |
| --- | --- | --- |
| 大场景图 | `hero.image.url` / `.alt` / `.clickUrl` | 538×536 桌面大图与独立跳转。默认图内保留设计稿原有 “Liana Sheer Curtains >>” 字样。 |
| 左下 | `pair.left.url` / `.alt` / `.clickUrl` / `.caption` | 左侧 256×319 竖图、独立跳转和图片下方文字链接。 |
| 右下 | `pair.right.url` / `.alt` / `.clickUrl` / `.caption` | 右侧 256×319 竖图、独立跳转和图片下方文字链接。 |
| 底部文案 | `intro.title` / `intro.subtitle` | 居中标题和说明。 |

默认 `asset://` 地址仅用于本地预览；最终 Omnisend HTML 中三张图及三个链接均须替换为公开 HTTPS 地址。

## 固定版式

- 外层在 600px 画布内上留白 `38px`。大图容器为 `width:89.667%; max-width:538px`，桌面尺寸 `538×536px`。
- 大图与下方双图间距 `35px`；双图容器为 `width:87.333%; max-width:524px`，两列各 `256×319px`，中间间隔 `12px`。
- 双图与下方文字链接间距 `16px`；链接使用 Montserrat `16px / 500 / 22px`，居中显示。
- 文字链接区与底部标题间距 `40px`。底部标题与说明均为 Montserrat `500（Medium）`、`letter-spacing:0px`、居中对齐；桌面标题为 `30px / 150%`、说明为 `16px / 150%`，在 375px 画布中通过 `min()` 分别渐进缩至 `26px`、`14px`（不支持该规则的邮件客户端保留桌面回退）。标题与说明间距 `20px`；说明下方留白 `36px`，接居中 `524px`（移动端 `87.333%`）宽、`#E2DEDB` 的 `1px` 分割线，再留白 `37px`。
- 大图、双图与三个点击链接均使用独立的邮件安全 `<a>`；不得使用定位、Flex 或 Grid 重建叠层。

## 同步文件与验证边界

- 模板、Schema、默认数据、样式、`效果演示.html` 和本说明位于当前组件目录；组件还登记在 `组件清单.json`、`组件索引.md`、编辑器字段契约与组件交互说明中，并已作为 HTML 编辑器的自由组合样式可选。
- `效果演示.html` 仅供浏览器在 600px / 375px 视觉检查，不能直接导入 Omnisend。
- 静态校验和本地预览不等同于 Omnisend 或收件箱渲染。发布前仍需在 Omnisend Desktop/Mobile 预览，并向 Gmail、Outlook 和 Apple Mail 发测试邮件。
