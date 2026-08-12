# 促销悬浮首图默认 Logo 样式设计

## 目标

在不改变 `hero.promotionalOverlay` 原有 Logo 尺寸与布局的前提下，把 Pixso 参考图中的白色字标和半透明圆底作为组件默认样式；同时在 Campaign Skill 中增加独立 Logo 样式确认步骤。

## 默认视觉

- 圆形徽章保持旧版 `106 × 106px`，在 600px 邮件画布中水平居中。
- 圆形默认实体降级色保留当前 `#A79689`。
- 支持透明色的客户端使用 `rgba(167, 150, 137, 0.70)`，即默认透明度 70%。
- FreShine 字标固定为白色透明 PNG，保持旧版最大宽度 `80px`，在圆形内水平和垂直居中。
- Logo 点击链接默认保持 `https://freshinelife.com/`。
- 圆形顶部间距保持旧版 `48px`。

## 邮件兼容策略

圆形外层继续使用 table 布局：

- `bgcolor="#A79689"` 与 `background-color:#A79689` 作为 Outlook 等不支持 RGBA 客户端的实体降级色；
- 随后的 `background-color:rgba(167, 150, 137, 0.70)` 供支持透明色的客户端覆盖；
- 不使用 CSS `opacity`，避免白色字标跟随背景一起变透明；
- 不使用 CSS filter、SVG、伪元素、Flex、Grid、绝对定位或 JavaScript；
- 使用真实白色透明 PNG，避免不同邮件客户端用系统 cursive 字体重绘品牌字形。

## 数据契约

保留现有内容字段：

- `hero.logo.url`
- `hero.logo.alt`
- `hero.logo.clickUrl`

默认 `hero.logo.url` 改为组件目录中的白色透明字标资源，并通过 `asset://` 进入本地预览；最终 Omnisend HTML 前必须由固定上传脚本替换为公开 HTTPS URL。

设置字段调整为：

- `color.logoBadge`：实体降级色，默认 `#A79689`；
- `color.logoBadgeTransparent`：透明圆形色，默认 `rgba(167, 150, 137, 0.70)`；
- `spacing.logoTop`：默认 `48px`；
- `logo.maxWidth`：默认 `80px`。

圆形直径 `106px` 和圆角半径 `53px` 属于原有固定布局，不向 Campaign 用户开放为常用设置。

修改默认值时必须同步：模板、CSS、内容 fixture、设置 defaults、内容/设置 Schema、管理说明、`效果演示.html`、默认六组件 composition 和测试。现有历史 Campaign 草稿保持不可变，不追溯改写已确认内容哈希。

## Skill 交互

在首图主视觉图片确定后、首图完整完成卡片之前，增加一次独立“Logo 样式确认”：

1. 读取组件默认白色字标、`#A79689` 和 70% 透明度；
2. 展示圆形 Logo 卡片、桌面端预览和约 375px 移动端预览；
3. 明确显示 `#A79689`、中文颜色描述、70% 透明度和 Outlook 实体色降级说明；
4. 只询问一次是否采用默认 Logo 样式；
5. 用户采用时写入完整默认快照并锁定 Logo 样式；
6. 用户修改时只允许提供新的 `#RRGGBB` 底色和 0–100% 透明度，Skill 确定性换算对应 RGBA 后重新生成三项预览；
7. 白色字标、106px 圆形和 80px 字标宽度保持组件默认设计，不在常规交互中修改。

Logo 样式确认不替代首图最终确认。首图最终完成卡片仍统一展示背景图、顶部促销条、活动文案、CTA 和已经锁定的 Logo 样式。

## 测试与完成条件

采用测试先行：

- 先添加失败测试，断言圆形直径、圆角、白色本地字标、实体降级色、RGBA 透明色和默认尺寸；
- 先添加失败 Skill 契约测试，断言 Logo 样式有独立确认步骤、颜色与透明度可修改且只询问一次；
- 实现后重新生成 `效果演示.html` 和默认六组件本地预览；
- 验证本地 Logo 资源相对于预览文件可解析，最终构建仍阻止未上传的 `asset://`；
- 完整 Node 测试套件、脚本语法、Campaign 契约校验和 Skill 校验全部通过；
- 静态/本地预览验证不等于 Gmail、Outlook 和 Apple Mail 的真实邮件测试，最终使用前仍须进行 Omnisend 预览与测试邮件检查。
