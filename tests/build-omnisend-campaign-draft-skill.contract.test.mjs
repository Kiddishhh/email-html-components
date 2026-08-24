import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = new URL('../skills/build-omnisend-campaign-draft/', import.meta.url);
const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const validator = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs', import.meta.url));
const retiredTerms = /旧版|六个固定区段|固定六区段|固定区段|campaign-component-interactions\.v1\.json/u;

async function read(relativePath) {
  return readFile(new URL(relativePath, skillRoot), 'utf8');
}

function registryFixture({ includeDemo = true, contentComponentKey = 'hero.promotionalOverlay' } = {}) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'freshine-campaign-registry-'));
  const registry = JSON.parse(readFileSync(join(workspaceRoot, '组件清单.json'), 'utf8'));
  const hero = registry[0];
  for (const relativePath of Object.values(hero.路径)) {
    const source = join(workspaceRoot, relativePath);
    const target = join(fixtureRoot, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
  if (includeDemo) {
    const relativeDirectory = dirname(hero.路径.组件模板);
    mkdirSync(join(fixtureRoot, relativeDirectory), { recursive: true });
    cpSync(join(workspaceRoot, relativeDirectory, '效果演示.html'), join(fixtureRoot, relativeDirectory, '效果演示.html'));
  }
  if (contentComponentKey !== hero.componentKey) {
    const contentPath = join(fixtureRoot, hero.路径.内容契约);
    const contentSchema = JSON.parse(readFileSync(contentPath, 'utf8'));
    contentSchema.componentKey = contentComponentKey;
    writeFileSync(contentPath, JSON.stringify(contentSchema, null, 2));
  }
  writeFileSync(join(fixtureRoot, '组件清单.json'), JSON.stringify(registry, null, 2));
  return join(fixtureRoot, '组件清单.json');
}

test('Skill routes current Campaign work through the visual editor and focused references', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /^---\nname: build-omnisend-campaign-draft\ndescription: Use when /u);
  assert.match(skill, /start-campaign-editor\.mjs 4173/u);
  assert.match(skill, /组件清单\.json/u);
  assert.match(skill, /600px.*375px/su);
  assert.match(skill, /visual-editor-workflow\.zh-CN\.md/u);
  assert.match(skill, /component-interactions\.zh-CN\.md/u);
  assert.match(skill, /new-component-standard\.zh-CN\.md/u);
  assert.match(skill, /workflow-and-safety\.zh-CN\.md/u);
  assert.match(skill, /shopify-data-contract\.zh-CN\.md/u);
  assert.doesNotMatch(skill, retiredTerms);
});

test('new-component standard preserves the approved design, registration, and email-safety boundaries', async () => {
  const standard = await read('references/new-component-standard.zh-CN.md');

  assert.match(standard, /600px.*375px/su);
  assert.match(standard, /table.*inline CSS/su);
  assert.match(standard, /Flex.*Grid/su);
  assert.match(standard, /独立.*点击链接/su);
  assert.match(standard, /单独目录.*componentKey/su);
  assert.match(standard, /组件清单\.json.*单一事实来源/su);
  assert.match(standard, /效果演示\.html/u);
  assert.match(standard, /node --test tests\/\*\.test\.mjs/u);
  assert.match(standard, /不得发送.*排期.*发布/su);
});

test('current component guide covers every registered component without retired routing language', async () => {
  const registry = JSON.parse(readFileSync(join(workspaceRoot, '组件清单.json'), 'utf8'));
  const guide = await read('references/component-interactions.zh-CN.md');

  for (const { componentKey } of registry) {
    assert.match(guide, new RegExp(`\\b${componentKey.replaceAll('.', '\\.')}\\b`, 'u'), componentKey);
  }
  assert.match(guide, /导航开关/u);
  assert.match(guide, /542×527px/u);
  assert.match(guide, /548×495px/u);
  assert.match(guide, /七枚.*(?:Logo|图标)/su);
  assert.doesNotMatch(guide, retiredTerms);
});

test('visual editor guide describes the current interaction loop and template lifecycle', async () => {
  const workflow = await read('references/visual-editor-workflow.zh-CN.md');

  assert.match(workflow, /保存模板.*选择.*删除/su);
  assert.match(workflow, /自由.*添加.*重复.*排序.*删除/su);
  assert.match(workflow, /定位.*预览区顶部/su);
  assert.match(workflow, /显示顶部导航栏/u);
  assert.match(workflow, /导出 Omnisend HTML/u);
  assert.match(workflow, /上传 Omnisend 草稿/u);
  assert.doesNotMatch(workflow, retiredTerms);
});

test('workflow guide keeps local assets and remote writes behind explicit safety gates', async () => {
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(safety, /本地图片.*公开 HTTPS/su);
  assert.match(safety, /最终确认/u);
  assert.match(safety, /内容哈希/u);
  assert.match(safety, /API Key.*内存/su);
  assert.match(safety, /不得发送.*排期.*发布/su);
  assert.match(safety, /\[\[unsubscribe_link\]\]/u);
  assert.match(safety, /普通草稿.*关闭编辑器时清理/su);
  assert.doesNotMatch(safety, retiredTerms);
});

test('Shopify reference remains a read-only optional import contract', async () => {
  const shopify = await read('references/shopify-data-contract.zh-CN.md');

  assert.match(shopify, /只读/u);
  assert.match(shopify, /禁止.*GraphQL mutation/su);
  assert.match(shopify, /禁止.*theme push/su);
  assert.match(shopify, /list-sale-activities\.mjs/u);
  assert.match(shopify, /fetch-sale-activity\.mjs/u);
  assert.match(shopify, /fetch-sale-grid\.mjs/u);
  assert.match(shopify, /fetch-single-product\.mjs/u);
  assert.match(shopify, /MediaImage/u);
  assert.match(shopify, /每个商品.*8.*变体.*继续分页/su);
});

test('campaign validator reports every registered component as editor-ready', () => {
  const result = spawnSync(process.execPath, [validator], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const validation = JSON.parse(result.stdout);
  const registry = JSON.parse(readFileSync(join(workspaceRoot, '组件清单.json'), 'utf8'));
  assert.equal(validation.selection, 'user-ordered-registered-components');
  assert.deepEqual(validation.components, registry.map(({ componentKey }) => componentKey));
  assert.equal(validation.componentCount, registry.length);
  assert.equal(validation.editorComponentCount, registry.length);
});

test('campaign validation rejects a registered component without its real demo', () => {
  const result = spawnSync(process.execPath, [validator, '--registry', registryFixture({ includeDemo: false })], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hero\.promotionalOverlay.*效果演示\.html/u);
});

test('campaign validation rejects component and Schema key drift', () => {
  const result = spawnSync(process.execPath, [validator, '--registry', registryFixture({ contentComponentKey: 'hero.wrongKey' })], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hero\.promotionalOverlay.*content Schema.*hero\.wrongKey/u);
});

test('retired editor and interaction-index files are absent from the active Skill package', () => {
  for (const relativePath of [
    'scripts/campaign-editor-server.mjs',
    'editor/app.js',
    'editor/index.html',
    'editor/styles.css',
    'references/campaign-component-interactions.v1.json'
  ]) assert.equal(existsSync(fileURLToPath(new URL(relativePath, skillRoot))), false, relativePath);
});
