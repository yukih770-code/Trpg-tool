# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: System Library Filter Taxonomy Cleanup v1
- Name: SYSTEM_LIBRARY_FILTER_TAXONOMY_CLEANUP_V1
- Goal: Replace dev-status-as-filter with user-facing taxonomy. Remove 脚手架/计划中 from primary filters. Add 类型/可用/来源 as the three main filter dimensions. Add genre tags to cards.
- Phase: P1 platform UX / IA
- Status: Done

## Result Summary

- `SystemLibrary.tsx` fully rewritten (types, entries, filters, card layout).
- **New types**: `AvailabilityKey = 'available' | 'unavailable'`; `SourceKey = 'builtin' | 'local' | 'community'`. Old `StatusKey` removed.
- **`SystemEntry`**: `status` field removed; replaced with `availability + source + tagKeys[]`.
- **Three filter rows with labels**:
  - 类型 / Type: 全部/TRPG/桌游/战棋/卡牌/自定义
  - 可用 / Availability: 全部/可进入/未接入
  - 来源 / Source: 全部/内置/本地/社区
- **Cards (available)**: badge 「可进入」(teal), genre tag chips, button 「进入系统」.
- **Cards (unavailable)**: opacity-65, badge 「未接入」(muted), disabled button 「后续接入」. Not disguised as available.
- **Genre tags** on every card: DND(TRPG/奇幻/内置), COC(TRPG/调查/恐怖/内置), CP(TRPG/赛博朋克/科幻/内置), 战锤(TRPG/黑暗奇幻/战争), 日式TRPG(TRPG/日式), 自定义(自定义/本地).
- **Search** now also matches tag text (tags joined into search corpus).
- i18n: removed `systemLibrary.statusFilter.*`, `systemLibrary.badge.(scaffold/planned/installed/community/local)`; added `systemLibrary.availability.*`, `systemLibrary.source.*`, `systemLibrary.badge.(available/unavailable)`, `systemLibrary.tags.*`, `systemLibrary.unavailableButton`, `systemLibrary.category.label`.
- No store, schema, migration, routing, or workspace-internal changes.

## Navigation

### Landmark

```text
AI-LANDMARK: SYSTEM_LIBRARY_SCAFFOLD_V1  (unchanged — still in SystemLibrary.tsx)
```

### Locate Commands

```powershell
rg -n "SYSTEM_LIBRARY_SCAFFOLD_V1" src/
rg -n "availability\|AvailabilityKey\|SourceKey" src/pages/SystemLibrary.tsx
```
