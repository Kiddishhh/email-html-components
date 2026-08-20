# Freshine Omnisend 邮件 HTML 组件库

本项目维护 Freshine 的邮件安全组件、可视化 Campaign 编辑器、静态拼接器、Shopify 只读导入和 Omnisend Draft-only 输出。

## 当前架构

- [`组件清单.json`](组件清单.json)：19 个组件及文件路径的单一事实来源。
- [`组件索引.md`](组件索引.md)：全部当前组件的管理说明、模板和效果演示入口。
- `build-email-template.v1.mjs`：校验完整组件快照、内联当前组件 CSS，并按 composition 顺序生成静态 HTML。
- `skills/build-omnisend-campaign-draft/`：可视化编辑器、注册校验、当前 Skill 与安全指南。
- `compositions/`：可复现的完整快照示例。
- `tests/`：Node.js 回归测试。

所有已注册组件均可在编辑器中自由添加、重复、排序、编辑、确认和删除。组件分类只用于浏览，不限制邮件结构或顺序。

## 可视化编辑器

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

打开 `http://127.0.0.1:4173`。当前功能包括：

- 600px 桌面和 375px 移动预览；
- 选择结构项后定位到对应预览区域；
- 组件字段、颜色、本地图片和头图导航开关；
- 模板保存、选择、覆盖和删除；
- 六宫格及单品窗帘促销卡的 Shopify 只读导入；
- Omnisend HTML 导出和 Draft-only 上传。

本地会话和可再生成的输出写入被 Git 忽略的 `campaign-drafts/` 与 `build/`。

## 校验与测试

需要 Node.js 20 或更高版本，无第三方 npm 依赖。

验证所有注册组件与编辑器字段契约：

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
```

运行测试：

```bash
node --test tests/*.test.mjs
```

检查 JavaScript 语法：

```bash
for file in build-email-template.v1.mjs skills/build-omnisend-campaign-draft/scripts/*.mjs skills/build-omnisend-campaign-draft/editor/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.mjs skills/build-omnisend-campaign-draft/editor/public/*.js; do
  node --check "$file"
done
```

## 组件维护规则

每个组件目录必须保持以下文件同步：

- `component.template.v1.html`
- `component.styles.v1.css`
- `content.schema.v1.json`
- `content.fixture.v1.json`
- `settings.schema.v1.json`
- `settings.defaults.v1.json`
- `COMPONENT_MANAGEMENT.zh-CN.v1.md`
- `效果演示.html`

组件注册还必须同步 `组件清单.json`、`editor/public/editor-ui-contract.mjs`、当前组件指南和回归测试。桌面画布上限为 600px，移动端检查宽度为 375px；图片保持比例，布局使用邮件安全表格和内联 CSS。

## 安全边界

- `asset://` 和本地路径只允许用于本地预览；正式 HTML 使用公开 HTTPS 图片。
- Shopify 操作严格只读，不修改商品、页面、Collection 或主题。
- Omnisend API Key 由编辑器对话框一次性收集，只保留在内存中，不写入文件、参数、环境变量、日志或草稿。
- HTML 导出不会创建或更新 Campaign。
- Draft 上传只创建或更新 `draft`，回读验证后状态仍必须为 `draft`；不得发送、排期或发布。
- 更新 Email Content 时保留完整结构、节点 ID 和 `[[unsubscribe_link]]`。
- 本地静态预览不是 Omnisend 或真实收件箱验证；上线前仍需检查 Omnisend Desktop/Mobile/Dark Mode 以及目标邮件客户端。
