import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  addComponentInstance,
  buildEditorCatalog,
  createCampaignDocument
} from '../skills/build-omnisend-campaign-draft/editor/campaign-editor-core.mjs';
import { editableFieldKeys } from '../skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const componentKey = 'footer.minimalContact';
const componentDirectory = resolve(root, '页脚组件/简约联系页脚');

test('minimal contact footer is independently registered and uses the existing social destinations', () => {
  const registry = JSON.parse(readFileSync(resolve(root, '组件清单.json'), 'utf8'));
  const entry = registry.find((component) => component.componentKey === componentKey);

  assert.deepEqual(entry, {
    中文名称: '简约联系页脚',
    分类: '页脚组件',
    componentKey,
    默认主题: 'minimal-contact-editorial',
    默认变体: 'address-contact-social-legal',
    fixedTheme: false,
    输出宽度: 600,
    路径: {
      组件模板: '页脚组件/简约联系页脚/component.template.v1.html',
      内容契约: '页脚组件/简约联系页脚/content.schema.v1.json',
      设置契约: '页脚组件/简约联系页脚/settings.schema.v1.json',
      默认测试数据: '页脚组件/简约联系页脚/content.fixture.v1.json',
      默认设置: '页脚组件/简约联系页脚/settings.defaults.v1.json',
      中文管理说明: '页脚组件/简约联系页脚/COMPONENT_MANAGEMENT.zh-CN.v1.md',
      组件样式: '页脚组件/简约联系页脚/component.styles.v1.css'
    },
    移动端断点: 375,
    规范版本: 1
  });

  for (const name of [
    'component.template.v1.html', 'component.styles.v1.css', 'content.schema.v1.json',
    'content.fixture.v1.json', 'settings.schema.v1.json', 'settings.defaults.v1.json',
    'COMPONENT_MANAGEMENT.zh-CN.v1.md', '效果演示.html'
  ]) assert.equal(existsSync(resolve(componentDirectory, name)), true, name);

  const fixture = JSON.parse(readFileSync(resolve(componentDirectory, 'content.fixture.v1.json'), 'utf8'));
  assert.equal(fixture.values['footer.address'], '43 Corporate Park Irvine, CA 92606 United States');
  assert.equal(fixture.values['footer.copyright'], '@2026 Freshine. All Rights Reserved.');
  assert.equal(fixture.values['footer.social.youtubeUrl'], 'https://www.youtube.com/@freshinecurtains/shorts');
  assert.equal(fixture.values['footer.social.threadsUrl'], 'https://www.threads.com/@freshinecurtains');

  const catalog = buildEditorCatalog({ workspaceRoot: root });
  assert.ok(catalog.some((component) => component.componentKey === componentKey));
  assert.deepEqual(editableFieldKeys(componentKey), {
    content: [], settings: ['color.background', 'color.text', 'color.link']
  });
});

test('minimal contact footer scales all controlled footer geometry from 600px to 375px', () => {
  const catalog = buildEditorCatalog({ workspaceRoot: root });
  const document = addComponentInstance(createCampaignDocument({ name: 'minimal-contact-footer' }), catalog, componentKey);
  const temporary = mkdtempSync(resolve(tmpdir(), 'freshine-minimal-contact-footer-'));
  const output = resolve(temporary, 'email.html');
  const previewOutput = resolve(temporary, 'preview.html');
  const input = resolve(temporary, 'composition.json');
  const [component] = document.components;
  writeFileSync(input, JSON.stringify({
    schemaVersion: 1,
    canvas: document.canvas,
    output,
    previewOutput,
    components: [{
      name: component.name,
      directory: component.directory,
      componentKey,
      content: component.content,
      settings: component.settings
    }]
  }));

  const result = spawnSync(process.execPath, ['build-email-template.v1.mjs', input], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const html = readFileSync(output, 'utf8');

  assert.ok(html.includes('freshine-minimal-contact-footer'));
  assert.match(html, /<table[^>]*width="100%"[^>]*max-width:600px/);
  assert.match(html, /width="600"[^>]*max-width:600px/);
  assert.match(html, /height="1"[^>]*background-color:#B59B8B/);
  assert.match(html, /padding:16px 24px 0;padding:min\(16px,2\.666667vw\) min\(24px,4vw\) 0/);
  assert.match(html, /font-size:13px;font-size:min\(13px,2\.166667vw\);font-weight:500;line-height:20px;line-height:min\(20px,3\.333333vw\)/);
  assert.match(html, /padding:7px 24px 0;padding:min\(7px,1\.166667vw\) min\(24px,4vw\) 0/);
  assert.match(html, /font-size:14px;font-size:min\(14px,2\.333333vw\);font-weight:500;line-height:21px;line-height:min\(21px,3\.5vw\)/);
  assert.match(html, /<tr><td align="center" style="padding:9px 0 0;padding:min\(9px,1\.5vw\) 0 0;"><table data-freshine-divider="legal"/);
  assert.match(html, /padding:9px 0 0;padding:min\(9px,1\.5vw\) 0 0/);
  assert.match(html, /padding:9px 24px 14px;padding:min\(9px,1\.5vw\) min\(24px,4vw\) min\(14px,2\.333333vw\)/);
  assert.match(html, /font-size:12px;font-size:min\(12px,2vw\);font-weight:500;line-height:21px;line-height:min\(21px,3\.5vw\)/);
  assert.match(html, /@2026 Freshine\. All Rights Reserved\./);
  assert.equal((html.match(/data-freshine-social-icon=/g) ?? []).length, 7);
  assert.equal((html.match(/\[\[unsubscribe_link\]\]/g) ?? []).length, 1);
  assert.ok(html.includes('https://api.whatsapp.com/send/?phone=19496916598&amp;text=Hello&amp;type=phone_number&amp;app_absent=0'));
  assert.doesNotMatch(html, /\{\{(?:content|settings)\./);
  assert.doesNotMatch(html, /<style\b|<script\b|<iframe\b|<form\b|<svg\b|<div\b|display:\s*(?:flex|grid)|position:\s*(?:absolute|fixed)/i);
});
