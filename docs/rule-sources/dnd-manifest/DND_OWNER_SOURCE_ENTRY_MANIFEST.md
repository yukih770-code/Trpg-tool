# DND Owner Source Entry Manifest

Generated for `DND Owner Source Entry Manifest Build v1`.

This manifest records item names, source repositories, source paths, and extraction status only. It does not copy rule descriptions, mechanics text, spell effects, tables, or official prose into this project.

## Source Authority

- Primary DND 2024 / SRD5.2 source: `dnd5echm-srd52-primary` -> `https://github.com/DND5eChm/SRD5.2Chm`
- Secondary XGtE / TCoE / broader 5e cross-check source: `https://github.com/DND5eChm/DND5e_chm`
- XGtE sourceId used here: `dnd5echm-xgte`
- TCoE sourceId used here: `dnd5echm-tcoe`
- Explicitly excluded: `DND5eChm/dnd2014-legacy`, BG3, third-party wiki, model memory, and unspecified web sources.

## Effect Text Policy

- Spell effect text is needed for play, but this public project manifest does not copy long rule text.
- Spell entries record `hasEffectTextInSource`, `effectExtractionPolicy`, `contentPolicy`, and `futureRuntimeUse`.
- Recommended future path: extract safe structured fields where permitted, and keep full effect text in a private/local import layer unless publication-safe scope is confirmed.

## Confirmed Source Path Structure

### SRD5.2Chm

- `玩家手册2024/专长`
- `玩家手册2024/创建角色`
- `玩家手册2024/术语汇编`
- `玩家手册2024/法术`
- `玩家手册2024/法术详述`
- `玩家手册2024/装备`
- `玩家手册2024/角色职业`
- `玩家手册2024/角色起源`
- `玩家手册2024/进行游戏`

### DND5e_chm

- `玩家手册2024`
  - `玩家手册2024/专长`
  - `玩家手册2024/创建角色`
  - `玩家手册2024/多元宇宙`
  - `玩家手册2024/术语汇编`
  - `玩家手册2024/欢迎`
  - `玩家手册2024/法术`
  - `玩家手册2024/法术详述`
  - `玩家手册2024/装备`
  - `玩家手册2024/角色职业`
  - `玩家手册2024/角色起源`
  - `玩家手册2024/进行游戏`
- `珊娜萨的万事指南`
  - `珊娜萨的万事指南/共享战役`
  - `珊娜萨的万事指南/地下城主工具`
  - `珊娜萨的万事指南/核心规则`
  - `珊娜萨的万事指南/法术`
  - `珊娜萨的万事指南/角色姓名`
  - `珊娜萨的万事指南/角色选项`
- `塔莎的万事坩埚`
  - `塔莎的万事坩埚/使用本书`
  - `塔莎的万事坩埚/协力者`
  - `塔莎的万事坩埚/团队赞助者`
  - `塔莎的万事坩埚/城主工具`
  - `塔莎的万事坩埚/法术`
  - `塔莎的万事坩埚/玩家选项`
  - `塔莎的万事坩埚/魔法物品`

## Counts

- classes: 13
- subclasses: 73
- species / races: 10
- backgrounds: 5
- feat source entries: 7
- spell entries: 507
- equipment category entries: 13
- class-resource / progression source entries: 55

## Class To Subclass Table

| Class | Subclass | SourceId | Scope | SourcePath | Status | Notes |
|---|---|---|---|---|---|---|
| 德鲁伊 | 大地结社 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/德鲁伊/大地结社.htm` | found | Primary source subclass page. |
| 德鲁伊 | 梦境结社 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/德鲁伊/梦境结社.html` | found | Secondary XGtE subclass page. |
| 德鲁伊 | 牧人结社 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/德鲁伊/牧人结社.html` | found | Secondary XGtE subclass page. |
| 德鲁伊（TCE） | 孢子结社 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）/孢子结社.html` | found | Secondary TCoE subclass page. |
| 德鲁伊（TCE） | 星辰结社 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）/星辰结社.html` | found | Secondary TCoE subclass page. |
| 德鲁伊（TCE） | 野火结社 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）/野火结社.html` | found | Secondary TCoE subclass page. |
| 法师 | 塑能师 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/法师/塑能师.htm` | found | Primary source subclass page. |
| 法师 | 战争魔法 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/法师/战争魔法.html` | found | Secondary XGtE subclass page. |
| 法师（TCE） | 剑咏 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/法师（TCE）/剑咏.html` | found | Secondary TCoE subclass page. |
| 法师（TCE） | 书士会 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/法师（TCE）/书士会.html` | found | Secondary TCoE subclass page. |
| 魔契师 | 邪魔宗主 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/魔契师/邪魔宗主.htm` | found | Primary source subclass page. |
| 牧师 | 生命领域 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/牧师/生命领域.htm` | found | Primary source subclass page. |
| 牧师 | 锻造领域 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/牧师/锻造领域.html` | found | Secondary XGtE subclass page. |
| 牧师 | 坟墓领域 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/牧师/坟墓领域.html` | found | Secondary XGtE subclass page. |
| 牧师（TCE） | 和平领域 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/牧师（TCE）/和平领域.html` | found | Secondary TCoE subclass page. |
| 牧师（TCE） | 暮光领域 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/牧师（TCE）/暮光领域.html` | found | Secondary TCoE subclass page. |
| 牧师（TCE） | 秩序领域 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/牧师（TCE）/秩序领域.html` | found | Secondary TCoE subclass page. |
| 奇械师 | 炼金师 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/奇械师/炼金师.html` | found | Secondary TCoE subclass page. |
| 奇械师 | 魔炮师 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/奇械师/魔炮师.html` | found | Secondary TCoE subclass page. |
| 奇械师 | 战地匠师 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/奇械师/战地匠师.html` | found | Secondary TCoE subclass page. |
| 奇械师 | 装甲师 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/奇械师/装甲师.html` | found | Secondary TCoE subclass page. |
| 圣武士 | 奉献之誓 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/圣武士/奉献之誓.htm` | found | Primary source subclass page. |
| 圣武士 | 救赎之誓 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/圣武士/救赎之誓.html` | found | Secondary XGtE subclass page. |
| 圣武士 | 征服之誓 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/圣武士/征服之誓.html` | found | Secondary XGtE subclass page. |
| 圣武士（TCE） | 荣耀之誓 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/圣武士（TCE）/荣耀之誓.html` | found | Secondary TCoE subclass page. |
| 圣武士（TCE） | 守望之誓 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/圣武士（TCE）/守望之誓.html` | found | Secondary TCoE subclass page. |
| 术士 | 龙族术法 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/术士/龙族术法.htm` | found | Primary source subclass page. |
| 术士 | 风暴术法 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/术士/风暴术法.html` | found | Secondary XGtE subclass page. |
| 术士 | 神圣之魂 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/术士/神圣之魂.html` | found | Secondary XGtE subclass page. |
| 术士 | 幽影魔法 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/术士/幽影魔法.html` | found | Secondary XGtE subclass page. |
| 术士（TCE） | 畸变心智 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/术士（TCE）/畸变心智.html` | found | Secondary TCoE subclass page. |
| 术士（TCE） | 时械之魂 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/术士（TCE）/时械之魂.html` | found | Secondary TCoE subclass page. |
| 武僧 | 散打武者 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/武僧/散打武者.htm` | found | Primary source subclass page. |
| 武僧 | 剑圣宗 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/武僧/剑圣宗.html` | found | Secondary XGtE subclass page. |
| 武僧 | 日魂宗 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/武僧/日魂宗.html` | found | Secondary XGtE subclass page. |
| 武僧 | 醉拳宗 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/武僧/醉拳宗.html` | found | Secondary XGtE subclass page. |
| 武僧（TCE） | 命流宗 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/武僧（TCE）/命流宗.html` | found | Secondary TCoE subclass page. |
| 武僧（TCE） | 星我宗 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/武僧（TCE）/星我宗.html` | found | Secondary TCoE subclass page. |
| 邪术师 | 天界 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/邪术师/天界.html` | found | Secondary XGtE subclass page. |
| 邪术师 | 咒剑 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/邪术师/咒剑.html` | found | Secondary XGtE subclass page. |
| 邪术师（TCE） | 巨灵宗主 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/邪术师（TCE）/巨灵宗主.html` | found | Secondary TCoE subclass page. |
| 邪术师（TCE） | 深海意志 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/邪术师（TCE）/深海意志.html` | found | Secondary TCoE subclass page. |
| 野蛮人 | 狂战士道途 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/野蛮人/狂战士道途.htm` | found | Primary source subclass page. |
| 野蛮人 | 风暴先驱道途 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/野蛮人/风暴先驱道途.html` | found | Secondary XGtE subclass page. |
| 野蛮人 | 狂热者道途 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/野蛮人/狂热者道途.html` | found | Secondary XGtE subclass page. |
| 野蛮人 | 先祖守卫道途 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/野蛮人/先祖守卫道途.html` | found | Secondary XGtE subclass page. |
| 野蛮人（TCE） | 狂野魔法道途 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/野蛮人（TCE）/狂野魔法道途.html` | found | Secondary TCoE subclass page. |
| 野蛮人（TCE） | 野兽道途 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/野蛮人（TCE）/野兽道途.html` | found | Secondary TCoE subclass page. |
| 吟游诗人 | 逸闻学院 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/吟游诗人/逸闻学院.htm` | found | Primary source subclass page. |
| 吟游诗人 | 低语学院 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/吟游诗人/低语学院.html` | found | Secondary XGtE subclass page. |
| 吟游诗人 | 剑舞学院 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/吟游诗人/剑舞学院.html` | found | Secondary XGtE subclass page. |
| 吟游诗人 | 迷惑学院 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/吟游诗人/迷惑学院.html` | found | Secondary XGtE subclass page. |
| 吟游诗人（TCE） | 创造学院 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/吟游诗人（TCE）/创造学院.html` | found | Secondary TCoE subclass page. |
| 吟游诗人（TCE） | 雄辩学院 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/吟游诗人（TCE）/雄辩学院.html` | found | Secondary TCoE subclass page. |
| 游荡者 | 盗贼 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/游荡者/盗贼.htm` | found | Primary source subclass page. |
| 游荡者 | 策士 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游荡者/策士.html` | found | Secondary XGtE subclass page. |
| 游荡者 | 斥候 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游荡者/斥候.html` | found | Secondary XGtE subclass page. |
| 游荡者 | 调查员 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游荡者/调查员.html` | found | Secondary XGtE subclass page. |
| 游荡者 | 风流剑客 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游荡者/风流剑客.html` | found | Secondary XGtE subclass page. |
| 游荡者（TCE） | 鬼魅 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/游荡者（TCE）/鬼魅.html` | found | Secondary TCoE subclass page. |
| 游荡者（TCE） | 魂刃 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/游荡者（TCE）/魂刃.html` | found | Secondary TCoE subclass page. |
| 游侠 | 猎人 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/游侠/猎人.htm` | found | Primary source subclass page. |
| 游侠 | 边界行者 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游侠/边界行者.html` | found | Secondary XGtE subclass page. |
| 游侠 | 怪物杀手 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游侠/怪物杀手.html` | found | Secondary XGtE subclass page. |
| 游侠 | 幽域追踪者 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/游侠/幽域追踪者.html` | found | Secondary XGtE subclass page. |
| 游侠（TCE） | 集群牧者 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/游侠（TCE）/集群牧者.html` | found | Secondary TCoE subclass page. |
| 游侠（TCE） | 妖精漫游者 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/游侠（TCE）/妖精漫游者.html` | found | Secondary TCoE subclass page. |
| 战士 | 勇士 | `dnd5echm-srd52-primary` | dnd2024 | `玩家手册2024/角色职业/战士/勇士.htm` | found | Primary source subclass page. |
| 战士 | 魔射手 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/战士/魔射手.html` | found | Secondary XGtE subclass page. |
| 战士 | 骑兵 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/战士/骑兵.html` | found | Secondary XGtE subclass page. |
| 战士 | 武士 | `dnd5echm-xgte` | xgte | `珊娜萨的万事指南/角色选项/战士/武士.html` | found | Secondary XGtE subclass page. |
| 战士（TCE） | 符文骑士 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/战士（TCE）/符文骑士.html` | found | Secondary TCoE subclass page. |
| 战士（TCE） | 灵能武士 | `dnd5echm-tcoe` | tcoe | `塔莎的万事坩埚/玩家选项/职业/战士（TCE）/灵能武士.html` | found | Secondary TCoE subclass page. |

