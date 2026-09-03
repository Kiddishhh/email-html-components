# 免费测量引导卡组件管理说明（V1）

## 组件定位

- 中文名称：免费测量引导卡
- 英文名称：Free Measurement Guidance Card
- Component Key：`tool.freeMeasurementGuidance`
- 用途：以标题、副标题和一张测量窗户场景图，为用户提供免费测量协助的引导信息。
- 桌面邮件画布：600px；标题区高度158px，场景图600×416px。
- 移动端目标：375px流式缩放，图片不裁切、不改变宽高比。

## 编辑字段

- `guide.title`、`guide.subtitle`：居中的引导文案。
- `guide.image.url`、`guide.image.alt`、`guide.image.clickUrl`：完整测量场景图、无障碍描述及整图点击链接。默认链接为Help Me Measure页面，并附带`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。
- `color.surface`、`color.text`：标题区底色与标题色。

组件不新增CTA或其他热区；仅场景整图按配置链接跳转。图片内部场景必须以完整整图替换，不拆分为独立图层。

## 图片规格与导出

- 默认场景图从用户提供的1200×1148px参考稿中精确提取下半部1200×832px场景；桌面显示600×416px，移动端约375×260px。
- 本地默认图通过`asset://free-measurement-guidance-scene`预览；最终Omnisend导出前需经既有图片上传流程转换为公开HTTPS地址。
- 模板仅使用presentation table和`img`，关键样式内联；不使用脚本、iframe、Flex、Grid、定位或外部CSS。

静态校验不代表真实邮箱客户端验收。发送前仍需在Omnisend完成Desktop/Mobile预览与测试邮件检查。
