import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = '/Users/ww/Desktop/邮件营销运营/邮件html组件';
const builder = `${root}/build-email-template.v1.mjs`;
const componentDirectory = `${root}/评论组件/可链接整图`;
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
        'image.url': 'https://cdn.example.test/freshine-review-ix.jpg',
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
      'review-image-default': {
        path: '评论组件/可链接整图/assets/default-review-ix.jpg',
        name: 'review-ix.jpg'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-image-default';
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  assert.ok(preview.includes('%E8%AF%84%E8%AE%BA%E7%BB%84%E4%BB%B6/%E5%8F%AF%E9%93%BE%E6%8E%A5%E6%95%B4%E5%9B%BE/assets/'));
  assert.match(preview, /default-review-ix\.jpg/);
  assert.doesNotMatch(preview, /file:\/\//, 'local preview assets must also load through the local HTTP preview server');
});

test('resolves a local preview asset relative to a nested preview HTML file', () => {
  const { composition, path } = makeComposition('email-builder-nested-local-preview', (value) => {
    value.previewOutput = '/private/tmp/freshine-preview-test/nested/email.local-preview.html';
    value.assets = {
      'review-image-default': {
        path: '评论组件/可链接整图/assets/default-review-ix.jpg',
        name: 'review-ix.jpg'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-image-default';
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(composition.previewOutput, 'utf8');
  const renderedUrl = preview.match(/src="([^"]*default-review-ix\.jpg)"/u)?.[1];
  assert.ok(renderedUrl, 'preview must render the local image source');
  assert.equal(
    fileURLToPath(new URL(renderedUrl, pathToFileURL(composition.previewOutput))),
    `${root}/评论组件/可链接整图/assets/default-review-ix.jpg`
  );
});

test('blocks a final Omnisend build until every local asset has an HTTPS URL', () => {
  const { path } = makeComposition('email-builder-unresolved-asset', (value) => {
    value.assets = {
      'review-image-default': {
        path: '评论组件/可链接整图/assets/default-review-ix.jpg',
        name: 'review-ix.jpg'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-image-default';
  });
  const result = run(path);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /local asset review-image-default must be uploaded before final build/);
});

test('builds a validated upload source with registered local assets deferred for the fixed uploader', () => {
  const { composition, path } = makeComposition('email-builder-deferred-assets', (value) => {
    value.assets = {
      'review-image-default': {
        path: '评论组件/可链接整图/assets/default-review-ix.jpg',
        name: 'review-ix.jpg'
      }
    };
    value.components[0].content['image.url'] = 'asset://review-image-default';
  });
  const result = run(path, '--defer-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = readFileSync(composition.output, 'utf8');
  assert.match(output, /src="asset:\/\/review-image-default"/);
});

test('gift reward campaign snapshots can align title and rule typography with the sale grid', () => {
  const directory = `${root}/赠品与权益组件/双赠品奖励卡`;
  const content = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settings = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/gift-reward-sale-grid-typography.html';
  const path = '/private/tmp/gift-reward-sale-grid-typography.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FBFAF8', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: '/private/tmp/gift-reward-sale-grid-typography.local-preview.html',
    assets: {
      'gift-pillow-cover': {
        path: '赠品与权益组件/双赠品奖励卡/assets/default-pillow-cover.jpg',
        name: 'default-pillow-cover.jpg'
      },
      'gift-eye-mask': {
        path: '赠品与权益组件/双赠品奖励卡/assets/default-eye-mask.jpg',
        name: 'default-eye-mask.jpg'
      }
    },
    components: [{
      name: '双赠品奖励卡',
      directory: '赠品与权益组件/双赠品奖励卡',
      componentKey: 'gift.rewardGrid2',
      content: content.values,
      settings: {
        ...settings.values,
        'font.headingSize': '22px',
        'font.headingWeight': '500',
        'font.headingLineHeight': '1.3',
        'font.bodySize': '16px',
        'font.bodyWeight': '500',
        'font.bodyLineHeight': '1.5'
      }
    }]
  }, null, 2));

  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync('/private/tmp/gift-reward-sale-grid-typography.local-preview.html', 'utf8');
  assert.match(html, /data-freshine-slot="reward.title"[^>]*font-size:22px;font-weight:500;line-height:1.3/);
  assert.equal((html.match(/data-freshine-slot="reward.rules\[[01]\]"[^>]*font-size:16px;font-weight:500;line-height:1.5/g) ?? []).length, 2);
});

test('the registry preserves the default composition components while allowing freely selectable components', () => {
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

test('the countdown hero is an independently registered 600px component with editable navigation and countdown copy', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entry = registry.find(({ componentKey }) => componentKey === 'hero.countdownOverlay');

  assert.ok(entry, 'countdown hero must be registered');
  assert.equal(entry.中文名称, '倒计时头图');
  assert.equal(entry.输出宽度, 600);
  const directory = `${root}/${entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/u, '')}`;
  const content = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));

  assert.equal(content.componentKey, 'hero.countdownOverlay');
  assert.equal(fixture.values['navigation.url'], 'https://freshinelife.com/');
  assert.equal(fixture.values['countdown.title'], 'Only 3 Days Left');
  assert.ok(content.properties['countdown.title']);
  assert.equal('countdown.titleLine1' in content.properties, false);
  assert.equal('countdown.titleLine2' in content.properties, false);
  assert.equal(fixture.values['brand.logo.url'], 'asset://countdown-brand-logo');
  assert.equal(fixture.values['decoration.dividerImage.url'], 'asset://countdown-divider');
  assert.equal('brand.text' in content.properties, false);
  assert.deepEqual(fixture.localReferenceAssets, {
    'countdown-background': 'assets/default-background.jpg',
    'countdown-brand-logo': 'assets/brand-logo-dark.png',
    'countdown-divider': 'assets/divider-ornament.png'
  });
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.equal(existsSync(`${directory}/${relativePath}`), true, `countdown hero must own ${relativePath}`);
  }
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  assert.match(demo, /\.\/assets\/default-background\.jpg/);
  assert.match(demo, /\.\/assets\/brand-logo-dark\.png/);
  assert.match(demo, /\.\/assets\/divider-ornament\.png/);
  assert.match(demo, /fonts\.googleapis\.com\/css2\?family=Lora/);
  assert.match(demo, /family=Montserrat/);
  assert.doesNotMatch(demo, />✦</);
});

