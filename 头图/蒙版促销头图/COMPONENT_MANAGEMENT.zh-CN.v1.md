# 蒙版促销头图（hero.maskedPromotion）

来自用户提供的 Columbus Day Sale HTML，在编辑器中归入“导航组件”结构，可自由添加、重复和排序。组件名称、componentKey 和文件路径保留，以兼容已有模板快照。默认文案、公开 Omnisend 背景图、裁切与 CTA 链接保持原稿。

## 固定版式

- 600×355px；375px 下约 375×221.875px。以 600px 为基准，对字号、行高、间隔和按钮高度使用固定 px 与 inline min() 等比覆写。
- 背景：`#7A6A60` 降级底色，固定 `rgba(122,106,96,0.48)` 蒙版，`multiply,normal` 混合；背景图 `100% auto`，位置 `center 25.263158%`，不拉伸原图。
- 活动标题 Georgia 500、18/23px；主优惠 Georgia 400、48/61px；副标题 Verdana 500、14/21px。全部居中，优惠和副标题保留单行；替换文案应保持短句并检查移动预览。
- 上方88px、三处16px间隔、下方74px；白色 CTA 最大183×40px，宽30.5%，Verdana 600、16/40px。375px CTA约114.375×25px，按原稿等比缩放。
- 仅 CTA 可点击；背景图和标题没有链接，无导航、Logo 或 Shopify 导入。

## 编辑字段

7个内容字段：背景图URL、背景图说明、活动标题 `hero.heading`、优惠主标题 `hero.title`、副标题、CTA文字、CTA HTTPS链接。活动标题字段使用 `heading`，使编辑器默认策略保留原稿Georgia。支持现有逐文案字体、颜色与间距控件。

4个颜色：图片降级底色 `color.surface`、三段文字颜色 `color.text`、按钮底色 `color.action`、按钮文字色 `color.actionText`。底色不改变固定蒙版颜色和透明度。

默认按钮：
`https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=Columbus_Day_Sale`

保留 `Columbus_Day_Sale` 的大小写与下划线；输出属性中的查询分隔符转义为 `&amp;`。背景默认使用原公开HTTPS地址，可替换地址或使用编辑器已有本地素材流程。

## 邮件输出与验证

模板和演示不加载Google Fonts；原稿未使用的Lora/Montserrat样式表已移除。Georgia/serif、Verdana/sans-serif与核心表格布局均内联。附加HTML background属性提供背景图降级；客户端忽略渐变/混合时显示原背景图，图片屏蔽时保留底色与可读文字。保留现有Omnisend HTTPS图片、退订令牌与Draft-only输出流程。

检查600px/375px演示和编辑器预览；浏览器验收不证明Outlook、Gmail、Apple Mail或Omnisend收件箱中的蒙版效果相同。新组件注册不进行外部上传、发布或发送。
