# 倒计时头图设计 QA

## 对比目标

- Source visual truth: `/var/folders/qb/gfhrch2s3n19l1hfdcyw2yd80000gn/T/codex-clipboard-393c6939-be63-4377-96a9-067fd1c3d965.png`
- Source pixels: 868×1164；目标内容按 600px 邮件画布归一化。
- Background asset: `/Users/ww/Downloads/素材(1)/banner.jpg`，1200×1443；当前紧凑版正式背景建议 600×560 或 1200×1120，并把主体放在中央安全区。
- Implementation: `/Users/ww/Desktop/邮件营销运营/邮件html组件/countdown-hero.local-preview.html`
- Implementation screenshot: unavailable；Chrome 对当前 `file://` 本地预览地址执行了安全策略拦截。
- Intended CSS viewport: 600px desktop；375px mobile target。
- State: 默认文案、默认导航、默认首页链接、新背景、深色 FreShine Logo、用户提供的分隔装饰图。

## Full-view comparison evidence

无法完成当前实现的浏览器截图，因此没有满足同视口、同状态的完整画面对照证据。已完成的源级约束包括：外层 `width:100%;max-width:600px`，600×621px 桌面总画布、61px 导航、600×560px 桌面主视觉、420px 面板、105px Logo、180px 分隔图、190×42px CTA；375px 目标使用 61px 导航、520px 主视觉并保持相同内部元素尺寸。这些只能证明实现参数，不等于视觉通过。

## Focused region comparison evidence

未执行。Logo、分隔图、面板透明度、背景 `cover` 裁切和字体实际渲染都必须以浏览器截图判断，不能仅凭文件或代码通过。

## Findings

- [P1] 缺少修复后的浏览器渲染证据
  - Location: `countdown-hero.local-preview.html`
  - Evidence: 参考图可读取，但当前实现无法通过允许的 Chrome 浏览器通道打开并截图。
  - Impact: 无法确认新背景裁切、Logo 透明边缘、装饰图清晰度、面板纵向位置及文本换行是否与参考图一致。
  - Fix: 由用户在当前 Chrome 标签页手动刷新本地预览并提供或授权可读取的同视口截图，再进行同图对比。

## Comparison history

- Iteration 1: 将旧背景引用替换为组件自有 1200×1443 背景；将字体品牌名和文字星形替换为真实 Logo 与分隔 PNG；按参考比例重设面板上下内边距和内容间距。
- Iteration 2: 将错误的 751px 主视觉改为 61px 导航加 690px 主视觉，总高保持 751px；绑定 `SIGN UP` 与 `SHOP NOW` 主题色，并以确定性混色生成左侧导航浅色。
- Iteration 3: 移除导致 375px 主视觉仍高 600px 的错误下限，改为 368px；用 `clamp()` 同步缩放导航、面板内边距、Logo、分隔图、标题、说明、四段间距和 CTA，同时保留桌面固定值作为旧邮件客户端降级。
- Iteration 4: 按用户反馈将桌面主视觉由 690px 收短为 560px，总高由 751px 收短为 621px；375px 主视觉同步收短为约 350px。面板、Logo、分隔图、标题、间距和 CTA 一并紧凑化，避免只裁背景造成内容拥挤。
- Iteration 5: 参考现有 `hero.promotionalOverlay` 的响应式模式，保留 600px 桌面宽度上限与移动端流式宽度，把主视觉移动端下限提高到 520px；移除内部元素的 `clamp()` 缩放，让字体、Logo、面板间距和 CTA 在桌面与移动端保持一致。
- Post-fix evidence: 源代码、资源尺寸和自动化测试已检查；浏览器图像证据缺失，不能判定视觉通过。

## Implementation checklist

- 在 600px 画布刷新本地预览并截取组件完整高度。
- 将实现截图与 868×1164 参考图归一化后进行全图比较。
- 聚焦检查 Logo、分隔图、倒计时标题、说明单行状态和 CTA。
- 另以约 375px 宽度检查移动端换行和面板溢出。

## Follow-up polish

- 仅在取得渲染截图后判断是否需要微调面板透明度或背景定位；当前不凭代码猜测视觉偏差。

final result: blocked

---

# 倒计时头图2 设计 QA（2026-08-12）

> 上文为旧组件 `hero.countdownOverlay` 的历史 QA 记录；本节是新组件 `hero.countdownOverlay2` 的最新验收结果。

## 对比目标

- Source visual truth: `/Users/ww/Downloads/头图_深色VXII 1.png`。
- Source pixels: 430×952，密度按源图像素使用；用于元素层级、配色、图片内容和排版节奏参考。
- Implementation URL: `http://127.0.0.1:8765/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html`。
- Desktop screenshot: `/private/tmp/countdown-hero-2-desktop-600-v4.png`，600×1100 像素截图，CSS viewport 600×1100，device pixel ratio 2，组件实际 600×940 CSS px。
- Mobile screenshot: `/private/tmp/countdown-hero-2-mobile-375-v2.png`，375×1000 像素截图，CSS viewport 375×1000，device pixel ratio 2，组件实际 375×834.75 CSS px。
- State: 默认可编辑文案、默认首页链接、指定白色 FreShine Logo、设计稿默认裁切主图、默认组件颜色。

## Full-view comparison evidence

在同一次图像对比中同时打开了源设计、600px 实现和 375px 实现。实现保留 Logo 区、左右双栏促销条、三行活动文案、人物与窗帘主图、静态倒计时、固定三栏权益、红色 CTA 和补充提示。首次实现高度为 993px，与已确认的“约 920px”紧凑目标有 P2 偏差；压缩两个文案区垂直留白后，复查高度为 940px，且不改变字体、内容和图片比例。

主图在桌面端为 600×470 CSS px，图下文案区宽度同为 600px；移动端分别为 375×293.75px 和 375px 宽。两种视口都无水平溢出，三项权益保持固定顺序的三栏结构。

## Focused region comparison evidence

不需要额外局部裁图：430×952 源图与两张实现全图中，Logo、促销条、三行活动文案、主图人物、三栏权益和 CTA 文字都可直接辨读。主图使用组件自有 1200×940 JPEG，没有拉伸或用 `object-fit` 做客户端裁切。

## Findings

- 无可执行 P0/P1/P2 问题。
- [P3] 白色 Logo 在默认米白背景上对比度较低。这是用户已确认的指定白色 Logo 素材与“Logo 区使用组件整体背景色”组合，本轮不擅自改色或增加色条。
- [P3] 邮件链接都使用 `target="_blank"`；测试浏览器已成功发出 CTA 点击，但该浏览器没有暴露新标签导航结果。DOM 已验证 Logo、`SIGN UP` 与 CTA 的完整 `https://freshinelife.com/` 链接；真实邮箱客户端跳转仍属最终测试邮件范围。

## 必查面

- Fonts and typography: Lora 标题层级与 Montserrat 小文案匹配参考结构；375px 下折扣消息自然换成两行，无截断。
- Spacing and layout rhythm: 组件高度从 993px 收紧到 940px；主图与图下区严格等宽；三栏在 375px 下不堆叠。
- Colors and visual tokens: 默认米白、灰粉促销条、浅灰褐文案区和暗红 CTA 与源稿同一配色方向；颜色全部保留在完整 settings 快照中。
- Image quality and asset fidelity: 使用源设计的人物与窗帘实图及用户指定 Logo，无占位图、CSS 伪造资产或拉伸。
- Copy and content: 默认促销条、活动文案、静态倒计时、三项权益、CTA 与补充提示全部完整渲染。

## Comparison history

- Iteration 1: 完成 600px 邮件安全表格结构，主图 600×470px，图下等宽文案区和移动端固定三栏。首次浏览器证据显示组件高度为 993px。
- Iteration 2: 只收紧活动文案区与图下文案区垂直留白。复查证据显示桌面组件 600×940px、移动组件 375×834.75px，无溢出、无控制台错误或警告。

## Implementation checklist

- [x] 600px 桌面端全图比较。
- [x] 375px 移动端响应式比较。
- [x] 主图与图下文案区等宽。
- [x] 固定三栏、文案换行与无横向溢出。
- [x] 资产读取、DOM 内容、HTTPS 链接与控制台健康。

final result: passed

---

# 简约联系页脚社媒与分割线留白 QA — 2026-09-02

## 对比目标与状态

- Source visual truth: `/Users/ww/Downloads/劳动节活动图/结尾/I.jpg`，1200×440px；关注社媒 logo 与其下方分割线的垂直留白。
- Implementation: `http://127.0.0.1:4301/页脚组件/简约联系页脚/效果演示.html`。
- State: 默认内容、默认配色，未执行远端上传、保存、发送或排期。
- Viewports: 600×360 与 375×300 CSS px，devicePixelRatio=1。原图在同一视觉比较输入中与最终浏览器截图一并打开；桌面实现组件为 600×227.477 CSS px，移动为 375×150.352 CSS px。
- Focused evidence: 浏览器 DOM 量测社媒首个单元格与 496px 分割线。桌面间距为 9px（社媒 95px–120.992px，分割线 y=129.992px）；移动间距为 5.625px（社媒 59.375px–75.617px，分割线 y=81.242px）。

## Findings 与比较历史

1. v1 [P2，已修正] 社媒单元格底部到分割线只有 3px，视觉留白不足。将分割线行的顶部内边距改为 `9px`，并继续使用等比移动端声明 `min(9px,1.5vw)`。
2. v2 最终检查未发现待处理的 P0/P1/P2 差异：图标尺寸、颜色、分割线宽度和其后的版权/退订信息均保持不变，仅分割线及以下内容按增加的留白下移。

## 五项视觉检查

