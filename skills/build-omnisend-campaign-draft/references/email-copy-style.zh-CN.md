# Freshine 邮件主题与Preheader风格

## 一次性来源与使用范围

2026-10-12通过Omnisend只读接口确认Freshine品牌，读取按创建时间倒序的近期email Campaign，再回读10封的实际`content.email.subject`和`content.email.preheader`。其中9封已发送（发送时间2026-09-07至2026-10-10），1封2026-10-12创建的草稿单独标记。来源和完整逐条文案保存在[样本快照](omnisend-copy-samples.v1.json)。内部Campaign名称不替代Subject；本总结不包含业绩分析。

日常制作邮件和推荐主题直接使用本文件，不查询Omnisend。只有用户明确要求“更新标题风格总结／重新查看最近邮件”时，才刷新样本和本文件。数据不可用时说明限制，保留现有记录，不能虚构新样本或把历史优惠当作当前活动。

## 已观察到的写法

1. **温暖、克制的美式家居品牌语气。** 高频意象是comfort、warmth、texture、cozy、inviting、home；定制价值用tailored、custom、made-to-measure、fabrics and colors表达。通过具体居家体验承接窗帘和遮阳产品，避免抽象到看不出产品。
2. **Subject突出一个主信息。** 常见组合是活动/季节＋氛围或定制价值，再通过冒号、逗号、破折号接优惠或时间；服务主题直接说明用途，例如New Curtains Start with the Right Fit。样本长度37–63字符仅是观察，不是平台限制或必须达到的区间。
3. **Preheader补足Subject。** 通常以动作/体验开头，再补面料、定制、测量、免费设计或优惠层级；不逐字重复主题，不堆砌关键词。服务邮件中先测量工具，再把free design help作为辅助价值。
4. **紧迫感有事实依据。** 样本使用Three More Days、Only/Just 1 Day Left等明确倒计时；语气仍较平和。只有用户提供真实剩余天数/截止时间时才采用。默认倒计时描述活动期限；不能由活动到期推断折扣也会结束，除非用户明确确认。
5. **优惠表达保留限定。** 历史邮件多用Up to，不把最大折扣写成全站固定折扣；sitewide、extra off、品类优惠应准确区分。不要把“up to $600 extra off”改成“$600 off every order”。
6. **当前样本没有emoji或连串感叹号。** 默认少用这类元素；这是这批样本的风格特征，不表示品牌永久禁用。

## 代表性原文

| 场景与状态 | 实际Subject | 实际Preheader |
| --- | --- | --- |
| 测量/服务；2026-10-10已发送 | New Curtains Start with the Right Fit | Use our measuring tool to get started, then find the fabric and style you love with free design help. |
| 季节/优惠；2026-10-05已发送 | Columbus Day Sale: Fall into Comfort—Up to $600 Extra Off | Layer your home with soft textures and custom style—up to 65% off, plus up to 20% off sitewide and up to $600 extra off. |
| 到期提醒；2026-10-02已发送 | Cozy Fall Living: Three More Days, a Little Extra Savings | Make your favorite spaces even more inviting—enjoy up to 65% off, plus up to 20% off sitewide and up to $600 extra off. |
| 品类/定制；2026-09-14已发送 | Elevate Every Window with Custom Roman Shades – Up to 65% Off | Discover beautifully tailored styles in hundreds of fabrics and colors—save up to 65%, plus up to 20% off sitewide and up to $600 extra off. |

2026-10-12草稿中的“Columbus Day, Tailored to You—3 Days Left, Up to 65% Off”仅是补充风格样本，不把它描述成已发送或效果优胜版本。

## 推荐时怎么使用

- 保留用户活动名称和明确优惠事实；默认英文Subject＋Preheader，中文解释方向。通常给3组：氛围/品牌价值、产品/实际价值、优惠/紧迫感；信息不足时第三组可以仍用产品/服务利益，不编造优惠。
- Subject和Preheader是收件箱文案，区别于Campaign内部名称与头图正文标题。用户显然在说正文时明确输出对应字段，不把正文副标题误写成Preheader。
- 主题前半放最有辨识度的信息；以可读、自然为准，按目标活动控制长度。预览文本用于补充，避免把全部优惠塞在Subject。
- 历史65%、20%、$600、免费服务、优惠码和截止日均不可自动沿用。用户只给活动名时先提供不含未经确认商业承诺的版本；需要写金额或倒计时时，询问缺失事实。
- 不为了推荐文案读取账号业绩或收件人信息，不声称某种写法“打开率更高”。只给建议不自动修改当前草稿或Omnisend。

例如用户仅给“Cozy Fall Living”，可先推荐：

Subject: **Cozy Fall Living: A Softer Season for Your Windows**

Preheader: **Bring warmth and texture home with made-to-measure curtains and shades in the fabrics and colors you love.**

此例是按已记录风格新写的候选，未引用历史优惠，也不是已存在的Campaign。

## 用户明确要求刷新时

使用Omnisend已连接账号的只读工具。先核实品牌；对`get_campaigns`使用summary、email、limit≤20和实际支持的排序，然后`get_campaigns_id`读取选中邮件Subject/Preheader。先取得工具schema与documentation，按真实字段解析。只保存品牌、日期、状态、Campaign ID/来源链接及主题/预览文字，不保存API Key、收件人或完整邮件内容。以已发送邮件为主要样本，草稿单列；日期和状态不足时明确标注。
