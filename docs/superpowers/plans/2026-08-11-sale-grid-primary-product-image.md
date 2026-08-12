# 六宫格商品第一张图片实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让六宫格始终使用 Shopify 商品媒体按 POSITION 排序后的第一张图片。

**Architecture:** GraphQL 查询直接请求每个商品的首个图片媒体；规范化函数只读取 `product.media.nodes[0]`。测试用互不相同的 featuredImage 和媒体第一图锁定数据来源。

**Tech Stack:** Node.js ESM、node:test、Shopify Admin GraphQL、JSON fixture、Markdown Skill。

## Global Constraints

- Shopify 只读，禁止 mutation 和任何店铺写入。
- 不改变商品顺序、链接、变体分页、价格与折扣规则。
- 不自动 commit、push 或配置 remote。

---

### Task 1: 回归测试与 fixture

**Files:**
- Modify: `tests/fetch-sale-grid.test.mjs`
- Modify: `tests/fixtures/shopify-graphql/collection-products.json`

**Interfaces:**
- Consumes: `normalizeSaleGrid(payload, collectionHandle)` 与 `saleGridGraphQlQuery()`。
- Produces: 首图来源与无首图错误的回归约束。

- [ ] **Step 1: 写失败测试**

  给六个商品补充 `media.nodes[0].image`；令第一个商品的 `featuredImage.url` 与媒体第一图不同，断言输出为媒体第一图，并断言查询使用 `media(first: 1, query: "media_type:IMAGE", sortKey: POSITION)`。

- [ ] **Step 2: 确认 RED**

  Run: `node --test tests/fetch-sale-grid.test.mjs`

  Expected: FAIL，当前输出仍来自 `featuredImage`。

### Task 2: 查询与规范化修复

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/scripts/fetch-sale-grid.mjs`

**Interfaces:**
- Consumes: `product.media.nodes[0]`，形状为 `{ alt, image: { url, width, height } }`。
- Produces: `items[].image = { url, alt }`。

- [ ] **Step 1: 修改 GraphQL 查询**

  用以下字段替换 `featuredImage`：

  ```graphql
  media(first: 1, query: "media_type:IMAGE", sortKey: POSITION) {
    nodes { alt ... on MediaImage { image { url width height } } }
  }
  ```

- [ ] **Step 2: 修改规范化逻辑**

  读取 `product.media.nodes[0].image.url`；缺失时抛出 `sale-grid product has no first product image: <handle>`。

- [ ] **Step 3: 确认 GREEN**

  Run: `node --test tests/fetch-sale-grid.test.mjs`

  Expected: PASS。

### Task 3: 同步 Skill 并验证

**Files:**
- Modify: `skills/build-omnisend-campaign-draft/references/shopify-data-contract.zh-CN.md`
- Modify: `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- Modify: `tests/build-omnisend-campaign-draft-skill.contract.test.mjs`

**Interfaces:**
- Consumes: Task 2 的首图规则。
- Produces: 下次 Campaign 执行时一致的图片来源说明。

- [ ] **Step 1: 更新 Skill 契约测试并确认 RED**

  断言数据契约使用 `media`、`POSITION`、`MediaImage`，且不再要求 `featuredImage`。

- [ ] **Step 2: 同步 Skill 参考文档**

  记录首图来源、禁止回退和无图失败规则。

- [ ] **Step 3: 运行完整验证**

  Run: `node --test tests/*.test.mjs`

  Run: `node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`

  Expected: 0 failed、契约 valid。
