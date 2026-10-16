# 倒计时场景卡片头图（hero.countdownSceneCard）

来自用户提供的HTML，在编辑器“头图”结构中选择或搜索“倒计时场景卡片”。可自由添加、重复与排序；保留原稿图片、文案、三处链接及Columbus_Day_Sale UTM。

## 版式与移动适配

- 600px流式画布；375px受控尺寸按62.5%缩放，字体、行高、留白、按钮和2px圆角有inline min()与桌面回退。
- 顶部注册条56px高，正文14/18px、400、单行；左右留白4.666667%和4.833333%，正文75%，间隔5.5%，SIGN UP占10%，保留下划线。
- 背景保持原稿background-size:257.5% 100.932401%与background-position:31.957672% 50%。上下43/49px、左右6%；HTML background属性及#C4A573底色提供降级。
- 内容卡片528px、#F7F4EC；倒计时图片380×66px（卡片71.969697%）、主场景图454×405px（85.984848%），height:auto，不裁切或拉伸。更换长宽比会改变自然高度。
- 优惠文案24/36px、500，Verdana/sans-serif；首行前段与红色强调相接、第二行固定换行，前段末尾保留空格。原Montserrat改为已确认默认Verdana，移除Google Fonts，尺寸/字重/颜色/间距保留；字宽不同可能影响换行，替换后检查预览。
- SHOP NOW按钮254×56px（卡片48.106061%），文字18px、400；375px按钮约158.75×35px。卡片内留白44/18/22/33/50px。
- 倒计时是图片内静态文字，不自动更新。改变天数须替换图片并同步Alt，仅修改Alt不会改变可见标题。

## 可编辑项

15个内容字段：注册文案、链接文字与URL；背景图URL/说明；倒计时图片URL/Alt；优惠前段、强调文字、第二行；场景图URL/Alt/独立点击URL；按钮文案/URL。文案沿用逐字段字体、字号、字重、颜色、对齐与间距控件。

8项颜色：注册条底色/文字色、背景降级底色、卡片底色、优惠正文/强调色、按钮底色/文字色。背景裁切和几何固定，不开放未经验证的布局开关。

三处独立跳转：

- SIGN UP：https://freshinelife.com/?utm_source=omnisend&utm_medium=email&utm_id=Columbus_Day_Sale
- 场景图与按钮各自默认：https://freshinelife.com/pages/freshine-sale?utm_source=omnisend&utm_medium=email&utm_id=Columbus_Day_Sale

保留UTM大小写和下划线，输出href分隔符转义为&amp;。背景和倒计时图片不跳转。默认原公开HTTPS素材，可替换地址或沿用本地素材预览/导出解析流程。

## 邮件输出与验证

单根presentation table、嵌套表格及内联CSS，无脚本、iframe、表单或外部字体。独立头图不插入退订；完整邮件通过实际页脚保留[[unsubscribe_link]]。现有确认哈希、导出与Draft-only上传契约不变。

图片屏蔽时保留底色和文字，背景支持因客户端而异。600px/375px本地浏览器和静态校验不证明Omnisend收件箱、Gmail、Outlook或Apple Mail像素一致。组件制作注册不执行外部上传、发布或发送。
