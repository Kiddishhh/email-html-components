# 非头图组件居中标题排版统一设计

日期：2026-08-20
状态：已确认方案 A，待用户复核书面设计

## 1. 背景

当前组件库中，多个非头图组件使用“顶层居中主标题＋副标题/说明”的相似结构，但字号、字重与行高不一致，导致在同一封 600px 邮件中组合使用时出现明显的视觉层级跳变。

本次以 `gift.rewardGrid2`（双赠品奖励卡）的主标题与赠品规则为唯一排版基准，只统一同层级的非头图组件文字，不调整头图或其他语义层级。

## 2. 目标排版基准

| 层级 | 字体 | 字号 | 字重 | 行高 | 对齐 |
| --- | --- | --- | --- | --- | --- |
| 顶层主标题 | Lora，回退 Georgia / Times New Roman / serif | 26px | 400 | 36px | 居中 |
| 顶层副标题、说明或规则 | Montserrat，回退 Arial / Helvetica / sans-serif | 15px | 400 | 22px | 居中 |

双赠品奖励卡自身不修改。`collection.saleGrid6` 已符合全部目标参数，只作为回归基准，不产生视觉改动。

## 3. 变更范围

### 3.1 实际调整组件

1. `collection.curtainPromotionCard`（单品窗帘促销卡标题款）
   - `promotion.title`：由 Lora `31px / 500 / 39px` 调整为 Lora `26px / 400 / 36px`。
   - `promotion.subtitle`：由 Montserrat `18px / 500 / 27px` 调整为 Montserrat `15px / 400 / 22px`。

2. `product.curtainRecommendationOverlay`（窗帘产品推荐卡 II 标题版）
   - `intro.title`：由 Lora `34px / 600 / 42px` 调整为 Lora `26px / 400 / 36px`。
   - `intro.subtitle`：由 Montserrat `18px / 500 / 26px` 调整为 Montserrat `15px / 400 / 22px`。

3. `location.showroomCard`（展厅地址卡）
   - `showroom.title`：由 Lora `26px / 500 / 37px` 调整为 Lora `26px / 400 / 36px`。
   - 图片下方 `showroom.address.line1` 与 `showroom.address.line2` 保持 Montserrat `16px / 400 / 25px`，因为它们属于地址正文，不属于顶部副标题。

### 3.2 明确不调整

- 所有 `hero.*` 头图组件。
- `gift.rewardGrid2` 基准组件。
- 已经符合基准的 `collection.saleGrid6`。
- 无标题款组件。
- 页脚品牌名与地址、评论摘要与评论标题、卡片内部商品标题、左对齐标题、副标题、CTA、角标和按钮。
- 文案、链接、图片、背景色、文字颜色、最大宽度、组件内外边距、标题与副标题间距、圆角及组件顺序。

## 4. 实现方案

采用已确认的方案 A：在三个组件各自的邮件模板中，把对应文字节点的内联 `font-size`、`font-weight` 与 `line-height` 对齐基准；继续使用组件现有字体族设置项。

本次不新增字体尺寸配置字段，不修改 settings Schema、settings defaults 或编辑器字段映射，也不引入渲染器级共享样式预设。这样可以保持当前组件快照兼容，不改变编辑器数据结构，并避免邮件客户端对外部或共享 CSS 的依赖。

## 5. 同步文件

每个实际调整组件需要同步：

- `component.template.v1.html`
- `效果演示.html`
- `COMPONENT_MANAGEMENT.zh-CN.v1.md`

同时检查并仅在存在旧排版数值时更新：

- 组件索引或 README 中的现行样式说明
- `skills/build-omnisend-campaign-draft` 下引用这些组件排版参数的当前指南

不修改 `组件清单.json`、组件键、字段名、内容契约、编辑器注册关系或组合顺序。

## 6. 测试设计

### 6.1 自动化回归

新增或扩展聚焦测试，至少验证：

- 三个目标组件的模板包含正确的 26/400/36 与 15/400/22 参数。
- 展厅地址正文仍为 16/400/25。
- `gift.rewardGrid2` 与 `collection.saleGrid6` 保持基准参数。
- 所有 `hero.*` 模板未进入本次差异范围。
- 组件构建、契约校验与现有编辑器测试继续通过。
- `git diff --check` 不出现空白错误。

### 6.2 视觉验收

在本地 HTML 编辑器中分别以 600px 与约 375px 预览三个目标组件，并与双赠品奖励卡进行对照：

- 主标题视觉大小、粗细和行距一致。
- 副标题视觉大小、粗细和行距一致。
- 长标题仍可自然换行，不出现横向溢出或截断。
- 原有标题间距、图片位置、CTA、背景和地址正文不变。
- 预览页面无新增控制台错误。

本地浏览器检查仅证明当前编辑器渲染结果；不等同于 Omnisend 平台或真实邮箱客户端验收。

## 7. 验收标准

1. 三个目标组件的指定文字层级与双赠品奖励卡采用完全相同的字体族、字号、字重、行高和居中对齐。
2. 展厅地址正文保持原样。
3. 非目标组件，尤其全部头图组件，不产生任务相关差异。
4. 模板、演示、组件说明和现行 Skill 指南中的相关描述一致。
5. 自动化测试、组件契约检查、600px 与 375px 视觉检查全部通过。
