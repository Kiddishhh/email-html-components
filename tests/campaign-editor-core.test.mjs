import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEditorCatalog,
  createCampaignDocument,
  addComponentInstance,
  applySaleGridImport,
  reorderComponentInstances,
  buildLocalAssetMap
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import {
  editableFieldKeys,
  editorFieldCopy,
  editorInputDisplay,
  normalizeHexColor,
  structuresForCatalog,
  styleKeysForStructure
} from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import * as editorUiContract from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const currentKeys = JSON.parse(readFileSync(`${workspaceRoot}/组件清单.json`, 'utf8')).map(({ componentKey }) => componentKey);

test('editor catalog exposes every registered component as a freely selectable style', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });

  assert.deepEqual(catalog.map(({ componentKey }) => componentKey), currentKeys);
  for (const component of catalog) {
    assert.equal(existsSync(component.demoPath), true, `${component.componentKey} demo must exist`);
    assert.equal(component.defaultContent.componentKey, component.componentKey);
    assert.equal(component.defaultSettings.componentKey, component.componentKey);
  }
});

test('editor groups styles by structure before selection and exposes only Skill-directed edits', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });

  assert.deepEqual(structuresForCatalog(catalog), ['头图', '导航组件', '活动商品组件', '评论组件', '小样-产品', '赠品与权益组件', '地址组件', '页脚组件']);
  assert.deepEqual(styleKeysForStructure(catalog, '头图'), ['hero.promotionalOverlay', 'hero.countdownOverlay', 'hero.countdownOverlay2', 'hero.lateSummerSale', 'hero.gradientScenePromotion', 'hero.circleLogoSceneOverlay', 'hero.sceneOverlayCta', 'hero.sceneOverlayCta2', 'hero.romanShadeDiscount']);
  assert.deepEqual(editableFieldKeys('hero.sceneOverlayCta'), {
    content: ['hero.backgroundImage.url', 'hero.backgroundImage.alt', 'hero.title', 'hero.subtitle.line1', 'hero.subtitle.line2', 'hero.cta.text', 'hero.cta.url'],
    settings: ['navigation.visible', 'color.text', 'color.action']
  });
  assert.deepEqual(styleKeysForStructure(catalog, '导航组件'), ['navigation.promotionCta', 'navigation.eventCountdown']);
  assert.deepEqual(styleKeysForStructure(catalog, '评论组件'), ['image.clickableFullWidth', 'review.trustpilotImage', 'review.textList2', 'review.sceneComparison']);
  assert.deepEqual(editableFieldKeys('review.trustpilotImage'), {
    content: ['reviews[0].author', 'reviews[0].title', 'reviews[0].body', 'reviews[0].date', 'reviews[1].author', 'reviews[1].title', 'reviews[1].body', 'reviews[1].date'],
    settings: []
  });
  assert.deepEqual(editableFieldKeys('navigation.promotionCta'), {
    content: ['promotion.title', 'promotion.divider.url', 'promotion.divider.alt', 'promotion.offer', 'promotion.body', 'promotion.cta.text', 'promotion.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  });
  assert.deepEqual(styleKeysForStructure(catalog, '小样-产品'), [
    'product.sampleProductRecommendationLeft',
    'product.sampleProductRecommendationRight',
    'product.curtainRecommendationOverlay',
    'product.curtainRecommendationNoTitle',
    'product.sampleStyle1'
  ]);
  assert.deepEqual(styleKeysForStructure(catalog, '赠品与权益组件'), ['gift.rewardGrid2', 'gift.showcase2', 'gift.doubleGiftAddressShowcase', 'gift.verticalImagePair', 'image.benefitsStrip3', 'image.benefitsStrip4', 'image.benefitsStrip4TwoRows', 'image.benefitsAddressCard', 'tool.measurementCard', 'tool.freeMeasurementGuidance']);
  assert.deepEqual(styleKeysForStructure(catalog, '地址组件'), ['location.showroomCard']);
  assert.deepEqual(styleKeysForStructure(catalog, '页脚组件'), ['footer.warm', 'footer.doubleDivider', 'footer.minimalContact']);
  assert.deepEqual(editableFieldKeys('footer.warm'), { content: [], settings: ['color.background', 'color.text', 'color.link'] });
  assert.deepEqual(editableFieldKeys('footer.doubleDivider'), {
    content: [],
    settings: ['color.canvas', 'color.background', 'color.text', 'color.link']
  });
  assert.deepEqual(editableFieldKeys('footer.minimalContact'), {
    content: [],
    settings: ['color.background', 'color.text', 'color.link']
  });
  assert.deepEqual(editableFieldKeys('gift.rewardGrid2'), {
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
  });
  assert.deepEqual(editableFieldKeys('location.showroomCard'), {
    content: [],
    settings: ['color.surface']
  });
  assert.deepEqual(editableFieldKeys('tool.measurementCard'), {
    content: ['measurement.image.url', 'measurement.image.alt', 'measurement.title', 'measurement.subtitle', 'measurement.cta.label', 'measurement.cta.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  });
  assert.deepEqual(editableFieldKeys('image.clickableFullWidth'), {
    content: ['image.url', 'image.alt', 'image.linkUrl'], settings: ['color.surface']
  });
  assert.deepEqual(editableFieldKeys('product.curtainRecommendationOverlay'), {
    content: ['intro.title', 'intro.subtitle', 'product.images.scene.url', 'product.images.scene.alt', 'product.images.detail.url', 'product.images.detail.alt', 'product.name', 'product.color.label', 'product.color.value', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  });
  assert.deepEqual(editableFieldKeys('product.curtainRecommendationNoTitle'), {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.detail.url', 'product.images.detail.alt', 'product.name', 'product.color.label', 'product.color.value', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text', 'color.action']
  });
  assert.deepEqual(editableFieldKeys('product.sampleProductRecommendationLeft'), {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.fabric.url', 'product.images.fabric.alt', 'product.title', 'product.subtitle', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text']
  });
  assert.deepEqual(editableFieldKeys('product.sampleProductRecommendationRight'), {
    content: ['product.images.scene.url', 'product.images.scene.alt', 'product.images.fabric.url', 'product.images.fabric.alt', 'product.title', 'product.subtitle', 'product.cta.label', 'product.url'],
    settings: ['color.surface', 'color.text']
  });
  assert.deepEqual(editableFieldKeys('collection.curtainPromotionCard'), {
    content: [
      'promotion.title', 'promotion.subtitle', 'product.badge', 'product.image.url', 'product.image.alt',
      'product.image.clickUrl', 'product.title', 'product.description', 'product.cta.text', 'product.cta.url'
    ],
    settings: ['color.surface', 'color.badge']
  });
  assert.deepEqual(editableFieldKeys('collection.curtainPromotionCardNoTitle'), {
    content: [
      'product.badge', 'product.image.url', 'product.image.alt', 'product.image.clickUrl',
      'product.title', 'product.description', 'product.cta.text', 'product.cta.url'
    ],
    settings: ['color.surface', 'color.badge']
  });
  assert.deepEqual(editorFieldCopy('collection.curtainPromotionCard', 'content', 'product.image.clickUrl'), {
    label: '商品图片链接',
    help: '点击主图和商品标题后打开的商品或集合页面地址。'
  });
  assert.deepEqual(editorFieldCopy('collection.curtainPromotionCard', 'content', 'promotion.title'), {
    label: '顶部活动标题',
    help: '显示在商品主图上方的居中标题。'
  });
  assert.deepEqual(editorFieldCopy('collection.curtainPromotionCard', 'content', 'promotion.subtitle'), {
    label: '顶部活动说明',
    help: '显示在顶部活动标题下方的居中说明。'
  });
  assert.deepEqual(editorFieldCopy('collection.curtainPromotionCard', 'settings', 'color.badge'), {
    label: '促销角标底色',
    help: '仅修改商品主图左上角促销角标的背景色。'
  });
  assert.deepEqual(editorFieldCopy('collection.saleGrid6', 'content', 'saleCollection.body'), {
    label: '商品区说明',
    help: '显示在六宫格标题下方的活动说明。'
  });
  assert.deepEqual(editorFieldCopy('footer.warm', 'settings', 'color.background'), {
    label: '页脚背景色',
    help: '仅修改页脚底色，不影响邮件整体背景。'
  });
  assert.deepEqual(editorFieldCopy('footer.warm', 'settings', 'color.text'), {
    label: '页脚正文颜色',
    help: '修改页脚的常规文字颜色。'
  });
  assert.deepEqual(editorFieldCopy('footer.warm', 'settings', 'color.link'), {
    label: '页脚链接颜色',
    help: '修改联系邮箱与退订链接的颜色。'
  });
  assert.deepEqual(editorFieldCopy('footer.doubleDivider', 'settings', 'color.canvas'), {
    label: '页脚外层底色',
    help: '仅修改双分割线页脚的外层画布底色。'
  });
  assert.deepEqual(editorFieldCopy('gift.rewardGrid2', 'content', 'reward.title'), {
    label: '赠品区主标题',
    help: '显示在两条赠品规则上方的主标题。'
  });
  assert.deepEqual(editorFieldCopy('gift.rewardGrid2', 'content', 'reward.items[0].image.url'), {
    label: '上方赠品图片',
    help: '替换第一张完整赠品活动图；填写公开 HTTPS 图片地址。'
  });
  assert.deepEqual(editorFieldCopy('gift.rewardGrid2', 'content', 'reward.items[1].image.url'), {
    label: '下方赠品图片',
    help: '替换第二张完整赠品活动图；填写公开 HTTPS 图片地址。'
  });
  assert.equal(normalizeHexColor(' #f7eedc '), '#F7EEDC');
  assert.equal(normalizeHexColor('#F7EEDC'), '#F7EEDC');
  assert.equal(normalizeHexColor('#F7EED'), null);
  assert.equal(normalizeHexColor('F7EEDC'), null);
  assert.deepEqual(editorInputDisplay('asset://countdown-hero-2-image'), {
    value: '',
    placeholder: '当前使用组件默认图片；如需替换，请填写公开 HTTPS 图片地址。'
  });
  assert.deepEqual(editorInputDisplay('https://freshinelife.com/pages/freshine-sale'), {
    value: 'https://freshinelife.com/pages/freshine-sale',
    placeholder: ''
  });
});

test('full component library retains both countdown heroes and the benefits strip local default', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '完整组件库资源测试' });
  for (const componentKey of ['hero.countdownOverlay', 'hero.countdownOverlay2', 'image.benefitsStrip3']) {
    document = addComponentInstance(document, catalog, componentKey);
  }

  assert.deepEqual(document.components.map(({ componentKey }) => componentKey), ['hero.countdownOverlay', 'hero.countdownOverlay2', 'image.benefitsStrip3']);
  const benefits = document.components.find(({ componentKey }) => componentKey === 'image.benefitsStrip3');
  assert.equal(benefits.content['image.url'], 'asset://benefits-strip-3');
  const assets = buildLocalAssetMap(document, { workspaceRoot });
  assert.match(assets['benefits-strip-3'].path, /赠品与权益组件\/三项权益整图\/assets\/default-benefits-strip-rights-2\.jpg$/);
  for (const assetId of ['countdown-background', 'countdown-brand-logo', 'countdown-divider', 'countdown-hero-2-logo', 'countdown-hero-2-image']) {
    assert.equal(existsSync(resolve(workspaceRoot, assets[assetId].path)), true, `${assetId} should resolve to a checked-in component asset`);
  }
});

