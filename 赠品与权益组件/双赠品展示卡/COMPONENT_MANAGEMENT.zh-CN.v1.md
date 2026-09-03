# 双赠品展示卡（V1）

- Component Key：`gift.showcase2`
- 分类：赠品与权益组件；默认变体：`eye-mask-first-cta`
- 桌面：600×677px；手机验证：375×423.125px
- 本次更新同一组件，不替换或修改 `gift.rewardGrid2` 双赠品奖励卡。

## 已确认设计

按新版参考图 `上下I.png`（1200×1354px）制作。眼罩在上、照片居左；抱枕套在下、照片居右；照片与文案各约半幅，上下无缝相接。保留照片中的 FREE GIFTS 徽章，右上和左下文案改为独立 HTML 文字，增加两个独立 CTA。无顶部标题、额外边距、圆角或照片跳转链接。

原稿小字的门槛和赠品名称与按钮相互矛盾，已按用户确认修正：

| 赠品 | 价值文案 | CTA文字 | 赠送说明 | 默认链接 |
|---|---|---|---|---|
| Silk Eye Mask | VALUE $59.9 | SPEND $699+ | Spend $699 or more and receive a complimentary silk eye mask. | https://freshinelife.com/ |
| Random Pillow Cover | VALUE $89.9 | SPEND $999+ | Spend $999 or more and receive a complimentary pillow cover. | https://freshinelife.com/ |

这些是展示文案与普通链接，不会创建 Shopify 折扣、购物车规则或自动添加赠品。调整门槛时需同时修改 CTA 文字与赠送说明。

## 素材与布局

| 素材 | 新参考图裁切范围（左/上/右/下） | 原始尺寸 | 桌面显示 | 375px显示 |
|---|---|---|---|---|
| `assets/silk-eye-mask-photo.png` | 0/0/604/678 | 604×678 | 302×339 | 188.75×211.875 |
| `assets/random-pillow-cover-photo.png` | 604/678/1200/1354 | 596×676 | 298×338 | 186.25×211.25 |
| `assets/shopping-bag-white.png` | 782/428/812/462 | 30×34 | 15×17 | 9.375×约10.625 |

照片仅按参考图中的区域边界精确裁出，未重绘或拉伸；购物袋从原稿提取，去除纯红底以透明 PNG 保存。旧版 `default-silk-eye-mask.png`、`default-random-pillow-cover.png` 保留供追溯，当前 fixture 不再引用。

内层表格上限600px，左右列为302/298px。默认两行分别339/338px高；小屏保留交错结构，不改为单列。CTA为221×39px，375px下为138.125×24.375px。文字和间距均有桌面固定值及内联 `min()` 渐进缩放值。长文案不会被截断，可能自然撑高行；建议保持原稿长度与换行节奏。

| 文字层级 | 字体 | 桌面字号 / 行高 / 字重 |
|---|---|---|
| 商品名称 | Lora → Georgia → Times New Roman → serif | 30 / 38 / 400 |
| 价值 | Montserrat → Arial → Helvetica → sans-serif | 18 / 24 / 500 |
| 卖点 | 同上 | 18 / 22 / 400 |
| CTA | 同上 | 14 / 18 / 500 |
| 赠送说明 | 同上 | 12 / 15 / 400 |

## 可编辑字段

每件赠品8项，共16项内容字段。`i=0` 为上方眼罩，`i=1` 为下方抱枕套。

| 字段 | 作用 |
|---|---|
| `gifts[i].image.url` | 单独照片，不是整张图文设计稿 |
| `gifts[i].image.alt` | 照片替代文本 |
| `gifts[i].title` | 商品名称 |
| `gifts[i].value` | 价值文案，含VALUE前缀 |
| `gifts[i].description` | 卖点说明 |
| `gifts[i].cta.text` | CTA按钮文字 |
| `gifts[i].cta.url` | CTA独立HTTPS链接 |
| `gifts[i].note` | 按钮下方赠送规则 |

隐藏内容字段 `cta.icon.url` 管理两个按钮共用的购物袋素材，参与预览与导出，不显示在编辑面板中。

| 设置字段 | 默认值 | 作用 |
|---|---|---|
| `color.surface` | `#F5F1ED` | 文案区和外层底色 |
| `color.text` | `#1F1F1F` | 商品名称及卖点 |
| `color.accent` | `#8D1B1B` | 价值文案与CTA底色 |
| `color.muted` | `#7C706A` | 赠送说明 |

CTA文字与购物袋固定白色；照片与其内徽章不受颜色设置影响。`font.heading`、`font.body` 为隐藏完整快照设置，不在编辑器中开放。

## 文件、编辑器与复现

模板、组件 CSS、内容/设置 Schema、fixture/defaults、管理说明与效果演示同步维护；注册表、编辑器字段契约和现有回归测试同步更新。素材通过3个 `localReferenceAssets` 键管理，不依赖 Downloads 目录。

重新生成效果演示：

```bash
node '赠品与权益组件/双赠品展示卡/render-demo.mjs'
```

在编辑器中选择“赠品与权益组件 → 双赠品展示卡 · eye-mask-first-cta”，可添加、重复、排序、编辑和删除。编辑器启动时缓存组件目录；本轮使用4190端口启动新服务，保留旧4189服务及其草稿。打开旧服务不会自动刷新内存中的字段契约。

已有保存模板/草稿使用完整快照，不会自动增加本次新字段。旧版实例直接交给新版构建器可能因缺字段或旧素材键无法导出。升级时请保留需要的内容后重新添加当前组件，或显式补齐新的内容和设置字段，并将旧整图换为单独照片。本次不静默迁移用户草稿。

## 安全与验证边界

- 单根表格和内联关键样式；不用媒体查询、Flex/Grid、定位或脚本。照片保持比例，图片Alt有Arial 14px/18px回退。
- 只有两个CTA `<a>`，照片不绑定链接；内容经过转义，链接要求HTTPS，拒绝 `javascript:` 等不安全协议。
- `效果演示.html` 是本地预览文档，不能直接当作最终 Omnisend 片段导入。正式输出的两张照片和购物袋图标都必须替换为公开HTTPS URL；`asset://`仅用于本地素材解析。
- 本地演示可加载Lora/Montserrat，最终片段不包含外部字体导入；收件箱可能使用回退字体。`min()` 不受支持时保留桌面值，需要另行检查真实邮件客户端的小屏表现。
- 600px与375px浏览器对照、编辑器修改检查及自动化测试见 `audit/double-gift-showcase-cta/`。旧版验收记录保留在 `audit/double-gift-showcase/`。
- 本地验证不等于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱验证；本次不包含上传图片、写入远端草稿、发送、排期或发布。