test('the countdown hero renders its editable navigation, static countdown, and CTA through the email assembler', () => {
  const directory = `${root}/头图/倒计时头图`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/countdown-hero.html';
  const previewOutput = '/private/tmp/countdown-hero.local-preview.html';
  const path = '/private/tmp/countdown-hero.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    assets: {
      'countdown-background': {
        path: '头图/倒计时头图/assets/default-background.jpg',
        name: 'countdown-background.jpg'
      },
      'countdown-brand-logo': {
        path: '头图/倒计时头图/assets/brand-logo-dark.png',
        name: 'countdown-brand-logo.png'
      },
      'countdown-divider': {
        path: '头图/倒计时头图/assets/divider-ornament.png',
        name: 'countdown-divider.png'
      }
    },
    components: [{
      name: '倒计时头图',
      directory,
      componentKey: 'hero.countdownOverlay',
      content: fixture.values,
      settings: defaults.values
    }]
  }, null, 2));

  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /Unlock \$100 Off Your First Order At Freshine/);
  assert.match(html, /href="https:\/\/freshinelife\.com\/"/);
  assert.match(html, /freshine-countdown-overlay-hero/);
  assert.match(html, /default-background\.jpg/);
  assert.match(html, /brand-logo-dark\.png/);
  assert.match(html, /divider-ornament\.png/);
  assert.match(html, /<td class="freshine-countdown-navigation"[^>]*bgcolor="#97866D"/);
  assert.match(html, /<td class="freshine-countdown-navigation"[^>]*bgcolor="#725A4B"/);
  assert.match(html, /class="freshine-countdown-cta-cell"[^>]*bgcolor="#725A4B"/);
  assert.match(html, /class="freshine-countdown-title"[^>]*font-family:Lora[^;]*;font-size:50px;font-weight:400;line-height:64px;letter-spacing:0px;text-align:center/);
  assert.match(html, /class="freshine-countdown-title"[^>]*data-freshine-slot="countdown\.title"[^>]*width:280px[^>]*max-width:280px[^>]*white-space:normal[^>]*>Only 3 Days Left<\/span>/);
  assert.doesNotMatch(html, /countdown\.titleLine[12]|<br>/);
  assert.match(html, /<td class="freshine-countdown-hero-shell" colspan="2"[^>]*>/);
  assert.match(html, /class="freshine-countdown-hero-background"[^>]*display:block;height:120vw;max-height:722px;min-height:560px/);
  assert.match(html, /class="freshine-countdown-hero-stage"[^>]*height:100%/);
  assert.doesNotMatch(html, /class="freshine-countdown-hero-shell"[^>]*display:block/);
  assert.doesNotMatch(html, /height:120\.25vw/);
  assert.match(html, /font-size:50px/);
  assert.match(html, /padding:28px 24px 28px/);
  assert.doesNotMatch(html, /freshine-countdown-title[^>]*font-size:clamp\(/);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

test('the countdown hero caps its nested desktop background at 722px and keeps a 560px mobile minimum', () => {
  const directory = `${root}/头图/倒计时头图`;
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const schema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const styles = readFileSync(`${directory}/component.styles.v1.css`, 'utf8');

  assert.match(template, /height:56px/);
  assert.match(template, /height="722"/);
  assert.match(template, /<td class="freshine-countdown-hero-shell" colspan="2"[^>]*>/);
  assert.match(template, /class="freshine-countdown-hero-background"[^>]*height="722"[^>]*display:block;height:120vw;max-height:722px;min-height:560px/);
  assert.match(template, /class="freshine-countdown-hero-stage"[^>]*height:100%/);
  assert.doesNotMatch(template, /class="freshine-countdown-hero-shell"[^>]*display:block/);
  assert.doesNotMatch(template, /class="freshine-countdown-hero-background"[^>]*colspan=/);
  assert.doesNotMatch(template, /height:120\.25vw/);
  assert.doesNotMatch(template, /height="751"/);
  assert.match(template, /class="freshine-countdown-navigation/);
  assert.match(template, /class="freshine-countdown-navigation-link"[^>]*white-space:nowrap/);
  assert.match(template, /class="freshine-countdown-panel-content"[^>]*valign="middle"[^>]*vertical-align:middle/);
  assert.match(template, /class="freshine-countdown-title"[^>]*data-freshine-slot="countdown\.title"[^>]*width:280px[^>]*max-width:280px[^>]*white-space:normal[^>]*>\{\{content\.countdown\.title\}\}<\/span>/);
  assert.doesNotMatch(template, /countdown\.titleLine[12]|<br>/);
  assert.match(template, /class="freshine-countdown-cta-cell"/);
  assert.match(styles, /\.freshine-countdown-navigation\s*\{[^}]*height:56px/);
  assert.match(styles, /\.freshine-countdown-navigation-link\s*\{[^}]*white-space:nowrap/);
  assert.match(styles, /\.freshine-countdown-hero-shell\s*\{[^}]*padding:0/);
  assert.match(styles, /\.freshine-countdown-hero-background\s*\{[^}]*display:block[^}]*height:120vw[^}]*max-height:722px[^}]*min-height:560px/);
  assert.match(styles, /\.freshine-countdown-hero-stage\s*\{[^}]*height:100%/);
  assert.doesNotMatch(styles, /height:120\.25vw/);
  assert.match(styles, /\.freshine-countdown-panel-content\s*\{[^}]*padding:28px 24px 28px[^}]*vertical-align:middle/);
  assert.match(styles, /\.freshine-countdown-title\s*\{[^}]*width:280px[^}]*max-width:280px[^}]*white-space:normal[^}]*font-size:50px[^}]*font-weight:400[^}]*line-height:64px[^}]*letter-spacing:0px[^}]*text-align:center/);
  assert.doesNotMatch(styles, /freshine-countdown-title-line/);
  assert.match(styles, /\.freshine-countdown-subtitle\s*\{[^}]*max-width:390px[^}]*font-size:14px[^}]*line-height:21px/);
  assert.match(styles, /\.freshine-countdown-cta-cell\s*\{[^}]*height:44px/);
  assert.doesNotMatch(styles, /clamp\(/);
  assert.match(template, /padding:0 10px;text-align:center;vertical-align:middle/);
  assert.equal(defaults.values['color.theme'], '#725A4B');
  assert.equal(defaults.values['color.navigationLeft'], '#97866D');
  assert.equal(defaults.values['color.navigationRight'], '#725A4B');
  assert.equal(schema.properties['color.navigationRight'].default, '#725A4B');
  assert.match(template, /bgcolor="\{\{settings\.color\.navigationRight\}\}"[^>]*background-color:\{\{settings\.color\.navigationRight\}\}[^>]*>[\s\S]*?navigation\.linkText/);
  assert.match(template, /background-color:\{\{settings\.color\.theme\}\}[^>]*>[\s\S]*?hero\.cta\.text/);
  assert.equal(defaults.values['panel.maxWidth'], '460px');
  assert.equal(schema.properties['panel.maxWidth'].default, '460px');
  assert.match(template, /class="freshine-countdown-hero-panel"[^>]*width="460"[^>]*height="520"[^>]*width:100%;max-width:\{\{settings\.panel\.maxWidth\}\};height:86\.67vw;max-height:520px/);
  assert.match(styles, /\.freshine-countdown-hero-panel\s*\{[^}]*width:100%[^}]*max-width:460px[^}]*height:86\.67vw[^}]*max-height:520px/);
  assert.equal(defaults.values['cta.maxWidth'], '200px');
  assert.equal(schema.properties['cta.maxWidth'].default, '200px');
  assert.equal(defaults.values['cta.height'], '44px');
  assert.equal(schema.properties['cta.height'].default, '44px');
  assert.match(template, /font-size:14px;font-weight:400;line-height:20px/);
  assert.match(template, /max-width:280px[^>]*font-size:50px;font-weight:400;line-height:64px;letter-spacing:0px;text-align:center/);
  assert.match(template, /max-width:390px[^>]*font-size:14px;font-weight:500;line-height:21px/);
  assert.match(template, /font-size:16px;font-weight:500;line-height:\{\{settings\.cta\.height\}\}/);
  assert.equal(defaults.values['panel.padding'], '28px 24px 28px');
  assert.equal(schema.properties['panel.padding'].default, '28px 24px 28px');
  assert.equal(defaults.values['brand.logoWidth'], '108px');
  assert.equal(schema.properties['brand.logoWidth'].default, '108px');
  assert.equal(defaults.values['decoration.dividerWidth'], '220px');
  assert.equal(schema.properties['decoration.dividerWidth'].default, '220px');
  assert.match(template, /height="8" style="height:8px/);
  assert.match(template, /height="14" style="height:14px/);
  assert.equal((template.match(/height="22" style="height:22px/g) ?? []).length, 2);
  assert.match(template, /data-freshine-image-slot="brand\.logo\.url"/);
  assert.match(template, /data-freshine-image-slot="decoration\.dividerImage\.url"/);
  assert.doesNotMatch(template, />✦</);
});

test('the countdown hero renders the right navigation color separately from the CTA theme color', () => {
  const directory = `${root}/头图/倒计时头图`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/countdown-hero-independent-navigation.html';
  const previewOutput = '/private/tmp/countdown-hero-independent-navigation.local-preview.html';
  const path = '/private/tmp/countdown-hero-independent-navigation.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#F1EDE5', outerBackgroundColor: '#F1EDE5', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput,
    assets: {
      'countdown-background': { path: '头图/倒计时头图/assets/default-background.jpg', name: 'countdown-background.jpg' },
      'countdown-brand-logo': { path: '头图/倒计时头图/assets/brand-logo-dark.png', name: 'countdown-brand-logo.png' },
      'countdown-divider': { path: '头图/倒计时头图/assets/divider-ornament.png', name: 'countdown-divider.png' }
    },
    components: [{
      name: '倒计时头图',
      directory,
      componentKey: 'hero.countdownOverlay',
      content: fixture.values,
      settings: { ...defaults.values, 'color.navigationRight': '#652A0D', 'color.theme': '#9D1D20' }
    }]
  }, null, 2));

  const result = run(path, '--defer-local-assets');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.match(html, /<td class="freshine-countdown-navigation"[^>]*bgcolor="#652A0D"/);
  assert.match(html, /class="freshine-countdown-cta-cell"[^>]*bgcolor="#9D1D20"/);
});

