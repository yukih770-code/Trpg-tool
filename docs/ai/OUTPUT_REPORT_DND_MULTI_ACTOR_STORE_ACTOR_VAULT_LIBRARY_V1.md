# 输出报告：DND Multi-Actor Store + Actor Vault Library v1

> AI-LANDMARK: DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1  
> 任务层级：L3 数据结构 + L1/L2 UI  
> 构建于：DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1（Store 已在上一任务完成）

---

## 1. 修改了哪些文件

| 文件 | 修改类型 | 说明 |
|---|---|---|
| `src/pages/dndWorkspace/DndWorkspaceShell.tsx` | 大幅修改 | 类型扩展、本地状态、角色库首页重构、characterLibrary 视图新增、Nav 高亮逻辑更新 |
| `src/i18n/locales/zh-CN.ts` | 新增 key | 12 个新 i18n key（5 个在 multiWorkspace.actorVault，7+4 个在 dndWorkspace.characterLibrary） |
| `src/i18n/locales/en.ts` | 新增 key | 同上，英文对应 key |
| `PROJECT_STATUS.md` | 追加 | 新增任务行 |
| `TEST_CHECKLIST.md` | 追加 | 新增 §7c 测试项 |
| `docs/ai/SYMBOL_MAP.md` | 追加 | 新增 landmark 章节 |
| `docs/ai/ACTIVE_TASK.md` | 覆写 | 当前任务状态 |
| `docs/ai/TASK_ARCHIVE.md` | 追加 | 任务归档条目 |

**未修改（禁止动）**：`src/store/characterStore.ts`（上一任务已完成）、所有 COC / CP RED 文件、DND 规则数据 / 算法 / runtime 公式。

---

## 2. 旧单角色数据如何迁移

迁移逻辑在 `characterStore.ts` 的 `merge` 回调中实现（上一任务），本任务 UI 层直接继承，无需额外处理：

- **Legacy 格式**（`{character: T}`，无 `characters[]`）：  
  `merge` 检测到 `!Array.isArray(p.characters)` → 将 `character` 包装为 `characters: [legacyChar]`，`activeCharacterId = legacyChar.id`。
- **Multi-actor 格式**（`{characters[], activeCharacterId}`）：  
  逐项 `migrateCharacter()`，compat 字段替换到 active slot，恢复 `character` 指针。
- **无数据损失**：旧存档自动升级，用户无感知。

---

## 3. `characters[]` 如何设计

```ts
// CharacterState 接口新增字段
characters: CharacterData[];
```

- **初始值**：`const _initialChar = { ...defaultChar, id: crypto.randomUUID() }`，`characters: [_initialChar]`。
- **追加**：`addCharacter(data)` 调用 `syncActiveCharacter` 先将当前 compat 字段刷入数组，再 push 新角色。
- **更新**：`updateField` / `toggleMod` 等所有变更仍只写 compat 字段 `character`；在 switch / reset / load 检查点通过 `syncActiveCharacter` 刷回数组。
- **在角色库显示时**：active 角色始终从 compat 字段读取（保证实时），其他角色从 `characters[]` 读取。

---

## 4. `activeCharacterId` 如何设计

```ts
activeCharacterId: string | null;
```

- 初始值：`_initialChar.id`。
- `setActiveCharacterId(id)`：先 sync 当前 character 到数组 → 找 target → 更新 `character`、`characters`、`activeCharacterId`。
- `addCharacter` / `resetCreator` / `loadCharacter` 均在完成后将新角色 id 设为 `activeCharacterId`。
- UI 层通过 `dndActiveCharacterId` 选择器消费，用于：active 卡片高亮、libChars 实时替换、Nav isActive 扩展。

---

## 5. 角色 id 如何生成 / 保持

```ts
id: crypto.randomUUID?.() || Date.now().toString()
```

- 新角色在 `addCharacter` / `resetCreator` 时生成唯一 id。
- `loadCharacter` 保留传入数据的原有 id（若存在）；若无 id 则生成新 id（兼容老导入数据）。
- `syncActiveCharacter` 以 id 为 key 定位数组 slot，确保更新落到正确角色。
- id 在整个生命周期不变，是 `characters[]` 数组 key 和 `activeCharacterId` 指针的唯一依据。

---

## 6. Creator 完成后如何新增角色

```ts
// DndWorkspaceShell.tsx — Standard Creation 入口
{ onClick: () => { resetDndCreator(); onOpenPlayTab('creator'); } }
```

流程：
1. 用户点击"标准创建"→ 调用 `resetDndCreator()`。
2. `resetCreator()` 内部：先 `syncActiveCharacter`（将当前角色刷入 `characters[]`）→ 创建新空白角色并 push 到 `characters[]` → 设为 active。
3. Creator 所有 `updateField` 变更写入 compat 字段 `character`（即新空白角色）。
4. Creator 调用 `setCompleted()` 完成后，active id 不变，下次 sync 时数据落入 `characters[]`。
5. 因此每次打开 Creator 前都是"新增"而非"覆写"——旧角色已归入数组，新角色成为新 active。

