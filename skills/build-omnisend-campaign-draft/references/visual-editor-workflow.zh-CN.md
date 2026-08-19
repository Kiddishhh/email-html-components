# Campaign 可视化编辑器

## 使用方式

运行：

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

浏览器打开 `http://127.0.0.1:4173`。本地会话保存在 `campaign-drafts/editor-sessions/`，不包含 Omnisend 密钥。

## 交互约束

- 组件库由 `组件清单.json` 生成；每个已注册组件都可选择、重复、删除和任意排序，分类只是帮助浏览，不构成结构规则。
- `小样-产品` 分类中的小样产品推荐卡（左、右）、窗帘产品推荐卡II（标题版）和无标题版均可在编辑器中选择；图片、产品文案、CTA、链接与已开放颜色字段可编辑，不影响 CLI 固定六区段。
- `赠品与权益组件` 分类中的尺寸测量工具卡（`tool.measurementCard`）可自由添加、重复和排序；可编辑主图 / Alt、标题、副标题、CTA 文案和链接，以及组件背景、文字和 CTA 颜色。默认预裁切本地图在 600px 中显示为约 `548×493px`，在 375px 预览中随容器等比缩放；最终导出 Omnisend HTML 前须替换为公开 HTTPS 图片。
- 默认内容和样式分别来自组件的 `content.fixture.v1.json` 与 `settings.defaults.v1.json`；`效果演示.html` 是样式参考，不可用一张素材图替代。
- 字段编辑受该组件 Schema 限制。编辑后会撤销该组件的确认状态并刷新本地预览。
- 颜色字段同时提供色块选择器与 `#RRGGBB` 输入框；输入如 `#F7EEDC` 后按 Enter 或离开输入框即可应用。只接受完整六位色号，非法输入不会覆盖当前已应用颜色。
- `footer.warm` 可编辑页脚背景色、正文颜色与链接颜色；三项仅作用于页脚组件本身。
- 活动商品分类包含 `collection.curtainPromotionCard`（单品窗帘促销卡（标题款））和 `collection.curtainPromotionCardNoTitle`（单品窗帘促销卡（无标题款））。标题款可编辑顶部 `promotion.title`、`promotion.subtitle` 与商品字段；无标题款不显示顶部标题和说明，也不显示这两个 `promotion` 字段。两款均可编辑商品图片 / Alt / 点击链接、角标、商品文案、CTA、`color.surface` 和 `color.badge`，默认图片只用于本地预览。
- “shopify商品导入”只在选中 `collection.saleGrid6` 时显示。输入完整 Freshine Page 或 Collection URL 后，固定调用 `fetch-activity-page-sale-grid.mjs --shopify-url <URL>`，只读 Shopify，并只覆盖该实例的 6 个商品图片、Alt、商品链接、折扣标签和 CTA；Page 会从线上主题模板的首个启用 `products-grid-v2` 解析商品来源，Collection 直接读取，CTA 始终保留输入 URL。
- 预览由 `build-email-template.v1.mjs --preview-local-assets` 生成，供本地核对；发送前 HTML 仍必须通过静态安全校验并替换为公开 HTTPS 图片。

## 边界

当前编辑器提供本地编排、字段编辑、组件确认、六宫格导入与“上传 Omnisend 草稿”入口。上传前必须确认全部组件并填写 Campaign 名称和 Subject；静态 HTML 与 SHA-256 在本机内部自动校验，不要求用户复制或粘贴哈希。编辑器弹窗一次性收集 API Key，支持粘贴与显示/隐藏，上传结束或失败后立即清除；不得写入参数、环境变量、日志或本地草稿文件。上传器按 Campaign 名称精确检索同名 `draft`，多个结果更新最近更新的一封；没有匹配才新建 Draft。不得在编辑器中执行发送、排期或发布。

“导出 Omnisend HTML”是独立入口。确认全部组件后，它仅上传本地图片中尚未缓存的部分到 Omnisend 并替换 `asset://` 地址，再把完整 HTML 复制到剪切板；不会创建、更新或发送 Campaign 或 Draft，不访问模板或 Email Content。缓存以图片字节 SHA-256 和 API Key 的不可逆哈希隔离账户，保存于被忽略的 `campaign-drafts/`，不保存 API Key；相同图片在后续导出或不同组件中复用已上传 URL。API Key 只在本次请求中使用，完整 HTML 不保存为草稿、回执或日志。浏览器拒绝剪切板权限时，展示已替换 URL 的只读 HTML，用户可手动复制；该备用路径不得再次上传图片。
