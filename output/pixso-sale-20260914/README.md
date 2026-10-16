# Freshine Fall Home Refresh

`email-omnisend.html` 是可直接粘贴至 Omnisend Custom HTML 的完整表格正文，来源为 Pixso 组合 2307（119:2672）。右图使用用户提供的 Omnisend 素材地址；CTA 和右图均导航至 Freshine Sale 页面，并带 `utm_source=omnisend`、`utm_medium=email`、`utm_id=cover-rc`。

`preview-online.html` 为本地浏览器渲染预览。`source/0_0.html` 是已清理的 Pixso 源码，图片和两种 Montserrat 字体已本地化；Pixso 返回的 Lora 资源 URL 无效，因此使用 Lora/Georgia 字体栈降级。

清理审计见 `cleanup-audit.json`。实际 Omnisend 导入及各邮件客户端渲染仍需在平台中验证。