- 字体：Montserrat/Arial/Helvetica 的字号、粗细和行高未改动；桌面和移动文本未新增换行。
- 间距布局：仅社媒到分割线的空隙由 3px 增至 9px；375px 按既有 0.625 比例为 5.625px，且 `scrollWidth=clientWidth`（600 与 375）无横向溢出。
- 配色：米白背景、社媒图标、`#B59B8B` 分割线和链接蓝色保持原值。
- 图像：七个现有社媒素材、尺寸与顺序未改动；浏览器日志无 error/warn。
- 文案：地址、联系方式、版权、品牌名和退订链接均未改动。

## Implementation Checklist

- [x] 用例先收窄至实际 legal divider 行，并验证旧 3px 实现会失败。
- [x] 同步模板与效果演示的 9px / `min(9px,1.5vw)` 留白。
- [x] 聚焦测试、移动端规范检查、600px/375px 浏览器量测与完整回归均已完成。

## Follow-up Polish

- P3：如后续希望留白再大或更接近特定收件箱客户端的呈现，可在真实 Omnisend/Gmail、Outlook、Apple Mail 中再做一次邮件客户端验证；本次未进行远端或收件箱操作。

final result: passed

---

# 双赠品展示卡2底部礼物图标替换 QA — 2026-09-02

## 对比目标与状态

- Source visual truth：用户提供的 Omnisend 公开素材 `https://app.omnisend.com/images/6a97926cc723a01883e3ab18`；浏览器读取原始尺寸为 60×60px，无底色礼物图标。
- Implementation：`赠品与权益组件/双赠品展示卡2/效果演示.html`，底部隐藏默认字段 `footer.icon.url` 已使用该公开 URL。
- 浏览器截图：`/private/tmp/double-gift-footer-icon-source.png`、`/private/tmp/double-gift-footer-icon-600.png`、`/private/tmp/double-gift-footer-icon-375.png`；桌面 CSS 视口为 600×900，移动 CSS 视口为 375×700，devicePixelRatio=1。
- State：默认文案、颜色、双卡布局与 CTA 未改变；只替换底部小礼物图标素材。

## Findings

- 无可执行 P0/P1/P2 问题。浏览器最终加载到图标的 natural size 为 60×60px，CSS 背景为透明，控制台没有 error/warn。
- 600px：组件为 600×487.98px；图标仍显示为约 14×14px，右侧间距仍为 5px，位于底部提示文字左侧。`clientWidth=scrollWidth=600`。
- 375px：组件为 375×304.98px；图标按原有 `min()` 规则显示为约 8.74×8.74px，右侧间距约 3.125px，仍与提示文字垂直居中。`clientWidth=scrollWidth=375`。

## 五项视觉检查

- 字体与文案：底部提示的 Montserrat/Arial/Helvetica 斜体、13px/20px 及文案均未改变。
- 间距与布局：图标的 14px 固定桌面尺寸、5px 间距和原有 footer padding 均未修改；移动端保持等比缩放。
- 配色：图标本身未附加 HTML/CSS 底色，组件的 `color.muted` 仅继续控制提示文字色。
- 图像：使用用户提供的实际 Omnisend PNG URL，不使用 SVG、emoji 或 CSS 图形；60px 源图缩至 14px 显示，清晰度充足。
- 交互：底部图标和提示仍非链接；两个 CTA 链接不受影响。

## 验证边界

- 聚焦组件测试 3/3 通过；本地浏览器 600px/375px 预览成功加载，无控制台 error/warn；`git diff --check` 通过。
- 未上传 Omnisend、保存草稿、发送、排期或发布。本地预览不等同于 Gmail、Outlook 或 Apple Mail 的收件箱验证。

final result: passed


---

# 圆标场景叠字头图设计 QA — 2026-08-31

## 对比目标与状态

- Source visual truth：`/Users/ww/Downloads/容器 109.png`，1200×1522px；按 50% 显示即 600×761px。
- Component：`hero.circleLogoSceneOverlay`，`头图/圆标场景叠字头图`。
- Background source：`/Users/ww/Downloads/Amara_Floor-to-Ceiling_Linen_Curtains_Light_Beige_1038-1_4 2.png`，1216×1522px；使用 `cover center top`，600px 输出仅裁去源图两侧各 8px。
- Approved logo：`/Users/ww/Downloads/组合 177.png`，238×238px 透明 PNG；组件副本 SHA-256 与源文件一致，均为 `65fb8f34f185949c9f9614d2ff66d3a7ac1249499f0b8384098c070943cb589c`。
- Local editor：`http://127.0.0.1:4176/`；在编辑器中从「头图」选择「圆标场景叠字头图」并添加成功。
- State：默认背景、白色圆形 Logo、三层默认活动文案、整图点击；未执行远端上传、发送、排期或发布。
- Full-view comparison evidence：`audit/circle-logo-scene-overlay/comparison.html` 与 `comparison-final.png`。设计稿和 600px 终稿在同一输入中并排比较，375px 终稿位于同一页面下方。
- Implementation captures：`implementation-desktop-600.png` 为 600×900 视口截图，比较页只显示顶部 600×761 组件区域；`implementation-mobile-375.png` 为 375×700 视口截图，比较页只显示顶部 375×476 组件区域。
- Geometry evidence：`desktop-metrics.json`、`mobile-metrics.json`；浏览器实际 `devicePixelRatio` 为桌面 2、移动 1，CSS 尺寸以下列量测为准。

## Findings 与比较历史

1. v1 [P1，已修正] 初始预览使用了不透明的深色 Logo 版本，和设计稿白色透明圆标不一致。先用设计稿裁切恢复白色视觉，随后用户提供精确素材 `/Users/ww/Downloads/组合 177.png`；最终版本改为该原始透明 PNG，并以 SHA-256 断言锁定。
2. v2 [P2，已修正] 最终链接需统一增加指定追踪参数。整图唯一链接现为 `https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=cover-fc`，HTML 中 `&` 使用 `&amp;`，DOM 解析后精确一致。
3. 最终同屏复查未发现待处理 P0/P1/P2 视觉问题。圆标、场景主体和三层文字的垂直节奏与设计稿一致；浏览器字体抗锯齿与设计稿位图存在轻微 P3 差异，不需要改变结构。

## 五项视觉检查

- 字体：活动名称 36/46、300；主标题 66/80、700；补充说明 19/31、400，均使用 Montserrat 并保留 Arial/Helvetica 回退。375px 下按 0.625 比例缩放。
- 间距布局：桌面组件 600×761；Logo 120×120，坐标 (240,60)；活动名称 y=484，主标题 y≈550，补充说明 y≈642。移动组件 375×475.625；Logo 75×75，坐标 (150,37.5)。
- 配色：文字统一 #FFFFFF；图片加载失败底色 #C8B79D。没有设计稿中不存在的渐变、描边、按钮或导航。
- 图像：背景源图与透明 Logo 均真实加载完成；Logo natural size 238×238。背景按原稿比例裁切，不拉伸、不使用占位图或 CSS 绘制素材。
- 文案：`Labor Day Sale`、`UP TO 65% Off`、`EXTRA $600OFF&UP TO 20%OFF SITEWIDE` 均完整保留；补充说明在固定宽度内自然分为两行。

## 交互与编辑器检查

- 组件目录显示 `圆标场景叠字头图 · full-click-top-circle-logo-bottom-copy`，可自由添加到当前结构。
- 内容编辑器显示背景图、背景说明、整图链接、圆形 Logo、Logo 说明、活动名称、主折扣标题、活动补充说明；样式设置显示降级底色和统一文字颜色。
- 整个 600×761 头图只有一个真实 anchor；Logo、三层文案和场景空白区域均属于同一链接。
- 600px：`clientWidth=scrollWidth=600`；375px：`clientWidth=scrollWidth=375`，无横向溢出。
- 编辑器页和独立预览页的 error/warn 日志均为空；背景和 Logo 均加载完成。
- 本地浏览器验证不等于 Omnisend 上传或 Gmail、Outlook、Apple Mail 收件箱验证；最终导出仍需将本地 `asset://` 素材转换为公开 HTTPS URL。

## 测试结果

- 聚焦组件与编辑器契约：23/23 通过。
- 编辑器服务端回归：21/21 通过。
- Campaign 契约校验：39/39 注册组件、39/39 编辑器组件，`status=valid`。
- 完整测试：216/216 通过。
- `git diff --check` 通过。

## Implementation Checklist

- [x] 原稿、精确背景与 Logo 素材、模板、Schema、默认值、演示页、编辑器契约、组件清单与说明同步。
- [x] 600px 与 375px 几何、换行、无溢出、链接和素材加载完成浏览器验证。
- [x] 设计稿与终稿放入同一比较输入并完成最终复查。
- [x] 聚焦、服务端、契约和完整回归全部通过。
- [ ] 如需用于正式邮件，后续由用户在编辑器中确认并执行既有 Omnisend 导出/上传流程。

final result: passed


---

# 双赠品展示卡2设计 QA — 2026-08-31

## 对比目标与证据

- Source visual truth: `/Users/ww/Downloads/容器 117.png`，1200×978px；对比时归一化为 600×489px。
- Component: `gift.doubleGiftAddressShowcase`，`赠品与权益组件/双赠品展示卡2`。
- State: 设计稿默认文案、默认图片、两个独立首页 CTA，未连接 Shopify 赠品规则。
- Full-view comparison evidence: `audit/double-gift-address-showcase/comparison-600.png`；对照页为 `comparison-600.html`。
- Final screenshots: `implementation-600.png`、`implementation-375.png`；参考归一化图为 `reference-600.png`。
- Browser evidence: `browser-verification.json`，编辑器与独立预览的 error/warn 日志均为空，未发现框架错误遮罩层。

## Findings 与比较历史