## Ambiguous / Needs Human Check

- Feat category files are recorded, but individual feat rows require a later table/heading extraction pass.
- Equipment category files are recorded, but individual equipment rows require a later table extraction pass.
- Spell English names are derived from stable HTML `id` anchors; Chinese names, schools, and publication-safe effect text require later checked extraction.
- TCoE class option/support files such as companion, invocation, infusion, build, or maneuver option pages are recorded as `class-resource` rather than promoted into gameplay mechanics.

## Item Entries

### Item: 士兵

- itemType: background
- nameCn: 士兵
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/背景
- sourceFile: 士兵.htm
- scope: dnd2024
- extractionStatus: found
- notes: Background page found in primary DND 2024 / SRD5.2 source.

### Item: 侍僧

- itemType: background
- nameCn: 侍僧
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/背景
- sourceFile: 侍僧.htm
- scope: dnd2024
- extractionStatus: found
- notes: Background page found in primary DND 2024 / SRD5.2 source.

### Item: 智者

- itemType: background
- nameCn: 智者
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/背景
- sourceFile: 智者.htm
- scope: dnd2024
- extractionStatus: found
- notes: Background page found in primary DND 2024 / SRD5.2 source.

### Item: 罪犯

- itemType: background
- nameCn: 罪犯
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/背景
- sourceFile: 罪犯.htm
- scope: dnd2024
- extractionStatus: found
- notes: Background page found in primary DND 2024 / SRD5.2 source.

### Item: 构建角色生平

- itemType: background
- nameCn: 构建角色生平
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 构建角色生平.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 德鲁伊

- itemType: class
- nameCn: 德鲁伊
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 德鲁伊/德鲁伊.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 法师

- itemType: class
- nameCn: 法师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 法师/法师.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 魔契师

- itemType: class
- nameCn: 魔契师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 魔契师/魔契师.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 牧师

- itemType: class
- nameCn: 牧师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 牧师/牧师.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 圣武士

- itemType: class
- nameCn: 圣武士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 圣武士/圣武士.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 术士

- itemType: class
- nameCn: 术士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 术士/术士.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 武僧

- itemType: class
- nameCn: 武僧
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 武僧/武僧.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 野蛮人

- itemType: class
- nameCn: 野蛮人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 野蛮人/野蛮人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 吟游诗人

- itemType: class
- nameCn: 吟游诗人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 吟游诗人/吟游诗人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 游荡者

- itemType: class
- nameCn: 游荡者
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 游荡者/游荡者.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 游侠

- itemType: class
- nameCn: 游侠
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 游侠/游侠.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 战士

- itemType: class
- nameCn: 战士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 战士/战士.htm
- scope: dnd2024
- extractionStatus: found
- notes: Class page found in primary DND 2024 / SRD5.2 source.

### Item: 奇械师

- itemType: class
- nameCn: 奇械师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 奇械师.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE class page found.

### Item: 超魔法选项

- itemType: class-resource
- nameCn: 超魔法选项
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/术士
- sourceFile: 超魔法选项.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 德鲁伊法术列表

- itemType: class-resource
- nameCn: 德鲁伊法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/德鲁伊
- sourceFile: 德鲁伊法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 法师法术列表

- itemType: class-resource
- nameCn: 法师法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/法师
- sourceFile: 法师法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 魔能祈唤选项

- itemType: class-resource
- nameCn: 魔能祈唤选项
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/魔契师
- sourceFile: 魔能祈唤选项.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 魔契师法术列表

- itemType: class-resource
- nameCn: 魔契师法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/魔契师
- sourceFile: 魔契师法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 牧师法术列表

- itemType: class-resource
- nameCn: 牧师法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/牧师
- sourceFile: 牧师法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 圣武士法术列表

- itemType: class-resource
- nameCn: 圣武士法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/圣武士
- sourceFile: 圣武士法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 术士法术列表

- itemType: class-resource
- nameCn: 术士法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/术士
- sourceFile: 术士法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 吟游诗人法术列表

- itemType: class-resource
- nameCn: 吟游诗人法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/吟游诗人
- sourceFile: 吟游诗人法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 游侠法术列表

- itemType: class-resource
- nameCn: 游侠法术列表
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/游侠
- sourceFile: 游侠法术列表.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Class spell list or class option source path recorded; rules text not extracted.

### Item: 德鲁伊（TCE）

- itemType: class-resource
- nameCn: 德鲁伊（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 德鲁伊（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 法师（TCE）

- itemType: class-resource
- nameCn: 法师（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 法师（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 魔能祈唤

- itemType: class-resource
- nameCn: 魔能祈唤
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/邪术师（TCE）
- sourceFile: 魔能祈唤.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 牧师（TCE）

- itemType: class-resource
- nameCn: 牧师（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 牧师（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 奇械师法术列表

- itemType: class-resource
- nameCn: 奇械师法术列表
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 奇械师法术列表.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 奇械师注法

- itemType: class-resource
- nameCn: 奇械师注法
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 奇械师注法.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 圣武士（TCE）

- itemType: class-resource
- nameCn: 圣武士（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 圣武士（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 术士（TCE）

- itemType: class-resource
- nameCn: 术士（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 术士（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 武僧（TCE）

- itemType: class-resource
- nameCn: 武僧（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 武僧（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 邪术师（TCE）

- itemType: class-resource
- nameCn: 邪术师（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 邪术师（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 驯兽师伙伴

- itemType: class-resource
- nameCn: 驯兽师伙伴
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/游侠（TCE）
- sourceFile: 驯兽师伙伴.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 野蛮人（TCE）

- itemType: class-resource
- nameCn: 野蛮人（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 野蛮人（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 吟游诗人（TCE）

- itemType: class-resource
- nameCn: 吟游诗人（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 吟游诗人（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 游荡者（TCE）

- itemType: class-resource
- nameCn: 游荡者（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 游荡者（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 游侠（TCE）

- itemType: class-resource
- nameCn: 游侠（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 游侠（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 战斗大师构筑

- itemType: class-resource
- nameCn: 战斗大师构筑
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/战士（TCE）
- sourceFile: 战斗大师构筑.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 战技选项

- itemType: class-resource
- nameCn: 战技选项
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/战士（TCE）
- sourceFile: 战技选项.htm
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option/support source path recorded; rules text not extracted.

### Item: 战士（TCE）

- itemType: class-resource
- nameCn: 战士（TCE）
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 战士（TCE）.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class option overview source file recorded.

### Item: 德鲁伊

- itemType: class-resource
- nameCn: 德鲁伊
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 德鲁伊.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 法师

- itemType: class-resource
- nameCn: 法师
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 法师.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 魔能祈唤

- itemType: class-resource
- nameCn: 魔能祈唤
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/邪术师
- sourceFile: 魔能祈唤.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class option source path recorded; rules text not extracted.

### Item: 牧师

- itemType: class-resource
- nameCn: 牧师
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 牧师.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 圣武士

- itemType: class-resource
- nameCn: 圣武士
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 圣武士.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 术士

- itemType: class-resource
- nameCn: 术士
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 术士.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 武僧

