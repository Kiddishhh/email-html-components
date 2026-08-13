# 三权益整图取消链接设计

## 目标

`image.benefitsStrip3` 今后渲染为不可点击的整图。新建邮件组合不再收集、展示或输出图片跳转链接；本次 Summer Sale 预览同样不包含链接。

## 兼容策略

保留 `image.benefitsStrip3` 的组件 key、图片字段、Alt 字段、600px 流式显示和本地预览/公开 HTTPS 资产规则。移除新快照中的 `image.linkUrl`。

为避免历史组合文件失效，Schema 中保留该字段作为可选的弃用兼容字段。拼接器接受其存在，但不将它写入 HTML；不存在时不要求补齐。该字段不再出现在默认快照、效果演示、Skill 交互或组件管理文档中。

## 实现边界

- 模板移除包裹图片的 `<a>` 与 `data-freshine-href-slot`。
- `content.schema.v1.json` 将旧 `image.linkUrl` 标记为可选、弃用且不再提示；拼接器只要求 `required: true` 的内容字段，并只校验出现的可选字段。
- 默认 Fixture、效果演示和本次 Summer Sale 组合删除 `image.linkUrl`。
- Campaign Skill 与交互索引不再声明用户链接来源、链接确认阶段或完成卡片链接项。
- 历史组合可保留旧字段，构建结果仍为无链接图片。

## 验收

1. 新三权益组合在没有 `image.linkUrl` 的情况下可生成静态安全 HTML；输出不含 `<a>` 和 `href`。
2. 含历史 `image.linkUrl` 的组合仍可构建，且输出同样不含该 URL、`<a>` 或 `href`。
3. 默认 Fixture、效果演示、组件说明与 Campaign Skill 不再把三权益图描述为可链接。
4. 现有可链接评论整图不受影响，继续要求 HTTPS 链接。
5. 全量 Node 测试和 Campaign 契约验证通过。
