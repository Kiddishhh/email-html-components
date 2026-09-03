# 场景对比评论卡设计 QA — 2026-08-28

## 对比目标与状态

- Source visual truth: `/Users/ww/Downloads/评论/VIII.jpg`，1200×1354px。
- Component: `review.sceneComparison`，`评论组件/场景对比评论卡`。
- Implementation: `http://127.0.0.1:8768/%E8%AF%84%E8%AE%BA%E7%BB%84%E4%BB%B6/%E5%9C%BA%E6%99%AF%E5%AF%B9%E6%AF%94%E8%AF%84%E8%AE%BA%E5%8D%A1/%E6%95%88%E6%BC%94%E7%A4%BA.html`。
- State: 原稿默认图片与文案、原稿配色、指定 Marisol 商品 CTA 和 cover-rc UTM；未执行远端上传。
- CSS viewport: 桌面 600×750，移动 375×520；devicePixelRatio=1。
- 归一化：原图缩小为 600×677 与 375×423；浏览器截图分别为 600×750 和 375×520，比较时仅截取组件区域。实际移动 CSS 高度为 423.125px，比较图取整数 423px。
- Final screenshots: `audit/scene-comparison-review/preview-600-final.png`、`audit/scene-comparison-review/preview-375-final.png`。
- Full-view comparison evidence: 同图左右比较 `audit/scene-comparison-review/comparison-600-final.png`、`audit/scene-comparison-review/comparison-375-final.png`，均已打开检查。
- Focused evidence: `audit/scene-comparison-review/focus-review-header.png`、`audit/scene-comparison-review/focus-product-details.png`，已打开检查姓名、五星、属性换行和 CTA。
- Geometry evidence: `audit/scene-comparison-review/desktop-metrics.json`、`audit/scene-comparison-review/mobile-metrics.json`。

## Findings 与比较历史

1. v1 [P2，已修正] 衬里第一行错误包含 Rate，第二行只剩 50%。将属性文本两侧留白由 10px 增至 17px，内容区变为 252px，恢复原稿的 White_Shading / Rate 50% 两行；600px / 375px v2 截图已复查。
2. v2 [P2，已修正] 移动端 CTA 的 table cell 默认文字基线使其下移约 6px。为 CTA 单元格明确 font-size:0/line-height:0，并将链接 vertical-align:top；先添加失败回归断言，再修复并验证。最终 CTA 顶部桌面 591px、移动 369.375px，严格按 0.625 缩放。
3. 最终比较未发现待处理 P0/P1/P2 差异。[P3] 浏览器对字体及缩小位图的抗锯齿与原稿不同，姓名/标题略显厚、五星边缘稍软；原始 PNG 像素裁切未被替换或重绘。

## 五项视觉检查

- 字体：Montserrat 正文 16px/400/24px；姓名、商品名、CTA 为 18px/600/24px。移动分别缩为 10px/15px、11.25px/15px，保留所有文字和原稿换行节奏。邮件客户端不支持字体时回退 Arial/Helvetica；未声明收件箱像素一致。
- 间距布局：600×677；两列各 300px，上排 338px、下排 339px；移动 375×423.125，scrollWidth=clientWidth=375。图片无拉伸，CTA 限定左下链接。
- 配色：直接采样得到 #F5F2ED 与 #1F1F1F；三个局部颜色设置不会泄漏到其他组件。头像/五星有原稿底色，已在编辑器说明换色时需同步替换素材。
- 图像：两张场景、头像与五星均为原稿确定性裁切，四张图片实际加载成功；裁切坐标、SHA-256 见 asset-measurements.json。
- 文案：姓名、完整评论、商品名称、四条属性、CTA 原样保留；链接参数准确。无额外虚构评论或优惠。

## 交互与导出检查

- 在真实本地编辑器选择「评论组件 → 场景对比评论卡」并添加成功；17 个内容字段、3 个颜色设置和4个本地图片替换控件可见。
- 修改 CTA 为 View This Look >> 后预览链接文案更新，目标 URL 保持；完成后恢复 Shop The Look >>。
- 切换编辑器 600px / 375px 预览，图像与文案显示正常；独立预览量测上述宽高。
- 仅一个真实 anchor，DOM 中已核对精确 Marisol URL 及 utm_source=omnisend、utm_medium=email、utm_id=cover-rc。未向商品页面发送测试跳转。
- 回归测试验证4个本地素材可由 buildLocalAssetMap 解析、preview/defer 构建成功；模拟已有导出器替换为 HTTPS 后，所有文案转义、CTA 和邮件安全结构符合要求。模拟输出不是已上传素材。
- 浏览器 preview/editor error 日志均为空。
- 未进行真实 Omnisend 上传、草稿保存、发送、排期或收件箱测试；未提交或推送 Git。

## 测试结果与独立问题

- 聚焦回归：1/1 通过，包含编辑器选择、本地素材、两种构建模式、HTTPS 替换、文案转义、独立链接与移动基线约束。
- 组件契约：33/33，status=valid。
- 完整测试：195/196 通过。唯一失败为已有 gift.showcase2 文档中的“旧版完整快照”触发 retiredTerms 正则，位于 references/component-interactions.zh-CN.md；与本次新增区块无关，原有内容已保留。
- git diff --check 通过。

## Implementation Checklist

- [x] 原稿素材、模板、Schema、默认值、演示、编辑器契约、索引与说明同步。
- [x] 原图与桌面/移动终稿同图对比，P2 问题已修复并复查。
- [x] 测试边界和字体/收件箱差异说明完整。
- [ ] 用户在编辑器最终确认后执行原有 Omnisend 导出/上传脚本。

final result: passed