test('a campaign document permits arbitrary component choice, repetition, and order', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '自由组合测试' });

  document = addComponentInstance(document, catalog, 'footer.warm');
  document = addComponentInstance(document, catalog, 'hero.promotionalOverlay');
  document = addComponentInstance(document, catalog, 'footer.warm');
  document = reorderComponentInstances(document, 2, 0);

  assert.deepEqual(document.components.map(({ componentKey }) => componentKey), [
    'footer.warm',
    'footer.warm',
    'hero.promotionalOverlay'
  ]);
  assert.notEqual(document.components[0].instanceId, document.components[1].instanceId);
  assert.equal(document.components[2].content['hero.title'], 'UP TO 65% OFF');
});

test('preview selection resolves the selected component to its rendered component order', async () => {
  const { previewComponentIndex, previewStageScrollTop } = await import('../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs');
  assert.equal(typeof previewComponentIndex, 'function');
  assert.equal(typeof previewStageScrollTop, 'function');
  const components = [
    { instanceId: 'hero.promotionalOverlay-1' },
    { instanceId: 'collection.saleGrid6-1' },
    { instanceId: 'footer.warm-1' }
  ];

  assert.equal(previewComponentIndex(components, 'collection.saleGrid6-1'), 1);
  assert.equal(previewComponentIndex(components, 'missing-instance'), -1);
  assert.equal(previewStageScrollTop({
    stageScrollTop: 1076,
    stageTop: 200,
    frameTop: -852,
    documentTop: 1006,
    innerScroll: 0
  }), 1030);
});