- itemType: class-resource
- nameCn: 武僧
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 武僧.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 邪术师

- itemType: class-resource
- nameCn: 邪术师
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 邪术师.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 学习野兽形态

- itemType: class-resource
- nameCn: 学习野兽形态
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/德鲁伊
- sourceFile: 学习野兽形态.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class option source path recorded; rules text not extracted.

### Item: 野蛮人

- itemType: class-resource
- nameCn: 野蛮人
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 野蛮人.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 吟游诗人

- itemType: class-resource
- nameCn: 吟游诗人
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 吟游诗人.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 游荡者

- itemType: class-resource
- nameCn: 游荡者
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 游荡者.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 游侠

- itemType: class-resource
- nameCn: 游侠
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 游侠.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 战士

- itemType: class-resource
- nameCn: 战士
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 战士.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 词条

- itemType: equipment
- nameCn: 词条
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 词条.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 服务

- itemType: equipment
- nameCn: 服务
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 服务.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 工匠工具

- itemType: equipment
- nameCn: 工匠工具
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 工匠工具.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 工具

- itemType: equipment
- nameCn: 工具
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 工具.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 护甲

- itemType: equipment
- nameCn: 护甲
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 护甲.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 精通词条

- itemType: equipment
- nameCn: 精通词条
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 精通词条.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 冒险装备

- itemType: equipment
- nameCn: 冒险装备
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 冒险装备.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 魔法物品

- itemType: equipment
- nameCn: 魔法物品
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 魔法物品.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 其他工具

- itemType: equipment
- nameCn: 其他工具
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 其他工具.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 钱币

- itemType: equipment
- nameCn: 钱币
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 钱币.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 武器

- itemType: equipment
- nameCn: 武器
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 武器.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 制作装备

- itemType: equipment
- nameCn: 制作装备
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 制作装备.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 坐骑与载具

- itemType: equipment
- nameCn: 坐骑与载具
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/装备
- sourceFile: 坐骑与载具.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Equipment category/source file found. Individual item rows require a later table extraction pass; do not fill from memory.

### Item: 传奇恩惠专长

- itemType: feat
- nameCn: 传奇恩惠专长
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/专长
- sourceFile: 传奇恩惠专长.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Feat category/overview file found. Individual feat rows require a later heading/table extraction pass; do not fill from memory.

### Item: 起源专长

- itemType: feat
- nameCn: 起源专长
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/专长
- sourceFile: 起源专长.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Feat category/overview file found. Individual feat rows require a later heading/table extraction pass; do not fill from memory.

### Item: 通用专长

- itemType: feat
- nameCn: 通用专长
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/专长
- sourceFile: 通用专长.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Feat category/overview file found. Individual feat rows require a later heading/table extraction pass; do not fill from memory.

### Item: 战斗风格专长

- itemType: feat
- nameCn: 战斗风格专长
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/专长
- sourceFile: 战斗风格专长.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Feat category/overview file found. Individual feat rows require a later heading/table extraction pass; do not fill from memory.

### Item: 专长概述

- itemType: feat
- nameCn: 专长概述
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/专长
- sourceFile: 专长概述.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Feat category/overview file found. Individual feat rows require a later heading/table extraction pass; do not fill from memory.

### Item: 专长

- itemType: feat
- nameCn: 专长
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项
- sourceFile: 专长.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE feat source file found. Individual feat rows require a later extraction pass.

### Item: 种族专长

- itemType: feat
- nameCn: 种族专长
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项
- sourceFile: 种族专长.html
- scope: xgte
- extractionStatus: partial
- notes: XGtE class/option overview source file; item mechanics not extracted.

### Item: 背景详述

- itemType: origin-section
- nameCn: 背景详述
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源
- sourceFile: 背景详述.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Origin overview/detail page recorded; not a single player option item.

### Item: 种族详述

- itemType: origin-section
- nameCn: 种族详述
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源
- sourceFile: 种族详述.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Origin overview/detail page recorded; not a single player option item.

### Item: 定制角色

- itemType: origin-section
- nameCn: 定制角色
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项
- sourceFile: 定制角色.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE player option overview file recorded.

### Item: 角色选项

- itemType: origin-section
- nameCn: 角色选项
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项
- sourceFile: 角色选项.htm
- scope: tcoe
- extractionStatus: partial
- notes: TCoE player option overview file recorded.

### Item: 德鲁伊

- itemType: progression
- nameCn: 德鲁伊
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 德鲁伊/德鲁伊.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 法师

- itemType: progression
- nameCn: 法师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 法师/法师.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 魔契师

- itemType: progression
- nameCn: 魔契师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 魔契师/魔契师.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 牧师

- itemType: progression
- nameCn: 牧师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 牧师/牧师.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 圣武士

- itemType: progression
- nameCn: 圣武士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 圣武士/圣武士.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 术士

- itemType: progression
- nameCn: 术士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 术士/术士.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 武僧

- itemType: progression
- nameCn: 武僧
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 武僧/武僧.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 野蛮人

- itemType: progression
- nameCn: 野蛮人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 野蛮人/野蛮人.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 吟游诗人

- itemType: progression
- nameCn: 吟游诗人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 吟游诗人/吟游诗人.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 游荡者

- itemType: progression
- nameCn: 游荡者
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 游荡者/游荡者.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 游侠

- itemType: progression
- nameCn: 游侠
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 游侠/游侠.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 战士

- itemType: progression
- nameCn: 战士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业
- sourceFile: 战士/战士.htm
- scope: dnd2024
- extractionStatus: partial
- notes: Progression/resource rules are located on the class page; mechanics were not extracted in this manifest.

### Item: 奇械师

- itemType: progression
- nameCn: 奇械师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业
- sourceFile: 奇械师.html
- scope: tcoe
- extractionStatus: partial
- notes: TCoE class progression/source path recorded; mechanics not extracted.

### Item: 矮人

- itemType: species
- nameCn: 矮人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 矮人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 半身人

- itemType: species
- nameCn: 半身人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 半身人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 歌利亚

- itemType: species
- nameCn: 歌利亚
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 歌利亚.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 精灵

- itemType: species
- nameCn: 精灵
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 精灵.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 龙裔

- itemType: species
- nameCn: 龙裔
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 龙裔.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 人类

- itemType: species
- nameCn: 人类
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 人类.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 兽人

- itemType: species
- nameCn: 兽人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 兽人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 提夫林

- itemType: species
- nameCn: 提夫林
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 提夫林.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 侏儒

- itemType: species
- nameCn: 侏儒
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色起源/种族
- sourceFile: 侏儒.htm
- scope: dnd2024
- extractionStatus: found
- notes: Species/race page found in primary DND 2024 / SRD5.2 source.

### Item: 定制血统

- itemType: species
- nameCn: 定制血统
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项
- sourceFile: 定制血统.htm
- scope: tcoe
- extractionStatus: found
- notes: TCoE custom lineage source page found.

### Item: Acid Splash

- itemType: spell
- nameCn: needs-human-check
- nameEn: Acid Splash
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Aid

- itemType: spell
- nameCn: needs-human-check
- nameEn: Aid
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Alarm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Alarm
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Alter Self

- itemType: spell
- nameCn: needs-human-check
- nameEn: Alter Self
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Animal Friendship

- itemType: spell
- nameCn: needs-human-check
- nameEn: Animal Friendship
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Animal Messenger

- itemType: spell
- nameCn: needs-human-check
- nameEn: Animal Messenger
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Animal Shapes

- itemType: spell
- nameCn: needs-human-check
- nameEn: Animal Shapes
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Animate Dead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Animate Dead
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Animate Objects

- itemType: spell
- nameCn: needs-human-check
- nameEn: Animate Objects
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Antilife Shell

- itemType: spell
- nameCn: needs-human-check
- nameEn: Antilife Shell
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Antimagic Field

- itemType: spell
- nameCn: needs-human-check
- nameEn: Antimagic Field
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: AntipathySympathy

- itemType: spell
- nameCn: needs-human-check
- nameEn: AntipathySympathy
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Arcane Eye

- itemType: spell
- nameCn: needs-human-check
- nameEn: Arcane Eye
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Arcane Gate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Arcane Gate
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Arcane Lock

- itemType: spell
- nameCn: needs-human-check
- nameEn: Arcane Lock
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Arcane Vigor

- itemType: spell
- nameCn: needs-human-check
- nameEn: Arcane Vigor
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Armor of Agathys

- itemType: spell
- nameCn: needs-human-check
- nameEn: Armor of Agathys
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Arms of Hadar

- itemType: spell
- nameCn: needs-human-check
- nameEn: Arms of Hadar
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Astral Projection

- itemType: spell
- nameCn: needs-human-check
- nameEn: Astral Projection
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Augury

- itemType: spell
- nameCn: needs-human-check
- nameEn: Augury
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Aura of Life

- itemType: spell
- nameCn: needs-human-check
- nameEn: Aura of Life
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Aura of Purity

- itemType: spell
- nameCn: needs-human-check
- nameEn: Aura of Purity
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Aura of Vitality

- itemType: spell
- nameCn: needs-human-check
- nameEn: Aura of Vitality
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Awaken

- itemType: spell
- nameCn: needs-human-check
- nameEn: Awaken
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Bane

- itemType: spell
- nameCn: needs-human-check
- nameEn: Bane
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Banishing Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Banishing Smite
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Banishment

- itemType: spell
- nameCn: needs-human-check
- nameEn: Banishment
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Barkskin

- itemType: spell
- nameCn: needs-human-check
- nameEn: Barkskin
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Beacon of Hope

- itemType: spell
- nameCn: needs-human-check
- nameEn: Beacon of Hope
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Beast Sense

- itemType: spell
- nameCn: needs-human-check
- nameEn: Beast Sense
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Befuddlement

