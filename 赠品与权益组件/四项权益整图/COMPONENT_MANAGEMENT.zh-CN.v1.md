# 四项权益整图组件管理说明（V1）

## 组件定位

- 中文名称：四项权益整图
- 英文名称：Four-Benefit Image Strip
- Component Key：`image.benefitsStrip4`
- 用途：以一张完整图片展示“7–14 Day Delivery、Free Shipping、Free Design、Secure Payments”四项权益；整图不提供点击跳转。
- 桌面邮件画布：600px；图片全宽、零外边距。
- 移动端目标：375px流式缩放，不裁切、不改变宽高比。

该组件不会拆分图片内部的图标、文案或底色。需要调整任一权益、图标、字体或图片内部背景时，必须替换整张完整图片。

## 文件职责

- `component.template.v1.html`：Omnisend静态安全的无链接整图片段。
- `content.schema.v1.json`：整图URL与Alt字段。
- `content.fixture.v1.json`：默认内容完整快照和本地素材引用。
- `settings.schema.v1.json`、`settings.defaults.v1.json`：组件外部背景色。
- `assets/default-benefits-strip-4.png`：用户提供的默认四项权益图（1200×308px）。
- `效果演示.html`：600px浏览器效果演示，不是正式Omnisend导入片段。

## 图片规格与编辑

- 当前默认源图：1200×308px，约3.90:1。
- 桌面端：600px画布中显示约600×154px。
- 移动端：约375×96px；模板使用`width:100%;height:auto`，因此不裁切。
- 编辑器可替换`image.url`与`image.alt`；图片内部四项权益不可拆分编辑，也不绑定链接或热区。
- 本地默认素材以`asset://benefits-strip-4`提供预览；最终导出时会按既有流程上传或替换为公开HTTPS图片地址。

## Omnisend安全边界

- 模板仅使用presentation table和`img`，关键样式内联。
- 不使用脚本、iframe、表单、Flex、Grid、定位、图片热区或链接。
- 静态检查通过不等于真实收件箱验收；正式发送前仍需在Omnisend完成Desktop/Mobile预览和测试邮件验证。
