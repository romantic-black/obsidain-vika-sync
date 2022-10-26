

Inspired by Johnny Obsidian's [sync script with Vika](https://milinshushe.feishu.cn/docs/doccnSwkXMw7tEQJwmBg72yzpLb), [Chinese](https://github.com/romantic-black/obsidain-vika-sync/blob/master/README_zh.md)

## What is Vika?
[Vika](https://vika.cn) is a cloud-based database software in China that can reduce your burden in managing note. Vika has similar functionality and apis to airtable, so this plug-in will be compatible with aritable in the future.

## How to use?
- Download this plugin.
- Set your Vika token, datasheetId, viewId
  - For example, right click a item in your Vika sheet, copy its URL `https://vika.cn/workbench/dstqMqKoMfmqwKcyGd/viwWEJsRNKaej/recso6avo3jrs`
  - datasheetId should be `dstqMqKoMfmqwKcyGd`, viewId `viwWEJsRNKaej`
- Set your custom fields.
  - `update` is the fields uploads from frontmatter to Vika
  - `recover` is the fields download form Vika to frontmatter
- Add default fields in your Vika.
- Download Advanced URI in community.
  
## What can I do?
- create/update/delete record in Vika
- recover note from Vika
- update all note in current folder
- update all note in vault
- customize your own fields


## Default Fields
Vika Sync has several default fields, which are obtained through the Obsidian Api. Before using Vika, ensure that the following fields are available in your Vika.
- Title: str
- ID：str
- Vault：str
- Content：str
- CreatedTime：str
- UpdatedTime：str
- OBURI：str
- Folder: str
- Aliases：str[]
- Tags：str[]
- OutLinks：str[]
- BackLinks：str[]
- UnresolvedOutLinks：str[]

`uid`, `vikaLink`, `Tags`, `Aliases` are set to be recovered. You should avoid using fields that duplicate them. `uid` indicates where the notes are stored in vika.

## TODO
- find bug.
