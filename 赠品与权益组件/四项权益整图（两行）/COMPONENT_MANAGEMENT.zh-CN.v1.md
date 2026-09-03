# 四项权益整图（两行）组件管理说明（V1）

## 组件定位

- 中文名称：四项权益整图（两行）
- 英文名称：Four-Benefit Image — Two Rows
- Component Key：`image.benefitsStrip4TwoRows`
- 分类：赠品与权益组件；独立于原有单行 `image.benefitsStrip4`，两者可分别添加、重复和排序。
- 默认图内权益：第一行为“7-14 Day Delivery / Free Shipping”，第二行为“Free Design / Measurement Tool”。
- 直接使用用户最新提供的 `产品块 8/免费测量IV.png`（含“Our Custom Window Treatments & Services”图内标题），不拆分、不裁切、不改图标、文字、颜色或图片内部留白；整图不绑定点击链接。

## 文件职责

- `component.template.v1.html`：单根 presentation table、内联样式和一张无链接整图。
- `component.styles.v1.css`：仅作用于本组件的流式图片样式。
- `content.schema.v1.json`、`content.fixture.v1.json`：内容契约、完整默认内容和本地素材映射。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：外部背景色契约及完整默认设置。
- `assets/default-benefits-strip-4-two-rows.png`：未经修改的用户原图，1200×1080px。
- `render-demo.mjs`：使用现有邮件构建器生成真实 `效果演示.html`；构建中间文件写入 `build/four-benefits-image-strip-two-rows/`。
- `效果演示.html`：浏览器本地预览，不是正式 Omnisend 导入文件。

## 尺寸与可编辑范围

- 桌面最大宽度 600px，默认图显示 600×540px；组件不添加边距或裁切。
- 375px 手机端默认图显示 375×337.5px，保持图片内两行两列排布。
- 图片使用 `width:100%;height:auto`；替换图片时高度跟随新图比例。
- 可编辑 `image.url`（整图）、`image.alt`（图片说明）、`color.surface`（组件外部背景，默认 `#FFFFFF`）。
- 背景色设置不改变图片内背景；单项权益、图标或文字的调整需要替换整图。
- 不提供独立链接、图片热区、标题、CTA、尺寸或内部排版字段；新增图内标题随整图显示，不新增 HTML 标题字段。

## 本地预览与导出

- 默认图片通过 `asset://benefits-strip-4-two-rows` 和 `localReferenceAssets` 接入现有本地预览流程。
- 编辑器中选择“赠品与权益组件 → 四项权益整图（两行）”。
- 编辑器启动时缓存组件目录；已运行的旧服务需保护未保存草稿后重启，或另开空闲端口加载新组件。
- 最终导出沿用既有素材上传／公开 HTTPS 地址替换流程；不允许将 `asset://`、本地路径或 `data:` 图片用于最终邮件。

## 邮件安全与验证边界

- 不使用脚本、iframe、表单、Flex、Grid、定位、图片热区或链接。
- 验证注册契约、默认素材、本地图片解析、可编辑值输出和无链接整图，并在编辑器检查 600px／375px 几何及溢出。
- 静态校验和本地浏览器预览不等于 Omnisend 或 Gmail／Outlook／Apple Mail 收件箱验收；正式使用前仍需对应平台预览和测试邮件。
- 新增组件不授权远程图片上传、Campaign 创建／更新、发送、排期或发布。
