import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const builder = `${root}/build-email-template.v1.mjs`;
const componentDirectory = `${root}/通用图片组件/可链接整图`;
const productStyle1Directory = `${root}/小样/产品/样式1`;
const fixture = JSON.parse(readFileSync(`${componentDirectory}/content.fixture.v1.json`, 'utf8'));
const defaults = JSON.parse(readFileSync(`${componentDirectory}/settings.defaults.v1.json`, 'utf8'));
const campaignComponentKeys = [
  'hero.promotionalOverlay',
  'collection.saleGrid6',
  'image.clickableFullWidth',
  'gift.rewardGrid2',
  'location.showroomCard',
  'footer.warm'
];

function makeComposition(name, mutate = () => {}) {
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: `/private/tmp/${name}.html`,
    previewOutput: `/private/tmp/${name}.local-preview.html`,
    components: [{
      name: '可链接整图',
      directory: componentDirectory,
      componentKey: 'image.clickableFullWidth',
      content: {
        ...fixture.values,
        'image.alt': 'Instance review collage'
      },
      settings: {
        ...defaults.values,
        'color.surface': '#123456'
      }
    }]
  };
  mutate(composition);
  const path = `/private/tmp/${name}.composition.json`;
  writeFileSync(path, JSON.stringify(composition, null, 2));
  return { composition, path };
}

function run(path, ...args) {
  return spawnSync(process.execPath, [builder, path, ...args], { cwd: root, encoding: 'utf8' });
}

const productStyle1Settings = {
  'color.surface': '#F8F5F1',
  'color.title': '#242424',
  'color.subtitle': '#303033',
  'color.action': '#242424',
  'color.detailFrame': '#FFFFFF',
  'color.detailShadow': '#D8D1CA',
  'font.body': 'Montserrat,Arial,Helvetica,sans-serif',
  'content.maxWidth': '600px',
  'image.mainWidth': '548px',
  'image.detailWidth': '213px',
  'spacing.horizontal': '26px',
  'spacing.contentHorizontal': '42px',
  'spacing.detailOverlap': '10px',
  'spacing.detailShadow': '6px'
};

function makeProductStyle1Composition(name, mutate = () => {}) {
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#F8F5F1',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: `/private/tmp/${name}.html`,
    previewOutput: `/private/tmp/${name}.local-preview.html`,
    assets: {
      'product-main': {
        path: '小样/产品/样式1/assets/default-main-image.png',
        name: 'product-main.png'
      },
      'product-detail': {
        path: '小样/产品/样式1/assets/default-detail-image.png',
        name: 'product-detail.png'
      }
    },
    components: [{
      name: '产品样式1',
      directory: '小样/产品/样式1',
      componentKey: 'product.sampleStyle1',
      content: {
        'product.mainImage.url': 'asset://product-main',
        'product.mainImage.alt': 'Living room with sheer curtains',
        'product.detailImage.url': 'asset://product-detail',
        'product.detailImage.alt': 'White sheer curtain fabric',
        'product.title': 'Liana Sheer Curtains',
        'product.subtitle': 'Extra Long Sheer Light Drapes For Living Room & Bedroom...',
        'product.cta.text': 'SHOP NOW',
        'product.cta.url': 'https://freshinelife.com/collections/sheer-curtains'
      },
      settings: { ...productStyle1Settings }
    }]
  };
  mutate(composition);
  const path = `/private/tmp/${name}.composition.json`;
  writeFileSync(path, JSON.stringify(composition, null, 2));
  return { composition, path };
}

test('product style1 source exposes two replaceable image fields and the table-shadow geometry', () => {
  const contentSchema = JSON.parse(readFileSync(`${productStyle1Directory}/content.schema.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${productStyle1Directory}/settings.schema.v1.json`, 'utf8'));
  const productFixture = JSON.parse(readFileSync(`${productStyle1Directory}/content.fixture.v1.json`, 'utf8'));
  const productDefaults = JSON.parse(readFileSync(`${productStyle1Directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${productStyle1Directory}/component.template.v1.html`, 'utf8');

  assert.equal(contentSchema.componentKey, 'product.sampleStyle1');
  assert.equal(settingsSchema.componentKey, 'product.sampleStyle1');
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'product.mainImage.url',
    'product.mainImage.alt',
    'product.detailImage.url',
    'product.detailImage.alt',
    'product.title',
    'product.subtitle',
    'product.cta.text',
    'product.cta.url'
  ]);
  assert.equal(contentSchema.properties['product.mainImage.url'].role, 'image-source');
  assert.equal(contentSchema.properties['product.detailImage.url'].role, 'image-source');
  assert.equal(contentSchema.properties['product.cta.url'].protocol, 'https');
  assert.equal(productFixture.values['product.mainImage.url'], 'asset://product-main');
  assert.equal(productFixture.values['product.detailImage.url'], 'asset://product-detail');
  assert.equal(productDefaults.values['spacing.contentHorizontal'], '42px');
  assert.equal(productDefaults.values['spacing.detailOverlap'], '10px');
  assert.equal(productDefaults.values['spacing.detailShadow'], '6px');
  assert.equal(productDefaults.values['image.detailWidth'], '213px');
  assert.equal(productDefaults.values['font.body'], 'Montserrat,Arial,Helvetica,sans-serif');
  assert.match(template, /width="548"/);
  assert.match(template, /padding:53px \{\{settings\.spacing\.horizontal\}\} 0/);
  assert.match(template, /padding:0 \{\{settings\.spacing\.contentHorizontal\}\};/);
  assert.match(template, /<td width="59%" align="left" valign="top" style="width:59%;/);
  assert.match(template, /<td width="41%" align="right" valign="top" style="width:41%;/);
  assert.match(template, /width="194" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:194px;/);
  assert.match(template, /margin-top:-\{\{settings\.spacing\.detailOverlap\}\}/);
  assert.match(template, /padding:0 \{\{settings\.spacing\.detailShadow\}\} \{\{settings\.spacing\.detailShadow\}\} 0/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:22px;font-weight:600;line-height:150%;letter-spacing:0px;text-align:left/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:17px;font-weight:400;line-height:150%;letter-spacing:0px;text-align:left/);
  assert.match(template, /font-family:\{\{settings\.font\.body\}\};font-size:16px;font-weight:500;line-height:15px;letter-spacing:0px;text-align:center/);
  assert.doesNotMatch(template, /box-shadow|position\s*:/i);
});

test('product style1 local assets resolve together in a preview', () => {
  const { composition, path } = makeProductStyle1Composition('product-style1-local-preview');
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.match(preview, /default-main-image\.png/);
  assert.match(preview, /default-detail-image\.png/);
  assert.match(preview, /margin-top:-10px/);
  assert.match(preview, /padding:0 6px 6px 0/);
  assert.doesNotMatch(preview, /box-shadow|position\s*:/i);
});

test('product style1 final builds reject the pending local main image upload', () => {
  const { path } = makeProductStyle1Composition('product-style1-final-local-assets');
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /local asset product-main must be uploaded before final build/);
});

