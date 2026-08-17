import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const skillRoot = new URL('../skills/build-omnisend-campaign-draft/', import.meta.url);
const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const validator = fileURLToPath(new URL('../skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs', import.meta.url));

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

test('skill records the approved campaign workflow and safety gates', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /^---\nname: build-omnisend-campaign-draft\n/m);
  assert.match(skill, /hero\.promotionalOverlay/);
  assert.match(skill, /collection\.saleGrid6/);
  assert.match(skill, /image\.clickableFullWidth/);
  assert.match(skill, /gift\.rewardGrid2/);
  assert.match(skill, /location\.showroomCard/);
  assert.match(skill, /footer\.warm/);
  assert.match(skill, /footer\.warm.*必须.*最后/);
  assert.match(skill, /禁止.*发送|不得.*发送/);
  assert.match(skill, /最终.*确认/);
  assert.match(skill, /本地.*预览/);
  assert.match(skill, /内容哈希/);
});

test('campaign metadata collection explains its three fields in Chinese', async () => {
  const skill = await read('SKILL.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(skill, /Campaign 名称.*内部识别/);
  assert.match(skill, /Subject.*收件箱.*主题/);
  assert.match(skill, /Preheader.*主题.*预览摘要/);
  assert.match(safety, /Campaign 名称.*内部识别/);
  assert.match(safety, /Subject.*收件箱.*主题/);
  assert.match(safety, /Preheader.*预览摘要/);
});

test('references preserve the approved interaction and Shopify contracts', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');
  const shopify = await read('references/shopify-data-contract.zh-CN.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(interactions, /hero\.promotionalOverlay/);
  assert.match(interactions, /600:722/);
  assert.match(interactions, /1200[×x]1444/);
  assert.match(interactions, /collection\.saleGrid6/);
  assert.match(interactions, /主动.*标题.*说明/);

  assert.match(shopify, /selected_or_first_available_variant/);
  assert.match(shopify, /compareAtPrice/);
  assert.match(shopify, /onlineStoreUrl/);
  assert.match(shopify, /media\(first:\s*1.*media_type:IMAGE.*sortKey:\s*POSITION/s);
  assert.match(shopify, /MediaImage/);
  assert.match(shopify, /商品详情页.*第一张图片/);
  assert.match(shopify, /不得.*featuredImage.*回退/);
  assert.match(shopify, /SAVE/);

  assert.match(safety, /所有订阅用户/);
  assert.match(safety, /上传.*本地图片/);
  assert.match(safety, /回读验证/);
  assert.match(safety, /项目草稿/);
});

test('sale grid presents default-injected content as an editable current-settings card', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(interactions, /CTA.*默认.*推荐 Collection.*完整 URL/);
  assert.match(interactions, /`SHOP NOW`.*默认文字/);
  assert.match(interactions, /默认注入.*卡片/);
  assert.match(interactions, /卡片.*商品图片.*Alt.*商品详情链接.*折扣标签.*CTA/);
  assert.match(interactions, /用户.*主动指出.*修改/);
});

test('sale grid uses one action color and conditionally asks for its separate background color', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(interactions, /一个操作色.*六个折扣标签.*CTA.*主题色/);
  assert.match(interactions, /背景色.*单独.*设置/);
  assert.match(interactions, /未设置.*全局统一色号.*单独询问/);
  assert.match(interactions, /已设置.*全局统一色号.*当前默认值.*卡片/);
  assert.match(interactions, /用户.*主动提出修改.*才覆盖/);
});

test('sale grid locks only after one explicit confirmation of the card and both previews', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(interactions, /当前设置卡片.*桌面端预览.*375px.*移动端预览/);
  assert.match(interactions, /只询问一次.*是否确认/);
  assert.match(interactions, /主动指出.*修改.*重新生成.*三项/);
  assert.match(interactions, /明确确认.*锁定/);
});

