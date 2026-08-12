# Omnisend 邮件生成与 Campaign 草稿 Skill 初步设计

> 状态：架构草案，已与当前 V1 完整快照拼接器同步；Skill 尚未实施
> 目的：确定管理方向；等待组件库完成后，再补充详细字段契约、测试和正式 Skill。

## 1. 目标

创建一个交互式 Codex Skill，基于当前维护的邮件 V1 组件，引导用户完成以下工作：

1. 选择本次邮件需要的组件。
2. 确定组件排列顺序。
3. 逐个组件收集文案、图片、链接和常用样式。
4. 支持从 Shopify Admin API 读取商品或图片，也支持用户手动输入。
5. 逐个展示和确认组件内容。
6. 收集邮件整体主题与 Campaign 信息。
7. 将每个已确认组件写成完整内容/设置快照，交给独立拼接器按顺序生成 Omnisend 支持的最终 HTML。
8. 将本地图片上传到 Omnisend Image Library，并用返回的公开 HTTPS 地址重新生成正式 HTML。
9. 创建或更新一个未发送的 Campaign 草稿，并回读验证。

第一版不保存可恢复的“邮件项目配置”。运行过程中的选择只保留在当前会话和临时数据中；最终保留 HTML、Campaign ID、Email Content ID 和检查结果。是否额外保存 Saved Template 属于可选部署步骤，不是生成 Campaign 草稿的前置条件。

## 2. 核心原则

### 2.1 组件是唯一设计源

Skill 不复制、不重写组件。组件目录中的以下文件继续作为唯一来源：

- `component.template.v1.html`
- `component.styles.v1.css`
- `content.schema.v1.json`
- `settings.schema.v1.json`
- `settings.defaults.v1.json`
- `COMPONENT_MANAGEMENT.zh-CN.v1.md`

组件的结构和主要样式由组件自己维护；Skill 只读取组件、注入数据并组合输出。

### 2.2 保留独立拼接器，但收窄职责

Skill 负责询问、收集、确认和形成每个组件的完整 `content`/`settings` 快照；独立拼接器继续存在，但只负责校验快照、内联组件 CSS、按指定顺序组合和输出 HTML。拼接器不得读取共享主题、隐式合并设置、修改组件源码或替用户决定样式。

Skill 可以在内部调用拼接器，对用户表现为“一次交互生成”。该确定性渲染步骤用于保证：

- 占位字段完整替换；
- 组件顺序准确；
- 输出结果可重复；
- HTML 结构不被模型随意改写；
- Omnisend 与常见邮件客户端兼容。

### 2.3 逐组件确认

每个组件单独完成以下状态流转：

`选择组件 → 收集数据 → 生成预览 → 用户确认 → 锁定`

已确认组件默认不再改变。若用户要求修改，只重新打开指定组件，不影响其他已确认组件。

### 2.4 默认只创建草稿

Skill 可以创建 Campaign 草稿；如用户明确需要，也可以额外保存 Saved Template。但不得调用 Campaign Send 或 Schedule 接口，不得发送或排期。

Campaign 创建完成后必须回读，并确认状态为 `draft`。

## 3. 建议的交互流程

### 阶段 A：运行前检查

1. 定位组件目录和 `组件清单.json`。
2. 检查组件版本、模板、Schema、默认设置和说明文档是否齐全。
3. 检查 Omnisend API 凭据是否通过运行环境提供。
4. 如果用户选择 Shopify 数据源，再检查 Shopify 店铺和只读权限。
5. API 密钥只能在当次运行中使用，禁止写入 Skill、HTML、日志或项目文件。

### 阶段 B：选择邮件结构

Skill 展示当前可用组件，并询问：

- 本次需要哪些组件；
- 每个组件使用几次；
- 最终排列顺序；
- 是否需要页脚。

页脚原则上必须包含有效的退订链接；如果用户取消页脚，Skill 必须检查其他位置是否已包含退订入口。

### 阶段 C：收集整体主题

第一版只开放常用设置，避免过度复杂：

- 邮件内容背景色；
- 画布之外背景色；
- 品牌主题色；
- 按钮背景色与文字色；
- 标题色与正文色；
- 标题字体与正文字体；
- 组件上下间距。

未填写的设置由 Skill 从组件 `settings.defaults.v1.json` 取得初始值。用户确认后，Skill 必须把 Schema 中的全部设置字段写入 composition 完整快照；拼接器不会自动读取 defaults。整体主题只能转换为组件明确允许的实例字段，不应直接替换组件内部布局 CSS。

### 阶段 D：逐组件收集内容

Skill 根据每个组件的 `content.schema.v1.json` 逐项询问：

- 标题、副标题和正文；
- 按钮文字及目标链接；
- 图片、图片链接及 alt 文本；
- 商品名称、价格、描述和落地页；
- 组件允许调整的常用设置。

每项数据可来自：

1. 用户手动输入；
2. 用户提供的公开 HTTPS 图片链接；
3. Shopify Admin GraphQL API 查询结果；
4. Shopify Files 中的店铺素材。

Shopify 数据必须在生成时读取并写入静态 HTML。邮件中不得包含脚本，也不得在收件人打开邮件时实时请求 Shopify。

### 阶段 E：组件确认

每完成一个组件，Skill 应显示：