test('preview alignment ignores a target from a replaced iframe', () => {
  assert.equal(typeof editorUiContract.previewTargetIsCurrent, 'function');
  const oldFrame = {};
  const currentFrame = {};
  const target = { isConnected: true };

  assert.equal(editorUiContract.previewTargetIsCurrent({
    frame: oldFrame,
    currentFrame,
    frameWindow: null,
    target
  }), false);
  assert.equal(editorUiContract.previewTargetIsCurrent({
    frame: currentFrame,
    currentFrame,
    frameWindow: {},
    target
  }), true);
});

test('pending editor fields remain bound to the component that produced them', () => {
  assert.equal(typeof editorUiContract.appendPendingEdit, 'function');
  assert.equal(typeof editorUiContract.consumePendingEdits, 'function');
  const pending = editorUiContract.appendPendingEdit(
    { instanceId: null, content: {}, settings: {} },
    { instanceId: 'gift.rewardGrid2-1', group: 'settings', key: 'color.surface', value: '#F1E8DE' }
  );
  const consumed = editorUiContract.consumePendingEdits(pending);

  assert.equal(consumed.instanceId, 'gift.rewardGrid2-1');
  assert.deepEqual(consumed.patch, { content: {}, settings: { 'color.surface': '#F1E8DE' } });
  assert.deepEqual(consumed.next, { instanceId: null, content: {}, settings: {} });
});

