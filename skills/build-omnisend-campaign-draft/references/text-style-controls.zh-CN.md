# 文案独立样式

编辑区在真实显示的文案字段下提供可折叠的“文字样式”。标题、副标题、商品名、价格、折扣、评论、地址和按钮文字按字段独立设置；URL、图片源、Alt 和固定文字不提供样式控件。它遵循已有内容编辑白名单，不开放新的文案修改权限。

## 当前默认字体

- 标题及商品名：`Georgia,serif`。
- 其他文案：`Verdana,sans-serif`。
- 优先使用 `typography-roles.v1.json` 中的组件/字段语义角色：`heading`、`caption` 使用 Georgia，`subtitle` 使用 Verdana。四宫格的 `saleItems[n].cta.text`、灵感四宫格的 `grid.imageN.caption`、场景三图卡的 `pair.left/right.caption` 已声明为商品名角色，不按字段后缀误判成按钮。未声明角色时，按 `title`、`heading`、`headline` 段及 `product.name`、`saleItems[n].name` 回退；其余（真实按钮、价格、备注等）使用 Verdana。目录控件和构建器共享同一角色表。
- 手动设置的字体覆盖默认；清空字体或恢复默认返回上述规则，不修改字号、字重、颜色、间距或文案。

编辑器 Composition 使用可选的 `fontDefaults: "georgia-verdana"`，在组件 CSS 内联后应用默认字体，再应用逐字段自定义。模板保存包含该策略及自定义值；旧模板导入编辑器时也使用当前默认规则，保留显式 `textStyles`。组件原始模板、示例和不带此策略的直接构建保持原字体快照。

## 使用方式

1. 选中组件，展开目标文案下的“文字样式”。未覆盖的设置显示组件默认值。
2. 调整字体、字号、字重、字体颜色、行高、字间距、上下留白及可用的对齐方式。颜色支持色板和完整的 `#RRGGBB` 输入；完整色号自动入队，输入中的不完整值不会发送。
3. 等待“已保存到当前会话”，在 600px/375px 预览检查，再确认组件。失败时保留有效修改并使用“重试保存”。
4. “恢复此文案的默认样式”清空当前字段的全部覆盖，不修改文字内容、组件颜色设置、其他文案、链接或图片。恢复也需等待保存并重新确认。
5. 需跨服务运行保留时，手动保存为模板。普通草稿仍只在当前会话存在。

数字框清空、字体/字重/对齐选择“组件默认”、色号框清空，分别撤销这一项覆盖。样式只作用于当前实例，不影响其他相同组件或默认缩略图。

## 尺寸与对齐

- 尺寸以 600px 桌面宽度填写；字号、行高、字间距、上下留白采用与组件一致的桌面 px 回退和 inline `min()` 比例规则；负字间距使用 `max()`。例如 40px 字号在 375px 浏览器预览中为 25px。
- 上下留白控制当前文案容器的 padding；保留左右 padding、原有独立分隔行和其他固定几何。它不是整块组件的外边距，也不会移除独立分隔行。行内价格等字段的留白作用于文字盒子。
- 对齐同时处理独占文案的布局容器，避免只改行内 span 却无法移动短标题。多个独立文案共享同一行且没有独立对齐容器时，不显示对齐控件；字号、字体、颜色等仍可分别调整。
- 较大的字号、较长的文字或不合适的行高可能影响固定尺寸卡片/徽章；修改后检查两个预览尺寸。

校验范围：字号 8–96px、行高 8–160px、字间距 -2–12px、上下留白 0–120px；字重为 300/400/500/600/700/800/900。字体只接受控件列表，颜色只接受六位 HEX，拒绝任意 CSS。

## 数据与导出

可选的 `components[].textStyles` 以内容字段名为键，保存结构化覆盖，例如：

```json
{
  "hero.title": {
    "fontFamily": "Georgia",
    "fontSize": 40,
    "fontWeight": 700,
    "lineHeight": 44,
    "letterSpacing": 1,
    "color": "#123456",
    "spaceBefore": 12,
    "spaceAfter": 16,
    "textAlign": "left"
  }
}
```

一个字段的保存是其覆盖对象整体替换；`{}` 表示恢复默认。服务器和构建器分别校验真实文案字段及安全值。旧草稿/Composition 无需添加 textStyles；除编辑器默认字体策略外，无覆盖属性保持组件原样。覆盖随本机模板保存，并进入现有 Composition、预览、导出与 Draft-only 上传源码。

模板仍使用已有表格布局和内联样式；不注入外部字体文件、脚本、编辑器表单、iframe 或追踪运行时。字体列表包含 Arial、Helvetica、Verdana、Tahoma、Trebuchet MS、Georgia、Times New Roman，以及已有品牌字体 Montserrat/Lora/Noto Sans SC；每个自定义选择均输出回退字体链。Montserrat/Lora/Noto Sans SC 在收件人设备没有可用字体时会使用回退字体，不能以本机预览证明所有收件箱字体一致。

Omnisend 参考：[HTML 基础规范](https://support.omnisend.com/en/articles/1061843-understand-email-html-basics)、[字体与回退](https://support.omnisend.com/en/articles/1061830-email-safe-fonts)。本功能保留当前项目的移动端比例契约；浏览器支持 `min()` 的预览与不支持它、使用 px 回退的邮件客户端可能不同。正式发送前仍需 Omnisend 桌面/移动预览和真实邮箱测试。

## 验证入口

- `node --test tests/email-text-styles.test.mjs tests/email-text-styles-server.test.mjs`：覆盖字段/实例隔离、安全值、方向 padding、对齐、实体字体、保存失败重试、模板、上传源码和恢复默认。
- `node --test tests/*.test.mjs`：项目完整回归。
- 实测编辑器控件，确认延迟保存响应不会丢失编辑中的色号/数字；检查 600px、375px 邮件与窄屏编辑区。UI 控件和邮件输出需要分别验证。
