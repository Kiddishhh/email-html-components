# 场景文字叠层头图（`hero.sceneOverlayCta`）

该组件以竖版室内场景为整张背景，在图层上方固定展示白色细圆环 Logo、自动换行的主标题、两行说明和实色 CTA；参考演示内容为一对一测量服务，但组件名称不绑定活动主题。

## 默认素材与构图

- `assets/default-measurement-service.png`：由用户提供的 1106×1114 场景图居中裁切为 860×1114，人物、法式门与窗帘保留在安全构图内。
- `assets/default-logo-white.png`：复用头图“促销悬浮首图”的白色 Freshine Logo。
- 外层为全宽兜底背景，内层画布居中并锁定 `width:100%;max-width:600px`：桌面端视觉严格为 `600×778px`；375px 端等比缩为约 `375×486px`。所有高度、Logo、字体和 CTA 均通过 inline `min()` 同步缩放，直接打开演示页时也不会在宽屏铺满。

## 可编辑字段

- 场景图 URL / Alt。
- 主标题：`hero.title`。输入完整标题后，在 600px 与 375px 画布中按可用宽度自然换行，不设置或维护分行文本框。
- 说明第一、第二行：`hero.subtitle.line1`、`hero.subtitle.line2`。
- CTA 文字与公开 HTTPS 链接。
- `color.text` 白色文字色与 `color.action` CTA 背景色。

Logo 默认作为固定品牌资产，不开放编辑；默认 CTA 链接为现有测量工具入口 `https://freshinelife.com/pages/measurement-tool`，可在当前组件实例中修改。

## 顶部导航栏开关

可视化编辑器以“显示顶部导航栏”复选框开放 `navigation.visible`，默认值为 `true`。开启时在场景图上方加入与既有头图一致的 `71px` 双栏促销导航；关闭后，构建器会从最终 HTML 中完整移除导航栏及其占位高度，场景主图仍保持 `600×778px`。默认导航文案为 `Unlock An Extra 15% Off Your First Order At Freshine` 与 `SIGN UP`，链接至首页；此轮仅开放显示开关，不增加导航文案或配色输入项。

## 固定样式

- Logo 圆环：`106×106px`、1px 白色描边，内部 Logo 最大宽度 `89px`。
- 主标题：Lora `47px / 500 / 54px`；说明：Montserrat `18px / 400 / 27px`；均为白色居中并保留两行版式。
- CTA：`322×52px`、无圆角、Montserrat `18px / 400`、默认红色 `#A71919`。
- 仅使用邮件安全表格和 inline CSS；不含导航栏、Shopify 导入、脚本、iframe、Flex 或 Grid。

本地预览可验证比例和默认素材加载；导出或上传 Omnisend 前，默认 `asset://` 图像必须替换为公开 HTTPS 地址。
