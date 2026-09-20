# 多类推荐V

- componentKey: `collection.multiCategoryRecommendationV`；分类：活动商品组件。
- 600px / 375px，固定两列三行；网格 534px，图片 257×322px，列距20px。全部受控尺寸以 600px 为基准等比缩放。
- 主标题 Lora 500 30px/38px；副标题、分类标题 Montserrat 500 16px/24px。字间距0、居中；分类标题下划线。
- 26 个内容字段：主副标题、每项图片URL/Alt/分类标题/共用跳转链接；4个独立颜色。无商品导入。
- 六张图和六个分类标题分别可点击，单项二者共用分类URL。默认链接来自公开 Freshine 分类清单，不附加未指定的活动UTM。
- 四张现有照片由用户参考图独立提取。电动窗帘使用 Freshine motorized-roman-shades 分类原图；透视纱帘使用 see-through-sheer-curtains 分类原图，适配参考图4:5画框。缺失图片的具体构图无法从参考中恢复，这两张为真实分类补图。
- 默认6张本地素材通过 asset:// 和 localReferenceAssets 用于编辑器预览。最终导出通过既有确认流程上传为公开HTTPS，不能直接把本地演示HTML粘贴到Omnisend。
- 邮件表格与inline CSS；不支持Web字体/min()的客户端使用回退。浏览器验证不代表收件箱实测。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：intro.title
- subtitle：intro.subtitle
- caption：collections[0].title, collections[1].title, collections[2].title, collections[3].title, collections[4].title, collections[5].title

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
