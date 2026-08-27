# 双分割线页脚组件设计

## 目标

将已确认的 Freshine 浅色页脚制作成可独立拼接的 Omnisend 正文组件，中文名为“`双分割线页脚`”，Component Key 为 `footer.doubleDivider`。该组件与现有 `footer.warm` 并存，不替换或修改后者。

## 布局与视觉契约

- 组件使用 600px 流式邮件画布与 375px 移动目标宽度；主内容列桌面最大宽度为 508px。
- 根层背景为 `#FAF9F7`，内容区域背景为 `#F9F6EE`。
- 内容区域顶部与社媒图标下方各有一条宽度为 508px、颜色为 `#E3E0DE`、高度为 1px 的分割线。顶部线不增加额外顶部留白；底部线保留社媒区后的 24px 间距。
- 信息层级保持品牌名、金棕色短分割线、地址、预约说明、电话/联系邮箱、社媒、法律信息和退订链接的既有顺序。模板只包含一个原样的 `[[unsubscribe_link]]`。
- 使用 presentation table 和内联 CSS；不使用 `div`、脚本、外部样式、Flex、Grid、定位或非 HTTPS 图片。

## 社媒图标

七枚图标按 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads 的顺序输出。每枚位于统一的 `26 × 26px` 居中单元，平台级图像尺寸为：YouTube 24px、Instagram 24px、Facebook 23px、TikTok 24px、Pinterest 24px、WhatsApp 24px、Threads 23px。

图标素材与链接沿用当前品牌页脚的默认快照；尺寸只作为本组件的固定视觉契约，不向 HTML 编辑器开放。

## 内容、设置与编辑器边界

- 内容字段沿用现有品牌页脚的品牌、地址、预约说明、电话、邮箱、版权、法律信息、七条社媒链接以及七套图标 URL/Alt 字段，作为完整快照独立保存。
- 设置保留两层背景色、正文色、链接色、正文回退字体、水平/垂直间距和内容列宽度的默认值；组件几何与社媒尺寸固定。
- HTML 编辑器只公开 `color.canvas`、`color.background`、`color.text` 与 `color.link`。未公开的字段不应出现在 `editableByComponent`。

## 同步范围

1. 新建 `页脚组件/双分割线页脚/`，包含模板、样式、内容/设置 Schema、fixture/defaults、管理说明和真实 `效果演示.html`。
2. 在 `组件清单.json` 和 `组件索引.md` 注册 `footer.doubleDivider`。
3. 在 `editor/public/editor-ui-contract.mjs` 设置编辑字段白名单和中文字段说明，并在 `references/component-interactions.zh-CN.md` 记录固定布局与图标校正值。
4. 增加回归测试，验证注册、完整快照、编辑器字段、双分割线、七枚图标顺序/尺寸，以及 600px/375px 的安全输出。

## 验收

- 先新增聚焦测试并观察其在组件缺失时失败。
- 完成最小实现后，运行聚焦测试、完整 `node --test tests/*.test.mjs`、组件契约校验和 `git diff --check`。
- 在本地 HTML 编辑器中分别检查 600px 与 375px 预览、默认内容和仅四项可编辑颜色字段；不创建或更新 Omnisend Draft，也不发送、排期或发布邮件。
