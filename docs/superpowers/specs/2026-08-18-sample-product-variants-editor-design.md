# 小样产品推荐卡左右版本与 Campaign 编辑器设计

## 目标

将 `codex/sample-product-recommendation` 的左右镜像卡片纳入当前主线，同时保留当前工作区已有的两张窗帘产品推荐卡 II；全部四个小样产品组件都能从 Campaign 编辑器的“小样-产品”分类添加、排序和编辑。

## 决策

- 不执行自动 Git 合并。分支会将既有小样产品推荐卡目录拆分为左右版本，而当前主线已有未提交的注册表和编辑器更新；以主线为基准导入左右目录及其注册信息，避免覆盖 II 卡片。
- 注册表以四个 `product.*` Key 为单一事实来源：`sampleProductRecommendationLeft`、`sampleProductRecommendationRight`、`curtainRecommendationOverlay` 和 `curtainRecommendationNoTitle`。
- 左右卡片均开放两张图片、标题、副标题、CTA、链接、组件背景和文字色；沿用它们各自的 Schema 和默认素材。编辑器只允许 Schema 已声明的字段。
- 小样-产品是自由组合的本地编辑器分类，不变更 CLI 降级工作流的六个固定区段。

## 验收

- `组件清单.json`、组件索引、README 和 Campaign Skill 文档列出相同的四个小样产品组件。
- 编辑器的“小样-产品”样式列表按左、右、II 标题版、II 无标题版展示，四项都可添加和编辑。
- 注册表校验、编辑器核心/服务测试、邮件模板测试和空白差异检查通过。