1. v1 使用原稿确定性裁切的两张 524×308px 照片，按 600px 邮件画布还原 262px 双卡、12px 中缝和 32px 左右留白。
2. v2 通过真实本地编辑器添加组件，核对 17 个内容字段、5 个颜色设置与双 CTA；切换 600px/375px 预览宽度成功。
3. v3 将原稿与最终实现置于同一对照画面检查。标题和说明基线、图片裁切、卡片高度、红色门槛栏、规则说明与底部提示的可见差异均低于需要结构返工的程度。
4. 最终未发现待处理 P0/P1/P2 问题。[P3] 600px 浏览器实现高度为 488px，归一化原稿为 489px；1px 差异来自字体栅格与小数像素取整，不影响层级或可读性。

## 五项视觉与交互检查

- 字体：Montserrat 为主，Arial/Helvetica 降级；标题 30/38px，卡片名称 17/25px，价值文案为 13px 斜体，与原稿层级一致。
- 间距布局：桌面组件 600×488px；移动组件 375×304.98px，`scrollWidth=clientWidth=375`，保持双列且无横向溢出。
- 配色：默认使用 #FFFFFF、#F7F3EF、#1F1F1F、#991B1B、#7C706A；五项仅影响当前组件。
- 图像：两张主图均为原稿精确裁切，浏览器实际加载尺寸 524×308px；购物袋与底部礼物图标为真实 PNG 素材，未用 CSS/emoji 伪造。
- 文案与交互：默认文案与原稿一致；只有两条红色门槛栏为真实 anchor，图片、标题和底部提示不可点击。编辑器中选择类别、样式、添加与 600/375 切换均已验证。

## 验证边界

- 本轮只进行本地组件、编辑器、预览与测试验证；未上传素材、写入 Omnisend/Shopify、保存远程草稿、发送、排期、发布、提交或推送 Git。
- 本地通过不等于真实 Gmail/Outlook/Apple Mail 收件箱验证；正式导出前仍需把本地图片转为公开 HTTPS URL。

## Follow-up polish

P3：375px 按原稿等比缩小，因而小屏文字会偏精致。若后续需要更大的移动端字号，应作为单独变体确认，不在本轮擅自改变高还原布局。

final result: passed

---

# 四宫格详情折扣（标题款）设计 QA（2026-08-31）

## 对比目标与状态

- Source visual truth：`/Users/ww/Downloads/劳动节头图/样式XXVII.png`，1200×2114px；按 2× 设计密度归一化为 600×1057px。
- Implementation：Campaign Editor `http://127.0.0.1:4173` 中的 `collection.saleGrid4DetailWithTitle`；默认状态使用四个指定商品的当前首图、完整名称、折扣价、划线原价和有效折扣标签。
- 600px 实现截图：`audit/sale-grid4-detail-with-title/implementation-600.png`，600×1094px；原始浏览器为 devicePixelRatio 2，截图按实测 DOM 边界做 2× 密度归一化。
- 375px 实现截图：`audit/sale-grid4-detail-with-title/implementation-375.png`，375×825px；来自编辑器真实 375px iframe，并按浏览器截图密度归一化。
- 全图并排证据：`audit/sale-grid4-detail-with-title/comparison-600-side-by-side.png`，左侧参考稿、右侧实现，均以 600px 逻辑宽度对齐。

## Full-view comparison evidence

并排图确认了标题/说明、两列两行正方形商品图、左上折扣标、双行商品名、价格行和全列 CTA 的结构、节奏与配色。桌面实测组件 600×1093 CSS px，四张主图均为 247×247px，CTA 均为 247×38px；参考稿归一化高度为 1057px。实现多出的约 36px 来自保留 Shopify 完整商品名后的稳定双行文字区和底部留白，不改变图片比例或两列几何。

375px 下实测组件为 375×824.73 CSS px，四张主图均为 154.38×154.38px，CTA 为 154.38×36px；`clientWidth` 与 `scrollWidth` 均为 375px，无横向溢出，仍保持两列布局。

## Focused region comparison evidence

全图已能直接辨读顶部层级、四个折扣标、商品名、两组价格和四个 CTA，因此未另建局部裁图。DOM 聚焦核验显示恰有 8 个锚点：每格的整张图片区域与 CTA 各一个；商品名、折扣标签、折扣价和划线原价均没有独立锚点。全部 8 个链接均保留 `utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。

## Findings

- 无可执行 P0/P1/P2 问题。
- [P3] 参考稿左下标签为 `SAVE 50%`，当前 Shopify 商品数据计算为 `SAVE 40%`；按用户要求以对应链接的当前商品信息为准，没有为了像素一致而保留过期折扣。
- [P3] 商品名称字段保存 Shopify 完整名称，但邮件安全模板将其约束在固定双行高度；不同邮箱的字体度量可能造成末尾截断位置略有差异。

## Required fidelity surfaces

- Fonts and typography：标题、说明、商品名、价格、折扣标和 CTA 使用 Montserrat/Arial/Helvetica 邮件安全降级栈；层级、字重和颜色与参考方向一致。
- Spacing and layout rhythm：600px 内容区 519px，两列 247px、中间 25px；375px 同比例收缩且无横向滚动。
- Colors and visual tokens：米白背景、深色标题/价格、灰褐说明/原价、暗红折扣标和 CTA 均来自组件独立 settings。
- Image quality and asset fidelity：四张图使用 Shopify 当前公开 HTTPS 首图，正方形 `cover` 展示，没有占位图或本地正式资源依赖。
- Copy and behavior：顶部文案和 `SHOP NOW` 保留参考稿；逐格导入更新图片、Alt、完整名称、链接、价格和折扣，但不改 CTA 文案或其他三格。

## Verification history

- 本组件专属最终断言：7/7 通过，覆盖注册/默认值/链接边界、单卡导入、商品抓取和编辑器导入路由；并行组件导致的无关断言已通过名称过滤隔离。
- 组件契约校验：39 个注册组件与 39 个编辑器组件一致，状态 `valid`（校验时工作区另一个并行组件已完成登记）。
- Shopify 只读实查已返回 Marisol 的首图、完整名称、`$46.99`、`$93.98` 和 `SAVE 50%`；无 Shopify 或 Omnisend 写入。
- 直接组件预览控制台无 error/warn。完整仓库套件另有两个与本组件无关的并行工作断言未同步：`gift.doubleGiftAddressShowcase` 已加入注册表，但组件指南和既有分组期望仍未更新；本轮未越界修改该组件。

final result: passed


## 三图推荐（CTA+标题）副标题至主图间距更新（2026-08-28）

- 按用户在标注图中圈定的区域，仅将副标题后的独立表格间隔由9px增至25px；标题、副标题文字、主图尺寸、折扣、链接、UTM、双图与CTA均未改动。
- 渲染产物`活动商品组件/三图推荐（CTA+标题）/效果演示.html`已包含`height="25"`的邮件安全间隔行；375px下按`min(25px,4.166667vw)`缩放，避免新增横向溢出。
- 聚焦回归2/2通过；组件契约校验有效（28/28）；`git diff --check`通过。

final result: passed


## 三图推荐（CTA+标题）设计 QA（2026-08-28）

### 对比目标与实现

- 参考稿：`/Users/ww/Downloads/产品块 3/多类推荐V.png`；组件：`活动商品组件/三图推荐（CTA+标题）`，注册键为`collection.romanShadeMultiRecommendation`。
- 版面采用600px邮件画布：标题/副标题、536×595主图、两个256×256副图（20px间距）以及536px宽的独立CTA。内容使用表现型表格、内联样式及Outlook VML链接，桌面与移动端均由同一份组件模板渲染。
- 主图、左下图、右下图均使用用户提供的Omnisend HTTPS源图；默认折扣按用户更新为`SAVE 33%`、`SAVE 35%`、`SAVE 50%`，不是参考稿中的50%/50%/45%。四个商品跳转和CTA均带`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。

### 实测证据

- 600px：组件外框`600×1166.98px`；主图`536×595px`；双图区域`532×256px`；CTA`536×70px`。参考与实现并排页、原始稿和渲染稿位于`audit/roman-shade-multi-recommendation/`。
- 375px：编辑器预览组件`clientWidth/scrollWidth`均为`375px`，无横向溢出；CTA为`331×44px`。实际DOM核对四个商品链接及CTA均为指定带UTM地址，组件页和编辑器控制台均无error/warn。
- 本轮先以30px CTA字级重现，375px下按钮高度达92px，与参考稿不符；已将其修正为桌面18px、移动端`min(18px, 4.8vw)`并禁止换行，最终移动端CTA恢复44px高。

### 保留边界

- [P3] 用户提供的右下源图为192×192px，显示尺寸为256px，无法在该单一源图下达到Retina像素密度；未替换或伪造该图。
- [P3] 字体抗锯齿及实际邮箱客户端的图片压缩会有轻微差异。完成的是本地浏览器与编辑器验收；未上传、发送、排期或发布Omnisend内容，仍需真实收件箱覆盖Gmail、Apple Mail和Outlook。

### 回归与完整性

- 聚焦测试`tests/roman-shade-multi-recommendation.test.mjs`：2/2通过。
- 契约校验：`valid`，28个注册组件/28个编辑器组件；`git diff --check`通过。
- 全量套件在受限沙箱中有17项编辑器服务用例因`listen EPERM 127.0.0.1`未能绑定本地端口而失败，非组件断言失败；将在允许本地监听的环境中再次执行后更新该条结论。
- 已在允许本地回环监听的环境重跑全量套件：185/185通过，0失败、0跳过；该结果取代上一条受限沙箱的端口绑定快照。

final result: passed

---

# 场景文字叠层头图设计 QA（2026-08-27）

## 对比目标

