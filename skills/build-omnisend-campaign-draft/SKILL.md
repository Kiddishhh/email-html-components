---
name: build-omnisend-campaign-draft
description: Use when creating, resuming, previewing, or uploading a Freshine component-based Omnisend email Campaign draft that may use Shopify activity, Collection, product, or user-provided data.
---

# Build Omnisend Campaign Draft

## 默认入口：可视化编辑器

创建、恢复或调整 Campaign 时，默认启动本地编辑器，而不是逐字段问答：

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

在浏览器打开 `http://127.0.0.1:4173`。编辑器从 `组件清单.json` 读取所有已注册组件及其目录内的 `效果演示.html`、默认完整快照和 Schema；用户可以自由添加、重复、拖拽排序或删除任意组件，不预置首图、商品、页脚等固定结构。每个新实例默认使用组件效果演示对应的完整默认值，选择实例后直接编辑其已开放字段，并实时生成 600px / 375px 预览。

“确认此组件”只锁定当前实例；任何内容、样式、导入、增删或排序操作都会使相关确认失效。Shopify 数据按钮只能调用本 Skill 明确列出的只读脚本，且只能更新用户当前选中的实例。最终 Omnisend 上传仍必须经过内容哈希绑定的整封确认，且只能写入 `draft`；编辑器不得存储或展示 API Key。旧的逐组件问答流程仅作为浏览器不可用时的 CLI 降级方案。

## 核心原则

先逐组件收集并锁定完整快照，再用确定性拼接器生成 HTML。最终交付文件必须是拼接器生成的完整 HTML；桌面端与移动端截图只作为验收证据，不得代替 HTML。必须先提供本地桌面端与移动端预览，并取得绑定内容哈希的最终确认；只能创建或更新未发送的 Omnisend Campaign 草稿。

## 必读资料

- 每次运行先读 [workflow-and-safety.zh-CN.md](references/workflow-and-safety.zh-CN.md)。
- 收集组件内容前读 [component-interactions.zh-CN.md](references/component-interactions.zh-CN.md)。
- 使用 Shopify 数据前读 [shopify-data-contract.zh-CN.md](references/shopify-data-contract.zh-CN.md)。
- 选择样式前读并运行 [campaign-structure.v1.json](references/campaign-structure.v1.json)、[campaign-component-interactions.v1.json](references/campaign-component-interactions.v1.json) 与 `scripts/validate-campaign-contracts.mjs`。

## 用户驱动的组件结构

Campaign 不预置组件顺序、数量、必选组件或末尾组件。用户提供的 `componentKey` 列表是唯一的组装顺序与成员来源；允许重复已注册组件。每个列出的组件必须同时存在于 `组件清单.json` 和 `campaign-component-interactions.v1.json`，否则停止并报告该 `componentKey`，不得以相邻组件替代或重排。

每次只展示并确认用户列表中的一个组件。必须直接打开组件目录中的 `效果演示.html` 作为样式演示；不得用单独素材图代替组件预览。完成当前组件后才处理列表中的下一个组件。不要修改组件源码来满足单次 Campaign 内容需求。

## 工作流

