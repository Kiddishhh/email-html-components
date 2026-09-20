# 四宫格折扣推荐（标题款）V1

- Component Key：`collection.saleGrid4WithTitle`
- 分类：活动商品组件；独立于 `collection.saleGrid4`，不替换原四宫格。
- 设计来源：用户提供的「样式XXVII.png」，1200×1866px；600px 桌面按半尺寸还原。
- 用户已确认按原稿字体还原：主标题使用 Montserrat，不套用公共 Lora 标题。

## HTML 编辑器入口与注册

在 Campaign Editor 左侧选择 **活动商品组件 → 四宫格折扣推荐（标题款） · style-xxvii → 添加此组件**。

注册来源为根目录 `组件清单.json`，编辑器字段契约为 `skills/build-omnisend-campaign-draft/editor/public/editor-ui-contract.mjs`。本样式开放24项内容字段、5项颜色设置和“导入商品1–4”；支持添加多个实例、调整顺序、选择、编辑、确认及删除。不重复登记或替换旧的四宫格折扣商品。

编辑器在服务启动时读取目录和默认快照。已运行的旧服务只刷新网页不会更新缓存；有未保存草稿时不要直接重启，可用空闲端口启动同一编辑器。新添加实例读取该服务加载的默认值，已有草稿与已保存模板保留自己的内容快照，不自动覆盖。

当前确认的底部链接为：`https://freshinelife.com/collections/roman-shades?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`。折扣和其他商品链接的完整默认值见同目录 `content.fixture.v1.json`。

## 可编辑内容

顶部为 `saleCollection.title`、`saleCollection.body`。四格按左上、右上、左下、右下排列；每格开放 `saleItems[n].discountLabel`、`.image.url`、`.image.alt`、`.image.clickUrl`、`.cta.text`。主图与下方文字共享该格的点击链接，图片、折扣标签及链接文字可分别替换。

底部按钮为 `saleCollection.cta.text` 与 `.cta.url`。默认按钮文案忠实保留 APPLY DISCOUNT；默认 URL 使用用户确认的 `https://freshinelife.com/collections/roman-shades`，并保留下文 UTM 参数。该集合页链接本身不创建或自动应用优惠码。

颜色开放：背景 `color.surface`（#FFFDF9）、折扣标签 `color.theme`（#8D1B1B）、主标题/按钮描边 `color.heading`（#6B492C）、顶部说明 `color.body`（#7C706A）、商品链接/按钮文字 `color.action`（#6B522C）。几何和字体固定，不开放编辑。

## 固定视觉契约

- 600px 画布，510px 内容区，主体商品表宽509px；每张246×246px，列间17px，保持原稿直角图片。默认四张方图按原稿做约1%–1.6%微量放大取景；替换图片建议使用1:1方图。
- 顶部45px留白；Montserrat 标题30px/400/45px、字距0.3px；标题后15px留白；说明18px/400/27px、自然换行；说明后31px进入图片区。
- 商品标签18px/400/22px，31px高，左右10px内边距，仅右下6px圆角；标签保留纯文本，不烧入图片。
- 第一行图片后18px为链接文字，文字16px/400/22px；之后15px进入第二行。第二行图片后15px为链接文字，之后30px进入底部按钮。
- 底部按钮宽510px，1.5px描边，文字18px/400，53px行高；底部73px留白。默认文案在字体加载后目标总高约933px。
- 正文、标签和链接字距0.2px。375px仍保持两列，图片约153.75px，字体渐进调整：主标题26px、说明14px、商品链接12px、按钮15px；顶部说明自然换行。按钮可点击高度不低于44px。

## 图片和数据来源

四张图片均使用 Freshine Shopify 公共 CDN 的原始商品素材，未使用 AI 重画，也未将完整设计稿作为组件背景。对应商品为 Emilia Smart Motorized Cotton Roman Shades、Ilythra Cotton Linen Roman Shades、Elowen Smart Motorized Heavyweight Roman Shades、Orianne Smart Motorized 100% Blackout Roller Shades。

默认折扣按用户本次确认更新为左上 SAVE 30%、右上 SAVE 40%、左下 SAVE 35%、右下 SAVE 50%；这是活动展示配置，不表示目前商品实时折扣。可手动编辑；逐格只读导入后按实际可售变体售价/划线价计算，无有效折扣时清空旧标签。

默认四个商品跳转地址（主图和下方文字共用）及底部按钮链接均带 `?utm_source=omnisend&utm_medium=email&utm_id=cover-rc`；不修改图片资源地址。后续手动改链接或重新导入商品时，需保留或补回所需 UTM。

## Shopify 逐格只读导入

复用现有“导入商品1–4”与 `fetch-single-product.mjs`。只更新选中实例内的指定一格：首张主图、Alt、商品链接、折扣、下方商品链接文字。下方文字填入 Shopify 商品标题，避免换商品后仍显示旧商品名；可再手动编辑成 SHOP XXX >>。其他三格、顶部文案、底部按钮及颜色不变。任何导入失败都不得覆盖原内容。

## 文件与安全边界

目录中模板、组件CSS、内容/设置Schema、默认快照、演示和本说明保持同步。`效果演示.html` 加载字体仅供浏览器预览，正式邮件为纯表格和内联CSS片段，字体按 Montserrat → Arial → Helvetica → sans-serif 降级。

背景图提供 `background` 属性、CSS与Outlook VML降级；VML不等于已验证Outlook。图片、图片说明和链接独立可访问。默认图片为公开HTTPS；本地上传产生的 `asset://` 仅用于预览，正式导出仍走已有HTTPS替换流程。

完成本地测试和600px/375px浏览器验证后，只能确认组件与编辑器工作正常。Omnisend预览、Gmail、Outlook、Apple Mail真实收件箱需另行验证；本任务不发送、排期、发布或上传任何远程内容。

## 统一文字规范（2026-09-08）

本节取代本文此前对以下字段的字体说明；图片、链接、折扣标签、价格和 CTA 样式沿用组件原契约。

- heading：saleCollection.title
- subtitle：saleCollection.body
- caption：saleItems[0].cta.text, saleItems[1].cta.text, saleItems[2].cta.text, saleItems[3].cta.text

- heading：Lora，400，30px / 38px，字距 0，居中。
- subtitle：Montserrat，500，18px / 150%（27px），字距 0，居中，默认黑色 #000000。
- caption：Montserrat，500，16px / 20px，字距 0，左对齐。
- 375px 按 600px 基准等比收缩；下划线等原有装饰保留。