- Source visual truth: `/Users/ww/Downloads/头图/测量II.png`，860×1114px。
- Source background asset: `/Users/ww/Downloads/蒙版.png`，1106×1114px；组件使用居中裁切后的 `头图/场景文字叠层头图/assets/default-measurement-service.png`，860×1114px。
- Logo asset: `头图/场景文字叠层头图/assets/default-logo-white.png`，用户指定白色 FreShine 标识的副本。
- Implementation: Campaign Editor `http://127.0.0.1:4173` 中添加 `hero.sceneOverlayCta` 后的实时 iframe 预览。
- Desktop implementation screenshot: `/private/tmp/scene-overlay-editor-desktop.png`；编辑器内组件实际边界为 600×778 CSS px。
- Mobile implementation screenshot: `/private/tmp/scene-overlay-editor-mobile.png`；编辑器内组件实际边界为 375×486.25 CSS px。
- State: 默认演示文案为“一对一测量服务”，但标题、说明、CTA 文案/链接、背景图、文字色与 CTA 色均由组件字段配置，不将演示文案作为组件名称或固定内容。

## 浏览器证据与全图比较

在 Codex Desktop in-app Browser 中，已从“头图”结构选择“场景文字叠层头图”并添加到空草稿。实时预览加载了裁切后的真实场景图与真实白色 Logo；iframe 展开内容包含两行标题、两行说明及 CTA 链接，未出现占位资源或未解析 token。

600px 下，背景内容区实测为 600×778px，与参考图 860×1114px 的纵横比一致（约 0.771）。Logo 保持白色圆形描边和居中字标；标题、说明与 CTA 均位于人物/沙发上方的暗部安全区。初次截图发现 CTA 纵向位置过低，随后将底部留白改为显式表格行并再次刷新编辑器：复核后的标题首行起点为 474px、说明首行 599px、CTA 起点 663px，与参考稿约 474px、约 596px、约 661px 的归一化位置一致。

375px 下，根内容区实测为 375×486.25px，`scrollWidth` 与 `clientWidth` 均为 375px；标题为 29.375px/33.75px，说明为 11.25px/16.875px，CTA 为 201.25×32.5px。文本未截断、未产生横向滚动，场景裁切、元素顺序和视觉层级保持一致。

## 必查面

- Fonts and typography：主标题使用 Lora/Georgia 衬线栈，桌面 47px/54px；说明与 CTA 使用 Montserrat/Arial 无衬线栈，桌面分别为 18px/27px 和 18px/52px。两种宽度均保持两行信息层级。
- Spacing and layout rhythm：桌面 Logo 顶部留白为 75px，标题、说明与 CTA 的复核锚点分别为 474px、599px、663px；无额外卡片、圆角面板、阴影或装饰性 CSS 元素。
- Colors and tokens：默认文字为 `#FFFFFF`，CTA 为 `#A71919`，均来自可配置 settings；白字在经原图暗部覆盖的文字区域可读。
- Image quality and asset fidelity：背景为用户提供原图的同源居中竖向裁切，未拉伸；Logo 为指定真实 PNG，未以字体、SVG 或 CSS 图形替代。
- Copy and content：编辑器中可编辑“主标题第一/二行”“活动说明第一/二行”“主按钮文字/链接”和背景图/说明；自动化渲染测试另外覆盖自定义文案、链接、文字色与 CTA 色。
- Accessibility and behavior：背景图保留可编辑的替代说明；CTA 为真实 HTTPS 链接；375px 不溢出。真实 Omnisend 导入以及 Gmail、Outlook、Apple Mail 的收件箱渲染仍属于上线前平台验证范围。

## Findings

- 无可执行 P0/P1/P2/P3 问题。
- 已修复：初版由于表格未分配的尾部空间被浏览器重新分摊，CTA 比参考稿低约 55px；现通过明确的 293px 主留白、17px/10px 内容间距和 63px 底部行锁定垂直节奏。

## 实施检查清单

- [x] 组件目录、注册表、索引、编辑器字段与交互说明同步。
- [x] 编辑器中实际选择、添加并确认可编辑字段。
- [x] 600px 实际 iframe 尺寸、图片、Logo、标题、说明和 CTA 布局复核。
- [x] 375px 实际 iframe 尺寸、字号、CTA 与横向溢出复核。
- [x] 自定义文案、链接、文字色和 CTA 色的构建测试。

final result: passed

# 倒计时头图2 参考稿细节修正 QA（2026-08-12）

## 对比目标

- Source visual truth: `/Users/ww/Downloads/头图_深色VXII 1.png`，430×952px。
- Implementation URL: `http://127.0.0.1:8765/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html`。
- Desktop screenshot: `/private/tmp/countdown-hero-2-detail-desktop-600.png`，600×1300px；CSS viewport 600×1300，device pixel ratio 1。
- Mobile screenshot: `/private/tmp/countdown-hero-2-detail-mobile-375.png`，375×1200px；CSS viewport 375×1200，device pixel ratio 1。
- State: 默认可编辑文案、1:1 默认主图、指定白色 Logo、默认组件颜色。

## Full-view comparison evidence

源稿、600px 实现和 375px 实现在同一次图像检查中对照。源稿显示图片与图下文案区是置于整体米白背景上的同宽内层卡片，而不是铺满整个画布。修正后的桌面卡片宽 540px，左右各保留 30px 背景；移动端卡片宽 337.5px，左右各保留 18.75px 背景。卡片底部在两种视口中都保留 30px 背景留白。

桌面主图为 540×540 CSS px，图下文案区同宽 540px；移动端主图为 337.5×337.5 CSS px，图下文案区同宽 337.5px。两种视口都无水平溢出。

## Focused region comparison evidence

图下文案区已进行聚焦检查：`ONLY 3 DAYS!` 的计算字体为 `Lora, Georgia, "Times New Roman", serif`；两条权益分隔线实际尺寸均为 1×22 CSS px，颜色为组件 `color.divider`。CTA 宽度相对卡片的比例、倒计时—权益—CTA—补充提示的排列顺序与源稿一致。

## Findings

- 无可执行 P0/P1/P2 问题。
- [P3] 白色 Logo 与源稿深色 Logo 不同，但这是用户此前明确指定的组件素材，本轮保持不变。
- [P3] 主图仍使用用户已确认的 1:1 比例；源稿中的图片区域略接近竖向比例，本轮以最新 1:1 规则为准。

## Required fidelity surfaces

- Fonts and typography: 倒计时标题使用 Lora；活动标题层级和 Montserrat 小文案保持既有设置，无截断。
- Spacing and layout rhythm: 90% 内层卡片准确形成左右背景留白；图片和文案区等宽，底部留白为 30px。
- Colors and visual tokens: 米白整体背景、浅灰褐文案卡和暗红 CTA 保持默认 settings 快照；分隔线使用 `color.divider`。
- Image quality and asset fidelity: 1200×1200 默认图按 1:1 无拉伸显示，人物与窗帘主体保持清晰。
- Copy and content: `ONLY 3 DAYS!`、三项权益、CTA 与补充提示完整显示；三项权益之间有两条可见竖线。

## Comparison history

- Earlier finding: 图片和图下文案区错误铺满 600px 画布，缺少源稿中的整体背景留白；权益分隔线在视觉上不明确。
- Fix: 将图片与图下文案区合并为宽度 90%、最大 540px 的内层卡片，增加左右和底部背景留白；倒计时标题明确使用 Lora；分隔线改为两条固定 1×22px 邮件安全表格线。
- Post-fix evidence: 桌面实测卡片 540px、左右留白各 30px、底部 30px；移动端卡片 337.5px、左右留白各 18.75px、底部 30px；两种视口均无溢出或控制台错误/警告。

final result: passed

# 倒计时头图2 1:1 图片更新 QA（历史记录，2026-08-12）

> 本节记录首次改为 1:1 时的全宽实现，已被“倒计时头图2 参考稿细节修正 QA”中的 90% 内层卡片实现取代。

## 对比目标

- Source visual truth: `/Users/ww/Downloads/头图_深色VXII 1.png`。
- Default derivative: `头图/倒计时头图2/assets/default-hero.jpg`，1200×1200px 居中方形裁图。
- Implementation URL: `http://127.0.0.1:8765/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html`。
- Desktop screenshot: `/private/tmp/countdown-hero-2-square-desktop-600.png`，600×1300px；CSS viewport 600×1300，组件实际 600×1070 CSS px。
- Mobile screenshot: `/private/tmp/countdown-hero-2-square-mobile-375.png`，375×1200px；CSS viewport 375×1200，组件实际 375×916 CSS px。

## 验收结果

- 桌面端主图实际为 600×600 CSS px，天然图片为 1200×1200px；主图和图下文案区都为 600px 宽。
- 移动端主图实际为 375×375 CSS px，图下文案区同为 375px 宽。
- 两种视口都无水平溢出，三项权益保持固定顺序的三栏结构。
- 桌面端和移动端均无控制台错误或警告；方形裁图未使用客户端 `object-fit`，没有拉伸。
- 人物、窗帘、左侧绿植和右侧绿植在 1:1 裁图中均保持可辨识，主体位于中央安全区。

## Findings

- 无可执行 P0/P1/P2 问题。
- [P3] 白色 Logo 在默认米白背景上的低对比度仍是已确认设计选择，本次比例修改未擅自改动。

## Comparison history

- Iteration 3: 按用户确认将主图契约从 600×470px 改为 1:1；桌面端改为 600×600px、移动端改为 375×375px，建议源图与确定性衍生图同步改为 1200×1200px。
- Iteration 4: 重新裁切默认图、生成演示页并完成 600px 与 375px 浏览器复查；组件总高度分别为 1070px 和 916px，无溢出或日志异常。

final result: passed

---

# 倒计时头图2 默认 Logo 配色更新（当前最终状态，2026-08-12）

## 对比证据

- 版式参考：`/Users/ww/Downloads/头图_深色VXII 1.png`，430×952px。
- 配色参考：`/var/folders/qb/gfhrch2s3n19l1hfdcyw2yd80000gn/T/codex-clipboard-22da35ea-09bd-454f-82bd-c7a30cc7d242.png`，650×240px。
- 默认 Logo 资产：`头图/倒计时头图2/assets/default-logo-brown.png`，1868×842px，透明背景。
- 桌面截图：`/private/tmp/countdown-hero-2-brown-logo-desktop-600.png`，CSS viewport 600×1300。
- 手机截图：`/private/tmp/countdown-hero-2-brown-logo-mobile-375.png`，CSS viewport 375×1200。

