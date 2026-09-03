# Freshine Omnisend 邮件 HTML 组件库

本项目维护 Freshine 的邮件安全组件、可视化 Campaign 编辑器、静态拼接器、Shopify 只读导入和 Omnisend Draft-only 输出。

## 当前架构

- [`组件清单.json`](组件清单.json)：全部已登记组件及文件路径的单一事实来源。
- [`组件索引.md`](组件索引.md)：全部当前组件的管理说明、模板和效果演示入口。
- `build-email-template.v1.mjs`：校验完整组件快照、内联当前组件 CSS，并按 composition 顺序生成静态 HTML。
- `skills/build-omnisend-campaign-draft/`：可视化编辑器、注册校验、当前 Skill 与安全指南。
- `compositions/`：可复现的完整快照示例。
- `tests/`：Node.js 回归测试。

所有已注册组件均可在编辑器中自由添加、重复、排序、编辑、确认和删除。组件分类只用于浏览，不限制邮件结构或顺序。

## 可视化编辑器

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

打开 `http://127.0.0.1:4173`。当前功能包括：

- 600px 桌面和 375px 移动预览；
- 选择结构项后定位到对应预览区域；
- 组件字段、颜色、本地图片和头图导航开关；
- 模板保存、选择、覆盖和删除；
- 六宫格、各款四宫格及单品窗帘促销卡的 Shopify 只读导入（四宫格逐格导入）；
- Omnisend HTML 导出和 Draft-only 上传。

普通编辑草稿、预览、导出中间文件和图片缓存只存在于当前编辑器运行期，关闭或重启服务即自动清理；仅手动保存的预设模板及其专属本地图片保存在被 Git 忽略的 `campaign-drafts/editor-templates/`。

“渐变场景活动头图”已登记为 `hero.gradientScenePromotion`，在“头图”分类中选择。它保留用户提供模板的 600×761px 场景、底部渐变、97px Logo、三层活动文案和整块点击链接，375px 下等比收缩；背景、Logo、Alt、文案、链接及当前组件颜色可编辑，几何与渐变参数固定。详见[组件管理说明](头图/渐变场景活动头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“圆标场景叠字头图”已登记为 `hero.circleLogoSceneOverlay`，在“头图”分类中选择。它使用 600×761px 全幅场景、顶部 120px 圆形 Logo 和底部三层居中文字，375px 下等比收缩；背景、Logo、Alt、整图链接、文案及当前组件颜色可编辑，固定无渐变、导航和独立 CTA。详见[组件管理说明](头图/圆标场景叠字头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四宫格折扣推荐（标题款）”已登记为 `collection.saleGrid4WithTitle`，在“活动商品组件”分类中选择；当前折扣、带UTM的商品链接和Roman Shades底部CTA详见[组件管理说明](活动商品组件/四宫格折扣推荐（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。编辑器启动时缓存目录与默认值；旧服务需在保护未保存草稿后重启，或另用空闲端口启动，不能仅靠刷新网页加载新默认值。

“四宫格商品推荐（无左右边距）”已登记为 `collection.productGrid4NoSidePadding`，在“活动商品组件”分类中选择。保留600px满宽两列布局、289×361px商品图、22px列间距和四个逐格Shopify只读导入入口；详见[组件管理说明](活动商品组件/四宫格商品推荐（无左右边距）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四宫格详情折扣（标题款）”已登记为 `collection.saleGrid4DetailWithTitle`，在“活动商品组件”分类中选择。它保留样式XXVII的标题、两列商品图、纯文本商品名/价格及独立 SHOP NOW CTA；只有图片与CTA可点击，四格均支持只读 Shopify 导入并自动补齐指定 UTM。详见[组件管理说明](活动商品组件/四宫格详情折扣（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四项权益整图（两行）”已登记为 `image.benefitsStrip4TwoRows`，在“赠品与权益组件”分类中选择，保留原有单行组件。默认使用完整的两行权益原图；支持替换整图、Alt 和外部背景色，不绑定链接。详见[组件管理说明](赠品与权益组件/四项权益整图（两行）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“双赠品展示卡”已登记为 `gift.showcase2`，在“赠品与权益组件”分类中选择。按新版参考图制作600px交错图文布局，眼罩在上、抱枕套在下；照片、Alt、名称、价值、卖点、CTA文字/链接及赠送规则独立配置，两个CTA默认均指向 `https://freshinelife.com/`。已确认满$699赠眼罩、满$999赠抱枕套。详见[组件管理说明](赠品与权益组件/双赠品展示卡/COMPONENT_MANAGEMENT.zh-CN.v1.md)。原“双赠品奖励卡”保持不变。

“双赠品展示卡2”已登记为 `gift.doubleGiftAddressShowcase`，在“赠品与权益组件”分类中选择。它按 `容器 117.png` 制作 600px 并列阶梯赠品布局：两张默认图片从原稿精确裁切，只有两条红色满额 CTA 可点击，标题、价值、规则、底部提示和五组颜色可编辑。详见[组件管理说明](赠品与权益组件/双赠品展示卡2/COMPONENT_MANAGEMENT.zh-CN.v1.md)。现有两款双赠品组件保持不变。

## 校验与测试

需要 Node.js 20 或更高版本，无第三方 npm 依赖。

验证所有注册组件与编辑器字段契约：

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

运行测试：

```bash
node --test tests/*.test.mjs
```

检查 JavaScript 语法：

```bash
for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs skills/build-omnisend-campaign-draft/editor/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.js; do
  node --check "$file"
done
```

## 组件维护规则

每个组件目录必须保持以下文件同步：

- `component.template.v1.html`
- `component.styles.v1.css`
- `content.schema.v1.json`
- `content.fixture.v1.json`
- `settings.schema.v1.json`
- `settings.defaults.v1.json`
- `COMPONENT_MANAGEMENT.zh-CN.v1.md`
- `效果演示.html`

组件注册还必须同步 `组件清单.json`、`editor/public/editor-ui-contract.mjs`、当前组件指南和回归测试。桌面画布上限为 600px，移动端检查宽度为 375px；图片保持比例，布局使用邮件安全表格和内联 CSS。

## 安全边界

- `asset://` 和本地路径只允许用于本地预览；正式 HTML 使用公开 HTTPS 图片。
- Shopify 操作严格只读，不修改商品、页面、Collection 或主题。
- Omnisend API Key 由编辑器对话框一次性收集，只保留在内存中，不写入文件、参数、环境变量、日志或草稿。
- HTML 导出不会创建或更新 Campaign。
- Draft 上传只创建或更新 `draft`，回读验证后状态仍必须为 `draft`；不得发送、排期或发布。
- 更新 Email Content 时保留完整结构、节点 ID 和 `[[unsubscribe_link]]`。
- 本地静态预览不是 Omnisend 或真实收件箱验证；上线前仍需检查 Omnisend Desktop/Mobile/Dark Mode 以及目标邮件客户端。
