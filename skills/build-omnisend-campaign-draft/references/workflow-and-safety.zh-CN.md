# 当前工作流与安全契约

## 状态流

`编辑中 → 逐组件确认 → 生成 600px/375px 预览 → 最终确认 → 处理本地图片 → 导出 HTML 或写入 Omnisend Draft → 回读验证 → 关闭时清理运行数据`

失败时停在当前状态直到用户继续编辑或关闭服务；关闭时清理运行数据。不得跳过组件确认或最终确认。

## 项目草稿与注册

- `组件清单.json` 是组件路径和注册状态的单一事实来源。每次启动前运行 `scripts/validate-campaign-contracts.mjs`。
- 校验必须覆盖注册表路径、模板、内容/设置 Schema、fixture/defaults、管理说明、组件 CSS、`效果演示.html` 和编辑器字段契约。
- 当前运行草稿保存组件成员、顺序、完整内容/设置快照、Campaign 元数据、确认状态和内容哈希；不跨服务运行持久化。
- 不保存 Shopify CLI 会话、Omnisend API Key 或其他访问令牌。
- 仅用户手动保存的模板跨服务运行持久化；普通草稿、预览、上传回执、图片缓存和导出中间文件在关闭编辑器时清理。

## 本地图片与预览

- 本地图片以 `asset://` 加资产清单的形式进入草稿，只用于本地预览。
- `--preview-local-assets` 必须相对生成的 `previewOutput` HTML 解析本地资源，并验证文件存在。
- 手动保存模板时，将本地上传图片复制为模板专属文件；覆盖或删除模板时仅替换或删除这些专属文件，绝不删除组件目录中的素材。
- 最终 HTML 不得包含 `asset://`、本地绝对路径或相对图片路径；所有图片必须是公开 HTTPS URL。
- 本地预览和截图属于验收证据，不等于 Omnisend、Gmail、Outlook 或 Apple Mail 的真实收件箱验证。

## 最终确认

最终确认展示 Campaign 名称、Subject、Preheader、Sender、Audience、组件顺序、退订令牌、桌面/移动检查状态和本地预览。

- Campaign 名称用于内部识别和管理。
- Subject 是收件箱显示的邮件主题。
- Preheader 是主题旁或下方的预览摘要。
- Audience 默认显示为所有订阅用户。
- 最终确认绑定完整 HTML 的 SHA-256 内容哈希；任何内容、设置、图片或顺序变化都会使确认失效。

## 导出 HTML 边界

“导出 Omnisend HTML”仅上传本地图片、替换 URL、执行静态安全校验并复制 HTML。它不会创建、更新或发送 Campaign 或 Draft，也不保存完整 HTML、API Key 或导出正文回执。

图片上传前必须通过 MIME、扩展名、文件大小和本地路径检查；任一图片失败即停止。图片缓存只保存图片哈希、账户隔离哈希、Omnisend 图片 ID 和公开 URL，并仅在当前编辑器运行期复用。

## Omnisend Draft 写入

1. 只调用固定的 `scripts/upload-omnisend-draft.mjs`；不得手工拼接 Omnisend 写请求。
2. API Key 由编辑器对话框一次性收集，只保留在当前请求和本机进程内存，完成、失败或取消后清空。
3. 先按 Campaign 名称精确查询 `draft`；多个同名结果选择最近更新的一封。
4. 更新现有 Draft 时，先回读完整 Email Content，保留 `generalSettings`、sections、节点 ID 和 `[[unsubscribe_link]]`，只替换目标 HTML 正文后执行完整 `PUT`。
5. 没有同名 Draft 时才读取 Brand senderName、导入 HTML 并创建新的 Draft。
6. 两条路径都必须回读并验证 `status: draft`、Campaign ID、Email Content ID、退订令牌、图片 URL 和内容哈希。
7. 任一步失败都不得继续后续写入；当前草稿仅保留到编辑器关闭。

不得发送、排期、发布或调用任何使 Campaign 离开 `draft` 状态的端点。

## 静态邮件安全

- 邮件 HTML 不得包含 JavaScript、iframe、表单、事件处理器或运行时 Shopify 请求。
- 组件使用邮件安全表格结构与内联 CSS；不得依赖 Flex、Grid、外部样式表或 Web Font 才能完成核心布局。
- URL 字段按 Schema 校验；正式图片地址必须使用 HTTPS。
- 组件 CSS 只内联到当前组件，不得改变其他组件。
- 保留退订令牌 `[[unsubscribe_link]]`。

## Shopify 边界

只有执行组件的 Shopify 导入时才读取 `shopify-data-contract.zh-CN.md`。所有 Shopify 操作严格只读；不创建、修改、上传、发布或删除任何店铺数据或主题。