test('product style1 is registered generally without becoming a Campaign Skill candidate', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'product.sampleStyle1');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].输出宽度, 600);
  assert.equal(entries[0].移动端断点, 375);
  for (const relativePath of Object.values(entries[0].路径)) {
    assert.equal(existsSync(`${root}/${relativePath}`), true, `product.sampleStyle1: missing ${relativePath}`);
  }

  const demo = readFileSync(`${productStyle1Directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${productStyle1Directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));

  assert.match(demo, /375px/);
  assert.match(demo, /\.\/assets\/default-main-image\.png/);
  assert.match(demo, /\.\/assets\/default-detail-image\.png/);
  assert.match(management, /尚未加入 Campaign Skill/);
  assert.equal(structure.slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys).includes('product.sampleStyle1'), false);
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'product.sampleStyle1'), false);
});

test('renders only the complete content and settings snapshot supplied by the Skill', () => {
  const { composition, path } = makeComposition('email-builder-valid');
  const result = run(path);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(composition.output, 'utf8');
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.match(html, /alt="Instance review collage"/);
  assert.match(html, /background-color:#123456/);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
  assert.doesNotMatch(preview, /padding:0 24px/, 'preview shell must not shrink the configured 600px canvas');
});

test('renders a linked curtain promotion card with its instance background color', () => {
  const directory = `${root}/活动商品组件/单品窗帘促销卡`;
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/curtain-promotion-card.html',
    previewOutput: '/private/tmp/curtain-promotion-card.local-preview.html',
    components: [{
      name: '单品窗帘促销卡',
      directory,
      componentKey: 'collection.curtainPromotionCard',
      content: {
        'promotion.title': 'Upgrade Your Home in Style',
        'promotion.subtitle': 'Refresh Your Home With Our Latest Curtain Designs-Crafted To Bring A Clean, Modern Look And Effortless Comfort For The Year Ahead.',
        'product.badge': 'SAVE 50%',
        'product.image.url': 'https://cdn.example.com/celina-linen-curtains.jpg',
        'product.image.alt': 'Celina Linen Curtains in a bright living room',
        'product.image.clickUrl': 'https://freshinelife.com/products/celina-linen-curtains',
        'product.title': 'Celina Linen Curtains',
        'product.description': 'Elegant Floor-To-Ceiling Drapes For Living Room',
        'product.cta.text': 'SHOP NOW >>',
        'product.cta.url': 'https://freshinelife.com/products/celina-linen-curtains'
      },
      settings: {
        'color.surface': '#F4EFEA',
        'color.text': '#242321',
        'color.body': '#3B3936',
        'color.badge': '#A71E22',
        'color.badgeText': '#FFFFFF',
        'font.heading': 'Lora, Georgia, Times New Roman, serif',
        'font.body': 'Montserrat, Arial, Helvetica, sans-serif',
        'font.action': 'Montserrat, Arial, Helvetica, sans-serif',
        'spacing.header': '76px 28px 54px',
        'spacing.content': '0 28px 60px',
        'radius.badge': '0 0 6px 0'
      }
    }]
  };
  const path = '/private/tmp/curtain-promotion-card.composition.json';
  writeFileSync(path, JSON.stringify(composition, null, 2));

  const result = run(path);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(composition.output, 'utf8');
  assert.match(html, /background-color:#F4EFEA/);
  assert.match(html, /Upgrade Your Home in Style/);
  assert.match(html, /background="https:\/\/cdn\.example\.com\/celina-linen-curtains\.jpg"/);
  assert.match(html, /href="https:\/\/freshinelife\.com\/products\/celina-linen-curtains"/);
  assert.match(html, /SAVE 50%/);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

test('uses the curtain card local default image only in its local preview', () => {
  const directory = `${root}/活动商品组件/单品窗帘促销卡`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/curtain-promotion-card-default.html',
    previewOutput: '/private/tmp/curtain-promotion-card-default.local-preview.html',
    assets: {
      'curtain-promotion-default': {
        path: '活动商品组件/单品窗帘促销卡/assets/default-celina-linen-curtains-clean.png',
        name: 'default-celina-linen-curtains-clean.png'
      }
    },
    components: [{
      name: '单品窗帘促销卡',
      directory,
      componentKey: 'collection.curtainPromotionCard',
      content: fixture.values,
      settings: defaults.values
    }]
  };
  const path = '/private/tmp/curtain-promotion-card-default.composition.json';
  writeFileSync(path, JSON.stringify(composition, null, 2));

  const localResult = run(path, '--preview-local-assets');
  assert.equal(localResult.status, 0, localResult.stderr || localResult.stdout);
  assert.match(readFileSync(composition.previewOutput, 'utf8'), /default-celina-linen-curtains-clean\.png/);

  const finalResult = run(path);
  assert.notEqual(finalResult.status, 0);
  assert.match(finalResult.stderr, /local asset curtain-promotion-default must be uploaded before final build/);
});

test('renders the no-title curtain promotion card without top copy fields', () => {
  const directory = `${root}/活动商品组件/单品窗帘促销卡（无标题款）`;
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/curtain-promotion-card-no-title.html',
    previewOutput: '/private/tmp/curtain-promotion-card-no-title.local-preview.html',
    components: [{
      name: '单品窗帘促销卡（无标题款）',
      directory,
      componentKey: 'collection.curtainPromotionCardNoTitle',
      content: {
        'product.badge': 'SAVE 50%',
        'product.image.url': 'https://cdn.example.com/celina-linen-curtains.jpg',
        'product.image.alt': 'Celina Linen Curtains in a bright living room',
        'product.image.clickUrl': 'https://freshinelife.com/products/celina-linen-curtains',
        'product.title': 'Celina Linen Curtains',
        'product.description': 'Elegant Floor-To-Ceiling Drapes For Living Room',
        'product.cta.text': 'SHOP NOW >>',
        'product.cta.url': 'https://freshinelife.com/products/celina-linen-curtains'
      },
      settings: {
        'color.surface': '#F4EFEA',
        'color.text': '#242321',
        'color.body': '#3B3936',
        'color.badge': '#A71E22',
        'color.badgeText': '#FFFFFF',
        'font.body': 'Montserrat, Arial, Helvetica, sans-serif',
        'font.action': 'Montserrat, Arial, Helvetica, sans-serif',
        'spacing.content': '0 28px 60px',
        'radius.badge': '0 0 6px 0'
      }
    }]
  };
  const path = '/private/tmp/curtain-promotion-card-no-title.composition.json';
  writeFileSync(path, JSON.stringify(composition, null, 2));

  const result = run(path);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(composition.output, 'utf8');
  assert.match(html, /Celina Linen Curtains/);
  assert.doesNotMatch(html, /Upgrade Your Home in Style/);
  assert.doesNotMatch(html, /promotion\.title|promotion\.subtitle/);

  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  assert.equal(registry.find(({ componentKey }) => componentKey === 'collection.curtainPromotionCard')?.中文名称, '单品窗帘促销卡（标题款）');
  assert.equal(registry.find(({ componentKey }) => componentKey === 'collection.curtainPromotionCardNoTitle')?.中文名称, '单品窗帘促销卡（无标题款）');
});

test('renders the countdown hero styles required by its registered template', () => {
  const directory = `${root}/头图/倒计时头图`;
  const content = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/countdown-hero-css.html',
    previewOutput: '/private/tmp/countdown-hero-css.local-preview.html',
    assets: Object.fromEntries(Object.entries(content.localReferenceAssets).map(([id, relativePath]) => [id, {
      path: `头图/倒计时头图/${relativePath}`,
      name: relativePath.split('/').at(-1)
    }])),
    components: [{
      name: '倒计时头图',
      directory,
      componentKey: 'hero.countdownOverlay',
      content: content.values,
      settings: settings.values
    }]
  };
  const path = '/private/tmp/countdown-hero-css.composition.json';
  writeFileSync(path, JSON.stringify(composition, null, 2));

  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(composition.previewOutput, 'utf8');
  assert.match(html, /white-space:nowrap/);
  assert.match(html, /letter-spacing:0px/);
});

test('renders the benefits strip without its deprecated optional link field', () => {
  const directory = `${root}/赠品与权益组件/三项权益整图`;
  const content = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/benefits-strip-optional-link.html',
    previewOutput: '/private/tmp/benefits-strip-optional-link.local-preview.html',
    assets: {
      'benefits-strip-3': {
        path: '赠品与权益组件/三项权益整图/assets/default-benefits-strip-combination-i-1200.jpg',
        name: 'default-benefits-strip-combination-i-1200.jpg'
      }
    },
    components: [{
      name: '三项权益整图',
      directory,
      componentKey: 'image.benefitsStrip3',
      content: content.values,
      settings: settings.values
    }]
  };
  const path = '/private/tmp/benefits-strip-optional-link.composition.json';
  writeFileSync(path, JSON.stringify(composition, null, 2));

  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(readFileSync(composition.previewOutput, 'utf8'), /https:\/\/app\.omnisend\.com\/images\/6a82d6f0c5aa8a2a0174f006/);
});

test('rejects an incomplete content snapshot', () => {
  const { path } = makeComposition('email-builder-missing-content', (composition) => {
    delete composition.components[0].content['image.alt'];
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing content keys: image\.alt/);
});

test('rejects an incomplete settings snapshot', () => {
  const { path } = makeComposition('email-builder-missing-setting', (composition) => {
    delete composition.components[0].settings['color.surface'];
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing settings keys: color\.surface/);
});

test('rejects legacy theme-driven component overrides', () => {
  const { path } = makeComposition('email-builder-legacy-theme', (composition) => {
    composition.theme = 'themes/default-canvas.theme.v1.json';
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown composition keys: theme/);
});

test('resolves registered local image assets only in local preview mode', () => {
  const { composition, path } = makeComposition('email-builder-local-preview', (value) => {
    value.assets = {
      'review-collage': {
        path: '通用图片组件/可链接整图/assets/default-review-collage.png',
        name: 'review-collage.png'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-collage';
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.ok(preview.includes('%E9%80%9A%E7%94%A8%E5%9B%BE%E7%89%87%E7%BB%84%E4%BB%B6/%E5%8F%AF%E9%93%BE%E6%8E%A5%E6%95%B4%E5%9B%BE/assets/'));
  assert.match(preview, /default-review-collage\.png/);
  assert.doesNotMatch(preview, /file:\/\//, 'local preview assets must also load through the local HTTP preview server');
});

test('resolves a local preview asset relative to a nested preview HTML file', () => {
  const { composition, path } = makeComposition('email-builder-nested-local-preview', (value) => {
    value.previewOutput = '/private/tmp/freshine-preview-test/nested/email.local-preview.html';
    value.assets = {
      'review-collage': {
        path: '通用图片组件/可链接整图/assets/default-review-collage.png',
        name: 'review-collage.png'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-collage';
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  const renderedUrl = preview.match(/src="([^"]*default-review-collage\.png)"/u)?.[1];
  assert.ok(renderedUrl, 'preview must render the local image source');
  assert.equal(
    fileURLToPath(new URL(renderedUrl, pathToFileURL(composition.previewOutput))),
    `${root}/通用图片组件/可链接整图/assets/default-review-collage.png`
  );
});

test('blocks a final Omnisend build until every local asset has an HTTPS URL', () => {
  const { path } = makeComposition('email-builder-unresolved-asset', (value) => {
    value.assets = {
      'review-collage': {
        path: '通用图片组件/可链接整图/assets/default-review-collage.png',
        name: 'review-collage.png'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-collage';
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /local asset review-collage must be uploaded before final build/);
});

test('builds a validated upload source with registered local assets deferred for the fixed uploader', () => {
  const { composition, path } = makeComposition('email-builder-deferred-assets', (value) => {
    value.assets = {
      'review-collage': {
        path: '通用图片组件/可链接整图/assets/default-review-collage.png',
        name: 'review-collage.png'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-collage';
  });
  const result = run(path, '--defer-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = readFileSync(composition.output, 'utf8');
  assert.match(output, /src="asset:\/\/review-collage"/);
});

test('the registry preserves the six fixed Campaign components while allowing optional components', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const fixedCampaignKeys = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'))
    .slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys);

  assert.deepEqual(fixedCampaignKeys, campaignComponentKeys);
  const registryKeys = new Set(registry.map(({ componentKey }) => componentKey));
  assert.equal(fixedCampaignKeys.every((componentKey) => registryKeys.has(componentKey)), true);
  for (const entry of registry) {
    for (const relativePath of Object.values(entry.路径)) {
      assert.equal(existsSync(`${root}/${relativePath}`), true, `${entry.componentKey}: missing ${relativePath}`);
    }
    const componentDirectory = `${root}/${entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/u, '')}`;
    assert.equal(existsSync(`${componentDirectory}/效果演示.html`), true, `${entry.componentKey}: missing 效果演示.html`);
  }
});

test('every committed composition uses complete snapshots accepted by the current assembler', () => {
  for (const filename of ['hero-grid-review-gifts-location.default.v1.json']) {
    const result = run(`${root}/compositions/${filename}`, '--preview-local-assets');
    assert.equal(result.status, 0, `${filename}: ${result.stderr || result.stdout}`);
  }
});

test('the six-component campaign ends with the complete brand footer snapshot', () => {
  const composition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  assert.deepEqual(composition.components.map(({ componentKey }) => componentKey), [
    'hero.promotionalOverlay',
    'collection.saleGrid6',
    'image.clickableFullWidth',
    'gift.rewardGrid2',
    'location.showroomCard',
    'footer.warm'
  ]);

  for (const instance of composition.components) {
    const contentSchema = JSON.parse(readFileSync(`${root}/${instance.directory}/content.schema.v1.json`, 'utf8'));
    const settingsSchema = JSON.parse(readFileSync(`${root}/${instance.directory}/settings.schema.v1.json`, 'utf8'));
    assert.deepEqual(Object.keys(instance.content).sort(), Object.keys(contentSchema.properties).sort(), `${instance.componentKey} content snapshot`);
    assert.deepEqual(Object.keys(instance.settings).sort(), Object.keys(settingsSchema.properties).sort(), `${instance.componentKey} settings snapshot`);
  }
});

test('builds the six-component local preview with local assets and an Omnisend unsubscribe footer', () => {
  const path = `${root}/compositions/hero-grid-review-gifts-location.default.v1.json`;
  const composition = JSON.parse(readFileSync(path, 'utf8'));
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(`${root}/${composition.previewOutput}`, 'utf8');
  for (const filename of [
    'default-background.reference.png',
    'default-logo-white.png',
    'default-review-collage.png',
    'default-random-pillow-cover.jpg',
    'default-silk-eye-mask.jpg'
  ]) assert.ok(preview.includes(filename), `${filename} must appear in the preview`);
  assert.match(preview, /<!-- 组件：品牌信息页脚 -->/);
  assert.match(preview, /href="\[\[unsubscribe_link\]\]"/);
});

test('the promotional hero expands only its narrow-screen minimum while preserving the desktop maximum', () => {
  const directory = `${root}/头图/促销悬浮首图`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const styles = readFileSync(`${directory}/component.styles.v1.css`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));

  assert.match(template, /max-height:722px;min-height:560px/);
  assert.match(styles, /max-height:722px; min-height:560px/);
  assert.match(template, /padding:0 10px \{\{settings\.spacing\.panelBottom\}\};text-align:center;vertical-align:bottom/);
  assert.equal(defaults.values['spacing.panelBottom'], '32px');
  assert.doesNotMatch(template, /min-height:480px/);
  assert.doesNotMatch(styles, /min-height:480px/);
});

test('the promotional hero preserves the legacy logo size while applying the confirmed translucent white-logo style', () => {
  const directory = `${root}/头图/促销悬浮首图`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const schema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const composition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  const hero = composition.components.find(({ componentKey }) => componentKey === 'hero.promotionalOverlay');

  assert.match(template, /width="106" height="106"/);
  assert.match(template, /bgcolor="\{\{settings\.color\.logoBadge\}\}"/);
  assert.match(template, /background-color:\{\{settings\.color\.logoBadgeTransparent\}\}/);
  assert.match(template, /border-radius:53px/);
  assert.match(template, /width="80" data-freshine-slot="hero\.logo"/);
  assert.doesNotMatch(template, /71\.6667vw|55vw/);
  assert.equal(defaults.values['color.logoBadge'], '#A79689');
  assert.equal(defaults.values['color.logoBadgeTransparent'], 'rgba(167, 150, 137, 0.70)');
  assert.equal(defaults.values['spacing.logoTop'], '48px');
  assert.equal(defaults.values['logo.maxWidth'], '80px');
  assert.equal(schema.properties['color.logoBadgeTransparent'].default, 'rgba(167, 150, 137, 0.70)');
  assert.equal(fixture.values['hero.logo.url'], 'asset://hero-logo-white');
  assert.equal(hero.content['hero.logo.url'], 'asset://hero-logo-white');
  assert.equal(hero.settings['color.logoBadgeTransparent'], 'rgba(167, 150, 137, 0.70)');
  assert.equal(composition.assets['hero-logo-white'].path, '头图/促销悬浮首图/assets/default-logo-white.png');
});

test('the showroom card renders the confirmed full-width reference proportion while retaining an editable surface color', () => {
  const directory = `${root}/赠品与权益组件/展厅地址卡`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const schema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const defaultComposition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  const defaultCard = defaultComposition.components.find(({ componentKey }) => componentKey === 'location.showroomCard');

  assert.match(template, /width="600"/);
  assert.match(template, /max-width:\{\{settings\.content\.maxWidth\}\}/);
  assert.match(template, /width="548" height="324"/);
  assert.match(template, /max-width:\{\{settings\.image\.maxWidth\}\};height:auto/);
  assert.equal(defaults.values['content.maxWidth'], '600px');
  assert.equal(defaults.values['image.maxWidth'], '548px');
  assert.equal(schema.properties['color.surface'].skillPrompt, true);
  assert.equal(schema.properties['content.maxWidth'].default, '600px');
  assert.equal(schema.properties['image.maxWidth'].default, '548px');
  assert.equal(defaultCard.settings['content.maxWidth'], '600px');
  assert.equal(defaultCard.settings['image.maxWidth'], '548px');
});

test('the footer renders its appointment disclaimer as an address-style line before the phone number', () => {
  const directory = `${root}/页脚组件/品牌信息页脚`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const schema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaultComposition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  const defaultFooter = defaultComposition.components.find(({ componentKey }) => componentKey === 'footer.warm');
  const countryPosition = template.indexOf('footer.address.line4');
  const disclaimerPosition = template.indexOf('footer.address.disclaimer');
  const phonePosition = template.indexOf('footer.address.line5');

  assert.ok(schema.properties['footer.address.disclaimer'], 'footer disclaimer must be declared in the content schema');
  assert.equal(schema.properties['footer.address.disclaimer'].required, true);
  assert.equal(fixture.values['footer.address.disclaimer'], '(Appointment Only. No Mail, Packages, Or Deliveries Accepted.)');
  assert.equal(defaultFooter.content['footer.address.disclaimer'], '(Appointment Only. No Mail, Packages, Or Deliveries Accepted.)');
  assert.ok(countryPosition < disclaimerPosition && disclaimerPosition < phonePosition, 'the disclaimer must stay between country and phone');
  assert.match(template, /data-freshine-slot="footer\.address\.disclaimer" style="color:\{\{settings\.color\.text\}\};font-family:\{\{settings\.font\.body\}\};font-size:11px;font-weight:400;line-height:17px;text-align:center;"/);
});

test('the footer follows the approved information hierarchy while retaining its existing default colors', () => {
  const directory = `${root}/页脚组件/品牌信息页脚`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const schema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const skill = readFileSync(`${root}/skills/build-omnisend-campaign-draft/SKILL.md`, 'utf8');
  const interactions = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`, 'utf8');

  assert.match(template, /max-width:\{\{settings\.content\.width\}\}/);
  assert.match(template, /font-size:17px;font-weight:600;line-height:22px/);
  assert.match(template, /height="1" bgcolor="#C9B99B"/);
  assert.match(template, /padding:0 5px/);
  assert.match(template, /color:\{\{settings\.color\.text\}\}[^>]*font-size:11px;font-weight:400;line-height:17px/);
  assert.match(template, /color:\{\{settings\.color\.link\}\}[^>]*text-decoration:none/);
  assert.match(template, /href="\[\[unsubscribe_link\]\]"/);
  assert.equal(defaults.values['color.link'], '#F4D8A7');
  assert.equal(defaults.values['space.sectionY'], '32px');
  assert.equal(defaults.values['content.width'], '440px');
  assert.equal(schema.properties['color.link'].default, '#F4D8A7');
  assert.equal(schema.properties['space.sectionY'].default, '32px');
  assert.equal(schema.properties['content.width'].default, '440px');
  assert.match(demo, /max-width:440px/);
  assert.match(management, /440px/);
  assert.match(management, /#F4D8A7/);
  assert.doesNotMatch(management, /下划线/);
  assert.match(skill, /精致暖棕信息层级/);
  assert.match(interactions, /精致暖棕信息层级/);
});

