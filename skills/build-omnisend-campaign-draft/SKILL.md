---
name: build-omnisend-campaign-draft
description: Use when 用户要制作邮件、编辑营销邮件、打开邮件编辑器、推荐活动邮件主题或副标题，或把参考图/HTML制作注册为可复用组件、修改现有邮件组件；适用于 Freshine/Omnisend HTML 邮件及600px桌面、375px移动适配。 Also use for creating, editing, previewing or exporting Freshine Omnisend campaigns and reusable email components.
---

# Freshine 邮件应用管理

管理当前组件式邮件应用。用户手动在编辑器操作；AI在对话内建议文案、制作和维护组件，并按实际授权执行输出。保留现有应用、注册表和导出上传流程。

## 请求分流

| 用户意图 | 执行方式 | 需要读取的资料 |
| --- | --- | --- |
| 制作/编辑邮件、打开编辑器 | 找到或启动本机编辑器并打开；让用户手动操作 | [编辑器工作流](references/visual-editor-workflow.zh-CN.md) |
| 给定活动名推荐主题/副标题 | 在对话内给 Subject/Preheader 备选，不自动写进邮件 | [文案风格](references/email-copy-style.zh-CN.md) |
| 上传参考图或粘贴HTML，制作可复用组件并注册 | 保留设计与数据，生成完整组件并登记到编辑器 | [新组件规范](references/new-component-standard.zh-CN.md) |
| 修改已注册组件或当前实例 | 先确定修改对象，实施最小范围改动，保留规范 | [组件维护](references/component-maintenance.zh-CN.md) |
| 导出HTML或上传Omnisend草稿 | 等待保存、逐组件确认，沿用已有输出流程 | [输出与安全](references/workflow-and-safety.zh-CN.md) |

“只给主题建议”时只回复文案；“制作邮件，我自己操作”时打开编辑器并提供建议，不代替用户添加组件、修改内容或确认。组合请求可以先打开编辑器，再在对话中推荐文案。

## 打开编辑器

1. 通过当前SKILL文件的真实路径定位包根目录；项目根目录是包根的`../..`。即使skill通过用户目录符号链接加载，也在真实项目根执行命令，不按聊天的任意工作目录寻找另一份组件库。
2. 优先复用当前窗口提到的本机编辑器。运行只读定位脚本（有当前URL时追加`--url`）：

```bash
node skills/build-omnisend-campaign-draft/scripts/resolve-campaign-editor.mjs
```

脚本检查4173–4205回环端口，并比对当前项目的完整组件目录/默认值。`ready`返回可用URL；`staleUrls`表示同项目旧服务，保留它们及其草稿。
3. 返回`ready`时，用`open_in_codex`打开该URL供用户操作；工具不可用时返回可点击链接。打开已获用户“制作/编辑邮件”请求授权，无需再次确认。
4. 返回`start-required`时，用结果中的`startPort`运行现有启动脚本并保持进程；等待`status: ready`后打开返回URL。4173为空闲时的命令为：

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

若`startPort`为空，明确报告没有确认到可用端口；不终止旧服务、不覆盖旧草稿。服务启动报`EPERM`时按环境权限流程处理，不把启动失败描述为页面已打开。
5. 普通草稿和图片缓存只存在当前服务运行期；需要跨重启保留时提醒使用“保存当前为模板”。仅打开编辑器不创建Omnisend Campaign、不上传图片、不发送邮件。

## 活动文案建议

- 默认先读`references/email-copy-style.zh-CN.md`，按需要查[一次性样本](references/omnisend-copy-samples.v1.json)。日常执行不读取Omnisend历史；只有用户明确要求更新风格总结才重新查询。
- “邮件主题”指Subject，“副标题”默认指Preheader；若上下文明显在说头图内文字，就按主标题/正文副标题处理并标注。Campaign内部名称单独保留。
- 默认提供3组英文Subject/Preheader和简短中文说明，标记推荐项；用户指定数量、语言或内容时按其要求。建议只在对话展示，用户选定并明确要求填入时才修改对应字段。
- 只给活动名时可以先给不含具体优惠或截止日的版本；需要强调优惠/倒计时时，仅询问尚缺的关键事实。历史样本中的65%、20%、$600和“3 Days Left”均不是新活动默认值。
- 不承诺打开率、转化或品牌历史表现；风格总结来自实际文案样本，未做效果归因。

## 组件制作与修改

- `组件清单.json`是注册路径与分类的单一事实来源，`editor/public/editor-ui-contract.mjs`是可编辑字段入口。按需查[组件交互清单](references/component-interactions.zh-CN.md)和目标组件管理说明，不在skill维护另一份组件选择表。
- 用户给出的参考图或HTML并要求制作/注册，已授权该范围内的本地实现。命名、componentKey、文件结构等常规选择按现有惯例完成；只为确实缺失且影响设计、链接或素材的信息询问。不得将完整源码要求再次转成同一范围的审批。
- 创建时同步模板、组件CSS、内容/设置Schema、fixture/defaults、管理说明、`效果演示.html`、注册表、编辑器字段、索引与相关文档。修改时保留非目标文案、图片、链接/UTM、样式、字段和导出契约。
- 默认标题Georgia/serif，其余文案Verdana/sans-serif；逐字段显式字体优先。活动商品组件的尺寸/字重保留主标题Regular（font-weight:400）、30/38px，副标题18/27px、#000000，商品标题16/20px；已有源快照字体和特殊设计不批量迁移，详见新组件规范与[已有行为契约](references/editor-and-component-contracts.md)。
- 文案实例样式用[文字样式控件](references/text-style-controls.zh-CN.md)。Shopify导入仅在用户需要商品数据时读取[只读数据契约](references/shopify-data-contract.zh-CN.md)。

## 邮件格式与移动端等比制造规范

600px桌面、375px移动目标，受控尺寸按62.5%等比缩放；桌面px声明后跟inline `min()`，负尺寸使用`max()`。保持确认的列数、图片比例和点击边界。1px分割线、0、百分比和流式图片按现有例外规则处理。

邮件用表格与内联CSS；不依赖JavaScript、iframe、表单、Flex/Grid或外部字体完成布局。最终图片为公开HTTPS，保留唯一有效退订令牌`[[unsubscribe_link]]`与现有Omnisend Email Content结构。普通单个非页脚组件无需自行插入退订；完整邮件的退订由实际页脚/输出流程保留。

组件新增、注册或版式修改后运行：

```bash
node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs
node scripts/normalize-inline-mobile-dimensions.mjs --check
node --test tests/mobile-proportional-contract.test.mjs
node --test tests/*.test.mjs
```

读取测试结果，再在实际编辑器添加/选择目标组件，检查600px/375px、素材、字段和控制台。旧服务缓存目录，使用定位脚本选择匹配版本，保留旧会话。局部非版式改动按维护参考运行与改动相称的检查。浏览器预览不等同Omnisend或真实收件箱实测。

## 输出边界

上传前保存成功、逐组件确认，完整HTML哈希绑定确认。导出可解析/上传本地素材但不创建Campaign；上传仅创建/更新Draft并回读。新建/维护组件和主题建议不授权外部写入；不得发送、排期或发布。API Key只用于现有请求/内存流程，不写进文件或日志。用户手动修改后按实际状态重新确认，AI不代点确认。
