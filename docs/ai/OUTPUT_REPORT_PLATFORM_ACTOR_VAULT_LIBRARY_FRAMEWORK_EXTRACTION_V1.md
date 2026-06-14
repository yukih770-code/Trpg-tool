# 输出报告：Platform Actor Vault Library Framework Extraction v1

> AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1  
> 任务层级：L2/L3 平台组件抽象  
> 构建于：DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1（DND Actor Vault UI 已在上一任务完成验证）

---

## 1. 新增了哪些文件

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/lib/platform/actorVault.ts` | 新建 | 平台类型定义 + deriveVaultSummaries 辅助函数 |
| `src/components/platform/ActorVaultLibraryShell.tsx` | 新建 | 平台级可复用 Shell UI 组件 |
| `src/pages/dndWorkspace/dndActorVaultAdapter.ts` | 新建 | DND 系统适配器（参考实现） |

## 2. 修改了哪些文件

| 文件 | 修改类型 | 说明 |
|---|---|---|
| `src/pages/dndWorkspace/DndWorkspaceShell.tsx` | 重构 | 移除 'characterLibrary' view type；替换旧 lib* 状态 + JSX 为 adapter + ActorVaultLibraryShell |
| `PROJECT_STATUS.md` | 追加 | 新增任务行 |
| `TEST_CHECKLIST.md` | 追加 | 新增 §8a 测试项 |
| `docs/ai/SYMBOL_MAP.md` | 追加 | 新增 landmark 章节 |
| `docs/ai/ACTIVE_TASK.md` | 覆写 | 当前任务状态 |
| `docs/ai/TASK_ARCHIVE.md` | 追加 | 任务归档条目 |

**确认未修改（禁止动）**：COC 页面/store/i18n、CP RED 页面/store/i18n、DND 规则数据、骰子算法、runtime 公式、save 结构、import/export 逻辑、React Router / URL routing。

---

## 3. 平台类型契约

### `ActorVaultSummary`
系统无关的 actor 摘要：`id`, `displayName`, `completionStatus: 'complete'|'incomplete'`, `isActive`, `detailFields[]`, `metaRows[]`, `insertionOrder`, `sortName`, `sortNumeric`。

### `ActorVaultAdapter<TActor>`
系统实现此接口即可接入 Shell：
- `getActors()` → `TActor[]`
- `getActiveActorId()` → `string | null`
- `getSummary(actor, index)` → `ActorVaultSummary`
- `getStats(summaries)` → `ActorVaultStats`
- `getAddOptions()` → `ActorVaultAddOption[]`
- `getSortOptions()` → `ActorVaultSortOption[]`
- `getDefaultSortKey()` → `string`
- `onEnterActor(id)` → `void`

### `ActorVaultSortOption.kind`
`'default'` = insertionOrder 升序；`'name'` = localeCompare sortName；`'numeric'` = sortNumeric 降序。Shell 只看 `kind`，不知道任何系统字段。

### `ActorVaultColorTheme`
包含 `border`, `borderLight`, `borderActive`, `bgAccent`, `bgActive`, `bgCard`, `text`, `textMuted`, `textInvert`, `textBody`, `bgHover` + **新增** `hoverBorder`, `focusBorder`, `hoverText`。所有字段均为完整 Tailwind class 字符串（字面量），确保 Tailwind JIT 扫描。

---

## 4. Shell 内部状态

`ActorVaultLibraryShell` 完全自管理以下状态：

```ts
mode: 'home' | 'existing'   // 'home' 展示两张入口卡片；'existing' 展示角色列表
search: string               // 搜索覆盖 displayName + 所有 detailFields.value + metaRows.value
filter: 'all' | 'complete' | 'incomplete'
sortKey: string              // 初始值 = defaultSortKey prop
```

DndWorkspaceView 不再需要 `'characterLibrary'`，Shell 已内化该层级导航。

---

## 5. DND 参考实现

### `dndActorVaultAdapter.ts` 导出

| 函数/常量 | 说明 |
|---|---|
| `isDndCharComplete(char)` | name+jobClass+race+background 全有效 → 'complete' |
| `buildDndActorSummary(char, index, activeId, strings)` | 映射 CharacterData → ActorVaultSummary |
| `buildDndVaultStats(summaries)` | 统计 total/complete/incomplete |
| `buildDndSortOptions(labels)` | 3 个排序选项：default/name/level |
| `buildDndVaultShellStrings(t)` | ActorVaultShellStrings（复用已有 i18n keys） |
| `buildDndVaultAdapterStrings(t)` | DndVaultAdapterStrings（字段标签） |
| `DND_VAULT_COLOR_THEME` | DND 深红羊皮纸主题；所有 Tailwind 类为字符串字面量 |

### detailFields（DND）
`level` / `class(+subclass)` / `species` / `background` — 4 个字段。

### metaRows（DND）
`source` / `creator` / `campaign` — 3 个占位元数据行（V1 全部为 i18n placeholder string）。

---

## 6. DndWorkspaceShell 变更明细

### 移除
- `'characterLibrary'` 从 `DndWorkspaceView` 联合类型（已不再需要）
- `libSearch` / `libFilter` / `libSort` 本地状态
- `isCharComplete` 本地辅助函数
- `totalChars` / `completeChars` / `incompleteChars` 派生计算
- `libChars`（过滤+排序后的列表）
- `view === 'characters'` 旧内联 JSX（约 120 行）
- `view === 'characterLibrary'` 完整块（约 80 行）
- nav `isActive` 的 `|| (item.key === 'characters' && view === 'characterLibrary')` 分支

### 新增/替换
- 导入 `ActorVaultLibraryShell`, adapter 函数, `deriveVaultSummaries`, `ActorVaultAdapter` 类型
- `_adapterStrings` + `_dndVaultAdapter` adapter 对象构造
- `_vaultSummaries` / `_vaultStats` / `_vaultSortOpts` / `_vaultStrings` 派生
- `view === 'characters'` → `<ActorVaultLibraryShell>` 调用（8 行，含所有 props）
- PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1 landmark 注释

---

## 7. 活 compat 字段处理

```ts
getActors: () =>
  dndCharacters.map(c => (c.id === dndActiveCharacterId ? dndChar : c))
