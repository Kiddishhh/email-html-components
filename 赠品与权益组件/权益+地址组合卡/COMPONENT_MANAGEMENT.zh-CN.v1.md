# 权益+地址组合卡组件管理说明（V1）

## 组件定位

- 中文名称：权益+地址组合卡
- 英文名称：Benefits + Showroom Address Card
- Component Key：`image.benefitsAddressCard`
- 分类：赠品与权益组件；可与其他权益或地址组件分别添加、重复和排序。
- 默认内容：完整保留用户提供的 `服务+店面.png`，不拆分、不裁切、不重绘、不添加链接。

## 文件与素材

- `component.template.v1.html`：单根 presentation table、内联样式和一张无链接整图。
- `content.schema.v1.json`、`content.fixture.v1.json`：整图 URL、Alt 和默认本地素材映射。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：组件外部背景色契约，默认 `#F8F4EE`。
- `assets/default-benefits-address-card.png`：用户本次提供的原图，1200×1698px，SHA-256 `48a8bfc0d46142b2d92864835243406c8156f607d4fc1bd0f8ef37e9f3b2198f`。
- `render-demo.mjs`、`效果演示.html`：使用真实默认快照生成本地浏览器演示。

## 尺寸与编辑范围

- 桌面最大宽度 600px，默认显示 600×849px；组件不添加边距、热区或裁切。
- 375px 手机端默认显示 375×530.625px，使用 `width:100%;height:auto` 等比缩放。
- 可编辑 `image.url`、`image.alt`、`color.surface`；背景色不改变图片内部底色。
- 图内标题、六项权益、分割线、展厅照片、地址和预约说明均烧录在原图内。修改单项内容时必须替换完整整图。
- 整图不绑定链接；如未来需要点击行为，应作为新的确认范围处理。

## 本地预览与导出

- 默认图片通过 `asset://benefits-address-card` 和 `localReferenceAssets` 接入本地预览。
- 最终导出必须把本地素材替换为公开 HTTPS 图片；不得输出 `asset://`、本地路径、`file://` 或 `data:` 图片。
- 编辑器启动时缓存组件清单。注册后应保护未保存草稿，并在新空闲端口启动服务验证目录与字段。

## 验证边界

- 验证注册契约、原图尺寸与哈希、单图无链接结构、邮件安全 HTML、600px/375px 几何和编辑器字段。
- 静态测试和本地浏览器预览不等于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱验收。
- 新建组件不授权上传图片、创建或更新 Omnisend Draft、发送、排期或发布 Campaign。