test('the footer renders seven social icons in the approved display order with complete default links', () => {
  const directory = `${root}/页脚组件/品牌信息页脚`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const schema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const composition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  const defaultFooter = composition.components.find(({ componentKey }) => componentKey === 'footer.warm');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const interactions = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`, 'utf8');

  const orderedSlots = [
    'footer.social.youtubeUrl',
    'footer.social.instagramUrl',
    'footer.social.facebookUrl',
    'footer.social.tiktokUrl',
    'footer.social.pinterestUrl',
    'footer.social.whatsappUrl',
    'footer.social.threadsUrl'
  ];
  const positions = orderedSlots.map((slot) => template.indexOf(`data-freshine-href-slot="${slot}"`));

  assert.ok(positions.every((position) => position >= 0));
  assert.ok(positions.every((position, index) => index === 0 || positions[index - 1] < position));
  for (const key of ['footer.social.facebookUrl', 'footer.social.whatsappUrl', 'footer.social.threadsUrl', 'footer.image.5.url', 'footer.image.6.url', 'footer.image.7.url']) {
    assert.ok(schema.properties[key], `${key} must be declared in the full content snapshot`);
    assert.ok(key in fixture.values, `${key} must be present in the default fixture`);
    assert.ok(key in defaultFooter.content, `${key} must be present in the default composition`);
  }
  assert.equal(fixture.values['footer.social.facebookUrl'], 'https://www.facebook.com/freshinecurtains/');
  assert.equal(fixture.values['footer.social.threadsUrl'], 'https://www.threads.com/@freshinecurtains');
  assert.equal(fixture.values['footer.social.whatsappUrl'], 'https://api.whatsapp.com/send/?phone=17477171985&text=Hello&type=phone_number&app_absent=0');
  assert.match(demo, /facebook\.com\/freshinecurtains/);
  assert.match(demo, /threads\.com\/@freshinecurtains/);
  assert.match(demo, /api\.whatsapp\.com\/send/);
  assert.match(management, /Facebook、WhatsApp、Threads/);
  assert.match(interactions, /七个社交媒体链接及图标/);
});

test('all six sale cards use identical centered wrappers and symmetric spacing', () => {
  const directory = `${root}/活动商品组件/六宫格夏季促销`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const wrappers = [...template.matchAll(/<table class="freshine-sale-stack[^"]*"[^>]*>/g)].map(([tag]) => tag);

  assert.equal(wrappers.length, 6);
  for (const wrapper of wrappers) {
    assert.match(wrapper, /width="250"/);
    assert.match(wrapper, /style="width:100%;max-width:250px;"/);
    assert.doesNotMatch(wrapper, /align="(?:left|right)"/);
  }
  assert.equal((template.match(/align="center" valign="top" style="padding:0 7px 20px;"/g) ?? []).length, 6);
  assert.equal((template.match(/class="freshine-sale-image-table"[^>]*align="center"/g) ?? []).length, 6);
  assert.doesNotMatch(template, /padding:0 14px 20px 0|padding:0 0 20px 14px/);
});

test('the sale grid CTA aligns with the outer edges of the two desktop product images', () => {
  const directory = `${root}/活动商品组件/六宫格夏季促销`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const skill = readFileSync(`${root}/skills/build-omnisend-campaign-draft/SKILL.md`, 'utf8');
  const interactions = readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/component-interactions.zh-CN.md`, 'utf8');

  assert.match(template, /<td align="center" style="padding:8px 0 42px;">\s*<table role="presentation" width="486"[^>]*style="width:100%;max-width:486px;border-collapse:separate;margin:0 auto;">/s);
  assert.match(demo, /<td align="center" style="padding:8px 0 42px;">\s*<table role="presentation" width="486"[^>]*style="width:100%;max-width:486px;border-collapse:separate;margin:0 auto;">/s);
  for (const source of [management, skill, interactions]) {
    assert.match(source, /CTA.*486px/s);
    assert.match(source, /width:100%.*max-width:486px/s);
  }
});