## 验收结果

- 从配色参考取用深棕色 `#652E17` 作为默认 FreShine 字标颜色；蓝色辅助线未进入最终资产。
- Logo 保持透明背景，直接置于组件整体背景 `#F3EFE8` 上；没有新增独立 Logo 色块。
- 600px 与 375px 下 Logo 都以 96px 宽居中显示，天然尺寸 1868×842px，图片加载完成。
- 1:1 主图和图下文案区保持等宽：桌面均为 540px，移动端均为 337.5px；90% 内层卡片、Lora 倒计时标题、三栏权益与两条分隔线均保持原有布局。
- 两种视口均无横向溢出、无框架错误覆盖层、无控制台错误或警告。

## Findings

- 无可执行 P0/P1/P2/P3 问题。
- 历史记录中的“白色 Logo 对比度较低”P3 已由本次默认深棕 Logo 更新解决。

final result: passed

---

# 倒计时头图2 补充文字字号更新（当前最终状态，2026-08-13）

## 验收范围

- Implementation URL: `http://127.0.0.1:8765/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html`。
- Desktop screenshot: `/private/tmp/countdown-hero-2-desktop-600.jpg`，CSS viewport 600×1200。
- Mobile screenshot: `/private/tmp/countdown-hero-2-mobile-375.jpg`，CSS viewport 375×1000。
- 本轮只放大导航栏和上下补充文案，不改变导航栏高度、三项权益字号、卡片比例或现有颜色。

## 验收结果

- 顶部促销文案与 `SIGN UP` 均为 14px / 20px；促销栏保持 52px 高。375px 下左侧长文案自然换成两行，仍完整位于栏内。
- 主标题下补充说明为 14px / 21px；底部 `Limited Time Offer` 为 14px / 20px。
- 三项权益保持 12px / 17px，固定三栏和两条分隔线未变，避免 375px 下继续放大造成拥挤。
- 图片与下方文字卡继续等宽：桌面均为 540px；移动端均为 337.5px。移动端图片仍为 337.5×337.5px 的 1:1 比例。
- 600px 与 375px 下均无横向溢出、无框架错误覆盖层、无控制台错误或警告。

## Findings

- 无可执行 P0/P1/P2/P3 问题。

final result: passed

---

# 双条文字评论组件设计 QA（2026-08-13）

## 对比目标与归一化

- Source visual truth: `/Users/ww/Downloads/评论 2/X.png`；固定星形资产真值：`/Users/ww/Downloads/矢量 31.png`。
- Implementation: `/Users/ww/Desktop/邮件营销运营/邮件html组件/评论组件/双条文字评论/效果演示.html`；HTTP URL：`http://127.0.0.1:4173/%E8%AF%84%E8%AE%BA%E7%BB%84%E4%BB%B6/%E5%8F%8C%E6%9D%A1%E6%96%87%E5%AD%97%E8%AF%84%E8%AE%BA/%E6%95%88%E6%9E%9C%E6%BC%94%E7%A4%BA.html`。
- Source pixels: 512×495；星形资产：512×472。参考图以其原始 512px 画布用于层级、留白、字形气质和色彩判断；实现以锁定的 600px 邮件画布验收，不将不同画布宽度误判为设计偏差。
- Desktop implementation screenshot: `/private/tmp/text-review-list-2-desktop-600.png`，600×900px，CSS viewport 600×900，devicePixelRatio 1；组件可见内容区域实测 600×491.672 CSS px。截图下方空白属于浏览器 viewport，不属于组件，比较时只判断顶部组件内容区域。
- Mobile implementation screenshot: `/private/tmp/text-review-list-2-mobile-375.png`，375×557px，CSS viewport 375×1000，devicePixelRatio 1；组件截取区域实测 375×557.672 CSS px。
- State: 默认 fixture 文案、默认 `#FDFCFB` 背景、用户提供的原始绿色星形 PNG；无交互控件。目标流为 HTTP 载入 → 600px 检查 → 切换 375px 并刷新 → 复核同一默认状态。

## 浏览器证据

- Codex Desktop in-app Browser 成功打开指定 HTTP URL，title 为 `Freshine Email Local Preview`，URL 未偏离；DOM snapshot 非空（548 字符）且含完整评分、两条评论与正文，无框架错误覆盖层。
- 600px：组件 600×491.672 CSS px；总星形 15（顶部 5、两条评论各 5）；顶部星形 17px、评论星形 13px；两条 1px 分割线；document/body `scrollWidth` 均为 600，无横向溢出。
- 375px：组件 375×557.672 CSS px；内容宽 327px，左右 padding 都为 24px；总星形仍为 15、两条分割线仍为 2；document/body `scrollWidth` 均为 375，无横向溢出。标题宽均为 327px，正文自然换行，无截断或横向滚动。
- 两个视口及刷新后的控制台 `error`/`warn` 检查均为空数组。没有可操作控件，因此以视口切换、刷新和相同默认状态的 DOM/布局复核作为交互证据。

## 全图及局部比较

同一图像比较输入中已打开源图、600px 实现截图和 375px 实现截图。全图确认居中总评分、评分文字、两条分割线、两条单列评论和底部留白保持参考图的信息层级与纵向节奏。600px 实现遵循本组件锁定的 600px 画布；375px 仅因自然换行增加高度，未改变顺序或隐藏内容。

局部比较聚焦于星形、作者/日期行、标题和正文：固定星形使用组件 `assets/review-star.png`（用户提供 PNG 的原样副本），顶部/评论星形尺寸与规格一致；作者和日期为次级无衬线文字，标题为 Lora/Georgia 衬线层级，正文为 Montserrat/Arial 无衬线层级。局部元素在全图中可清晰辨读，故不另建裁图。

## 必查面

- Fonts and typography：评分为 17px/23px Montserrat、作者日期为 14px/20px Montserrat、标题为 18px/25px Lora、正文为 15px/22px Montserrat；375px 下自然换行，无截断。
- Spacing and layout rhythm：顶部 48px、两侧 24px、评分与文字 10px、两条分割线和每条评论的 20px/12px 节奏均保留；无卡片、圆角、阴影或双栏偏移。
- Colors and tokens：背景为 `#FDFCFB`，主文字 `#252321`、次文字 `#89756F`、分割线 `#DEDAD6`；固定星形使用指定原始 PNG，未以 CSS/SVG/字符替代。
- Image quality and asset fidelity：所有 15 个装饰星形均为真实 PNG `img`，空 `alt`；无占位图、拉伸、链接、CTA 或非标准替代资产。
- Copy and content：默认评分、评论量、两位作者/日期、两条标题与两段正文均完整、与 fixture 一致；移动端内容未缩短或隐藏。

## Mismatch ledger 与迭代历史

- 无 P0/P1/P2。源图为 512px 参考画布而实现的锁定交付画布为 600px，此宽度差异已按内容区域与规格归一化，不是偏差。
- 无需修复组件 template/CSS，也未重新生成生产演示文件。一次浏览器 QA 迭代即通过；桌面截图保留 viewport 下方空白仅为截图承载方式，组件实测边界和全图比较均已单独记录。
- [P3] 无。Omnisend 实际导入、保存、桌面/移动预览以及 Gmail、Outlook、Apple Mail 测试邮件尚未执行，属于上线前外部验证，不影响本地浏览器 QA 结论。

## 实施检查清单

- [x] HTTP 页面身份、非空 DOM、无错误覆盖层和 console `error`/`warn`。
- [x] 600px 与约 375px 的真实浏览器截图和布局/溢出检查。
- [x] 同一图像比较输入中的源图、桌面实现和移动实现对照。
- [x] 15 星、两条分割线、单列层级、无 CTA/链接/裁切。
- [x] 完整回归、Campaign validator、语法和 diff 检查。

final result: passed

---

# 罗马帘专属折扣头图 QA — 2026-08-27

组件：`hero.romanShadeDiscount`。依据用户提供的 `罗马帘邮件素材/参考图.png`（1200×1522），用 image-to-code 的同画面对照流程验证600px邮件组件，而非重新设计。

- 实现：[效果演示](头图/罗马帘专属折扣头图/效果演示.html)。编辑器验收地址：`http://127.0.0.1:4174/`；原4173编辑器未重启。
- 完整证据和归一化说明：[验收记录](audit/roman-shade-discount/README.md)；同一图像输入对比源图、600px实现及375px实现：[对照图](audit/roman-shade-discount/comparison.png)。原始截图与编辑器截图在同目录。
- 截图工具本次呈现0.5倍可见栅格，已裁去工具产生的空白并将参考图同样降采样；不将截图栅格尺寸当作CSS尺寸。实际几何由浏览器DOM测量。
- 600px：组件600×761、面板432px、Logo103px、CTA309×55；宽屏1280px时组件x340，居中。375px：组件375×485.977、面板270px、Logo64.375px、CTA193.125×44；两种视口均无横向溢出。
- 字体：Montserrat，提示21px/500、两行折扣80px/600、说明19px/600、CTA16px/600；手机折扣50px、说明及CTA12px。首轮字面位置偏低与词间距偏窄已修正，主标题行高62px加16px间隔，再接94px折扣行。
- 间距：面板顶部127px、底部620px，圆形Logo跨边缘，提示框307×55，CTA顶部519px；保留原图全部场景留白。手机按钮保留44px高度，因此不是机械等比缩小。
- 色彩：原始像素采样主色#6B492C、白色面板70%不透明度、8px圆角；未添加阴影或其他版块。
- 素材：背景按x682精确裁1200×1522；Logo与装饰标签使用原始PNG，其SHA-256与用户素材一致；未以SVG、CSS图形或AI重绘替代。
- 文案与交互：完整保留参考图文案；实际在编辑器中将70% Off改为65% Off并恢复，预览同步。Logo独立指向首页，CTA保留用户指定集合页和三个UTM参数。console error/warn为空。
- 验证：180项回归通过，registry/editor 26/26契约一致，生成脚本语法与git diff空白检查通过。
- 未解决P0/P1/P2：无。P3：字体栅格化存在微小差异；不支持Web Font、rgba、渐变、圆角、背景图的邮件客户端会降级。未上传、发送或排期；未宣称Omnisend及真实收件箱像素一致。

