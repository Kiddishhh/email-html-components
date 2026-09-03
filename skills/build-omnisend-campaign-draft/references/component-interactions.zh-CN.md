# 当前组件样式与编辑范围

本指南只描述 `组件清单.json` 中当前登记的组件。所有组件使用 600px 邮件画布并在 375px 下验证。非头图组件的顶层居中主标题统一使用 Lora `30px / 500（Medium） / 38px`，字间距 `0px`；顶层居中副标题、说明或规则统一使用 Montserrat `18px / 500（Medium） / 150%（27px）`，字间距 `0px`。两者均居中对齐；卡片内部文字、左对齐文字、页脚、评论与头图仍保持各组件自身层级。按钮和留白不做跨组件强制同款处理。

## 共同规范

- 模板使用邮件安全表格结构与内联 CSS，不使用 JavaScript、表单、iframe、Flex、Grid 或运行时网络逻辑。
- 图片必须保留设计比例，不得通过同时强制不匹配的宽高拉伸。固定尺寸是桌面上限，窄屏按容器等比例收缩。
- 可编辑字段由 `editor/public/editor-ui-contract.mjs` 明确列出；未列出的几何、字体、间距和结构保持组件设计值。
- `asset://` 资源只用于本地预览；导出或上传前转换为公开 HTTPS URL。
- 组件 CSS 只在当前组件模板内内联，不得影响相邻组件。

## 头图

四款头图都开放 `navigation.visible` 导航开关。关闭后生成 HTML 会移除导航结构与占位高度，Logo 和主体内容保持不变。导航栏统一以夏末折扣促销首图为基准：左右列 `75.5% / 24.5%`，桌面基准 `71px` 高，移动端使用 `min(71px, 11.833333vw)`；左右内边距分别为 `min(18px, 3vw)` 与 `min(10px, 1.666667vw)`。促销文案和右侧链接均使用 Montserrat Regular `18px / 24px`，并随移动宽度缩放为 `min(18px, 3vw) / min(24px, 4vw)`；右侧链接保持下划线。颜色和导航栏在组件内的位置仍各自独立。

### `hero.promotionalOverlay` — 促销悬浮首图

- 可编辑：背景图/Alt、活动三行文案、CTA、顶部促销文案与链接、Logo 图片/Alt/链接、主题色和 Logo 徽章色。
- 固定：600px 全宽视觉、106px 徽章与 80px Logo 的版式关系、悬浮内容区结构。
- 默认主图参考比例为 600:722；推荐源图约 1200×1444px，375px 下允许按 `cover` 做可控裁切。

### `hero.countdownOverlay` — 倒计时头图

- 可编辑：背景图/Alt、单一 `countdown.title`、补充文案、CTA、导航文案/链接、Logo、分隔图及导航/主题颜色。
- 固定：600px 桌面主视觉约 722px 高；375px 主视觉约 450px 高（368px 下限）。半透明面板为桌面 440×480px、375px 约 275×300px；其内 Logo、分隔图、单一倒计时标题、说明、CTA、内边距和间距均随背景图按 `min()` 同步收缩，倒计时标题仍使用一个字段自然换行，不插入固定 `<br>`。

### `hero.countdownOverlay2` — 倒计时头图2

- 可编辑：1:1 主图、活动三行文案、静态紧迫标题、三项权益、CTA、顶部促销条和常用颜色。
- 固定：桌面主图 540×540px，375px 下约 337.5×337.5px；三项权益顺序和两条分隔线保持不变。

### `hero.lateSummerSale` — 夏末折扣促销首图

- 可编辑：顶部促销条、品牌 Logo、活动名称/主标题/说明、主图/Alt/点击链接、CTA，以及组件、顶部栏、标题、正文和操作颜色。
- 固定：600px 画布；桌面主图 542×527px；CTA 尺寸及与主图的 27px 叠加量。移动端按比例缩放，不改变图片宽高比。

### `hero.gradientScenePromotion` — 渐变场景活动头图