- itemType: spell
- nameCn: needs-human-check
- nameEn: Befuddlement
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Bestow Curse

- itemType: spell
- nameCn: needs-human-check
- nameEn: Bestow Curse
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Bigby's Hand

- itemType: spell
- nameCn: needs-human-check
- nameEn: Bigby's Hand
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blade Barrier

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blade Barrier
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blade Ward

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blade Ward
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Bless

- itemType: spell
- nameCn: needs-human-check
- nameEn: Bless
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blight

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blight
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blinding Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blinding Smite
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: BlindnessDeafness

- itemType: spell
- nameCn: needs-human-check
- nameEn: BlindnessDeafness
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blink

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blink
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blur

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blur
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Burning Hands

- itemType: spell
- nameCn: needs-human-check
- nameEn: Burning Hands
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Call Lightning

- itemType: spell
- nameCn: needs-human-check
- nameEn: Call Lightning
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Calm Emotions

- itemType: spell
- nameCn: needs-human-check
- nameEn: Calm Emotions
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Chain Lightning

- itemType: spell
- nameCn: needs-human-check
- nameEn: Chain Lightning
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Charm Monster

- itemType: spell
- nameCn: needs-human-check
- nameEn: Charm Monster
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Charm Person

- itemType: spell
- nameCn: needs-human-check
- nameEn: Charm Person
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Chill Touch

- itemType: spell
- nameCn: needs-human-check
- nameEn: Chill Touch
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Chromatic Orb

- itemType: spell
- nameCn: needs-human-check
- nameEn: Chromatic Orb
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Circle of Death

- itemType: spell
- nameCn: needs-human-check
- nameEn: Circle of Death
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Circle of Power

- itemType: spell
- nameCn: needs-human-check
- nameEn: Circle of Power
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Clairvoyance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Clairvoyance
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Clone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Clone
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cloud of Daggers

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cloud of Daggers
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cloudkill

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cloudkill
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Color Spray

- itemType: spell
- nameCn: needs-human-check
- nameEn: Color Spray
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Command

- itemType: spell
- nameCn: needs-human-check
- nameEn: Command
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Commune

- itemType: spell
- nameCn: needs-human-check
- nameEn: Commune
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Commune with Nature

- itemType: spell
- nameCn: needs-human-check
- nameEn: Commune with Nature
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Compelled Duel

- itemType: spell
- nameCn: needs-human-check
- nameEn: Compelled Duel
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Comprehend Languages

- itemType: spell
- nameCn: needs-human-check
- nameEn: Comprehend Languages
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Compulsion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Compulsion
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cone of Cold

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cone of Cold
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Confusion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Confusion
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Animals

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Animals
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Barrage

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Barrage
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Celestial

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Celestial
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Elemental

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Elemental
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Fey

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Fey
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Minor Elementals

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Minor Elementals
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Volley

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Volley
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Conjure Woodland Beings

- itemType: spell
- nameCn: needs-human-check
- nameEn: Conjure Woodland Beings
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Contact Other Plane

- itemType: spell
- nameCn: needs-human-check
- nameEn: Contact Other Plane
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Contagion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Contagion
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Contingency

- itemType: spell
- nameCn: needs-human-check
- nameEn: Contingency
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Continual Flame

- itemType: spell
- nameCn: needs-human-check
- nameEn: Continual Flame
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Control Water

- itemType: spell
- nameCn: needs-human-check
- nameEn: Control Water
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Control Weather

- itemType: spell
- nameCn: needs-human-check
- nameEn: Control Weather
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cordon of Arrows

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cordon of Arrows
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Counterspell

- itemType: spell
- nameCn: needs-human-check
- nameEn: Counterspell
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Create Food and Water

- itemType: spell
- nameCn: needs-human-check
- nameEn: Create Food and Water
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Create or Destroy Water

- itemType: spell
- nameCn: needs-human-check
- nameEn: Create or Destroy Water
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Create Undead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Create Undead
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Creation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Creation
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Crown of Madness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Crown of Madness
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Crusader's Mantle

- itemType: spell
- nameCn: needs-human-check
- nameEn: Crusader's Mantle
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cure Wounds

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cure Wounds
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dancing Lights

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dancing Lights
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Darkness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Darkness
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Darkvision

- itemType: spell
- nameCn: needs-human-check
- nameEn: Darkvision
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Daylight

- itemType: spell
- nameCn: needs-human-check
- nameEn: Daylight
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Death Ward

- itemType: spell
- nameCn: needs-human-check
- nameEn: Death Ward
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Delayed Blast Fireball

- itemType: spell
- nameCn: needs-human-check
- nameEn: Delayed Blast Fireball
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Demiplane

- itemType: spell
- nameCn: needs-human-check
- nameEn: Demiplane
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Destructive Wave

- itemType: spell
- nameCn: needs-human-check
- nameEn: Destructive Wave
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Detect Evil and Good

- itemType: spell
- nameCn: needs-human-check
- nameEn: Detect Evil and Good
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Detect Magic

- itemType: spell
- nameCn: needs-human-check
- nameEn: Detect Magic
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Detect Poison and Disease

- itemType: spell
- nameCn: needs-human-check
- nameEn: Detect Poison and Disease
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Detect Thoughts

- itemType: spell
- nameCn: needs-human-check
- nameEn: Detect Thoughts
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dimension Door

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dimension Door
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Disguise Self

- itemType: spell
- nameCn: needs-human-check
- nameEn: Disguise Self
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Disintegrate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Disintegrate
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dispel Evil and Good

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dispel Evil and Good
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dispel Magic

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dispel Magic
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dissonant Whispers

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dissonant Whispers
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Divination

- itemType: spell
- nameCn: needs-human-check
- nameEn: Divination
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Divine Favor

- itemType: spell
- nameCn: needs-human-check
- nameEn: Divine Favor
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Divine Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Divine Smite
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Divine Word

- itemType: spell
- nameCn: needs-human-check
- nameEn: Divine Word
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dominate Beast

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dominate Beast
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dominate Monster

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dominate Monster
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dominate Person

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dominate Person
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dragon's Breath

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dragon's Breath
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Drawmij's Instant Summons

- itemType: spell
- nameCn: needs-human-check
- nameEn: Drawmij's Instant Summons
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dream

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dream
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Druidcraft

- itemType: spell
- nameCn: needs-human-check
- nameEn: Druidcraft
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Earthquake

- itemType: spell
- nameCn: needs-human-check
- nameEn: Earthquake
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Eldritch Blast

- itemType: spell
- nameCn: needs-human-check
- nameEn: Eldritch Blast
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Elemental Weapon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Elemental Weapon
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Elementalism

- itemType: spell
- nameCn: needs-human-check
- nameEn: Elementalism
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Enhance Ability

- itemType: spell
- nameCn: needs-human-check
- nameEn: Enhance Ability
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Enlarge Reduce

- itemType: spell
- nameCn: needs-human-check
- nameEn: Enlarge Reduce
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ensnaring Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ensnaring Strike
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Entangle

- itemType: spell
- nameCn: needs-human-check
- nameEn: Entangle
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Enthrall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Enthrall
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Etherealness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Etherealness
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Evard's Black Tentacles

- itemType: spell
- nameCn: needs-human-check
- nameEn: Evard's Black Tentacles
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Expeditious Retreat

- itemType: spell
- nameCn: needs-human-check
- nameEn: Expeditious Retreat
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Eyebite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Eyebite
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fabricate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fabricate
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Faerie Fire

- itemType: spell
- nameCn: needs-human-check
- nameEn: Faerie Fire
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: False Life

- itemType: spell
- nameCn: needs-human-check
- nameEn: False Life
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fear

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fear
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Feather Fall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Feather Fall
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Feign Death

- itemType: spell
- nameCn: needs-human-check
- nameEn: Feign Death
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Find Familiar

- itemType: spell
- nameCn: needs-human-check
- nameEn: Find Familiar
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Find Steed

- itemType: spell
- nameCn: needs-human-check
- nameEn: Find Steed
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Find the Path

- itemType: spell
- nameCn: needs-human-check
- nameEn: Find the Path
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Find Traps

- itemType: spell
- nameCn: needs-human-check
- nameEn: Find Traps
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Finger of Death

- itemType: spell
- nameCn: needs-human-check
- nameEn: Finger of Death
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fire Bolt

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fire Bolt
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fire Shield

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fire Shield
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fire Storm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fire Storm
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fireball

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fireball
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Flame Blade

- itemType: spell
- nameCn: needs-human-check
- nameEn: Flame Blade
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Flame Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Flame Strike
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Flaming Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Flaming Sphere
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Flesh to Stone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Flesh to Stone
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fly

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fly
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fog Cloud

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fog Cloud
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Forbiddance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Forbiddance
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Forcecage

- itemType: spell
- nameCn: needs-human-check
- nameEn: Forcecage
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Foresight

- itemType: spell
- nameCn: needs-human-check
- nameEn: Foresight
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Fount of Moonlight

- itemType: spell
- nameCn: needs-human-check
- nameEn: Fount of Moonlight
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Freedom of Movement

- itemType: spell
- nameCn: needs-human-check
- nameEn: Freedom of Movement
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Friends

- itemType: spell
- nameCn: needs-human-check
- nameEn: Friends
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Gaseous Form

- itemType: spell
- nameCn: needs-human-check
- nameEn: Gaseous Form
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Gate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Gate
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Geas

- itemType: spell
- nameCn: needs-human-check
- nameEn: Geas
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Gentle Repose

- itemType: spell
- nameCn: needs-human-check
- nameEn: Gentle Repose
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Giant Insect

- itemType: spell
- nameCn: needs-human-check
- nameEn: Giant Insect
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Glibness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Glibness
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Globe of Invulnerability

- itemType: spell
- nameCn: needs-human-check
- nameEn: Globe of Invulnerability
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Glyph of Warding

