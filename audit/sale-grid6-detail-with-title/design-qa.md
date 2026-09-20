# 六宫格详情折扣（标题款）视觉与功能 QA

final result: passed

## 对照来源与状态

- 基础布局：活动商品组件/四宫格详情折扣（标题款）/component.template.v1.html；原组件无改动。
- 圆标参考：/Users/ww/Downloads/组合 2294.png，134×134px（包含透明边距，圆本体约110px）。
- 位置参考：/var/folders/qb/gfhrch2s3n19l1hfdcyw2yd80000gn/T/codex-clipboard-d5d4c79a-cc5e-4409-bfea-101a2ae568e4.png。
- reference-comparison.png：700×600px，同一画面比较原圆标和实际54px圆标2倍显示、参考卡片与247px实际卡片；商品图片不同是复用基础组件默认商品的预期结果。
- desktop-top.png、desktop-bottom.png：600×900px，后者scrollY=612.5，共覆盖全部桌面组件。
- mobile.png：375×948px，覆盖完整三行两列。
- 丢弃内置浏览器fullPage截图的缩放拼接异常，以正常viewport上下两幅截图及DOM测量为准。

## 五项视觉检查

1. 字体：标题 Lora/500/30px/45px/0px；副标题 Montserrat/500/16px/24px/0px，#7C706A。375px对应18.75px/28.125px及10px/15px。圆标前缀12px/400/15px，百分比18px/700/22px；居中两行。
2. 布局：600px画布，519px内容区，247px正方形图片、25px列缝；三行两列。圆标54×54，右12px上11px；375px图片154.375×154.375，圆标33.75×33.75。scrollWidth=innerWidth=375，无横向溢出。其他桌面名称、价格、CTA、留白沿用原组件。
3. 颜色：九个原有设置保留；默认标签#991B1E、文字白色。实际编辑主题色#6B1414后所有圆标更新，CTA仍#991B1E；验证后恢复主题色。
4. 图片：使用原组件公开Shopify图片和VML回退，保留裁剪比例；不生成或将折扣烘焙进商品图片。圆标用邮件表格的可编辑背景和文字实现，按用户要求保留主题色与脚本导入。
5. 内容：50个内容字段、9个颜色字段；脚本继续传入SAVE 40%一类完整discountLabel。百分比加粗、前缀可改、空值隐藏整圆；非标准文案安全转义。第5、6格默认复用第1、2格的样例数据，非实时价格承诺。

## 验证历史与修复

- 初始组件视觉对照无P0/P1/P2偏差。比较页曾误将演示50%替换为40%时连同radius:50%改写，已只在QA比较页修复；生产模板始终为50%圆角。
- [P1，已修复] 继承的window.prompt不受内置浏览器支持。仅新组件改为页面内商品导入对话框，复用现有对话框样式；提交期间禁用重复操作，失败显示可重试错误，支持取消。
- 实际通过第6个按钮只读导入Nova商品，确认第6格更新主图、Alt、完整名称、47.90/79.90价格、SAVE 40%与cover-rc UTM；其他卡片与CTA保持。未修改Shopify数据。
- 浏览器实际编辑第1格折扣40%、圆标主题色，并通过键盘清空第5格折扣，预览圆标数量6→5。恢复演示字段；未上传Omnisend。
- 修复后无新增浏览器控制台错误（编辑器日志仍保留修复前prompt错误时间戳，最终预览日志为空）。

## 自动检查

- node --test tests/*.test.mjs：259/259通过，包含六个槽位逐格导入隔离、非法索引、折扣安全转义和空值移除测试。
- normalize-inline-mobile-dimensions --check：48组件96文件无遗漏。
- validate-campaign-contracts：48注册、48编辑器契约，valid。
- node --check app.js、git diff --check：通过。

## 交付边界

编辑器：http://127.0.0.1:4187；另起本地会话保留原编辑器草稿。仅本地构建、浏览器QA及一次Shopify只读导入得到验证，未进行Omnisend导入或真实邮箱测试。经典Outlook不支持border-radius时圆标会降级为方形背景；这是保留可编辑邮件HTML的已知兼容性边界。
