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

## 导航组件

### `navigation.promotionCta` — 活动促销 CTA

- 可编辑：活动名称、分隔图/Alt、折扣主文案、说明、CTA 文字/HTTPS 链接，以及组件背景、文字和 CTA 主题色。
- 固定：600px 画布，上下各 45px 留白；Montserrat 标题 `30px / 600 / 37px`、折扣 `50px / 700 / 62px`、说明 `18px / 400 / 27px`，以及 `284×55px` 的描边圆角 CTA。375px 下按 inline `min()` 渐进缩小；没有 Shopify 导入功能。

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
- 固定：标题为 Lora `30px / 500 / 45px`，副标题为 Montserrat `16px / 500 / 24px`、`#7C706A`，顶端间距为 42px；商品图为 236×236px 的居中 cover 裁切，图片底部为 33px 统一折扣条，商品名称为 Montserrat `18px / 500 / 22px`。600px 画布中两列三行，底部 CTA 上限为 520px、`width:86%`。

### `collection.saleGrid4` — 四宫格折扣商品

- 可编辑：组件背景色、统一折扣标签主题色，以及四款商品各自的折扣文案、主图、Alt 与整图跳转链接。每款商品可独立输入 Freshine 商品 URL 并只读导入首张主图、链接与折扣；无有效折扣时清空该格标签。
- 固定：不含标题、说明或 CTA；600px 画布内 `508px` 内容区，两列两行各 `246×246px`，横向间距 `16px`、行间距 `20px`、底部留白 `52px`。375px 下保留两列比例缩放，使用内联 `min()`，不使用 Flex、Grid 或媒体查询。

### `collection.curtainInspirationGrid4` — 窗帘灵感四宫格

- 可编辑：顶部标题/说明、四张灵感图片、各自 Alt 和独立点击链接、各图下方标题，以及组件底色；`grid.showCaptions` 默认关闭，开启时显示图片标题，关闭时不输出标题及其额外留白。
- 固定：600px 画布中的内容区为 510px；两列各 247px，横向间距为 16px。标题关闭时行间为 16px；开启时，图片标题使用 Montserrat `16px / 500 / 22px`、居中自然换行，图文间距 11px，且上下两行间距增至 32px。顶部居中标题使用 Lora `30px / 500（Medium） / 38px`，说明使用 Montserrat `18px / 500 / 27px`。四张图保持正方形比例，375px 下按容器等比缩小；不使用 Flex 或 Grid。

### `collection.curtainEditorialTriptych` — 窗帘场景三图卡

- 可编辑：一张上方场景大图、两张下方场景图、三张图各自的 Alt 和 HTTPS 链接、两张下方图片的文字链接、底部标题/说明和组件底色。该组件已登记为 HTML 编辑器中的自由组合样式。
- 固定：600px 画布中大图为 `538×536px`，下方两图各 `256×319px`、中间 `12px`；大图和下方两图区间隔 `35px`，图片下方文字为 Montserrat `16px / 500 / 22px`，与图片相隔 `16px`。底部标题采用 Montserrat `30px / 500（Medium） / 150%`，说明采用 Montserrat `16px / 500 / 150%`，均居中、字间距 `0px`；说明下方为 `36px` 留白、`#E2DEDB` 的 `1px` 分割线和 `37px` 留白。标题与说明在 375px 下通过内联 `min()` 分别渐进缩至 `26px`、`14px`，分割线按 `87.333%` 宽度收缩；不支持该函数的客户端保留桌面字号。双图保持两列结构，不使用 Flex、Grid 或定位。

## 评论与整图

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

### `gift.rewardGrid2` — 双赠品奖励卡

- 可编辑：组件背景色、顶部主标题、两行满额赠品规则、上下两张完整赠品图及各自 Alt 文本。
- 固定：顶部主标题使用 Lora `30px / 500（Medium） / 38px`、字间距 `0px`，顶部赠品规则使用 Montserrat `18px / 500（Medium） / 150%（27px）`、字间距 `0px`；两张图片的原有点击链接、图片间距和标题层级；图片在移动端等比例缩放。图片内部的价格、赠品名称和说明不拆成 HTML 字段，需随整图替换。

### `image.benefitsStrip3` — 三项权益整图

- 可编辑：整图 URL、Alt 和组件底色。
- 固定：三项权益已合并在同一张图中，整图按比例缩放，不拆分为三个独立布局块。

### `tool.measurementCard` — 尺寸测量工具卡

- 可编辑：测量场景图/Alt、标题、副标题、CTA 文案/链接、组件底色、文字色和操作色。
- 固定：主图桌面约 548×493px，标题、说明和下划线 CTA 左对齐。

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
