# 六组件核心化与项目同步设计

## 目标

把当前组件库、Campaign Skill、确定性脚本、composition、测试和项目说明统一到同一份六组件边界；修复本次真实执行暴露的路径漂移、预览素材、Shopify 读取效率、背景图、本体背景色和 Omnisend Draft 上传契约问题；清除已确认不再维护的组件源码与生成物；初始化本地 Git 仓库。

## 活动组件边界

按以下顺序保留六个组件，`footer.warm` 必须唯一且最后：

1. `hero.promotionalOverlay` → `头图/促销悬浮首图`
2. `collection.saleGrid6` → `活动商品组件/六宫格折扣商品组件`
3. `image.clickableFullWidth` → `评论组件/可链接整图`
4. `gift.rewardGrid2` → `赠品与权益组件/双赠品奖励卡`
5. `location.showroomCard` → `地址组件/展厅地址卡`
6. `footer.warm` → `页脚组件/品牌信息页脚`

`组件清单.json`、`组件索引.md`、Skill 结构契约、交互索引、默认 composition、测试和 README 必须使用上述相同路径及顺序。

## 精确清理范围

删除不属于当前 Skill 的三个组件源码：

- `头图/节日促销首图/`
- `活动商品组件/编辑式叠放商品/`
- `赠品与权益组件/免费设计咨询/`

删除只服务于上述旧组件或旧架构的配置：

- `compositions/five-components.default.v1.json`
- `compositions/seasonal-sale-hero.default.v1.json`
- `themes/default-canvas.theme.v1.json`
- `themes/seasonal-sale-hero.theme.v1.json`

删除可由 composition 重新生成或已失去来源的根目录产物：

- `back-to-school-hero.local-preview.html`
- `seasonal-sale-hero.v1.local-preview.html`
- `头图-六宫格-评论整图链接-免费礼物-地址.html`
- `头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html`
- `邮件html模版.local-preview.html`
- `.DS_Store`

保留 `docs/superpowers/` 下的历史设计与计划作为决策记录，不把历史路径文本当作活动配置。保留 `campaign-drafts/test-back-to-school-sale/` 作为本次真实执行证据，但通过 `.gitignore` 排除整个 `campaign-drafts/`，不提交 Campaign 正文、图片或回执。

## 内容同步与防漂移

将 `compositions/hero-grid-review-gifts-location.default.v1.json` 作为唯一默认六组件 composition，并同步它的目录与本地素材路径。

扩展 `validate-campaign-contracts.mjs`，除结构和交互索引外，还必须验证：

- 每个候选 `componentKey` 在注册表中恰好出现一次；
- 注册表声明的模板、内容 Schema、设置 Schema、fixture、defaults、管理说明和 CSS 都存在；
- 六个候选组件目录都包含 `效果演示.html`；
- 内容与设置 Schema 的 `componentKey` 与注册表一致；
- 活动注册表不含已删除组件或旧分类路径。

新增回归测试约束注册表、默认 composition 和测试夹具只能使用活动目录，防止以后只移动源码而漏改消费者。

## 本次执行问题的固定修复

### 样式演示

样式选择直接打开注册表解析出的组件目录内 `效果演示.html`。校验器在工作流开始前阻止缺少演示页的候选进入选择流程。

### Shopify 首页活动读取

候选阶段只拉取在线主题 `templates/index.json` 并读取启用的 `slideshow-v2`。多个有效 slide 时要求用户选一个；选定后仅查询该 slide 对应的一个 Page，并只拉取首页和该 Page 模板用于快照复核。禁止读取 Sale 菜单和全量 Page。

### Collection 商品读取

只读取锁定 Collection 的前六个商品；每个商品首批读取 8 个变体，仅对尚未找到可售变体的商品分页。不得恢复为每个商品读取 250 个变体。

### 首图背景图

本地预览把 `asset://` 相对于实际 `previewOutput` 解析为存在的文件 URL，并同时替换 HTML `background` 属性和内联 `background-image`。最终静态 HTML 必须拒绝本地路径，上传脚本将已确认本地图片一次性上传并替换为公开 HTTPS URL。测试覆盖子目录预览、双位置替换、缺失资源和最终构建阻断。

### 背景色边界

统一正文背景色只写入支持该字段的组件 `settings`，不得修改 `canvas.backgroundColor` 或 `canvas.outerBackgroundColor`。页脚背景色独立确认。测试使用 composition 语义断言，不依赖手工查看整封邮件。

### Omnisend Draft 上传

继续只允许固定脚本执行图片上传、Brand 只读、HTML 模板导入、Campaign 创建和回读。API Key 只能通过交互式隐藏输入进入进程内存，不接受参数、环境变量、项目文件或日志。

创建 Campaign 后必须回读 `status: draft` 与 Email Content，校验退订令牌、公开图片 URL 和确认哈希。脚本不得包含或调用 `/send`、排期或发布端点。成功后默认保留本地项目与脱敏回执；清理项目草稿必须由用户另行明确确认，不再由 Skill 自动删除。

## README 与 Git

新增根目录 `README.md`，说明项目用途、六组件目录、完整快照数据流、构建与预览命令、测试命令、Skill 使用方式、Shopify 只读边界、Omnisend Draft-only 边界和密钥处理。

新增 `.gitignore`，至少忽略 `.DS_Store`、`campaign-drafts/`、根目录生成的静态 HTML/本地预览和常见临时文件；组件目录中的 `效果演示.html` 必须继续纳入版本控制。

完成内容同步、清理和验证后执行 `git init`。本任务只初始化仓库，不自动创建 commit、不配置 remote、不 push。

## 实施与验证

所有行为修复遵循测试先行：先添加能复现路径漂移或契约缺口的失败测试，确认按预期失败，再修改注册表、composition、校验器、Skill 或脚本使其通过。

完成条件：

- 六个活动组件均可由默认 composition 构建本地预览；
- 注册表、索引、Skill 契约和默认 composition 完全一致；
- 完整 Node 测试套件零失败；
- 所有 `.mjs` 通过 `node --check`；
- Skill frontmatter 和目录结构通过 Skill 校验；
- 删除清单中的路径均不存在，保留清单中的路径均存在；
- 根目录已是 Git 工作树，且没有自动提交、remote 或任何外部写入。
