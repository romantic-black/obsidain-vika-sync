## 简介

由 Johnny 老师的[Ob 与 Vika 同步脚本](https://milinshushe.feishu.cn/docs/doccnSwkXMw7tEQJwmBg72yzpLb)改进而来。

## How to use
- 下载 release 中的文件至`.obsidian\plugins\obsidain-vika-sync`中
- 下载 advanced url 插件
- 打开设置，开启插件，完成 vika 的 token 设置
  - 从 vika 的 api 界面获取 token
  - 点击 `refresh` 按钮，等待一段时间同步
- 完成自定义字段的设置，设置格式为`json`
  - **上传项**：需要从 frontmatter 上传到 Vika 的字段
    - 在 Vika 表中添加对应的字段
    - 默认值：单行文本、多行文本、链接、单选等类型字段的默认值为字符串，多选需要设为`[]`或其他字符串数组（数字和布尔值不会被读取）
  - **下载项**：需要从 Vika 下载到 frontmatter 的字段

## 目前的功能
- 添加至vika、更新、删除、从 Vika 中获取当前的笔记
  - `vikaLink`属性通过将笔记添加至 Vika 获取
  - 不存在`vikaLink`时，更新与添加等价
  - 存在`vikaLink`时，删除操作会连同 Vika 中的记录一并删除
  - 不存在`vikaLink`时，获取操作不起作用
  - 添加、更新和获取操作会改变 frontmatter 中的下载项和`vikalink`、`tags`、`aliases`属性，属性不会改变
- 更新当前文件所在文件夹的笔记（同步需要较长时间，因为 Vika 对操作频率有限制）
  - 有三种操作类型，包括：
    - 只更新已有`vikaLink`的笔记
    - 更新已有笔记，当`vikaLink`不存在时，会创建条目到指定表格中
    - 全部重新创建到指定表格中
- 依照 vika 的`Folder`字段，批量获取 vika 中的笔记

## 需要在 vika 中设置以下字段
- Title ：单行文本
- ID：单行文本
- Vault：单选
- Content：多行文本
- CreatedTime：日期
- UpdatedTime：日期
- OBURI：链接
- Folder: 单选
- Aliases：多选
- Tags：多选
- OutLinks：多选
- BackLinks：多选
- UnresolvedOutLinks：多选
- 你的自定义字段

这里提供一个[模板](https://vika.cn/share/shr7DVsgmH1mEsAzsPPNm)，其中添加了 type 和 description 两个自定义字段。

另外，推荐[frontmatter links插件](https://github.com/Trikzon/obsidian-frontmatter-links)，可以让 vikalink 中的链接能够点击。
## TODO
- 看看有没有 bug
