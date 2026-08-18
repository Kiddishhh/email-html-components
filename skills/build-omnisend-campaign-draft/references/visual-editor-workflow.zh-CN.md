# Campaign 可视化编辑器

## 使用方式

运行：

```bash
node skills/build-omnisend-campaign-draft/scripts/start-campaign-editor.mjs 4173
```

浏览器打开 `http://127.0.0.1:4173`。本地会话保存在 `campaign-drafts/editor-sessions/`，不包含 Omnisend 密钥。

## 交互约束

- 组件库由 `组件清单.json` 生成；每个已注册组件都可选择、重复、删除和任意排序，分类只是帮助浏览，不构成结构规则。
- 默认内容和样式分别来自组件的 `content.fixture.v1.json` 与 `settings.defaults.v1.json`；`效果演示.html` 是样式参考，不可用一张素材图替代。
- 字段编辑受该组件 Schema 限制。编辑后会撤销该组件的确认状态并刷新本地预览。
- 活动商品分类包含 `collection.curtainPromotionCard`（单品窗帘促销卡（标题款））和 `collection.curtainPromotionCardNoTitle`（单品窗帘促销卡（无标题款））。标题款可编辑顶部 `promotion.title`、`promotion.subtitle` 与商品字段；无标题款不显示顶部标题和说明，也不显示这两个 `promotion` 字段。两款均可编辑商品图片 / Alt / 点击链接、角标、商品文案、CTA、`color.surface` 和 `color.badge`，默认图片只用于本地预览。
- “shopify商品导入”只在选中 `collection.saleGrid6` 时显示。输入完整 Freshine Page 或 Collection URL 后，固定调用 `fetch-activity-page-sale-grid.mjs --shopify-url <URL>`，只读 Shopify，并只覆盖该实例的 6 个商品图片、Alt、商品链接、折扣标签和 CTA；Page 会从线上主题模板的首个启用 `products-grid-v2` 解析商品来源，Collection 直接读取，CTA 始终保留输入 URL。
- 预览由 `build-email-template.v1.mjs --preview-local-assets` 生成，供本地核对；发送前 HTML 仍必须通过静态安全校验并替换为公开 HTTPS 图片。

## 边界

当前编辑器提供本地编排、字段编辑、组件确认、六宫格导入与“上传 Omnisend 草稿”入口。上传前必须确认全部组件、填写 Campaign 名称和 Subject、生成静态 HTML 并逐字确认其 SHA-256；随后只由终端中的固定 `upload-omnisend-draft.mjs` 运行时读取 API Key。不得在编辑器中执行发送、排期或发布，也不得把 API Key 传入浏览器、参数、环境变量或本地草稿文件。