test('clickable image uses the confirmed review-friendly geometry and one completion card', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(interactions, /image\.clickableFullWidth/);
  assert.match(interactions, /600px.*全宽.*零外边距.*1200\s*[x×]\s*2186px.*600\s*[x×]\s*1093px.*375\s*[x×]\s*683px/s);
  assert.match(interactions, /先提示.*尺寸.*再.*图片链接/);
  assert.match(interactions, /公开 HTTPS.*本地图片路径/);
  assert.match(interactions, /Alt.*实际图片内容/);
  assert.match(interactions, /https:\/\/freshinelife\.com\//);
  assert.match(interactions, /完成卡片.*桌面端.*375px.*移动端预览/s);
});

test('hero permits an explicitly selected default local visual for preview and uploads it only at the final gate', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(interactions, /用户.*明确.*使用.*默认.*主图/);
  assert.match(interactions, /本地预览/);
  assert.match(interactions, /最终.*上传.*公开 HTTPS/);
  assert.match(safety, /上传.*本地图片/);
});

test('hero renders homepage activity name before discount message using the selected slide fields', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');
  const skill = await read('SKILL.md');

  assert.match(interactions, /`slideshow-v2`.*`subheading`.*`hero\.eyebrow`/);
  assert.match(interactions, /`slideshow-v2`.*`heading`.*`hero\.title`/);
  assert.match(interactions, /`slideshow-v2`.*`description`.*`hero\.subtitle`/);
  assert.match(skill, /`subheading`.*`hero\.eyebrow`.*`heading`.*`hero\.title`.*`description`.*`hero\.subtitle`/);
});

