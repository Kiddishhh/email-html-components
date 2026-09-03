import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';
import { addComponentInstance, buildEditorCatalog, buildLocalAssetMap, createCampaignDocument } from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentKey = 'review.trustpilotImage';
const directory = resolve(root, '评论组件/Trustpilot 整图评论');

const reviewFields = [0, 1].flatMap((index) => [
  `reviews[${index}].author`,
  `reviews[${index}].title`,
  `reviews[${index}].body`,
  `reviews[${index}].date`
]);

test('Trustpilot 评论卡作为独立的 600px 可编辑评论组件进入编辑器', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((item) => item.componentKey === componentKey);
  assert.ok(entry, 'Trustpilot 整图评论必须在组件清单中独立登记');
  assert.equal(entry.中文名称, 'Trustpilot 评论卡');
  assert.equal(entry.分类, '评论组件');
  assert.equal(entry.输出宽度, 600);
  assert.equal(entry.移动端断点, 375);
  assert.deepEqual(editableFieldKeys(componentKey), { content: reviewFields, settings: [] });

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const catalogEntry = catalog.find((item) => item.componentKey === componentKey);
  assert.ok(catalogEntry, 'Trustpilot 整图评论必须能在编辑器中选择');
  assert.equal(catalogEntry.name, 'Trustpilot 评论卡');
  assert.ok(existsSync(resolve(directory, '效果演示.html')));
});

test('Trustpilot 评论卡使用固定品牌素材，并允许两条评论文字分别替换', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'trustpilot-image-review' }), catalog, componentKey);
  const component = document.components[0];
  assert.equal(component.content['reviews[0].author'], 'Evan Parker');
  assert.equal(component.content['reviews[1].title'], 'Great Affordable Custom Drapes');
  assert.equal(component.content['reviews[1].date'], 'Dec 21, 2025');

  const assets = buildLocalAssetMap(document, { workspaceRoot: root });
  const expectedAssets = {
    'trustpilot-header': { width: 768, height: 68, hash: '5ae784596e61b547905ef20c262393bf7e8d34d754368e8322ac2d6d102e012b' },
    'trustpilot-five-stars': { width: 260, height: 48, hash: '0e032eb43e993c1bf1fcd780879892f7f1353fb8f4dcbcfbe3bad67e0038a96c' },
    'trustpilot-verified-check': { width: 29, height: 22, hash: '2924905f9228ea4bd8b407424ed9f350b2bd70feb6684563b3c032c38f9721a7' }
  };
  for (const [assetKey, expected] of Object.entries(expectedAssets)) {
    const png = readFileSync(resolve(root, assets[assetKey].path));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(png.readUInt32BE(16), expected.width);
    assert.equal(png.readUInt32BE(20), expected.height);
    assert.equal(createHash('sha256').update(png).digest('hex'), expected.hash);
  }

  const template = readFileSync(resolve(directory, 'component.template.v1.html'), 'utf8');
  assert.equal((template.match(/<img\b/g) ?? []).length, 5);
  assert.doesNotMatch(template, /<a\b|href=|default-trustpilot-image-review|object-fit|clip-path|position:(?:absolute|fixed)/i);
  assert.match(template, /reviews\[0\]\.author/);
  assert.match(template, /reviews\[1\]\.body/);
});

test('Trustpilot 评论卡导出为无链接的邮件安全双评论结构和指定文字层级', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'trustpilot-image-review-export' }), catalog, componentKey);
  const component = document.components[0];
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-trustpilot-image-review-'));
  const output = resolve(temporary, 'email.html');
  const previewOutput = resolve(temporary, 'preview.html');
  const input = resolve(temporary, 'composition.json');
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: { backgroundColor: '#FFFFFF', outerBackgroundColor: '#FFFFFF', contentWidth: 600, mobileTargetWidth: 375, verticalPadding: 0 },
    output,
    previewOutput,
    components: [{
      name: component.name,
      directory: component.directory,
      componentKey,
      content: {
        ...component.content,
        'brand.header.url': 'https://cdn.example.com/trustpilot-header.png',
        'review.stars.url': 'https://cdn.example.com/trustpilot-stars.png',
        'review.verifiedCheck.url': 'https://cdn.example.com/trustpilot-check.png',
        'reviews[0].body': 'First line\nSecond & <unsafe>'
      },
      settings: { ...component.settings }
    }]
  }));

  const result = spawnSync(process.execPath, [resolve(root, 'build-email-template.v1.mjs'), input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');
  const preview = readFileSync(previewOutput, 'utf8');
  assert.equal((html.match(/<img\b/g) ?? []).length, 5);
  assert.match(html, /class="freshine-component freshine-trustpilot-review-card"[^>]*background-color:#F5F2ED/);
  assert.match(html, /src="https:\/\/cdn\.example\.com\/trustpilot-header\.png"/);
  assert.match(html, /Evan Parker/);
  assert.match(html, /Great Affordable Custom Drapes/);
  assert.match(html, /First line<br>Second &amp; &lt;unsafe&gt;/);
  assert.match(html, /color:#7A6A60[^>]*text-align:center/);
  assert.match(html, /font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-size:min\(20px,3\.333333vw\);font-weight:600;line-height:150%/);
  assert.match(html, /data-freshine-slot="reviews\[0\]\.title" style="display:block;color:#202020;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-size:min\(20px,3\.333333vw\);font-weight:600;line-height:150%/);
  assert.match(html, /data-freshine-slot="reviews\[1\]\.title" style="display:block;color:#202020;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:20px;font-size:min\(20px,3\.333333vw\);font-weight:600;line-height:150%/);
  assert.match(html, /font-family:&#39;Noto Sans SC&#39;,Arial,Helvetica,sans-serif;font-size:16px;font-size:min\(16px,2\.666667vw\);font-weight:400;line-height:135%/);
  assert.match(preview, /family=Noto\+Sans\+SC:wght@400/);
  assert.doesNotMatch(html, /<a\b|href=|<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)|asset:\/\/|file:\/\/|data:image|\{\{/i);
});

test('Trustpilot 评论卡演示由真实默认快照和分离素材生成', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-trustpilot-image-review-demo-'));
  const generatedDemo = resolve(temporary, '效果演示.html');
  const result = spawnSync(process.execPath, [resolve(directory, 'render-demo.mjs'), '--output', generatedDemo], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const demo = readFileSync(generatedDemo, 'utf8');
  const committedDemo = readFileSync(resolve(directory, '效果演示.html'), 'utf8');
  assert.match(demo, /trustpilot-header\.png/);
  assert.match(demo, /class="freshine-component freshine-trustpilot-review-card"/);
  assert.doesNotMatch(demo, /asset:\/\/|\{\{/);
  const normalizeAssetPath = (html) => html.replace(/src="[^"]*\/(trustpilot-(?:header|five-stars|verified-check)\.png)"/g, 'src="$1"');
  assert.equal(normalizeAssetPath(demo), normalizeAssetPath(committedDemo));
});
