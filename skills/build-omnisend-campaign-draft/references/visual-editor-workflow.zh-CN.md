# Campaign 可视化编辑器

## 启动与会话

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

打开 `http://127.0.0.1:4173`。本地草稿、上传回执、图片缓存和已保存模板位于被忽略的 `campaign-drafts/editor-sessions/`；其中不保存 API Key。

## 当前操作流程

1. 填写邮件名称并新建草稿。
2. 左侧先选择组件分类，再选择具体样式。组件来自 `组件清单.json`，可自由添加、重复、拖拽排序或删除。
3. 选中结构项后，中间预览将同一组件实例定位到预览区顶部，并显示短暂描边；描边不会进入导出 HTML。
4. 右侧仅显示该组件开放的内容与设置字段。修改字段会撤销该实例的确认状态并自动刷新预览。
5. 在 600px 桌面模式和 375px 移动模式分别检查。窄屏编辑器按组件库、预览、设置面板的顺序单列显示，所有操作保持在当前视口内。
6. 逐个确认组件，再执行整封邮件确认。任何内容、设置、图片或顺序变化都会使整封确认与内容哈希失效。

## 模板

顶部模板栏支持保存模板、选择模板继续编辑和删除模板：

- 保存模板记录当前画布、组件顺序、完整 `content`/`settings` 快照及本地图片引用，可自定义名称。
- 同名保存必须先确认覆盖。
- 选择模板会创建一份新的可编辑草稿，不会回写模板；组件确认、整封确认、内容哈希、输出路径和 Omnisend 状态均重置。
- 删除模板只删除模板记录，不删除由模板创建的草稿或图片。
- 模板引用本地图片的原路径，不复制图片。原文件移动或删除时，预览会报告资源不可用。

## 组件编辑

- 四款头图提供“显示顶部导航栏”复选框。关闭时从生成 HTML 移除导航结构和高度；再次开启时恢复该实例保存的文案、链接和颜色。
- 颜色字段提供色块和 `#RRGGBB` 输入。只有完整六位色号会写入组件快照。
- 图片字段可以填写公开 HTTPS URL，也可选择本地 PNG、JPEG、WebP 或 GIF 进行预览；单文件不超过 5 MB。
- `collection.saleGrid6` 支持从 Freshine Page 或 Collection URL 只读导入六件商品。
- `collection.curtainPromotionCard` 与 `collection.curtainPromotionCardNoTitle` 支持从 Freshine 商品 URL 只读导入一个商品。导入不会覆盖 CTA 文案、顶部活动文案或配色。

## 导出 Omnisend HTML

“导出 Omnisend HTML”要求所有组件已确认。它仅执行以下操作：

1. 上传尚未缓存的本地图片；
2. 将 `asset://` 替换为公开 HTTPS URL；
3. 重新校验静态邮件 HTML；
4. 把完整 HTML 写入剪切板。

该流程不会创建、更新或发送 Campaign 或 Draft。图片缓存按图片字节 SHA-256 与 API Key 的不可逆哈希隔离账户，不保存 API Key。若剪切板被浏览器拒绝，界面显示只读 HTML 供手动复制，不重新上传图片。

## 上传 Omnisend 草稿

“上传 Omnisend 草稿”要求所有组件与整封邮件均已确认，并在一个对话框中收集 Campaign 名称、Subject、Preheader 和一次性 API Key。

- API Key 只存在于当前浏览器请求和本机进程内存，结束后立即清空。
- 先精确检索同名 `draft`；多个结果更新最近更新的一封，没有匹配才创建 Draft。
- 更新后回读 Campaign 与 Email Content，验证 `status: draft`、内容 ID、退订令牌、图片 URL 和内容哈希。
- 不提供发送、排期或发布操作。