test('hero logo style has one dedicated confirmation before the final hero confirmation', async () => {
  const interactions = await read('references/component-interactions.zh-CN.md');
  const skill = await read('SKILL.md');

  for (const document of [skill, interactions]) {
    assert.match(document, /Logo 样式确认/);
    assert.match(document, /主视觉图片.*Logo 样式确认.*首图完成卡片/s);
    assert.match(document, /白色.*FreShine.*#A79689.*70%/s);
    assert.match(document, /106px.*80px/s);
    assert.match(document, /Logo.*设置卡片.*桌面端预览.*375px.*移动端预览/s);
    assert.match(document, /只询问一次.*采用默认 Logo 样式/);
    assert.match(document, /#[0-9A-Fa-f]{6}.*0[–-]100%/);
    assert.match(document, /确定性.*rgba/);
    assert.match(document, /Outlook.*实色.*降级/);
    assert.match(document, /Logo 图片.*Alt.*点击链接.*圆形背景色.*透明度/s);
    assert.match(document, /默认值.*可编辑|可编辑.*默认值/s);
    assert.match(document, /本地.*Logo.*最终.*上传/s);
    assert.match(document, /106px.*80px.*固定/s);
  }
});

test('Shopify access is strictly read-only', async () => {
  const skill = await read('SKILL.md');
  const shopify = await read('references/shopify-data-contract.zh-CN.md');

  assert.match(skill, /Shopify.*只读/);
  assert.match(shopify, /只允许.*store info/);
  assert.match(shopify, /只允许.*store execute/);
  assert.match(shopify, /只允许.*theme list/);
  assert.match(shopify, /只允许.*theme pull/);
  assert.match(shopify, /禁止.*--allow-mutations/);
  assert.match(shopify, /禁止.*GraphQL mutation/);
  assert.match(shopify, /禁止.*theme push/);
  assert.match(shopify, /禁止.*theme publish/);
  assert.match(shopify, /禁止.*theme delete/);
  assert.match(shopify, /不得.*修改.*删除.*Shopify/);
  assert.doesNotMatch(shopify, /read_online_store_navigation/);
  assert.match(shopify, /read_online_store_pages.*read_content|read_content.*read_online_store_pages/);
});

test('campaign structure validates the six fixed slots and interaction-ready styles', async () => {
  const result = spawnSync(process.execPath, [validator], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const structure = JSON.parse(await read('references/campaign-structure.v1.json'));
  assert.deepEqual(structure.slots.map(({ id }) => id), [
    'hero',
    'sale-grid',
    'clickable-image',
    'gift',
    'location',
    'footer'
  ]);
});

test('campaign validation rejects a selectable component without its real demo', () => {
  const registry = registryFixture({ includeDemo: false });
  const result = spawnSync(process.execPath, [validator, '--registry', registry], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hero\.promotionalOverlay.*效果演示\.html/u);
});

test('campaign validation rejects a component whose content Schema key drifted', () => {
  const registry = registryFixture({ contentComponentKey: 'hero.wrongKey' });
  const result = spawnSync(process.execPath, [validator, '--registry', registry], { cwd: workspaceRoot, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hero\.promotionalOverlay.*content Schema.*hero\.wrongKey/u);
});

test('Skill uses the Campaign contracts to select six fixed slots one at a time', async () => {
  const skill = await read('SKILL.md');
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(skill, /campaign-structure\.v1\.json/);
  assert.match(skill, /campaign-component-interactions\.v1\.json/);
  assert.match(skill, /首图.*促销多商品栏.*整图链接.*赠品.*地址.*页脚/s);
  assert.match(skill, /每次.*一个区段.*样式/);
  assert.match(interactions, /gift\.rewardGrid2/);
  assert.match(interactions, /location\.showroomCard/);
  assert.match(interactions, /footer\.warm/);
  assert.match(interactions, /预约与收件限制说明.*国家.*电话/s);
});

test('Skill defaults to the legacy free-form visual editor and its Draft-only upload flow', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /默认入口：可视化编辑器/);
  assert.match(skill, /start-campaign-editor\.mjs 4173/);
  assert.match(skill, /组件清单\.json.*所有已注册组件/s);
  assert.match(skill, /自由添加、重复、拖拽排序或删除/s);
  assert.match(skill, /上传 Omnisend 草稿/);
  assert.match(skill, /终端.*API Key/s);
});

test('Skill invokes the tested Shopify scripts in their locked-data order', async () => {
  const skill = await read('SKILL.md');
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(skill, /list-sale-activities\.mjs/);
  assert.match(skill, /fetch-sale-activity\.mjs/);
  assert.match(skill, /fetch-sale-grid\.mjs/);
  assert.match(skill, /锁定.*推荐 Collection.*fetch-sale-grid\.mjs/s);
  assert.match(skill, /选定.*展示.*subheading.*heading.*description/s);
  assert.match(interactions, /选定.*展示.*subheading.*heading.*description/s);
  assert.match(interactions, /不新增.*确认/);
});

test('workflow reference preserves the fixed six-slot selection boundary', async () => {
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(safety, /campaign-structure\.v1\.json/);
  assert.match(safety, /campaign-component-interactions\.v1\.json/);
  assert.match(safety, /首图.*促销多商品栏.*整图链接.*赠品.*地址.*页脚/s);
  assert.match(safety, /每次.*一个区段.*样式/);
  assert.doesNotMatch(safety, /前五个.*可选.*可排序/);
});

test('Shopify contract records homepage-slide activity discovery without menu or all-Page scans', async () => {
  const shopify = await read('references/shopify-data-contract.zh-CN.md');
  const skill = await read('SKILL.md');
  const interactions = await read('references/component-interactions.zh-CN.md');

  assert.match(shopify, /fetch-sale-grid\.mjs.*已实现/);
  assert.match(shopify, /首页.*slideshow-v2/);
  assert.match(shopify, /不读取.*菜单/);
  assert.match(shopify, /不.*全量.*Page/);
  assert.match(shopify, /选定.*slide.*链接.*Page/);
  assert.match(skill, /首页.*slide/);
  assert.match(skill, /多个.*slide.*选/);
  assert.match(interactions, /首页.*slide/);
  assert.match(interactions, /多个.*候选.*编号/);
  assert.match(shopify, /slideshow-v2/);
  assert.match(shopify, /products-grid-v2/);
  assert.match(shopify, /list-sale-activities\.mjs.*已实现/);
  assert.match(shopify, /fetch-sale-activity\.mjs.*已实现/);
});

test('sale-grid discovery uses bounded variant reads with per-product pagination only when needed', async () => {
  const skill = await read('SKILL.md');
  const shopify = await read('references/shopify-data-contract.zh-CN.md');

  assert.match(skill, /每个商品.*8.*变体.*仅.*未找到.*可售.*继续分页/s);
  assert.match(shopify, /每个商品.*8.*变体.*仅.*未找到.*可售.*继续分页/s);
  assert.doesNotMatch(shopify, /variants\(first:\s*250\)/);
});

test('style selection opens the component demo instead of substituting a standalone asset', async () => {
  const skill = await read('SKILL.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(skill, /组件目录.*`效果演示\.html`.*样式演示/);
  assert.match(skill, /不得.*单独素材图.*代替.*组件预览/);
  assert.match(safety, /组件目录.*`效果演示\.html`.*样式演示/);
});

test('local previews resolve registered assets relative to the preview HTML file', async () => {
  const skill = await read('SKILL.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(skill, /本地预览.*`asset:\/\/`.*相对于.*`previewOutput`/s);
  assert.match(safety, /`asset:\/\/`.*相对.*`previewOutput`.*实际文件/s);
  assert.match(safety, /本地资源.*最终.*公开 HTTPS/s);
});

test('footer component provides a real preview demo for style selection', async () => {
  const demo = await readFile(new URL('../页脚组件/品牌信息页脚/效果演示.html', import.meta.url), 'utf8');

  assert.match(demo, /data-freshine-preview-shell="omnisend-custom-html"/);
  assert.match(demo, /Freshine Curtains/);
  assert.match(demo, /\[\[unsubscribe_link\]\]/);
});

test('body background color is applied to component settings, not the email canvas', async () => {
  const safety = await read('references/workflow-and-safety.zh-CN.md');
  const composition = JSON.parse(await readFile(new URL('../compositions/hero-grid-review-gifts-location.default.v1.json', import.meta.url), 'utf8'));
  const saleGrid = composition.components.find(({ componentKey }) => componentKey === 'collection.saleGrid6');
  const rewardGrid = composition.components.find(({ componentKey }) => componentKey === 'gift.rewardGrid2');
  const showroom = composition.components.find(({ componentKey }) => componentKey === 'location.showroomCard');

  assert.match(safety, /正文组件背景色.*组件.*settings.*不得.*canvas/s);
  assert.equal(composition.canvas.backgroundColor, '#FBFAF8');
  assert.equal(composition.canvas.outerBackgroundColor, '#FFFFFF');
  assert.equal(saleGrid.settings['color.surface'], '#FBFAF8');
  assert.equal(rewardGrid.settings['color.surface'], '#FBFAF8');
  assert.equal(showroom.settings['color.surface'], '#FFFFFF');
});

test('draft upload is delegated to the fixed script with a runtime-only API key', async () => {
  const skill = await read('SKILL.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  assert.match(skill, /upload-omnisend-draft\.mjs/);
  assert.match(skill, /运行时.*询问.*Omnisend API Key/s);
  assert.match(skill, /不得.*手工.*Omnisend.*请求/s);
  assert.match(safety, /upload-omnisend-draft\.mjs/);
  assert.match(safety, /密钥.*不.*保存.*日志/s);
  assert.match(safety, /不得.*\/send.*不得.*排期/s);
  assert.match(safety, /回读.*status.*draft/s);
  assert.match(safety, /Brand.*senderName.*只读/s);
  assert.match(skill, /已有.*Campaign ID.*更新.*现有.*draft.*不得.*新建/s);
  assert.match(safety, /已有.*Campaign ID.*回读.*draft.*Email Content.*PUT.*不得.*新建/s);
});

test('a verified draft preserves the local project until the user explicitly requests cleanup', async () => {
  const skill = await read('SKILL.md');
  const safety = await read('references/workflow-and-safety.zh-CN.md');

  for (const document of [skill, safety]) {
    assert.match(document, /默认保留.*项目草稿/s);
    assert.match(document, /用户.*明确确认.*清理/s);
    assert.doesNotMatch(document, /回读验证成功后删除完整项目草稿/);
    assert.doesNotMatch(document, /回读成功后删除完整项目草稿/);
  }
});

test('project state keeps final confirmation separate from the remote draft status', async () => {
  const state = JSON.parse(await readFile(new URL('./fixtures/project-state.draft-example.v1.json', import.meta.url), 'utf8'));

  assert.equal(state.finalConfirmation.status, 'confirmed');
  assert.equal(state.finalConfirmation.remoteStatus, 'draft');
});