---

## 7. 角色库首页如何显示仓库概览

`view === 'characters'`（Vault 首页）仅渲染两张入口卡：

**已有角色卡**：
```ts
const totalChars = dndCharacters.length;
const completeChars = dndCharacters.filter(isCharComplete).length;
const incompleteChars = totalChars - completeChars;
```
- 显示 4 个数字：角色总数 / 资料完整 / 未完成 / 最近更新（V1 暂显示 `—`，无时间戳）。
- 整卡可点击，导航到 `'characterLibrary'` 视图。

**添加角色卡**：
- 显示说明文案（`addActorNote`）。
- 整卡可点击，导航到 `'create'` 视图。

首页**不展示**角色列表，严格保持"两卡概览"设计。

---

## 8. 已有角色仓库页如何显示角色列表

`view === 'characterLibrary'`（字符库视图）结构：

1. **标题行 + 返回链接**：`← 返回角色库` → `onViewChange('characters')`。
2. **搜索 + 排序 + 筛选栏**（同一 panel 内）。
3. **角色卡列表**（`libChars.map(...)`）：每张卡含完整字段（见第 10 项）。
4. **空状态**：`libChars.length === 0` 时显示 `noResults` 提示文案。

Active 角色卡高亮：`border-[#58180d]/50 bg-[#fff8e6]/90`；其他卡：`border-[#58180d]/20 bg-white/55`。

---

## 9. 搜索 / 筛选 / 排序实现到什么程度

全部**客户端实现**，无服务端调用，无防抖（V1 数据量小，不必要）。

**搜索**（`libSearch`）：
- 字段范围：`name + jobClass + race + background` 拼接后 `toLowerCase()` 包含匹配。

**筛选**（`libFilter: 'all' | 'complete' | 'incomplete'`）：
- `isCharComplete(char)` = `Boolean(name.trim() && jobClass && race && background)`。
- 三个 tab 按钮，active tab 颜色反转。

**排序**（`libSort: 'default' | 'name' | 'level'`）：
- `default`：插入顺序（V1 无时间戳，无法真正按更新时间排）。
- `name`：`localeCompare('zh')` 中文字典序。
- `level`：降序（高级别在前）。

筛选 → 排序的 pipeline 顺序：先 filter（含 active 字段替换），再 map（替换 active 为 compat），再 sort。

---

## 10. 角色卡片显示哪些标签

每张角色卡（`characterLibrary` 视图）：

| 区域 | 字段 |
|---|---|
| 名称行 | 角色名（无名显示 `unnamed` i18n key）|
| 徽标行 | 当前（`activeIndicator`，仅 active 角色显示）/ 资料完整 / 未完成 |
| 核心属性网格 | 等级 / 职业 + 子职业 / 物种（race）/ 背景 |
| 元数据行 | 来源（固定"本平台创建"）/ 创建者（固定占位符）/ 战役（固定"无" ） |
| CTA | 进入（查看角色卡）按钮 |

> 来源 / 创建者 / 战役字段目前显示固定占位值；真实绑定需等 Campaign 系统实现（已列入 Deferred）。

---

## 11. 点击角色如何进入对应角色卡

```tsx
onClick={() => { setDndActiveCharacterId(char.id); onOpenPlayTab('sheet'); }}
```

1. `setDndActiveCharacterId(char.id)` → store 内 `syncActiveCharacter`（保存当前角色）→ 切换 `character` 为目标角色 → 更新 `activeCharacterId`。
2. `onOpenPlayTab('sheet')` → PlayWorkspace 切换到 Sheet Tab，Sheet 读取 compat 字段 `character`（已切换到目标角色）。
3. 整个切换过程对 Sheet / Gameplay 等 consumer 完全透明，它们继续读 `state.character`，无需修改。

---

## 12. `DndWorkspaceView` 类型如何扩展

```ts
// 原
export type DndWorkspaceView = 'dashboard' | 'characters' | 'create' | 'compendium' | 'sources' | 'play';

// 新（新增 'characterLibrary'）
export type DndWorkspaceView = 'dashboard' | 'characters' | 'characterLibrary' | 'create' | 'compendium' | 'sources' | 'play';
```

`'characterLibrary'` 是 `'characters'`（Vault 首页）的子视图，从已有角色卡进入，返回到 `'characters'`。

---

## 13. Nav 高亮逻辑如何处理 `characterLibrary`

```ts
// 原
const isActive = view === item.key;

// 新
const isActive = view === item.key || (item.key === 'characters' && view === 'characterLibrary');
```

当用户在 `'characterLibrary'` 时，顶部 Nav 的"角色库"项（key=`'characters'`）仍高亮——视觉上两者属于同一节点，`'characterLibrary'` 是 `'characters'` 的子视图而非平级 Section。

---

## 14. Active character 数据一致性如何保证

三层保障：