- itemType: spell
- nameCn: needs-human-check
- nameEn: Glyph of Warding
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Goodberry

- itemType: spell
- nameCn: needs-human-check
- nameEn: Goodberry
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Grasping Vine

- itemType: spell
- nameCn: needs-human-check
- nameEn: Grasping Vine
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Grease

- itemType: spell
- nameCn: needs-human-check
- nameEn: Grease
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Greater Invisibility

- itemType: spell
- nameCn: needs-human-check
- nameEn: Greater Invisibility
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Greater Restoration

- itemType: spell
- nameCn: needs-human-check
- nameEn: Greater Restoration
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Guardian of Faith

- itemType: spell
- nameCn: needs-human-check
- nameEn: Guardian of Faith
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Guards and Wards

- itemType: spell
- nameCn: needs-human-check
- nameEn: Guards and Wards
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Guidance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Guidance
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Guiding Bolt

- itemType: spell
- nameCn: needs-human-check
- nameEn: Guiding Bolt
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Gust of Wind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Gust of Wind
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hail of Thorns

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hail of Thorns
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hallow

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hallow
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hallucinatory Terrain

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hallucinatory Terrain
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Harm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Harm
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Haste

- itemType: spell
- nameCn: needs-human-check
- nameEn: Haste
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Heal

- itemType: spell
- nameCn: needs-human-check
- nameEn: Heal
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Healing Word

- itemType: spell
- nameCn: needs-human-check
- nameEn: Healing Word
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Heat Metal

- itemType: spell
- nameCn: needs-human-check
- nameEn: Heat Metal
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hellish Rebuke

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hellish Rebuke
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Heroes' Feast

- itemType: spell
- nameCn: needs-human-check
- nameEn: Heroes' Feast
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Heroism

- itemType: spell
- nameCn: needs-human-check
- nameEn: Heroism
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hex

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hex
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hold Monster

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hold Monster
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hold Person

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hold Person
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Holy Aura

- itemType: spell
- nameCn: needs-human-check
- nameEn: Holy Aura
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hunger of Hadar

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hunger of Hadar
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hunter's Mark

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hunter's Mark
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Hypnotic Pattern

- itemType: spell
- nameCn: needs-human-check
- nameEn: Hypnotic Pattern
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ice Knife

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ice Knife
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ice Storm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ice Storm
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Identify

- itemType: spell
- nameCn: needs-human-check
- nameEn: Identify
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Illusory Script

- itemType: spell
- nameCn: needs-human-check
- nameEn: Illusory Script
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Imprisonment

- itemType: spell
- nameCn: needs-human-check
- nameEn: Imprisonment
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Incendiary Cloud

- itemType: spell
- nameCn: needs-human-check
- nameEn: Incendiary Cloud
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Inflict Wounds

- itemType: spell
- nameCn: needs-human-check
- nameEn: Inflict Wounds
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Insect Plague

- itemType: spell
- nameCn: needs-human-check
- nameEn: Insect Plague
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Invisibility

- itemType: spell
- nameCn: needs-human-check
- nameEn: Invisibility
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Jailarzi's Storm of Radiance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Jailarzi's Storm of Radiance
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Jump

- itemType: spell
- nameCn: needs-human-check
- nameEn: Jump
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Knock

- itemType: spell
- nameCn: needs-human-check
- nameEn: Knock
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Legend Lore

- itemType: spell
- nameCn: needs-human-check
- nameEn: Legend Lore
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Leomund's Secret Chest

- itemType: spell
- nameCn: needs-human-check
- nameEn: Leomund's Secret Chest
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Leomund's Tiny Hut

- itemType: spell
- nameCn: needs-human-check
- nameEn: Leomund's Tiny Hut
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Lesser Restoration

- itemType: spell
- nameCn: needs-human-check
- nameEn: Lesser Restoration
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Levitate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Levitate
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Light

- itemType: spell
- nameCn: needs-human-check
- nameEn: Light
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Lightning Arrows

- itemType: spell
- nameCn: needs-human-check
- nameEn: Lightning Arrows
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Lightning Bolt

- itemType: spell
- nameCn: needs-human-check
- nameEn: Lightning Bolt
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Locate Animals or Plants

- itemType: spell
- nameCn: needs-human-check
- nameEn: Locate Animals or Plants
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Locate Creature

- itemType: spell
- nameCn: needs-human-check
- nameEn: Locate Creature
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Locate Object

- itemType: spell
- nameCn: needs-human-check
- nameEn: Locate Object
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Longstrider

- itemType: spell
- nameCn: needs-human-check
- nameEn: Longstrider
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mage Armor

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mage Armor
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mage Hand

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mage Hand
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Circle

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Circle
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Jar

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Jar
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Missile

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Missile
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Mouth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Mouth
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Weapon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Weapon
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Major Image

- itemType: spell
- nameCn: needs-human-check
- nameEn: Major Image
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mass Cure Wounds

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mass Cure Wounds
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mass Heal

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mass Heal
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mass Healing Word

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mass Healing Word
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mass Suggestion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mass Suggestion
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Maze

- itemType: spell
- nameCn: needs-human-check
- nameEn: Maze
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Meld Into Stone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Meld Into Stone
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Melf's Acid Arrow

- itemType: spell
- nameCn: needs-human-check
- nameEn: Melf's Acid Arrow
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mending

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mending
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Message

- itemType: spell
- nameCn: needs-human-check
- nameEn: Message
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Meteor Swarm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Meteor Swarm
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mind Blank

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mind Blank
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mind Sliver

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mind Sliver
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mind Spike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mind Spike
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Minor Illusion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Minor Illusion
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mirage Arcane

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mirage Arcane
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mirror Image

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mirror Image
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mislead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mislead
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Misty Step

- itemType: spell
- nameCn: needs-human-check
- nameEn: Misty Step
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Modify Memory

- itemType: spell
- nameCn: needs-human-check
- nameEn: Modify Memory
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Moonbeam

- itemType: spell
- nameCn: needs-human-check
- nameEn: Moonbeam
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mordenkainen's Faithful Hound

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mordenkainen's Faithful Hound
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mordenkainen's Magnificent Mansion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mordenkainen's Magnificent Mansion
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mordenkainen's Private Sanctum

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mordenkainen's Private Sanctum
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mordenkainen's Sword

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mordenkainen's Sword
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Move Earth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Move Earth
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Nondetection

- itemType: spell
- nameCn: needs-human-check
- nameEn: Nondetection
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Nystul's Magic Aura

- itemType: spell
- nameCn: needs-human-check
- nameEn: Nystul's Magic Aura
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Otiluke's Freezing Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Otiluke's Freezing Sphere
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Otiluke's Resilient Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Otiluke's Resilient Sphere
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Otto's Irresistible Dance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Otto's Irresistible Dance
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Pass without Trace

- itemType: spell
- nameCn: needs-human-check
- nameEn: Pass without Trace
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Passwall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Passwall
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Phantasmal Force

- itemType: spell
- nameCn: needs-human-check
- nameEn: Phantasmal Force
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Phantasmal Killer

- itemType: spell
- nameCn: needs-human-check
- nameEn: Phantasmal Killer
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Phantom Steed

- itemType: spell
- nameCn: needs-human-check
- nameEn: Phantom Steed
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Planar Ally

- itemType: spell
- nameCn: needs-human-check
- nameEn: Planar Ally
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Planar Binding

- itemType: spell
- nameCn: needs-human-check
- nameEn: Planar Binding
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Plane Shift

- itemType: spell
- nameCn: needs-human-check
- nameEn: Plane Shift
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Plant Growth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Plant Growth
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Poison Spray

- itemType: spell
- nameCn: needs-human-check
- nameEn: Poison Spray
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Polymorph

- itemType: spell
- nameCn: needs-human-check
- nameEn: Polymorph
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Power Word Fortify

- itemType: spell
- nameCn: needs-human-check
- nameEn: Power Word Fortify
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Power Word Heal

- itemType: spell
- nameCn: needs-human-check
- nameEn: Power Word Heal
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Power Word Kill

- itemType: spell
- nameCn: needs-human-check
- nameEn: Power Word Kill
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Power Word Stun

- itemType: spell
- nameCn: needs-human-check
- nameEn: Power Word Stun
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Prayer of Healing

- itemType: spell
- nameCn: needs-human-check
- nameEn: Prayer of Healing
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Prestidigitation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Prestidigitation
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Prismatic Spray

- itemType: spell
- nameCn: needs-human-check
- nameEn: Prismatic Spray
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Prismatic Wall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Prismatic Wall
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Produce Flame

- itemType: spell
- nameCn: needs-human-check
- nameEn: Produce Flame
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Programmed Illusion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Programmed Illusion
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Project Image

- itemType: spell
- nameCn: needs-human-check
- nameEn: Project Image
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Protection from Energy

- itemType: spell
- nameCn: needs-human-check
- nameEn: Protection from Energy
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Protection from Evil and Good

- itemType: spell
- nameCn: needs-human-check
- nameEn: Protection from Evil and Good
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Protection from Poison

- itemType: spell
- nameCn: needs-human-check
- nameEn: Protection from Poison
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Purify Food and Drink

- itemType: spell
- nameCn: needs-human-check
- nameEn: Purify Food and Drink
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Raise Dead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Raise Dead
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Rary's Telepathic Bond

- itemType: spell
- nameCn: needs-human-check
- nameEn: Rary's Telepathic Bond
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ray of Enfeeblement

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ray of Enfeeblement
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ray of Frost

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ray of Frost
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ray of Sickness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ray of Sickness
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Regenerate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Regenerate
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Reincarnate

- itemType: spell
- nameCn: needs-human-check
- nameEn: Reincarnate
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Remove Curse