- 可编辑：场景背景图/Alt、整张头图的统一 HTTPS 点击链接、圆形 Logo/Alt、活动名称、主折扣标题、补充说明、背景降级色与文字色。
- 固定：无顶部导航和独立 CTA；内层画布 600×761px，375px 下约 375×475.6px。1522px 正方形场景图使用 `cover` 与 `50.310559% top` 裁切，叠加 44.7% 至底部 `#FBFAF8` 的 180° 渐变；Logo 97px、顶部 370px，三层文字依次为 Lora `30px/38px`、Montserrat `66px/80px`、Montserrat `19px/23px`，全部几何按内联 `min()` 等比收缩。
- 默认整块链接保留 `utm_source=omnisend&utm_medium=email&utm_campaign=late_summer_sale&utm_content=hero`。本地背景和 Logo 只用于预览；正式输出必须使用公开 HTTPS 图片。

### `hero.circleLogoSceneOverlay` — 圆标场景叠字头图

- 可编辑：全幅场景背景/Alt、整张头图的统一 HTTPS 点击链接、顶部圆形 Logo/Alt、活动名称、主折扣、单一补充说明字段、图片降级色与文字色。
- 固定：无渐变、顶部导航和独立 CTA；内层画布 600×761px，375px 下约 375×475.6px。默认 1216×1522px 场景以 `cover`、`center top` 放入画布，桌面自然裁去左右各 4px；Logo 120px、顶部 60px。
- 三层文字依次为 Montserrat Light `36px/46px`、Montserrat Bold `66px/80px`、Montserrat Regular `19px/31px`。补充说明置于 410px 宽内容区并由一个字段自然换行；全部几何以内联 `min()` 等比收缩。
- 默认整块链接为 `https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc`。本地背景和 Logo 仅供预览；正式输出必须使用公开 HTTPS 图片。

### `hero.sceneOverlayCta` — 场景文字叠层头图

- 可编辑：场景图/Alt、单一主标题（按画布宽度自动换行）、两行说明、CTA 文字/HTTPS 链接、文字色、CTA 操作色，以及默认开启的 `navigation.visible` 顶部导航栏开关。Logo 为固定白色品牌资产。
- 固定：外层全宽、内层居中的 `max-width:600px` 画布中，场景图为 `600×778px` 竖版背景；可选的 71px 双栏顶部促销导航使用固定默认文案与配色，关闭时整行移除。其余为顶部 `106×106px` 白色描边圆环和 `89px` Logo，Lora `47px / 500 / 54px` 的单一标题字段（可自动换为两行）、Montserrat `18px / 400 / 27px` 两行说明，以及 `322×52px` 无圆角 CTA。375px 下画布严格收缩为 375px，并使用 inline `min()` 等比缩放；不含 Shopify 导入。

### `hero.romanShadeDiscount` — 罗马帘专属折扣头图