test('local preview asset map is derived from the selected component defaults', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '默认资源测试' });
  document = addComponentInstance(document, catalog, 'hero.promotionalOverlay');
  document = addComponentInstance(document, catalog, 'image.clickableFullWidth');
  document = addComponentInstance(document, catalog, 'gift.rewardGrid2');

  const assets = buildLocalAssetMap(document, { workspaceRoot });
  assert.match(assets['hero-logo-white'].path, /头图\/促销悬浮首图\/assets\/default-logo-white\.png$/u);
  assert.match(assets['gift-pillow-cover'].path, /赠品与权益组件\/双赠品奖励卡\/assets\/default-random-pillow-cover\.jpg$/u);
  assert.match(assets['gift-eye-mask'].path, /赠品与权益组件\/双赠品奖励卡\/assets\/default-silk-eye-mask\.jpg$/u);
  for (const asset of Object.values(assets)) assert.equal(existsSync(`${workspaceRoot}/${asset.path}`), true);
});

test('local preview asset map resolves a current component asset reference without legacy metadata', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '评论资源测试' });
  document = addComponentInstance(document, catalog, 'review.textList2');

  const assets = buildLocalAssetMap(document, { workspaceRoot });
  assert.match(assets['review-star'].path, /评论组件\/双条文字评论\/assets\/review-star\.png$/u);
});

