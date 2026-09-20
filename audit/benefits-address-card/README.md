# 权益+地址组合卡设计 QA

- 组件：`image.benefitsAddressCard`
- 编辑器入口：赠品与权益组件 → 权益+地址组合卡 · non-linked-full-image
- 用户原图：`/Users/ww/Downloads/权益 4/服务+店面.png`
- 素材校验：1200×1698px，SHA-256 `48a8bfc0d46142b2d92864835243406c8156f607d4fc1bd0f8ef37e9f3b2198f`
- 桌面：600×849px；移动：375×530.625px；均为 `width:100%;height:auto` 等比缩放。
- 编辑范围：整图 URL、Alt 文本、组件外部背景色。
- 固定边界：不拆分、不裁切、不重绘、不添加链接或点击热区。
- 视觉证据：`implementation-600.png`；`implementation-375.png` 使用 375px iframe 位于验收画布左侧。
- HTML 编辑器 4192 已实际添加组件，精确原图成功加载，内容和样式字段可见。
- 未上传 Omnisend、未创建或发送 Campaign，也未进行真实邮件客户端测试。
