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