test('every registered component has an explicit editor field contract', () => {
  const registry = JSON.parse(readFileSync(`${workspaceRoot}/组件清单.json`, 'utf8'));
  for (const { componentKey } of registry) {
    assert.doesNotThrow(() => editableFieldKeys(componentKey), componentKey);
  }

  assert.deepEqual(editableFieldKeys('product.sampleStyle1'), {
    content: [
      'product.mainImage.url', 'product.mainImage.alt',
      'product.detailImage.url', 'product.detailImage.alt',
      'product.title', 'product.subtitle', 'product.cta.text', 'product.cta.url'
    ],
    settings: ['color.surface', 'color.title', 'color.subtitle', 'color.action', 'color.detailFrame', 'color.detailBorder', 'color.detailShadow']
  });
});

test('local preview keeps left and right sample product assets distinct', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '左右小样产品预览测试' });
  document = addComponentInstance(document, catalog, 'product.sampleProductRecommendationLeft');
  document = addComponentInstance(document, catalog, 'product.sampleProductRecommendationRight');

  const assets = buildLocalAssetMap(document, { workspaceRoot });

  const paths = Object.values(assets).map(({ path }) => path);
  assert.equal(new Set(Object.keys(assets)).size, 4);
  assert.equal(paths.filter((path) => /小样-产品\/小样产品推荐卡（左）\/assets\//u.test(path)).length, 2);
  assert.equal(paths.filter((path) => /小样-产品\/小样产品推荐卡（右）\/assets\//u.test(path)).length, 2);
});

test('sale-grid import updates only the selected six-grid instance with its Shopify data', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '商品导入测试' });
  document = addComponentInstance(document, catalog, 'collection.saleGrid6');
  document = addComponentInstance(document, catalog, 'collection.saleGrid6');

  const imported = applySaleGridImport(document, document.components[1].instanceId, {
    collection: { handle: 'freshine-sale', url: 'https://freshinelife.com/collections/freshine-sale' },
    ctaUrl: 'https://freshinelife.com/pages/back-to-school-refresh',
    items: Array.from({ length: 6 }, (_, index) => ({
      image: { url: `https://cdn.example.com/${index}.jpg`, alt: `Curtain ${index}` },
      linkUrl: `https://freshinelife.com/products/curtain-${index}`,
      discountLabel: `SAVE ${index + 10}%`
    }))
  });

  assert.equal(imported.components[0].content['saleItems[0].image.url'], document.components[0].content['saleItems[0].image.url']);
  assert.equal(imported.components[1].content['saleItems[0].image.url'], 'https://cdn.example.com/0.jpg');
  assert.equal(imported.components[1].content['saleItems[5].image.clickUrl'], 'https://freshinelife.com/products/curtain-5');
  assert.equal(imported.components[1].content['saleCollection.cta.url'], 'https://freshinelife.com/pages/back-to-school-refresh');
  assert.equal(imported.components[1].source, 'shopify-sale-grid:freshine-sale');
  assert.equal(imported.components[1].confirmed, false);
});

test('sale-grid backend Collection import keeps the existing public CTA while marking its admin-only source', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '后台 Collection 导入测试' });
  document = addComponentInstance(document, catalog, 'collection.saleGrid6');
  const originalCtaUrl = document.components[0].content['saleCollection.cta.url'];

  const imported = applySaleGridImport(document, document.components[0].instanceId, {
    collection: { handle: 'private-curtain-sale' },
    collectionSource: { type: 'admin-handle' },
    items: Array.from({ length: 6 }, (_, index) => ({
      image: { url: `https://cdn.example.com/private-${index}.jpg`, alt: `Private curtain ${index}` },
      linkUrl: `https://freshinelife.com/products/curtain-${index}`,
      discountLabel: ''
    }))
  });

  assert.equal(imported.components[0].content['saleCollection.cta.url'], originalCtaUrl);
  assert.equal(imported.components[0].source, 'shopify-sale-grid-admin:private-curtain-sale');
});

