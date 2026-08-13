# 双条文字评论组件管理说明（V1）

- Component Key：`review.textList2`
- 当前状态：已登记到通用组件库，尚未加入 Campaign Skill。

## 用途与固定结构

组件展示顶部总评分和固定两条文字评论。每处固定五颗绿色星形，共十五颗；无链接、CTA、卡片、双栏或正文截断。

## 可替换内容

顶部评分与评论数量独立替换；两条评论的作者、日期、标题和正文分别替换。所有值是必填纯文本并由拼接器转义。

## 背景设置

`color.surface` 默认 `#FDFCFB`，只接受完整 `#RRGGBB`。深色值不会自动改变主文字、次文字或分割线，必须用桌面端和移动端预览检查可读性。

## 固定星形资产

`assets/review-star.png` 来自用户确认的 512×472 透明 PNG，不允许替换、改色、裁切或按评分数增减。本地 fixture 使用 `asset://review-star`；正式 Omnisend HTML 前必须替换为公开 HTTPS 地址。

## 响应式与维护

桌面最大 600px、左右 24px；约 375px 移动端保持单列并自然换行。修改结构或字段时必须同步模板、CSS、schemas、fixture/defaults、效果演示、注册表、索引、README 和测试。

## Skill 边界

本阶段没有 Campaign 区段、交互索引或内容注入脚本。后续只有在另行确认数据来源、映射、失败处理和完成卡片后才注册到 Skill。

## Omnisend 验收边界

本地静态与浏览器检查只表示符合静态规范；正式使用前仍需 Omnisend Desktop/Mobile/Dark Mode 预览及 Gmail、Outlook、Apple Mail 测试邮件。