test('the sale grid uses the double-gift title and subtitle type scale', () => {
  const saleGrid = `${root}/活动商品组件/六宫格夏季促销`;
  const gifts = `${root}/赠品与权益组件/双赠品奖励卡`;
  const template = readFileSync(`${saleGrid}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${saleGrid}/效果演示.html`, 'utf8');
  const giftTemplate = readFileSync(`${gifts}/component.template.v1.html`, 'utf8');

  assert.match(template, /data-freshine-slot="saleCollection\.title" style="[^\"]*font-size:26px;font-weight:400;line-height:36px/);
  assert.match(template, /data-freshine-slot="saleCollection\.body" style="[^\"]*font-size:15px;font-weight:400;line-height:22px/);
  assert.match(demo, /data-freshine-slot="saleCollection\.title" style="[^\"]*font-size:26px;font-weight:400;line-height:36px/);
  assert.match(demo, /data-freshine-slot="saleCollection\.body" style="[^\"]*font-size:15px;font-weight:400;line-height:22px/);
  assert.match(giftTemplate, /data-freshine-slot="reward\.title" style="[^\"]*font-size:26px;font-weight:400;line-height:36px/);
  assert.match(giftTemplate, /data-freshine-slot="reward\.rules\[0\]" style="[^\"]*font-size:15px;font-weight:400;line-height:22px/);
});

test('the default upper gift links to the pillow-cover collection', () => {
  const directory = `${root}/赠品与权益组件/双赠品奖励卡`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const target = 'https://freshinelife.com/collections/pillow-covers';

  assert.equal(fixture.values['reward.items[0].url'], target);
  assert.match(demo, new RegExp(`<a href="${target}" data-freshine-href-slot="reward\\.items\\[0\\]\\.url"`));
});

test('the default benefits image uses the approved Omnisend URL', () => {
  const directory = `${root}/赠品与权益组件/三项权益整图`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const target = 'https://app.omnisend.com/images/6a82d6f0c5aa8a2a0174f006';

  assert.equal(fixture.values['image.url'], target);
  assert.match(demo, new RegExp(`<img src="${target}"`));
});

test('clickable image defaults to a 600px full-bleed canvas while preserving per-instance overrides', () => {
  const directory = `${root}/通用图片组件/可链接整图`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const styles = readFileSync(`${directory}/component.styles.v1.css`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const schema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const heroTemplate = readFileSync(`${root}/头图/促销悬浮首图/component.template.v1.html`, 'utf8');
  const defaultComposition = JSON.parse(readFileSync(`${root}/compositions/hero-grid-review-gifts-location.default.v1.json`, 'utf8'));
  const current = defaultComposition.components.find(({ componentKey }) => componentKey === 'image.clickableFullWidth');

  assert.match(template, /class="freshine-component freshine-clickable-full-image"[^>]*width="100%"/);
  assert.match(template, /<img[^>]*width="100%"[^>]*data-freshine-slot="image"/);
  assert.doesNotMatch(styles, /max-width:\s*552px/);
  assert.equal(defaults.values['spacing.outer'], '0');
  assert.equal(defaults.values['image.maxWidth'], '600px');
  assert.equal(schema.properties['image.maxWidth'].default, '600px');
  assert.match(demo, /class="freshine-component freshine-clickable-full-image"[^>]*max-width:600px/);
  assert.match(management, /默认.*600px.*全宽.*零外边距/s);
  assert.match(heroTemplate, /freshine-promotional-overlay-hero"[^>]*width="100%"/);
  assert.equal(current.settings['spacing.outer'], '0');
  assert.equal(current.settings['image.maxWidth'], '600px');
});

const textReviewDirectory = `${root}/评论组件/双条文字评论`;

function makeTextReviewComposition(name, {
  directory = textReviewDirectory,
  background = '#FDFCFB',
  content = {}
} = {}) {
  const textReviewFixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const textReviewDefaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = `/private/tmp/${name}.html`;
  const previewOutput = `/private/tmp/${name}.local-preview.html`;
  const path = `/private/tmp/${name}.composition.json`;
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FDFCFB',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    assets: {
      'review-star': {
        path: '评论组件/双条文字评论/assets/review-star.png',
        name: 'review-star.png'
      }
    },
    components: [{
      name: '双条文字评论',
      directory,
      componentKey: 'review.textList2',
      content: { ...textReviewFixture.values, ...content },
      settings: { ...textReviewDefaults.values, 'color.surface': background }
    }]
  }, null, 2));
  return { output, previewOutput, path };
}

test('the text review list renders fifteen fixed decorative stars without links or unresolved slots', () => {
  const { previewOutput, path } = makeTextReviewComposition('text-review-list-2-render', { background: '#EAF8F3' });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.equal((html.match(/class="freshine-review-summary-star"/g) ?? []).length, 5);
  assert.equal((html.match(/class="freshine-review-item-star"/g) ?? []).length, 10);
  assert.equal((html.match(/alt=""/g) ?? []).length, 15);
  assert.match(html, /background-color:#EAF8F3/);
  assert.doesNotMatch(html, /<a\b|\bCTA\b/i);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [index, key] of [
  'summary.ratingText',
  'summary.reviewCountText',
  'review.1.author',
  'review.1.date',
  'review.1.title',
  'review.1.body',
  'review.2.author',
  'review.2.date',
  'review.2.title',
  'review.2.body'
].entries()) {
  test(`the text review list escapes ${key} only inside its matching slot`, () => {
    const token = `editable-${String(index + 1).padStart(2, '0')}`;
    const raw = `${token} & <${key}>`;
    const escaped = `${token} &amp; &lt;${key}&gt;`;
    const { previewOutput, path } = makeTextReviewComposition(`text-review-list-2-${token}`, { content: { [key]: raw } });
    const result = run(path, '--preview-local-assets');

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = readFileSync(previewOutput, 'utf8');
    const slotPattern = new RegExp(`<!-- FRESHINE_SLOT_START:${escapeRegex(key)} -->([\\s\\S]*?)<!-- FRESHINE_SLOT_END:${escapeRegex(key)} -->`);
    const slot = html.match(slotPattern)?.[1];
    assert.ok(slot?.includes(escaped), `${key}: escaped value must render in its matching slot`);
    assert.equal((html.match(new RegExp(token, 'g')) ?? []).length, 1);
    assert.equal(html.includes(raw), false);
  });
}

for (const [label, background] of [
  ['short hex', '#FFF'],
  ['missing hash', 'FDFCFB'],
  ['non-hex digit', '#FDFCFZ'],
  ['rgba function', 'rgba(253,252,251,1)'],
  ['trailing newline', '#FDFCFB\n']
]) {
  test(`the text review list rejects ${label} as a full #RRGGBB surface color`, () => {
    const { path } = makeTextReviewComposition(`text-review-list-2-invalid-surface-${label.replaceAll(' ', '-')}`, { background });
    const result = run(path, '--preview-local-assets');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /review\.textList2: settings\.color\.surface (?:does not match pattern|contains unsafe characters)/);
  });
}

test('the assembler reports an invalid settings Schema pattern separately from a bad value', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'freshine-review-pattern-'));
  const tempDirectory = join(tempRoot, '双条文字评论');
  cpSync(textReviewDirectory, tempDirectory, { recursive: true });
  const schemaPath = join(tempDirectory, 'settings.schema.v1.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  schema.properties['color.surface'].pattern = '[';
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  const { path } = makeTextReviewComposition('text-review-list-2-invalid-pattern', { directory: tempDirectory });
  const result = run(path, '--preview-local-assets');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /review\.textList2: settings schema color\.surface has invalid pattern/);
});

test('the text review list accepts an absolute HTTPS star image in a final build', () => {
  const { output, path } = makeTextReviewComposition('text-review-list-2-public-https-star', {
    content: { 'star.image.url': 'https://cdn.example.com/review-star.png' }
  });
  const result = run(path);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(readFileSync(output, 'utf8'), /src="https:\/\/cdn\.example\.com\/review-star\.png"/);
});

for (const [label, value] of [
  ['hostname-less HTTPS', 'https:'],
  ['mailto', 'mailto:star@example.com'],
  ['telephone', 'tel:123']
]) {
  test(`the text review list rejects ${label} for a URL field declaring protocol https`, () => {
    const { path } = makeTextReviewComposition(`text-review-list-2-invalid-star-${label.replaceAll(' ', '-')}`, {
      content: { 'star.image.url': value }
    });
    const result = run(path);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /review\.textList2: content\.star\.image\.url must be an absolute https URL/);
  });
}

test('URL fields without a protocol declaration retain the existing https, mailto, and tel behavior', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'freshine-review-no-protocol-'));
  const tempDirectory = join(tempRoot, '双条文字评论');
  cpSync(textReviewDirectory, tempDirectory, { recursive: true });
  const schemaPath = join(tempDirectory, 'content.schema.v1.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  delete schema.properties['star.image.url'].protocol;
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

  for (const [label, value] of [
    ['https', 'https://cdn.example.com/review-star.png'],
    ['mailto', 'mailto:star@example.com'],
    ['tel', 'tel:123']
  ]) {
    const { path } = makeTextReviewComposition(`text-review-list-2-no-protocol-${label}`, {
      directory: tempDirectory,
      content: { 'star.image.url': value }
    });
    const result = run(path);
    assert.equal(result.status, 0, `${label}: ${result.stderr || result.stdout}`);
  }
});