1. 定位组件根目录、作为活动组件路径单一事实来源的 `组件清单.json`、两份 Campaign JSON 契约和 `build-email-template.v1.mjs`；所有组件目录、Schema、默认快照、管理文档、样式与演示路径都必须从当前注册表解析，不得硬编码历史目录。先运行 `scripts/validate-campaign-contracts.mjs`，检查灵活选择契约、注册表文件、Schema、`效果演示.html` 与交互可用性。
2. 建立可恢复的本地项目草稿；禁止保存 API 密钥。
3. 收集 Campaign 名称（仅供内部识别和管理）、Subject（收件箱中显示的邮件主题）、Preheader（通常显示在主题旁或下方的预览摘要）；默认从 Omnisend Brand Assets 读取 Sender、Sender Email 和 Reply-to。
4. 将 Audience 默认设为所有订阅用户，并明确展示给用户。
5. 分别询问是否统一操作色和所选正文组件背景色。正文背景色只写入对应组件的完整 `settings` 快照，不得改写邮件 `canvas` 或外层背景；始终显示 `#RRGGBB`、中文颜色描述和可视色块。选中页脚时，其背景色不继承正文背景色。
6. 读取用户提供的 `componentKey` 列表并按其顺序逐个处理；每个键均须通过注册表和交互索引验证。直接进入列表第一个组件的内容收集，不额外展示固定结构或样式总览。
7. 按用户提供的顺序逐个收集内容和常用样式；每次只处理一个组件。选定 `hero.promotionalOverlay` 时，Shopify 活动数据仅按以下只读流程进入促销悬浮首图：先运行 `scripts/list-sale-activities.mjs`，只读拉取在线主题的首页 `templates/index.json`，从唯一启用的 `slideshow-v2` 中读取可用 slide，不读取 Shopify 菜单或全量 Page。一个 slide 候选时只问是否采用；多个 slide 候选时只让用户选编号。选择后立即运行 `scripts/fetch-sale-activity.mjs`：只查询该 slide 链接的一个 Page 模板，并重新拉取首页与该模板，解析推荐 Collection；快照不一致时停止。写入首图完整快照时，将首页 slide `subheading` 放入 `hero.eyebrow`（首行活动名称）、`heading` 放入 `hero.title`（第二行折扣消息）、`description` 放入 `hero.subtitle`（第三行补充说明）。选定后展示导入的 `subheading`、`heading`、`description` 与推荐 Collection，但不新增确认。首图默认随 600px 邮件画布全宽铺满。促销悬浮首图交互顺序固定为：主视觉图片 → Logo 样式确认 → 首图完成卡片。Logo 样式确认默认展示白色 FreShine 字标、`#A79689` 圆形背景与 70% 透明度；保持旧版圆形 106px、字标 80px。必须同时展示可编辑的 Logo 设置卡片、桌面端预览、375px 移动端预览及 Outlook 实色降级说明，只询问一次是否采用默认 Logo 样式。设置卡片按顺序显示 Logo 图片、Alt、点击链接、圆形背景色和透明度，所有默认值在确认前均可编辑；默认 Logo 图片仍使用现有白色 FreShine 字标。替换图片时接受公开 HTTPS URL 或用户明确提供的本地 Logo 文件；本地 Logo 只用于预览，最终确认后由固定脚本上传并替换为公开 HTTPS URL。圆形背景色只接受 `#A1B2C3` 格式，透明度只接受 0–100%，并确定性换算 `rgba`。每次修改后重新展示同一设置卡片和两种预览；106px 圆形与 80px 字标尺寸保持固定，不纳入编辑。Logo 确认不能替代后续首图完成卡片确认。

   选定 `hero.countdownOverlay` 时不得把 Shopify slide 文案导入该首图，也不得在倒计时首图阶段读取 Shopify。直接载入组件默认完整快照，提示桌面总画布约 `600×778px`、顶部导航 56px、主视觉约 `600×722px`，并收集一张建议 `600×722px`（高分辨率保持默认背景的 `1200×1443px` 比例）的公开 HTTPS 或本地背景图。画布使用 `width:100%;max-width:600px`，桌面固定在 600px 上限，移动端只收窄宽度。导航下方的跨两列外壳保持 table-cell，背景放入内部单列 `td`；只在内层背景使用 `height:120vw`、`min-height:560px`、`max-height:722px` 和 `display:block`，不得直接把跨列外壳改成 block。600px 桌面主视觉稳定为 722px；375px 移动端主视觉稳定为 560px，含固定 56px 导航的总高约 616px。背景使用 `cover` 与 `center center`，移动端允许可控的左右裁切。中央面板桌面最大宽度为 460px、最大高度为 520px，内容垂直居中；约 375px 移动端仍由两侧各 10px 留白限制为约 355px 宽，并以 `86.67vw` 收窄到约 325px 高，内容较多时允许自然高度撑开。内部采用 28px 24px 内边距和 8/14/22/22px 四段间距；Logo 为 108px，分隔图为 220px，CTA 为 200×44px。倒计时只使用一个可编辑字段 `countdown.title`，默认值为 `Only 3 Days Left`；标题框固定为 280px 宽并使用正常空白自然换行，使默认文案显示为第一行 `Only 3`、第二行 `Days Left`，模板不得插入固定换行标签或拆分字段。标题使用 Lora Regular，字重 400、字号 50px、行高 64px、字间距 0px、居中对齐，补充文字均用 Montserrat 14px/21px。左侧导航使用 14px/20px，在窄屏允许自然换成两行但导航仍保持 56px。默认文案、导航、Logo、分隔图、链接和按钮均在一张当前设置卡片中展示，用户主动指出时才修改。`SIGN UP` 使用独立的 `color.navigationRight`，`SHOP NOW` 使用 `color.theme`；参考图两者默认均为 `#725A4B`，左侧导航参考图默认值为 `#97866D`。初始快照把该配色来源记录为 `reference-default`，不运行脚本覆盖。用户主动修改 CTA 主题色且没有左侧覆盖值时，才运行 `scripts/derive-countdown-theme.mjs --theme <#RRGGBB>`，以主题色 35%、浅色基准 65% 生成协调的左侧导航色，浅色基准固定为 `#F4F1EC`；用户可分别单独修改左侧或右侧导航色，直到明确要求恢复自动配色。展示当前设置卡片、桌面端预览和约 375px 移动端预览后只进行一次完成确认，不增加字体、颜色或默认链接的独立确认。

   选定 `collection.saleGrid6` 时，编辑器显示“shopify商品导入”按钮；输入完整 Freshine Page 或 Collection URL 后运行 `scripts/fetch-activity-page-sale-grid.mjs --shopify-url <URL>`。该入口复用 `fetch-sale-grid.mjs` 的只读商品读取和变体分页规则。Page 从对应线上主题模板按顺序解析首个启用 `products-grid-v2` 的 Collection，Collection 则直接读取商品；两种路径都按来源当前排序注入前六个商品，并保留输入 URL 作为 CTA。商品图片必须使用媒体按 `POSITION` 排序后的第一张 `MediaImage`，不得退回 `featuredImage`、变体图或视频缩略图；无首图时停止。脚本每个商品先读取 8 个变体，仅在未找到可售变体的商品上继续分页，不得恢复为每商品 250 个变体。其他组件写出符合各自 Schema 的完整 `content` 与 `settings` 快照。`collection.saleGrid6` 完成默认注入后，先用一张当前设置卡片展示全部注入内容及默认 CTA，由用户主动指出需要修改的项目，不逐字段重复追问。该组件用一个操作色控制全部折扣标签和 CTA 按钮主题色，背景色作为独立设置；已有对应全局色时只展示继承值并等待用户主动修改，没有时才分别询问。`image.clickableFullWidth` 默认使用组件完整快照中的评论整图，600px 全宽、零外边距；在完成卡片中展示图片、Alt 和整图链接，用户主动提出时才替换图片或链接。选定 `image.benefitsStrip3` 时，默认保留当前三项权益图；该图片在 600px 桌面端全宽显示并在 375px 移动端等比例缩放。图片内部图标、文案和底色不可拆分编辑，整张图片不绑定链接；完成卡片集中展示图片、Alt、背景色和双端预览，用户主动提出时才替换默认值。
