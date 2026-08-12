# 六组件核心化与项目同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目源码、组件注册表、默认 composition、Campaign Skill、脚本契约和文档统一为已确认的六组件核心，并清理旧组件与生成物后初始化 Git。

**Architecture:** 以 `组件清单.json` 为组件路径单一事实来源，Skill 的结构契约只通过 `componentKey` 引用候选，校验器在工作流开始前把注册表、目录、Schema、演示页和交互索引联结验证。拼接器继续只消费显式完整快照，不引入主题合并或运行时数据读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON Schema 风格契约、table/inline-CSS 邮件 HTML、Markdown。

## Global Constraints

- 活动组件顺序固定为 `hero.promotionalOverlay`、`collection.saleGrid6`、`image.clickableFullWidth`、`gift.rewardGrid2`、`location.showroomCard`、`footer.warm`。
- Shopify 只允许 query-only `store execute`、`store info`、`theme list` 和拉取到新临时目录的 `theme pull`。
- Omnisend 只允许创建并回读 `draft`；不得调用 Send、Schedule、Publish 或等效端点。
- API Key 只能通过交互式隐藏输入存在于当前进程内存，不得保存、回显或写入日志。
- 所有行为修复先观察测试按预期失败，再写最小实现使其通过。
- 只执行 `git init`；不 commit、不配置 remote、不 push。

---

### Task 1: 建立六组件路径与注册表回归门

**Files:**
- Modify: `tests/build-email-template.v1.test.mjs`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: `组件清单.json`、`compositions/*.json`、六个组件的 Schema 与演示页。
- Produces: 精确六组件列表、活动路径存在性、默认 composition 顺序和旧路径禁用断言。

- [ ] **Step 1: 写失败测试**

  增加测试断言注册表恰有六项、路径均存在、六个组件均有 `效果演示.html`，默认 composition 恰按六组件顺序，活动文件不含 `主视觉组件/`、`商品组件/`、`活动与赠品组件/` 或 `内容与权益组件/`。

- [ ] **Step 2: 运行测试并确认 RED**

  Run: `node --test tests/build-email-template.v1.test.mjs tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: FAIL，明确指出注册表有九项、旧路径不存在或旧 composition 仍存在。

### Task 2: 同步注册表、索引、composition 与测试路径

**Files:**
- Modify: `组件清单.json`
- Modify: `组件索引.md`
- Modify: `compositions/hero-grid-review-gifts-location.default.v1.json`
- Modify: `tests/build-email-template.v1.test.mjs`

**Interfaces:**
- Consumes: Task 1 的精确六组件断言。
- Produces: 唯一活动注册表和可构建的六组件默认 composition。

- [ ] **Step 1: 把注册表缩减并迁移到当前目录**

  只保留六个活动组件，将分类和所有七类路径字段改成当前目录。

- [ ] **Step 2: 同步组件索引和默认 composition**

  组件索引只介绍六个组件；默认 composition 的组件目录和三个本地素材路径改为当前目录，输出改到忽略的 `build/` 目录。

- [ ] **Step 3: 修正现有测试中的硬编码目录**

  把首图与六宫格断言指向当前目录。

- [ ] **Step 4: 运行定向测试并确认 GREEN**

  Run: `node --test tests/build-email-template.v1.test.mjs`

  Expected: PASS。

### Task 3: 强化 Campaign 契约校验器

**Files:**
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

**Interfaces:**
- Consumes: 注册表每项的 `componentKey` 与 `路径` 字段。
- Produces: 对候选组件文件、Schema key 和 `效果演示.html` 的启动前校验。

- [ ] **Step 1: 写缺失演示页和 Schema key 不匹配的失败测试**

  使用临时目录和 `--registry` 参数构造坏注册表，断言校验器在进入交互前失败并报告具体组件。

- [ ] **Step 2: 运行测试并确认 RED**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: FAIL，因为现有校验器只验证 key 是否登记，不验证登记文件和演示页。

- [ ] **Step 3: 实现注册表文件与 Schema 校验**

  从注册表文件所在工作区解析路径；拒绝重复 key、缺失必需路径、缺失演示页、Schema key 不匹配和旧活动路径。

- [ ] **Step 4: 运行定向测试并确认 GREEN**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: PASS。

### Task 4: 固化执行问题的 Skill 契约

**Files:**
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`
- Modify: `skills/build-omnisend-campaign-draft/SKILL.md`
- Modify: `skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md`
- Review: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Review: `skills/build-omnisend-campaign-draft/agents/openai.yaml`

**Interfaces:**
- Consumes: 当前已测试的 Shopify 和 Omnisend 固定脚本。
- Produces: 无自动删除、演示页直读、背景图双位置解析、组件背景色边界和 Draft-only 的一致指令。

