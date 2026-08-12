# new FOOT 一次性迁移为本地 HTML 组件设计

## 目标

将 Omnisend Saved Universal Layout `new FOOT` 作为一次性迁移参考，完整转换为本地“品牌信息页脚”HTML 组件。迁移完成后，构建、拼接、测试和后续维护均不再读取、引用或同步 Omnisend Universal Layout。

## 权威源边界

- 迁移时的唯一参考：Omnisend Universal Layout `new FOOT`，ID `68fccc3f9541e9f7ebc479eb`。
- 迁移完成后的唯一维护源：`页脚组件/品牌信息页脚/` 下的本地组件文件。
- Universal Layout ID、远程更新时间和初始内容哈希只作为迁移来源记录，不参与运行、构建或后续同步。
- 后续修改直接在本地组件的数据、设置、模板和样式文件中完成。

## 一次性迁移内容

迁移必须覆盖 `new FOOT` 当前的：

- 品牌、地址、电话、邮箱、版权和法律品牌文案；
- 背景、文字、链接颜色以及区段和区块间距；
- Instagram、Pinterest、YouTube 和 TikTok 的链接、图标类型、图标尺寸与排列；
- 邮箱的 `mailto:` 规则；
- `[[unsubscribe_link]]`、`data-translation-key="unsubscribe"`、`target="_blank"` 和显示文案；
- 移动端安全布局和邮件客户端兼容属性。

初始迁移忠实保留 `new FOOT` 当前数据，包括 YouTube 的 `/shorts` 路径和版权文案中的 `Reserived` 拼写。迁移后如需修正，直接修改本地组件，不回写 Omnisend Saved Layout。

## 本地组件结构

- `component.template.v1.html`：邮件安全的表格结构和可替换槽位。
- `component.styles.v1.css`：页脚自身的少量尺寸规则；主要兼容样式仍内联。
- `content.fixture.v1.json`：从 `new FOOT` 迁移的默认文案、邮箱、社交链接和图标数据。
- `content.schema.v1.json`：允许维护的内容字段与协议约束。
- `settings.defaults.v1.json`：从 `new FOOT` 迁移的颜色、字体、间距和图标尺寸。
- `settings.schema.v1.json`：允许维护的常用视觉设置。
- `migration.source.v1.json`：一次性来源 ID、名称、远程更新时间和迁移快照哈希；仅作审计记录。

## 拼接与运行方式

`build-email-template.v1.mjs` 继续将页脚当作第五个普通 HTML 组件渲染，并输出到 `邮件html模版.html`。生成结果不得包含 Universal Layout 引用或运行时远程读取逻辑。Omnisend Campaign 只接收拼接后的 Custom HTML。

## 验证要求

测试先固定当前失败差异，再实施迁移。最终必须验证：

1. 五组件顺序不变，前四个组件内容未改变。
2. 页脚默认输出匹配一次性 `new FOOT` 快照的内容、颜色、间距和链接规则。
3. YouTube 链接包含 `/shorts`，邮箱使用 `mailto:support@freshinelife.com`。
4. 整封邮件恰好包含一个原样的 `[[unsubscribe_link]]`。
5. 退订链接包含 `data-translation-key="unsubscribe"` 和 `target="_blank"`。
6. 生成文件不包含 Universal Layout ID、远程 API 调用或同步依赖。
7. 桌面 600px 和移动 375px 预览无横向裁切。
8. 更新 Omnisend 草稿后重新读取 Campaign 和 Email Content，确认仍为 `draft` 且未排期。

## 非目标

- 不修改 Omnisend 的 `new FOOT`。
- 不建立持续同步或双向同步。
- 不改造前四个组件。
- 不发送测试邮件、不选择收件人、不排期、不发布 Campaign。
