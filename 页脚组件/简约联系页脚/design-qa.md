# 简约联系页脚设计 QA — 2026-09-01

## 对比目标与状态

- Source visual truth：`/Users/ww/Downloads/劳动节活动图/结尾/I.jpg`，1200×440px；对应 600×220px 邮件画布。
- Implementation：`footer.minimalContact`，`页脚组件/简约联系页脚`；默认状态复用既有页脚的七枚社媒图片与跳转链接。
- Implementation capture：`/private/tmp/minimal-contact-footer-1200-normalized.png`，1200×440px，来自本地 Campaign Editor 的独立预览并按浏览器 0.5 截图密度归一化。
- Desktop browser geometry：`clientWidth=scrollWidth=600`，组件 `600×221.5` CSS px。
- Mobile browser geometry：`clientWidth=scrollWidth=375`，组件 `375×239.484375` CSS px；预约说明在窄屏自然换行，未发生横向溢出。
- State：默认文案、默认颜色和默认链接；未上传、发送、排期、发布或写入 Omnisend。

## Full-view comparison evidence

已分别打开原参考图与浏览器渲染截图，并按相同的 1200×440px 密度检查整体层级、图标顺序、分割线、法律信息与退订链接。尝试将两张图制作成同一浏览器对照输入时，Browser 的 URL 安全策略禁止 `data:` 比较页；未采用绕过方式。

## Findings

- 无已知 P0/P1/P2 布局、溢出、链接或素材问题。
- [P3] 浏览器渲染的字体抗锯齿与位图参考图略有不同；邮件客户端字体替换也可能造成细微字宽差异。
- 同输入并排比较证据受浏览器安全策略阻断，不能按 Product Design 的同画面对照门槛标记为已通过。

## 五项视觉检查

- Fonts and typography：使用 Montserrat / Arial / Helvetica；地址 13/20px，预约说明与法律信息 12/18px，电话/邮箱 14/21px，退订链接 12/21px。
- Spacing and layout rhythm：桌面高度约 220px；地址、预约说明、电话/邮箱、社媒、496px 分割线、法律信息和退订链接的顺序与参考图一致。
- Colors and visual tokens：底色 `#F9F6EE`、正文 `#1F1F1F`、弱化文字 `#80776F`、链接 `#0057B8`、分割线 `#B59B8B`。
- Image quality and asset fidelity：没有新增或重绘素材；七枚图标使用现有公开 HTTPS 图片，并保留 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads 顺序与 24/24/23/24/24/24/23px 校正值。
- Copy and content：默认地址、预约限制、电话/邮箱、`@2026 Freshine. All Rights Reserved.`、`Freshine` 与 `Unsubscribe` 均按参考图输出；支持邮箱、七个社媒图标和退订链接为真实链接。

## 编辑器与回归证据

- 本地 Campaign Editor 中已从「页脚组件」选择并添加「简约联系页脚 · address-contact-social-legal」。
- 编辑器仅显示 `color.background`、`color.text` 与 `color.link` 三个可编辑项；内容、图标几何与弱化文字色均未开放。
- 聚焦测试 `tests/minimal-contact-footer.test.mjs`：2/2 通过。
- 编辑器服务测试 `tests/campaign-editor-server.test.mjs`：21/21 通过（允许本机端口绑定后重跑）。
- 组件契约校验：41 个已注册组件与 41 个编辑器组件一致，`status=valid`。
- `git diff --check` 通过。

## 验证边界

- 完整仓库测试另有一条既有的 `gift.doubleGiftAddressShowcase` 分类顺序断言未同步；它与本页脚无关。本页脚自身聚焦测试、服务测试和契约检查均通过。
- 本地编辑器/浏览器验证不等于 Omnisend 导出、真实邮件发送或 Gmail、Outlook、Apple Mail 收件箱验收。

final result: blocked
