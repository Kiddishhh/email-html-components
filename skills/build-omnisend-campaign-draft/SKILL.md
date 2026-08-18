---
name: build-omnisend-campaign-draft
description: Use when creating, resuming, previewing, or uploading a Freshine component-based Omnisend email Campaign draft that may use Shopify activity, Collection, product, or user-provided data.
---

# Build Omnisend Campaign Draft

## 默认入口：可视化编辑器

创建、恢复或调整 Campaign 时，默认启动旧版本地编辑器：

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

在浏览器打开 `http://127.0.0.1:4173`。编辑器从 `组件清单.json` 读取所有已注册组件及其目录内的 `效果演示.html`、默认完整快照和 Schema；用户可以自由添加、重复、拖拽排序或删除任意组件，不预置固定结构。每个新实例使用组件当前默认值，可编辑已开放字段，并实时生成 600px / 375px 预览。

### 单品窗帘促销卡变体

活动商品分类已登记两款自由组合组件：`collection.curtainPromotionCard`（单品窗帘促销卡（标题款））和 `collection.curtainPromotionCardNoTitle`（单品窗帘促销卡（无标题款））。两者都可从组件库自由添加、重复、排序或删除；标题款额外开放顶部 `promotion.title` 和 `promotion.subtitle`，无标题款不显示这两项而直接从商品图片开始。两款均开放促销角标、商品图片与点击链接、商品标题、说明、CTA、组件背景色和角标底色；默认图仅供本地预览，最终 Omnisend HTML 必须替换为公开 HTTPS 图片。它们不属于旧版 CLI 的六个固定区段，不加入 `campaign-structure.v1.json` 或 `campaign-component-interactions.v1.json` 的固定选择流程。

`小样-产品` 分类现包含小样产品推荐卡（左）、小样产品推荐卡（右）、窗帘产品推荐卡II（标题版）和窗帘产品推荐卡II（无标题版）；四者可在编辑器中添加、排序和编辑各自已开放的内容与颜色字段。该分类不改变 CLI 降级流程的固定六区段。

顶部“上传 Omnisend 草稿”会先确认全部组件并生成静态安全 HTML；内容哈希只在本机内部校验，不要求用户手动复制或粘贴。随后编辑器弹窗一次性收集 Omnisend API Key，支持粘贴与显示/隐藏；密钥仅在本次浏览器请求和本机进程内存中使用，完成或失败后立即清空，不写入草稿、参数、环境变量、文件或日志。上传前按 Campaign 名称精确检索 `draft`，如有多个同名草稿则更新最近更新的一封；未找到才新建 Draft。上传固定委托 `scripts/upload-omnisend-draft.mjs`，不得发送、排期或发布。浏览器不可用时，以下固定六区段流程仍可作为 CLI 降级方案：脚本在运行时通过终端隐藏询问 Omnisend API Key，且同样不会保存密钥。

顶部“导出 Omnisend HTML”是独立的图片替换与剪切板流程：确认全部组件后，编辑器仅上传本地图片到 `/api/images/upload`，将 `asset://` 替换为公开 HTTPS URL，并把完整 HTML 写入浏览器剪切板。它不会创建、更新或发送 Campaign 或 Draft，不会调用模板、Campaign 或 Email Content 端点，也不保存完整 HTML、API Key 或导出回执。若浏览器拒绝剪切板权限，界面展示本次已替换 URL 的只读文本供手动复制；不得重新上传图片或改走 Draft 上传流程。

## 核心原则

先逐组件收集并锁定完整快照，再用确定性拼接器生成 HTML。必须先提供本地桌面端与移动端预览，并取得绑定内容哈希的最终确认；只能创建或更新未发送的 Omnisend Campaign 草稿。

## 必读资料

- 每次运行先读 [workflow-and-safety.zh-CN.md](references/workflow-and-safety.zh-CN.md)。
- 收集组件内容前读 [component-interactions.zh-CN.md](references/component-interactions.zh-CN.md)。
- 使用 Shopify 数据前读 [shopify-data-contract.zh-CN.md](references/shopify-data-contract.zh-CN.md)。
- 选择样式前读并运行 [campaign-structure.v1.json](references/campaign-structure.v1.json)、[campaign-component-interactions.v1.json](references/campaign-component-interactions.v1.json) 与 `scripts/validate-campaign-contracts.mjs`。

## 第一版组件边界

当前 Campaign 使用以下六个固定区段，顺序不可改变：

1. 首图：`hero.promotionalOverlay`
2. 促销多商品栏：`collection.saleGrid6`
3. 整图链接：`image.clickableFullWidth`
4. 赠品：`gift.rewardGrid2`
5. 地址：`location.showroomCard`
6. 页脚：`footer.warm`

