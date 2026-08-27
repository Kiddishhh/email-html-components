# Shopify 数据读取契约

## 目录

1. 连接与权限
2. 只读命令白名单
3. 禁止操作
4. 数据源分工
5. 首页 Slide 活动解析
6. 六宫格商品解析
7. 单品窗帘促销卡与四宫格单款商品解析
8. 折扣计算
9. 当前脚本接口
10. 失败处理

## 1. 连接与权限

- 店铺后台：`https://admin.shopify.com/store/0qsgrb-pe`
- 店铺域名：`0qsgrb-pe.myshopify.com`
- 组织：Freshine
- 优先使用专用的只读 Shopify 凭据。只执行查询和 Theme pull，不执行任何写入操作。

运行时先验证店铺身份和只读连接。不要把 CLI 会话或访问令牌写入项目草稿。

如果现有 Shopify CLI 用户会话本身拥有更高权限，Skill 无法撤销该账户权限；必须通过下述命令白名单限制实际行为。Admin API 凭据可配置 Scope 时，只接受任务需要的 `read_*` Scope，不申请或使用 `write_*` Scope。

自动活动候选发现不读取菜单；选定首页 slide 后需要 `read_online_store_pages` 或 `read_content` 查询其链接的一个 Page。若当前 CLI 凭据缺少该只读 Scope，停止并提示权限缺口，不改用猜测或手动数据。

## 2. 只读命令白名单

Skill 只允许执行以下 Shopify CLI 命令族：

- 只允许 `shopify store info` 验证当前店铺身份。
- 只允许 `shopify store execute` 执行 Admin GraphQL `query`；执行前检查操作类型并拒绝 mutation。
- 只允许 `shopify theme list` 读取主题清单。
- 只允许 `shopify theme pull` 把指定主题读取到新建的临时目录。

`theme pull` 只能写入本地临时目录，不得覆盖组件目录或其他用户文件。以上白名单以外的 Shopify CLI 命令一律不执行。

## 3. 禁止操作

- 禁止使用 `--allow-mutations`。
- 禁止执行任何 GraphQL mutation。
- 禁止任何 REST `POST`、`PUT`、`PATCH` 或 `DELETE` 请求。
- 禁止 `shopify theme push`。
- 禁止 `shopify theme publish`。
- 禁止 `shopify theme delete`。
- 禁止 `shopify theme dev`、`theme share` 或其他可能创建、修改、上传、发布、重命名或删除远端主题的命令。
- 不得创建、修改或删除任何 Shopify 商品、变体、Collection、Page、菜单、文件、Metafield、Metaobject、折扣、客户、订单或主题。

即使用户在本 Skill 的运行过程中要求写入 Shopify，也必须拒绝并说明此 Skill 永久限定为只读；不要请求提升 Shopify 写权限。

## 4. 数据源分工

- 使用 Shopify Theme CLI 只读获取实时主题中的首页与选定活动 Page 模板和 Section 设置。
- 使用 `shopify store execute` 的 Admin GraphQL 只读取选定首页 slide 链接的 Page、Collection、Product、ProductVariant 和 Shopify CDN 图片。
- 邮件生成前读取并写成静态快照；邮件打开时不得调用 Shopify。

## 5. 首页 Slide 活动解析

候选发现只读拉取唯一在线主题的 `templates/index.json`；不读取菜单或全量 Page。首页模板必须恰有一个启用的 `slideshow-v2`。按 `block_order` 读取每个未禁用且具有非空 `subheading`、`heading` 和 `shopify://pages/<handle>` 链接的 slide，候选公开页面 URL 为 `https://freshinelife.com/pages/<handle>`。多个候选时让用户选编号。