for (const componentKey of ['collection.saleGrid4', 'collection.saleGrid4WithTitle', 'collection.productGrid4NoSidePadding']) test(`${componentKey} product import changes only the requested card in the selected component instance`, async () => {
  const { applySaleGrid4ProductImport } = await import('../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs');
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '四宫格独立商品导入测试' });
  assert.ok(catalog.some((item) => item.componentKey === componentKey), `${componentKey} must be registered`);
  document = addComponentInstance(document, catalog, componentKey);
  document = addComponentInstance(document, catalog, componentKey);
  const untouchedInstance = structuredClone(document.components[0]);
  const untouchedFirstCard = structuredClone(document.components[1].content);

  const imported = applySaleGrid4ProductImport(document, document.components[1].instanceId, 2, {
    product: {
      handle: 'elara-linen-curtains',
      image: { url: 'https://cdn.example.com/elara-primary.webp', alt: 'Elara linen curtains' },
      linkUrl: 'https://freshinelife.com/products/elara-linen-curtains',
      title: 'Elara Linen Curtains',
      description: 'Light-filtering linen drapes',
      discountLabel: 'SAVE 45%'
    }
  });

  assert.deepEqual(imported.components[0], untouchedInstance);
  assert.equal(imported.components[1].content['saleItems[2].image.url'], 'https://cdn.example.com/elara-primary.webp');
  assert.equal(imported.components[1].content['saleItems[2].image.alt'], 'Elara linen curtains');
  assert.equal(imported.components[1].content['saleItems[2].image.clickUrl'], 'https://freshinelife.com/products/elara-linen-curtains');
  assert.equal(imported.components[1].content['saleItems[2].discountLabel'], 'SAVE 45%');
  assert.equal(imported.components[1].content['saleItems[0].image.url'], untouchedFirstCard['saleItems[0].image.url']);
  if (['collection.saleGrid4WithTitle', 'collection.productGrid4NoSidePadding'].includes(componentKey)) {
    assert.equal(imported.components[1].content['saleItems[2].cta.text'], 'Elara Linen Curtains');
    assert.equal(imported.components[1].content['saleCollection.cta.url'], untouchedFirstCard['saleCollection.cta.url']);
    assert.equal(imported.components[1].content['saleItems[0].cta.text'], untouchedFirstCard['saleItems[0].cta.text']);
    for (const title of [undefined, '', '   ', 123]) {
      assert.throws(() => applySaleGrid4ProductImport(document, document.components[1].instanceId, 2, {
        product: { handle: 'invalid-title', image: { url: 'https://cdn.example.com/image.jpg' }, linkUrl: 'https://freshinelife.com/products/invalid-title', discountLabel: '', title }
      }), /incomplete product data/);
    }
  }
  assert.deepEqual(imported.components[1].settings, document.components[1].settings);
  assert.deepEqual(document.components[1].content, untouchedFirstCard);
  assert.equal(imported.components[1].source, 'shopify-product:elara-linen-curtains:slot-3');
  assert.equal(imported.components[1].confirmed, false);
  assert.equal(imported.confirmed, false);
});