test('the final text review build still blocks its registered asset until upload', () => {
  const { path } = makeTextReviewComposition('text-review-list-2-final-local-star');
  const result = run(path);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /local asset review-star must be uploaded before final build/);
});

test('the two-review list is registered generally without becoming a Campaign Skill candidate', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'review.textList2');
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));
  const template = readFileSync(`${textReviewDirectory}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${textReviewDirectory}/效果演示.html`, 'utf8');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].输出宽度, 600);
  assert.equal((template.match(/content\.star\.image\.url/g) ?? []).length, 15);
  assert.equal((demo.match(/(?:\.\/)?assets\/review-star\.png/g) ?? []).length, 15);
  assert.doesNotMatch(template, /<a\b|href=|cta/i);
  assert.equal(structure.slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys).includes('review.textList2'), false);
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'review.textList2'), false);
});

test('the left sample product recommendation card is registered with its two-image Liana reference layout without becoming a Campaign Skill candidate', () => {
  const directory = `${root}/小样-产品/小样产品推荐卡（左）`;
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'product.sampleProductRecommendationLeft');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].中文名称, '小样产品推荐卡（左）');
  assert.equal(entries[0].分类, '小样-产品');
  assert.equal(entries[0].输出宽度, 600);
  assert.equal(entries[0].路径.组件模板, '小样-产品/小样产品推荐卡（左）/component.template.v1.html');
  for (const filename of [
    'component.template.v1.html',
    'component.styles.v1.css',
    'content.schema.v1.json',
    'content.fixture.v1.json',
    'settings.schema.v1.json',
    'settings.defaults.v1.json',
    'COMPONENT_MANAGEMENT.zh-CN.v1.md',
    '效果演示.html',
    'assets/default-liana-sheer-curtains.png',
    'assets/default-liana-sheer-fabric.png'
  ]) {
    assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);
  }

  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const readme = readFileSync(`${root}/README.md`, 'utf8');
  const index = readFileSync(`${root}/组件索引.md`, 'utf8');
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FAF9F7',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/sample-product-recommendation.static-safe.html',
    previewOutput: '/private/tmp/sample-product-recommendation.local-preview.html',
    assets: Object.fromEntries(Object.entries(fixture.localReferenceAssets).map(([id, path]) => [id, {
      path: `小样-产品/小样产品推荐卡（左）/${path}`,
      name: path.split('/').at(-1)
    }])),
    components: [{
      name: '小样产品推荐卡（左）',
      directory,
      componentKey: 'product.sampleProductRecommendationLeft',
      content: fixture.values,
      settings: settings.values
    }]
  };
  const compositionPath = '/private/tmp/sample-product-recommendation.composition.json';
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const renderResult = run(compositionPath, '--preview-local-assets');
  const preview = readFileSync(composition.previewOutput, 'utf8');

  assert.match(template, /width="319"/);
  assert.match(template, /width="197"/);
  assert.match(template, /width="32"/);
  assert.match(template, /data-freshine-slot="product\.images\.scene"/);
  assert.match(template, /data-freshine-slot="product\.images\.fabric"/);
  assert.match(template, /data-freshine-slot="product\.title"/);
  assert.match(template, /data-freshine-slot="product\.subtitle"/);
  assert.match(template, /data-freshine-href-slot="product\.url"/);
  assert.match(template, /data-freshine-slot="product\.title" style="[^"]*font-size:18px;font-weight:600;line-height:26px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.match(template, /data-freshine-slot="product\.subtitle" style="[^"]*font-size:12px;font-weight:400;line-height:18px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.match(template, /data-freshine-href-slot="product\.url" target="_blank" style="[^"]*font-size:14px;font-weight:500;line-height:17px;letter-spacing:0;text-align:left;text-decoration:underline;text-underline-offset:3px;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'product.images.scene.url',
    'product.images.scene.alt',
    'product.images.fabric.url',
    'product.images.fabric.alt',
    'product.title',
    'product.subtitle',
    'product.cta.label',
    'product.url'
  ]);
  assert.equal(fixture.values['product.title'], 'Liana');
  assert.equal(fixture.values['product.subtitle'], 'Sheer Curtains');
  assert.equal(fixture.values['product.cta.label'], 'SHOP NOW <');
  assert.equal(fixture.values['product.url'], 'https://freshinelife.com/');
  assert.equal(settings.values['color.surface'], '#FAF9F7');
  assert.equal(settings.values['font.body'], 'Montserrat, Arial, Helvetica, sans-serif');
  assert.equal(JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8')).properties['font.body'].default, 'Montserrat, Arial, Helvetica, sans-serif');
  assert.match(template, /data-freshine-slot="product\.title" style="[^"]*font-family:\{\{settings\.font\.body\}\};font-size:18px;font-weight:600;line-height:26px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.match(template, /data-freshine-slot="product\.subtitle" style="[^"]*font-size:12px;font-weight:400;line-height:18px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.match(template, /data-freshine-href-slot="product\.url" target="_blank" style="[^"]*font-size:14px;font-weight:500;line-height:17px;letter-spacing:0;text-align:left;text-decoration:underline;text-underline-offset:3px;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
  assert.doesNotMatch(template, /<style\b|@media|display:\s*(?:flex|grid)/i);
  assert.match(demo, /\.\/assets\/default-liana-sheer-curtains\.png/);
  assert.match(demo, /\.\/assets\/default-liana-sheer-fabric\.png/);
  assert.match(demo, /fonts\.googleapis\.com\/css2\?family=Montserrat:wght@400;500;600;700/);
  assert.match(demo, /font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:18px;font-weight:600;line-height:26px;letter-spacing:0;text-align:left;white-space:nowrap;/);
  assert.match(demo, /font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:12px;font-weight:400;line-height:18px;letter-spacing:0;text-align:left;white-space:nowrap;/);
  assert.match(demo, /font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:14px;font-weight:500;line-height:17px;letter-spacing:0;text-align:left;text-decoration:underline;text-underline-offset:3px;white-space:nowrap;/);
  assert.doesNotMatch(demo, /@media|display:\s*(?:flex|grid)/i);
  assert.match(readme, /小样产品推荐卡（左）.*product\.sampleProductRecommendationLeft/s);
  assert.match(index, /小样-产品[\s\S]*小样产品推荐卡/s);
  assert.equal(renderResult.status, 0, renderResult.stderr || renderResult.stdout);
  assert.match(preview, /width="319"/);
  assert.match(preview, /width="197"/);
  assert.ok(preview.includes('%E5%B0%8F%E6%A0%B7-%E4%BA%A7%E5%93%81/%E5%B0%8F%E6%A0%B7%E4%BA%A7%E5%93%81%E6%8E%A8%E8%8D%90%E5%8D%A1%EF%BC%88%E5%B7%A6%EF%BC%89/assets/default-liana-sheer-curtains.png'));
  assert.ok(preview.includes('%E5%B0%8F%E6%A0%B7-%E4%BA%A7%E5%93%81/%E5%B0%8F%E6%A0%B7%E4%BA%A7%E5%93%81%E6%8E%A8%E8%8D%90%E5%8D%A1%EF%BC%88%E5%B7%A6%EF%BC%89/assets/default-liana-sheer-fabric.png'));
  assert.equal(structure.slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys).includes('product.sampleProductRecommendationLeft'), false);
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'product.sampleProductRecommendationLeft'), false);
});

