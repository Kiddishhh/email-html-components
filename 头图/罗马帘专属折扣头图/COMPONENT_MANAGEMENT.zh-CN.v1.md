# 罗马帘专属折扣头图（`hero.romanShadeDiscount`）

以用户提供的罗马帘邮件参考图为依据，复现竖版场景、跨面板边缘的圆形 Logo、半透明白色圆角面板、描边提示、折扣标签、大字折扣及实色 CTA。顶部双栏促销导航默认开启，可在编辑器中关闭；没有 Shopify 导入功能。

## 默认素材

- 场景：原图 `背景图（需要裁剪）.png` 为 2726×1522；按参考图逐像素比对，从 `(682, 0)` 裁切 1200×1522，保留 2 倍像素密度。原始下载素材未修改。
- Logo：原样复用 `logo素材.png`（206×206）。
- 装饰标签：原样复用 `天天特价 1.png`（70×70）；固定为装饰图、空 Alt，不另加点击链接。
- 本地 fixture 通过 `localReferenceAssets` 和 `asset://` 关联以上三张图。正式邮件导出前必须转换为公开 HTTPS 图片，不能将本地预览 HTML 当作正式投递文件。

## 可编辑字段

| 字段 | 默认值 / 用途 |
| --- | --- |
| `hero.backgroundImage.url` / `.alt` | 罗马帘场景图片和可访问说明；建议替换为 1200×1522 竖图 |
| `hero.logo.url` / `.alt` / `.clickUrl` | 圆形 Logo、说明及独立跳转；默认首页 |
| `hero.eyebrow` | Your Exclusive Discount |
| `hero.title` | UP   TO；三个空格保留宽词间距 |
| `hero.discount` | 70% Off |
| `hero.subtitle` | Bring Home The Look You Love |
| `hero.cta.text` / `.url` | Decorate your home now 及带 UTM 的罗马帘集合页 |
| `navigation.visible` | 默认 `true`；关闭时移除顶部导航整行及其占位高度 |
| `color.text` | 文字与提示框描边，默认 `#6B492C` |
| `color.action` | 按钮底色，默认 `#6B492C`；文字保持白色 |

默认 CTA：`https://freshinelife.com/collections/roman-shades?utm_source=omnisend&utm_medium=email&utm_id=cover-fs`。Logo 默认跳转 `https://freshinelife.com/`，与 CTA 独立，不自动复制 UTM。

`decoration.tag.url`、`color.heroFallback` 和 `color.navigationLeft` / `color.navigationRight` / `color.navigationText` 是完整快照中的固定字段，不开放编辑器输入；Logo 和装饰标签不会随文字配色重新染色。

## 顶部导航

- 沿用 `hero.sceneOverlayCta` 的双栏导航结构，位于场景主体上方，尺寸和字体采用本组件规格。默认左侧文案为 `Unlock $100 Off Your First Order at Freshine`，右侧为带下划线的 `SIGN UP`，跳转 `https://freshinelife.com/`；文案和链接固定，不新增编辑器输入。
- 左侧底色 `color.navigationLeft` 为 `#604211`（`rgba(96,66,17,1)`），右侧底色 `color.navigationRight` 为 `#6B492C`（`rgba(107,73,44,1)`），文字色 `color.navigationText` 为 `#FFFFFF`。
- 左右列宽 `75.5% / 24.5%`；桌面导航为 `600×56px`，移动端高度使用 `min(56px, 9.333334vw)`，375px 下为 `35px`。左右文字均使用 Montserrat，字重 `500`，桌面字号/行高 `16px / 20px`，字间距 `0px`、居中；移动端保留 `min(16px, 3vw) / min(20px, 4vw)`，375px 下为 `11.25px / 15px`。
- `navigation.visible=false` 时整行移除，不留空白占位；场景、Logo、折扣内容及原 CTA（含 UTM）保持不变。

## 固定版式与响应式

- 居中 600px 上限画布；场景主体保持 `600×761px`，背景原比例铺满。导航开启时桌面总尺寸为 `600×817px`，关闭时为原有 `600×761px`。以下面板和 Logo 定位均相对于场景主体顶部。
- 白色面板宽432px（72%），顶部127px、底部620px，透明度70%、圆角8px。
- Logo103px，顶部75px；使用三列表格和 rowspan 跨越面板顶部，不用绝对定位或负边距。
- 提示框保持307×55px；`Your Exclusive Discount` 使用 Montserrat `21px / 500 / 26px`，375px 下字号/行高为 `13.125px / 16.25px`。
- 装饰标签保持35px。素材顶部有4px透明边；以响应式负上外边距抵消这段透明边，使实际棕色上边线与提示框下边框重叠，并以等量下外边距补偿占位，不使用 `position` 或 `transform`，其余元素位置不变。
- 两行折扣使用 Montserrat600 / 80px；前缀行高62px，之后留白16px，折扣行高94px，再留白6px。说明19px / 600 / 27px。短前缀的紧行高用于对齐参考图字面位置，文案应保持单行简短。
- CTA 默认文案为 `Decorate your home now`，使用 Montserrat `16px / 600 / 20px`，字间距 `0px`、居中；桌面保持 `309×55px`、上下内边距各 `17.5px`，375px 下保持 `193.125×44px`、上下内边距各 `12px`。
- 窄屏通过内联 `min()` 等比例缩放间距、Logo、面板和折扣字号，375px 折扣为50px、说明至少12px。按钮额外保留至少44px高、12px文字，375px 下导航开启时整体约 `375×520.98px`，关闭时约 `375×485.98px`；主体稍大于纯等比缩放，避免触控区域过小。长文案允许增加高度，不裁切文字；折扣字段建议保持简短。
- HTML 为单根 presentation table、嵌套表格及行内 CSS；不影响相邻组件。

## 重建与验证

运行 `node 头图/罗马帘专属折扣头图/render-demo.mjs`，从默认 fixture/settings 通过正式拼接器生成 `效果演示.html`，避免维护第二套排版。

回归：`node --test tests/roman-shade-discount.test.mjs`；全量验证见仓库新组件规范。编辑器通过 `组件清单.json` 注册，并在“头图”下选择本组件。

## 兼容性边界

不支持 Web Font 的邮件客户端回退 Arial/Helvetica；不支持 rgba、CSS 渐变或圆角的客户端，面板透明度、Logo 周边接缝及圆角可能降级；不支持 CSS 背景图的旧版 Outlook 使用兜底色。正文与链接仍是可读、可点击的 HTML。现代浏览器预览不等于 Omnisend 或真实收件箱验证；未发送测试邮件、未上传素材、未修改线上 Campaign。