final result: passed (local browser and editor only)


---

# 四宫格折扣推荐（标题款）设计 QA（2026-08-28）

本节仅验收 `collection.saleGrid4WithTitle`。以上其他组件记录保持原样。

## 对比目标与证据

- Source visual truth：用户提供 `/Users/ww/Downloads/产品块 4/样式XXVII.png`，1200×1866px，按2倍设计稿归一化到600×933px。
- 源图：`audit/sale-grid4-with-title/source-600.png`。
- 实现：`活动商品组件/四宫格折扣推荐（标题款）/效果演示.html`；本地预览端口4175，不占用已有4173编辑器。
- 最终600px截图：`audit/sale-grid4-with-title/implementation-600-final.jpg`；CSS viewport600×960，实际组件600×933，DOM DPR=1。
- 最终375px截图：`audit/sale-grid4-with-title/implementation-375-final.jpg`；CSS viewport375×700，组件375×619.75。
- 同状态全图对照：`audit/sale-grid4-with-title/comparison-600-final.png`，左为归一化原稿，右为实际浏览器截图；已共同打开检查。
- 文字局部对照：`audit/sale-grid4-with-title/comparison-type-final.png`。
- 编辑器证据：`editor-configuration.jpg`、`browser-verification.json`，均位于同一audit目录。
- 截图通道输出JPEG，存在压缩/抗锯齿差异；未根据JPEG色偏更改源稿实测色值。早期fullPage捕获发生密度异常，已排除该证据；最终使用正常viewport截图，未拉伸实现截图伪造尺寸。

## 视觉检查与迭代

1. 独立新增样式，不覆盖原四宫格；依照用户“原样设计”确认保留Montserrat主标题，不套用公共Lora样式。
2. 找到设计稿中四张对应的Freshine公开商品原图，保留商品顺序、50%/45%/50%/40%折扣文案与独立SHOP链接；不使用设计稿整图代替可编辑组件。
3. 默认四张方图做约1%–1.6%轻微放大取景，贴近原稿裁切。优化依据保存在`image-crop-fits.json`；替换图建议仍使用1:1素材。
4. 对照500和400字重：最终采用400；标题30px/45px、字距0.3px，说明18px/27px、字距0.2px，商品链接16px/22px，CTA18px。保留原稿的较细文字观感，未修改公共字体规范。
5. 最终全图对照确认：顶部留白、两行说明、两列图文、折扣标签右下圆角、直角照片、底部描边按钮及整体高度对应原稿。600px主图起始Y=190/491，尺寸246×246，列间约17px；内容宽510px。
6. 375px保留两列，图片153.75px；说明自然换行，按钮点击高度44px，document.scrollWidth等于375，无横向溢出。

## 编辑器与行为

- 已在实际编辑器添加新样式，展示24项内容字段、5项颜色设置、4个逐格商品导入按钮。
- 标题改为测试文本后，实际iframe预览同步；折扣底色改为#123456后四个标签同步，标题及CTA文案保持原值；测试后全部恢复默认。
- 600/375切换正常，375px预览iframe的clientWidth与scrollWidth均375；控制台error/warn为空。
- 4组图片/文字共用各自商品URL，底部CTA使用独立URL；实际DOM已检查全部9个链接。点击SHOP EMILIA已发出，但浏览器未暴露target=_blank外部页结果，未声称完成落地页导航验证。
- 逐格导入的单元测试确认只修改指定实例/商品，其他实例、其他卡片和颜色不受影响；新样式自动更新商品标题，缺失/空白/非字符串标题被拒绝，原文档不变。未执行真实Shopify后台导入。

## 回归与完整性

- 新增行为先运行红灯测试，再完成实现；新样式渲染、逐格导入和路由校验均通过。
- 契约校验：valid，27个注册组件/27个编辑器组件（本次验收时快照）。
- 完整套件执行：185项中183通过、2失败。两项失败来自本轮工作期间另行新增的`tests/roman-shade-multi-recommendation.test.mjs`，原因是另一个`collection.romanShadeMultiRecommendation`尚未注册；与本组件无关，未修改或删除该测试。
- 按名称明确排除上述另一个组件后，实际执行184项并全部通过（工作区同时继续新增测试，日志记录本次执行快照）；原始日志分别保存在`full-suite.log`与`component-and-existing-regression.log`。
- `git diff --check`通过；模板、Schema/defaults、演示、注册表、编辑器、说明及测试同步。保留工作区原有修改，不提交、不推送。

## 剩余边界

- [P3] 原稿中第一排右侧SHOP文字比左侧约高3px、第二排左图约右移1px；组件统一表格对齐，保持可替换文案的稳定布局。
- [P3] 不同渲染环境的字体抗锯齿及图片压缩存在轻微差异，不承诺逐像素一致。
- APPLY DISCOUNT实际优惠URL仍待用户提供。当前为明确标注的商品集合演示入口，不应用折扣；正式使用前必须替换。默认折扣文本是原稿展示值，不是实时价格承诺。
- 本地组件/浏览器视觉验收通过，不等于Omnisend或真实邮箱验收。邮件字体按Montserrat→Arial→Helvetica降级；提供VML背景，但Outlook裁切/字体、Gmail、Apple Mail仍需实际收件箱检查。未上传、发送、排期或发布任何远程内容。

未发现本组件本地视觉/编辑行为的未解决P0/P1/P2问题；以上配置前置条件和邮箱验证边界单独保留。

final result: passed


## 四宫格折扣推荐（标题款）后续内容更新：折扣与UTM（2026-08-28）

按用户明确要求，左上/右上/左下/右下折扣更新为30%/40%/35%/50%；全部商品主图、SHOP文字与底部CTA链接添加`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。同步默认数据与独立演示，包括4处Outlook VML链接；未修改样式、图片资源或其他文案。原视觉截图保留为初版验收历史。

浏览器实际DOM已核对4个标签及9个可见链接；源文件验证全部13个HTML/VML跳转地址，样式和图片资源与修改前完全相同。相关2项渲染/导入测试通过，契约校验valid（28个组件），git diff --check通过。本次为内容替换，不重复声称邮箱或活动折扣生效验证。

final result: passed


## 四宫格折扣推荐（标题款）文档与编辑器注册复核（2026-08-28）

已补齐组件管理说明、目录Skill、README和编辑器操作指南；`组件清单.json`与字段契约中均已有唯一的`collection.saleGrid4WithTitle`，未重复登记。新增文档明确选择路径、24项内容/5项颜色/4个逐格导入入口、最新默认折扣、Roman Shades CTA与UTM，以及旧草稿/模板快照不会自动更新的规则。

复核发现原4173服务缓存26个组件且不含本样式，4175服务缓存初版折扣和集合入口。为保护已有未保存草稿，均未关闭或重启；在空闲4180端口启动同一编辑器，加载完整的28个注册组件及最新默认值。

实际浏览器从“活动商品组件 → 四宫格折扣推荐（标题款）”添加成功：默认折扣为30%/40%/35%/50%；全部9个可见跳转链接带`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`；APPLY DISCOUNT指向用户已确认的`https://freshinelife.com/collections/roman-shades`。这取代前期报告中“底部链接待提供”的状态。600px和375px预览的scrollWidth分别等于600和375，控制台无error/warn。

完整回归本次为185/185通过，无跳过；契约valid，28个注册/编辑器组件，git diff --check通过。本次最新完整测试取代此前另一组件未注册时的失败快照；历史日志不改写。证据见`audit/sale-grid4-with-title/editor-registration-current.json`和`editor-registration-tests.log`。未修改组件外观、保存模板、上传、发送、排期、提交或推送。

final result: passed


## 四项权益整图（2026-08-28）

- 参考图：`/Users/ww/Downloads/产品块 5/免费测量IV.png`（1200×308px）；组件默认素材：`赠品与权益组件/四项权益整图/assets/default-benefits-strip-4.png`。两者SHA-256一致：`2327db10e67cbe2b32bfa1bd5485931814c6a504dc1fdf5bb0881996e54d5a41`。
- 同视图对照页：`audit/four-benefits-image-strip/reference-vs-preview-600px.html`。参考图和组件预览均为600×154px；图片像素、四项图标及文案均作为原始整图保留，组件不添加链接、热区或拆分字段。
- 浏览器实测：600px下组件与图片均为600px宽；375px下组件`width/scrollWidth`均375px，图片为375×96.25px，文档无横向溢出；控制台error/warn为空。
- [P3] 这是严格按原图等比缩放的整图组件，图片内部的小字号不会被拆成可编辑文本；真实Omnisend及Gmail、Apple Mail、Outlook仍需发送前的收件箱验收。
- 聚焦测试3/3、编辑器核心回归16/16、组件契约校验（29/29）与`git diff --check`均通过。

final result: passed


## 免费测量引导卡（2026-08-28）