test('the sample product recommendation cards expose distinct left and right variants', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const variants = [
    ['product.sampleProductRecommendationLeft', '小样产品推荐卡（左）', '小样-产品/小样产品推荐卡（左）'],
    ['product.sampleProductRecommendationRight', '小样产品推荐卡（右）', '小样-产品/小样产品推荐卡（右）']
  ];
  for (const [key, name, directory] of variants) {
    const entry = registry.find(({ componentKey }) => componentKey === key);
    const template = readFileSync(`${root}/${directory}/component.template.v1.html`, 'utf8');
    assert.ok(entry, `missing ${key} registry entry`);
    assert.equal(entry.中文名称, name);
    assert.equal(entry.路径.组件模板, `${directory}/component.template.v1.html`);
    assert.equal(existsSync(`${root}/${directory}/效果演示.html`), true, `missing ${name} preview`);
    assert.match(template, /data-freshine-href-slot="product\.url" target="_blank" style="display:block;[^\"]*text-align:left;/);
    assert.match(template, /width="197"/);
    assert.match(template, /data-freshine-slot="product\.title" style="[^"]*font-family:\{\{settings\.font\.body\}\};font-size:18px;font-weight:600;line-height:26px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
    assert.match(template, /data-freshine-slot="product\.subtitle" style="[^"]*font-size:12px;font-weight:400;line-height:18px;letter-spacing:0;text-align:left;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
    assert.match(template, /data-freshine-href-slot="product\.url" target="_blank" style="[^"]*font-size:14px;font-weight:500;line-height:17px;letter-spacing:0;text-align:left;text-decoration:underline;text-underline-offset:3px;white-space:nowrap;word-break:normal;overflow-wrap:normal;/);
    assert.doesNotMatch(template, /data-freshine-href-slot="product\.url" target="_blank" style="display:inline-block;/);
  }
});

