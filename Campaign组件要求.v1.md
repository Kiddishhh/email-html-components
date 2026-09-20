# Campaign 组件要求（当前版）

## 注册与结构

- `组件清单.json` 是组件注册和路径的单一事实来源。
- 编辑器允许从全部已注册组件中自由添加、重复、排序和删除；分类只用于浏览。
- `campaign-structure.v1.json` 只声明 `user-ordered-registered-components`，不定义必选组件或位置。
- 每个注册组件必须具有模板、内容/设置 Schema、fixture/defaults、管理说明、组件 CSS、`效果演示.html` 和编辑器字段契约。
- 运行 `skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs` 后，注册组件数与编辑器契约数必须一致。

## 视觉基线

- 桌面邮件画布上限为 600px，移动端检查宽度为 375px。
- 保留各组件已确认的字体、颜色、按钮、间距和构图，不进行跨组件强制同款处理。
- 图片按设计比例显示，窄屏等比例缩放；不得以不匹配的固定宽高拉伸。
- 组件使用邮件安全表格与内联 CSS，不依赖 JavaScript、Flex、Grid、外部样式表或 Web Font 完成核心布局。
- 组件 CSS 只内联到当前组件，不得影响相邻组件。
- 链接和 CTA 必须保持足够的可点击区域；文字在 375px 下不得被裁切或挤出画布。

## 编辑器交互

- 选中结构项后，对应组件定位到预览区顶部并显示短暂描边。
- 只显示 `editor-ui-contract.mjs` 中为该组件开放的字段；修改后清除当前组件确认并刷新预览。
- 四款头图都支持 `navigation.visible`。关闭时从生成 HTML 移除导航结构和占位高度。
- 支持本地图片预览、模板保存/选择/删除、600px/375px 预览、组件确认、HTML 导出和 Omnisend Draft 上传。
- 普通编辑草稿、预览和图片缓存仅在当前编辑器运行期存在。手动保存模板时，才持久化完整组件快照及其专属本地图片；覆盖或删除模板会同步替换或删除该模板专属图片，不影响组件目录内的素材。

## 数据与安全

- Shopify 导入严格只读，只在六宫格、已登记的四宫格商品样式和两款单品窗帘促销卡中使用；四宫格按选定商品格单独导入。导航组件的活动促销 CTA 仅编辑文案、颜色和 CTA，不提供 Shopify 导入。
- `asset://` 只用于本地预览；正式 HTML 必须替换为公开 HTTPS 图片。
- 最终确认绑定完整 HTML 内容哈希，任意修改都会使确认失效。
- “导出 Omnisend HTML”只上传本地图片、替换 URL 并复制 HTML，不创建或更新 Campaign。
- “上传 Omnisend 草稿”只创建或更新 `draft`，并回读验证；不得发送、排期或发布。
- API Key 只存在于当前请求和本机进程内存，不写入文件、参数、环境变量、日志或草稿。
- 必须保留 `[[unsubscribe_link]]`。

详细操作、组件样式和安全边界见 `skills/build-omnisend-campaign-draft/` 下的当前 Skill 与 references。

## 统一文字规范（2026-09-08）

仅活动商品组件遵守 skills/build-omnisend-campaign-draft/references/new-component-standard.zh-CN.md：主标题 Lora 400、30/38px 居中；副标题 Montserrat 500、18/27px 居中、#000000；图片下标题/商品名 Montserrat 500、16/20px 左对齐。375px 等比缩放。头图不适用；明确特殊要求优先。
