# 倒计时头图2 设计

## 目标

参考 `/Users/ww/Downloads/头图_深色VXII 1.png`，新增一个独立的 600px 邮件头图组件。组件复用参考稿的元素层级，但采用已确认的“平衡紧凑”版式，把目标总高度控制在约 920px，避免按原稿比例放大到约 1328px。

- 中文名称：倒计时头图2
- Component Key：`hero.countdownOverlay2`
- 目录：`头图/倒计时头图2/`
- 桌面画布：600px
- 移动端目标：约 375px
- 使用位置：现有六段 Campaign 结构中的首图区段，作为第三种候选样式

本组件不替换 `hero.promotionalOverlay` 或 `hero.countdownOverlay`，也不改变首图、促销多商品栏、整图链接、赠品、地址、页脚的固定区段顺序。

## 版式结构

组件从上到下由以下区域组成：

1. Logo 区；
2. 顶部促销条；
3. 活动文案区；
4. 主图；
5. 图片下方促销文案区。

Logo 区与活动文案区共用组件整体背景色。Logo 默认使用组件自有的透明底深棕色 FreShine PNG：`头图/倒计时头图2/assets/default-logo-brown.png`，字标色为参考图采样值 `#652E17`。Logo 位于参考稿原位置，不增加圆形徽章或独立色条。

顶部促销条保持左侧说明、右侧链接的双栏结构。活动文案区按视觉顺序显示活动名称、折扣消息和补充说明。

主图与图片下方促销文案区组成独立内层卡片，置于组件整体背景色之上。卡片宽度为画布的 90%、最大 540px，保留左右和底部背景留白；主图固定使用 `1:1` 比例，桌面端显示为 `540×540px`，图下促销文案区同为 540px 宽。约 375px 移动端中，内层卡片流式缩放到约 337.5px，主图显示为约 `337.5×337.5px`。外层不设置可能与文案换行冲突的固定总高度，正常默认文案下的目标总高度约为 1060px。

图片下方促销文案区依次显示：

1. 静态倒计时文案；
2. 固定三栏权益；
3. CTA；
4. 补充提示。

三项权益的数量和顺序固定，只允许修改每项纯文字，不支持增减或排序。桌面端与移动端都保持三栏；建议每项不超过 24 个英文字符，移动端最多换成两行。超长文案只提示移动端风险，不自动截断。

静态倒计时 `ONLY 3 DAYS!` 固定使用 Lora 字体；三项权益之间使用两条 1px 宽、22px 高的竖向分隔线，与参考稿保持一致。

顶部促销栏及 `SIGN UP` 使用 14px/20px并保持 52px 高度；主标题下补充说明使用 14px/21px；底部补充提示使用 14px/20px。三项权益保留 12px/17px，以维持约 375px 移动端三栏的可读密度。

## 内容字段与默认值

组件采用完整 `content` 快照，不由拼接器读取 fixture 或补默认值。字段至少覆盖以下内容：

| 位置 | 字段 | 默认或来源 |
| --- | --- | --- |
| 顶部促销说明 | `promotion.text` | `Unlock $100 Off Your First Order at Freshine` |
| 顶部链接文字 | `promotion.linkText` | `SIGN UP` |
| 顶部链接 | `promotion.url` | `https://freshinelife.com/` |
| Logo 图片 | `brand.logo.url` | 本地注册的透明底深棕色 Logo |
| Logo Alt | `brand.logo.alt` | `FreShine` |
| Logo 链接 | `brand.logo.clickUrl` | `https://freshinelife.com/` |
| 活动名称 | `hero.eyebrow` | 当前 Skill 的 Shopify 活动导入结果 |
| 折扣消息 | `hero.title` | 当前 Skill 的 Shopify 活动导入结果 |
| 补充说明 | `hero.subtitle` | 当前 Skill 的 Shopify 活动导入结果 |
| 主图 | `hero.image.url` | 用户选择的默认图、本地图片或公开 HTTPS 图片 |
| 主图 Alt | `hero.image.alt` | 根据实际图片内容生成并展示 |
| 静态倒计时 | `urgency.title` | `ONLY 3 DAYS!` |
| 权益 1 | `benefit.1.text` | `UP TO 65% OFF` |
| 权益 2 | `benefit.2.text` | `Free Gift On $699+` |
| 权益 3 | `benefit.3.text` | `Free Shipping` |
| CTA 文字 | `hero.cta.text` | `Shop the Holiday Sale >>` |
| CTA 链接 | `hero.cta.url` | 当前 Skill 所选活动页链接 |
| 补充提示 | `urgency.note` | `Limited Time Offer` |

