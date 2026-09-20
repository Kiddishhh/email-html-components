const structureOrder = ['头图', '导航组件', '活动商品组件', '通用图片组件', '评论组件', '小样-产品', '赠品与权益组件', '地址组件', '页脚组件'];

const editableByComponent = {
  'review.sceneComparison': {
    content: ["scene.before.url","scene.before.alt","scene.after.url","scene.after.alt","review.avatar.url","review.avatar.alt","review.stars.url","review.stars.alt","review.author","review.body","product.title","product.color","product.header","product.lining","product.memory","cta.text","cta.url"],
    settings: ["color.surface","color.text","color.action"]
  },
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
  'hero.gradientScenePromotion': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.linkUrl', 'brand.logo.url', 'brand.logo.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle'],
    settings: ['color.surface', 'color.text']
  },
  'hero.circleLogoSceneOverlay': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.linkUrl', 'brand.logo.url', 'brand.logo.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle'],
    settings: ['color.surface', 'color.text']
  },
  'hero.sceneOverlayCta': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.title', 'hero.subtitle.line1', 'hero.subtitle.line2', 'hero.cta.text', 'hero.cta.url'],
    settings: ['navigation.visible', 'color.text', 'color.action']
  },
  'hero.sceneOverlayCta2': {
    content: ['navigation.message', 'navigation.cta.text', 'navigation.cta.url', 'hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.linkUrl', 'brand.logo.url', 'brand.logo.alt', 'hero.eyebrow', 'hero.title', 'hero.subtitle'],
    settings: ['navigation.visible', 'color.navigationLeft', 'color.navigationRight', 'color.navigationText', 'color.surface', 'color.text']
  },
  'hero.romanShadeDiscount': {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.logo.url', 'hero.logo.alt', 'hero.logo.clickUrl', 'hero.eyebrow', 'hero.title', 'hero.discount', 'hero.subtitle', 'hero.cta.text', 'hero.cta.url'],
    settings: ['navigation.visible', 'color.text', 'color.action']
  },
  'hero.couponSceneOverlay': {
    content: ['navigation.message', 'navigation.cta.text', 'navigation.cta.url', 'intro.title', 'intro.subtitle', 'offer.image.url', 'offer.image.alt', 'hero.image.url', 'hero.image.alt', 'cta.text', 'cta.url'],
    settings: ['navigation.visible', 'color.surface', 'color.promotion', 'color.heading', 'color.body', 'color.action']
  },
  'navigation.promotionCta': {
    content: ['promotion.title', 'promotion.divider.url', 'promotion.divider.alt', 'promotion.offer', 'promotion.body', 'promotion.cta.text', 'promotion.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'navigation.eventCountdown': {
    content: ['countdown.title', 'benefit.1.text', 'benefit.2.text', 'benefit.3.text', 'promotion.cta.text', 'promotion.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'collection.saleGrid6': {
    content: ['saleCollection.title', 'saleCollection.body', 'saleCollection.cta.text', 'saleCollection.cta.url', 'saleItems[0].name', 'saleItems[1].name', 'saleItems[2].name', 'saleItems[3].name', 'saleItems[4].name', 'saleItems[5].name'],
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
  'collection.saleGrid4': {
    content: [
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl'
    ],
    settings: ['color.theme', 'color.surface']
  },
  'collection.saleGrid4WithTitle': {
    content: [
      'saleCollection.title', 'saleCollection.body',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].cta.text',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].cta.text',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].cta.text',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].cta.text',
      'saleCollection.cta.text', 'saleCollection.cta.url'
    ],
    settings: ['color.surface', 'color.theme', 'color.heading', 'color.body', 'color.action']
  },
  'collection.sceneSaleGrid4WithTitle': {
    content: [
      'saleCollection.title', 'saleCollection.body',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].name',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].name',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].name',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].name'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.product', 'color.theme', 'color.badgeText']
  },
  'collection.productGrid4NoSidePadding': {
    content: [
      'saleCollection.title', 'saleCollection.body',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].cta.text',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].cta.text',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].cta.text',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].cta.text'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.theme', 'color.action']
  },
  'collection.saleGrid4DetailWithTitle': {
    content: [
      'promotion.title', 'promotion.subtitle',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].name', 'saleItems[0].price.current', 'saleItems[0].price.compareAt', 'saleItems[0].cta.text',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].name', 'saleItems[1].price.current', 'saleItems[1].price.compareAt', 'saleItems[1].cta.text',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].name', 'saleItems[2].price.current', 'saleItems[2].price.compareAt', 'saleItems[2].cta.text',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].name', 'saleItems[3].price.current', 'saleItems[3].price.compareAt', 'saleItems[3].cta.text'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.text', 'color.theme', 'color.badgeText', 'color.compareAt', 'color.cta', 'color.ctaText']
  },
  'collection.saleGrid6DetailWithTitle': {
    content: [
      'promotion.title', 'promotion.subtitle',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].name', 'saleItems[0].price.current', 'saleItems[0].price.compareAt', 'saleItems[0].cta.text',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].name', 'saleItems[1].price.current', 'saleItems[1].price.compareAt', 'saleItems[1].cta.text',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].name', 'saleItems[2].price.current', 'saleItems[2].price.compareAt', 'saleItems[2].cta.text',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].name', 'saleItems[3].price.current', 'saleItems[3].price.compareAt', 'saleItems[3].cta.text',
      'saleItems[4].discountLabel', 'saleItems[4].image.url', 'saleItems[4].image.alt', 'saleItems[4].image.clickUrl', 'saleItems[4].name', 'saleItems[4].price.current', 'saleItems[4].price.compareAt', 'saleItems[4].cta.text',
      'saleItems[5].discountLabel', 'saleItems[5].image.url', 'saleItems[5].image.alt', 'saleItems[5].image.clickUrl', 'saleItems[5].name', 'saleItems[5].price.current', 'saleItems[5].price.compareAt', 'saleItems[5].cta.text'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.text', 'color.theme', 'color.badgeText', 'color.compareAt', 'color.cta', 'color.ctaText']
  },
  'collection.sceneSaleGrid6PriceWithTitle': {
    content: [
      'promotion.title', 'decoration.divider.url', 'promotion.subtitle',
      'saleItems[0].discountLabel', 'saleItems[0].image.url', 'saleItems[0].image.alt', 'saleItems[0].image.clickUrl', 'saleItems[0].name', 'saleItems[0].price.current', 'saleItems[0].price.compareAt',
      'saleItems[1].discountLabel', 'saleItems[1].image.url', 'saleItems[1].image.alt', 'saleItems[1].image.clickUrl', 'saleItems[1].name', 'saleItems[1].price.current', 'saleItems[1].price.compareAt',
      'saleItems[2].discountLabel', 'saleItems[2].image.url', 'saleItems[2].image.alt', 'saleItems[2].image.clickUrl', 'saleItems[2].name', 'saleItems[2].price.current', 'saleItems[2].price.compareAt',
      'saleItems[3].discountLabel', 'saleItems[3].image.url', 'saleItems[3].image.alt', 'saleItems[3].image.clickUrl', 'saleItems[3].name', 'saleItems[3].price.current', 'saleItems[3].price.compareAt',
      'saleItems[4].discountLabel', 'saleItems[4].image.url', 'saleItems[4].image.alt', 'saleItems[4].image.clickUrl', 'saleItems[4].name', 'saleItems[4].price.current', 'saleItems[4].price.compareAt',
      'saleItems[5].discountLabel', 'saleItems[5].image.url', 'saleItems[5].image.alt', 'saleItems[5].image.clickUrl', 'saleItems[5].name', 'saleItems[5].price.current', 'saleItems[5].price.compareAt',
      'decoration.footer.url', 'cta.text', 'cta.url'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.product', 'color.theme', 'color.badgeText', 'color.price', 'color.compareAt', 'color.cta', 'color.ctaText']
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
  'collection.curtainEditorialMosaic4': {
    content: [
      'promotion.title', 'promotion.subtitle',
      'mosaic.items[0].image.url', 'mosaic.items[0].image.alt', 'mosaic.items[0].clickUrl',
      'mosaic.items[1].image.url', 'mosaic.items[1].image.alt', 'mosaic.items[1].clickUrl',
      'mosaic.items[2].image.url', 'mosaic.items[2].image.alt', 'mosaic.items[2].clickUrl',
      'mosaic.items[3].image.url', 'mosaic.items[3].image.alt', 'mosaic.items[3].clickUrl',
      'cta.text', 'cta.url'
    ],
    settings: ['color.surface', 'color.heading', 'color.body', 'color.cardFallback', 'color.cta']
  },
  'collection.curtainEditorialTriptych': {
    content: ['hero.image.url', 'hero.image.alt', 'hero.image.clickUrl', 'pair.left.url', 'pair.left.alt', 'pair.left.clickUrl', 'pair.left.caption', 'pair.right.url', 'pair.right.alt', 'pair.right.clickUrl', 'pair.right.caption', 'intro.title', 'intro.subtitle'],
    settings: ['color.surface']
  },
  'collection.multiCategoryRecommendationV': {"content": ["intro.title", "intro.subtitle", "collections[0].image.url", "collections[0].image.alt", "collections[0].title", "collections[0].clickUrl", "collections[1].image.url", "collections[1].image.alt", "collections[1].title", "collections[1].clickUrl", "collections[2].image.url", "collections[2].image.alt", "collections[2].title", "collections[2].clickUrl", "collections[3].image.url", "collections[3].image.alt", "collections[3].title", "collections[3].clickUrl", "collections[4].image.url", "collections[4].image.alt", "collections[4].title", "collections[4].clickUrl", "collections[5].image.url", "collections[5].image.alt", "collections[5].title", "collections[5].clickUrl"], "settings": ["color.surface", "color.heading", "color.body", "color.caption"]},
  'collection.romanShadeMultiRecommendation': {
    content: [
      'intro.title', 'intro.subtitle',
      'hero.image.url', 'hero.image.alt', 'hero.image.clickUrl', 'hero.discountLabel',
      'pair.left.image.url', 'pair.left.image.alt', 'pair.left.image.clickUrl', 'pair.left.discountLabel',
      'pair.right.image.url', 'pair.right.image.alt', 'pair.right.image.clickUrl', 'pair.right.discountLabel',
      'cta.text', 'cta.url'
    ],
    settings: ['color.surface', 'color.text', 'color.discount', 'color.cta']
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
  'gift.warmRedPairIV': {"content": ["intro.title", "intro.rule1", "intro.rule2", "gifts[0].image.url", "gifts[0].image.alt", "gifts[0].clickUrl", "gifts[1].image.url", "gifts[1].image.alt", "gifts[1].clickUrl"], "settings": ["color.surface", "color.text"]},
  'gift.showcase2': {
    content: [
      'gifts[0].image.url', 'gifts[0].image.alt', 'gifts[0].title', 'gifts[0].value', 'gifts[0].description', 'gifts[0].cta.text', 'gifts[0].cta.url',
      'gifts[1].image.url', 'gifts[1].image.alt', 'gifts[1].title', 'gifts[1].value', 'gifts[1].description', 'gifts[1].cta.text', 'gifts[1].cta.url'
    ],
    settings: ['color.surface', 'color.text', 'color.accent']
  },
  'gift.doubleGiftAddressShowcase': {
    content: [
      'intro.title', 'intro.subtitle',
      'gifts[0].image.url', 'gifts[0].image.alt', 'gifts[0].title', 'gifts[0].value', 'gifts[0].cta.text', 'gifts[0].cta.url', 'gifts[0].note',
      'gifts[1].image.url', 'gifts[1].image.alt', 'gifts[1].title', 'gifts[1].value', 'gifts[1].cta.text', 'gifts[1].cta.url', 'gifts[1].note',
      'footer.note'
    ],
    settings: ['color.canvas', 'color.card', 'color.text', 'color.accent', 'color.muted']
  },
  'gift.verticalImagePair': {
    content: ['images[0].url', 'images[0].alt', 'images[1].url', 'images[1].alt', 'gift.linkUrl'],
    settings: []
  },
  'location.showroomCard': { content: [], settings: ['color.surface'] },
  'footer.warm': { content: [], settings: ['color.background', 'color.text', 'color.link'] },
  'footer.doubleDivider': { content: [], settings: ['color.canvas', 'color.background', 'color.text', 'color.link'] },
  'footer.minimalContact': { content: [], settings: ['color.background', 'color.text', 'color.link'] },
  'image.benefitsStrip3': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'image.benefitsStrip4': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'image.benefitsStrip4TwoRows': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'image.benefitsAddressCard': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'image.benefitsShowcase6': { content: ['image.url', 'image.alt'], settings: ['color.surface'] },
  'tool.measurementCard': {
    content: ['measurement.image.url', 'measurement.image.alt', 'measurement.title', 'measurement.subtitle', 'measurement.cta.label', 'measurement.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  },
  'tool.freeMeasurementGuidance': {
    content: ['guide.title', 'guide.subtitle', 'guide.image.url', 'guide.image.alt', 'guide.image.clickUrl'],
    settings: ['color.surface', 'color.text']
  },
  'review.trustpilotImage': {
    content: ['reviews[0].author', 'reviews[0].title', 'reviews[0].body', 'reviews[0].date', 'reviews[1].author', 'reviews[1].title', 'reviews[1].body', 'reviews[1].date'],
    settings: []
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
  'hero.title': ['主标题', '显示活动核心信息；场景文字叠层头图会按画布宽度自动换行。'],
  'hero.subtitle': ['活动补充说明', '显示在主标题下方的补充文案。'],
  'hero.subtitle.line1': ['活动说明第一行', '显示在场景文字叠层头图主标题下方的第一行说明。'],
  'hero.subtitle.line2': ['活动说明第二行', '显示在场景文字叠层头图主标题下方的第二行说明。'],
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
  'guide.title': ['免费测量标题', '显示在测量场景图上方的居中标题。'],
  'guide.subtitle': ['免费测量说明', '显示在标题下方的居中辅助说明。'],
  'guide.image.url': ['免费测量场景图', '替换完整测量场景图；填写公开 HTTPS 图片地址。'],
  'guide.image.alt': ['免费测量场景图说明', '图片无法显示时供读屏工具识别的简短说明。'],
  'guide.image.clickUrl': ['免费测量场景图链接', '点击整张测量场景图后打开的公开 HTTPS 帮助页面地址。'],
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
  'review.sceneComparison': {
    "content.scene.before.url": [
      "左上场景图",
      "使用原稿未安装窗帘的场景，建议 600×676px；图片本身不跳转。"
    ],
    "content.scene.before.alt": [
      "左上图片说明",
      "图片未加载时显示。"
    ],
    "content.scene.after.url": [
      "右下场景图",
      "使用原稿安装窗帘后的场景，建议 600×678px；图片本身不跳转。"
    ],
    "content.scene.after.alt": [
      "右下图片说明",
      "图片未加载时显示。"
    ],
    "content.review.avatar.url": [
      "评论者头像",
      "默认原稿头像；建议 108×108px。"
    ],
    "content.review.avatar.alt": [
      "头像说明",
      "默认评论者姓名。"
    ],
    "content.review.stars.url": [
      "五星评分图片",
      "默认原稿五星素材，建议 210×40px；替换图片时同步更新评分说明。"
    ],
    "content.review.stars.alt": [
      "评分说明",
      "默认 5 out of 5 stars。"
    ],
    "content.review.author": [
      "评论者姓名",
      "默认 Uliana Grabciuc。"
    ],
    "content.review.body": [
      "评论正文",
      "保留真实文字，按当前画布宽度自动换行。"
    ],
    "content.product.title": [
      "商品名称",
      "默认 Marisol Linen Curtains。"
    ],
    "content.product.color": [
      "颜色说明",
      "默认 Color: White K1011。"
    ],
    "content.product.header": [
      "帘头说明",
      "默认 Header: Pinch Pleat - Double。"
    ],
    "content.product.lining": [
      "衬里说明",
      "默认 Lining Type: White_Shading Rate 50%；按参考图自动换成两行。"
    ],
    "content.product.memory": [
      "定型说明",
      "默认 Thermal Memory Shaping。"
    ],
    "content.cta.text": [
      "左下 CTA 文字",
      "默认 Shop The Look >>；唯一可点击的区域。"
    ],
    "content.cta.url": [
      "左下 CTA 链接",
      "默认 Marisol 商品链接，保留 utm_source=omnisend、utm_medium=email、utm_id=cover-rc。"
    ],
    "settings.color.surface": [
      "面板背景色",
      "默认原稿 #F5F2ED；头像与五星源图带有原稿底色，改色时应同步替换素材。"
    ],
    "settings.color.text": [
      "正文与姓名颜色",
      "仅影响当前组件的文字。"
    ],
    "settings.color.action": [
      "CTA 文字颜色",
      "仅影响左下下划线 CTA。"
    ]
  },
  'collection.multiCategoryRecommendationV': {"content.intro.title": ["主标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.intro.subtitle": ["副标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[0].image.url": ["分类 1 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[0].image.alt": ["分类 1 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[0].title": ["分类 1 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[0].clickUrl": ["分类 1 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[1].image.url": ["分类 2 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[1].image.alt": ["分类 2 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[1].title": ["分类 2 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[1].clickUrl": ["分类 2 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[2].image.url": ["分类 3 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[2].image.alt": ["分类 3 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[2].title": ["分类 3 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[2].clickUrl": ["分类 3 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[3].image.url": ["分类 4 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[3].image.alt": ["分类 4 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[3].title": ["分类 4 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[3].clickUrl": ["分类 4 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[4].image.url": ["分类 5 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[4].image.alt": ["分类 5 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[4].title": ["分类 5 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[4].clickUrl": ["分类 5 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[5].image.url": ["分类 6 图片地址", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[5].image.alt": ["分类 6 图片说明", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[5].title": ["分类 6 分类标题", "图片和分类标题共用对应分类链接；字体和布局固定。"], "content.collections[5].clickUrl": ["分类 6 跳转链接", "图片和分类标题共用对应分类链接；字体和布局固定。"], "settings.color.surface": ["背景色", "仅影响当前组件。"], "settings.color.heading": ["主标题颜色", "仅影响当前组件。"], "settings.color.body": ["副标题颜色", "仅影响当前组件。"], "settings.color.caption": ["分类标题颜色", "仅影响当前组件。"]},
  'collection.romanShadeMultiRecommendation': {
    'content.intro.title': ['推荐区标题', '默认 Custom-Made Roman Shades；按当前画布宽度自然换行。'],
    'content.intro.subtitle': ['推荐区说明', '显示在标题下方，默认按设计稿的两行节奏换行。'],
    'content.hero.image.url': ['主场景图', '替换大图；填写公开 HTTPS 图片地址。'],
    'content.hero.discountLabel': ['主图折扣标', '显示在大图左上角，留空可移除该标签。'],
    'content.pair.left.image.url': ['左侧推荐图', '替换左下产品图；填写公开 HTTPS 图片地址。'],
    'content.pair.left.discountLabel': ['左侧折扣标', '显示在左下图左上角，留空可移除该标签。'],
    'content.pair.right.image.url': ['右侧推荐图', '替换右下产品图；填写公开 HTTPS 图片地址。'],
    'content.pair.right.discountLabel': ['右侧折扣标', '显示在右下图左上角，留空可移除该标签。'],
    'content.cta.text': ['底部 CTA 文案', '默认 Decorate Your Home Now。'],
    'content.cta.url': ['底部 CTA 链接', '填写实际集合或活动页面的公开 HTTPS 链接。'],
    'settings.color.text': ['标题与说明文字色', '仅修改顶部标题和说明文字颜色。'],
    'settings.color.discount': ['折扣标签底色', '统一修改三张图片左上角折扣标签的底色。'],
    'settings.color.cta': ['CTA 描边与文字色', '仅修改底部 CTA 的描边和文字颜色。']
  },
  'collection.curtainEditorialMosaic4': {
    'content.promotion.title': ['顶部标题', '默认 A FRESH LOOK FOR THE SEASON；保持单行可读。'],
    'content.promotion.subtitle': ['顶部说明', '默认 Beautiful curtains, thoughtfully designed for your home.'],
    'content.mosaic.items[0].image.url': ['左上拼贴图片', '替换 259×258px 左上图片；填写公开 HTTPS 图片地址。'],
    'content.mosaic.items[0].image.alt': ['左上图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.mosaic.items[0].clickUrl': ['左上图片链接', '左上图片独立跳转的公开 HTTPS 链接。'],
    'content.mosaic.items[1].image.url': ['左下拼贴图片', '替换 259×258px 左下图片；填写公开 HTTPS 图片地址。'],
    'content.mosaic.items[1].image.alt': ['左下图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.mosaic.items[1].clickUrl': ['左下图片链接', '左下图片独立跳转的公开 HTTPS 链接。'],
    'content.mosaic.items[2].image.url': ['右上拼贴图片', '替换 259×323px 右上图片；填写公开 HTTPS 图片地址。'],
    'content.mosaic.items[2].image.alt': ['右上图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.mosaic.items[2].clickUrl': ['右上图片链接', '右上图片独立跳转的公开 HTTPS 链接。'],
    'content.mosaic.items[3].image.url': ['右下拼贴图片', '替换 259×194px 右下图片；填写公开 HTTPS 图片地址。'],
    'content.mosaic.items[3].image.alt': ['右下图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.mosaic.items[3].clickUrl': ['右下图片链接', '右下图片独立跳转的公开 HTTPS 链接。'],
    'content.cta.text': ['底部 CTA 文案', '默认 REFRESH YOUR HOME。'],
    'content.cta.url': ['底部 CTA 链接', '默认活动页链接，保留 cover-rc UTM 参数。'],
    'settings.color.surface': ['组件背景色', '默认 #FFFDFA，仅作用于当前组件。'],
    'settings.color.heading': ['标题颜色', '默认 #242323，仅作用于顶部标题。'],
    'settings.color.body': ['说明颜色', '默认 #000000，仅作用于顶部说明。'],
    'settings.color.cardFallback': ['图片降级底色', '默认 #E8E3DD；图片无法加载时显示。'],
    'settings.color.cta': ['CTA 描边与文字色', '默认 #242323，同时作用于底部 CTA 边框和文字。']
  },
  'collection.saleGrid4WithTitle': {
    'content.saleCollection.title': ['推荐区标题', '默认 You May Also Like；使用 Lora 400、30px/38px 居中标题。'],
    'content.saleCollection.body': ['推荐区说明', '显示在标题下方，按当前画布宽度自然换行。'],
    'content.saleCollection.cta.text': ['底部按钮文案', '默认 APPLY DISCOUNT；此文字不会创建或自动应用折扣。'],
    'content.saleCollection.cta.url': ['底部按钮链接', '默认使用已确认的 Roman Shades 集合页并保留 UTM；集合页链接本身不自动应用优惠码。'],
    'content.saleItems[0].cta.text': ['商品 1 链接文字', '主图下方的可点击文字，与主图共用跳转链接；商品导入后填入商品标题。'],
    'content.saleItems[1].cta.text': ['商品 2 链接文字', '主图下方的可点击文字，与主图共用跳转链接；商品导入后填入商品标题。'],
    'content.saleItems[2].cta.text': ['商品 3 链接文字', '主图下方的可点击文字，与主图共用跳转链接；商品导入后填入商品标题。'],
    'content.saleItems[3].cta.text': ['商品 4 链接文字', '主图下方的可点击文字，与主图共用跳转链接；商品导入后填入商品标题。'],
    'settings.color.theme': ['折扣标签底色', '统一修改四个折扣标签的底色。'],
    'settings.color.heading': ['主标题和按钮边框色', '仅修改推荐区主标题与底部按钮描边。'],
    'settings.color.body': ['副标题文字色', '仅修改顶部推荐说明的颜色。'],
    'settings.color.action': ['商品链接和按钮文字色', '修改四组图片下方链接与底部按钮文字的颜色。']
  },
  'collection.sceneSaleGrid4WithTitle': {
    'content.saleCollection.title': ['推荐区标题', '默认 Upgrade Your Home in Style；使用 Lora 衬线字体。'],
    'content.saleCollection.body': ['推荐区说明', '显示在标题下方，按画布宽度自然换行。'],
    'content.saleItems[0].name': ['商品 1 名称', '左上商品名称，与主图共用商品链接；导入后更新为 Shopify 商品标题。'],
    'content.saleItems[1].name': ['商品 2 名称', '右上商品名称，与主图共用商品链接；导入后更新为 Shopify 商品标题。'],
    'content.saleItems[2].name': ['商品 3 名称', '左下商品名称，与主图共用商品链接；导入后更新为 Shopify 商品标题。'],
    'content.saleItems[3].name': ['商品 4 名称', '右下商品名称，与主图共用商品链接；导入后更新为 Shopify 商品标题。'],
    'settings.color.surface': ['组件背景色', '修改整个四宫格组件的暖白背景。'],
    'settings.color.heading': ['标题文字色', '仅修改顶部 Lora 标题颜色。'],
    'settings.color.body': ['副标题文字色', '仅修改顶部说明文字颜色。'],
    'settings.color.product': ['商品名称色', '统一修改四个商品名称的颜色。'],
    'settings.color.theme': ['折扣标签底色', '统一修改四个折扣标签的底色。'],
    'settings.color.badgeText': ['折扣标签文字色', '统一修改四个折扣标签的文字颜色。']
  },
  'collection.productGrid4NoSidePadding': {
    'content.saleCollection.title': ['推荐区标题', '默认 Three Days Left to Refresh；使用 Lora 衬线字体。'],
    'content.saleCollection.body': ['推荐区说明', '显示在标题下方，按当前画布宽度自然换行。'],
    'content.saleItems[0].cta.text': ['商品 1 按钮文字', '左上商品图下方的按钮文字；商品导入后填入 Shopify 商品标题。'],
    'content.saleItems[1].cta.text': ['商品 2 按钮文字', '右上商品图下方的按钮文字；商品导入后填入 Shopify 商品标题。'],
    'content.saleItems[2].cta.text': ['商品 3 按钮文字', '左下商品图下方的按钮文字；商品导入后填入 Shopify 商品标题。'],
    'content.saleItems[3].cta.text': ['商品 4 按钮文字', '右下商品图下方的按钮文字；商品导入后填入 Shopify 商品标题。'],
    'settings.color.surface': ['组件背景色', '修改整个四宫格组件的背景颜色。'],
    'settings.color.heading': ['标题文字色', '仅修改顶部推荐区标题颜色。'],
    'settings.color.body': ['说明文字色', '仅修改顶部说明文字颜色。'],
    'settings.color.theme': ['折扣标签底色', '统一修改四个折扣标签的底色。'],
    'settings.color.action': ['商品按钮文字色', '统一修改四个商品按钮的文字颜色。']
  },
  'collection.saleGrid4DetailWithTitle': {
    'content.promotion.title': ['顶部标题', '默认 Upgrade Your Home In Style；商品导入不会修改。'],
    'content.promotion.subtitle': ['顶部说明', '显示在标题下方并按画布宽度自然换行；商品导入不会修改。'],
    'content.saleItems[0].name': ['商品 1 名称', '纯文本，不附带链接；导入商品 1 后更新为 Shopify 完整商品名。'],
    'content.saleItems[1].name': ['商品 2 名称', '纯文本，不附带链接；导入商品 2 后更新为 Shopify 完整商品名。'],
    'content.saleItems[2].name': ['商品 3 名称', '纯文本，不附带链接；导入商品 3 后更新为 Shopify 完整商品名。'],
    'content.saleItems[3].name': ['商品 4 名称', '纯文本，不附带链接；导入商品 4 后更新为 Shopify 完整商品名。'],
    'content.saleItems[0].price.current': ['商品 1 折扣价', '纯文本；导入商品 1 后更新为首个可售变体价格。'],
    'content.saleItems[1].price.current': ['商品 2 折扣价', '纯文本；导入商品 2 后更新为首个可售变体价格。'],
    'content.saleItems[2].price.current': ['商品 3 折扣价', '纯文本；导入商品 3 后更新为首个可售变体价格。'],
    'content.saleItems[3].price.current': ['商品 4 折扣价', '纯文本；导入商品 4 后更新为首个可售变体价格。'],
    'content.saleItems[0].price.compareAt': ['商品 1 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[1].price.compareAt': ['商品 2 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[2].price.compareAt': ['商品 3 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[3].price.compareAt': ['商品 4 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[0].cta.text': ['商品 1 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[1].cta.text': ['商品 2 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[2].cta.text': ['商品 3 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[3].cta.text': ['商品 4 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'settings.color.surface': ['组件背景色', '仅修改该组件背景。'],
    'settings.color.heading': ['顶部标题颜色', '仅修改顶部主标题。'],
    'settings.color.body': ['顶部说明颜色', '仅修改顶部说明。'],
    'settings.color.text': ['商品名称和折扣价颜色', '商品名称与价格保持纯文本。'],
    'settings.color.theme': ['折扣标签底色', '统一修改四个图片左上角标签。'],
    'settings.color.badgeText': ['折扣标签文字色', '统一修改四个折扣标签文字。'],
    'settings.color.compareAt': ['划线原价颜色', '仅修改四个原价文字。'],
    'settings.color.cta': ['CTA 背景色', '统一修改四个 SHOP NOW 按钮底色。'],
    'settings.color.ctaText': ['CTA 文字色', '统一修改四个 SHOP NOW 按钮文字。']
  },
  'collection.saleGrid6DetailWithTitle': {
    'content.promotion.title': ['顶部标题', '默认 Upgrade Your Home In Style；商品导入不会修改。'],
    'content.promotion.subtitle': ['顶部说明', '显示在标题下方并按画布宽度自然换行；商品导入不会修改。'],
    'content.saleItems[0].name': ['商品 1 名称', '纯文本，不附带链接；导入商品 1 后更新为 Shopify 完整商品名。'],
    'content.saleItems[1].name': ['商品 2 名称', '纯文本，不附带链接；导入商品 2 后更新为 Shopify 完整商品名。'],
    'content.saleItems[2].name': ['商品 3 名称', '纯文本，不附带链接；导入商品 3 后更新为 Shopify 完整商品名。'],
    'content.saleItems[3].name': ['商品 4 名称', '纯文本，不附带链接；导入商品 4 后更新为 Shopify 完整商品名。'],
    'content.saleItems[0].price.current': ['商品 1 折扣价', '纯文本；导入商品 1 后更新为首个可售变体价格。'],
    'content.saleItems[1].price.current': ['商品 2 折扣价', '纯文本；导入商品 2 后更新为首个可售变体价格。'],
    'content.saleItems[2].price.current': ['商品 3 折扣价', '纯文本；导入商品 3 后更新为首个可售变体价格。'],
    'content.saleItems[3].price.current': ['商品 4 折扣价', '纯文本；导入商品 4 后更新为首个可售变体价格。'],
    'content.saleItems[0].price.compareAt': ['商品 1 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[1].price.compareAt': ['商品 2 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[2].price.compareAt': ['商品 3 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[3].price.compareAt': ['商品 4 原价', '纯文本并带删除线；无有效划线价时留空。'],
    'content.saleItems[0].cta.text': ['商品 1 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[1].cta.text': ['商品 2 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[2].cta.text': ['商品 3 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'content.saleItems[3].cta.text': ['商品 4 CTA', '默认 SHOP NOW；只有图片和此 CTA 使用商品链接。'],
    'settings.color.surface': ['组件背景色', '仅修改该组件背景。'],
    'settings.color.heading': ['顶部标题颜色', '仅修改顶部主标题。'],
    'settings.color.body': ['顶部说明颜色', '仅修改顶部说明。'],
    'settings.color.text': ['商品名称和折扣价颜色', '商品名称与价格保持纯文本。'],
    'settings.color.theme': ['折扣标签底色', '统一修改六个图片右上角标签。'],
    'settings.color.badgeText': ['折扣标签文字色', '统一修改六个折扣标签文字。'],
    'settings.color.compareAt': ['划线原价颜色', '仅修改六个原价文字。'],
    'settings.color.cta': ['CTA 背景色', '统一修改六个 SHOP NOW 按钮底色。'],
    'settings.color.ctaText': ['CTA 文字色', '统一修改六个 SHOP NOW 按钮文字。'],
    'content.saleItems[4].name': ['商品 5 名称', '纯文本；导入后更新为 Shopify 完整商品名。'],
    'content.saleItems[5].name': ['商品 6 名称', '纯文本；导入后更新为 Shopify 完整商品名。'],
  },
  'collection.sceneSaleGrid6PriceWithTitle': {
    'content.promotion.title': ['顶部标题', '默认 Fall Favorites For Every Room；商品导入不会修改。'],
    'content.decoration.divider.url': ['标题分隔装饰', '默认使用透明植物分隔图；正式导出请替换为公开 HTTPS 图片。'],
    'content.promotion.subtitle': ['顶部说明', '显示在植物分隔图下方；商品导入不会修改。'],
    'content.decoration.footer.url': ['CTA 枝叶装饰', '默认使用透明金色枝叶图；正式导出请替换为公开 HTTPS 图片。'],
    'content.cta.text': ['底部 CTA 文案', '默认 SHOP THE FALL EVENT；商品导入不会修改。'],
    'content.cta.url': ['底部 CTA 链接', '默认 Freshine Sale 页面并保留 cover-rc UTM。'],
    'settings.color.surface': ['组件背景色', '仅修改 600px 邮件组件内部暖白背景。'],
    'settings.color.heading': ['顶部标题颜色', '仅修改 Lora 主标题。'],
    'settings.color.body': ['顶部说明颜色', '仅修改 Montserrat 副标题。'],
    'settings.color.product': ['商品名称颜色', '统一修改六个图片下商品名。'],
    'settings.color.theme': ['折扣标签底色', '统一修改六个图片左上角矩形标签。'],
    'settings.color.badgeText': ['折扣标签文字色', '统一修改六个折扣标签文字。'],
    'settings.color.price': ['折扣价颜色', '统一修改六个当前折扣价。'],
    'settings.color.compareAt': ['划线原价颜色', '统一修改六个 compare-at 原价。'],
    'settings.color.cta': ['底部 CTA 背景色', '仅修改底部宽按钮背景。'],
    'settings.color.ctaText': ['底部 CTA 文字色', '仅修改底部宽按钮文字。']
  },
  'hero.romanShadeDiscount': {
    'content.hero.backgroundImage.url': ['罗马帘场景背景', '替换背景图片；建议使用 1200×1522px 竖图，默认素材按参考图精确裁剪。'],
    'content.hero.logo.url': ['品牌 Logo 图片', '替换圆形 Logo 图片；建议使用正方形、透明背景的 PNG，默认 206×206px。'],
    'content.hero.title': ['折扣前缀', '默认 UP   TO，三个空格保留参考图的宽间距；建议保持短文案。'],
    'content.hero.discount': ['主折扣文案', '默认 70% Off；独立于折扣前缀编辑，建议保持短文案。'],
    'settings.color.text': ['折扣文字和描边色', '修改当前组件的折扣、说明文字与上方描边；默认 #6B492C。'],
    'settings.color.action': ['按钮背景色', '仅修改 CTA 背景色；白色按钮文字和原始 Logo、装饰图标保持不变。']
  },
  'hero.couponSceneOverlay': {
    'content.navigation.message': ['顶部导航文案', '保持单行显示；文案过长会压缩同一行内的可用空间。'],
    'content.navigation.cta.text': ['顶部导航链接文字', '右侧下划线链接文字，默认 SIGN UP。'],
    'content.navigation.cta.url': ['顶部导航链接', '点击顶部 SIGN UP 后打开的公开 HTTPS 页面。'],
    'content.intro.title': ['主标题', '居中 Montserrat Medium 标题；建议保持一行。'],
    'content.intro.subtitle': ['副标题', '居中 Montserrat Medium 说明，默认颜色 #7C706A。'],
    'content.offer.image.url': ['优惠券图片', '替换完整优惠券视觉；正式输出请填写公开 HTTPS 图片地址。'],
    'content.offer.image.alt': ['优惠券图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.hero.image.url': ['场景图片', '替换正方形场景图；正式输出请填写公开 HTTPS 图片地址。'],
    'content.hero.image.alt': ['场景图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.cta.text': ['主 CTA 文字', '居中的 SHOP NOW 操作按钮文字。'],
    'content.cta.url': ['主 CTA 链接', '点击 SHOP NOW 后打开的公开 HTTPS 活动页。'],
    'settings.navigation.visible': ['显示顶部导航', '关闭后移除整行导航及其高度，其他内容位置保持不变。'],
    'settings.color.surface': ['组件背景色', '仅修改 600px / 375px 组件画布内的 #F5F2ED 底色。'],
    'settings.color.promotion': ['顶部导航底色', '仅修改顶部促销导航的棕色底色。'],
    'settings.color.heading': ['主标题颜色', '仅修改 Fall Home Refresh 标题颜色。'],
    'settings.color.body': ['副标题颜色', '默认 #7C706A，仅修改居中副标题颜色。'],
    'settings.color.action': ['主 CTA 背景色', '仅修改与场景图叠层的 SHOP NOW 按钮底色。']
  },
  'gift.rewardGrid2': {
    'content.reward.title': ['赠品区主标题', '显示在两条赠品规则上方的主标题。'],
    'content.reward.rules[0]': ['第一条赠品规则', '显示在主标题下方的第一条满额赠品说明。'],
    'content.reward.rules[1]': ['第二条赠品规则', '显示在第一条规则下方的第二条满额赠品说明。'],
    'content.reward.items[0].image.url': ['上方赠品图片', '替换第一张完整赠品活动图；填写公开 HTTPS 图片地址。'],
    'content.reward.items[0].image.alt': ['上方赠品图片说明', '第一张赠品图无法显示时供读屏工具识别的简短说明。'],
    'content.reward.items[1].image.url': ['下方赠品图片', '替换第二张完整赠品活动图；填写公开 HTTPS 图片地址。'],
    'content.reward.items[1].image.alt': ['下方赠品图片说明', '第二张赠品图无法显示时供读屏工具识别的简短说明。']
  },
  'gift.warmRedPairIV': {"content.intro.title": ["活动标题", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.intro.rule1": ["眼罩赠品条件", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.intro.rule2": ["枕套赠品条件", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[0].image.url": ["眼罩卡片图片", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[0].image.alt": ["眼罩图片说明", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[0].clickUrl": ["眼罩图片链接", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[1].image.url": ["枕套卡片图片", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[1].image.alt": ["枕套图片说明", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "content.gifts[1].clickUrl": ["枕套图片链接", "顶部文案可编辑；卡片中的价值标签和名称属于原图，替换整张图片时一并更新。"], "settings.color.surface": ["背景色", "仅当前组件；默认匹配原图边角背景。"], "settings.color.text": ["顶部文字色", "修改标题及两行赠品条件。"]},
  'gift.showcase2': {
    'content.gifts[0].image.url': ['上方眼罩照片', '左侧照片，建议604×678px；FREE GIFTS徽章在图内，文字与CTA在右侧独立编辑。'],
    'content.gifts[0].image.alt': ['眼罩照片说明', '图片未加载或读屏工具使用的替代文本。'],
    'content.gifts[0].title': ['眼罩名称', '右上方衬线标题。'],
    'content.gifts[0].value': ['眼罩价值', '默认VALUE $59.9，不表示实际售价或自动折扣。'],
    'content.gifts[0].description': ['眼罩卖点', '默认两行卖点，保持简短以贴合原稿。'],
    'content.gifts[0].cta.text': ['眼罩CTA文字', '默认SPEND $699+。'],
    'content.gifts[0].cta.url': ['眼罩CTA链接', '独立按钮链接，默认https://freshinelife.com/；照片不绑定链接。'],
    'content.gifts[1].image.url': ['下方抱枕套照片', '右侧照片，建议596×676px；FREE GIFTS徽章在图内，文字与CTA在左侧独立编辑。'],
    'content.gifts[1].image.alt': ['抱枕套照片说明', '图片未加载或读屏工具使用的替代文本。'],
    'content.gifts[1].title': ['抱枕套名称', '左下方衬线标题，默认自然换成两行。'],
    'content.gifts[1].value': ['抱枕套价值', '默认VALUE $89.9，不表示实际售价或自动折扣。'],
    'content.gifts[1].description': ['抱枕套卖点', '默认One of Our Featured Designs。'],
    'content.gifts[1].cta.text': ['抱枕套CTA文字', '默认SPEND $999+。'],
    'content.gifts[1].cta.url': ['抱枕套CTA链接', '独立按钮链接，默认https://freshinelife.com/；照片不绑定链接。'],
    'settings.color.surface': ['图文版块底色', '设置文字区域及外部底色；不改变照片中的颜色。'],
    'settings.color.text': ['商品名称与卖点文字色', '仅作用于可编辑名称和卖点。'],
    'settings.color.accent': ['价值、CTA与标签底色', '默认#8D1B1B；同步修改价格、CTA及FREE GIFTS标签底色，标签文字、CTA文字和购物袋图标固定白色。']
  },
  'gift.doubleGiftAddressShowcase': {
    'content.intro.title': ['顶部标题', '默认 Pinch Pleat，按画布宽度自然换行。'],
    'content.intro.subtitle': ['顶部说明', '默认 Two Tiers Of Gifts With Your Order. More To Love.。'],
    'content.gifts[0].image.url': ['左侧眼罩图片', '默认为从原稿精确裁切的 524×308px 图片；填写公开 HTTPS 地址。'],
    'content.gifts[0].image.alt': ['眼罩图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.gifts[0].title': ['眼罩赠品名称', '默认 Free Silk Eye Mask；建议保持单行。'],
    'content.gifts[0].value': ['眼罩赠品价值', '默认 Value $59.9，仅为展示文案。'],
    'content.gifts[0].cta.text': ['眼罩 CTA 文字', '默认 SPEND $699+；修改门槛时同步更新赠送说明。'],
    'content.gifts[0].cta.url': ['眼罩 CTA 链接', '左侧红色满额栏的独立 HTTPS 链接；图片本身不可点击。'],
    'content.gifts[0].note': ['眼罩赠送说明', '默认满 $699 赠送眼罩；这不会创建 Shopify 赠品规则。'],
    'content.gifts[1].image.url': ['右侧抱枕套图片', '默认为从原稿精确裁切的 524×308px 图片；填写公开 HTTPS 地址。'],
    'content.gifts[1].image.alt': ['抱枕套图片说明', '图片无法显示或读屏工具使用的简短说明。'],
    'content.gifts[1].title': ['抱枕套赠品名称', '默认 Free Pillow Cover；建议保持单行。'],
    'content.gifts[1].value': ['抱枕套赠品价值', '默认 Value $89.9，仅为展示文案。'],
    'content.gifts[1].cta.text': ['抱枕套 CTA 文字', '默认 SPEND $999+；修改门槛时同步更新赠送说明。'],
    'content.gifts[1].cta.url': ['抱枕套 CTA 链接', '右侧红色满额栏的独立 HTTPS 链接；图片本身不可点击。'],
    'content.gifts[1].note': ['抱枕套赠送说明', '默认满 $999 赠送抱枕套；这不会创建 Shopify 赠品规则。'],
    'content.footer.note': ['底部提示', '默认说明赠品会自动加入购物车；仅为邮件展示文案。'],
    'settings.color.canvas': ['组件外层底色', '默认 #FFFFFF，仅修改当前组件画布。'],
    'settings.color.card': ['赠品卡片底色', '默认 #F7F3EF，同时作用于两张卡片的文字区。'],
    'settings.color.text': ['主要文字色', '修改顶部标题、赠品名称及图片 Alt 降级文字。'],
    'settings.color.accent': ['价值与 CTA 红色', '默认 #991B1B；同时修改两组价值文案和 CTA 底色。'],
    'settings.color.muted': ['辅助文字色', '修改顶部说明、两条赠送规则和底部提示。']
  },
  'gift.verticalImagePair': {
    'content.images[0].url': ['上方赠品整图', '替换上方完整赠品图片；建议使用 1200×676px 的公开 HTTPS PNG 或 JPG。'],
    'content.images[0].alt': ['上方赠品图片说明', '上方图片无法显示或读屏工具使用的简短说明。'],
    'content.images[1].url': ['下方赠品整图', '替换下方完整赠品图片；建议使用 1200×676px 的公开 HTTPS PNG 或 JPG。'],
    'content.images[1].alt': ['下方赠品图片说明', '下方图片无法显示或读屏工具使用的简短说明。'],
    'content.gift.linkUrl': ['两张赠品图点击链接', '上、下两张整图共用的公开 HTTPS 链接；默认带 Omnisend cover-rc 追踪参数。']
  },
  'review.trustpilotImage': {
    'content.reviews[0].author': ['评论 1：评论者', '第一张评论卡的评论者姓名。'],
    'content.reviews[0].title': ['评论 1：标题', '第一张评论卡的评论标题。'],
    'content.reviews[0].body': ['评论 1：正文', '第一张评论卡的正文内容。'],
    'content.reviews[0].date': ['评论 1：日期', '第一张评论卡右上方显示的日期。'],
    'content.reviews[1].author': ['评论 2：评论者', '第二张评论卡的评论者姓名。'],
    'content.reviews[1].title': ['评论 2：标题', '第二张评论卡的评论标题。'],
    'content.reviews[1].body': ['评论 2：正文', '第二张评论卡的正文内容。'],
    'content.reviews[1].date': ['评论 2：日期', '第二张评论卡右上方显示的日期。']
  },
  'hero.lateSummerSale': {
    'content.brand.logo.url': ['品牌 Logo 图片', '替换夏末折扣首图顶部使用的品牌 Logo 图片。'],
    'settings.color.body': ['正文文字色', '修改活动补充说明的文字颜色。']
  },
  'hero.gradientScenePromotion': {
    'content.hero.backgroundImage.url': ['场景背景图', '替换 600×761px 渐变头图使用的场景背景；建议正方形或接近正方形高清图。'],
    'content.hero.backgroundImage.alt': ['场景图说明', '背景图无法显示或读屏工具使用的简短说明。'],
    'content.hero.linkUrl': ['整张头图点击链接', '点击 Logo、文案或场景区域时统一打开的公开 HTTPS 活动链接。'],
    'content.brand.logo.url': ['圆形 Logo 图片', '替换文案上方的圆形 Logo；建议使用正方形透明 PNG。'],
    'content.brand.logo.alt': ['Logo 图片说明', 'Logo 无法显示或读屏工具使用的简短说明。'],
    'content.hero.eyebrow': ['活动名称', '默认 Late Summer Sale；建议保持单行短文案。'],
    'content.hero.title': ['主折扣标题', '默认 UP TO 70% Off；建议保持单行短文案。'],
    'content.hero.subtitle': ['活动补充说明', '默认 EXTRA $600OFF&UP TO 20%OFF SITEWIDE；建议保持单行。'],
    'settings.color.surface': ['背景与降级色', '默认 #FBFAF8；用于组件底色及不支持背景图时的降级显示。'],
    'settings.color.text': ['活动文字色', '统一修改活动名称、主折扣和补充说明的颜色。']
  },
  'hero.circleLogoSceneOverlay': {
    'content.hero.backgroundImage.url': ['场景背景图', '替换 600×761px 圆标叠字头图使用的竖版场景；建议使用接近 1216×1522px 比例的高清图。'],
    'content.hero.backgroundImage.alt': ['场景图说明', '背景图无法显示或读屏工具使用的简短说明。'],
    'content.hero.linkUrl': ['整张头图点击链接', '点击 Logo、文案或场景区域时统一打开的公开 HTTPS 链接。'],
    'content.brand.logo.url': ['圆形 Logo 图片', '替换顶部圆形 Logo；建议使用正方形透明 PNG。'],
    'content.brand.logo.alt': ['Logo 图片说明', 'Logo 无法显示或读屏工具使用的简短说明。'],
    'content.hero.eyebrow': ['活动名称', '显示在主折扣上方；建议保持单行短文案。'],
    'content.hero.title': ['主折扣标题', '显示在画布下半部中央；建议保持单行。'],
    'content.hero.subtitle': ['活动补充说明', '使用一个字段在固定宽度内自然换行；建议保持两行以内。'],
    'settings.color.surface': ['图片降级底色', '默认 #C8B79D；用于图片无法显示时的降级背景。'],
    'settings.color.text': ['叠加文字颜色', '统一修改活动名称、主折扣和补充说明的颜色。']
  },
  'hero.sceneOverlayCta2': {
    'content.navigation.message': ['导航促销文案', '显示在顶部左侧 76% 区域；建议保持一行短文案。'],
    'content.navigation.cta.text': ['导航按钮文字', '显示在顶部右侧下划线链接内；建议保持简短。'],
    'content.navigation.cta.url': ['导航按钮链接', '点击顶部右侧导航按钮后打开的公开 HTTPS 链接。'],
    'content.hero.backgroundImage.url': ['场景背景图', '替换 600×632px Labor Day 场景头图背景；建议使用接近默认竖版比例的高清图。'],
    'content.hero.backgroundImage.alt': ['场景图说明', '背景图无法显示或读屏工具使用的简短说明。'],
    'content.hero.linkUrl': ['整张头图点击链接', '点击导航下方的 Logo、文案或场景区域时统一打开的公开 HTTPS 链接。'],
    'content.brand.logo.url': ['品牌 Logo 图片', '替换场景上方的 104px Logo；建议使用正方形透明 PNG。'],
    'content.brand.logo.alt': ['Logo 图片说明', 'Logo 无法显示或读屏工具使用的简短说明。'],
    'content.hero.eyebrow': ['活动名称', '默认 Labor Day Sale；建议保持单行短文案。'],
    'content.hero.title': ['主折扣标题', '默认 UP TO 65% Off；建议保持单行短文案。'],
    'content.hero.subtitle': ['活动补充说明', '置于 410px 内容区并自然换行；建议保持两行以内。'],
    'settings.navigation.visible': ['显示顶部导航', '关闭后会完整移除 56px 顶部导航；其余场景主体位置保持不变。'],
    'settings.color.navigationLeft': ['导航左侧底色', '默认 #981E20，仅作用于顶部左侧促销文案区域。'],
    'settings.color.navigationRight': ['导航右侧底色', '默认 #891718，仅作用于顶部右侧链接区域。'],
    'settings.color.navigationText': ['导航文字色', '统一修改顶部促销文案与导航链接颜色。'],
    'settings.color.surface': ['图片降级底色', '默认 #3C2D25；用于背景图无法显示时的降级显示。'],
    'settings.color.text': ['叠加文字颜色', '统一修改 Logo 下方的三层活动文案。']
  },
  'navigation.promotionCta': {
    'content.promotion.title': ['活动名称', '显示在促销 CTA 区块顶部的居中文字。']
  },
  'navigation.eventCountdown': {
    'content.countdown.title': ['倒计时标题', '默认 ONLY 3 DAYS!；这是可编辑静态文案，不会按日期自动递减。'],
    'content.promotion.cta.text': ['活动按钮文字', '显示在活动倒计时区块底部按钮内的文字。'],
    'content.promotion.cta.url': ['活动按钮链接', '点击活动倒计时按钮后打开的公开 HTTPS 页面。']
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
  },
  'footer.minimalContact': {
    'settings.color.background': ['页脚背景色', '修改简约联系页脚的浅色背景。'],
    'settings.color.text': ['页脚正文颜色', '修改地址、电话和版权文字颜色。'],
    'settings.color.link': ['页脚链接颜色', '修改支持邮箱与退订链接颜色。']
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
  const scenePriceSixMatch = componentKey === 'collection.sceneSaleGrid6PriceWithTitle' && group === 'content'
    ? key.match(/^saleItems\[([0-5])\]\.(discountLabel|image\.url|image\.alt|image\.clickUrl|name|price\.current|price\.compareAt)$/u) : null;
  if (scenePriceSixMatch) {
    const item = Number(scenePriceSixMatch[1]) + 1;
    const copy = {
      discountLabel: ['折扣标签', '图片左上角矩形标签；留空隐藏，Shopify 导入会按价格自动计算。'],
      'image.url': ['方形主图', '填写公开 HTTPS 图片地址，或导入所选 Shopify 商品。'],
      'image.alt': ['图片说明', '图片的可访问性说明。'],
      'image.clickUrl': ['商品链接', '点击方形商品图后打开；导入时自动保留 cover-rc UTM。'],
      name: ['商品名称', '显示在图片下方；导入时填入 Shopify 完整商品名。'],
      'price.current': ['折扣价', '醒目显示；导入时更新为首个可售变体价格。'],
      'price.compareAt': ['原价', '带删除线；无有效 compare-at 价格时留空。']
    }[scenePriceSixMatch[2]];
    return { label: `商品 ${item} ${copy[0]}`, help: copy[1] };
  }
  const detailSixMatch = componentKey === 'collection.saleGrid6DetailWithTitle' && group === 'content'
    ? key.match(/^saleItems\[([0-5])\]\.(discountLabel|image\.url|image\.alt|image\.clickUrl|name|price\.current|price\.compareAt|cta\.text)$/u) : null;
  if (detailSixMatch) {
    const item = Number(detailSixMatch[1]) + 1;
    const copy = {
      discountLabel: ['折扣标签', '图片右上角圆标；填写 SAVE 40% 可分行显示，百分比加粗；留空隐藏。Shopify 导入自动计算。'],
      'image.url': ['主图', '填写公开 HTTPS 图片地址，或导入所选 Shopify 商品。'],
      'image.alt': ['图片说明', '图片的可访问性说明。'],
      'image.clickUrl': ['商品链接', '图片和 CTA 共用此链接；导入时保留指定 UTM。'],
      name: ['名称', '纯文本，导入时填入完整商品名。'],
      'price.current': ['折扣价', '导入时更新为首个可售变体价格。'],
      'price.compareAt': ['原价', '带删除线；无有效划线价时留空。'],
      'cta.text': ['CTA', '默认 SHOP NOW，商品导入保留当前按钮文案。']
    }[detailSixMatch[2]];
    return { label: `商品 ${item} ${copy[0]}`, help: copy[1] };
  }
  const summerNameMatch = componentKey === 'collection.saleGrid6' && key.match(/^saleItems\[([0-5])\]\.name$/u);
  if (summerNameMatch) return { label: `商品 ${Number(summerNameMatch[1]) + 1} 名称`, help: '显示在图片下方的商品名称，Shopify 导入时自动填入，可手动修改。' };
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