每个区段必须从当前可用候选中恰选一种样式；每次只展示并询问一个区段的样式，按上述顺序完成六次选择。样式卡只显示中文名称、预览图和一句话用途，不显示 `componentKey`。预览图必须直接展示候选组件目录中的 `效果演示.html` 作为样式演示；不得用单独素材图代替组件预览。`footer.warm` 必须添加、只能出现一次并永远位于最后；页脚背景色仍须单独询问。其默认效果演示为精致暖棕信息层级：品牌标题、地址与联系信息、按 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads 排列的七枚紧凑社媒图标、法律信息和退订链接依次清晰分组。

只允许结构配置与交互索引均验证通过的样式出现在选择卡中；缺少索引项的组件标记为“准备中”，不可选择。不要修改组件源码来满足单次 Campaign 内容需求。

## 工作流

1. 定位组件根目录、作为活动组件路径单一事实来源的 `组件清单.json`、两份 Campaign JSON 契约和 `build-email-template.v1.mjs`；先运行 `scripts/validate-campaign-contracts.mjs`，检查六个区段、注册表文件、Schema、`效果演示.html`、候选样式及交互可用性。
2. 建立可恢复的本地项目草稿；禁止保存 API 密钥。
3. 收集 Campaign 名称（仅供内部识别和管理）、Subject（收件箱中显示的邮件主题）、Preheader（通常显示在主题旁或下方的预览摘要）；默认从 Omnisend Brand Assets 读取 Sender、Sender Email 和 Reply-to。
4. 将 Audience 默认设为所有订阅用户，并明确展示给用户。
5. 分别询问是否统一操作色和正文组件背景色。正文背景色只写入对应组件的完整 `settings` 快照，不得改写邮件 `canvas` 或外层背景；始终显示 `#RRGGBB`、中文颜色描述和可视色块；页脚背景色不继承正文背景色。
6. 按结构配置顺序逐个展示六个区段的样式卡；每次确认当前区段的一种样式后，才展示下一结构。六个区段都确认后直接进入首图内容收集，不额外展示样式总览。
7. 按顺序逐个收集内容和常用样式；每次只处理一个组件。首图阶段先运行 `scripts/list-sale-activities.mjs`：只读拉取在线主题的首页 `templates/index.json`，从唯一启用的 `slideshow-v2` 中读取可用 slide，不读取 Shopify 菜单或全量 Page。一个 slide 候选时只问是否采用；多个 slide 候选时只让用户选编号。选择后立即运行 `scripts/fetch-sale-activity.mjs`：只查询该 slide 链接的一个 Page 模板，并重新拉取首页与该模板，解析推荐 Collection；快照不一致时停止。写入首图完整快照时，将首页 slide `subheading` 放入 `hero.eyebrow`（首行活动名称）、`heading` 放入 `hero.title`（第二行折扣消息）、`description` 放入 `hero.subtitle`（第三行补充说明）。选定后展示导入的 `subheading`、`heading`、`description` 与推荐 Collection，但不新增确认。首图默认随 600px 邮件画布全宽铺满。首图交互顺序固定为：主视觉图片 → Logo 样式确认 → 首图完成卡片。Logo 样式确认默认展示白色 FreShine 字标、`#A79689` 圆形背景与 70% 透明度；保持旧版圆形 106px、字标 80px。必须同时展示可编辑的 Logo 设置卡片、桌面端预览、375px 移动端预览及 Outlook 实色降级说明，只询问一次是否采用默认 Logo 样式。设置卡片按顺序显示 Logo 图片、Alt、点击链接、圆形背景色和透明度，所有默认值在确认前均可编辑；默认 Logo 图片仍使用现有白色 FreShine 字标。替换图片时接受公开 HTTPS URL 或用户明确提供的本地 Logo 文件；本地 Logo 只用于预览，最终确认后由固定脚本上传并替换为公开 HTTPS URL。圆形背景色只接受 `#A1B2C3` 格式，透明度只接受 0–100%，并确定性换算 `rgba`。每次修改后重新展示同一设置卡片和两种预览；106px 圆形与 80px 字标尺寸保持固定，不纳入编辑。Logo 确认不能替代后续首图完成卡片确认。只有首图完成卡片已锁定，才运行 `scripts/fetch-sale-grid.mjs --collection-handle <锁定推荐 Collection handle> --count 6` 注入六宫格商品；商品图片必须使用媒体按 `POSITION` 排序后的第一张 `MediaImage`，不得退回 `featuredImage`、变体图或视频缩略图；无首图时停止。脚本每个商品先读取 8 个变体，仅在未找到可售变体的商品上继续分页，不得恢复为每商品 250 个变体。其他组件写出符合各自 Schema 的完整 `content` 与 `settings` 快照。`collection.saleGrid6` 完成默认注入后，先用一张当前设置卡片展示全部注入内容及默认 CTA，由用户主动指出需要修改的项目，不逐字段重复追问；CTA 使用居中的固定 486px 表格，并保留 `width:100%;max-width:486px` 以适配窄屏，使按钮左右边缘在 Gmail 中也与两列商品图片的外边缘对齐，不作为可编辑样式项。该组件用一个操作色控制全部折扣标签和 CTA 按钮主题色，背景色作为独立设置；已有对应全局色时只展示继承值并等待用户主动修改，没有时才分别询问。`image.clickableFullWidth` 默认 600px 全宽、零外边距；先提示参考尺寸与移动端缩放，再收集用户提供的公开 HTTPS 图片链接。
8. 为每个组件生成桌面端与移动端预览。本地预览使用 `--preview-local-assets` 时，必须将每个 `asset://` 本地资源相对于生成的 `previewOutput` HTML 解析，并验证该 URL 指向实际文件；项目草稿位于子目录时不得按工作区根目录直接写入资源 URL。`collection.saleGrid6` 同时展示当前设置卡片、桌面端预览和约 375px 移动端预览，只询问一次是否确认；用户指出修改时重新生成三项内容，只有明确确认后才锁定。修改时只重开指定组件。
9. 让现有拼接器只执行完整快照校验、组件 CSS 内联、顺序组装和 HTML 渲染。禁止让拼接器询问用户、访问 Shopify、合并主题或改变组件样式。
10. 生成整封邮件的本地预览链接和最终高层清单。将最终确认绑定到 HTML 内容哈希；任何修改都使确认失效。编辑器内部完成这一校验，不要求用户手动确认哈希。
11. 最终确认后，编辑器弹窗收集一次性 Omnisend API Key 并调用固定上传器。密钥仅存在于当前浏览器请求与本机进程内存，完成或失败后立即清空；禁止写入参数、环境变量、文件、日志或聊天记录。任一图片上传失败时停止 Omnisend 写入并保留项目草稿。
12. 不得手工拼接或调用 Omnisend 请求。上传器先按 Campaign 名称精确检索 `draft`，如有多个同名 Draft 则更新最近更新的一份；项目已有 Campaign ID 时仍优先回读并确认该 Campaign 为 `draft`，只能更新现有 `draft`，不得新建 Campaign。更新路径必须保留 Email Content 完整结构与节点 ID，仅替换唯一含退订令牌的 HTML 正文并执行完整 `PUT`；没有匹配 Draft 才允许只读 Brand、上传图片、导入 HTML 模板并创建 Campaign 草稿。两种路径都不得调用 `/send`、排期、发布或等效端点。
13. 脚本回读 Campaign 与 Email Content，验证 `status: draft`、内容 ID、组件顺序、退订令牌、图片地址和内容哈希；只有全部验证通过才输出最小上传回执。
14. 回读成功后默认保留本地项目草稿和不含密钥的上传回执，便于审计与恢复。只有用户针对该草稿明确确认清理后才删除；不得把上传成功视为删除授权。