test('the curtain recommendation overlay card reproduces the 600px editorial product layout without becoming a Campaign Skill candidate', () => {
  const directory = `${root}/小样-产品/窗帘产品推荐卡II`;
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'product.curtainRecommendationOverlay');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].中文名称, '窗帘产品推荐卡II（标题版）');
  assert.equal(entries[0].分类, '小样-产品');
  assert.equal(entries[0].输出宽度, 600);
  assert.equal(entries[0].路径.组件模板, '小样-产品/窗帘产品推荐卡II/component.template.v1.html');
  for (const filename of [
    'component.template.v1.html',
    'component.styles.v1.css',
    'content.schema.v1.json',
    'content.fixture.v1.json',
    'settings.schema.v1.json',
    'settings.defaults.v1.json',
    'COMPONENT_MANAGEMENT.zh-CN.v1.md',
    '效果演示.html',
    'assets/default-celina-bedroom.png',
    'assets/default-celina-khaki-detail.png'
  ]) {
    assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);
  }

  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const readme = readFileSync(`${root}/README.md`, 'utf8');
  const index = readFileSync(`${root}/组件索引.md`, 'utf8');
  const composition = {
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FAF9F7',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: '/private/tmp/curtain-recommendation-overlay.static-safe.html',
    previewOutput: '/private/tmp/curtain-recommendation-overlay.local-preview.html',
    assets: Object.fromEntries(Object.entries(fixture.localReferenceAssets).map(([id, path]) => [id, {
      path: `小样-产品/窗帘产品推荐卡II/${path}`,
      name: path.split('/').at(-1)
    }])),
    components: [{
      name: '窗帘产品推荐卡II（标题版）',
      directory,
      componentKey: 'product.curtainRecommendationOverlay',
      content: fixture.values,
      settings: settings.values
    }]
  };
  const compositionPath = '/private/tmp/curtain-recommendation-overlay.composition.json';
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const renderResult = run(compositionPath, '--preview-local-assets');
  const preview = renderResult.status === 0 ? readFileSync(composition.previewOutput, 'utf8') : '';

  assert.match(template, /width="548"/);
  assert.match(template, /width="296"/);
  assert.match(template, /width="252"/);
  assert.match(template, /width="548" height="495" data-freshine-slot="product\.images\.scene"/);
  assert.match(template, /width="237"[^>]*margin:0 10px 0 auto/);
  assert.match(template, /width="217" height="245" data-freshine-slot="product\.images\.detail"/);
  assert.match(template, /padding:79px 0 0 18px/);
  assert.match(template, /width:45\.9854015%;padding:28px 0 0;vertical-align:top;text-align:right;/);
  assert.match(template, /padding:9px;background-color:#FFFFFF;border:1px solid #D8D0C5;/);
  assert.match(template, /data-freshine-slot="intro\.title"/);
  assert.match(template, /data-freshine-slot="intro\.subtitle"/);
  assert.doesNotMatch(template, /data-freshine-slot="intro\.subtitle\.line[123]"/);
  assert.match(template, /data-freshine-slot="product\.images\.scene"/);
  assert.match(template, /data-freshine-slot="product\.images\.detail"/);
  assert.match(template, /data-freshine-slot="product\.name"/);
  assert.match(template, /data-freshine-slot="product\.color\.value"/);
  assert.match(template, /data-freshine-slot="product\.cta\.label"/);
  assert.match(template, /data-freshine-href-slot="product\.url"/);
  assert.match(template, /background-color:\{\{settings\.color\.action\}\}/);
  assert.match(template, /border-radius:30px/);
  assert.match(template, /font-family:\{\{settings\.font\.display\}\}/);
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'intro.title',
    'intro.subtitle',
    'product.images.scene.url',
    'product.images.scene.alt',
    'product.images.detail.url',
    'product.images.detail.alt',
    'product.name',
    'product.color.label',
    'product.color.value',
    'product.cta.label',
    'product.url'
  ]);
  assert.equal(fixture.values['intro.title'], 'Upgrade Your Home in Style');
  assert.equal(fixture.values['intro.subtitle'], 'Refresh Your Home With Our Latest Curtain Designs-Crafted To Bring A Clean, Modern Look And Effortless Comfort For The Year Ahead.');
  assert.equal(fixture.values['product.name'], 'Celina Linen Curtains');
  assert.equal(fixture.values['product.color.value'], 'Khaki 8823-5');
  assert.equal(fixture.values['product.cta.label'], 'SHOP NOW');
  assert.equal(settings.values['color.action'], '#9D1D20');
  assert.equal(settings.values['font.display'], 'Lora, Georgia, Times New Roman, serif');
  assert.doesNotMatch(template, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|clamp\(|white-space:pre-line/i);
  assert.match(demo, /\.\/assets\/default-celina-bedroom\.png/);
  assert.match(demo, /\.\/assets\/default-celina-khaki-detail\.png/);
  assert.match(demo, /data-freshine-slot="intro\.subtitle" style="[^"]*word-break:break-word;overflow-wrap:anywhere;/);
  assert.doesNotMatch(demo, /data-freshine-slot="intro\.subtitle\.line[123]"/);
  assert.doesNotMatch(demo, /@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|clamp\(|white-space:pre-line/i);
  assert.ok(readme.includes('窗帘产品推荐卡II（标题版，`product.curtainRecommendationOverlay`'));
  assert.match(index, /小样-产品[\s\S]*窗帘产品推荐卡II/s);
  assert.equal(renderResult.status, 0, renderResult.stderr || renderResult.stdout);
  assert.match(preview, /width="548"/);
  assert.match(preview, /margin:0 10px 0 auto/);
  assert.match(preview, /padding:28px 0 0;vertical-align:top;text-align:right;/);
  assert.match(preview, /border:1px solid #D8D0C5/);
  assert.ok(preview.includes('%E5%B0%8F%E6%A0%B7-%E4%BA%A7%E5%93%81/%E7%AA%97%E5%B8%98%E4%BA%A7%E5%93%81%E6%8E%A8%E8%8D%90%E5%8D%A1II/assets/default-celina-bedroom.png'));
  const finalComposition = structuredClone(composition);
  finalComposition.output = '/private/tmp/curtain-recommendation-overlay.final.html';
  finalComposition.previewOutput = '/private/tmp/curtain-recommendation-overlay.final-preview.html';
  delete finalComposition.assets;
  finalComposition.components[0].content = {
    ...fixture.values,
    'product.images.scene.url': 'https://cdn.example.com/celina-bedroom.png',
    'product.images.detail.url': 'https://cdn.example.com/celina-detail.png'
  };
  const finalPath = '/private/tmp/curtain-recommendation-overlay.final.composition.json';
  writeFileSync(finalPath, JSON.stringify(finalComposition, null, 2));
  const finalResult = run(finalPath);
  assert.equal(finalResult.status, 0, finalResult.stderr || finalResult.stdout);
  assert.match(readFileSync(finalComposition.output, 'utf8'), /https:\/\/cdn\.example\.com\/celina-bedroom\.png/);
  assert.equal(structure.slots.flatMap(({ candidateComponentKeys }) => candidateComponentKeys).includes('product.curtainRecommendationOverlay'), false);
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'product.curtainRecommendationOverlay'), false);
});

