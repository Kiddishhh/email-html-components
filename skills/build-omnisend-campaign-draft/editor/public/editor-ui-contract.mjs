const structureOrder = ['头图', '导航组件', '活动商品组件', '通用图片组件', '评论组件', '小样-产品', '赠品与权益组件', '地址组件', '页脚组件'];

const editableByComponent = {
  'hero.promotionalOverlay': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle', 'hero.cta.text', 'hero.cta.url', 'promotion.text', 'promotion.linkText', 'promotion.url', 'hero.logo.url', 'hero.logo.alt', 'hero.logo.clickUrl'],
    settings: ['navigation.visible', 'color.theme', 'color.heroFallback', 'color.logoBadge', 'color.logoBadgeTransparent']
  },
  'hero.countdownOverlay': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'countdown.title', 'hero.subtitle', 'hero.cta.text', 'hero.cta.url', 'navigation.text', 'navigation.linkText', 'navigation.url', 'brand.logo.url', 'brand.logo.alt', 'brand.clickUrl', 'decoration.dividerImage.url', 'decoration.dividerImage.alt'],
    settings: ['navigation.visible', 'color.theme', 'color.navigationLeft', 'color.navigationRight']
  },
  'hero.countdownOverlay2': {
    content: ['hero.image.url', 'hero.image.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle', 'urgency.title', 'benefit.1.text', 'benefit.2.text', 'benefit.3.text', 'hero.cta.text', 'hero.cta.url', 'urgency.note', 'promotion.text', 'promotion.linkText', 'promotion.url'],
    settings: ['navigation.visible', 'color.theme', 'color.surface', 'color.offerSurface', 'color.promotionLeft', 'color.promotionRight']
  },
  'hero.lateSummerSale': {
    content: ['promotion.text', 'promotion.linkText', 'promotion.url', 'brand.logo.url', 'brand.logo.alt', 'brand.logo.clickUrl', 'hero.eyebrow', 'hero.title', 'hero.subtitle', 'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl', 'hero.cta.text', 'hero.cta.url'],
    settings: ['navigation.visible', 'color.surface', 'color.promotionLeft', 'color.promotionRight', 'color.heading', 'color.body', 'color.action']
  },
  'navigation.promotionCta': {
    content: ['promotion.title', 'promotion.divider.url', 'promotion.divider.alt', 'promotion.offer', 'promotion.body', 'promotion.cta.text', 'promotion.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'collection.saleGrid6': {
    content: ['saleCollection.title', 'saleCollection.body', 'saleCollection.cta.text', 'saleCollection.cta.url'],
    settings: ['color.theme', 'color.surface']
  },
  'collection.saleGrid4': {
    content: [
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl'
    ],
    settings: ['color.theme', 'color.surface']
  },
  'collection.saleGrid6WithTitle': {
    content: [
      'saleCollection.title', 'saleCollection.body',
      'saleItems[0].name', 'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl',
      'saleItems[1].name', 'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl',
      'saleItems[2].name', 'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl',
      'saleItems[3].name', 'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl',
      'saleItems[4].name', 'saleItems[4].discountLabel', 'saleItems[4].image.url', 'saleItems[4].image.alt', 'saleItems[4].image.clickUrl',
      'saleItems[5].name', 'saleItems[5].discountLabel', 'saleItems[5].image.url', 'saleItems[5].image.alt', 'saleItems[5].image.clickUrl',
      'saleCollection.cta.text', 'saleCollection.cta.url'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.theme', 'color.badgeText', 'color.buttonText']
  },
  'collection.curtainInspirationGrid4': {
    content: [
      'promotion.title', 'promotion.subtitle',
      'grid.image1.url', 'grid.image1.alt', 'grid.image1.clickUrl', 'grid.image1.caption',
      'grid.image2.url', 'grid.image2.alt', 'grid.image2.clickUrl', 'grid.image2.caption',
      'grid.image3.url', 'grid.image3.alt', 'grid.image3.clickUrl', 'grid.image3.caption',
      'grid.image4.url', 'grid.image4.alt', 'grid.image4.clickUrl', 'grid.image4.caption'
    ],
    settings: ['grid.showCaptions', 'color.surface']
  },
  'collection.curtainEditorialTriptych': {
    content: ['hero.image.url', 'hero.image.alt', 'hero.image.clickUrl', 'pair.left.url', 'pair.left.alt', 'pair.left.clickUrl', 'pair.left.caption', 'pair.right.url', 'pair.right.alt', 'pair.right.clickUrl', 'pair.right.caption', 'intro.title', 'intro.subtitle'],
    settings: ['color.surface']
  },
  'collection.curtainPromotionCard': {
    content: ['promotion.title', 'promotion.subtitle', 'product.badge', 'product.image.url', 'product.image.alt', 'product.image.clickUrl', 'product.title', 'product.description', 'product.cta.text', 'product.cta.url'],
    settings: ['color.surface', 'color.badge']
  },
  'collection.curtainPromotionCardNoTitle': {
    content: ['product.badge', 'product.image.url', 'product.image.alt', 'product.image.clickUrl', 'product.title', 'product.description', 'product.cta.text', 'product.cta.url'],
    settings: ['color.surface', 'color.badge']
  },
  'image.clickableFullWidth': {
    content: ['image.url', 'image.alt', 'image.linkUrl'],
    settings: ['color.surface']
  },
  'gift.rewardGrid2': {
    content: [
      'reward.title',
      'reward.rules[0]',
      'reward.rules[1]',
      'reward.items[0].image.url',
      'reward.items[0].image.alt',
      'reward.items[1].image.url',
      'reward.items[1].image.alt'
    ],
    settings: ['color.surface']
  },
  'location.showroomCard': { content: [], settings: ['color.surface'] },
  'footer.warm': { content: [], settings: ['color.background', 'color.text', 'color.link'] },
  'footer.doubleDivider': { content: [], settings: ['color.canvas', 'color.background', 'color.text', 'color.link'] },
  'image.benefitsStrip3': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'tool.measurementCard': {
    content: ['measurement.image.url', 'measurement.image.alt', 'measurement.title', 'measurement.subtitle', 'measurement.cta.label', 'measurement.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'review.textList2': { content: [], settings: [] },
  'product.sampleProductRecommendationLeft': {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.fabric.url', 'product.images.fabric.alt', 'product.title', 'product.subtitle', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text']
  },
  'product.sampleProductRecommendationRight': {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.fabric.url', 'product.images.fabric.alt', 'product.title', 'product.subtitle', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text']
  },
  'product.curtainRecommendationOverlay': {
    content: ['intro.title', 'intro.subtitle', 'product.images.scene.url', 'product.images.scene.alt', 'product.images.detail.url', 'product.images.detail.alt', 'product.name', 'product.color.label', 'product.color.value', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'product.curtainRecommendationNoTitle': {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.detail.url', 'product.images.detail.alt', 'product.name', 'product.color.label', 'product.color.value', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'product.sampleStyle1': {
    content: ['product.mainImage.url', 'product.mainImage.alt', 'product.detailImage.url', 'product.detailImage.alt', 'product.title', 'product.subtitle', 'product.cta.text', 'product.cta.url'],
    settings: ['color.surface', 'color.title', 'color.subtitle', 'color.action', 'color.detailFrame', 'color.detailBorder', 'color.detailShadow']
  }
};

const copyByField = {
  'hero.backgroundImage.url': ['主视觉背景图', '替换首图背景图片；填写公开 HTTPS 图片地址。'],
  'hero.backgroundImage.alt': ['背景图说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'hero.image.url': ['主图链接', '替换首图主视觉图片；填写公开 HTTPS 图片地址。'],
  'hero.image.alt': ['主图说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'hero.image.clickUrl': ['主图点击链接', '点击主图后打开的活动页面地址。'],
  'hero.eyebrow': ['活动名称', '显示在主标题上方的活动名称。'],
  'hero.title': ['活动主标题', '显示折扣或活动核心信息的主标题。'],
  'hero.subtitle': ['活动补充说明', '显示在主标题下方的补充文案。'],
  'hero.cta.text': ['主按钮文字', '用户点击进入活动页的按钮文案。'],
  'hero.cta.url': ['主按钮链接', '主按钮点击后打开的活动页面地址。'],
  'promotion.text': ['顶部促销文案', '显示在邮件顶部促销栏的文字。'],
  'promotion.linkText': ['顶部链接文字', '顶部促销栏右侧链接的显示文字。'],
  'promotion.url': ['顶部促销链接', '点击顶部促销栏时打开的页面地址。'],
  'hero.logo.url': ['品牌 Logo 链接', '替换首图中使用的品牌 Logo 图片地址。'],
  'hero.logo.alt': ['品牌 Logo 说明', 'Logo 无法显示时使用的品牌名称说明。'],
  'hero.logo.clickUrl': ['品牌 Logo 链接', '点击 Logo 后打开的页面地址。'],
  'countdown.title': ['倒计时标题', '显示在首图中央的倒计时提示文案。'],
  'navigation.text': ['左侧导航文案', '显示在顶部导航左侧的促销文字。'],
  'navigation.linkText': ['右侧导航文字', '显示在顶部导航右侧的链接文字。'],
  'navigation.url': ['导航链接', '点击顶部导航时打开的页面地址。'],
  'brand.logo.url': ['品牌 Logo 链接', '替换倒计时首图中的品牌 Logo 图片地址。'],
  'brand.logo.alt': ['品牌 Logo 说明', 'Logo 无法显示时使用的品牌名称说明。'],
  'brand.logo.clickUrl': ['品牌 Logo 点击链接', '点击顶部品牌 Logo 后打开的页面地址。'],
  'brand.clickUrl': ['品牌 Logo 链接', '点击 Logo 后打开的页面地址。'],
  'decoration.dividerImage.url': ['装饰分隔图链接', '替换标题下方的装饰性分隔图片地址。'],
  'decoration.dividerImage.alt': ['装饰分隔图说明', '分隔图无法显示时使用的简短说明。'],
  'urgency.title': ['紧迫提示标题', '显示在主图下方的限时提示文案。'],
  'urgency.note': ['限时补充说明', '显示在 CTA 下方的简短限时提示。'],
  'benefit.1.text': ['权益一文案', '显示在倒计时下方第一项权益说明。'],
  'benefit.2.text': ['权益二文案', '显示在倒计时下方第二项权益说明。'],
  'benefit.3.text': ['权益三文案', '显示在倒计时下方第三项权益说明。'],
  'saleCollection.title': ['商品区标题', '显示在六宫格商品上方的标题。'],
  'saleCollection.body': ['商品区说明', '显示在六宫格标题下方的活动说明。'],
  'saleCollection.cta.text': ['商品区按钮文字', '六宫格下方引导用户查看活动的按钮文案。'],
  'saleCollection.cta.url': ['商品区按钮链接', '六宫格下方按钮点击后打开的活动页地址。'],
  'saleItems[0].discountLabel': ['商品 1 折扣标签', '显示在第 1 款商品主图左上角，可由该商品的 Shopify URL 覆盖。'],
  'saleItems[1].discountLabel': ['商品 2 折扣标签', '显示在第 2 款商品主图左上角，可由该商品的 Shopify URL 覆盖。'],
  'saleItems[2].discountLabel': ['商品 3 折扣标签', '显示在第 3 款商品主图左上角，可由该商品的 Shopify URL 覆盖。'],
  'saleItems[3].discountLabel': ['商品 4 折扣标签', '显示在第 4 款商品主图左上角，可由该商品的 Shopify URL 覆盖。'],
  'saleItems[0].image.url': ['商品 1 主图', '填写公开 HTTPS 图片地址，或使用“导入商品 1”从 Shopify 填入。'],
  'saleItems[1].image.url': ['商品 2 主图', '填写公开 HTTPS 图片地址，或使用“导入商品 2”从 Shopify 填入。'],
  'saleItems[2].image.url': ['商品 3 主图', '填写公开 HTTPS 图片地址，或使用“导入商品 3”从 Shopify 填入。'],
  'saleItems[3].image.url': ['商品 4 主图', '填写公开 HTTPS 图片地址，或使用“导入商品 4”从 Shopify 填入。'],
  'saleItems[0].image.alt': ['商品 1 图片说明', '用于商品 1 主图的可访问性说明。'],
  'saleItems[1].image.alt': ['商品 2 图片说明', '用于商品 2 主图的可访问性说明。'],
  'saleItems[2].image.alt': ['商品 3 图片说明', '用于商品 3 主图的可访问性说明。'],
  'saleItems[3].image.alt': ['商品 4 图片说明', '用于商品 4 主图的可访问性说明。'],
  'saleItems[0].image.clickUrl': ['商品 1 跳转链接', '商品 1 的整张主图点击后打开此 HTTPS 地址。'],
  'saleItems[1].image.clickUrl': ['商品 2 跳转链接', '商品 2 的整张主图点击后打开此 HTTPS 地址。'],
  'saleItems[2].image.clickUrl': ['商品 3 跳转链接', '商品 3 的整张主图点击后打开此 HTTPS 地址。'],
  'saleItems[3].image.clickUrl': ['商品 4 跳转链接', '商品 4 的整张主图点击后打开此 HTTPS 地址。'],
  'promotion.title': ['顶部活动标题', '显示在商品主图上方的居中标题。'],
  'promotion.subtitle': ['顶部活动说明', '显示在顶部活动标题下方的居中说明。'],
  'promotion.divider.url': ['装饰分隔图链接', '替换活动名称下方的公开 HTTPS 分隔图片。'],
  'promotion.divider.alt': ['装饰分隔图说明', '分隔图无法显示时供读屏工具识别的简短说明。'],
  'promotion.offer': ['折扣主文案', '显示为大号加粗的活动核心折扣内容。'],
  'promotion.body': ['活动补充说明', '显示在折扣主文案下方的居中说明。'],
  'promotion.cta.text': ['活动 CTA 文字', '显示在促销 CTA 描边按钮内的文字。'],
  'promotion.cta.url': ['活动 CTA 链接', '点击促销 CTA 后打开的公开 HTTPS 活动页面。'],
  'grid.image1.url': ['左上灵感图', '替换左上窗帘灵感图片；填写公开 HTTPS 图片地址。'],
  'grid.image1.alt': ['左上灵感图说明', '左上图片无法显示时供读屏工具识别的简短说明。'],
  'grid.image1.clickUrl': ['左上灵感图链接', '点击左上图片后打开的公开 HTTPS 页面地址。'],
  'grid.image1.caption': ['左上图片标题', '开启“显示图片下方标题”后，显示在左上图片下方的居中标题。'],
  'grid.image2.url': ['右上灵感图', '替换右上窗帘灵感图片；填写公开 HTTPS 图片地址。'],
  'grid.image2.alt': ['右上灵感图说明', '右上图片无法显示时供读屏工具识别的简短说明。'],
  'grid.image2.clickUrl': ['右上灵感图链接', '点击右上图片后打开的公开 HTTPS 页面地址。'],
  'grid.image2.caption': ['右上图片标题', '开启“显示图片下方标题”后，显示在右上图片下方的居中标题。'],
  'grid.image3.url': ['左下灵感图', '替换左下窗帘灵感图片；填写公开 HTTPS 图片地址。'],
  'grid.image3.alt': ['左下灵感图说明', '左下图片无法显示时供读屏工具识别的简短说明。'],
  'grid.image3.clickUrl': ['左下灵感图链接', '点击左下图片后打开的公开 HTTPS 页面地址。'],
  'grid.image3.caption': ['左下图片标题', '开启“显示图片下方标题”后，显示在左下图片下方的居中标题。'],
  'grid.image4.url': ['右下灵感图', '替换右下窗帘灵感图片；填写公开 HTTPS 图片地址。'],
  'grid.image4.alt': ['右下灵感图说明', '右下图片无法显示时供读屏工具识别的简短说明。'],
  'grid.image4.clickUrl': ['右下灵感图链接', '点击右下图片后打开的公开 HTTPS 页面地址。'],
  'grid.image4.caption': ['右下图片标题', '开启“显示图片下方标题”后，显示在右下图片下方的居中标题。'],
  'pair.left.url': ['左侧场景图', '替换左侧窗帘场景图；填写公开 HTTPS 图片地址。'],
  'pair.left.alt': ['左侧场景图说明', '左侧图片无法显示时供读屏工具识别的简短说明。'],
  'pair.left.clickUrl': ['左侧场景图链接', '点击左侧场景图或文字后打开的公开 HTTPS 页面地址。'],
  'pair.left.caption': ['左侧场景图文字', '显示在左侧场景图下方的居中文字链接。'],
  'pair.right.url': ['右侧场景图', '替换右侧窗帘场景图；填写公开 HTTPS 图片地址。'],
  'pair.right.alt': ['右侧场景图说明', '右侧图片无法显示时供读屏工具识别的简短说明。'],
  'pair.right.clickUrl': ['右侧场景图链接', '点击右侧场景图或文字后打开的公开 HTTPS 页面地址。'],
  'pair.right.caption': ['右侧场景图文字', '显示在右侧场景图下方的居中文字链接。'],
  'product.badge': ['促销角标文字', '显示在商品主图左上角的促销信息。'],
  'product.image.url': ['商品主图链接', '替换商品主图；填写公开 HTTPS 图片地址。'],
  'product.image.alt': ['商品主图说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'product.image.clickUrl': ['商品图片链接', '点击主图和商品标题后打开的商品或集合页面地址。'],
  'product.title': ['商品名称', '显示在商品图片下方的产品名称。'],
  'product.description': ['商品卖点', '显示在商品名称下方的简短产品说明。'],
  'product.cta.text': ['商品 CTA 文字', '显示为下划线文本链接的引导文字。'],
  'product.cta.url': ['商品 CTA 链接', '点击下划线 CTA 后打开的商品或集合页面地址。'],
  'image.url': ['整图链接', '替换当前组件使用的完整图片；填写公开 HTTPS 图片地址。'],
  'image.alt': ['图片说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'image.linkUrl': ['图片点击链接', '用户点击整张图片后打开的页面地址。'],
  'measurement.image.url': ['测量场景图', '替换尺寸测量工具卡主图；填写公开 HTTPS 图片地址。'],
  'measurement.image.alt': ['测量场景图说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'measurement.title': ['测量工具标题', '显示在尺寸测量工具卡主图下方的标题。'],
  'measurement.subtitle': ['测量工具说明', '显示在标题下方的补充说明。'],
  'measurement.cta.label': ['测量工具 CTA 文字', '显示为下划线的尺寸测量入口文字。'],
  'measurement.cta.url': ['测量工具 CTA 链接', '点击 CTA 后打开的公开 HTTPS 尺寸测量工具页面。'],
  'intro.title': ['卡片标题', '显示在产品推荐卡上方的主标题。'],
  'intro.subtitle': ['顶部说明', '显示在卡片标题下方；按可用宽度自动换行。'],
  'product.images.scene.url': ['产品场景图', '替换产品场景图片；填写公开 HTTPS 图片地址。'],
  'product.images.scene.alt': ['产品场景图说明', '场景图无法显示时供读屏工具识别的简短说明。'],
  'product.images.fabric.url': ['面料细节图', '替换面料细节图片；填写公开 HTTPS 图片地址。'],
  'product.images.fabric.alt': ['面料细节图说明', '面料图无法显示时供读屏工具识别的简短说明。'],
  'product.images.detail.url': ['产品细节图', '替换产品细节图片；填写公开 HTTPS 图片地址。'],
  'product.images.detail.alt': ['产品细节图说明', '细节图无法显示时供读屏工具识别的简短说明。'],
  'product.title': ['产品标题', '显示在推荐卡中的产品标题。'],
  'product.subtitle': ['产品副标题', '显示在产品标题下方的补充说明。'],
  'product.name': ['产品名称', '显示在推荐卡中的产品名称。'],
  'product.color.label': ['色号标签', '显示在产品色号前的标签。'],
  'product.color.value': ['色号内容', '显示产品颜色或色号信息。'],
  'product.cta.label': ['CTA 文字', '显示在产品推荐卡中的按钮或链接文案。'],
  'product.url': ['产品链接', '点击图片或 CTA 后打开的公开 HTTPS 产品页面。'],
  'product.mainImage.url': ['产品主图', '替换产品样式1的主视觉图片；填写公开 HTTPS 图片地址。'],
  'product.mainImage.alt': ['产品主图说明', '主图无法显示时供读屏工具识别的简短说明。'],
  'product.detailImage.url': ['产品细节图', '替换覆盖在主图右下的材质细节图片；填写公开 HTTPS 图片地址。'],
  'product.detailImage.alt': ['产品细节图说明', '细节图无法显示时供读屏工具识别的简短说明。'],
  'color.theme': ['主题操作色', '用于 CTA 和折扣等主要操作元素的颜色。'],
  'color.heroFallback': ['首图回退背景色', '主图无法显示时使用的首图背景色。'],
  'color.logoBadge': ['Logo 徽章底色', '首图 Logo 圆形徽章的实色降级背景。'],
  'color.logoBadgeTransparent': ['Logo 徽章透明底色', '首图 Logo 圆形徽章在支持透明度客户端中的背景。'],
  'color.navigationLeft': ['左侧导航底色', '顶部导航左侧促销区域的背景色。'],
  'color.navigationRight': ['右侧导航底色', '顶部导航右侧注册链接区域的背景色。'],
  'grid.showCaptions': ['显示图片下方标题', '默认关闭；开启后为每张灵感图显示下方居中标题。'],
  'color.surface': ['组件背景色', '仅修改当前组件的底色，不影响邮件整体背景。'],
  'color.heading': ['标题文字色', '修改活动名称和主折扣标题的文字颜色。'],
  'color.body': ['副标题文字色', '仅修改组件副标题的文字颜色。'],
  'color.badgeText': ['折扣文字色', '仅修改商品图片底部折扣条的文字颜色。'],
  'color.text': ['组件文字色', '仅修改当前组件的文字颜色。'],
  'color.action': ['CTA 操作色', '仅修改当前组件 CTA 的按钮或强调色。'],
  'color.badge': ['促销角标底色', '仅修改商品主图左上角促销角标的背景色。'],
  'color.title': ['标题文字色', '仅修改当前组件标题的文字颜色。'],
  'color.subtitle': ['副标题文字色', '仅修改当前组件副标题的文字颜色。'],
  'color.detailFrame': ['细节图边框色', '修改产品细节图的外框颜色。'],
  'color.detailBorder': ['细节图描边色', '修改细节图暖灰细描边的颜色。'],
  'color.detailShadow': ['细节图投影色', '修改细节图右侧和底部的柔和邮件安全投影颜色。'],
  'color.offerSurface': ['优惠文案区底色', '仅修改主图下方优惠文案区域的背景色。'],
  'color.promotionLeft': ['顶部栏左侧底色', '修改顶部促销栏左侧区域的背景色。'],
  'color.promotionRight': ['顶部栏右侧底色', '修改顶部促销栏右侧区域的背景色。'],
  'navigation.visible': ['显示顶部导航栏', '关闭后从最终 HTML 中移除当前头图的顶部导航栏；Logo 和其余头图内容保持不变。'],
  'color.background': ['页脚背景色', '仅修改页脚底色，不影响邮件整体背景。']
};

const copyByComponentField = {
  'gift.rewardGrid2': {
    'content.reward.title': ['赠品区主标题', '显示在两条赠品规则上方的主标题。'],
    'content.reward.rules[0]': ['第一条赠品规则', '显示在主标题下方的第一条满额赠品说明。'],
    'content.reward.rules[1]': ['第二条赠品规则', '显示在第一条规则下方的第二条满额赠品说明。'],
    'content.reward.items[0].image.url': ['上方赠品图片', '替换第一张完整赠品活动图；填写公开 HTTPS 图片地址。'],
    'content.reward.items[0].image.alt': ['上方赠品图片说明', '第一张赠品图无法显示时供读屏工具识别的简短说明。'],
    'content.reward.items[1].image.url': ['下方赠品图片', '替换第二张完整赠品活动图；填写公开 HTTPS 图片地址。'],
    'content.reward.items[1].image.alt': ['下方赠品图片说明', '第二张赠品图无法显示时供读屏工具识别的简短说明。']
  },
  'hero.lateSummerSale': {
    'content.brand.logo.url': ['品牌 Logo 图片', '替换夏末折扣首图顶部使用的品牌 Logo 图片。'],
    'settings.color.body': ['正文文字色', '修改活动补充说明的文字颜色。']
  },
  'navigation.promotionCta': {
    'content.promotion.title': ['活动名称', '显示在促销 CTA 区块顶部的居中文字。']
  },
  'footer.warm': {
    'settings.color.text': ['页脚正文颜色', '修改页脚的常规文字颜色。'],
    'settings.color.link': ['页脚链接颜色', '修改联系邮箱与退订链接的颜色。']
  },
  'footer.doubleDivider': {
    'settings.color.canvas': ['页脚外层底色', '仅修改双分割线页脚的外层画布底色。'],
    'settings.color.background': ['页脚内容区底色', '仅修改双分割线页脚内容区域的底色。'],
    'settings.color.text': ['页脚正文颜色', '修改双分割线页脚的常规文字颜色。'],
    'settings.color.link': ['页脚链接颜色', '修改双分割线页脚中联系邮箱与退订链接的颜色。']
  }
};

export function structuresForCatalog(catalog) {
  return structureOrder.filter((category) => catalog.some((component) => component.category === category));
}

export function styleKeysForStructure(catalog, category) {
  return catalog.filter((component) => component.category === category).map((component) => component.componentKey);
}

export function previewComponentIndex(components, selectedId) {
  if (!Array.isArray(components) || typeof selectedId !== 'string') return -1;
  return components.findIndex(({ instanceId }) => instanceId === selectedId);
}

export function previewStageScrollTop({ stageScrollTop, stageTop, frameTop, documentTop, innerScroll }) {
  const frameTopInStage = frameTop - stageTop + stageScrollTop;
  return Math.max(0, Math.round(frameTopInStage + documentTop - innerScroll));
}

export function previewTargetIsCurrent({ frame, currentFrame, frameWindow, target }) {
  return Boolean(frame && frame === currentFrame && frameWindow && target?.isConnected);
}

export function appendPendingEdit(pending, { instanceId, group, key, value }) {
  if (!instanceId || !['content', 'settings'].includes(group) || !key) throw new Error('invalid pending editor field');
  if (pending.instanceId && pending.instanceId !== instanceId) throw new Error('pending editor fields belong to another component');
  return {
    instanceId,
    content: { ...pending.content, ...(group === 'content' ? { [key]: value } : {}) },
    settings: { ...pending.settings, ...(group === 'settings' ? { [key]: value } : {}) }
  };
}

export function consumePendingEdits(pending) {
  return {
    instanceId: pending.instanceId,
    patch: { content: { ...pending.content }, settings: { ...pending.settings } },
    next: { instanceId: null, content: {}, settings: {} }
  };
}

export function editableFieldKeys(componentKey) {
  const fields = editableByComponent[componentKey];
  if (!fields) throw new Error(`unknown editor component: ${componentKey}`);
  return { content: [...fields.content], settings: [...fields.settings] };
}

export function editableComponentKeys() {
  return Object.keys(editableByComponent);
}

export function editorFieldCopy(componentKey, group, key) {
  const fields = editableFieldKeys(componentKey);
  if (!fields[group]?.includes(key)) throw new Error(`field is not editable in this component: ${componentKey}.${group}.${key}`);
  const saleGridTitleMatch = componentKey === 'collection.saleGrid6WithTitle'
    ? key.match(/^saleItems\[([0-5])\]\.(name|discountLabel|image\.url|image\.alt|image\.clickUrl)$/u)
    : null;
  if (saleGridTitleMatch) {
    const [, index, field] = saleGridTitleMatch;
    const item = Number(index) + 1;
    const copy = {
      name: [`商品 ${item} 名称`, `显示为“Shop … >>”的商品名称；由导入商品 ${item} 自动填入。`],
      discountLabel: [`商品 ${item} 折扣标签`, `显示在商品 ${item} 图片底部的促销条；由 Shopify 价格自动填入。`],
      'image.url': [`商品 ${item} 主图`, `填写公开 HTTPS 图片地址，或使用“导入商品 ${item}”从 Shopify 填入。`],
      'image.alt': [`商品 ${item} 图片说明`, `用于商品 ${item} 主图的可访问性说明。`],
      'image.clickUrl': [`商品 ${item} 跳转链接`, `点击商品 ${item} 图片或名称后打开的 HTTPS 地址。`]
    };
    return { label: copy[field][0], help: copy[field][1] };
  }
  const [label, help] = copyByComponentField[componentKey]?.[`${group}.${key}`]
    ?? copyByField[key]
    ?? ['可编辑内容', '修改此项后会自动刷新当前组件预览。'];
  return { label, help };
}

export function normalizeHexColor(value) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^#[0-9A-F]{6}$/u.test(normalized) ? normalized : null;
}

export function editorInputDisplay(value, metadata = {}) {
  if (metadata.type === 'boolean' && typeof value === 'boolean') {
    return { control: 'checkbox', checked: value };
  }
  if (typeof value === 'string' && value.startsWith('asset://')) {
    return {
      value: '',
      placeholder: value.startsWith('asset://editor-upload-')
        ? '当前使用已上传的本地图片；如需替换，请填写公开 HTTPS 图片地址。'
        : '当前使用组件默认图片；如需替换，请填写公开 HTTPS 图片地址。'
    };
  }
  return { value: String(value ?? ''), placeholder: '' };
}