`ONLY 3 DAYS!` 是默认可编辑的静态文案，不根据活动日期自动计算。顶部促销条、Logo、倒计时、三项权益、CTA 和补充提示均作为默认可编辑内容；执行 Skill 时不逐字段追问，而是在首图完成卡片中统一展示，用户主动提出时才替换指定字段。

组件 fixture 仅用于本地组件演示；当没有实际活动选择上下文时，演示链接可使用首页。正式 Campaign 快照必须把 CTA 链接写成当前所选活动页链接。

## 主图资产

从参考设计稿的中部人物与窗帘场景裁切一张本地默认主图，存放在组件自己的 `assets/` 目录。它与透明底深棕色 Logo 都是本地预览资产，不是最终 Omnisend URL。

执行 Skill 时必须主动进入主图收集步骤：

1. 说明组件画布为 600px，内层图片卡片宽度为 90%、最大 540px；图片使用 `1:1` 比例，桌面端显示尺寸 `540×540px`，约 375px 移动端显示为 `337.5×337.5px`；
2. 推荐提供 `1200×1200px` 的 2× 图片；
3. 提示主体与关键内容应靠近画面中央，避免居中裁切损失；
4. 提供三个选择：使用设计稿裁切的默认图、提供本地图片路径、提供公开 HTTPS 图片链接。

图片比例不符时，先提示将按 `1:1` 居中裁切适配，再通过桌面端与移动端预览确认。由确定性图片处理脚本生成独立的 `1:1` 预览衍生图，不覆盖用户原图；正式构建上传已确认的同等比例衍生图，避免依赖邮件客户端不稳定的 `object-fit` 裁切。图片路径或 URL 无效、远程图片无法只读获取或衍生图生成失败时停止生成确认预览。本地图片只允许进入本地预览；最终 Omnisend 构建前必须由既有上传流程替换为公开 HTTPS URL。

## 颜色与样式

组件使用完整 `settings` 快照。参考稿颜色经实现阶段取样后固化为组件默认值，并遵守以下交互规则：

- CTA 按钮继承 Campaign 开场设置的全局操作色；没有全局操作色时使用设计稿默认红色。
- Logo 区和活动文案区继承全局正文背景色；没有全局正文背景色时使用设计稿默认米白色。
- 图片下方促销文案区始终先使用设计稿默认背景色。用户未主动提出时不继承全局正文背景色，也不修改该颜色。
- 顶部促销条使用设计稿默认左右色块和文字色；只在用户主动提出时修改。
- 当前所有色值都在首图完成卡片中展示。

布局仅使用邮件安全的 `<table>`、`<tr>`、`<td>` 和内联 CSS。禁止 JavaScript、Flex、Grid、绝对定位、外部 CSS 和依赖脚本的实时倒计时。图片使用显式宽高属性及 `width:100%;height:auto` 的兼容写法。

## Skill 交互与数据流

把 `hero.countdownOverlay2` 加入首图区段候选和组件交互索引。样式卡只显示“倒计时头图2”、组件效果演示和一句用途说明，不展示 Component Key。

选择该样式后：

