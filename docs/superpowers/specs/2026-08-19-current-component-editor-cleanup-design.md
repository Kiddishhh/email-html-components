# 当前组件与编辑器清理设计

## 目标

保留 19 个已注册组件各自确认过的视觉设计，只统一邮件与编辑器的工程基线；修复移动端编辑器错乱，移除已无引用的旧版编辑器与固定区段契约，并让 Skill、指南、注册校验和实际编辑器保持一致。

## 已确认边界

- `组件清单.json` 是组件注册的单一事实来源。
- 组件在 600px 邮件画布中按各自设计渲染，375px 为移动端检查宽度。
- 不把不同组件的字体、按钮和留白强制改成同一视觉风格。
- 统一项仅包括：画布宽度、移动端可用性、图片不拉伸、邮件安全 HTML/CSS、可点击区域、编辑器字段白名单和注册完整性。
- 保留现有本地图片引用、模板保存/选择/删除、结构定位、导航开关、HTML 导出和 Draft-only 上传能力。
- 不发送、排期或发布 Omnisend Campaign；Shopify 访问保持只读。

## 设计

### 编辑器响应式布局

桌面端维持组件列表、实时预览、属性面板三栏。中等宽度允许两列并把属性面板置于下一行；窄屏改为单列，顶部栏、模板栏、组件列表、预览和属性面板按顺序纵向显示。预览区不得被压成窄条，控件不得移出视口。

### 注册与校验

`组件清单.json`、每个组件的模板/Schema/fixture/defaults/管理说明/样式/效果演示，以及 `editor-ui-contract.mjs` 的字段白名单共同构成可编辑注册契约。校验器对注册表中的全部组件执行完整性检查，不再通过旧交互索引筛掉自由组合组件。

### 前端安全

所有来自组件元数据或运行时错误的信息以 DOM 节点和 `textContent` 写入界面。仅固定、无外部值的静态空状态可使用常量 HTML。导出邮件继续禁止 JavaScript、iframe、表单和未上传的本地资源。

### 清理范围

删除仅被自身旧入口引用、未被当前启动脚本、服务器或测试使用的旧编辑器文件：

- `skills/build-omnisend-campaign-draft/scripts/campaign-editor-server.mjs`
- `skills/build-omnisend-campaign-draft/editor/app.js`
- `skills/build-omnisend-campaign-draft/editor/index.html`
- `skills/build-omnisend-campaign-draft/editor/styles.css`

删除不再参与当前注册或运行时的 `campaign-component-interactions.v1.json`，并从校验器、测试与指南中移除其依赖。历史设计计划保留，不作为当前运行指南。

### Skill 与指南

Skill 只保留当前入口、注册规则、组件分类、编辑器功能、预览/导出流程和安全边界。详细参考拆分为：

- `visual-editor-workflow.zh-CN.md`：当前编辑器操作与状态变化。
- `component-interactions.zh-CN.md`：当前 19 个组件的可编辑范围和视觉固定项。
- `workflow-and-safety.zh-CN.md`：本地预览、导出和 Draft-only 安全门。
- `shopify-data-contract.zh-CN.md`：仅在执行 Shopify 导入时读取的只读数据契约。

## 验证标准

- 校验器报告注册表全部 19 个组件均可编辑，且注册键与编辑器白名单完全一致。
- 375px 编辑器为单列，无水平滚动；组件列表、预览和属性面板均可操作。
- 600px 与 375px 的全部组件预览无横向溢出、图片拉伸或跨组件样式泄漏。
- 前端不使用运行时字符串拼接到 `innerHTML`。
- 全量 Node 测试、契约校验、语法检查和 `git diff --check` 通过。