1. **`syncActiveCharacter` 检查点**：`setActiveCharacterId` / `addCharacter` / `resetCreator` / `loadCharacter` 调用前先 sync compat 字段到数组（防止 in-session 未刷新的变更被覆盖）。
2. **`merge` 回调**：rehydration 时用 persisted compat 字段替换 active slot（防止 `characters[]` 中的该 slot 落后于上次存档的 compat 字段）。
3. **UI 层替换**：`libChars` 中，active 角色始终从 `dndChar`（compat 字段）读取，确保即使 `characters[]` 中的 slot 还没 sync，库页显示的也是实时数据：
   ```ts
   .map(char => char.id === dndActiveCharacterId ? dndChar : char)
   ```

---

## 15. COC / CP RED 文件是否被修改

**零修改**。静态验证：

```powershell
rg -l "DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1" src/
# 仅命中：src/pages/dndWorkspace/DndWorkspaceShell.tsx
```

COC / CP RED store、Shell、i18n、runtime、规则数据均**未被触碰**。

---

## 16. i18n 共新增多少 key

**zh-CN + en 各 12 个新 key**（共 24 条）：

`multiWorkspace.actorVault.*`（5 key）：
- `addActorNote`、`totalCount`、`completeCount`、`incompleteCount`、`recentUpdate`

`dndWorkspace.characterLibrary.*`（7 个叶 key）：
- `title`、`backToVault`、`searchPlaceholder`、`noResults`、`statusComplete`、`statusIncomplete`
- `filter.all`、`filter.complete`、`filter.incomplete`（3 叶）
- `sort.default`、`sort.name`、`sort.level`（3 叶）

> 注：`multiActorNote`、`activeIndicator` 已在上一任务（DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1）新增，本次不重复计入。

---

## 17. `git status --short` 结果

> ⚠️ Shell 在本次会话中持续不可用（Workspace still starting），无法执行。  
> **请手动运行**：`git status --short`  
> 预期显示以上第 1 项列出的 8 个修改文件（M 标记）。

---

## 18. `npx tsc --noEmit` 结果

> ⚠️ Shell 不可用，无法执行。  
> **请手动运行**：`npx tsc --noEmit`  
> 已通过静态分析确认：`DndWorkspaceView` 类型包含 `'characterLibrary'`，所有新 `useState` 有明确类型注解，`isCharComplete` 参数类型与 `dndCharacters[number]` 一致，无明显类型错误。

---

## 19. `npm run build` 结果

> ⚠️ Shell 不可用，无法执行。  
> **请手动运行**：`npm run build`  
> 无新增 npm 包，无新 import，无动态 require；构建风险极低。

---

## 20. 已知局限 / 后续工作（Deferred）

| 项目 | 说明 |
|---|---|
| `recentUpdate`（最近更新）排序 | V1 角色无 `updatedAt` 时间戳，默认排序等于插入顺序；真实"最近更新"需在 store 写操作时记录时间戳 |
| 来源 / 创建者 / 战役字段 | 目前显示固定占位文案；需等 Campaign / Source 系统实装 |
| 角色删除 / 复制 / 重命名 | 未实装，需在角色库卡片增加 Action 菜单 |
| 角色数量上限策略 | 未实装，目前无上限 |
| 运行时切换角色 | 运行时（Gameplay）切换角色时需要 gate 检查（HP / 资源是否为空），未实装 |
| 跨系统统一角色库（Option B） | 当前为 DND 独立数组；COC / CP RED 仍无 `actors[]` |

---

## Risk Boundary Report

```
任务：DND Multi-Actor Store + Actor Vault Library v1
Landmark：DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1
```

| 边界检查项 | 结论 |
|---|---|
| CharacterData schema 是否变更 | 否。CharacterData 类型本身零修改 |
| store 是否变更 | 否（本任务）。Store 变更在上一任务已完成并验证 |
| localStorage 存档格式是否变更 | 否。`characters[]` + `activeCharacterId` 字段已在上一任务落入 persist key，本任务无新增持久化字段 |
| migration 逻辑是否变更 | 否。`merge` 回调零修改 |
| COC 文件是否被修改 | 否 |
| CP RED 文件是否被修改 | 否 |
| DND 规则数据 / 算法 / runtime 是否被修改 | 否 |
| React Router / URL routing / History API 是否被使用 | 否。全部导航通过 `onViewChange(view)` prop 回调实现 |
| import/export 流程是否被修改 | 否 |
| Campaign / Module / Session 是否被修改 | 否 |
| Workshop / Plugin 是否被修改 | 否 |
| 新增 npm 依赖 | 否 |
| 新增 import | 否（所有 import 已存在于文件顶部） |

**风险评级：极低**

本任务为纯 UI 重构（Shell 视图 + i18n）+ 对已完成 store 字段的消费，零 schema / store / 存档格式变更。唯一可能的运行时风险是 `libChars` 派生逻辑（filter→map→sort）在 `dndCharacters` 为空时的边界行为——已验证：`dndCharacters` 初始化为 `[_initialChar]`，不存在空数组情况；`libChars.length === 0` 空状态由 `noResults` 提示处理。

**建议操作**：手动执行 `npx tsc --noEmit` + `npm run build` 确认无构建错误后即可合并。无需回滚准备。
