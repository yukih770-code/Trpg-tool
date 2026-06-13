# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Sheet Layout Compact v1
- Name: DND Sheet Layout Compact v1
- Goal: make the DND character sheet denser and easier to scan without changing rules, data, schema, or runtime behavior.
- Phase: P1 platform IA / DND sheet UI compacting
- Status: Implemented; verification commands pending final local run

## Result Summary

- DND Sheet now uses a compact identity header, condensed HP / AC / Initiative / Speed / PB stat row, and a three-zone desktop layout.
- Six ability scores render as a compact grid instead of a long vertical column.
- Skills and saving throws use denser rows with proficiency markers and passive perception surfaced near skills.
- Attacks/equipment, spell summary, class resources, feats, and character details are presented as summary zones.
- Start Playing / Enter Combat Panel remains a visible actor-context action.
- No CharacterData schema, store schema, rule data, runtime logic, dice algorithm, spell preparation logic, class resource logic, inventory contract, import/export, workshop, map, session, or routing behavior changed.
- Landmark: `DND_SHEET_LAYOUT_COMPACT_V1`.

## Scope

### Allowed Files

- `src/pages/Sheet.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Changes

- Store schema / migration
- CharacterData save structure
- DND rule data
- Runtime rule logic
- Dice algorithms
- Spell preparation logic
- Class resource logic
- Inventory / item data contract
- Import / export logic
- Workshop / Plugin / backend implementation
- Map / token / session implementation
- React Router / URL routing

## Navigation

### Key Symbols

- `DND_SHEET_LAYOUT_COMPACT_V1`
- `Sheet`
- `dndSheet.compact.*`
- `attrList`
- `allSkills`
- `passivePerception`

### Locate Commands

```powershell
rg -n "DND_SHEET_LAYOUT_COMPACT_V1|dndSheet\\.compact|passivePerception|attacksEquipment|spellSummary" src docs
```

## Completion Criteria

- HP / AC / Initiative / Speed / PB are compact and high visibility.
- Ability scores use a compact grid.
- Skills and saves are denser and scannable.
- Attack/equipment, spell, and class resource areas are summary zones only.
- Start Playing remains visible and routes to Gameplay.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
