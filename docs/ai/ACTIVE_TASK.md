# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Home Launchpad IA Cleanup v1
- Name: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1
- Goal: Restructure the platform home page from a feature-stacking page into a clean three-section Launchpad.
- Phase: P1 platform UX / IA
- Status: Done

## Result Summary

- `src/pages/Home.tsx` fully rewritten with three-section Launchpad structure.
- Section 1 **继续上次 / Resume**: highest-priority CTA; shows current system + character name; single 「继续」button calls `onEnterPlay(system)`. System accent colour (D&D parchment / COC teal / CP gold) tints the card border/bg.
- Section 2 **规则系统库 / Rule Systems**: 3 equal-weight system cards (DND/COC/CP RED), each with system name, one-line desc (reuses `playMenu.*.desc`), 「进入系统」button, and 3 small chip links (角色库 / 规则库 / 数据状态) that also call `onEnterPlay`. Per-system accent colours.
- Section 3 **开发中功能 / In Development**: 7 dev-zone cards (战役库/规则来源设置/创意工坊/内容创作坊/Session·VTT/AI主持/私有导入), each with an explicit status badge (脚手架/接口预留/后续实现/Mock/工具入口). Cards with placeholder pages are clickable; sourceSettings and vtt are disabled (`opacity-55`, `cursor-default`). Never "即将开放".
- Private Import moved from Hero buttons into dev-zone section with 工具入口 badge; still calls `onOpenPlaceholder('privateImport')`.
- Sidebar nav label 'play' renamed: `游玩` → `规则系统` (zh-CN), `Play` → `Rule Systems` (en).
- Hero compressed to 2 lines (title + updated subtitle). No Hero buttons.
- i18n: `home.hero.*` trimmed to title+subtitle; new keys under `home.resume.*`, `home.systems.*`, `home.devZone.*`; old `home.snapshot.*` / `home.workspaces.*` / `home.roadmap.*` removed.
- No store, schema, migration, save format, DND/COC/CP RED workspace, Actor Vault Shell/adapter, Builder, dice, runtime, Campaign/Module/Session, routing, or History API changes.

## Navigation

### Landmark

```text
AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1
```

Located in: `src/pages/Home.tsx` (top of file comment)

### Locate Commands

```powershell
rg -n "PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1" src/
rg -n "home\.resume\|home\.systems\|home\.devZone" src/pages/Home.tsx
```