- 可编辑：竖版场景图/Alt、圆形 Logo/Alt/独立链接、提示文案、折扣前缀、主折扣、说明、CTA 文案/HTTPS 链接、文字与描边色、按钮底色，以及默认开启的 `navigation.visible` 顶部导航开关。装饰标签保留用户原始素材，不另加链接。
- 固定：场景主体保持600×761px、432px 宽70%白色半透明圆角面板、103px Logo、307×55px 提示框、35px 装饰标签；Montserrat 折扣80px/600，前缀行高62px加16px间隔、折扣行高94px，说明19px/600/27px、CTA309×55px。默认主色 `#6B492C`。
- 顶部双栏导航沿用 `hero.sceneOverlayCta` 结构，采用本组件尺寸和字体：左右宽 `75.5% / 24.5%`，桌面 `600×56px`、375px 下高 `35px`；左右文字均为 Montserrat 字重500、字号/行高 `16px / 20px`，字间距0px、居中，移动端保留 `min(16px, 3vw) / min(20px, 4vw)`，375px 下为 `11.25px / 15px`。固定左侧文案 `Unlock $100 Off Your First Order at Freshine`、右侧下划线链接 `SIGN UP` → `https://freshinelife.com/`；固定底色 `color.navigationLeft=#604211`、`color.navigationRight=#6B492C`，文字 `color.navigationText=#FFFFFF`，不新增文案、链接或颜色编辑字段。关闭时移除整行和占位高度，主体内容保持不变。
- 提示框宽高不变，`Your Exclusive Discount` 使用 Montserrat `21px / 500 / 26px`，375px 下字号/行高 `13.125px / 16.25px`。CTA 默认文案为 `Decorate your home now`，使用 Montserrat `16px / 600 / 20px`，字间距0px、居中；桌面保持 `309×55px`、上下内边距各17.5px，375px 下保持 `193.125×44px`、上下内边距各12px。
- 标签 PNG 顶部有4px透明边，图片以响应式负上外边距抵消透明边，使实际棕色上边线与提示框下边框重叠，并以等量下外边距补偿占位，保持其他元素不动；不使用 `position` 或 `transform`。
- 375px 下主体按内联 `min()` 同步缩放，折扣50px；按钮保留至少44px触控高度和12px文字，整体高度允许略大于等比缩放。导航开启/关闭时总尺寸分别为桌面 `600×817px / 600×761px`、移动端约 `375×520.98px / 375×485.98px`。不进行 Shopify 导入。
- 默认 CTA 指向罗马帘集合页，保留 `utm_source=omnisend&utm_medium=email&utm_id=cover-fs`；Logo独立指向首页。仅本地预览素材；正式导出需公开 HTTPS 图片。字体、透明度、背景和圆角在邮件客户端可能降级，不能将本地验收等同于收件箱测试。

## 导航组件

### `navigation.promotionCta` — 活动促销 CTA

- 可编辑：活动名称、分隔图/Alt、折扣主文案、说明、CTA 文字/HTTPS 链接，以及组件背景、文字和 CTA 主题色。
- 固定：600px 画布，上下各 45px 留白；Montserrat 标题 `30px / 600 / 37px`、折扣 `50px / 700 / 62px`、说明 `18px / 400 / 27px`，以及 `284×55px` 的描边圆角 CTA。375px 下按 inline `min()` 渐进缩小；没有 Shopify 导入功能。

### `navigation.eventCountdown` — 活动倒计时导航

- 可编辑：静态倒计时标题（默认 `ONLY 3 DAYS!`）、三项权益文案、CTA 文字/HTTPS 链接，以及背景、文字和按钮颜色。倒计时不会按日期自动递减。
- 固定：600px 画布、参考高度 282px；Lora 标题 `30px / 400 / 40px`、三项 Montserrat 权益 `18px / 400 / 22px`、两条 `1×20px` 分隔线，以及 `334×55px` 实色圆角 CTA。375px 下按 inline `min()` 渐进缩小；没有 Shopify 导入或运行时脚本。

## 活动商品

### `collection.curtainPromotionCard` — 单品窗帘促销卡（标题款）

- 可编辑：顶部活动标题/说明、商品角标、主图/Alt/链接、商品名称/说明、CTA、组件底色和角标底色。
- 固定：顶部居中标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`，顶部居中说明使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`；卡内商品名使用 Montserrat `22px / 500 / 30px`、商品卖点使用 Montserrat `15px / 400 / 22px`；主图与下方文案卡的表格结构及下划线 CTA。

### `collection.curtainPromotionCardNoTitle` — 单品窗帘促销卡（无标题款）

- 可编辑范围与标题款一致，但不包含 `promotion.title` 和 `promotion.subtitle`。
- 固定：从商品主图直接开始，不保留空标题高度；卡内商品名使用 Montserrat `22px / 500 / 30px`、商品卖点使用 Montserrat `15px / 400 / 22px`，与标题款一致。

### `collection.saleGrid6` — 六宫格夏季促销