test('the no-title curtain recommendation card keeps the editorial product layout without rendering header content', () => {
  const directory = `${root}/小样-产品/窗帘产品推荐卡II（无标题版）`;
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'product.curtainRecommendationNoTitle');

  assert.equal(entries.length, 1);
  assert.equal(entries[0].中文名称, '窗帘产品推荐卡II（无标题版）');
  assert.equal(entries[0].分类, '小样-产品');
  assert.equal(entries[0].输出宽度, 600);
  assert.equal(entries[0].路径.组件模板, '小样-产品/窗帘产品推荐卡II（无标题版）/component.template.v1.html');
  for (const filename of [
    'component.template.v1.html',
    'component.styles.v1.css',
    'content.schema.v1.json',
    'content.fixture.v1.json',
    'settings.schema.v1.json',
    'settings.defaults.v1.json',
    'COMPONENT_MANAGEMENT.zh-CN.v1.md',
    '效果演示.html',
    'assets/default-celina-bedroom.png',
    'assets/default-celina-khaki-detail.png'
  ]) {
    assert.equal(existsSync(`${directory}/${filename}`), true, `missing ${filename}`);
  }

  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const readme = readFileSync(`${root}/README.md`, 'utf8');
  const index = readFileSync(`${root}/组件索引.md`, 'utf8');
  const composition = {
    schemaVersion: 1,
    canvas: { backgroundColor: '#FAF9F7', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output: '/private/tmp/curtain-recommendation-no-title.static-safe.html',
    previewOutput: '/private/tmp/curtain-recommendation-no-title.local-preview.html',
    assets: Object.fromEntries(Object.entries(fixture.localReferenceAssets).map(([id, path]) => [id, { path: `小样-产品/窗帘产品推荐卡II（无标题版）/${path}`, name: path.split('/').at(-1) }])),
    components: [{ name: '窗帘产品推荐卡II（无标题版）', directory, componentKey: 'product.curtainRecommendationNoTitle', content: fixture.values, settings: settings.values }]
  };
  const compositionPath = '/private/tmp/curtain-recommendation-no-title.composition.json';
  writeFileSync(compositionPath, JSON.stringify(composition, null, 2));
  const renderResult = run(compositionPath, '--preview-local-assets');

  assert.match(template, /width="548" height="495" data-freshine-slot="product\.images\.scene"/);
  assert.match(template, /padding:79px 0 0 18px/);
  assert.match(template, /width:45\.9854015%;padding:28px 0 0;vertical-align:top;text-align:right;/);
  assert.match(template, /width="237"[^>]*margin:0 10px 0 auto/);
  assert.match(template, /padding:9px;background-color:#FFFFFF;border:1px solid #D8D0C5;/);
  assert.doesNotMatch(template, /intro\.|Upgrade Your Home in Style/);
  assert.deepEqual(Object.keys(contentSchema.properties), [
    'product.images.scene.url', 'product.images.scene.alt', 'product.images.detail.url', 'product.images.detail.alt',
    'product.name', 'product.color.label', 'product.color.value', 'product.cta.label', 'product.url'
  ]);
  assert.equal(fixture.values['product.name'], 'Celina Linen Curtains');
  assert.equal(settings.values['font.display'], 'Lora, Georgia, Times New Roman, serif');
  assert.equal(settings.values['font.body'], 'Montserrat, Arial, Helvetica, sans-serif');
  assert.doesNotMatch(template, /<style\b|@media|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|clamp\(|white-space:pre-line/i);
  assert.doesNotMatch(demo, /Upgrade Your Home in Style|data-freshine-slot="intro\./);
  assert.match(demo, /\.\/assets\/default-celina-bedroom\.png/);
  assert.ok(readme.includes('窗帘产品推荐卡II（无标题版，`product.curtainRecommendationNoTitle`'));
  assert.match(index, /小样-产品[\s\S]*窗帘产品推荐卡II（无标题版）/s);
  assert.equal(renderResult.status, 0, renderResult.stderr || renderResult.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.match(preview, /width="548"/);
  assert.doesNotMatch(preview, /Upgrade Your Home in Style/);
});
