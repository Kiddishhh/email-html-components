# Campaign 可视化编辑器

## 启动与会话

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

打开 `http://127.0.0.1:4173`。本地草稿、上传回执、预览和图片缓存只在当前编辑器运行期保存，关闭或重启服务即清理；只有手动保存的模板及其专属图片位于被忽略的 `campaign-drafts/editor-templates/`。两类存储均不保存 API Key。

组件目录与默认值在服务启动时读取；代码中新增组件或更新默认值后，只刷新旧服务的网页不会刷新这份缓存。先处理未保存草稿，再重启服务；也可将启动命令末尾端口改为一个空闲端口，保留旧服务。新实例使用该服务加载的默认值，旧草稿和已保存模板不会自动换成新的默认内容。

## 当前操作流程

1. 填写邮件名称并新建草稿。
2. 左侧先选择组件分类，再选择具体样式。组件来自 `组件清单.json`，可自由添加、重复、拖拽排序或删除。
3. 选中结构项后，中间预览将同一组件实例定位到预览区顶部，并显示短暂描边；描边不会进入导出 HTML。
4. 右侧仅显示该组件开放的内容与设置字段。修改字段会撤销该实例的确认状态并自动刷新预览。
5. 在 600px 桌面模式和 375px 移动模式分别检查。窄屏编辑器按组件库、预览、设置面板的顺序单列显示，所有操作保持在当前视口内。
6. 逐个确认组件，再执行整封邮件确认。任何内容、设置、图片或顺序变化都会使整封确认与内容哈希失效。

## 模板

顶部模板栏支持保存模板、选择模板继续编辑和删除模板：

- 保存模板记录当前画布、组件顺序、完整 `content`/`settings` 快照；若模板使用本地上传图片，会复制为该模板专属图片，可自定义名称。
- 同名保存必须先确认覆盖。
- 选择模板会创建一份新的可编辑草稿，不会回写模板；组件确认、整封确认、内容哈希、输出路径和 Omnisend 状态均重置。
- 删除模板会删除模板记录及其专属图片；由模板创建的当前编辑草稿仍可继续编辑到服务关闭。不会删除任何组件目录内的素材。

## 组件编辑

- 四款头图提供“显示顶部导航栏”复选框。关闭时从生成 HTML 移除导航结构和高度；再次开启时恢复该实例保存的文案、链接和颜色。
- 颜色字段提供色块和 `#RRGGBB` 输入。只有完整六位色号会写入组件快照。
- 图片字段可以填写公开 HTTPS URL，也可选择本地 PNG、JPEG、WebP 或 GIF 进行预览；单文件不超过 5 MB。
- `collection.saleGrid6` 支持从 Freshine Page、已上线 Collection URL，或 Shopify 后台 Collection handle 只读导入六件商品。后台 handle 仅作为数据源：六张商品卡保留 Shopify 返回的商品公开链接，整体 CTA 保持当前组件设置，不会指向未上线 Collection。
- `collection.saleGrid6WithTitle` 为逐格导入的标题款六宫格：分别使用“导入商品 1–6”输入 Freshine 商品 URL。导入只更新当前格的商品名、首图、Alt、链接和折扣，不影响其余五格、标题、副标题或 CTA。
- `collection.curtainPromotionCard` 与 `collection.curtainPromotionCardNoTitle` 支持从 Freshine 商品 URL 只读导入一个商品。导入不会覆盖 CTA 文案、顶部活动文案或配色。
- `collection.saleGrid4WithTitle` 的选择路径为“活动商品组件 → 四宫格折扣推荐（标题款）”。支持24项内容、5项颜色与4个逐格商品导入按钮；默认折扣依次为左上30%、右上40%、左下35%、右下50%。商品与底部CTA默认带`utm_source=omnisend&utm_medium=email&utm_id=cover-rc`，APPLY DISCOUNT指向Roman Shades集合页。逐格导入会覆盖该格的图片、Alt、折扣、商品链接和链接文字，导入后应检查UTM；不改其他卡片或底部CTA。
- `collection.productGrid4NoSidePadding` 的选择路径为“活动商品组件 → 四宫格商品推荐（无左右边距）”。支持22项内容、5项颜色与4个逐格商品导入按钮；600px 下四张商品图为289×361px、列间22px，375px下按比例缩放。逐格导入仅更新指定卡片的图片、Alt、链接、折扣和按钮文字，不改其他卡片、顶部文案或颜色。

## 导出 Omnisend HTML

“导出 Omnisend HTML”要求所有组件已确认。它仅执行以下操作：

1. 上传尚未缓存的本地图片；
2. 将 `asset://` 替换为公开 HTTPS URL；
3. 重新校验静态邮件 HTML；
4. 把完整 HTML 写入剪切板。

该流程不会创建、更新或发送 Campaign 或 Draft。图片缓存按图片字节 SHA-256 与 API Key 的不可逆哈希隔离账户，不保存 API Key，并仅在当前编辑器运行期复用。若剪切板被浏览器拒绝，界面显示只读 HTML 供手动复制，不重新上传图片。

## 上传 Omnisend 草稿

“上传 Omnisend 草稿”要求所有组件与整封邮件均已确认，并在一个对话框中收集 Campaign 名称、Subject、Preheader 和一次性 API Key。

- API Key 只存在于当前浏览器请求和本机进程内存，结束后立即清空。
- 先精确检索同名 `draft`；多个结果更新最近更新的一封，没有匹配才创建 Draft。
- 更新后回读 Campaign 与 Email Content，验证 `status: draft`、内容 ID、退订令牌、图片 URL 和内容哈希。
- 不提供发送、排期或发布操作。
