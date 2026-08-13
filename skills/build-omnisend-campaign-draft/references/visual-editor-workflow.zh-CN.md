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
- “shopify商品导入”只在选中 `collection.saleGrid6` 时显示。输入完整 Freshine Page 或 Collection URL 后，固定调用 `fetch-activity-page-sale-grid.mjs --shopify-url <URL>`，只读 Shopify，并只覆盖该实例的 6 个商品图片、Alt、商品链接、折扣标签和 CTA；Page 会从线上主题模板的首个启用 `products-grid-v2` 解析商品来源，Collection 直接读取，CTA 始终保留输入 URL。
- 预览由 `build-email-template.v1.mjs --preview-local-assets` 生成，供本地核对；发送前 HTML 仍必须通过静态安全校验并替换为公开 HTTPS 图片。

## 边界

当前编辑器提供本地编排、字段编辑、组件确认与六宫格导入。最终 Campaign 元数据、整封确认哈希、图片上传和 Omnisend 草稿上传继续由既有固定脚本处理；不得在编辑器中执行发送、排期或发布。