test('countdown hero 2 owns the approved brown transparent logo as its default preview asset', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'hero.countdownOverlay2');

  assert.equal(entries.length, 1, 'countdown hero 2 must have one registry entry');
  const [entry] = entries;
  assert.equal(entry.中文名称, '倒计时头图2');
  assert.equal(entry.输出宽度, 600);
  const directory = `${root}/${entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/u, '')}`;
  const schema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));

  assert.equal(schema.componentKey, 'hero.countdownOverlay2');
  assert.equal(settingsSchema.componentKey, 'hero.countdownOverlay2');
  assert.deepEqual(Object.keys(fixture.values).sort(), Object.keys(schema.properties).sort());
  assert.deepEqual(Object.keys(defaults.values).sort(), Object.keys(settingsSchema.properties).sort());
  assert.equal(fixture.values['promotion.text'], 'Unlock $100 Off Your First Order at Freshine');
  assert.equal(fixture.values['promotion.linkText'], 'SIGN UP');
  assert.equal(fixture.values['promotion.url'], 'https://freshinelife.com/');
  assert.equal(fixture.values['brand.logo.url'], 'asset://countdown-hero-2-logo');
  assert.equal(fixture.values['brand.logo.clickUrl'], 'https://freshinelife.com/');
  assert.equal(fixture.values['hero.image.url'], 'asset://countdown-hero-2-image');
  assert.equal(fixture.values['urgency.title'], 'ONLY 3 DAYS!');
  assert.deepEqual(
    [fixture.values['benefit.1.text'], fixture.values['benefit.2.text'], fixture.values['benefit.3.text']],
    ['UP TO 65% OFF', 'Free Gift On $699+', 'Free Shipping']
  );
  assert.equal(fixture.values['hero.cta.text'], 'Shop the Holiday Sale >>');
  assert.equal(fixture.values['urgency.note'], 'Limited Time Offer');
  assert.deepEqual(fixture.localReferenceAssets, {
    'countdown-hero-2-logo': 'assets/default-logo-brown.png',
    'countdown-hero-2-image': 'assets/default-hero.jpg'
  });
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.equal(existsSync(`${directory}/${relativePath}`), true, `countdown hero 2 must own ${relativePath}`);
  }

  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  assert.match(template, /<td height="64" align="center" valign="middle"[^>]*height:64px/);
  assert.match(template, /data-freshine-href-slot="brand\.logo\.clickUrl"[^>]*margin-top:\{\{settings\.logo\.offsetTop\}\}/);
  assert.equal(settingsSchema.properties['logo.offsetTop'].default, '4px');
  assert.equal(defaults.values['logo.offsetTop'], '4px');
  assert.match(template, /padding:0 \{\{settings\.cta\.horizontalPadding\}\}/);
  assert.doesNotMatch(template, /freshine-countdown-2-cta[^>]*width="\d+"/);
  assert.equal('cta.maxWidth' in settingsSchema.properties, false);
  assert.equal(defaults.values['cta.horizontalPadding'], '38px');
});

