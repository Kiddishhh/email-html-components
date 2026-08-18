# Freshine Omnisend 邮件 HTML 组件库

这是 Freshine 用于制作 Omnisend Campaign 草稿的邮件安全 HTML 组件库。项目把组件源码、完整内容/设置快照、Shopify 只读数据脚本、本地预览和 Omnisend Draft-only 上传固定在一套可测试流程中。

## 六个活动组件

| 顺序 | 组件 | `componentKey` | 源码目录 |
| --- | --- | --- | --- |
| 1 | 促销悬浮首图 | `hero.promotionalOverlay` | `头图/促销悬浮首图/` |
| 2 | 六宫格夏季促销 | `collection.saleGrid6` | `活动商品组件/六宫格夏季促销/` |
| 3 | 可链接整图 | `image.clickableFullWidth` | `通用图片组件/可链接整图/` |
| 4 | 双赠品奖励卡 | `gift.rewardGrid2` | `赠品与权益组件/双赠品奖励卡/` |
| 5 | 展厅地址卡 | `location.showroomCard` | `赠品与权益组件/展厅地址卡/` |
| 6 | 品牌信息页脚 | `footer.warm` | `页脚组件/品牌信息页脚/` |

活动路径的单一事实来源是 [`组件清单.json`](组件清单.json)。每个组件包含模板、内联 CSS 来源、内容 Schema、设置 Schema、fixture、defaults、中文管理说明和供样式选择直接打开的 `效果演示.html`。

通用组件库另包含双条文字评论（`review.textList2`，`评论组件/双条文字评论/`）、小样产品推荐卡（左）：`product.sampleProductRecommendationLeft`（`小样-产品/小样产品推荐卡（左）/`）、小样产品推荐卡（右）：`product.sampleProductRecommendationRight`（`小样-产品/小样产品推荐卡（右）/`）、窗帘产品推荐卡II（标题版，`product.curtainRecommendationOverlay`，`小样-产品/窗帘产品推荐卡II/`）和窗帘产品推荐卡II（无标题版，`product.curtainRecommendationNoTitle`，`小样-产品/窗帘产品推荐卡II（无标题版）/`）。五者均可在可视化 Skill 编辑器中自由添加与编辑；其中小样产品仍未加入 CLI Campaign 的固定六区段或内容注入流程。

## 目录结构

```text
.
├── build-email-template.v1.mjs       # 确定性邮件拼接器
├── 组件清单.json                      # 已注册组件与路径的单一事实来源
├── 组件索引.md                        # 组件维护入口
├── compositions/                     # 显式完整快照示例
├── skills/build-omnisend-campaign-draft/
│   ├── SKILL.md                       # Campaign 交互工作流
│   ├── references/                    # 结构、交互与安全契约
│   └── scripts/                       # Shopify 只读和 Omnisend Draft 脚本
├── tests/                             # Node.js 回归测试
├── 公共样式/                          # 邮件样式参考
└── 各组件分类目录/
```

`campaign-drafts/` 保存本地执行状态和预览证据，`build/` 保存可重新生成的输出；两者均被 Git 忽略。回归测试只使用已提交的默认组合与脱敏夹具，因此无需本地草稿目录也可运行。`docs/superpowers/` 保存历史设计和实施计划，不作为活动路径配置。

## 数据流

```text
fixture/defaults 初始参考
  → Skill 收集并逐组件确认
  → composition 写入完整 content/settings 快照
  → 拼接器校验、内联 CSS、按顺序渲染
  → 用户确认本地预览和 HTML 哈希
  → 固定脚本创建并回读 Omnisend Draft
```

拼接器不会读取共享主题、合并 defaults、访问 Shopify、修改组件源码或询问用户。composition 中的每个组件实例必须显式提供与 Schema 完全一致的 `content` 和 `settings`。

## 校验与构建

需要 Node.js 20 或更高版本，无第三方 npm 依赖。

先验证组件注册表、六区段结构、交互索引、Schema 和效果演示页：

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

生成包含本地默认素材的预览：

```bash
node build-email-template.v1.mjs \
  compositions/hero-grid-review-gifts-location.default.v1.json \
  --preview-local-assets
```

输出位于 `build/campaign-six-components.local-preview.html`。`asset://` 只用于本地预览；正式 HTML 必须使用公开 HTTPS 图片。

运行完整测试：

```bash
node --test tests/*.test.mjs
```

检查脚本语法：

```bash
for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs; do
  node --check "$file"
done
```

## Campaign Skill

入口是 [`skills/build-omnisend-campaign-draft/SKILL.md`](skills/build-omnisend-campaign-draft/SKILL.md)。工作流固定为六个区段，每次只确认一个区段和一个组件，最后把整封邮件确认绑定到静态 HTML SHA-256。

样式选择必须直接展示对应组件目录的 `效果演示.html`。正文背景色只写入组件 `settings`，不得修改邮件 `canvas`；页脚背景色独立确认。首图本地背景资源会相对于实际预览文件解析，最终上传时替换为公开 HTTPS URL。

## Shopify 只读边界

Skill 只允许：

- `shopify store info`
- query-only `shopify store execute`
- `shopify theme list`
- 把文件拉取到新临时目录的 `shopify theme pull`

禁止 GraphQL mutation、REST 写请求、`--allow-mutations` 及 Theme push、publish、delete、dev、share。首页活动只读取在线主题首页 `slideshow-v2`；选定 slide 后只读取它链接的一个 Page。六宫格只读取锁定 Collection 的前六个商品，每个商品先读 8 个变体，仅在没有可售变体时继续分页。

## Omnisend Draft-only 边界

最终确认后只运行：

```bash
node skills/build-omnisend-campaign-draft/scripts/upload-omnisend-draft.mjs \
  --project campaign-drafts/<name>/project-state.v1.json \
  --html campaign-drafts/<name>/campaign.static-safe.html
```

脚本在终端中隐藏询问 Omnisend API Key。密钥不得通过命令参数、环境变量、项目文件、README 或日志传入，也不会被保存。

脚本只允许上传已确认图片、只读获取 Brand、导入 HTML 模板、创建 Campaign Draft，以及回读 Campaign 和 Email Content。它不包含 `/send`、排期或发布调用，并要求回读状态仍为 `draft`。成功后默认保留本地草稿和脱敏回执；只有用户针对精确草稿明确确认后才能清理。

## 邮件兼容性

- 桌面目标宽度：600px
- 移动端检查宽度：375px
- 使用 table 布局与内联 CSS
- 最终图片必须是公开 HTTPS URL
- 必须保留 `[[unsubscribe_link]]`
- 禁止 JavaScript、iframe、表单、外部 CSS、Flex/Grid、绝对定位和运行时 Shopify 请求

本地静态测试通过只表示符合项目约束。正式使用前仍应在 Omnisend 中检查桌面/移动预览，并发送到内部测试邮箱验证 Gmail、Outlook 和 Apple Mail。