- 参考图：`/Users/ww/Downloads/产品块 6/免费测量I.png`（1200×1148px）。顶部文案区与场景图区按原稿拆分；场景素材为从原图`y=316`开始的1200×832px精确裁切，存放于`赠品与权益组件/免费测量引导卡/assets/default-free-measurement-guidance-scene.png`。
- 同视图对照页：`audit/free-measurement-guidance-card/reference-vs-preview-600px.html`。原图归一化预览和组件预览均为600×574px；标题、说明和场景图的分界位置与原稿一致。
- 浏览器实测：600px下组件为600×574px，标题top=48px/height=38px，说明top=104px/height=27px，场景图为600×416px；375px下组件与文档`scrollWidth`均375px，场景图为375×260px，控制台error/warn为空。
- 标题、说明、场景图URL及替代文本可编辑；原稿没有CTA或跳转，组件未添加CTA、链接或热区。
- [P3] 不同浏览器和邮箱客户端的字体抗锯齿可能造成极轻微字形差异；真实Omnisend及Gmail、Apple Mail、Outlook仍需发送前的收件箱验收。
- 聚焦测试2/2、完整测试190/190、组件契约校验（30/30）与`git diff --check`均通过。

final result: passed


## 免费测量引导卡后续内容更新：场景图链接与UTM（2026-08-28）

- 按用户确认，`guide.image.clickUrl`作为独立可编辑字段加入内容Schema、默认配置、编辑器契约和组件管理说明。默认值为`https://freshinelife.com/pages/help-me-measure?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。
- 仅场景整图包裹邮件安全的`target="_blank"`链接；标题、副标题、图片尺寸、间距、背景和其他热区均未改变，未新增CTA。
- 浏览器实测：600px下链接、UTM、600×416px图片和600px画布正确；375px下文档及组件`scrollWidth`均375px、图片375×260px，控制台error/warn为空。
- 聚焦测试2/2、完整测试190/190、组件契约校验（30/30）与`git diff --check`均通过。未上传、发送、排期或发布远程内容。

final result: passed
# 双赠品展示卡验收记录

完整证据：[audit/double-gift-showcase/README.md](audit/double-gift-showcase/README.md)。本节截图文件均位于 `audit/double-gift-showcase/`；实现截图完整相对路径为 `audit/double-gift-showcase/implementation-600.jpg` 与 `audit/double-gift-showcase/implementation-375.jpg`。

日期：2026-08-28。Component Key：`gift.showcase2`。

## 用户确认范围

新增 `赠品与权益组件/双赠品展示卡/`，使用两张完整设计稿，眼罩在上、抱枕套在下，600px无缝拼接。图片、Alt独立可编辑；外部底色可配置。无顶部标题、活动规则、按钮、跳转链接或额外留白，不改变已有双赠品奖励卡。

## 素材完整性

| 参考源 | 组件素材 | 原始像素 | SHA-256 |
|---|---|---|---|
| `/Users/ww/Downloads/组合 224.png` | `赠品与权益组件/双赠品展示卡/assets/default-silk-eye-mask.png` | 1208×676 | `8aa2cc44147f17bf31a774e26baae07470461e5c83190bbdefa3c17fe8af4487` |
| `/Users/ww/Downloads/组合 223.png` | `赠品与权益组件/双赠品展示卡/assets/default-random-pillow-cover.png` | 1200×676 | `fdaeecd764bf4248287ab1e9932ae77c9d5ac6321e9b95ac24f40594395d1461` |

两张组件素材均逐字节等于用户原文件，不裁切、不生成、不重新压缩。组件不依赖 Downloads 路径。

## 浏览器与视觉证据

- 使用 Codex in-app Browser，在 `http://127.0.0.1:4189/` 启动独立编辑器；未重启或关闭已有服务。
- `implementation-600.jpg`：600×740截图；组件600×673.7578125，上图335.7578125高，下图338高，首图y=0、次图y=335.7578125，接缝0px。
- `implementation-375.jpg`：375×480截图；组件375×421.09375，上图209.84375高，下图211.25高，接缝0px。
- 两种宽度下document/组件scrollWidth均等于目标宽度，图片全部加载，链接数量为0。
- `comparison-600.html` / `comparison-600.jpg`：左侧两张原始素材按600px等比排布，右侧iframe实际加载生成的组件演示；二者同处1280×780截图中，已共同打开检查。
- `comparison-375.html` / `comparison-375.jpg`：同样的375px对照，840×510截图，已共同打开检查。
- 截图输出为JPEG，像素宽高对应CSS视口；首次600px DOM报告DPR=2，但工具输出600×740栅格，未据此把实现再次缩放。手机DOM报告DPR=1。视觉判断以同一浏览器截取的等大左右区域与DOM几何为准。
- 全图确认文字层级与换行、价格、FREE GIFTS徽章、照片取景、色彩与左右交错图文均一致。检查拼接处及徽章/价格的局部没有差异；全图已能清楚识别，不另建放大裁图。
- 设计稿原始宽度不同，分别等比缩放产生不同的行高，以及约2px的原稿中线差异，均按已确认的“不裁切、不拉伸”保留。

## 编辑器行为

- 在“赠品与权益组件 → 双赠品展示卡”实际添加组件；4项内容字段和1项外部底色字段可见。
- 上方Alt改为`Eye mask QA & comfort`后预览同步，下方Alt及图片地址不变；随后恢复默认。
- 通过本地文件选择器只将上方图片替换为抱枕图；上图自然尺寸更新为1200×676、引用转为运行期上传文件，下方仍引用默认素材。文件选择器响应较慢，但操作完成；未进行任何远程上传。
- 新建临时草稿并重新添加组件，恢复两张默认原图与原始Alt；无测试内容写回fixture或保存模板。
- 真实切换“移动375px”和“桌面600px”，分别测量375×421.09375和600×673.7578125。最终保留默认桌面预览。
- `editor-375.jpg` / `editor-600.jpg`为编辑器截图；`browser-verification.json`保存原始测量、独立编辑与替换结果、最终恢复状态。独立demo和editor的error/warn均为空。辅助对照页记录了一条MutationObserver.observe错误，换新标签页仍可见；组件及辅助对照HTML均无脚本，具体注入来源未确认，未观察到其影响图片加载、几何或同屏比较。此环境记录保留在JSON中，不宣称对照页控制台为空。

## 独立复核补充

- 独立只读代码复核未发现Critical/Important问题，指出零字号容器可能使图片加载失败时的Alt不可见。
- 为img自身增加Arial 14px/18px深色回退，测试先红再绿；实际未加载场景见`alt-fallback.html`与`alt-fallback.jpg`，两条完整Alt正常显示。该页面故意使用不存在的图片URL，其网络404是测试条件。
- 修复后重新测量：600×673.7578125、375×421.09375不变；最终桌面原稿与实现同屏对照已重新截图、打开，未出现视觉差异。

## 测试与边界

- 两项新增行为测试先因组件尚未注册而失败，再实现并转绿。一次测试输入误带编辑器实例元数据，已改为拼接器规定的五项实例字段，未放宽生产校验。
- 完整回归因本地端口沙箱限制初次未完成；获准使用本地端口后发现现有分类列表预期需加入新组件，同步后195/195通过，无跳过。日志：`full-suite.log`（按仓库规则忽略）。
- 契约校验valid，32个注册/编辑器组件；模板、Schema、默认快照、demo、注册、字段说明与文档同步。
- 编辑器契约、演示生成脚本及测试语法检查通过，`git diff --check`通过。已有双赠品奖励卡没有变更。
- 未提交、推送、发送、排期、发布、上传远程图片或创建Omnisend草稿。
- 纯整图形式使图片内文字不可选择/单独编辑，小屏会同比缩小；Alt包含等价文案。正式导出必须将两张图片解析为公开HTTPS素材。Omnisend及Gmail、Outlook、Apple Mail真实邮箱验证尚未执行。

未发现本组件的未解决P0/P1/P2视觉或编辑行为问题。

final result: passed


---

# 双赠品展示卡 · 图文与CTA版验收

日期：2026-08-28。Component Key：`gift.showcase2`。本记录补充而不覆盖旧整图版验收。

## Source visual truth 与范围

- 原稿：`/Users/ww/Downloads/赠品版块/上下I.png`，1200×1354px；副本 `audit/double-gift-showcase-cta/source.png`。
- SHA256：`e55ed5ab31754c220db8d59f68b98b911d5c40b3310c50c02edc2608649ea2b2`。
- 用户确认：拆为照片+可编辑文案+两个独立CTA，保留原交错结构。两条说明修正为满$699赠眼罩、满$999赠抱枕套；两CTA默认 `https://freshinelife.com/`。未把原图中矛盾的小字作为操作指令。
- 同一路径 `赠品与权益组件/双赠品展示卡/`，不改变 `gift.rewardGrid2`。旧两张完整PNG和旧验收记录保留。

## State、viewport与归一化

本次截图均为默认新fixture状态，文案已按用户确认修正。原稿按1/2缩至600×677px，按375/1200缩至375×423.125px；实现按CSS像素比较，不将DOM的DPR再乘入视觉尺寸。

| 证据（位于audit/double-gift-showcase-cta） | CSS viewport / 文件像素 | 组件尺寸 |
|---|---|---|
| `implementation-600.jpg` | 600×740 / 600×740，DPR1 | 600×677 |
| `implementation-375.jpg` | 375×480 / 375×480，DPR1 | 375×423.125 |
| `comparison-600-final.jpg` | 1280×800 / 1280×800；左右各600px | 原稿与实现均600×677 |
| `comparison-375.jpg` | 840×550 / 840×550；左右各375px | 原稿与实现均375×423.125 |

两张同屏对照图已实际打开：左边为原稿完整图像，右边为浏览器渲染组件iframe，使用相同宽度。首版桌面对照 `comparison-600-initial.jpg` 和最终对照均保留。截图底部空白为视口，不属于组件。

## Findings与细节比较

没有待修复的P0/P1/P2视觉问题。