- 桌面端预览；
- 移动端预览；
- 本组件使用的文案、图片和链接摘要；
- 数据来源；
- 未填写而使用默认值的字段。

用户确认后锁定该组件，再进入下一个组件。

### 阶段 F：Campaign 信息

Skill 同步收集：

- 最终 HTML 文件名；
- Campaign 名称；
- 邮件主题 Subject；
- 预览文字 Preheader；
- 发件人名称；
- 发件邮箱；
- Reply-to 邮箱；
- 邮件语言。

Audience 默认设置为 Omnisend 的所有订阅用户。最终确认中必须醒目标注：

`目标受众：所有订阅用户`

用户也可以在创建前改为指定 Segment。第一版只创建草稿，因此不收集发送时间。

### 阶段 G：最终确认

写入 Omnisend 前，展示一次完整摘要：

- 组件列表与顺序；
- 每个组件的确认状态；
- 整体主题设置；
- Campaign 名称、Subject、Preheader 和发件人；
- Audience；
- 最终 HTML 检查结果。

只有用户明确确认后，才能上传本地图片并创建或更新 Campaign 草稿。不得因为生成了本地预览就自动写入 Omnisend。

## 4. HTML 生成要求

最终 HTML 应满足：

- 邮件主体宽度为 600px；
- 在约 375px 的移动端可正常缩放或堆叠；
- 布局以邮件兼容的表格结构为主；
- 关键样式内联；
- 图片使用公开 HTTPS URL，并具有 alt 文本；
- 链接使用公开 HTTPS URL；
- 不包含 JavaScript、iframe、表单或依赖浏览器运行的逻辑；
- 保留有效的 Omnisend 退订链接；
- 文件大小不超过 Omnisend HTML Import API 的限制；
- 不直接依赖本地文件路径；
- 字体必须提供可靠的系统字体回退。

本地预览可以加载额外字体和模拟 Omnisend 平台留白，但正式上传内容必须以真实邮件客户端兼容性为准。

## 5. Omnisend 写入流程

1. 上传 composition 中仍为本地素材的图片，取得 Omnisend Image Library 的公开 HTTPS 地址。
2. 将地址写回本次完整内容快照，确认不存在 `asset://`、本地路径或临时预览 URL。
3. 运行独立拼接器生成正式 HTML，并完成静态安全检查。
4. 创建新的 Campaign 草稿，或在用户明确指定的现有草稿上更新 Email Content；更新前必须回读并确认状态仍为 `draft`。
5. 写入或保留 Subject、Preheader、Sender、Language 和 Audience；更新现有草稿时不得意外改变受众或发送设置。
6. 回读 Campaign 与 Email Content，检查状态、内容 ID、组件顺序、图片、唯一退订链接和内容哈希。
7. 打开 Omnisend Desktop/Mobile 预览供用户检查。

禁止调用：

- Campaign Send；
- Campaign Schedule；
- 任何会使状态离开 `draft` 的接口。

## 6. 初步 Skill 结构

正式制作时可采用以下结构：

```text
build-omnisend-campaign-draft/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/
│   ├── discover-components.mjs
│   ├── render-email.mjs
│   ├── validate-email.mjs
│   ├── shopify-source.mjs
│   └── omnisend-client.mjs
└── references/
    ├── component-contract.md
    ├── omnisend-import-rules.md
    └── confirmation-and-safety.md
```

Skill 不内置组件副本。它从当前工作目录或用户指定的组件根目录读取 `组件清单.json`。

## 7. 组件完成前需要统一的契约

正式制作 Skill 之前，每个组件至少应满足：

1. 拥有唯一、稳定的英文组件 ID。
2. 模板中的内容字段全部在 content schema 中声明。
3. 可配置样式全部在 settings schema 中声明并具有默认值。
4. 必填图片、链接和 alt 字段定义明确。
5. 组件能独立渲染和预览。
6. 组件能在 600px 桌面端和约 375px 移动端通过检查。
7. 不依赖其他组件的内部 CSS。
8. 文档说明哪些字段允许 Skill 修改，哪些结构禁止修改。

## 8. 后续实施顺序

等组件库全部设计完成后，再执行：

1. 冻结组件 V1 字段契约。
2. 审核全部组件的 Schema 和默认值。
3. 定义 Skill 的标准交互问题。
4. 创建 Skill 目录和基础文件。
5. 实现组件发现、渲染和验证程序。
6. 实现 Shopify 只读数据适配。
7. 实现 Omnisend Image、Email Content 与 Campaign Draft API；Saved Template 作为可选适配器单独实现。
8. 使用手动数据完成离线测试。
9. 使用 Shopify 测试数据完成数据注入测试。
10. 使用 Omnisend 测试草稿完成桌面端、移动端和回读验证。

## 9. 当前不纳入第一版的功能

- 保存或恢复邮件项目配置；
- 自动发送或自动排期；
- A/B Test Campaign；
- Booster Campaign；
- 自动创建或修改 Omnisend Segment；
- 在邮件打开时实时读取 Shopify；
- 任意 CSS 属性编辑器；
- 自动修改组件源文件；
- Omnisend 原生动态商品推荐区块。

这些功能可以在第一版稳定后单独评估，不应阻塞当前组件库建设。