- 可编辑：区域标题、说明、CTA 文案/链接、操作色和组件底色；六件商品可通过只读 Shopify 活动页、已上线 Collection URL 或后台 Collection handle 导入更新。后台 handle 导入不覆盖当前 CTA。
- 固定：顶部居中标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`，顶部居中说明使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`；两列三行商品顺序、商品图对齐；CTA 使用 486px 上限表格和 `width:81%;max-width:486px`，600px 桌面为 486px、375px 移动端约为 304px。

### `collection.saleGrid6WithTitle` — 六宫格折扣推荐（标题款）

- 可编辑：标题、副标题、底部 CTA、六款商品的名称/折扣/主图/Alt/链接，以及组件背景、文字与促销颜色。每个商品格都有独立“导入商品 1–6”入口，使用 Freshine 商品 URL 只读导入首图、商品名和首个可售变体折扣。
- 固定：标题为 Lora `30px / 500 / 45px`，副标题为 Montserrat `16px / 500 / 24px`、`#7C706A`；商品图为 236×236px 的居中 cover 裁切，图片底部为 33px 统一折扣条，商品名称为 Montserrat `18px / 500 / 22px`。600px 画布中两列三行，375px 保持两列并由 inline `min()` 等比收缩；底部 CTA 上限为 520px、`width:86%`。

### `collection.saleGrid4` — 四宫格折扣商品

- 可编辑：组件背景色、统一折扣标签主题色，以及四款商品各自的折扣文案、主图、Alt 与整图跳转链接。每款商品可独立输入 Freshine 商品 URL 并只读导入首张主图、链接与折扣；无有效折扣时清空该格标签。
- 固定：不含标题、说明或 CTA；600px 画布内 `508px` 内容区，两列两行各 `246×246px`，横向间距 `16px`、行间距 `20px`、底部留白 `52px`。375px 下保留两列比例缩放，使用内联 `min()`，不使用 Flex、Grid 或媒体查询。

### `collection.saleGrid4WithTitle` — 四宫格折扣推荐（标题款）

- 独立新增，不覆盖 `collection.saleGrid4`。按用户确认的样式XXVII原稿使用 Montserrat 顶层标题，不套用公共 Lora 样式。
- 可编辑：顶部标题/说明、四格各自的折扣文字/图片/Alt/链接/图片下方链接文字、底部按钮文字/链接，以及背景、折扣标、主标题/描边、副标题、操作文字五种颜色。
- 600px桌面约933px高；510px内容区、246px正方形图、17px列间距。主标题30px/400/45px、字距0.3px；说明18px/400/27px、商品链接16px/400/22px、底部按钮18px/400，字距0.2px，1.5px描边。375px保留两列，图片约154px，按钮点击高度至少44px。
- 默认使用匹配原稿的四张Shopify公共HTTPS原图；折扣按用户更新为左上30%、右上40%、左下35%、右下50%，商品和底部CTA跳转链接均带`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。逐格导入只覆盖该格图片/Alt/链接/折扣和商品链接文字（填入Shopify商品标题）；其他格、颜色、顶部说明和底部CTA均保留。
- APPLY DISCOUNT 的默认链接为用户确认的`https://freshinelife.com/collections/roman-shades`并保留上述UTM；集合页链接本身不创建或自动应用优惠码。浏览器字体与Outlook VML增强不构成真实收件箱验收。

### `collection.productGrid4NoSidePadding` — 四宫格商品推荐（无左右边距）

- 独立新增，不覆盖现有四宫格。可编辑顶部标题/说明、四格折扣文字/图片/Alt/链接/按钮文字，以及背景、标题、说明、折扣标签和按钮文字五种颜色。
- 600px 满宽版面无左右边距；两列各 289×361px，中间 22px。顶部 Lora 标题为 30px/400/40px，说明为 Montserrat 16px/500/24px，折扣标高31px，商品按钮为16px/500/22px。
- 375px 下仍保持两列并按画布比例缩放，不使用媒体查询、Flex、Grid 或定位。逐格 Shopify 导入只更新指定卡片的图片、Alt、链接、折扣和按钮文字，其他卡片及顶部文案、颜色保持不变。

