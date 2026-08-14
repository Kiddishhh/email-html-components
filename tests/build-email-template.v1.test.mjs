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

  assert.deepEqual(registry.slice(0, campaignComponentKeys.length).map(({ componentKey }) => componentKey), campaignComponentKeys);
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
    'default-pillow-cover.png',
    'default-eye-mask.png'
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
  assert.match(template, /data-freshine-slot="footer\.address\.disclaimer" style="color:#F1D9C7;font-family:\{\{settings\.font\.body\}\};font-size:11px;font-weight:400;line-height:17px;text-align:center;"/);
});

test('the footer uses the approved refined warm hierarchy in component, demo, and Skill references', () => {
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
  assert.match(template, /height="1" bgcolor="#8B552C"/);
  assert.match(template, /padding:0 5px/);
  assert.match(template, /color:\{\{settings\.color\.link\}\}[^>]*text-decoration:underline/);
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
