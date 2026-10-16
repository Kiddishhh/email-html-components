# Support Card — Pixso 295:3573

## 输出与处理

- HTML 原始导出：0_0.html；资源下载后保存。
- 一对一清理参考：pixso-reference.html；仅删除未引用节点 ID，DOM/CSS 类名成对改名，CSS 声明及类 token 数保持一致。
- 邮件适配：component.html；采用内联 table/tr/td，图标使用用户提供的公开 PNG；增加 tel、mailto 和经过浏览器核验的 HTTPS 聊天链接。
- 对照预览：effect-preview.html；600px / 375px iframe，预览单独加载本地 Montserrat 400/500 字体。
- 已取得所选节点截图，按截图与导出参数适配。未重新设计布局、配色或文案。

| 清理项 | 发现 | 删除/替换 | 保留 |
| --- | ---: | ---: | ---: |
| 资源处理后的临时 URL | 0 | 0 | 0 |
| 无引用 Pixso 节点 ID | 15 | 15 | 0 |
| Pixso/节点数字类名 | 18 | 18 | 0 |

已下载 3 项资源：原始 SVG、Montserrat Regular/Medium 两个字体。最终邮件片段仅使用用户提供的公开图标 URL，不依赖本地字体或 SVG。预览/参考使用本地资源。未经引用的导出动画脚本留在原始参考中，不进入邮件片段。

## 布局

- 邮件容器 width:100%; max-width:600px。
- 卡片宽度为容器的 90.333333%，桌面 542px；375px 容器下理论宽度 338.75px。
- 蒙版/背景色：无。外层、中层、卡片均透明，仅 1px #E3E0DE 边框及 8px 圆角。
- 标题 Montserrat 18/27px 500；描述 12/18px 400；联系链接 12/18px 500，#0057B8。
- 沿用项目比例缩放约定，CSS min() 提供增强，前置固定字号提供降级；不支持时移动端可能换行。
- 无反色抵消、blend mode、filter、强制暗色规则。

## LiveChat 核验

在 freshinelife.com 公共网页 DOM 中识别到 LiveChat 插件：organization_id=3efb1757-ba25-4f16-8fa5-844db27ef883。

浏览器已打开并核验直达页：

https://direct.lc.chat/3efb1757-ba25-4f16-8fa5-844db27ef883?utm_source=omnisend&utm_medium=email&utm_id=Columbus_Day_Sale

窗口已展开，显示 Kevine / Product Expert，以及 Name、E-mail 和 Start the chat 表单。未填写信息、未开始会话、未发送消息。地址栏保留三项 UTM；不将其视为已确认 Shopify 或 LiveChat 的归因报告。

这是同一插件的独立聊天页，不是 Freshine 首页内气泡自动展开。未修改、发布网站主题。

官方说明：https://www.livechat.com/help/direct-chat-link/

## 验证边界

`node output/pixso-support-card-20261012/verify.mjs` 已通过：单根、闭合嵌套、公开图标、三项链接、UTM 转义、透明背景、无反色抵消、成对清理、三个资源存在。

本次没有完成本地浏览器视觉渲染、Omnisend 保存或真实 Gmail/Outlook/Apple Mail 测试，不能据此声明收件箱兼容已通过。Montserrat 缺失时使用 Arial/Helvetica，字宽及换行会不同；经典 Outlook 可能显示直角边框。暗色客户端仍可能自行处理文本颜色。
