# Omnisend HTML 剪贴板导出设计

## 目标

在 `build-omnisend-campaign-draft` 的本地编辑器中提供“导出 Omnisend HTML”操作。它将当前已确认的组件快照组装为邮件安全 HTML，上传其中的本地图片到 Omnisend，使用返回的公开 HTTPS URL 替换所有 `asset://` 引用，并将最终 HTML 复制到浏览器剪贴板。

该操作不创建、更新、发送、排期或发布 Omnisend Campaign，也不导入 Email Template。

## 用户流程

1. 用户完成组件编辑并确认全部已选组件。
2. 点击顶部“导出 Omnisend HTML”。
3. 编辑器弹出仅含一次性 Omnisend API Key 的对话框，明确提示该操作只会上传图片，不会写入 Campaign。
4. 用户点击“上传图片并复制 HTML”。
5. 服务端生成当前草稿的 `--defer-local-assets` HTML，上传每个唯一的 `asset://` 图片，替换全部同一资源引用，并验证最终 HTML。
6. 前端将返回的 HTML 写入 `navigator.clipboard`，显示已上传图片数量和复制成功提示。
7. 若浏览器拒绝剪贴板写入，前端展示只读代码框与“复制”按钮；用户可在新的用户手势中再次复制。成功前不把 HTML 保存在草稿或项目文件中。

导出按钮仅在当前草稿存在、至少含一个组件且所有组件均已确认时可继续。编辑任何内容后，现有确认状态失效，必须重新确认再导出。

## 服务端与上传边界

新增 `POST /api/drafts/:draftId/export-omnisend-html`：

- 接收 `{ apiKey }`，仅在本次请求与内存中使用；请求完成或失败时清空引用，不写入文件、草稿、日志或错误正文。
- 复用现有组装器、`buildLocalAssetMap` 和 Omnisend 图片上传契约。
- 使用一个可单测的导出事务：读取每个本地图片一次，向允许的 `POST /api/images/upload` 请求一次，收集 Omnisend 的公开 HTTPS URL，并在 HTML 的全部 `asset://<id>` 出现位置替换。
- 输出前拒绝遗留 `asset://`、本地/相对图片路径、未解析模板插槽及不符合现有静态安全约束的 HTML。
- 只允许图片上传端点；导出路径不得调用 Email Template、Campaign、Email Content、send、schedule 或 publish 端点。
- 图片上传成功但后续导出校验或剪贴板复制失败时，不删除已上传图片；返回明确失败结果，且不复制不完整 HTML。该副作用仅限用户明确触发的图片上传。

现有 `upload-omnisend-draft.mjs` 的 Draft 创建/更新事务保持不变。提取共享的“上传并替换本地资源”逻辑，供 Draft 上传和导出 API 复用，避免两套替换规则漂移。

## 前端行为

- `index.html` 新增导出按钮和独立 API Key 对话框，不复用需要 Campaign 名称、主题和 preheader 的 Draft 上传对话框。
- `app.js` 在单次点击路径中先保存待提交编辑，再请求导出 API，再调用 Clipboard API。
- API Key 输入框和局部变量在成功、取消与异常路径均立即清空；不进入 `state`、`localStorage` 或 DOM 提示文本。
- 剪贴板失败仅影响本地交付；服务端返回的完整 HTML 只保留在当前前端内存与临时只读回退框中。

## Skill 说明更新

`SKILL.md` 与安全工作流参考会新增“导出 Omnisend HTML”分支，说明：

- 本地资源必须先上传并替换为公开 URL；
- 导出只上传图片，不等同于 Campaign Draft 上传或实际邮件客户端验证；
- 需要用户在编辑器中明确点击并提供一次性 API Key；
- 不能把 API Key、导出 HTML 或上传收据作为草稿持久化数据。

## 测试与验收

1. 上传器单测：同一 `asset://` 在 `src`、`background` 与内联 `background-image` 中出现时只上传一次，并全部替换为 Omnisend HTTPS URL。
2. 上传器单测：导出路径仅能调用图片上传端点；遇到上传失败、非法 MIME、遗留本地引用或替换后非 HTTPS URL 时失败且不返回 HTML。
3. 服务端测试：未确认、空草稿或空 API Key 被拒绝；成功响应包含最终 HTML 与上传计数，但不创建项目状态、Draft 或收据文件，且 API Key 不出现在任何文件中。
4. 客户端契约测试：导出按钮、独立对话框、Clipboard API 调用、错误回退与 API Key 清理存在；不触发 Draft 上传路由。
5. 完整现有测试套件、Campaign 契约校验和 `quick_validate.py` 通过。

## 非目标

- 不将导出的 HTML 自动粘贴到 Omnisend 网页。
- 不保存或复用 API Key。
- 不创建、更新或读取 Campaign Draft。
- 不声明 Omnisend 导入、平台预览或 Gmail/Outlook/Apple Mail 实际渲染已验证。