test('detail four-grid import updates one card with UTM link, full title and prices while preserving plain CTA copy', async () => {
  const { applySaleGrid4ProductImport } = await import('../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs');
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '四宫格详情折扣导入测试' });
  document = addComponentInstance(document, catalog, 'collection.saleGrid4DetailWithTitle');
  document = addComponentInstance(document, catalog, 'collection.saleGrid4DetailWithTitle');
  const untouchedInstance = structuredClone(document.components[0]);
  const untouchedCard = structuredClone(document.components[1].content);

  const imported = applySaleGrid4ProductImport(document, document.components[1].instanceId, 2, {
    product: {
      handle: 'nova-semi-sheer-curtains',
      image: { url: 'https://cdn.example.com/nova-primary.webp', alt: 'Nova curtains in a bright living room' },
      linkUrl: 'https://freshinelife.com/products/nova-semi-sheer-curtains?variant=123',
      fullTitle: 'Nova Semi-Sheer Curtains for Large Windows – Elegant Drapes for Living Room & Bedroom',
      title: 'Nova Semi-Sheer Curtains for Large Windows',
      description: 'Elegant Drapes for Living Room & Bedroom',
      price: '$47.90',
      compareAtPrice: '$79.90',
      discountLabel: 'SAVE 40%'
    }
  });

  const cardPrefix = 'saleItems[2]';
  assert.deepEqual(imported.components[0], untouchedInstance);
  assert.equal(imported.components[1].content[`${cardPrefix}.image.url`], 'https://cdn.example.com/nova-primary.webp');
  assert.equal(imported.components[1].content[`${cardPrefix}.image.alt`], 'Nova curtains in a bright living room');
  assert.equal(imported.components[1].content[`${cardPrefix}.image.clickUrl`], 'https://freshinelife.com/products/nova-semi-sheer-curtains?variant=123&utm_source=omnisend&utm_medium=email&utm_id=cover-rc');
  assert.equal(imported.components[1].content[`${cardPrefix}.name`], 'Nova Semi-Sheer Curtains for Large Windows – Elegant Drapes for Living Room & Bedroom');
  assert.equal(imported.components[1].content[`${cardPrefix}.price.current`], '$47.90');
  assert.equal(imported.components[1].content[`${cardPrefix}.price.compareAt`], '$79.90');
  assert.equal(imported.components[1].content[`${cardPrefix}.discountLabel`], 'SAVE 40%');
  assert.equal(imported.components[1].content[`${cardPrefix}.cta.text`], untouchedCard[`${cardPrefix}.cta.text`]);
  assert.equal(imported.components[1].content['saleItems[0].name'], untouchedCard['saleItems[0].name']);
  assert.deepEqual(imported.components[1].settings, document.components[1].settings);
  assert.equal(imported.components[1].source, 'shopify-product:nova-semi-sheer-curtains:slot-3');
  assert.equal(imported.components[1].confirmed, false);
  assert.equal(imported.confirmed, false);
});

test('curtain promotion product import updates only product fields for either card variant', async () => {
  const { applyCurtainPromotionProductImport } = await import('../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs');
  assert.equal(typeof applyCurtainPromotionProductImport, 'function');

  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '单品窗帘导入测试' });
  document = addComponentInstance(document, catalog, 'collection.curtainPromotionCard');
  document = addComponentInstance(document, catalog, 'collection.curtainPromotionCardNoTitle');
  const originalTitleCard = document.components[0];
  const imported = applyCurtainPromotionProductImport(document, document.components[1].instanceId, {
    product: {
      handle: 'amara-extra-long-linen-curtains',
      image: { url: 'https://cdn.example.com/amara-primary.webp', alt: 'Amara curtains' },
      linkUrl: 'https://freshinelife.com/products/amara-extra-long-linen-curtains',
      title: 'Amara Extra Long Linen Curtains',
      description: 'Elegant Light-Filtering Drapes',
      discountLabel: ''
    }
  });

  assert.equal(imported.components[0].content['product.title'], originalTitleCard.content['product.title']);
  assert.equal(imported.components[1].content['product.image.url'], 'https://cdn.example.com/amara-primary.webp');
  assert.equal(imported.components[1].content['product.image.clickUrl'], 'https://freshinelife.com/products/amara-extra-long-linen-curtains');
  assert.equal(imported.components[1].content['product.cta.url'], 'https://freshinelife.com/products/amara-extra-long-linen-curtains');
  assert.equal(imported.components[1].content['product.title'], 'Amara Extra Long Linen Curtains');
  assert.equal(imported.components[1].content['product.description'], 'Elegant Light-Filtering Drapes');
  assert.equal(imported.components[1].content['product.badge'], '');
  assert.equal(imported.components[1].source, 'shopify-product:amara-extra-long-linen-curtains');
  assert.equal(imported.components[1].confirmed, false);
  assert.equal(imported.components[1].content['promotion.title'], undefined);
});
