# Trustpilot 评论卡组件管理说明（V1）

## 组件定位

- 中文名称：Trustpilot 评论卡
- 英文名称：Trustpilot Review Cards
- Component Key：`review.trustpilotImage`
- 分类：评论组件；可与其他评论组件分别添加、重复和排序。
- 默认内容：两张可编辑评论卡；组件本身不设置任何链接。

## 文件与素材

- `component.template.v1.html`：600px presentation-table 邮件结构、两张无链接评论卡和内联样式。
- `content.schema.v1.json`、`content.fixture.v1.json`：固定品牌素材及两条评论的默认文字数据。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：无暴露样式设置。
- `assets/trustpilot-header.png`：Trustpilot 页眉，768×68px，SHA-256 `5ae784596e61b547905ef20c262393bf7e8d34d754368e8322ac2d6d102e012b`。
- `assets/trustpilot-five-stars.png`：五颗星，260×48px，SHA-256 `0e032eb43e993c1bf1fcd780879892f7f1353fb8f4dcbcfbe3bad67e0038a96c`。
- `assets/trustpilot-verified-check.png`：认证勾选，29×22px，SHA-256 `2924905f9228ea4bd8b407424ed9f350b2bd70feb6684563b3c032c38f9721a7`。
- `assets/default-trustpilot-image-review.png`：原始设计参考图，不再作为组件内容渲染。
- `render-demo.mjs`、`效果演示.html`：使用真实默认文字和分离素材生成本地演示。

## 编辑范围与排版

- 可编辑：两条评论各自的作者、标题、正文与日期，共 8 个文本字段。
- 固定：Trustpilot 页眉、五星素材、认证勾选、`Verified` 标识、卡片白边、`#F5F2ED` 主背景与布局；均无链接。
- 作者：Montserrat，20px、600、150%、左对齐。
- 标题：Montserrat，20px、600、150%、左对齐。
- 正文：Noto Sans SC，16px、400、135%、左对齐。
- 日期：Noto Sans SC，16px、400、150%、右侧日期区域内居中，`#7A6A60`。
- 桌面内容宽度 600px；卡片最大宽度 546px，并以 `min()` 声明按 375px 目标宽度等比缩放。

## 本地预览与导出

- 默认素材通过 `asset://trustpilot-header`、`asset://trustpilot-five-stars`、`asset://trustpilot-verified-check` 和 `localReferenceAssets` 接入本地预览。
- 最终导出必须把本地素材替换为公开 HTTPS 图片；不得输出 `asset://`、本地路径、`file://` 或 `data:` 图片。
- 编辑器启动时缓存组件清单。注册后应保护未保存草稿，并在新空闲端口启动服务验证目录与字段。

## 验证边界

- 验证组件登记、固定素材尺寸与哈希、8 个可编辑字段、无链接邮件结构、600px/375px 几何和编辑器字段。
- 静态测试和本地浏览器预览不等于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱验收。
- 本次工作不授权上传图片、创建或更新 Omnisend Draft、发送、排期或发布 Campaign。