### `collection.saleGrid4DetailWithTitle` — 四宫格详情折扣（标题款）

- 独立新增，不覆盖其他四宫格。可编辑顶部标题/说明、四格各自的折扣标签、图片、Alt、商品链接、商品名称、折扣价、划线原价和 CTA 文案，以及九种组件内颜色。
- 只有商品图片和下方 CTA 附带该格商品链接；商品名称、折扣标签、折扣价和划线原价均为纯文本。默认四个商品链接和逐格导入后的链接都使用 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。
- 600px 画布内内容区 519px，两列各 247px、间距 25px；正方形商品图、31px 折扣标签、双行商品名、价格行和整列 CTA 复现样式XXVII详情版。375px 仍保持两列并使用内联 `min()`/`max()` 渐进缩放。
- 逐格 Shopify 只读导入只更新当前实例的指定格：第一张图片、Alt、完整商品名、带 UTM 的链接、首个可售变体价格、有效划线价和折扣标签；CTA 文案、其他三格、顶部文案及颜色不变。无有效划线价时清空原价和标签。

### `collection.curtainInspirationGrid4` — 窗帘灵感四宫格

- 可编辑：顶部标题/说明、四张灵感图片、各自 Alt 和独立点击链接、各图下方标题，以及组件底色；`grid.showCaptions` 默认关闭，开启时显示图片标题，关闭时不输出标题及其额外留白。
- 固定：600px 画布中的内容区为 510px；两列各 247px，横向间距为 16px。标题关闭时行间为 16px；开启时，图片标题使用 Montserrat `16px / 500 / 22px`、居中自然换行，图文间距 11px，且上下两行间距增至 32px。顶部居中标题使用 Lora `30px / 500（Medium） / 38px`，说明使用 Montserrat `18px / 500 / 27px`。四张图保持正方形比例，375px 下按容器等比缩小；不使用 Flex 或 Grid。

### `collection.curtainEditorialTriptych` — 窗帘场景三图卡

- 可编辑：一张上方场景大图、两张下方场景图、三张图各自的 Alt 和 HTTPS 链接、两张下方图片的文字链接、底部标题/说明和组件底色。该组件已登记为 HTML 编辑器中的自由组合样式。
- 固定：600px 画布中大图为 `538×536px`，下方两图各 `256×319px`、中间 `12px`；大图和下方两图区间隔 `35px`，图片下方文字为 Montserrat `16px / 500 / 22px`，与图片相隔 `16px`。底部标题采用 Montserrat `30px / 500（Medium） / 150%`，说明采用 Montserrat `16px / 500 / 150%`，均居中、字间距 `0px`；说明下方为 `36px` 留白、`#E2DEDB` 的 `1px` 分割线和 `37px` 留白。标题与说明在 375px 下通过内联 `min()` 分别渐进缩至 `26px`、`14px`，分割线按 `87.333%` 宽度收缩；不支持该函数的客户端保留桌面字号。双图保持两列结构，不使用 Flex、Grid 或定位。

### `collection.romanShadeMultiRecommendation` — 三图推荐（CTA+标题）

- 可编辑：顶部标题/说明、主图和下方两张图各自的公开 HTTPS 图片、Alt、链接与折扣标，以及底部 CTA 的文案/公开 HTTPS 链接。背景、文字、三处折扣标和 CTA 描边/文字颜色可独立修改。默认三处商品链接和 CTA 均带 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。
- 固定：600px 画布下，顶部标题为 Montserrat `30px / 500 / 38px`，说明为 Montserrat `18px / 400 / 27px`；主图为 `536×595px`，下方两图各 `256×256px`、中间 `20px`。三图为独立整图链接，折扣标固定在各图左上角；底部为 `536px` 宽、`2px` 描边、Montserrat `18px / 500` 的 CTA，桌面 66px 高，375px 下单行且至少 44px。全部使用邮件安全表格、内联 `min()` 渐进缩放及 Outlook VML 背景图回退，不使用 Flex、Grid、绝对定位或外部 Web Font。