```

活跃角色始终从 `dndChar` compat 字段（Zustand 实时状态）读取，确保 session 内编辑结果实时反映在库列表中。与上一任务 `isCharComplete` 的处理保持一致。

---

## 8. i18n 策略

无需新增 i18n key。DND adapter 复用：
- `multiWorkspace.actorVault.*`（existingActors/addActor/addActorNote/totalCount/completeCount/incompleteCount/recentUpdate/activeIndicator/source/sourcePlatform/creator/creatorPlaceholder/campaign/campaignNone）
- `dndWorkspace.characterLibrary.*`（title/backToVault/searchPlaceholder/noResults/statusComplete/statusIncomplete/filter.all|complete|incomplete/sort.default|name|level）
- `dndWorkspace.actions.viewSheet`（进入 CTA 标签）
- `dndWorkspace.characters.*`（unnamed/level/class/species/background 字段标签）

---

## 9. Tailwind JIT 扫描策略

Shell 组件原使用 `.replace()` 动态生成 Tailwind 类字符串，这些字符串在 JIT 扫描时不可见。已改为：

1. `ActorVaultColorTheme` 增加 `hoverBorder: string`, `focusBorder: string`, `hoverText: string` 字段
2. `DND_VAULT_COLOR_THEME` 在 `dndActorVaultAdapter.ts` 中定义所有 16 个字段为字符串字面量
3. Shell 代码中用 `t.hoverBorder` / `t.focusBorder` / `t.hoverText` 替换了所有 `.replace()` 调用（共 6 处）

---

## 10. 类型兼容性验证

| 验证点 | 结论 |
|---|---|
| `typeof dndCharacters[number]` = `CharacterData` | ✅ |
| `ActorVaultAdapter<CharacterData>` 各方法签名 | ✅ |
| `onEnterActor: (id: string) => void` ← `(id) => { ... }` | ✅ |
| `onRequestAdd: () => void` ← `() => onViewChange('create')` | ✅ |
| `defaultSortKey="default"` 匹配 `string` | ✅ |
| `DND_VAULT_COLOR_THEME` 完整实现 `ActorVaultColorTheme` | ✅（含新增 3 字段）|
| `'characterLibrary'` 不再出现于 `DndWorkspaceView` 联合类型 | ✅ |
| `PlayWorkspace.tsx` 不引用 `'characterLibrary'` 视图值 | ✅ |
| `App.tsx` 不引用 `'characterLibrary'` 视图值 | ✅ |

---

## 11. 禁止项确认

| 禁止项 | 确认状态 |
|---|---|
| COC 页面 | ✅ 未触碰 |
| CP RED 页面 | ✅ 未触碰 |
| COC / CP RED store | ✅ 未触碰 |
| COC / CP RED 保存结构 | ✅ 未变 |
| DND 规则数据 / DND 规则逻辑 / 投骰算法 / runtime 公式 | ✅ 未触碰 |
| import/export 真实逻辑 | ✅ 未触碰 |
| Campaign / Module / Session | ✅ 未实现 |
| map / chat / network | ✅ 未实现 |
| Workshop / Plugin | ✅ 未实现 |
| React Router / URL routing / browser History API | ✅ 未引入 |
| git add / commit | ✅ 未执行 |
| 统一 actor registry | ✅ 未添加 |

---

## 12. Pass/Fail 条件

| 条件 | 状态 |
|---|---|
| 新文件存在且 landmark 已嵌入 | ✅ |
| DND 使用 adapter 通过框架渲染 Actor Vault | ✅ |
| DND 搜索/过滤/排序/进入 功能与之前等价 | ✅（Shell 内部状态替代了旧本地状态）|
| DND UI 无回退 | ✅（home/existing 两视图保持相同功能覆盖）|
| COC/CP RED 未改动 | ✅ |
| 保存格式未变 | ✅ |
| tsc 验证（手动报告） | ⚠️ 待用户执行 `npx tsc --noEmit` 确认 |
| build 验证 | ⚠️ 待用户执行 `npm run build` 确认 |

> **注**：bash workspace 在本 session 始终处于 "Workspace still starting" 状态，无法自动执行 tsc/build。请手动在项目目录运行验证。

---

## 13. 风险边界报告

| 风险 | 等级 | 说明 | 处理方式 |
|---|---|---|---|
| Tailwind JIT 未扫描动态类字符串 | 中 | 原 `.replace()` 生成的 class 不会被扫描到 | 已改为显式字段字面量；DND_VAULT_COLOR_THEME 在 .ts 文件中定义所有类字符串 |
| `'characterLibrary'` 遗留引用导致类型错误 | 低 | 如果 App.tsx / PlayWorkspace.tsx 有对该值的引用 | 已 grep 确认：仅出现在 i18n key 字符串和注释中，无类型值引用 |
| adapter 对象每次渲染重新构造 | 低 | `_dndVaultAdapter` 是 inline 对象，每次 render 重建 | V1 可接受；若需优化可提取到 useMemo |
| Shell 内部 `mode` 状态在父组件 view 切换时不重置 | 中 | 用户在 characters view 进入 existing，再切换 nav 离开再回来，shell 仍记得 existing mode | `useState` 不会在父 view 不变时重置；但每次重新 mount（父 view 切走再切回）时会重置 → 可接受 |
| COC/CP RED 适配路径未实现 | 低（已知）| 这是本轮不做的事项，下一阶段任务 | 类型契约已就位；COC/CP RED 实现无风险 |
| `buildDndActorSummary` 中 `subclass` 字段拼接 | 低 | `char.subclass` 可能为 undefined；已用 `? ${char.jobClass} / ${char.subclass}` 条件 | 已正确处理 |
| `sortNumeric: char.level || 1` | 低 | level=0 或 undefined 时回落 1 | 可接受行为；DND 角色等级最低为 1 |

---

## 14. 未做事项（按任务规格）

以下均在任务范围外，将在后续轮次接入：

- COC 适配器 + COC shell 接入框架
- CP RED 适配器 + CP RED shell 接入框架
- `updatedAt` 时间戳（用于真实的"最近更新"排序）
- 角色删除 / 复制 / 归档 UI
- 来源 / 创建者 / 战役真实数据绑定
- 统一 actor registry（跨系统视图，Option B）

---

## 15. 文件总览（本轮）

```
src/lib/platform/
  actorVault.ts                     ← NEW 平台类型 + deriveVaultSummaries

