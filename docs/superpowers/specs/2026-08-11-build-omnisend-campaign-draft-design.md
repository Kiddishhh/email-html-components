# Build Omnisend Campaign Draft 完整化设计

**目标：** 把 `build-omnisend-campaign-draft` 完善为可校验、可恢复、只创建或更新未发送 Omnisend 草稿的 Campaign 工作流。

**范围：** 只支持当前六个固定区段，不做活动页、字段或样式可用性的兜底/降级。

## 结构与可选性

- 当前顺序固定为：首图、促销多商品栏、整图链接、赠品、地址、页脚。
- 每个区段恰选一种样式；页脚唯一且最后。新增样式通常加入既有区段，新增区段须修改结构配置并重新确认。
- 新建 `references/campaign-structure.v1.json`，顶层为 `schemaVersion` 与 `slots`；每个槽位为 `id`、`label`、`order`、`required`、`candidateComponentKeys`，页脚另有 `terminal: true`。
- 保留根目录 `组件清单.json` 作为通用组件注册表。新建 `references/campaign-component-interactions.v1.json` 作为可用性索引；每项必须具有 `componentKey`、`interactionReference`、`allowedSources`、`requiredStages`、`completion`。缺项即“准备中”，不可选。
- 样式按区段逐个选择。用户卡片只显示中文名称、预览图和一句话用途；不显示 `componentKey`。六个选择确认后直接进入首图收集。

## 六个区段的收集与确认

- 首图：先列出 Sale Page 候选，用户选择后解析活动三段文案与推荐 Collection；主视觉图片独立由用户提供（公开 HTTPS 或本地路径）。顶部促销条保留样式默认值。最后以一张完整首图环境卡片确认并锁定。
- 促销多商品栏：仅在选择 `collection.saleGrid6` 且首图锁定后，读取推荐 Collection 当前排序前六件商品。图片、商品链接和折扣由脚本注入；标题、说明由用户确认。CTA 默认指向推荐 Collection，默认文字为 `SHOP NOW`；用户可主动修改。一个操作色控制折扣与 CTA，背景色独立处理。以设置卡片、桌面预览、375px 预览一次确认。
- 整图链接：主用于评论展示但不限于此。推荐图片为 552 × 1006px，在 600px 画布左右各留 24px；移动端约 375 × 683px。默认点击链接为 `https://freshinelife.com/`，仅在完成卡片中供用户主动修改。根据实际图片生成 Alt 建议，随后以完成卡片和双端预览一次确认。
- 赠品：`gift.rewardGrid2` 从本地默认快照注入标题、两项图片/Alt/链接与两条门槛说明；不读取 Shopify。以完成卡片和双端预览一次确认。
- 地址：`location.showroomCard` 从本地默认快照注入；不读取 Shopify。以完整地址卡和双端预览一次确认。
- 页脚：`footer.warm` 固定最后且唯一。背景色独立确认，当前默认 `#652A0D`；其余内容从本地默认快照注入。以完成卡片和双端预览一次确认。

## Shopify 只读脚本

- `scripts/list-sale-activities.mjs`：执行白名单内的 `shopify theme list`，找到唯一 `role=live` 的主题并 `theme pull` 至新临时目录；以 query-only `store execute` 分页读取全部菜单与全部 Page。递归提取菜单中的 Page 链接，并仅保留同一主题快照中恰有一个启用 `slideshow-v2`、其首个可读 slide 有标题、且首个启用 `products-grid-v2` 有推荐 Collection 的页面。对用户输出连续编号、活动名称、公开链接；内部保存候选 ID、theme ID、读取时间与快照位置。
- `scripts/fetch-sale-activity.mjs`：复用同一主题快照和所选候选，重新解析并验证候选仍一致后，输出活动 `name`、`eyebrow`、`title`、`subtitle`，推荐 Collection 的 `handle`、`url`，以及 `pageUrl`、`template`、`sectionId`、`themeId`、`snapshotSha256`、`readAt`。
- `scripts/fetch-sale-grid.mjs`：只接受锁定首图快照中的 Collection handle 与固定数量 6，使用只读 GraphQL 按当前排序输出商品 `featuredImage`、Alt、链接、首个可售变体的 `price`/`compareAtPrice` 和折扣结果。
- Shopify 永久只读：仅 `store info`、query-only `store execute`、`theme list`、`theme pull`。禁止 mutation、写入、push、publish、delete、dev、share。无候选、字段缺失、主题不唯一或商品不满足条件时停止；V1 不实现兜底。

## 组装、预览与写入

- 拼接器只校验完整快照、内联 CSS、按配置顺序组装和渲染；不得提问、读 Shopify、合并主题或改样式。
- 本地图片仅可用于本地预览；最终 HTML 前必须转为公开 HTTPS 地址。每次组件修改只使该组件重新预览和确认。
- 上传 Omnisend 前展示本地 HTML 预览链接和高层清单，并把明确确认绑定到内容哈希。只允许创建或更新未发送 Campaign 草稿，回读后验证状态、内容、图片、退订令牌与哈希；绝不发送、排期或发布。

## 验证策略

- 每个新增配置、交互索引、脚本和文档规则先新增契约测试并观察失败，再写最小实现。
- 单元测试覆盖结构校验、交互索引可用性、脚本规范化输出、只读命令拒绝、折扣与链接回退。
- 集成测试用受控的主题/GraphQL fixture 验证“候选列表 → 选择 → 活动解析 → 六宫格注入 → 完整快照组装”。
