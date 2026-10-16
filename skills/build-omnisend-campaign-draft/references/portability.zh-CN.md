# 移植与运行环境

核心构建器、编辑器和测试需要 Node.js 20.11+，无需 npm 安装。`node scripts/test.mjs` 按文件列表运行全部测试，不依赖 shell 通配符展开。测试目录从 `import.meta.url` 推导，临时文件使用 `os.tmpdir()` 下的隔离目录，不引用维护者的用户目录或 `/private/tmp`。

## 仓库与路径

完整复制仓库的源码、组件目录、素材、注册表、`skills/`、`scripts/` 以及 `shopify.config.json`。构建器及尺寸规范化检查按自身位置寻找仓库，不依赖启动时的工作目录。

Composition 的组件目录、素材路径相对仓库；Composition 参数、`output` 和 `previewOutput` 的相对路径仍相对调用目录。预览图片路径相对实际预览输出目录计算，跨平台转换为 URL 的 `/` 分隔符。编辑器自动生成绝对输出路径。模板快照与本地资产应整体迁移，旧草稿中的外部绝对路径需另行检查；不会自动改写用户内容。

## 只读 Shopify 导入配置

根目录 `shopify.config.json`：

```json
{
  "storefrontOrigin": "https://freshinelife.com",
  "adminStore": "0qsgrb-pe.myshopify.com"
}
```

五个 Shopify 导入/发现脚本共享此配置。可设置 `FRESHINE_SHOPIFY_CONFIG` 为另一份 JSON 路径（相对路径按启动目录解析），`--store` 仍覆盖 Admin 店铺。Storefront 必须是无路径、凭据和查询串的 HTTPS origin，Admin 店铺必须是 `*.myshopify.com` 主机名。修改配置后重新启动服务。

配置不包含 API Key，不改变 Shopify 只读命令保护。它不是完整的品牌切换：组件原稿、导入输入框示例、现有链接、UTM、文案和美元金额格式保持原样；迁移到其他品牌时需另行审核这些内容。

## 图片裁切

`prepare-countdown-hero-2-image.mjs --input <path> --output <path> [--backend auto|sips|magick]`

- 默认 `auto` 优先 macOS `sips`，不可用时使用 PATH 中的 ImageMagick 7 `magick`；不自动安装工具。
- 保留中心裁切、1200×1200 输出、JPEG 质量参数 88 和原图不覆盖约束。ImageMagick 明确取首帧并清除裁切画布偏移。参数依据 [ImageMagick 命令选项](https://imagemagick.org/command-line-options/#crop) 与 [identify 文档](https://imagemagick.org/identify/)。
- 找不到工具时在创建输出前报告依赖缺失；处理失败会返回非零状态，不再自动换引擎掩盖错误。不同引擎的编码/色彩结果可能不同，正式素材仍需视觉确认。

验证边界：本次验证包括 macOS 实际 sips 输出、ImageMagick 命令适配模拟、非仓库启动目录及独立目录复制后的离线测试。未将模拟结果视为 Windows/Linux 实机或真实邮件收件箱兼容认证；使用这些系统时须安装可用的图像后端并运行全套测试。