1. 沿用当前 `build-omnisend-campaign-draft` Skill 已确认的 Shopify 只读活动读取流程；
2. 沿用当前活动字段映射，导入活动名称、折扣消息、补充说明、活动页链接和推荐 Collection；
3. 展示导入结果但不新增一轮文案确认；
4. 主动收集主图；
5. 合并组件默认内容、活动导入值、主图选择和全局颜色；
6. 生成一张首图完成卡片、600px 桌面端预览和约 375px 移动端预览；
7. 只询问一次是否确认本组件。

完成卡片展示全部文案、Logo、主图、Alt、链接、三项权益、颜色及资产来源。用户提出修改时，只更新指定字段并重新生成同一组卡片和预览；明确确认后才锁定组件及推荐 Collection。

Shopify 活动不存在、快照变化或必要字段缺失时立即停止，不猜测、不虚构、不自动降级为其他数据来源。拼接器仍只负责完整快照校验、CSS 内联、顺序组装和渲染，不负责 Shopify 读取、询问、主题合并或样式修改。

## 组件文件与注册

新增：

- `头图/倒计时头图2/component.template.v1.html`
- `头图/倒计时头图2/component.styles.v1.css`
- `头图/倒计时头图2/content.schema.v1.json`
- `头图/倒计时头图2/content.fixture.v1.json`
- `头图/倒计时头图2/settings.schema.v1.json`
- `头图/倒计时头图2/settings.defaults.v1.json`
- `头图/倒计时头图2/COMPONENT_MANAGEMENT.zh-CN.v1.md`
- `头图/倒计时头图2/效果演示.html`
- `头图/倒计时头图2/assets/` 下的组件本地预览资产

更新：

- `组件清单.json`
- `组件索引.md`
- `README.md`
- `skills/build-omnisend-campaign-draft/SKILL.md`
- `skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`
- `skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`
- `skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`
- 对应组件与 Skill 契约测试

现有默认六组件 composition 不自动改选新头图；新组件先作为可选择候选和独立演示加入。

## 测试与验收

实施必须遵循测试先行：先增加失败契约，再创建或修改实现，最后运行全量测试。

组件输出分为两个 HTML 层级：`component.template.v1.html` 是保留字段占位符的邮件安全组件片段，`效果演示.html` 是注入默认完整快照并完成 CSS 内联的独立浏览器预览。正式交付必须是构建后的完整 HTML；桌面端和移动端截图只作为视觉验收证据，不能代替 HTML。

测试至少覆盖：

- 注册表中存在唯一 `hero.countdownOverlay2`，中文名称和路径正确；
- 首图区段包含三个候选，固定六段结构和终端页脚规则不变；
- content/settings fixture 是 Schema 接受的完整快照；
- 拼接器可渲染组件且无未解析占位符；
- 单根表格、禁止标签、禁止 CSS 和 URL 安全扫描通过；
- 主图使用 `1:1` 比例，桌面端显示尺寸为 `540×540px`、约 375px 移动端为 `337.5×337.5px`，并与下方促销文案区严格等宽；内层卡片保留组件背景色形成的左右和底部留白；
- `ONLY 3 DAYS!` 使用 Lora，三项权益之间渲染两条固定竖向分隔线；
- 桌面端和移动端均保持固定三栏权益；
- 默认 Logo、默认裁切主图可在本地预览中解析；
- 非 `1:1` 输入生成独立的居中裁切衍生图，不覆盖原图且不在 HTML 中拉伸；
- 最终构建在本地资产未上传时被阻止；
- Skill 主动询问主图，并提供默认图、本地路径、公开 HTTPS 三种来源；
- 完成卡片、桌面端预览和移动端预览只触发一次组件确认；
- CTA 链接绑定当前活动页，Logo 和顶部促销条默认链接行为正确；
- 全量 Node 测试通过。

静态检查通过只表示符合本地结构与安全规范。正式使用前仍需在 Omnisend 检查 Desktop、Mobile 和 Dark Mode，并向 Gmail、Outlook、Apple Mail 发送测试邮件。最终上传或更新 Omnisend 草稿仍必须经过本地 HTML 预览、高层清单和内容哈希绑定确认。
