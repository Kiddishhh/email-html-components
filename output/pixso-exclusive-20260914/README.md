# Freshine 优惠头图

最终导入代码：email-omnisend.html（完整表格正文，可粘贴到 Omnisend Custom HTML）。
范围：600×56 导览栏 119:2482，置于 600×558 优惠头图 119:2618 上方，另保留组合 2244 Logo（119:2638）。
preview-online.html 使用用户上传的 3 个 Omnisend 图片直链；preview-portable.html 为离线预览，不能用于导入。

导览栏两个链接均跳转至首页，并包含 utm_source=omnisend、utm_medium=email、utm_id=cover-fs；原头图 CTA 仍跳转罗马帘集合页。

清理审计：生成源文件 5 个资源已本地化，21 个节点 ID 已删除，23 个节点类名已按一对一映射替换，均无保留。最终邮件正文无节点 ID、机器类名或临时地址，3 个公开图片地址已替换。

导航源文件的清理审计见 navbar-cleanup-audit.json：1 个字体资源已本地化，6 个节点 ID 与 6 个机器类名已清理，均无保留。最终邮件正文无节点 ID、机器类名或临时地址。

本地设计预览加载 Lora/Montserrat；导入正文保留 Georgia/Arial 降级。实际收件箱可能使用降级字体。已提供 Outlook VML 背景，但尚未验证 Omnisend 导入及真实邮件客户端渲染。