选定后才 query-only 查询该 handle 的一个 Page，精确验证返回 handle 并取得 `templateSuffix`。随后把 `templates/index.json` 与该 Page 模板拉取到新的临时快照，重新解析选定 slide；从该活动页的首个启用 `products-grid-v2` 取得推荐 Collection。`subheading` 是活动名/`hero.eyebrow`，`heading` 是折扣消息/`hero.title`，`description` 是 `hero.subtitle`。任一 slide、Page 或 Collection 不一致即停止，不做字段、样式或数据源兜底。

记录 Page URL、模板、首页 Section ID、推荐 Collection handle、读取时间和来源哈希。

## 6. 六宫格商品解析

按推荐 Collection 当前排序获取前六个商品。每个商品至少读取：

编辑器的“shopify商品导入”接受完整的 `https://freshinelife.com/pages/<handle>`、`https://freshinelife.com/collections/<handle>`，或 Shopify 后台 Collection handle。Page 链接会只读查询 `templateSuffix`、拉取线上主题中的对应模板，并按模板 `order` 找到首个启用的 `products-grid-v2`；该区块的 `settings.collection` 是六宫格商品来源。Collection URL 或后台 handle 则直接作为商品来源。后台 handle 不要求 Collection 已上线：六张商品卡使用查询返回的商品公开链接，整体 CTA 保持组件原值，不能自动指向未上线 Collection。若活动页没有启用的 `products-grid-v2`，或来源 Collection 不足六件可导入商品，停止并提示具体原因。

- `id`
- `title`
- `handle`
- `onlineStoreUrl`
- `media(first: 1, query: "media_type:IMAGE", sortKey: POSITION)` 的首个 `MediaImage { alt image { url width height } }`
- 每个商品先读取 8 个变体及分页 cursor；仅对未找到可售（`availableForSale`）变体的商品继续分页，直到找到首个可售变体或耗尽该商品。不得为六个商品各读取 250 个变体。

商品图片固定使用商品详情页媒体按 `POSITION` 排序后的第一张图片。查询必须用 `media_type:IMAGE` 排除视频和 3D 媒体；不得以已废弃的 `featuredImage`、变体图、视频缩略图或其他商品作为回退。首个图片媒体缺失或没有可用 URL 时标记具体商品并停止。优先使用该 `MediaImage.alt`；为空时根据商品标题生成准确、不夸张的描述。优先使用 `onlineStoreUrl`；为空时按 handle 生成商品页回退链接。

Collection 的 Admin GraphQL 类型不提供 `onlineStoreUrl`；用 handle 生成 `https://freshinelife.com/collections/{handle}`。

## 7. 单品窗帘促销卡与四宫格单款商品解析

`collection.curtainPromotionCard` 与 `collection.curtainPromotionCardNoTitle` 的“shopify商品导入”接受完整的 Freshine 商品详情页链接：`https://freshinelife.com/products/<handle>` 或 `https://freshinelife.com/collections/<collection-handle>/products/<handle>`。`fetch-single-product.mjs` 从两种路径提取相同的 handle，再经只读 `shopify store execute` 查询一个商品，读取其第一张按 `POSITION` 排序的图片媒体、Alt、`onlineStoreUrl`、标题与首个可售变体；不读取或修改其他商品、Collection、主题或 Shopify 数据。

导入只更新当前选中卡片的 `product.image.url`、`product.image.alt`、`product.image.clickUrl`、`product.cta.url`、`product.title`、`product.description` 与 `product.badge`。商品标题在第一个 `–` 前的文本写入 `product.title`，其后文本写入 `product.description`；没有 `–` 时说明写为空。顶部活动标题/说明、CTA 文案、背景色和角标底色不得被导入覆盖。没有有效折扣时写入空角标，以清除旧促销信息。

`collection.saleGrid4` 使用同一条 URL 解析和只读查询，但编辑器必须先指定第 1–4 格中的一个。导入只更新该格的 `saleItems[n].image.url`、`saleItems[n].image.alt`、`saleItems[n].image.clickUrl` 和 `saleItems[n].discountLabel`；不得覆盖其余三格、组件背景色或标签主题色。