- 照片：精确裁出参考图上左604×678、下右596×676区域，保留原照片与徽章。桌面分别302×339和298×338px，手机188.75×211.875和186.25×211.25px。上下接缝无间隙，无拉伸；三张素材正常加载。
- 字体：标题Lora 30/38/400；价值Montserrat18/24/500；卖点18/22/400；CTA14/18/500；规则12/15/400。上方标题单行、下方标题两行；居中结构、字体层级及段落间隔符合参考。浏览器抗锯齿与原稿仍有轻微笔画差异，不声称逐像素一致。
- 色彩：从原稿采样底色#F5F1ED、文字#1F1F1F、红色#8D1B1B、规则#7C706A；按钮文字/图标白色。徽章属于照片，不随样式字段变色。
- CTA：购物袋为原稿提取透明PNG；桌面两按钮均221×39px，手机138.125×24.375px；位置和间距匹配。没有为照片增加链接或隐藏点击区。
- 说明文字与源图不同是用户明确批准的修正，非还原遗漏。主结构、照片、价值与CTA门槛不变。
- 不需要另建局部放大图：600px同屏对照中两件赠品、标题、CTA、说明和接缝均完整可辨，并用DOM坐标/字号/尺寸核验。375px另行同屏复查。

## Primary interactions与测试

- 实际新编辑器4190中选择“赠品与权益组件 → 双赠品展示卡 · eye-mask-first-cta”添加成功；16项内容和4项颜色字段可见，图标和字体为隐藏快照字段。
- 实际将上方名称改为 `Silk Eye Mask TEST`、上方URL改为 `https://freshinelife.com/?gift=eye-mask`、下方CTA文字改为 `VIEW PILLOW`：各自变化正确，另一件赠品对应字段不受影响。随后恢复默认值并重新添加干净实例供交付。
- 编辑器切换600/375后，组件宽度/scrollWidth分别600/600和375/375，高度677和423.125。独立演示结果相同，无横向溢出。
- 两个链接均在实际DOM中验证为首页HTTPS地址，真实点击操作均完成。浏览器会话未暴露target=_blank的新页面，因此不声称已验证首页最终加载；本组件的链接目标和独立替换已验证。
- 先红后绿扩展现有2条showcase测试，覆盖16字段、独立链接/文案/图片、文本及Alt转义、无照片链接、不安全CTA URL拒绝、旧奖励卡不受影响。
- 全量 `node --test tests/*.test.mjs`：195/195通过；注册/编辑器契约检查：32/32有效；相关脚本语法检查及 `git diff --check` 通过。未新增独立测试文件。
- 只读代码审查确认新建实例的内容、样式与素材契约一致。旧runtime快照缺少新必填字段/素材键，需重新添加或显式迁移；本轮不静默改写旧草稿，管理说明及交付提示已说明。

## 日志、截图与外部验证边界

- 独立600/375演示、编辑器的error/warn日志均为空，原始记录在 `browser-verification.json`。
- 两个辅助iframe对照页出现 `MutationObserver.observe` 参数非Node错误；辅助HTML和组件均没有脚本，具体注入来源未确认。该记录保留在JSON中，未观察到对加载、尺寸或对照截图的影响；不宣称辅助页无日志异常。
- 编辑器截图工具对iframe有空白/拼接异常，`editor-375.jpg`、`editor-600.jpg`只保留为截图诊断，不作为视觉通过依据。编辑器交互与尺寸依据实际DOM；视觉结论来自正常的独立演示及同屏对照截图。
- 本地链接/构建/预览不等于Omnisend或真实Gmail、Outlook、Apple Mail收件箱验证。正式邮件须将两张照片和图标解析为公开HTTPS URL；字体可能回退；不支持min()的客户端保留桌面值，需要单独邮件验证。
- 本轮未上传图片、写入远端草稿、发送、排期、发布、提交或推送。

## Implementation checklist 与比较历史

1. [x] 测量原稿、照片边界、颜色、字体和600px比例；确认矛盾说明。
2. [x] 回归测试先失败；实现照片+独立文案+双CTA，字段/默认值/编辑器/注册表同步。
3. [x] 首版600px同屏对照，再检查375px；无需要返工的P0/P1/P2视觉差异。
4. [x] 独立编辑、URL验证、完整回归、只读代码审查和600px最终同屏复查。
5. [x] 管理说明/README/交互指南更新，保留旧素材和旧记录；明确旧快照升级边界。

## Follow-up polish

P3：如果后续希望手机端文字更易读，可另行确认放大文字/按钮并增加行高，届时高度会偏离原稿等比布局。本轮优先忠实还原，未擅自修改。无需为轻微字体栅格差异继续调整结构。

final result: passed


---

# 场景对比评论卡设计 QA — 2026-08-28

## 对比目标与状态

- Source visual truth: `/Users/ww/Downloads/评论/VIII.jpg`，1200×1354px。
- Component: `review.sceneComparison`，`评论组件/场景对比评论卡`。
- Implementation: `http://127.0.0.1:8768/%E8%AF%84%E8%AE%BA%E7%BB%84%E4%BB%B6/%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%AF%94%E8%AF%84%E8%AE%BA%E5%8D%A1/%E6%95%88%E6%BC%94%E7%A4%BA.html`。
- State: 原稿默认图片与文案、原稿配色、指定 Marisol 商品 CTA 和 cover-rc UTM；未执行远端上传。
- CSS viewport: 桌面 600×750，移动 375×520；devicePixelRatio=1。
- 归一化：原图缩小为 600×677 与 375×423；浏览器截图分别为 600×750 和 375×520，比较时仅截取组件区域。实际移动 CSS 高度为 423.125px，比较图取整数 423px。
- Final screenshots: `audit/scene-comparison-review/preview-600-final.png`、`audit/scene-comparison-review/preview-375-final.png`。
- Full-view comparison evidence: 同图左右比较 `audit/scene-comparison-review/comparison-600-final.png`、`audit/scene-comparison-review/comparison-375-final.png`，均已打开检查。
- Focused evidence: `audit/scene-comparison-review/focus-review-header.png`、`audit/scene-comparison-review/focus-product-details.png`，已打开检查姓名、五星、属性换行和 CTA。
- Geometry evidence: `audit/scene-comparison-review/desktop-metrics.json`、`audit/scene-comparison-review/mobile-metrics.json`。

## Findings 与比较历史

1. v1 [P2，已修正] 衬里第一行错误包含 Rate，第二行只剩 50%。将属性文本两侧留白由 10px 增至 17px，内容区变为 252px，恢复原稿的 White_Shading / Rate 50% 两行；600px / 375px v2 截图已复查。
2. v2 [P2，已修正] 移动端 CTA 的 table cell 默认文字基线使其下移约 6px。为 CTA 单元格明确 font-size:0/line-height:0，并将链接 vertical-align:top；先添加失败回归断言，再修复并验证。最终 CTA 顶部桌面 591px、移动 369.375px，严格按 0.625 缩放。
3. 最终比较未发现待处理 P0/P1/P2 差异。[P3] 浏览器对字体及缩小位图的抗锯齿与原稿不同，姓名/标题略显厚、五星边缘稍软；原始 PNG 像素裁切未被替换或重绘。

## 五项视觉检查

- 字体：Montserrat 正文 16px/400/24px；姓名、商品名、CTA 为 18px/600/24px。移动分别缩为 10px/15px、11.25px/15px，保留所有文字和原稿换行节奏。邮件客户端不支持字体时回退 Arial/Helvetica；未声明收件箱像素一致。
- 间距布局：600×677；两列各 300px，上排 338px、下排 339px；移动 375×423.125，scrollWidth=clientWidth=375。图片无拉伸，CTA 限定左下链接。
- 配色：直接采样得到 #F5F2ED 与 #1F1F1F；三个局部颜色设置不会泄漏到其他组件。头像/五星有原稿底色，已在编辑器说明换色时需同步替换素材。
- 图像：两张场景、头像与五星均为原稿确定性裁切，四张图片实际加载成功；裁切坐标、SHA-256 见 asset-measurements.json。
- 文案：姓名、完整评论、商品名称、四条属性、CTA 原样保留；链接参数准确。无额外虚构评论或优惠。

## 交互与导出检查

- 在真实本地编辑器选择「评论组件 → 场景对比评论卡」并添加成功；17 个内容字段、3 个颜色设置和4个本地图片替换控件可见。
- 修改 CTA 为 View This Look >> 后预览链接文案更新，目标 URL 保持；完成后恢复 Shop The Look >>。
- 切换编辑器 600px / 375px 预览，图像与文案显示正常；独立预览量测上述宽高。
- 仅一个真实 anchor，DOM 中已核对精确 Marisol URL 及 utm_source=omnisend、utm_medium=email、utm_id=cover-rc。未向商品页面发送测试跳转。
- 回归测试验证4个本地素材可由 buildLocalAssetMap 解析、preview/defer 构建成功；模拟已有导出器替换为 HTTPS 后，所有文案转义、CTA 和邮件安全结构符合要求。模拟输出不是已上传素材。
- 浏览器 preview/editor error 日志均为空。
- 未进行真实 Omnisend 上传、草稿保存、发送、排期或收件箱测试；未提交或推送 Git。

## 测试结果与独立问题

- 聚焦回归：1/1 通过，包含编辑器选择、本地素材、两种构建模式、HTTPS 替换、文案转义、独立链接与移动基线约束。
- 组件契约：33/33，status=valid。
- 完整测试：195/196 通过。唯一失败为已有 gift.showcase2 文档中的“旧版完整快照”触发 retiredTerms 正则，位于 references/component-interactions.zh-CN.md；与本次新增区块无关，原有内容已保留。
- git diff --check 通过。

## Implementation Checklist

- [x] 原稿素材、模板、Schema、默认值、演示、编辑器契约、索引与说明同步。
- [x] 原图与桌面/移动终稿同图对比，P2 问题已修复并复查。
- [x] 测试边界和字体/收件箱差异说明完整。
- [ ] 用户在编辑器最终确认后执行原有 Omnisend 导出/上传脚本。

final result: passed