test('countdown hero 2 renders an inset 540 by 540 image and an equally wide offer card over the component background', () => {
  const directory = `${root}/头图/倒计时头图2`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/countdown-hero-2.html';
  const previewOutput = '/private/tmp/countdown-hero-2.local-preview.html';
  const path = '/private/tmp/countdown-hero-2.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#F3EFE8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    assets: {
      'countdown-hero-2-logo': {
        path: '头图/倒计时头图2/assets/default-logo-brown.png',
        name: 'countdown-hero-2-logo.png'
      },
      'countdown-hero-2-image': {
        path: '头图/倒计时头图2/assets/default-hero.jpg',
        name: 'countdown-hero-2-image.jpg'
      }
    },
    components: [{
      name: '倒计时头图2',
      directory,
      componentKey: 'hero.countdownOverlay2',
      content: fixture.values,
      settings: defaults.values
    }]
  }, null, 2));

  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /freshine-countdown-overlay-2-hero/);
  assert.match(html, /default-logo-brown\.png/);
  assert.match(html, /class="freshine-countdown-2-content-card"[^>]*width="540"[^>]*width:90%/);
  assert.match(html, /class="freshine-countdown-2-image"[^>]*width="540" height="540"/);
  assert.match(html, /class="freshine-countdown-2-offer"[^>]*width="540"/);
  assert.match(html, /bgcolor="#F3EFE8" style="padding:18px 0 18px;background-color:#F3EFE8;text-align:center;"/);
  assert.doesNotMatch(html, /class="freshine-countdown-2-image"[^>]*width="600"/);
  assert.equal((html.match(/class="freshine-countdown-2-benefit"/g) ?? []).length, 3);
  assert.match(html, /Winter Comfort Event[\s\S]*UP TO 65% OFF[\s\S]*Extra \$600 OFF/);
  assert.match(html, /ONLY 3 DAYS![\s\S]*Shop the Holiday Sale &gt;&gt;[\s\S]*Limited Time Offer/);
  assert.doesNotMatch(html, /display\s*:\s*(?:flex|grid)|position\s*:\s*(?:absolute|fixed|sticky)|<script\b/i);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

