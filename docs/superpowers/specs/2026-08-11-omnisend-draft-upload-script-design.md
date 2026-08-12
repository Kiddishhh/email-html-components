# Omnisend Draft Upload Script 设计

**目标：** 为已确认的 Freshine Campaign 项目提供确定性的 Omnisend 上传脚本，上传本地图片、导入 HTML 模板并创建及验证 Campaign `draft`；绝不发送、排期或发布。

## 边界

- 仅接受一个已最终确认且内容哈希匹配的项目草稿、对应静态 HTML 与该草稿明确列出的本地图片。
- 每次运行都通过安全隐藏输入询问 Omnisend API Key；密钥只在当前 Node 进程内存中使用，不接受命令行参数，不写入文件、项目状态、回执、异常或标准输出。
- 使用当前 Omnisend API 版本，固定调用图片上传、模板导入、创建 Campaign、Campaign 回读和 Email Content 回读端点。
- 创建 Campaign 的 `sendingSettings.strategy` 可明确为 `immediate`，但脚本绝不调用 `/send`；根据官方 API，创建操作的结果仍是 `draft`。
- 任何请求 URL、请求体字段或响应状态一旦指向发送、排期或非 `draft` Campaign，立即失败并停止后续写入。

## 脚本接口与事务

`node scripts/upload-omnisend-draft.mjs --project <project-state.v1.json> --html <campaign.static-safe.html>`。

1. 校验项目最终确认状态、HTML SHA-256 与图片清单；不满足即在任何网络请求前失败。
2. 仅上传清单中的本地图片；公开 HTTPS 图片原样保留。每次上传后校验返回公开 HTTPS URL。
3. 在内存中替换图片 URL，重建静态 HTML，并进行现有的邮件安全检查。
4. 导入/创建 Email Template，接着创建常规 Email Campaign；不调用 `/send`、不传 `scheduled`，也不传任何排期时间。
5. 回读 Campaign 与 Email Content，要求 `status === "draft"`、内容 ID 存在、HTML 哈希一致、退订令牌和所有图片 URL 完整。
6. 仅在回读成功后写入不含密钥和完整正文的上传回执；失败时保留原项目草稿供恢复。

## 可测试的安全合同

- 使用依赖注入的 HTTP 传输层，以 fixture 测试所有允许的端点与请求顺序。
- 测试拒绝 API Key 命令行参数、未确认项目、HTML 哈希不一致、未上传的本地图片、非 HTTPS 图片响应、`/send` URL、`scheduled` 策略及非 `draft` 回读结果。
- 测试成功路径只产生 upload/template/campaign GET/POST 请求，且最终回执不包含密钥、HTML 正文或本地图片内容。

## Skill 接入

Skill 的最终写入阶段必须调用该脚本，禁止模型手工拼接 Omnisend 写入请求。Skill 明确要求运行时询问密钥、明确说明“仅草稿”，并在回读验证通过前不得清理项目草稿。