- itemType: spell
- nameCn: needs-human-check
- nameEn: Remove Curse
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Resistance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Resistance
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Resurrection

- itemType: spell
- nameCn: needs-human-check
- nameEn: Resurrection
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Reverse Gravity

- itemType: spell
- nameCn: needs-human-check
- nameEn: Reverse Gravity
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Revivify

- itemType: spell
- nameCn: needs-human-check
- nameEn: Revivify
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Rope Trick

- itemType: spell
- nameCn: needs-human-check
- nameEn: Rope Trick
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sacred Flame

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sacred Flame
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sanctuary

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sanctuary
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Scorching Ray

- itemType: spell
- nameCn: needs-human-check
- nameEn: Scorching Ray
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Scrying

- itemType: spell
- nameCn: needs-human-check
- nameEn: Scrying
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Searing Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Searing Smite
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: See Invisibility

- itemType: spell
- nameCn: needs-human-check
- nameEn: See Invisibility
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Seeming

- itemType: spell
- nameCn: needs-human-check
- nameEn: Seeming
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sending

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sending
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sequester

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sequester
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shapechange

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shapechange
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shatter

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shatter
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shield

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shield
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shield of Faith

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shield of Faith
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shillelagh

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shillelagh
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shining Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shining Smite
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shocking Grasp

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shocking Grasp
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Silence

- itemType: spell
- nameCn: needs-human-check
- nameEn: Silence
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Silent Image

- itemType: spell
- nameCn: needs-human-check
- nameEn: Silent Image
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Simulacrum

- itemType: spell
- nameCn: needs-human-check
- nameEn: Simulacrum
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sleep

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sleep
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sleet Storm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sleet Storm
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Slow

- itemType: spell
- nameCn: needs-human-check
- nameEn: Slow
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sorcerous Burst

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sorcerous Burst
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spare the Dying

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spare the Dying
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Speak with Animals

- itemType: spell
- nameCn: needs-human-check
- nameEn: Speak with Animals
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Speak with Dead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Speak with Dead
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Speak with Plants

- itemType: spell
- nameCn: needs-human-check
- nameEn: Speak with Plants
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spider Climb

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spider Climb
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spike Growth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spike Growth
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spirit Guardians

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spirit Guardians
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spiritual Weapon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spiritual Weapon
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Staggering Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Staggering Smite
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Starry Wisp

- itemType: spell
- nameCn: needs-human-check
- nameEn: Starry Wisp
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Steel Wind Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Steel Wind Strike
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Stinking Cloud

- itemType: spell
- nameCn: needs-human-check
- nameEn: Stinking Cloud
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Stone Shape

- itemType: spell
- nameCn: needs-human-check
- nameEn: Stone Shape
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Stoneskin

- itemType: spell
- nameCn: needs-human-check
- nameEn: Stoneskin
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Storm of Vengeance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Storm of Vengeance
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Suggestion

- itemType: spell
- nameCn: needs-human-check
- nameEn: Suggestion
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Aberration

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Aberration
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Beast

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Beast
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Celestial

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Celestial
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Construct

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Construct
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Dragon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Dragon
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Elemental

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Elemental
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Fey

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Fey
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Fiend

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Fiend
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Undead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Undead
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sunbeam

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sunbeam
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sunburst

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sunburst
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Swift Quiver

- itemType: spell
- nameCn: needs-human-check
- nameEn: Swift Quiver
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Symbol

- itemType: spell
- nameCn: needs-human-check
- nameEn: Symbol
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Synaptic Static

- itemType: spell
- nameCn: needs-human-check
- nameEn: Synaptic Static
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tasha's Bubbling Cauldron

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tasha's Bubbling Cauldron
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tasha's Hideous Laughter

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tasha's Hideous Laughter
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Telekinesis

- itemType: spell
- nameCn: needs-human-check
- nameEn: Telekinesis
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Telepathy

- itemType: spell
- nameCn: needs-human-check
- nameEn: Telepathy
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Teleport

- itemType: spell
- nameCn: needs-human-check
- nameEn: Teleport
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 7环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Teleportation Circle

- itemType: spell
- nameCn: needs-human-check
- nameEn: Teleportation Circle
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tenser's Floating Disk

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tenser's Floating Disk
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thaumaturgy

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thaumaturgy
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thorn Whip

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thorn Whip
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thunderclap

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thunderclap
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thunderous Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thunderous Smite
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thunderwave

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thunderwave
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Time Stop

- itemType: spell
- nameCn: needs-human-check
- nameEn: Time Stop
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Toll the Dead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Toll the Dead
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tongues

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tongues
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Transport via Plants

- itemType: spell
- nameCn: needs-human-check
- nameEn: Transport via Plants
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tree Stride

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tree Stride
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: True Polymorph

- itemType: spell
- nameCn: needs-human-check
- nameEn: True Polymorph
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: True Resurrection

- itemType: spell
- nameCn: needs-human-check
- nameEn: True Resurrection
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: True Seeing

- itemType: spell
- nameCn: needs-human-check
- nameEn: True Seeing
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: True Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: True Strike
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tsunami

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tsunami
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 8环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Unseen Servant

- itemType: spell
- nameCn: needs-human-check
- nameEn: Unseen Servant
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Vampiric Touch

- itemType: spell
- nameCn: needs-human-check
- nameEn: Vampiric Touch
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Vicious Mockery

- itemType: spell
- nameCn: needs-human-check
- nameEn: Vicious Mockery
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Vitriolic Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Vitriolic Sphere
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Fire

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Fire
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 4环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Force

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Force
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Ice

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Ice
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Stone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Stone
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Thorns

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Thorns
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Warding Bond

- itemType: spell
- nameCn: needs-human-check
- nameEn: Warding Bond
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Water Breathing

- itemType: spell
- nameCn: needs-human-check
- nameEn: Water Breathing
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Water Walk

- itemType: spell
- nameCn: needs-human-check
- nameEn: Water Walk
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Web

- itemType: spell
- nameCn: needs-human-check
- nameEn: Web
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Weird

- itemType: spell
- nameCn: needs-human-check
- nameEn: Weird
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wind Walk

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wind Walk
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wind Wall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wind Wall
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 3环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wish

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wish
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 9环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Witch Bolt

- itemType: spell
- nameCn: needs-human-check
- nameEn: Witch Bolt
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Word of Radiance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Word of Radiance
- level: 0环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 0环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Word of Recall

- itemType: spell
- nameCn: needs-human-check
- nameEn: Word of Recall
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 6环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wrathful Smite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wrathful Smite
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 1环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Yolande's Regal Presence

- itemType: spell
- nameCn: needs-human-check
- nameEn: Yolande's Regal Presence
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 5环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Zone of Truth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Zone of Truth
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/法术详述
- sourceFile: 2环.htm
- scope: dnd2024
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: Spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Blade of Disaster

- itemType: spell
- nameCn: needs-human-check
- nameEn: Blade of Disaster
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 9环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Booming Blade

- itemType: spell
- nameCn: needs-human-check
- nameEn: Booming Blade
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 戏法.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dream of the Blue Veil

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dream of the Blue Veil
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 7环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Green-Flame Blade

- itemType: spell
- nameCn: needs-human-check
- nameEn: Green-Flame Blade
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 戏法.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Intellect Fortress

- itemType: spell
- nameCn: needs-human-check
- nameEn: Intellect Fortress
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 3环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Lightning Lure

- itemType: spell
- nameCn: needs-human-check
- nameEn: Lightning Lure
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 戏法.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mind Sliver

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mind Sliver
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 戏法.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Spirit Shroud

- itemType: spell
- nameCn: needs-human-check
- nameEn: Spirit Shroud
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 3环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Aberration

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Aberration
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 4环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Beast

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Beast
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 2环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Celestial

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Celestial
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 5环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Construct

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Construct
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 4环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Elemental

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Elemental
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 4环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Fey

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Fey
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 3环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Fiend

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Fiend
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 6环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Shadowspawn

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Shadowspawn
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 3环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Undead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Undead
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 3环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sword Burst

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sword Burst
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 戏法.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tasha's Caustic Brew

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tasha's Caustic Brew
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 1环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tasha's Mind Whip

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tasha's Mind Whip
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 2环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tasha's Otherworldly Guise

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tasha's Otherworldly Guise
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/法术/法术详述
- sourceFile: 6环.html
- scope: tcoe
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: TCoE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Abi-Dalzim's Horrid Wilting

- itemType: spell
- nameCn: needs-human-check
- nameEn: Abi-Dalzim's Horrid Wilting
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 8环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Absorb Elements

- itemType: spell
- nameCn: needs-human-check
- nameEn: Absorb Elements
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Aganazzar's Scorcher

- itemType: spell
- nameCn: needs-human-check
- nameEn: Aganazzar's Scorcher
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Beast Bond

- itemType: spell
- nameCn: needs-human-check
- nameEn: Beast Bond
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Bones of the Earth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Bones of the Earth
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Catapult

- itemType: spell
- nameCn: needs-human-check
- nameEn: Catapult
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Catnap

- itemType: spell
- nameCn: needs-human-check
- nameEn: Catnap
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Cause Fear

- itemType: spell
- nameCn: needs-human-check
- nameEn: Cause Fear
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ceremony

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ceremony
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Chaos Bolt

- itemType: spell
- nameCn: needs-human-check
- nameEn: Chaos Bolt
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Charm Monster

- itemType: spell
- nameCn: needs-human-check
- nameEn: Charm Monster
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Control Flames

- itemType: spell
- nameCn: needs-human-check
- nameEn: Control Flames
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Control Wind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Control Wind
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Create Bonfire

- itemType: spell
- nameCn: needs-human-check
- nameEn: Create Bonfire
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Create Homunculus

- itemType: spell
- nameCn: needs-human-check
- nameEn: Create Homunculus
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Crown of Stars