test('countdown hero 2 uses Lora for the urgency title and two visible benefit dividers', () => {
  const html = readFileSync(`${root}/头图/倒计时头图2/效果演示.html`, 'utf8');

  assert.match(html, /class="freshine-countdown-2-urgency"[^>]*font-family:Lora, Georgia, Times New Roman, serif[^>]*font-size:28px[^>]*font-weight:500[^>]*line-height:36px[^>]*letter-spacing:1px/);
  assert.equal((html.match(/class="freshine-countdown-2-benefit-divider"/g) ?? []).length, 2);
  assert.equal((html.match(/class="freshine-countdown-2-benefit-divider"[^>]*height="22"/g) ?? []).length, 2);
});

test('countdown hero 2 uses an adaptive CTA with the sale-grid type scale', () => {
  const html = readFileSync(`${root}/头图/倒计时头图2/效果演示.html`, 'utf8');

  assert.match(html, /class="freshine-countdown-2-cta"[^>]*align="center"[^>]*border-collapse:separate/);
  assert.doesNotMatch(html, /class="freshine-countdown-2-cta"[^>]*width="330"/);
  assert.match(html, /class="freshine-countdown-2-cta"[\s\S]*?<td height="49"[\s\S]*?padding:0 38px/);
  assert.match(html, /class="freshine-countdown-2-cta"[\s\S]*?font-size:18px;font-weight:400;line-height:49px/);
});