8. 为每个组件生成桌面端与移动端预览。本地预览使用 `--preview-local-assets` 时，必须将每个 `asset://` 本地资源相对于生成的 `previewOutput` HTML 解析，并验证该 URL 指向实际文件；项目草稿位于子目录时不得按工作区根目录直接写入资源 URL。组件目录中的 `component.template.v1.html` 是拼装片段，`效果演示.html` 是注入默认完整快照后的独立本地 HTML 演示；样式卡和组件确认必须打开后者。`collection.saleGrid6` 同时展示当前设置卡片、桌面端预览和约 375px 移动端预览，只询问一次是否确认；用户指出修改时重新生成三项内容，只有明确确认后才锁定。修改时只重开指定组件。
9. 让现有拼接器只执行完整快照校验、组件 CSS 内联、顺序组装和 HTML 渲染。禁止让拼接器询问用户、访问 Shopify、合并主题或改变组件样式。
10. 生成整封邮件的完整本地预览 HTML、可直接打开的本地链接和最终高层清单。HTML 是正式交付与后续 Omnisend 草稿上传的唯一内容源；截图仅用于桌面端和移动端验收。将最终确认绑定到 HTML 内容哈希；任何修改都使确认失效。
11. 最终确认后，必须运行固定脚本 `scripts/upload-omnisend-draft.mjs --project <project-state.v1.json> --html <campaign.static-safe.html>`。脚本先在本地校验确认哈希，再运行时询问 Omnisend API Key；密钥只存在于当前进程内存，禁止以参数、环境变量、文件或聊天记录传入。任一图片上传失败时停止 Omnisend 写入并保留项目草稿。
12. 不得手工拼接或调用 Omnisend 请求。项目已有 Campaign ID 与 Content ID 时，固定脚本必须先回读并确认现有 Campaign 为 `draft`，再保留 Email Content 完整结构与节点 ID，仅替换唯一含退订令牌的 HTML 正文并执行完整 `PUT`；必须更新现有 draft，不得新建第二份 Campaign。项目没有既有 ID 时才允许只读 Brand、上传图片、导入 HTML 模板并创建 Campaign 草稿。两种路径都不得调用 `/send`、排期、发布或等效端点。
13. 脚本回读 Campaign 与 Email Content，验证 `status: draft`、内容 ID、组件顺序、退订令牌、图片地址和内容哈希；只有全部验证通过才输出最小上传回执。
14. 回读成功后默认保留本地项目草稿和不含密钥的上传回执，便于审计与恢复。只有用户针对该草稿明确确认清理后才删除；不得把上传成功视为删除授权。

