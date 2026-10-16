# Freshine Omnisend 邮件 HTML 组件库

本项目维护 Freshine 的邮件安全组件、可视化 Campaign 编辑器、静态拼接器、Shopify 只读导入和 Omnisend Draft-only 输出。

## 邮件应用管理 Skill

[`build-omnisend-campaign-draft`](skills/build-omnisend-campaign-draft/SKILL.md) 是当前邮件应用的统一技能入口。可显式使用 `$build-omnisend-campaign-draft`，也可用“制作邮件”“打开邮件编辑器”“推荐活动主题和副标题”“将参考图/HTML制作注册为组件”“修改邮件组件”等请求匹配。

- 制作邮件时优先打开现有编辑器供手动操作，按活动名称在对话内推荐Subject/Preheader；不会代替用户选择、修改或确认，除非用户明确要求代操作。
- [文案风格](skills/build-omnisend-campaign-draft/references/email-copy-style.zh-CN.md)来自2026-10-12一次性回读的10封Freshine Omnisend邮件（9封已发送、1封草稿）；日常只读本地记录，只有用户要求刷新风格才重新查询Omnisend。历史优惠和倒计时不当作当前活动条件。
- 参考图或HTML按现有规范制作通用组件，同步登记和演示；维护组件时保留非目标内容、图片、链接/UTM及Omnisend与600px/375px契约。

打开前可运行只读定位脚本，优先复用目录/默认值与当前项目一致的服务（有当前URL可追加`--url`）：

```bash
node skills/build-omnisend-campaign-draft/scripts/resolve-campaign-editor.mjs
```

返回`ready`使用其URL；返回`start-required`按`startPort`运行下面的启动脚本。旧服务与运行期草稿保持独立，跨重启仍使用手动保存模板。

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
- 按名称/分类/componentKey 搜索真实组件缩略图，保留分类和样式选择；
- 多商品内容按槽位折叠分组，逐格导入按钮跟随商品字段；
- 实例编号避免删除后重号；保存串行执行，显示状态，失败保留修改并可重试；
- 实际链接与 UTM 清单，包含固定退订链接；勾选、预览差异后才应用可编辑 HTTPS 链接修改；
- 选择结构项后定位到对应预览区域；
- 组件字段、颜色、本地图片和头图导航开关；
- 每段文案的字体、字号、字重、颜色、行高、字间距、上下留白与可用的对齐，支持恢复默认；默认标题及商品名 Georgia/serif，其余文案 Verdana/sans-serif；
- 模板保存、选择、覆盖和删除；
- 六宫格、各款四宫格及单品窗帘促销卡的 Shopify 只读导入（四宫格逐格导入）；
- Omnisend HTML 导出和 Draft-only 上传。

文案设置见 [文案独立样式](skills/build-omnisend-campaign-draft/references/text-style-controls.zh-CN.md)。操作说明见 [可视化编辑器工作流](skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md)。编辑器界面的 iframe、搜索、分组及 UTM 控件不会进入邮件输出；正式 HTML 继续由原有安全构建器生成，保留 HTTPS 素材解析、退订令牌和移动端比例规范。

普通编辑草稿、预览、导出中间文件和图片缓存只存在于当前编辑器运行期，关闭或重启服务即自动清理；仅手动保存的预设模板及其专属本地图片保存在被 Git 忽略的 `campaign-drafts/editor-templates/`。