test('countdown hero 2 enlarges supporting copy while preserving compact benefit labels', () => {
  const html = readFileSync(`${root}/头图/倒计时头图2/效果演示.html`, 'utf8');

  assert.match(html, /class="freshine-countdown-2-promotion-text"[^>]*font-size:14px[^>]*line-height:20px/);
  assert.match(html, /class="freshine-countdown-2-promotion-link"[^>]*font-size:14px[^>]*line-height:20px/);
  assert.match(html, /class="freshine-countdown-2-subtitle"[^>]*font-size:14px[^>]*line-height:21px/);
  assert.match(html, /class="freshine-countdown-2-note"[^>]*font-size:14px[^>]*line-height:20px/);
  assert.equal((html.match(/class="freshine-countdown-2-benefit"[^>]*font-size:12px[^>]*font-weight:600[^>]*line-height:15px/g) ?? []).length, 3);
  assert.match(html, /height="52"/);
});

test('every committed composition uses complete snapshots accepted by the current assembler', () => {
  for (const filename of [
    'hero-grid-review-gifts-location.default.v1.json',
    'countdown-grid-review-benefits-gift-footer.default.v1.json'
  ]) {
    const result = run(`${root}/compositions/${filename}`, '--preview-local-assets');
    assert.equal(result.status, 0, `${filename}: ${result.stderr || result.stdout}`);
  }
});

test('a user-directed campaign composition renders the requested six-component order without a slot map', () => {
  const path = `${root}/compositions/countdown-grid-review-benefits-gift-footer.default.v1.json`;
  const composition = JSON.parse(readFileSync(path, 'utf8'));

  assert.deepEqual(composition.components.map(({ componentKey }) => componentKey), [
    'hero.countdownOverlay',
    'collection.saleGrid6',
    'image.clickableFullWidth',
    'image.benefitsStrip3',
    'gift.rewardGrid2',
    'footer.warm'
  ]);

  const result = run(path, '--preview-local-assets');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const preview = readFileSync(`${root}/${composition.previewOutput}`, 'utf8');
  const markers = [
    '倒计时头图',
    '六宫格夏季促销',
    '可链接整图',
    '三项权益整图',
    '双赠品奖励卡',
    '品牌信息页脚'
  ].map((name) => preview.indexOf(`<!-- 组件：${name} -->`));
  assert.ok(markers.every((index) => index >= 0), 'preview must contain every requested component marker');
  assert.deepEqual([...markers].sort((left, right) => left - right), markers);
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
    'default-review-ix.jpg',
    'default-pillow-cover.jpg',
    'default-eye-mask.jpg'
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
  const directory = `${root}/地址组件/展厅地址卡`;
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
  assert.match(template, /data-freshine-slot="footer\.address\.disclaimer" style="color:\{\{settings\.color\.text\}\};font-family:\{\{settings\.font\.body\}\};font-size:13px;font-weight:400;line-height:1\.5;text-align:center;"/);
});

