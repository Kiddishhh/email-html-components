# 窗帘精选拼贴四图组件管理说明（V1）

## 组件定位

- 中文名称：窗帘精选拼贴四图
- Component Key：`collection.curtainEditorialMosaic4`
- 分类：活动商品组件；独立于“窗帘灵感四宫格”，可自由添加、重复和排序。
- 默认内容：保留用户提供 HTML 的标题、说明、四张 Omnisend 图片、五个独立链接与 `cover-rc` UTM 参数。

## 尺寸与编辑范围

- 桌面画布为 600px；拼贴内容宽 526px，左列为 259×258px 两图，右列为 259×323px 与 259×194px 两图，间距 8px / 10px。
- 手机端 375px 时，所有固定尺寸通过内联 `min()` 等比缩小，保持双列和非等高拼贴，不改为单列。
- 可编辑：顶部标题/说明、四组图片 URL/Alt/独立链接、CTA 文案/链接，以及组件背景、标题、说明、图片加载降级和 CTA 颜色。
- 固定：Lora 标题、Montserrat 说明/CTA、图片 `cover` 裁切、526px CTA 宽度和五个链接边界；不提供 Shopify 导入。

## 文件与导出

- 默认素材已是公开 HTTPS Omnisend 图片，不需要本地 `asset://` 上传替换。
- `component.template.v1.html` 使用 presentation tables、内联样式和每张图片的表格背景回退；不包含脚本、外部样式、Flex、Grid 或定位布局。
- `render-demo.mjs` 与 `效果演示.html` 使用同一默认公开快照生成。

## 验证边界

- 本地验证覆盖注册、字段契约、四图非等高几何、五个链接、邮件安全输出及 600px/375px 比例规则。
- 本地预览不等于 Omnisend 编辑器保存或 Gmail、Outlook、Apple Mail 收件箱的像素级验收。
- 本组件创建不授权上传、创建、更新、发送、排期或发布 Omnisend Campaign。
