const structureOrder = ['头图', '活动商品组件', '通用图片组件', '评论组件', '小样-产品', '赠品与权益组件', '地址组件', '页脚组件'];

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
  'collection.saleGrid6': {
    content: ['saleCollection.title', 'saleCollection.body', 'saleCollection.cta.text', 'saleCollection.cta.url'],
    settings: ['color.theme', 'color.surface']
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
    settings: ['color.surface', 'color.title', 'color.subtitle', 'color.action', 'color.detailFrame', 'color.detailShadow']
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
  'promotion.title': ['顶部活动标题', '显示在商品主图上方的居中标题。'],
  'promotion.subtitle': ['顶部活动说明', '显示在顶部活动标题下方的居中说明。'],
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
  'color.surface': ['组件背景色', '仅修改当前组件的底色，不影响邮件整体背景。'],
  'color.heading': ['标题文字色', '修改活动名称和主折扣标题的文字颜色。'],
  'color.text': ['组件文字色', '仅修改当前组件的文字颜色。'],
  'color.action': ['CTA 操作色', '仅修改当前组件 CTA 的按钮或强调色。'],
  'color.badge': ['促销角标底色', '仅修改商品主图左上角促销角标的背景色。'],
  'color.title': ['标题文字色', '仅修改当前组件标题的文字颜色。'],
  'color.subtitle': ['副标题文字色', '仅修改当前组件副标题的文字颜色。'],
  'color.detailFrame': ['细节图边框色', '修改产品细节图的外框颜色。'],
  'color.detailShadow': ['细节图投影底色', '修改细节图右侧和底部的邮件安全投影底板颜色。'],
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
  'footer.warm': {
    'settings.color.text': ['页脚正文颜色', '修改页脚的常规文字颜色。'],
    'settings.color.link': ['页脚链接颜色', '修改联系邮箱与退订链接的颜色。']
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