- [ ] **Step 1: 写成功后保留项目的失败契约测试**

  断言 Skill 与安全参考不再要求自动删除完整项目草稿，而是默认保留、只有用户明确确认才清理。

- [ ] **Step 2: 运行测试并确认 RED**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: FAIL，命中当前“回读验证成功后删除完整项目草稿”。

- [ ] **Step 3: 最小同步 Skill 与安全参考**

  保留已验证的首页 slide、按需变体分页、`效果演示.html`、相对 `previewOutput` 的本地资源、组件背景色和固定上传脚本规则；只改清理状态和注册表单一来源说明。

- [ ] **Step 4: 检查 UI 元数据是否仍与 Skill 一致**

  `agents/openai.yaml` 若描述仍准确则不改；若不准确则用 skill-creator 提供的生成器更新。

- [ ] **Step 5: 运行定向测试并确认 GREEN**

  Run: `node --test tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

  Expected: PASS。

### Task 5: 删除已确认的旧源码与生成物

**Files:**
- Delete: `头图/节日促销首图/`
- Delete: `活动商品组件/编辑式叠放商品/`
- Delete: `赠品与权益组件/免费设计咨询/`
- Delete: `compositions/five-components.default.v1.json`
- Delete: `compositions/seasonal-sale-hero.default.v1.json`
- Delete: `themes/default-canvas.theme.v1.json`
- Delete: `themes/seasonal-sale-hero.theme.v1.json`
- Delete: `back-to-school-hero.local-preview.html`
- Delete: `seasonal-sale-hero.v1.local-preview.html`
- Delete: `头图-六宫格-评论整图链接-免费礼物-地址.html`
- Delete: `头图-六宫格-评论整图链接-免费礼物-地址.local-preview.html`
- Delete: `邮件html模版.local-preview.html`
- Delete: `.DS_Store`

**Interfaces:**
- Consumes: 已通过的六组件注册表测试。
- Produces: 仅含活动组件源码的工作区。

- [ ] **Step 1: 删除精确清单并移除空目录**

  使用精确文件路径，不使用通配递归删除；保留 `campaign-drafts/` 和历史 `docs/superpowers/`。

- [ ] **Step 2: 验证清单边界**

  Run: `find 头图 活动商品组件 赠品与权益组件 通用图片组件 页脚组件 -mindepth 2 -maxdepth 2 -type d | sort`

  Expected: 只出现六个组件目录及其资源子目录。

### Task 6: 补充项目文档与忽略规则

**Files:**
- Create: `README.md`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 六组件注册表、默认 composition、Skill 和测试命令。
- Produces: 面向维护者的项目入口和源码/生成物边界。

- [ ] **Step 1: 编写 README**

  覆盖项目用途、目录、六组件、完整快照数据流、构建/预览、测试、Skill、Shopify 只读、Omnisend Draft-only 和密钥规则。

- [ ] **Step 2: 编写窄范围 .gitignore**

  忽略 `.DS_Store`、`campaign-drafts/`、`build/` 和临时文件；不要忽略任何组件目录下的 `效果演示.html`。

- [ ] **Step 3: 验证 README 命令和忽略结果**

  Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

  Expected: 输出六个有效区段和候选组件。

### Task 7: 完整验证并初始化 Git

**Files:**
- Create: `.git/` via `git init`

**Interfaces:**
- Consumes: Tasks 1–6 的最终工作区。
- Produces: 经验证、未提交、无 remote 的本地 Git 仓库。

- [ ] **Step 1: 运行全部测试**

  Run: `node --test tests/*.test.mjs`

  Expected: 0 failed。

- [ ] **Step 2: 检查全部 JavaScript 语法**

  Run: `for f in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs; do node --check "$f"; done`

  Expected: exit 0，无输出。

- [ ] **Step 3: 验证 Skill**

  Run: `python3 /Users/ww/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/build-omnisend-campaign-draft`

  Expected: validation success。

- [ ] **Step 4: 构建六组件本地预览**

  Run: `node build-email-template.v1.mjs compositions/hero-grid-review-gifts-location.default.v1.json --preview-local-assets`

  Expected: `build/campaign-six-components.local-preview.html` 生成，六组件顺序正确，背景图本地资源存在。

- [ ] **Step 5: 初始化仓库**

  Run: `git init`

  Expected: `git rev-parse --is-inside-work-tree` 输出 `true`。

- [ ] **Step 6: 核对无提交与无远端**

  Run: `git log -1 2>&1; git remote -v; git status --short --ignored`

  Expected: 没有 commit、没有 remote，`campaign-drafts/` 和 `build/` 显示为 ignored。