## 评论与整图

### `review.sceneComparison` — 场景对比评论卡

- 默认复现 VIII.jpg：600×677px 两列棋盘格，375px 保持两列等比收缩；更长文案可以自然增高。
- 17 个内容字段：两张场景图、头像、五星图及各自 Alt，姓名、评论正文、商品名与四条属性，以及 CTA 文字/链接。三个颜色字段仅作用于当前组件。
- 四张图片从原稿精确裁切，通过 `localReferenceAssets` 接入现有导出；正式 Omnisend HTML 必须替换为公开 HTTPS。头像与五星带原稿底色，改面板色时需同步更换素材。
- 仅左下 CTA 可点击，默认 Marisol 商品页并带 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`；其他区域无链接。保留全部原稿文案，不触发商品导入或远端写入。

### `image.clickableFullWidth` — 可链接整图

- 可编辑：整图 URL、Alt、点击链接和组件底色。
- 固定：600px 全宽、零外边距；源图按比例缩小到 375px，不裁切正文内容。

### `review.textList2` — 双条文字评论

- 当前快照固定两条评论与 15 枚装饰星图，不提供编辑字段。
- 组件没有 CTA 或链接；文字与星图必须完整可读。

## 小样与产品推荐

### `product.sampleProductRecommendationLeft` / `product.sampleProductRecommendationRight`

- 可编辑：场景图、面料图、各自 Alt、标题、副标题、CTA 文案、产品链接、组件底色和文字色。
- 固定：左右两款保持 `319px / 32px / 197px` 的镜像构图与 `8px` 图片圆角；面料图到标题的桌面间距为 `16px`，375px 下约为 `12px`。桌面标题使用 Montserrat `22px / 600 / 30px`，副标题使用 `17px / 400 / 23px`，CTA 使用 `18px / 500 / 22px`；375px 下分别约为 `20px / 28px`、`14px / 20px` 和 `15px / 20px`。标题与 CTA 保持单行并共享左边缘，副标题允许自然换行；响应式值使用桌面声明加内联 `min()` 渐进覆写。

### `product.curtainRecommendationOverlay` — 窗帘产品推荐卡II（标题版）

- 可编辑：顶部标题/说明、场景图、细节图、产品名称、色号、CTA、产品链接及组件文字/操作颜色。
- 固定：顶部居中标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`，顶部居中说明使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`；产品名与下方左对齐文字保持组件自身层级；600px 画布内 548×495px 主图、237px 细节卡和浅色描边；重叠通过邮件安全表格完成。

### `product.curtainRecommendationNoTitle` — 窗帘产品推荐卡II（无标题版）

- 可编辑范围与标题版相同，但不包含 `intro.title` 和 `intro.subtitle`。
- 固定：组件从 548×495px 主图开始，不保留标题空白。

### `product.sampleStyle1` — 产品样式1

- 可编辑：主图、右下细节图、各自 Alt、标题、副标题、CTA 文案/链接，以及组件、标题、副标题、CTA、小样框、细描边和投影颜色。
- 固定：标题与副标题位于主图下方左侧产品信息列并保持左对齐，右侧 202px 小样框以 `position:relative` 上压主图 56px；375px 端按比例缩放表格。小样框使用 4px 暖白留边、1px 细描边和 4px 单层投影。Windows Outlook 若忽略位移则按正常流显示小样框。
- 移动字号：标题在 375px 为 20px、副标题为 14px、CTA 为 15px；使用内联 `min()` 渐进覆写，不支持该函数的客户端保留桌面字号。

## 赠品、权益与工具

### `gift.showcase2` — 双赠品展示卡

- 可编辑：每件赠品的照片 URL、Alt、名称、价值、卖点、CTA文字、CTA链接、赠送规则，共16项内容；另有底色、主文字色、价值/CTA底色、规则文字色4项设置。
- 固定：上方左照片右文案，下方左文案右照片；600×677px、左右列302/298px，375px下等比约375×423.125px。FREE GIFTS徽章保留在照片内；不添加顶部标题、圆角或图片区链接。两张照片从新版参考图按各自边界精确裁出，不重绘、不拉伸。
- 默认眼罩为 `VALUE $59.9`、`SPEND $699+`，规则为满$699赠眼罩；抱枕套为 `VALUE $89.9`、`SPEND $999+`，规则为满$999赠抱枕套。规则已按用户确认修正；门槛与说明为独立文案，修改时需同步，不会设置店铺折扣。
- 两个CTA是独立真实链接，默认均为 `https://freshinelife.com/`。桌面CTA为221×39px，375px下138.125×24.375px；长文案自然换行并可能撑高组件，建议保持原稿字数。
- 本地素材为 `asset://gift-showcase-eye-mask-photo` / `asset://gift-showcase-pillow-cover-photo` / `asset://gift-showcase-shopping-bag`。购物袋图标 `cta.icon.url` 为隐藏素材字段；最终导出三张图片都需要公开HTTPS地址。Lora/Montserrat使用既有邮件字体回退栈，真实收件箱需另行验证。
- 沿用 `gift.showcase2`，独立于原有 `gift.rewardGrid2`。既有完整快照不会自动增加新字段，升级时请重新添加组件或显式补齐新内容/设置；保留原整图素材供追溯。