### `hero.countdownOverlay2` 专用交互

选定“倒计时头图2”时沿用 `hero.promotionalOverlay` 的 Shopify 只读活动候选与快照锁定流程：一个候选时只问是否使用，多个候选时只让用户选编号；将 `subheading`、`heading`、`description` 分别写入 `hero.eyebrow`、`hero.title`、`hero.subtitle`，并把选定活动页 URL 写入 `hero.cta.url`，同时锁定推荐 Collection。展示导入文案、活动页和推荐 Collection，不新增文案确认。进入六宫格时直接复用该锁定快照，不重复读取或询问。

随后必须主动收集主图：先说明组件画布为 600px、图片使用 `1:1` 比例且以 90% 内层卡片显示，桌面端主图为 `540×540px`、约 375px 预览中为 `337.5×337.5px`，再提示建议源图 `1200×1200px`和中央安全区；只提供使用组件默认裁切图、提供本地路径、提供公开 HTTPS URL 三种来源。比例不符时运行 `scripts/prepare-countdown-hero-2-image.mjs --input <本地图片> --output <独立衍生图>` 生成 `1200×1200px` 居中裁切图，不覆盖原图；无法读取或生成时停止。主图与图下文案区必须同宽并作为内层卡片置于组件背景色上，保留左右和底部背景留白。`ONLY 3 DAYS!` 固定使用 Lora 字体，三项权益之间固定显示两条竖向分隔线。

`ONLY 3 DAYS!` 是静态可编辑文案。顶部促销栏及 `SIGN UP` 固定为 14px/20px且导航栏高度保持 52px；主标题下补充说明固定为 14px/21px；底部补充提示固定为 14px/20px；三项权益保持 12px/15px。三项权益数量、顺序及移动端三栏布局固定，每项建议不超过 24 个英文字符，超长只警告不截断。Logo 默认使用组件自有的透明底深棕色 FreShine 字标，字标色为 `#652E17`，Logo 区继续使用组件整体背景色，不新增独立色块。Logo、顶部促销条、倒计时、三项权益、CTA、补充提示和默认链接都是完成卡片中的可编辑当前值，不逐字段追问。CTA 优先继承全局操作色，Logo 区和活动文案区优先继承全局正文背景色；未设全局色时用组件默认值。图下文案区背景与顶部促销条始终先用组件默认色，用户主动提出时才修改。最后同时展示一张完成卡片、600px 桌面端预览和约 375px 移动端预览，只询问一次是否确认；修改时只刷新同一组内容。

## 强制安全门

- 不得发送、排期、发布或调用任何使 Campaign 离开 `draft` 状态的接口。
- Shopify 访问必须严格只读。只允许契约白名单中的查询、主题列表和主题拉取命令；不得修改、创建、发布或删除 Shopify 店铺数据及主题。
- 不得在用户最终确认前上传图片或写入 Omnisend。
- 不得保存、回显或写入日志中的 Shopify/Omnisend 密钥。
- Omnisend API Key 必须在本地预检通过后运行时询问；不得用命令行参数、环境变量或项目文件传入，不得让模型手工构造 Omnisend 写入请求。
- 不得在邮件中使用 JavaScript、iframe、表单、本地路径、相对图片路径或运行时 Shopify 请求。
- 不得删除失败运行的项目草稿。
- 成功运行也默认保留项目草稿；只有用户明确确认清理后才可删除精确目标。
- Omnisend Email Content 更新是完整替换；更新前必须回读现有草稿并保留必要结构、ID 与 `[[unsubscribe_link]]`。

## 当前实施状态

这是持续完善中的第一版 Skill。用户驱动的组件列表、交互索引、本地结构校验器、自动活动候选发现、所选活动快照解析、六宫格读取和固定 Draft 上传脚本均以本地 fixture 测试约束；真实账户写入仍需用户在最终确认后运行脚本并核验回读结果。
