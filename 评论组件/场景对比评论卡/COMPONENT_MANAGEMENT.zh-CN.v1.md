# 场景对比评论卡

- componentKey：`review.sceneComparison`；分类：评论组件；默认设计：用户提供的 VIII.jpg。
- 独立新组件，可自由添加、重复、排序；不改变原有评论组件或其他 Campaign。
- 桌面 600×677px；两列各 300px，上排 338px、下排 339px；375px 保持两列等比收缩。替换为更长文案时允许行高增加，不截断内容。
- 原图底色 #F5F2ED，文字 #1F1F1F；Montserrat，姓名、商品名与 CTA 为 18px/600/24px，正文与属性为 16px/400/24px。采用固定桌面值 + inline min() 递进缩放；不支持 Montserrat 的邮件客户端回退 Arial/Helvetica。
- 左上图片不链接，右上为头像、五星原图和可编辑评论，左下为可编辑商品规格与单独 CTA，右下图片不链接。
- CTA 默认：https://freshinelife.com/collections/extra-long-curtains/products/marisol-linen-curtains-large-windows-elegant-pleated-drapes-for-living-room-bedroom?utm_source=omnisend&utm_medium=email&utm_id=cover-rc
- 四张 PNG 均从原始 1200×1354 JPG 按确定坐标直接提取，未生成替代人像或产品。裁切坐标、源图 SHA-256 见 `audit/scene-comparison-review/asset-measurements.json`。
- 头像与五星图片自带原稿底色；修改面板背景色时应同步替换相应素材，避免色块。

## 编辑字段

- `scene.before.url`：左上场景图。
- `scene.before.alt`：左上图片说明。
- `scene.after.url`：右下场景图。
- `scene.after.alt`：右下图片说明。
- `review.avatar.url`：评论者头像。
- `review.avatar.alt`：头像说明。
- `review.stars.url`：五星评分图片。
- `review.stars.alt`：评分说明。
- `review.author`：评论者姓名。
- `review.body`：评论正文。
- `product.title`：商品名称。
- `product.color`：颜色说明。
- `product.header`：帘头说明。
- `product.lining`：衬里说明。
- `product.memory`：定型说明。
- `cta.text`：左下 CTA 文字。
- `cta.url`：左下 CTA 链接。

设置：`color.surface`、`color.text`、`color.action`。几何布局和字重不开放为配置项。

## 编辑器与导出

1. 刷新或重启编辑器，在「评论组件」选择「场景对比评论卡」。
2. 默认图片由 fixture 的 `localReferenceAssets` 和现有 `buildLocalAssetMap` 解析；每个图片字段允许本地替换或 HTTPS URL。
3. 检查 600px / 375px 预览，确认组件与完整 HTML；由用户执行现有导出或 Omnisend 草稿脚本。正式导出会上传本地素材并把 `asset://` 换成公开 HTTPS URL。
4. 未上传的演示 HTML 只适用于本地预览，不能直接粘贴成正式邮件。

## 文件与验证

- 完整内容/设置契约、默认快照、模板、样式、演示、注册表和编辑器字段同步维护。
- 重建演示：`node '评论组件/场景对比评论卡/render-demo.mjs'`。
- 聚焦测试：`node --test --test-name-pattern='scene comparison review' tests/build-email-template.v1.test.mjs`。
- 契约：`node skills/build-omnisend-campaign-draft/scripts/validate-campaign-contracts.mjs`。
- 仅使用 presentation table、img、a、span 和内联 CSS，无脚本、外部 CSS、绝对定位或跨组件样式。
- 本地浏览器检查不代表真实 Omnisend 或 Gmail/Outlook 收件箱验证；本任务不上传、不发送、不排期、不发布。