### `gift.doubleGiftAddressShowcase` — 双赠品展示卡2

- 可编辑：顶部标题/说明，每件赠品的图片、Alt、名称、价值、CTA文字/链接、赠送说明，底部提示，以及外层、卡片、主文字、红色强调、辅助文字五组颜色。
- 固定：600px 画布中左右各 262px 卡片、12px 间隔、32px 外边距；默认约 600×488px。375px 下保留双列并等比缩放，不改为单列。
- 默认两张 524×308px 照片从 `容器 117.png` 精确裁切，内含 `FREE GIFTS` 徽章；不使用 CSS/SVG 重绘。两个 CTA 共用透明购物袋图标，底部使用原稿裁切的礼物图标。
- 只有两条红色 CTA 可点击，默认均指向 `https://freshinelife.com/`；图片和其他文字不绑定链接。展示文案不会设置 Shopify 满额赠品规则。
- 本地素材是四个 `asset://double-gift-address-*` 预览输入；最终导出前需全部换成公开 HTTPS 地址。该组件独立于 `gift.showcase2` 和 `gift.rewardGrid2`。

### `gift.rewardGrid2` — 双赠品奖励卡

- 可编辑：组件背景色、顶部主标题、两行满额赠品规则、上下两张完整赠品图及各自 Alt 文本。
- 固定：顶部主标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`，顶部赠品规则使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`；两张图片的原有点击链接、图片间距和标题层级；图片在移动端等比例缩放。图片内部的价格、赠品名称和说明不拆成 HTML 字段，需随整图替换。

### `image.benefitsStrip3` — 三项权益整图

- 可编辑：整图 URL、Alt 和组件底色。
- 固定：三项权益已合并在同一张图中，整图按比例缩放，不拆分为三个独立布局块。

### `image.benefitsStrip4` — 四项权益整图

- 可编辑：整图URL、Alt和组件底色。
- 固定：7–14 Day Delivery、Free Shipping、Free Design和Secure Payments已合并在同一张图中；整图按比例缩放，不拆分为四个独立布局块，也不绑定链接。

### `image.benefitsStrip4TwoRows` — 四项权益整图（两行）

- 可编辑：整图 URL、Alt 和组件外部底色（默认 `#FFFFFF`）；底色设置不改变图片内部背景。
- 固定：使用用户最新提供的 1200×1080px 原图，保留图内标题 Our Custom Window Treatments & Services，权益第一行为 7-14 Day Delivery / Free Shipping，第二行为 Free Design / Measurement Tool；不拆分、不裁切、不绑定链接。
- 桌面 600×540px；375px 手机端约 375×337.5px，整图等比例缩放，保留两行两列排布。
- 通过独立 `asset://benefits-strip-4-two-rows` 接入本地素材流程，最终导出使用公开 HTTPS 图片；与原有单行 `image.benefitsStrip4` 分别选择和编辑。

