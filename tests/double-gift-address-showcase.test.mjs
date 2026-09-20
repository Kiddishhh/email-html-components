import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'gift.doubleGiftAddressShowcase';
const directory = resolve(root, '赠品与权益组件/双赠品展示卡2');

const editableContent = [
  'intro.title', 'intro.subtitle',
  'gifts[0].image.url', 'gifts[0].image.alt', 'gifts[0].title', 'gifts[0].value', 'gifts[0].cta.text', 'gifts[0].cta.url', 'gifts[0].note',
  'gifts[1].image.url', 'gifts[1].image.alt', 'gifts[1].title', 'gifts[1].value', 'gifts[1].cta.text', 'gifts[1].cta.url', 'gifts[1].note',
  'footer.note'
];

test('双赠品展示卡2可独立添加，且不替换现有双赠品展示卡', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, '新组件必须在注册表中独立登记');
  assert.equal(entry.中文名称, '双赠品展示卡2');
  assert.equal(entry.分类, '赠品与权益组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.ok(registry.some((item) => item.componentKey === 'gift.showcase2'), '现有双赠品展示卡必须保留');

  assert.deepEqual(editableFieldKeys(componentKey), {
    content: editableContent,
    settings: ['color.canvas', 'color.card', 'color.text', 'color.accent', 'color.muted']
  });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const catalogEntry = catalog.find((item) => item.componentKey === componentKey);
  assert.ok(catalogEntry, '新组件必须能被编辑器选择');
  assert.equal(catalogEntry.name, '双赠品展示卡2');

  const document = addComponentInstance(createCampaignDocument({ name: 'double-gift-address-showcase' }), catalog, componentKey);
  const component = document.components[0];
  assert.deepEqual(Object.keys(component.content).filter((field) => editableContent.includes(field)), editableContent);
  assert.equal(component.content['intro.title'], 'Pinch Pleat');
  assert.equal(component.content['gifts[0].cta.url'], 'https://freshinelife.com/');
  assert.equal(component.content['gifts[1].cta.url'], 'https://freshinelife.com/');
  assert.equal(component.content['footer.note'], 'Gifts Will Be Automatically Added To Your Cart.');
  assert.equal(component.content['footer.icon.url'], 'https://app.omnisend.com/images/6a97b53ec723a01883e3afbf');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  assert.deepEqual(Object.keys(assets).sort(), [
    'double-gift-address-pillow-cover',
    'double-gift-address-shopping-bag',
    'double-gift-address-silk-eye-mask'
  ]);
  for (const asset of Object.values(assets)) assert.ok(existsSync(resolve(root, asset.path)), asset.path);
  const approvedAssets = {
    'double-gift-address-pillow-cover': { width: 524, height: 308, sha256: '8a9135d6809e64611539ed9506f42faf04a91f59a944da1cc11ccafb06cab163' },
    'double-gift-address-shopping-bag': { width: 30, height: 34, sha256: '9f5cdb90ca8fd39577b344176ee271b3c61c24eb0de5184e25dc196bb447518e' },
    'double-gift-address-silk-eye-mask': { width: 524, height: 308, sha256: 'a30a1bd82cd501e331008de65974a660e84c0ceae1f0bfeabee11200be3da3c9' }
  };
  for (const [assetId, expected] of Object.entries(approvedAssets)) {
    const bytes = readFileSync(resolve(root, assets[assetId].path));
    assert.equal(bytes.toString('ascii', 1, 4), 'PNG', `${assetId} 必须保持 PNG 格式`);
    assert.equal(bytes.readUInt32BE(16), expected.width, `${assetId} 宽度不应漂移`);
    assert.equal(bytes.readUInt32BE(20), expected.height, `${assetId} 高度不应漂移`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, `${assetId} 必须保持经批准素材`);
  }
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('双赠品展示卡2使用两张独立图片、两个 CTA 和邮件安全的 600px 并列布局', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'double-gift-address-render' }), catalog, componentKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-double-gift-address-'));
  const output = resolve(temporary, 'email.html');
  const input = resolve(temporary, 'composition.json');
  const content = {
    ...component.content,
    'intro.title': 'Pinch & Pleat',
    'gifts[0].image.url': 'https://cdn.example.com/eye-mask.png',
    'gifts[0].image.alt': 'Silk "eye" mask <gift>',
    'gifts[0].cta.url': 'https://freshinelife.com/collections/eye-mask?utm_source=omnisend&utm_medium=email',
    'gifts[1].image.url': 'https://cdn.example.com/pillow-cover.png',
    'gifts[1].image.alt': 'Pillow cover & gift',
    'gifts[1].cta.url': 'https://freshinelife.com/collections/pillow-covers?utm_source=omnisend&utm_medium=email',
    'cta.icon.url': 'https://cdn.example.com/shopping-bag.png',
    'footer.icon.url': 'https://cdn.example.com/gift-outline.png'
  };
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput: resolve(temporary, 'preview.html'),
    components: [{
      name: component.name,
      directory: component.directory,
      componentKey,
      content,
      settings: { ...component.settings, 'color.card': '#F4EFEA' }
    }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  assert.match(html, /Pinch &amp; Pleat/);
  assert.match(html, /Two Tiers Of Gifts With Your Order\. More To Love\./);
  assert.match(html, /Free Silk Eye Mask/);
  assert.match(html, /Free Pillow Cover/);
  assert.match(html, /Gifts Will Be Automatically Added To Your Cart\./);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/eye-mask\.png"[^>]*alt="Silk &quot;eye&quot; mask &lt;gift&gt;"/);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/pillow-cover\.png"[^>]*alt="Pillow cover &amp; gift"/);
  assert.equal((html.match(/src="https:\/\/cdn\.example\.com\/shopping-bag\.png"/g) ?? []).length, 2);
  assert.equal((html.match(/src="https:\/\/cdn\.example\.com\/gift-outline\.png"/g) ?? []).length, 1);
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => match[1]);
  assert.deepEqual(links, [
    'https://freshinelife.com/collections/eye-mask?utm_source=omnisend&amp;utm_medium=email',
    'https://freshinelife.com/collections/pillow-covers?utm_source=omnisend&amp;utm_medium=email'
  ]);
  assert.match(html, /class="freshine-component freshine-double-gift-address-showcase"[^>]*width="600"[^>]*max-width:600px/);
  assert.equal((html.match(/class="freshine-double-gift-address-card"/g) ?? []).length, 2);
  assert.equal((html.match(/class="freshine-double-gift-address-photo"/g) ?? []).length, 2);
  assert.match(html, /width="262"[^>]*class="freshine-double-gift-address-card"/);
  assert.match(html, /width="12"[^>]*font-size:0;line-height:0/);
  assert.match(html, /font-family:Lora, Georgia, Times New Roman, serif;font-size:30px;font-size:min\(30px,5vw\);font-weight:400;line-height:38px;line-height:min\(38px,6\.333333vw\);letter-spacing:0;text-align:center/);
  assert.match(html, /color:#000000;font-family:Montserrat, Arial, Helvetica, sans-serif;font-size:18px;font-size:min\(18px,3vw\);font-weight:500;line-height:27px;line-height:min\(27px,4\.5vw\);letter-spacing:0;text-align:center/);
  assert.match(html, /background-color:#F4EFEA/);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('双赠品展示卡2的效果演示使用公开的透明底部礼物图标', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-double-gift-address-demo-'));
  const generatedDemo = resolve(temporary, '效果演示.html');
  const result = spawnSync(process.execPath, [resolve(directory, 'render-demo.mjs'), '--output', generatedDemo], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const demo = readFileSync(generatedDemo, 'utf8');
  const committedDemo = readFileSync(resolve(directory, '效果演示.html'), 'utf8');
  assert.match(demo, /default-silk-eye-mask-card-photo\.png/);
  assert.match(demo, /default-pillow-cover-card-photo\.png/);
  assert.equal((demo.match(/shopping-bag-white\.png/g) ?? []).length, 2);
  assert.equal((demo.match(/https:\/\/app\.omnisend\.com\/images\/6a97b53ec723a01883e3afbf/g) ?? []).length, 1);
  assert.match(demo, /class="freshine-component freshine-double-gift-address-showcase"/);
  assert.doesNotMatch(demo, /asset:\/\/|\{\{/);
  const normalizeAssetPaths = (html) => html.replace(/src="[^"]*\/(default-silk-eye-mask-card-photo\.png|default-pillow-cover-card-photo\.png|shopping-bag-white\.png|gift-outline-source\.png)"/g, 'src="$1"');
  assert.equal(normalizeAssetPaths(demo), normalizeAssetPaths(committedDemo), '已提交效果演示必须与临时生成结果一致');
});
