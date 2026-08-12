# 页脚地址预约说明设计

## 目标

在 `footer.warm` 的地址区新增预约与收件限制说明，且与现有页脚地址文本使用完全相同的字体、字号、颜色与行高。

## 已确认的布局

地址区的呈现顺序固定为：

1. `footer.address.line1`：街道地址
2. `footer.address.line2`：套间地址
3. `footer.address.line3`：城市、州和邮编
4. `footer.address.line4`：国家
5. `footer.address.disclaimer`：`(Appointment Only. No Mail, Packages, Or Deliveries Accepted.)`
6. `footer.address.line5`：联系电话
7. 邮箱联系方式

预约说明是独立文本字段，不并入国家行或电话号码字段。它直接复用页脚地址的 `Montserrat, Arial, Helvetica, sans-serif`、13px、400 字重、1.5 行高和 `settings.color.text`，因此会跟随页脚的颜色和字体设置。

## 数据与兼容性

- 在 `content.schema.v1.json` 添加必填的 `footer.address.disclaimer`。
- `content.fixture.v1.json`、默认六组件 composition、当前测试草稿的 `footer.composition.v1.json` 与整封 campaign composition 都提供完整字段。
- 模板在国家和电话之间添加带 `FRESHINE_SLOT_START/END` 标记的独立行与显式 `<br>`，避免邮件客户端折叠换行。
- 不改动现有 `footer.address.line1` 至 `.line5` 的含义、邮件页脚位置或退订令牌。

## 同步范围与验证

同步页脚模板、Schema、fixture、效果演示、组件管理说明、默认及当前测试草稿的完整快照，并重建对应预览/静态 HTML。添加回归测试验证新字段、位置和内联样式继承。运行完整 Node 测试和 Campaign contract 校验。

本次不调用 Omnisend API，也不发送、发布或排期。
