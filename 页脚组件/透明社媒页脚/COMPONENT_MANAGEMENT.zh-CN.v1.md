# 透明社媒页脚（footer.transparentSocial）

由用户粘贴HTML制作的独立组件，注册到“页脚组件”，与其他三个页脚并存。透明背景继承所在邮件画布底色；不新增实底、电话或邮箱。

## 视觉契约

- 600px画布，内容区23px上、30px左右、24px下留白；内容表格width100%、max-width542px，实际桌面可用宽540px。
- 社媒行309px宽，七列等分约44.142857px，全部图标29×29px。顺序为YouTube、Instagram、Facebook、TikTok、Pinterest、WhatsApp、Threads，素材URL与各自链接保持原稿。
- 图标后依次为16px空白、地址、4px空白、预约/收件说明、16px空白、1px暖棕分割线、15px空白、版权与Freshine两行、16px空白、Unsubscribe。
- 文案均为12px/18px居中；地址和说明保持单行，版权中的`@2026`保留原文。字体采用用户已指定的Verdana/sans-serif默认值，不加载外部字体。
- 退订链接父单元格补充同样的12px/18px及移动缩放，防止标准HTML模式的默认16px行盒撑高移动端；只校正这一处尺寸继承。
- 所有受控尺寸以600px为基准inline min()等比缩小；375px图标18.125px、社媒行193.125px、字号7.5px、行高11.25px；1px分割线保持1px。替换长文案后检查375px预览。

## 编辑范围

25个内容字段：地址、预约/收件说明、版权、品牌名；七个平台各自的跳转HTTPS链接、图标HTTPS URL和Alt。内容字段支持现有逐文案样式；图标支持现有本地图片预览和导出上传流程。更换图标时使用适合方形显示且含合理留白的素材，固定图标几何不开放。

5项颜色：正文`#1F1F1F`、预约说明`#7C706A`、分割线`#B59B8B`、品牌名`#8F8681`、退订文字`#D4D0CA`。组件背景固定transparent，邮件画布底色由Campaign设置决定。

## 链接与安全

- 社媒七条链接保持原稿，无默认新增UTM；WhatsApp保留phone/text/type/app_absent完整参数。输出HTML查询分隔符转为`&amp;`。
- 退订文字Unsubscribe及唯一`href="[[unsubscribe_link]]"`固定；不得替换为静态页面、开放为普通URL输入或对其应用UTM。
- 模板保留原MSO表格间距归零声明。组件内不带编辑器使用的`freshine-component`类，避免实例定位重复；编辑器由现有渲染器添加实例边界。
- 原稿图片均为HTTPS地址。最终输出沿用已有素材解析与Omnisend Draft-only流程，无脚本、iframe、表单或外部字体。浏览器/本机预览不证明真实收件箱像素一致；组件注册不授权外部上传、发送或发布。
