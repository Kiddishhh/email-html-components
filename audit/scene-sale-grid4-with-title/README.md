# 四宫格场景折扣（标题款）设计 QA

- 参考稿：`/Users/ww/Downloads/产品块 2/样式XXVII.png`（1200×1854）
- 实现：`collection.sceneSaleGrid4WithTitle`，600×927 桌面版与 375px 等比移动版。
- 桌面证据：`implementation-600.png`
- 移动证据：`implementation-375.png`（375px iframe 位于左侧验收画布）
- 编辑器：在独立端口 4191 中从“活动商品组件 → 四宫格场景折扣（标题款）”添加成功；22 个内容字段、6 个颜色字段及“导入商品 1–4”均可见。
- 链接：四张图片与四个商品名称分别成对复用商品链接，默认链接均包含 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`；无底部 CTA。
- 布局：600px 下 508px 内容区、246px 方图、16px 列间距；375px 保持双列并等比缩放。默认场景图完整加载，折扣标签及商品名称与参考稿一致。
- 验证：聚焦测试 4/4；完整测试 270/270；组件契约 52/52；移动尺寸规范 104 个文件、0 个未缩放声明；`git diff --check` 通过。
- 边界：仅完成本地组件、编辑器和浏览器预览；未上传 Omnisend、未创建或发送 Campaign，也未进行 Gmail、Outlook 或 Apple Mail 收件箱测试。