## 8. 折扣计算

对 Shopify 排序中的首个可售变体执行与实时主题 `selected_or_first_available_variant` 一致的规则：

1. 读取 `price` 和 `compareAtPrice`。
2. 仅当 `compareAtPrice > price` 且 `compareAtPrice > 0` 时计算。
3. 计算 `(compareAtPrice - price) × 100 ÷ compareAtPrice`。
4. 四舍五入为整数并输出 `SAVE {percent}%`。
5. 条件不满足时返回空标签，不生成虚构折扣。

不要默认读取商品 Tag 或 Metafield 作为 `SAVE xx%`。主题中的自定义徽章属于另一类内容，只在用户明确要求覆盖时处理。

## 9. 当前脚本接口

- `scripts/shopify-readonly.mjs` 已实现：在启动 Shopify 子进程前只允许 `store info`、query-only `store execute`、`theme list` 和 `theme pull`，并拒绝 mutation、`--allow-mutations` 与所有非白名单命令。
- `scripts/fetch-sale-grid.mjs` 已实现，并已通过本地 GraphQL fixture 测试：输入推荐 Collection handle 和固定数量 `6`，输出六个商品按媒体 `POSITION` 排序的第一张图片、Alt、详情链接、首个可售变体价格、`compareAtPrice` 和折扣标签。fixture 用不同的 `featuredImage` 验证脚本不会读错来源。它只接受 `--count 6`；fixture 模式仅用于测试，生产模式经只读守卫调用 query-only `shopify store execute`。
- `scripts/list-sale-activities.mjs` 已实现，并已通过本地首页主题 fixture 测试：它只拉取 `templates/index.json`，从唯一启用 `slideshow-v2` 的多个首页 slide 输出候选；不读取菜单或全量 Page。生产模式只读拉取唯一 live Theme 到新临时目录；fixture 模式只用于测试。
- `scripts/fetch-sale-activity.mjs` 已实现，并已通过本地主题 snapshot fixture 测试：它只查询选定 slide 链接的一个 Page 模板，重新拉取首页与该模板并验证 slide 与推荐 Collection；若候选时的首页 slide 不一致则停止。它输出 hero 导入文案、推荐 Collection URL、模板文件 SHA-256、Theme ID、读取时间与来源字段；不再读取 Shopify 菜单或修改本地组件。
- `scripts/fetch-activity-page-sale-grid.mjs` 已实现：输入活动页 URL、Collection URL 或后台 Collection handle。Page 会读取线上主题模板和第一个启用商品网格；Collection URL 或 handle 直接读取商品。三种路径都复用 `fetch-sale-grid.mjs` 的商品读取规则；仅公开 URL 来源会更新整体 CTA，后台 handle 保留原 CTA。
- `scripts/fetch-single-product.mjs` 已实现：输入一个 Freshine 商品详情页 URL，只读查询该商品，输出第一张商品图片、Alt、商品详情链接、按第一个 `–` 拆分后的标题与卖点，以及与六宫格一致的折扣标签；无有效折扣输出空标签。

所有脚本只输出规范化 JSON，不修改组件、HTML、Theme 或 Shopify 数据。编辑器把输出映射到当前组件实例，再由拼接器生成静态邮件 HTML。

## 10. 失败处理

- CLI 未认证或店铺不匹配：停止并要求用户恢复正确登录。
- Theme 与 Admin API 数据无法对应：展示来源并要求用户选择。
- Collection 少于六个商品：停止并让用户换 Collection 或明确补充方式。
- 商品无图片或无可售变体：标记具体商品，不自动换成其他商品。
- `onlineStoreUrl` 为空：允许使用 handle 回退链接，但在组件确认中标记。
- 读取结果发生变化：重新生成组件预览和内容哈希，原确认失效。
- 任务需要 Shopify 写操作：拒绝执行，不申请写权限，不提供绕过白名单的路径。