- itemType: spell
- nameCn: needs-human-check
- nameEn: Crown of Stars
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 7环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Danse Macabre

- itemType: spell
- nameCn: needs-human-check
- nameEn: Danse Macabre
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dawn

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dawn
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dragon's Breath

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dragon's Breath
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Druid Grove

- itemType: spell
- nameCn: needs-human-check
- nameEn: Druid Grove
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Dust Devil

- itemType: spell
- nameCn: needs-human-check
- nameEn: Dust Devil
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Earth Tremor

- itemType: spell
- nameCn: needs-human-check
- nameEn: Earth Tremor
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Earthbind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Earthbind
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Elemental Bane

- itemType: spell
- nameCn: needs-human-check
- nameEn: Elemental Bane
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Enemies Abound

- itemType: spell
- nameCn: needs-human-check
- nameEn: Enemies Abound
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Enervation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Enervation
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Erupting Earth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Erupting Earth
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Far Step

- itemType: spell
- nameCn: needs-human-check
- nameEn: Far Step
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Find Greater Steed

- itemType: spell
- nameCn: needs-human-check
- nameEn: Find Greater Steed
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Flame Arrows

- itemType: spell
- nameCn: needs-human-check
- nameEn: Flame Arrows
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Frostbite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Frostbite
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Guardian of Nature

- itemType: spell
- nameCn: needs-human-check
- nameEn: Guardian of Nature
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Gust

- itemType: spell
- nameCn: needs-human-check
- nameEn: Gust
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Healing Spirit

- itemType: spell
- nameCn: needs-human-check
- nameEn: Healing Spirit
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Holy Weapon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Holy Weapon
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Ice Knife

- itemType: spell
- nameCn: needs-human-check
- nameEn: Ice Knife
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Illusory Dragon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Illusory Dragon
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 8环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Immolation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Immolation
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Infernal Calling

- itemType: spell
- nameCn: needs-human-check
- nameEn: Infernal Calling
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Infestation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Infestation
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Investiture of Flame

- itemType: spell
- nameCn: needs-human-check
- nameEn: Investiture of Flame
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Investiture of Ice

- itemType: spell
- nameCn: needs-human-check
- nameEn: Investiture of Ice
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Investiture of Stone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Investiture of Stone
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Investiture of Wind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Investiture of Wind
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Invulnerability

- itemType: spell
- nameCn: needs-human-check
- nameEn: Invulnerability
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 9环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Life Transference

- itemType: spell
- nameCn: needs-human-check
- nameEn: Life Transference
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Maddening Darkness

- itemType: spell
- nameCn: needs-human-check
- nameEn: Maddening Darkness
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 8环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Maelstrom

- itemType: spell
- nameCn: needs-human-check
- nameEn: Maelstrom
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Magic Stone

- itemType: spell
- nameCn: needs-human-check
- nameEn: Magic Stone
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mass Polymorph

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mass Polymorph
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 9环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Maximilian's Earthen Grasp

- itemType: spell
- nameCn: needs-human-check
- nameEn: Maximilian's Earthen Grasp
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Melf's Minute Meteors

- itemType: spell
- nameCn: needs-human-check
- nameEn: Melf's Minute Meteors
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mental Prison

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mental Prison
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mighty Fortress

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mighty Fortress
- level: 8环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 8环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mind Spike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mind Spike
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Mold Earth

- itemType: spell
- nameCn: needs-human-check
- nameEn: Mold Earth
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Negative Energy Flood

- itemType: spell
- nameCn: needs-human-check
- nameEn: Negative Energy Flood
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Power Word Pain

- itemType: spell
- nameCn: needs-human-check
- nameEn: Power Word Pain
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 7环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Primal Savagery

- itemType: spell
- nameCn: needs-human-check
- nameEn: Primal Savagery
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Primordial Ward

- itemType: spell
- nameCn: needs-human-check
- nameEn: Primordial Ward
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Psychic Scream

- itemType: spell
- nameCn: needs-human-check
- nameEn: Psychic Scream
- level: 9环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 9环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Pyrotechnics

- itemType: spell
- nameCn: needs-human-check
- nameEn: Pyrotechnics
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Scatter

- itemType: spell
- nameCn: needs-human-check
- nameEn: Scatter
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shadow Blade

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shadow Blade
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shadow of Moil

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shadow of Moil
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Shape Water

- itemType: spell
- nameCn: needs-human-check
- nameEn: Shape Water
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Sickening Radiance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Sickening Radiance
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Skill Empowerment

- itemType: spell
- nameCn: needs-human-check
- nameEn: Skill Empowerment
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Skywrite

- itemType: spell
- nameCn: needs-human-check
- nameEn: Skywrite
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Snare

- itemType: spell
- nameCn: needs-human-check
- nameEn: Snare
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Snilloc's Snowball Swarm

- itemType: spell
- nameCn: needs-human-check
- nameEn: Snilloc's Snowball Swarm
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Soul Cage

- itemType: spell
- nameCn: needs-human-check
- nameEn: Soul Cage
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Steel Wind Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Steel Wind Strike
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Storm Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Storm Sphere
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Greater Demon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Greater Demon
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Summon Lesser Demon

- itemType: spell
- nameCn: needs-human-check
- nameEn: Summon Lesser Demon
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Synaptic Static

- itemType: spell
- nameCn: needs-human-check
- nameEn: Synaptic Static
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Temple of the Gods

- itemType: spell
- nameCn: needs-human-check
- nameEn: Temple of the Gods
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 7环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tenser's Transformation

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tenser's Transformation
- level: 6环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 6环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thunder Step

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thunder Step
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Thunderclap

- itemType: spell
- nameCn: needs-human-check
- nameEn: Thunderclap
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tidal Wave

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tidal Wave
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Tiny Servant

- itemType: spell
- nameCn: needs-human-check
- nameEn: Tiny Servant
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Toll the Dead

- itemType: spell
- nameCn: needs-human-check
- nameEn: Toll the Dead
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Transmute Rock

- itemType: spell
- nameCn: needs-human-check
- nameEn: Transmute Rock
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Vitriolic Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Vitriolic Sphere
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Light

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Light
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Sand

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Sand
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wall of Water

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wall of Water
- level: 3环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 3环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Warding Wind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Warding Wind
- level: 2环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 2环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Watery Sphere

- itemType: spell
- nameCn: needs-human-check
- nameEn: Watery Sphere
- level: 4环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 4环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Whirlwind

- itemType: spell
- nameCn: needs-human-check
- nameEn: Whirlwind
- level: 7环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 7环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Word of Radiance

- itemType: spell
- nameCn: needs-human-check
- nameEn: Word of Radiance
- level: 戏法
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 戏法.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Wrath of Nature

- itemType: spell
- nameCn: needs-human-check
- nameEn: Wrath of Nature
- level: 5环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 5环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: Zephyr Strike

- itemType: spell
- nameCn: needs-human-check
- nameEn: Zephyr Strike
- level: 1环
- school: needs-human-check
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/法术/法术详述
- sourceFile: 1环.html
- scope: xgte
- extractionStatus: found
- hasEffectTextInSource: yes
- effectExtractionPolicy: structured-fields-or-private-import
- contentPolicy: do-not-copy-long-rules-text
- futureRuntimeUse: spell-effect-reference
- notes: XGtE spell heading id found. Chinese name, school, and effect text require later checked extraction; rules text is not copied.

### Item: 大地结社

- itemType: subclass
- nameCn: 大地结社
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/德鲁伊
- sourceFile: 大地结社.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 德鲁伊.

### Item: 盗贼

- itemType: subclass
- nameCn: 盗贼
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/游荡者
- sourceFile: 盗贼.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 游荡者.

### Item: 奉献之誓

- itemType: subclass
- nameCn: 奉献之誓
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/圣武士
- sourceFile: 奉献之誓.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 圣武士.

### Item: 狂战士道途

- itemType: subclass
- nameCn: 狂战士道途
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/野蛮人
- sourceFile: 狂战士道途.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 野蛮人.

### Item: 猎人

- itemType: subclass
- nameCn: 猎人
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/游侠
- sourceFile: 猎人.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 游侠.

### Item: 龙族术法

- itemType: subclass
- nameCn: 龙族术法
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/术士
- sourceFile: 龙族术法.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 术士.

### Item: 散打武者

- itemType: subclass
- nameCn: 散打武者
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/武僧
- sourceFile: 散打武者.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 武僧.

### Item: 生命领域

- itemType: subclass
- nameCn: 生命领域
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/牧师
- sourceFile: 生命领域.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 牧师.

### Item: 塑能师

- itemType: subclass
- nameCn: 塑能师
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/法师
- sourceFile: 塑能师.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 法师.

### Item: 邪魔宗主

- itemType: subclass
- nameCn: 邪魔宗主
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/魔契师
- sourceFile: 邪魔宗主.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 魔契师.

### Item: 逸闻学院

- itemType: subclass
- nameCn: 逸闻学院
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/吟游诗人
- sourceFile: 逸闻学院.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 吟游诗人.

### Item: 勇士

- itemType: subclass
- nameCn: 勇士
- nameEn: unknown
- sourceId: dnd5echm-srd52-primary
- sourceRepo: DND5eChm/SRD5.2Chm
- sourcePath: 玩家手册2024/角色职业/战士
- sourceFile: 勇士.htm
- scope: dnd2024
- extractionStatus: found
- notes: Subclass page found under class 战士.

### Item: 孢子结社

- itemType: subclass
- nameCn: 孢子结社
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）
- sourceFile: 孢子结社.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 德鲁伊（TCE）.

### Item: 创造学院

- itemType: subclass
- nameCn: 创造学院
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/吟游诗人（TCE）
- sourceFile: 创造学院.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 吟游诗人（TCE）.

### Item: 符文骑士