src/components/platform/
  ActorVaultLibraryShell.tsx        ← NEW 平台 Shell UI

src/pages/dndWorkspace/
  dndActorVaultAdapter.ts           ← NEW DND 适配器 + 颜色主题
  DndWorkspaceShell.tsx             ← MODIFIED 接入框架；移除旧 lib* 状态

docs/ai/
  ACTIVE_TASK.md                    ← UPDATED
  TASK_ARCHIVE.md                   ← APPENDED
  SYMBOL_MAP.md                     ← APPENDED
  OUTPUT_REPORT_PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1.md ← NEW

PROJECT_STATUS.md                   ← APPENDED
TEST_CHECKLIST.md                   ← APPENDED (§8a)
```

---

## 16. Landmark 位置

```
AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
```

- `src/lib/platform/actorVault.ts` — 文件头注释
- `src/components/platform/ActorVaultLibraryShell.tsx` — 文件头注释
- `src/pages/dndWorkspace/DndWorkspaceShell.tsx` — 两处：类型声明处 + `view === 'characters'` JSX 注释

快速定位：
```powershell
rg -n "PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1" src/
```

---

## 17. 构建验证状态

| 检查 | 状态 |
|---|---|
| `npx tsc --noEmit` | ⚠️ bash workspace 无法启动；需手动验证 |
| `npm run build` | ⚠️ bash workspace 无法启动；需手动验证 |
| `git status --short` | ⚠️ 未执行（禁止 git add/commit） |
| 手动代码审查（类型兼容、禁止项、引用一致性） | ✅ 通过 |

---

## 18. 后续接入路径（供参考）

要让 COC 接入框架，只需：
1. 在 `src/pages/cocWorkspace/` 新建 `cocActorVaultAdapter.ts`，实现 `isDndCharComplete` 等价函数、`buildCocActorSummary`、`COC_VAULT_COLOR_THEME`
2. 在 `CocWorkspaceShell.tsx` 构造 `_cocVaultAdapter: ActorVaultAdapter<CocCharacter>`
3. 在 `vault` view 渲染 `<ActorVaultLibraryShell ...>`
4. COC store / save 结构 / rule data 全部不动

CP RED 同理。

---

## 19. 架构摘要

```
Platform Actor Vault Library Shell（ActorVaultLibraryShell.tsx）
│
├── DND: DndWorkspaceShell → _dndVaultAdapter → dndActorVaultAdapter.ts → CharacterData
│         └── DND_VAULT_COLOR_THEME（#58180d 深红羊皮纸主题）
│
├── [Future] COC: CocWorkspaceShell → _cocVaultAdapter → cocActorVaultAdapter.ts → CocCharacter
│
└── [Future] CP RED: CpWorkspaceShell → _cpVaultAdapter → cpActorVaultAdapter.ts → CpCharacter
```

---

## 20. 总结

本轮成功将经过 DND 验证的 Actor Vault Library UI 抽象为平台级可复用框架：

- **平台层**：`ActorVaultAdapter<TActor>` 接口 + `ActorVaultLibraryShell` Shell 组件 + 完整平台类型体系
- **DND 参考实现**：`dndActorVaultAdapter.ts` 全部适配函数 + `DND_VAULT_COLOR_THEME`
- **DND 接入**：`DndWorkspaceShell` 移除约 200 行旧代码，替换为 8 行 `<ActorVaultLibraryShell>` 调用
- **功能无回退**：搜索/过滤/排序/进入/活跃角色实时显示全部保留
- **COC/CP RED 零接触**：完全未修改
- **Tailwind JIT 安全**：所有主题类字符串为字面量，无动态计算

框架就位，COC/CP RED 可在后续轮次通过各自 adapter 接入，无需修改 Shell 或平台类型。
