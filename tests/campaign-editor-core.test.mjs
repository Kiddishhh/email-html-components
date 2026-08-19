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

  assert.deepEqual(structuresForCatalog(catalog), ['头图', '活动商品组件', '评论组件', '小样-产品', '赠品与权益组件', '地址组件', '页脚组件']);
  assert.deepEqual(styleKeysForStructure(catalog, '头图'), ['hero.promotionalOverlay', 'hero.countdownOverlay', 'hero.countdownOverlay2']);
  assert.deepEqual(styleKeysForStructure(catalog, '小样-产品'), [
    'product.sampleProductRecommendationLeft',
    'product.sampleProductRecommendationRight',
    'product.curtainRecommendationOverlay',
    'product.curtainRecommendationNoTitle'
  ]);
  assert.deepEqual(styleKeysForStructure(catalog, '赠品与权益组件'), ['gift.rewardGrid2', 'image.benefitsStrip3', 'tool.measurementCard']);
  assert.deepEqual(styleKeysForStructure(catalog, '地址组件'), ['location.showroomCard']);
  assert.deepEqual(editableFieldKeys('footer.warm'), { content: [], settings: ['color.background', 'color.text', 'color.link'] });
  assert.deepEqual(editableFieldKeys('gift.rewardGrid2'), { content: [], settings: [] });
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

test('full component library retains both countdown heroes and the benefits strip public default', () => {
  const catalog = buildEditorCatalog({ workspaceRoot });
  let document = createCampaignDocument({ name: '完整组件库资源测试' });
  for (const componentKey of ['hero.countdownOverlay', 'hero.countdownOverlay2', 'image.benefitsStrip3']) {
    document = addComponentInstance(document, catalog, componentKey);
  }

  assert.deepEqual(document.components.map(({ componentKey }) => componentKey), ['hero.countdownOverlay', 'hero.countdownOverlay2', 'image.benefitsStrip3']);
  const benefits = document.components.find(({ componentKey }) => componentKey === 'image.benefitsStrip3');
  assert.equal(benefits.content['image.url'], 'https://app.omnisend.com/images/6a82d6f0c5aa8a2a0174f006');
  const assets = buildLocalAssetMap(document, { workspaceRoot });
  assert.equal(assets['benefits-strip-3'], undefined);
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