test('all six sale cards use identical centered wrappers and symmetric spacing', () => {
  const directory = `${root}/活动商品组件/六宫格折扣商品组件`;
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
  const directory = `${root}/评论组件/可链接整图`;
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

test('the three-benefit strip is an independently registered 600px non-linked image component', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'image.benefitsStrip3');

  assert.equal(entries.length, 1, 'three-benefit strip must be registered exactly once');
  const entry = entries[0];
  assert.equal(entry.中文名称, '三项权益整图');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);

  const directory = `${root}/${entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/u, '')}`;
  const contentSchema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');

  assert.equal(contentSchema.componentKey, 'image.benefitsStrip3');
  assert.equal(settingsSchema.componentKey, 'image.benefitsStrip3');
  assert.equal(fixture.componentKey, 'image.benefitsStrip3');
  assert.equal(fixture.localPreviewAsset, 'assets/default-benefits-strip.jpg');
  assert.equal(fixture.values['image.url'], 'asset://benefits-strip-3');
  assert.equal('image.linkUrl' in fixture.values, false);
  assert.equal(contentSchema.properties['image.linkUrl'].required, false);
  assert.equal(contentSchema.properties['image.linkUrl'].deprecated, true);
  assert.equal(defaults.values['image.maxWidth'], '600px');
  assert.equal(defaults.values['spacing.outer'], '0');
  assert.match(template, /class="freshine-component freshine-benefits-strip-3"[^>]*width="100%"/);
  assert.doesNotMatch(template, /<a\b|href="\{\{content\.image\.linkUrl\}\}"/);
  assert.match(template, /<img[^>]*width="100%"[^>]*data-freshine-slot="image"/);
  assert.match(management, /600px.*全宽.*375px.*流式缩放/s);
  assert.match(management, /1200\s*[×x]\s*584px/);
  assert.match(demo, /\.\/assets\/default-benefits-strip\.jpg/);
  assert.match(demo, /max-width:600px/);
});

test('the double-gift card uses the approved high-resolution local default images', () => {
  const directory = `${root}/赠品与权益组件/双赠品奖励卡`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');

  assert.deepEqual(fixture.localReferenceAssets, {
    'gift-pillow-cover': 'assets/default-pillow-cover.jpg',
    'gift-eye-mask': 'assets/default-eye-mask.jpg'
  });
  assert.equal(fixture.values['reward.items[0].image.url'], 'asset://gift-pillow-cover');
  assert.equal(fixture.values['reward.items[1].image.url'], 'asset://gift-eye-mask');
  for (const relativePath of Object.values(fixture.localReferenceAssets)) {
    assert.equal(existsSync(`${directory}/${relativePath}`), true, `gift card must own ${relativePath}`);
  }
  assert.match(demo, /\.\/assets\/default-pillow-cover\.jpg/);
  assert.match(demo, /\.\/assets\/default-eye-mask\.jpg/);
});

test('the three-benefit strip renders through the email assembler from a complete snapshot', () => {
  const directory = `${root}/赠品与权益组件/三项权益整图`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/benefits-strip-3.html';
  const previewOutput = '/private/tmp/benefits-strip-3.local-preview.html';
  const path = '/private/tmp/benefits-strip-3.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    components: [{
      name: '三项权益整图',
      directory,
      componentKey: 'image.benefitsStrip3',
      content: {
        ...fixture.values,
        'image.url': 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Elara_89850_scene_15.webp?v=1755009943'
      },
      settings: { ...defaults.values }
    }]
  }, null, 2));

  const result = run(path);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.match(html, /freshine-benefits-strip-3/);
  assert.doesNotMatch(html, /<a\b|href=/);
  assert.match(html, /max-width:600px/);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

test('the three-benefit strip accepts and ignores a legacy image link field', () => {
  const directory = `${root}/赠品与权益组件/三项权益整图`;
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const output = '/private/tmp/benefits-strip-3-legacy-link.html';
  const previewOutput = '/private/tmp/benefits-strip-3-legacy-link.local-preview.html';
  const path = '/private/tmp/benefits-strip-3-legacy-link.composition.json';
  writeFileSync(path, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output,
    previewOutput,
    components: [{
      name: '三项权益整图',
      directory,
      componentKey: 'image.benefitsStrip3',
      content: {
        ...fixture.values,
        'image.url': 'https://cdn.shopify.com/s/files/1/0901/6888/5527/files/Elara_89850_scene_15.webp?v=1755009943',
        'image.linkUrl': 'https://freshinelife.com/legacy-link'
      },
      settings: { ...defaults.values }
    }]
  }, null, 2));

  const result = run(path);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.doesNotMatch(html, /<a\b|href=|legacy-link/);
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
  const { previewOutput, path } = makeTextReviewComposition('text-review-list-2-render', {
    background: '#EAF8F3'
  });
  const result = run(path, '--preview-local-assets');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(previewOutput, 'utf8');
  assert.match(html, /freshine-review-list-2/);
  assert.equal((html.match(/class="freshine-review-summary-star"/g) ?? []).length, 5);
  assert.equal((html.match(/class="freshine-review-item-star"/g) ?? []).length, 10);
  assert.equal((html.match(/alt=""/g) ?? []).length, 15);
  assert.match(html, /4\.8 \/ 5[\s\S]*200\+ reviews/);
  assert.match(html, /Exactly What Our Living Room Needed/);
  assert.match(html, /Quiet Luxury, Really Well Made/);
  assert.match(html, /background-color:#EAF8F3/);
  assert.match(html, /review-star\.png/);
  assert.doesNotMatch(html, /<a\b|\bCTA\b/i);
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
});