### `image.benefitsAddressCard` — 权益+地址组合卡

- 可编辑：整图 URL、Alt 和组件外部底色（默认 `#F8F4EE`）；底色设置不改变图片内部背景。
- 固定：完整保留用户确认的 1200×1704px 原图，图内包含标题、六项服务权益、分割线、展厅照片、地址及预约说明；不拆分、不裁切、不重绘、不绑定链接。
- 桌面 600×852px；375px 手机端约 375×532.5px，使用单张图片等比例缩放且不增加额外留白。
- 通过独立 `asset://benefits-address-card` 接入本地素材流程，最终导出使用公开 HTTPS 图片；与权益整图和独立展厅地址卡分别选择和编辑。

### `tool.measurementCard` — 尺寸测量工具卡

- 可编辑：测量场景图/Alt、标题、副标题、CTA 文案/链接、组件底色、文字色和操作色。
- 固定：主图桌面约 548×493px，标题、说明和下划线 CTA 左对齐。

### `tool.freeMeasurementGuidance` — 免费测量引导卡

- 可编辑：居中标题、副标题、完整测量场景图/Alt/点击链接，以及组件底色与标题色。
- 固定：600px画布中的标题区和约600×416px场景图比例；仅完整场景图可点击，不新增CTA或其他热区。

## 地址与页脚

### `location.showroomCard` — 展厅地址卡

- 可编辑：组件背景色。地址、电话、预约说明和图片继续使用完整默认快照。
- 固定：顶部居中标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`；图片下方地址正文使用 Montserrat `16px / 400 / 25px`，不按顶部副标题处理；桌面 600px 与移动端表格流式布局，国家、电话和预约与收件限制说明保持可读。

### `footer.warm` — 品牌信息页脚

- 可编辑：页脚背景色、正文色和链接色。
- 固定：品牌信息、地址、联系信息、法律信息、退订链接和七枚社媒图标的顺序。七枚图标保留统一 `26 × 26px` 居中单元，并按当前素材透明留白校准为 YouTube `24px`、Instagram `24px`、Facebook `23px`、TikTok `24px`、Pinterest `24px`、WhatsApp `24px`、Threads `23px`；HTML 编辑器不开放这些几何值，避免替换颜色等常规内容时破坏已验证的视觉平衡。

### `footer.doubleDivider` — 双分割线页脚

- 可编辑：外层画布、内容区、正文和链接颜色。
- 固定：600px 流式画布中的 508px 内容列；内容区顶部无额外留白的第一条 `#E3E0DE` 细分割线，社媒图标后 24px 的第二条同色细分割线；品牌、地址、联系信息、法律信息和退订链接的顺序。七枚社媒图标按 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads 顺序位于 `26 × 26px` 居中单元，尺寸为 YouTube `24px`、Instagram `24px`、Facebook `23px`、TikTok `24px`、Pinterest `24px`、WhatsApp `24px`、Threads `23px`。HTML 编辑器只开放 `color.canvas`、`color.background`、`color.text` 与 `color.link`，不开放几何或图标尺寸。

### `footer.minimalContact` — 简约联系页脚

- 可编辑：页脚背景色、正文色和链接色。
- 固定：600px 参考图的地址、预约说明、电话/支持邮箱、七枚社媒图标、496px `#B59B8B` 分割线、版权/品牌名与退订链接顺序；没有品牌名或顶部金色短线。七枚图标复用当前页脚的公开 HTTPS 素材与跳转，按 YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads 顺序置于 `26 × 26px` 居中单元，图像尺寸为 `24px`、`24px`、`23px`、`24px`、`24px`、`24px`、`23px`。375px 使用内联 `min()` 缩放，HTML 编辑器不开放内容、间距、弱化文字色或图标几何。
