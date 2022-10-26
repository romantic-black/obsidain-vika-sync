## 简介

由 Johnny 老师的[Ob 与 Vika 同步脚本](https://milinshushe.feishu.cn/docs/doccnSwkXMw7tEQJwmBg72yzpLb)改进而来

## How to use
- 下载 release 中的文件至`.obsidian\plugins\obsidain-vika-sync`中
- 下载 advanced url 插件
- 打开设置，开启插件，完成 vika 的 token，datasheetId，viewId 设置
  - 从 vika 数据表中任取一个单元格，点击右键，选择复制行 URL，假设其为 `https://vika.cn/workbench/dstqMqKoMfmqwKcyGd/viwWEJsRNKaej/recso6avo3jrs`
  - datasheetId 对应`dstqMqKoMfmqwKcyGd`
  - viewId 对应`viwWEJsRNKaej`
- **注意**：不要在重要的库中使用本插件，刚写出来没两天

## 目前的功能
- 添加至vika、更新、删除、从 Vika 中恢复当前的笔记
  - `uid`属性通过将笔记添加至 Vika 获取
  - 不存在`uid`时，更新与添加等价
  - 存在`uid`时，删除操作会连同 Vika 中的记录一并删除
  - 不存在`uid`时，恢复操作不起作用
  - 添加和更新操作会改变 frontmatter 中的部分属性，自定义属性不会改变（但是我并没有测试过）
- 更新当前文件所在文件夹中的笔记（同步需要较长时间，因为 Vika 对操作频率有限制）
- 更新全部笔记

## Vika 格式
目前不支持自定义字段，需要在Vika表中建立以下名称的字段：
- 标题：单行文本
- URL：链接
- 文件夹：单行文本
- 内容：多行文本
- tags：多选
- aliases：多选
- 出链：多选
- 入链：多选

其中 URL 在存在`uid`的前提下优先使用 advanced url 插件中的链接类型，所以需要下载该插件

## TODO
- 自定义字段的设置
- 看看有没有 bug
