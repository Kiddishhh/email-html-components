# 双赠品展示卡2（V1）

- Component Key：`gift.doubleGiftAddressShowcase`
- 分类：赠品与权益组件
- 默认变体：`side-by-side-tiered`
- 桌面画布：约 600×488px；375px 下约 375×305px

## 实现边界

该组件按用户提供的 `容器 117.png`（1200×978px）2 倍设计稿制作。它是独立的 600px 并列版式，不替换或修改 `gift.showcase2` 和 `gift.rewardGrid2`。

默认只有两条红色 `SPEND` 区域可点击，两个链接互相独立，默认均为 `https://freshinelife.com/`。图片、标题、赠送说明和底部提示不绑定链接。这些文案和链接不会创建 Shopify 折扣、购物车门槛或自动赠品规则。

## 设计稿几何

| 区域 | 600px 桌面值 |
|---|---|
| 顶部标题 | Lora 30px / 400 / 38px，顶部空白 37px |
| 顶部说明 | Montserrat 18px / 500 / 27px，黑色 |
| 双卡片行 | 左右各 262px，间距 12px，左右外边距各 32px |
| 卡片图片 | 262×154px，保持 524×308px 源图比例 |
| 赠品名称 | Montserrat 17px / 400 / 25px |
| 价值 | Montserrat 13px / 400 / 18px，斜体 |
| CTA | 红色满宽栏约 25px 高，13px / 400 / 17px |
| 赠送说明 | 11px / 400 / 16px，默认两行 |
| 底部提示 | 13px / 400 / 20px，斜体，独立真实图标 |

所有核心尺寸使用桌面固定值和内联 `min()` 渐进缩放值；375px 下保留并列双卡片，不改为单列。不支持 `min()` 的邮件客户端保留桌面声明作为降级。

## 默认素材

| 素材 | 设计稿裁切范围（左/上/右/下） | 像素尺寸 | 字段 |
|---|---|---|---|
| `default-silk-eye-mask-card-photo.png` | 64/246/588/554 | 524×308 | `gifts[0].image.url` |
| `default-pillow-cover-card-photo.png` | 612/246/1136/554 | 524×308 | `gifts[1].image.url` |
| `shopping-bag-white.png` | 复用双赠品展示卡的透明图标 | 30×34 | 隐藏的 `cta.icon.url` |
| Omnisend 无底色礼物图标 | `https://app.omnisend.com/images/6a97b53ec723a01883e3afbf` | 60×60（显示为 14×14） | 隐藏的 `footer.icon.url` |

两张照片已带有设计稿中的 `FREE GIFTS` 徽章，不再叠加 HTML/CSS 图形。两张赠品照片和 CTA 购物袋图标通过 `localReferenceAssets` 与 `asset://` 用于本地预览；底部礼物图标默认直接使用已提供的公开 Omnisend HTTPS 地址。

## 可编辑字段

- 顶部：`intro.title` / `intro.subtitle`。
- 每件赠品：图片 URL、Alt、名称、价值、CTA 文字、CTA HTTPS 链接、赠送说明。
- 底部：`footer.note`。
- 颜色：`color.canvas` / `color.card` / `color.text` / `color.accent` / `color.muted`。

两个图标 URL 是隐藏的完整快照字段，不在编辑器中开放。调整满额门槛时，应同时更新对应 CTA 文字和赠送说明。

## 生成与验证

重新生成效果演示：

```bash
node '赠品与权益组件/双赠品展示卡2/render-demo.mjs'
```

模板使用表格和内联 CSS，不使用 Flex/Grid、定位、脚本、SVG 或表单。本地 600px/375px 浏览器对照只是组件几何与交互证据，不等于 Omnisend、Gmail、Outlook 或 Apple Mail 收件箱验证。