const editableTextReviewFields = [
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
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [index, key] of editableTextReviewFields.entries()) {
  test(`the text review list escapes ${key} only inside its matching slot`, () => {
    const token = `editable-${String(index + 1).padStart(2, '0')}`;
    const raw = `${token} & <${key}>`;
    const escaped = `${token} &amp; &lt;${key}&gt;`;
    const { previewOutput, path } = makeTextReviewComposition(`text-review-list-2-${token}`, {
      content: { [key]: raw }
    });
    const result = run(path, '--preview-local-assets');

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const html = readFileSync(previewOutput, 'utf8');
    const slotPattern = new RegExp(`<!-- FRESHINE_SLOT_START:${escapeRegex(key)} -->([\\s\\S]*?)<!-- FRESHINE_SLOT_END:${escapeRegex(key)} -->`);
    const slot = html.match(slotPattern)?.[1];
    assert.ok(slot, `${key}: matching output slot must exist`);
    assert.ok(slot.includes(escaped), `${key}: escaped value must render in its matching slot`);
    assert.equal((html.match(new RegExp(token, 'g')) ?? []).length, 1, `${key}: unique value must render in only one output region`);
    assert.equal(html.includes(raw), false, `${key}: raw unsafe text must not render`);
  });
}

const invalidTextReviewBackgrounds = [
  ['short hex', '#FFF'],
  ['missing hash', 'FDFCFB'],
  ['non-hex digit', '#FDFCFZ'],
  ['rgba function', 'rgba(253,252,251,1)'],
  ['trailing newline', '#FDFCFB\n']
];

for (const [label, background] of invalidTextReviewBackgrounds) {
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

test('the two-review list remains unavailable to Campaign assembly without an interaction contract', () => {
  const registry = JSON.parse(readFileSync(`${root}/组件清单.json`, 'utf8'));
  const entries = registry.filter(({ componentKey }) => componentKey === 'review.textList2');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].中文名称, '双条文字评论');
  assert.equal(entries[0].分类, '评论组件');
  assert.equal(entries[0].输出宽度, 600);

  const directory = `${root}/评论组件/双条文字评论`;
  const schema = JSON.parse(readFileSync(`${directory}/content.schema.v1.json`, 'utf8'));
  const fixture = JSON.parse(readFileSync(`${directory}/content.fixture.v1.json`, 'utf8'));
  const settingsSchema = JSON.parse(readFileSync(`${directory}/settings.schema.v1.json`, 'utf8'));
  const defaults = JSON.parse(readFileSync(`${directory}/settings.defaults.v1.json`, 'utf8'));
  const template = readFileSync(`${directory}/component.template.v1.html`, 'utf8');
  const demo = readFileSync(`${directory}/效果演示.html`, 'utf8');
  const management = readFileSync(`${directory}/COMPONENT_MANAGEMENT.zh-CN.v1.md`, 'utf8');
  const structure = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-structure.v1.json`, 'utf8'));
  const interactions = JSON.parse(readFileSync(`${root}/skills/build-omnisend-campaign-draft/references/campaign-component-interactions.v1.json`, 'utf8'));

  assert.deepEqual(Object.keys(fixture.values).sort(), Object.keys(schema.properties).sort());
  assert.deepEqual(Object.keys(defaults.values).sort(), Object.keys(settingsSchema.properties).sort());
  assert.equal(fixture.values['star.image.url'], 'asset://review-star');
  assert.deepEqual(fixture.localReferenceAssets, { 'review-star': 'assets/review-star.png' });
  assert.equal(settingsSchema.properties['color.surface'].pattern, '^#[0-9A-Fa-f]{6}$');
  assert.equal((template.match(/content\.star\.image\.url/g) ?? []).length, 15);
  assert.equal((demo.match(/(?:\.\/)?assets\/review-star\.png/g) ?? []).length, 15);
  assert.doesNotMatch(template, /<a\b|href=|cta/i);
  assert.doesNotMatch(demo, /\{\{(?:content|settings)\./);
  assert.match(management, /尚未加入.*Campaign Skill/s);
  assert.equal(structure.selection, 'user-ordered-registered-components');
  assert.equal(interactions.interactions.some(({ componentKey }) => componentKey === 'review.textList2'), false);
});