- itemType: subclass
- nameCn: 符文骑士
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/战士（TCE）
- sourceFile: 符文骑士.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 战士（TCE）.

### Item: 鬼魅

- itemType: subclass
- nameCn: 鬼魅
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/游荡者（TCE）
- sourceFile: 鬼魅.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 游荡者（TCE）.

### Item: 和平领域

- itemType: subclass
- nameCn: 和平领域
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/牧师（TCE）
- sourceFile: 和平领域.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 牧师（TCE）.

### Item: 魂刃

- itemType: subclass
- nameCn: 魂刃
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/游荡者（TCE）
- sourceFile: 魂刃.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 游荡者（TCE）.

### Item: 畸变心智

- itemType: subclass
- nameCn: 畸变心智
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/术士（TCE）
- sourceFile: 畸变心智.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 术士（TCE）.

### Item: 集群牧者

- itemType: subclass
- nameCn: 集群牧者
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/游侠（TCE）
- sourceFile: 集群牧者.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 游侠（TCE）.

### Item: 剑咏

- itemType: subclass
- nameCn: 剑咏
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/法师（TCE）
- sourceFile: 剑咏.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 法师（TCE）.

### Item: 巨灵宗主

- itemType: subclass
- nameCn: 巨灵宗主
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/邪术师（TCE）
- sourceFile: 巨灵宗主.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 邪术师（TCE）.

### Item: 狂野魔法道途

- itemType: subclass
- nameCn: 狂野魔法道途
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/野蛮人（TCE）
- sourceFile: 狂野魔法道途.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 野蛮人（TCE）.

### Item: 炼金师

- itemType: subclass
- nameCn: 炼金师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 炼金师.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 奇械师.

### Item: 灵能武士

- itemType: subclass
- nameCn: 灵能武士
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/战士（TCE）
- sourceFile: 灵能武士.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 战士（TCE）.

### Item: 命流宗

- itemType: subclass
- nameCn: 命流宗
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/武僧（TCE）
- sourceFile: 命流宗.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 武僧（TCE）.

### Item: 魔炮师

- itemType: subclass
- nameCn: 魔炮师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 魔炮师.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 奇械师.

### Item: 暮光领域

- itemType: subclass
- nameCn: 暮光领域
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/牧师（TCE）
- sourceFile: 暮光领域.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 牧师（TCE）.

### Item: 荣耀之誓

- itemType: subclass
- nameCn: 荣耀之誓
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/圣武士（TCE）
- sourceFile: 荣耀之誓.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 圣武士（TCE）.

### Item: 深海意志

- itemType: subclass
- nameCn: 深海意志
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/邪术师（TCE）
- sourceFile: 深海意志.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 邪术师（TCE）.

### Item: 时械之魂

- itemType: subclass
- nameCn: 时械之魂
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/术士（TCE）
- sourceFile: 时械之魂.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 术士（TCE）.

### Item: 守望之誓

- itemType: subclass
- nameCn: 守望之誓
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/圣武士（TCE）
- sourceFile: 守望之誓.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 圣武士（TCE）.

### Item: 书士会

- itemType: subclass
- nameCn: 书士会
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/法师（TCE）
- sourceFile: 书士会.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 法师（TCE）.

### Item: 星辰结社

- itemType: subclass
- nameCn: 星辰结社
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）
- sourceFile: 星辰结社.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 德鲁伊（TCE）.

### Item: 星我宗

- itemType: subclass
- nameCn: 星我宗
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/武僧（TCE）
- sourceFile: 星我宗.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 武僧（TCE）.

### Item: 雄辩学院

- itemType: subclass
- nameCn: 雄辩学院
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/吟游诗人（TCE）
- sourceFile: 雄辩学院.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 吟游诗人（TCE）.

### Item: 妖精漫游者

- itemType: subclass
- nameCn: 妖精漫游者
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/游侠（TCE）
- sourceFile: 妖精漫游者.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 游侠（TCE）.

### Item: 野火结社

- itemType: subclass
- nameCn: 野火结社
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/德鲁伊（TCE）
- sourceFile: 野火结社.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 德鲁伊（TCE）.

### Item: 野兽道途

- itemType: subclass
- nameCn: 野兽道途
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/野蛮人（TCE）
- sourceFile: 野兽道途.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 野蛮人（TCE）.

### Item: 战地匠师

- itemType: subclass
- nameCn: 战地匠师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 战地匠师.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 奇械师.

### Item: 秩序领域

- itemType: subclass
- nameCn: 秩序领域
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/牧师（TCE）
- sourceFile: 秩序领域.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 牧师（TCE）.

### Item: 装甲师

- itemType: subclass
- nameCn: 装甲师
- nameEn: unknown
- sourceId: dnd5echm-tcoe
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 塔莎的万事坩埚/玩家选项/职业/奇械师
- sourceFile: 装甲师.html
- scope: tcoe
- extractionStatus: found
- notes: TCoE subclass page found under class 奇械师.

### Item: 边界行者

- itemType: subclass
- nameCn: 边界行者
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游侠
- sourceFile: 边界行者.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游侠.

### Item: 策士

- itemType: subclass
- nameCn: 策士
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游荡者
- sourceFile: 策士.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游荡者.

### Item: 斥候

- itemType: subclass
- nameCn: 斥候
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游荡者
- sourceFile: 斥候.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游荡者.

### Item: 低语学院

- itemType: subclass
- nameCn: 低语学院
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/吟游诗人
- sourceFile: 低语学院.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 吟游诗人.

### Item: 调查员

- itemType: subclass
- nameCn: 调查员
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游荡者
- sourceFile: 调查员.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游荡者.

### Item: 锻造领域

- itemType: subclass
- nameCn: 锻造领域
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/牧师
- sourceFile: 锻造领域.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 牧师.

### Item: 坟墓领域

- itemType: subclass
- nameCn: 坟墓领域
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/牧师
- sourceFile: 坟墓领域.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 牧师.

### Item: 风暴术法

- itemType: subclass
- nameCn: 风暴术法
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/术士
- sourceFile: 风暴术法.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 术士.

### Item: 风暴先驱道途

- itemType: subclass
- nameCn: 风暴先驱道途
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/野蛮人
- sourceFile: 风暴先驱道途.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 野蛮人.

### Item: 风流剑客

- itemType: subclass
- nameCn: 风流剑客
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游荡者
- sourceFile: 风流剑客.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游荡者.

### Item: 怪物杀手

- itemType: subclass
- nameCn: 怪物杀手
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游侠
- sourceFile: 怪物杀手.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游侠.

### Item: 剑圣宗

- itemType: subclass
- nameCn: 剑圣宗
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/武僧
- sourceFile: 剑圣宗.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 武僧.

### Item: 剑舞学院

- itemType: subclass
- nameCn: 剑舞学院
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/吟游诗人
- sourceFile: 剑舞学院.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 吟游诗人.

### Item: 救赎之誓

- itemType: subclass
- nameCn: 救赎之誓
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/圣武士
- sourceFile: 救赎之誓.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 圣武士.

### Item: 狂热者道途

- itemType: subclass
- nameCn: 狂热者道途
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/野蛮人
- sourceFile: 狂热者道途.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 野蛮人.

### Item: 梦境结社

- itemType: subclass
- nameCn: 梦境结社
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/德鲁伊
- sourceFile: 梦境结社.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 德鲁伊.

### Item: 迷惑学院

- itemType: subclass
- nameCn: 迷惑学院
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/吟游诗人
- sourceFile: 迷惑学院.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 吟游诗人.

### Item: 魔射手

- itemType: subclass
- nameCn: 魔射手
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/战士
- sourceFile: 魔射手.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 战士.

### Item: 牧人结社

- itemType: subclass
- nameCn: 牧人结社
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/德鲁伊
- sourceFile: 牧人结社.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 德鲁伊.

### Item: 骑兵

- itemType: subclass
- nameCn: 骑兵
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/战士
- sourceFile: 骑兵.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 战士.

### Item: 日魂宗

- itemType: subclass
- nameCn: 日魂宗
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/武僧
- sourceFile: 日魂宗.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 武僧.

### Item: 神圣之魂

- itemType: subclass
- nameCn: 神圣之魂
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/术士
- sourceFile: 神圣之魂.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 术士.

### Item: 天界

- itemType: subclass
- nameCn: 天界
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/邪术师
- sourceFile: 天界.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 邪术师.

### Item: 武士

- itemType: subclass
- nameCn: 武士
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/战士
- sourceFile: 武士.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 战士.

### Item: 先祖守卫道途

- itemType: subclass
- nameCn: 先祖守卫道途
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/野蛮人
- sourceFile: 先祖守卫道途.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 野蛮人.

### Item: 幽影魔法

- itemType: subclass
- nameCn: 幽影魔法
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/术士
- sourceFile: 幽影魔法.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 术士.

### Item: 幽域追踪者

- itemType: subclass
- nameCn: 幽域追踪者
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/游侠
- sourceFile: 幽域追踪者.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 游侠.

### Item: 战争魔法

- itemType: subclass
- nameCn: 战争魔法
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/法师
- sourceFile: 战争魔法.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 法师.

### Item: 征服之誓

- itemType: subclass
- nameCn: 征服之誓
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/圣武士
- sourceFile: 征服之誓.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 圣武士.

### Item: 咒剑

- itemType: subclass
- nameCn: 咒剑
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/邪术师
- sourceFile: 咒剑.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 邪术师.

### Item: 醉拳宗

- itemType: subclass
- nameCn: 醉拳宗
- nameEn: unknown
- sourceId: dnd5echm-xgte
- sourceRepo: DND5eChm/DND5e_chm
- sourcePath: 珊娜萨的万事指南/角色选项/武僧
- sourceFile: 醉拳宗.html
- scope: xgte
- extractionStatus: found
- notes: XGtE subclass page found under class 武僧.

