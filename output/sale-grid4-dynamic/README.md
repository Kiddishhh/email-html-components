# 使用说明

复制 component.html 全文，替换原四宫格组件。文件包含 HTML 和 Liquid；不是整封邮件，继续使用原有退订及追踪代码。

- 候选名单来自 2026-09-08 只读检查的 Best Seller for Email 集合（handle: best-seller-copy），共 44 个不同商品 handle。名单已打散排列，集合增删或商品 handle 改名后需要更新名单。
- 使用客户 ID 加 Liquid 渲染时间取模生成起点，然后选择 4 个不同的可售且有图片的商品。属于轮换，不是真随机，不保证不同邮件一定不同；同一封邮件打开时不会重新选品。
- 正常读取 4 个商品；遇到失效、缺图或不可售商品时最多检查 16 个 handle。整封邮件其他组件仍需共用 all_products 的 20 个不同 handle 预算。本组件建议只放一次。
- 16 次检查后不足 4 件合格商品，整个组件隐藏，避免空卡片或失效链接。
- 商品名使用 strip_html、truncate: 48, '...'、escape，最多 48 个字符（含 ...）。调整顶部 fg_title_limit 可改变限制；字符限制不是精确的两行限制。
- 使用 featured_image，居中裁切为正方形。保留原表格结构、字号、颜色、间距、CTA 和 UTM。
- SAVE 折扣按首个可售变体的 compare_at_price 与 price 按 (划线原价 − 当前售价) ÷ 划线原价 × 100 计算并四舍五入，商品链接附带该变体 ID。零价、无有效划线价或四舍五入后不足 1% 时隐藏徽标。不会自动叠加优惠码或结账自动优惠。
- 原副标题仍为 Smart shades with voice control...，而候选集合含窗帘和配件；如需描述所有品类，应另外调整副标题。

验证：Shopify skill 的 Liquid 静态校验通过（validation.txt）。已核对 44 个 handle 唯一、图片/名称/Outlook VML 链接对应、折扣条件、CTA 保持不变和表格结构保持不变。

preview.html 是根据先前只读商品快照生成的静态样式示例，价格使用抽样首个变体；不是 Messaging 实际执行结果。尚未在 Messaging 编辑器或收件箱验证动态渲染，未修改线上邮件、Flow 或发送邮件。浏览器直接打开 component.html 不会执行 Liquid。

官方参考：https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/create-email/custom-liquid
商品字段：https://shopify.dev/docs/api/liquid/objects/product
截断：https://shopify.dev/docs/api/liquid/filters/truncate