## 强制安全门

- 不得发送、排期、发布或调用任何使 Campaign 离开 `draft` 状态的接口。
- Shopify 访问必须严格只读。只允许契约白名单中的查询、主题列表和主题拉取命令；不得修改、创建、发布或删除 Shopify 店铺数据及主题。
- 不得在用户最终确认前上传图片或写入 Omnisend。
- 不得保存、回显或写入日志中的 Shopify/Omnisend 密钥。
- Omnisend API Key 必须在本地预检通过后由编辑器弹窗一次性收集；支持粘贴与显示/隐藏，完成或失败后必须清空。不得写入命令行参数、环境变量、项目文件、日志或聊天记录，不得让模型手工构造 Omnisend 写入请求。
- 不得在邮件中使用 JavaScript、iframe、表单、本地路径、相对图片路径或运行时 Shopify 请求。
- 不得删除失败运行的项目草稿。
- 成功运行也默认保留项目草稿；只有用户明确确认清理后才可删除精确目标。
- Omnisend Email Content 更新是完整替换；更新前必须回读现有草稿并保留必要结构、ID 与 `[[unsubscribe_link]]`。

## 当前实施状态

这是持续完善中的第一版 Skill。六个固定区段、可选性索引、本地结构校验器、自动活动候选发现、所选活动快照解析、六宫格读取和固定 Draft 上传脚本均以本地 fixture 测试约束；真实账户写入仍需用户在最终确认后运行脚本并核验回读结果。
