import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const read = (relativePath) => readFileSync(`${root}/${relativePath}`, 'utf8');
const builder = `${root}/build-email-template.v1.mjs`;
const registry = JSON.parse(read('组件清单.json'));

const TITLE = { size: '30px', weight: '500', lineHeight: '38px', letterSpacing: '0px' };
const SUBTITLE = { size: '18px', weight: '500', lineHeight: '27px', letterSpacing: '0px' };
const ADDRESS = { size: '16px', weight: '400', lineHeight: '25px' };

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function styleForSlot(markup, slot) {
  const match = markup.match(new RegExp(`data-freshine-slot="${escapeRegExp(slot)}"[^>]*style="([^"]+)"`));
  assert.ok(match, `missing slot style: ${slot}`);
  return match[1];
}

function assertTypography(style, { family, size, weight, lineHeight, letterSpacing }) {
  const declarations = new Set(style.split(';').filter(Boolean));
  assert.ok(declarations.has(`font-family:${family}`), style);
  assert.ok(declarations.has(`font-size:${size}`), style);
  assert.ok(declarations.has(`font-weight:${weight}`), style);
  assert.ok(declarations.has(`line-height:${lineHeight}`), style);
  assert.ok(declarations.has('text-align:center'), style);
  if (letterSpacing !== undefined) {
    assert.ok(declarations.has(`letter-spacing:${letterSpacing}`), style);
  }
}

function renderComponent(componentKey) {
  const entry = registry.find((candidate) => candidate.componentKey === componentKey);
  assert.ok(entry, `missing registry entry: ${componentKey}`);
  const directory = entry.路径.组件模板.replace(/\/component\.template\.v1\.html$/, '');
  const fixture = JSON.parse(read(`${directory}/content.fixture.v1.json`));
  const defaults = JSON.parse(read(`${directory}/settings.defaults.v1.json`));
  const temporary = mkdtempSync(join(tmpdir(), 'freshine-typography-'));
  const compositionPath = join(temporary, 'composition.json');
  const previewOutput = join(temporary, 'preview.html');
  const assets = Object.fromEntries(Object.entries(fixture.localReferenceAssets ?? {}).map(([id, relativePath]) => [id, {
    path: `${directory}/${relativePath}`,
    name: relativePath.split('/').at(-1)
  }]));
  writeFileSync(compositionPath, JSON.stringify({
    schemaVersion: 1,
    canvas: {
      backgroundColor: '#FBFAF8',
      outerBackgroundColor: '#FFFFFF',
      contentWidth: 600,
      mobileTargetWidth: 375,
      verticalPadding: 0
    },
    output: join(temporary, 'component.html'),
    previewOutput,
    assets,
    components: [{
      name: entry.中文名称,
      directory,
      componentKey,
      content: fixture.values,
      settings: defaults.values
    }]
  }, null, 2));
  const result = spawnSync(process.execPath, [builder, compositionPath, '--preview-local-assets'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return readFileSync(previewOutput, 'utf8');
}

test('both curtain promotion card variants preserve the product copy hierarchy while the title variant uses the shared header typography', () => {
  for (const componentKey of ['collection.curtainPromotionCard', 'collection.curtainPromotionCardNoTitle']) {
    const output = renderComponent(componentKey);
    if (componentKey === 'collection.curtainPromotionCard') {
      assertTypography(styleForSlot(output, 'promotion.title'), {
        family: 'Lora, Georgia, Times New Roman, serif',
        ...TITLE
      });
      assertTypography(styleForSlot(output, 'promotion.subtitle'), {
        family: 'Montserrat, Arial, Helvetica, sans-serif',
        ...SUBTITLE
      });
    }

    const productTitle = new Set(styleForSlot(output, 'product.title').split(';').filter(Boolean));
    assert.ok(productTitle.has('font-size:22px'), componentKey);
    assert.ok(productTitle.has('font-weight:500'), componentKey);
    assert.ok(productTitle.has('line-height:30px'), componentKey);
    assert.ok(productTitle.has('text-align:left'), componentKey);

    const productDescription = new Set(styleForSlot(output, 'product.description').split(';').filter(Boolean));
    assert.ok(productDescription.has('font-size:15px'), componentKey);
    assert.ok(productDescription.has('font-weight:400'), componentKey);
    assert.ok(productDescription.has('line-height:22px'), componentKey);
    assert.ok(productDescription.has('text-align:left'), componentKey);
  }
});

test('sale-grid CTA preserves its 486px desktop maximum while scaling to 81 percent on mobile', () => {
  const output = renderComponent('collection.saleGrid6');
  assert.match(output, /<table role="presentation" width="486"[^>]*style="width:81%;max-width:486px;border-collapse:separate;margin:0 auto;"/);
});

test('product.curtainRecommendationOverlay uses the shared non-hero header typography', () => {
  const output = renderComponent('product.curtainRecommendationOverlay');
  assertTypography(styleForSlot(output, 'intro.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(output, 'intro.subtitle'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
  const productName = new Set(styleForSlot(output, 'product.name').split(';').filter(Boolean));
  assert.ok(productName.has('font-size:24px'));
  assert.ok(productName.has('font-weight:500'));
  assert.ok(productName.has('line-height:32px'));
});

test('location.showroomCard uses the shared title typography and preserves both address lines', () => {
  const output = renderComponent('location.showroomCard');
  assertTypography(styleForSlot(output, 'showroom.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });

  for (const slot of ['showroom.address.line1', 'showroom.address.line2']) {
    assertTypography(styleForSlot(output, slot), {
      family: 'Montserrat, Arial, Helvetica, sans-serif',
      ...ADDRESS
    });
  }
});

test('double-gift, sale-grid, and curtain inspiration use the shared non-hero header typography', () => {
  const gift = renderComponent('gift.rewardGrid2');
  assertTypography(styleForSlot(gift, 'reward.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(gift, 'reward.rules[0]'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
  assertTypography(styleForSlot(gift, 'reward.rules[1]'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });

  const saleGrid = renderComponent('collection.saleGrid6');
  assertTypography(styleForSlot(saleGrid, 'saleCollection.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(saleGrid, 'saleCollection.body'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });

  const inspirationGrid = renderComponent('collection.curtainInspirationGrid4');
  assertTypography(styleForSlot(inspirationGrid, 'promotion.title'), {
    family: 'Lora, Georgia, Times New Roman, serif',
    ...TITLE
  });
  assertTypography(styleForSlot(inspirationGrid, 'promotion.subtitle'), {
    family: 'Montserrat, Arial, Helvetica, sans-serif',
    ...SUBTITLE
  });
});