多个新版编辑器服务共享模板时，保存、覆盖、删除和从模板创建草稿通过跨进程锁协调；每次操作重新读取模板记录，列表接口返回磁盘最新内容，记录文件以原子替换写入。同名模板仍须显式确认覆盖。操作完成后的锁释放或垃圾清理失败不覆盖实际结果；锁持续无法释放时，成功回执和界面会附带恢复提示，当前服务的下次模板操作会重试释放自己持有的残留锁。首次升级到此版本需先妥善保存旧会话草稿，再重启旧服务；旧进程不会因网页刷新自动获得锁保护。锁等待超时与异常退出后的处理见[模板操作说明](skills/build-omnisend-campaign-draft/references/visual-editor-workflow.zh-CN.md#模板)。

排序或删除组件后，剩余组件全部恢复为待确认；逐个确认后才能重新导出或准备上传。新建和更新 Omnisend Draft 都校验实际 HTML 正文的规范化可见文字及顺序、公开链接和图片 Alt；验证失败不会返回成功回执。该语义校验允许平台调整空白和非内容属性，不代表原始 HTML 字节相同或收件箱视觉一致。

“倒计时场景卡片头图”已登记为 `hero.countdownSceneCard`，在“头图”结构中选择或搜索。保留注册条、三张原稿HTTPS素材（含背景图）、528px优惠卡片、三处独立链接及原UTM；15个内容字段、8项颜色可编辑，600px/375px等比适配，使用Verdana/sans-serif且不依赖Google Fonts。倒计时标题为可替换静态图片。详见[组件管理说明](头图/倒计时场景卡片头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“蒙版促销头图”已登记为 `hero.maskedPromotion`，在“导航组件”结构中选择或搜索。保留 Columbus Day Sale 原稿的 600×355px 背景、48% 蒙版、三层文案、白色 CTA 和完整 `Columbus_Day_Sale` UTM；375px 下等比收缩。可编辑背景图/说明、活动标题、优惠主标题、副标题、按钮文案/链接和四项颜色，支持逐文案自定义样式。模板使用 Georgia/serif、Verdana/sans-serif，不加载外部字体。详见[组件管理说明](头图/蒙版促销头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“透明社媒页脚”已登记为 `footer.transparentSocial`，在“页脚组件”结构中选择或搜索。保留原稿七个社媒链接和29px图标、地址、预约说明、暖棕分割线、版权与固定 `[[unsubscribe_link]]`；透明底色继承邮件画布，375px 下等比收缩，字体为 Verdana/sans-serif。可编辑25个内容字段和五项颜色，退订目标不可编辑。详见[组件管理说明](页脚组件/透明社媒页脚/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“渐变场景活动头图”已登记为 `hero.gradientScenePromotion`，在“头图”分类中选择。它保留用户提供模板的 600×761px 场景、底部渐变、97px Logo、三层活动文案和整块点击链接，375px 下等比收缩；背景、Logo、Alt、文案、链接及当前组件颜色可编辑，几何与渐变参数固定。详见[组件管理说明](头图/渐变场景活动头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“圆标场景叠字头图”已登记为 `hero.circleLogoSceneOverlay`，在“头图”分类中选择。它使用 600×761px 全幅场景、顶部 120px 圆形 Logo 和底部三层居中文字，375px 下等比收缩；背景、Logo、Alt、整图链接、文案及当前组件颜色可编辑，固定无渐变、导航和独立 CTA。详见[组件管理说明](头图/圆标场景叠字头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“优惠券场景叠层头图”已登记为 `hero.couponSceneOverlay`，在“头图”分类中选择。它包含单行顶部促销导航、居中标题与副标题、完整优惠券图和与场景图重叠的 SHOP NOW CTA；组件内画布为 600px，375px 下等比收缩。优惠券图、场景图、两处链接、文案及六项颜色/导航开关均可编辑，默认主 CTA 保留 `cover-fs` UTM。详见[组件管理说明](头图/优惠券场景叠层头图/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四宫格折扣推荐（标题款）”已登记为 `collection.saleGrid4WithTitle`，在“活动商品组件”分类中选择；当前折扣、带UTM的商品链接和Roman Shades底部CTA详见[组件管理说明](活动商品组件/四宫格折扣推荐（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。编辑器启动时缓存目录与默认值；旧服务需在保护未保存草稿后重启，或另用空闲端口启动，不能仅靠刷新网页加载新默认值。

“四宫格场景折扣（标题款）”已登记为 `collection.sceneSaleGrid4WithTitle`，在“活动商品组件”分类中选择。它按样式XXVII场景商品稿提供两行两列商品图、商品名称与折扣标签，无底部 CTA；四格均支持 Shopify 只读导入并自动补齐 cover-rc UTM。详见[组件管理说明](活动商品组件/四宫格场景折扣（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四宫格商品推荐（无左右边距）”已登记为 `collection.productGrid4NoSidePadding`，在“活动商品组件”分类中选择。保留600px满宽两列布局、289×361px商品图、22px列间距和四个逐格Shopify只读导入入口；详见[组件管理说明](活动商品组件/四宫格商品推荐（无左右边距）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四宫格详情折扣（标题款）”已登记为 `collection.saleGrid4DetailWithTitle`，在“活动商品组件”分类中选择。它保留样式XXVII的标题、两列商品图、纯文本商品名/价格及独立 SHOP NOW CTA；只有图片与CTA可点击，四格均支持只读 Shopify 导入并自动补齐指定 UTM。详见[组件管理说明](活动商品组件/四宫格详情折扣（标题款）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“四项权益整图（两行）”已登记为 `image.benefitsStrip4TwoRows`，在“赠品与权益组件”分类中选择，保留原有单行组件。默认使用完整的两行权益原图；支持替换整图、Alt 和外部背景色，不绑定链接。详见[组件管理说明](赠品与权益组件/四项权益整图（两行）/COMPONENT_MANAGEMENT.zh-CN.v1.md)。

“双赠品展示卡”已登记为 `gift.showcase2`，在“赠品与权益组件”分类中选择。组件在600px邮件版面内保留45px左右、29px上下页边距，使用交错图文布局：眼罩在上、抱枕套在下；照片、Alt、名称、价值、卖点及CTA文字/链接独立配置，两个CTA默认均指向 `https://freshinelife.com/`。详见[组件管理说明](赠品与权益组件/双赠品展示卡/COMPONENT_MANAGEMENT.zh-CN.v1.md)。原“双赠品奖励卡”保持不变。

“双赠品展示卡2”已登记为 `gift.doubleGiftAddressShowcase`，在“赠品与权益组件”分类中选择。它按 `容器 117.png` 制作 600px 并列阶梯赠品布局：两张默认图片从原稿精确裁切，只有两条红色满额 CTA 可点击，标题、价值、规则、底部提示和五组颜色可编辑。详见[组件管理说明](赠品与权益组件/双赠品展示卡2/COMPONENT_MANAGEMENT.zh-CN.v1.md)。现有两款双赠品组件保持不变。

## 校验与测试

需要 Node.js 20.11 或更高版本（使用 `import.meta.dirname`），无第三方 npm 依赖。裁图另需 macOS `sips` 或 ImageMagick 7。

验证所有注册组件与编辑器字段契约：

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

运行测试：

```bash
node scripts/test.mjs
```

检查 JavaScript 语法：

```bash
for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs skills/build-omnisend-campaign-draft/editor/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.js; do
  node --check "$file"
done
```

导出/上传按完整 asset ID 替换图片，支持前缀相近的素材共存；回读按单次 HTML 实体解码比较等价正文，真实差异仍会报错。正文、链接文案及节点归属共用回读解析树：属性内 `>` 与 `&gt;` 不混入正文，行内标签和注释不制造词间空格；`script/style/template/title` 及明确隐藏内容不能冒充正文。有效 `display:inline` 的局部包装仍兼容，普通邮件和 Outlook 分支分别检查。带本地图片的模板可反复使用并覆盖保存，图片文件名保持稳定，旧模板兼容读取。模板保存先提交独立图片版本，再原子切换索引；失败保留旧模板，残留文件后续重试清理。获取锁身份失败时业务操作不执行，并清理刚创建的空锁，解除故障后可重试。同草稿请求按完整请求体就绪的顺序执行，避免并发覆盖。回读核对 URL 节点、图片 Alt、点击关联及图片/背景所属内容块，注释、元数据或 CSS 引号字符串里的旧地址不能证明成功；实际 `url('…')` 的引号参数仍可识别。详见[输出与安全](skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md)。

回读文字边界覆盖 center 等默认块级元素，并保留有效 display:inline 覆盖。省略 `</p>` 时先按段落作用域闭合，再判断后续文字是否隐藏；title 内容及其中伪标签不作为正文或节点证据。规则只用于比较，不改写邮件源码。

回读正文和更新目标限定为真实布局中的 HTML 内容块；区段、行、列或区块元数据里的 htmlCode 副本不能替代正文。title 使用 ASCII 标签边界，无法可靠识别的结束标签与嵌套 form 明确拒绝验证，不静默改变隐藏状态或吞掉后续正文。兼容格式及处理方式见[输出与安全规则](skills/build-omnisend-campaign-draft/references/workflow-and-safety.zh-CN.md)。

## 环境与迁移

构建器与规范化检查按脚本位置定位仓库；Composition 内组件与素材路径相对仓库，命令行 Composition 路径及输出路径仍相对调用目录。测试使用系统临时目录，`scripts/test.mjs` 枚举测试文件，避免依赖 shell 通配符。完整搬迁时需一并复制组件目录、`skills/`、`scripts/`、注册表及配置。

Shopify 导入统一读取根目录 `shopify.config.json` 的 `storefrontOrigin` 和 `adminStore`，默认仍为 Freshine；也可用 `FRESHINE_SHOPIFY_CONFIG` 指向另一份配置，原有 `--store` 优先级保留。配置不含凭据，修改后重启编辑器生效；它只配置只读导入来源，不会重写已有组件、草稿的品牌文案、图片、链接、UTM 或美元价格格式。

裁图默认先使用 `sips`，不可用时使用 ImageMagick 7 的 `magick`；可显式传 `--backend sips` 或 `--backend magick`。两者均保留中心裁切、1200×1200 输出和源图不覆盖约束。依赖缺失时在写入输出前报错。详见[移植与运行环境](skills/build-omnisend-campaign-draft/references/portability.zh-CN.md)。

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

- 活动商品组件 / 多类推荐V（`collection.multiCategoryRecommendationV`）：两列六分类，图片与下划线标题共用分类链接；600px / 375px 等比适配。

- 赠品与权益组件 / 暖红双赠品卡IV（`gift.warmRedPairIV`）：标题、两行条件及两张可点击原图卡片；600px / 375px 等比适配。
