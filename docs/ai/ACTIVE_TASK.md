# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: System Home Navigation Deduplication v1
- Name: System Home Navigation Deduplication v1
- Goal: remove duplicated homepage navigation and architecture-heavy first-screen content from DND / COC / CP RED Game System Home pages.
- Phase: P1 platform IA / system home polish
- Status: Implemented; verification commands pending final local run

## Result Summary

- DND Home now focuses on current character context and Open Sheet / Start Playing, or Create First Character when empty.
- COC Home now focuses on current investigator context and Open Sheet / Start Investigation, or Create Investigator when empty.
- CP RED Home now focuses on current Edgerunner context and Open Sheet / Start Mission, or Create Edgerunner when empty.
- Rules compendium, source status, data completion, index categories, and architecture boundary details are not repeated as homepage cards.
- Platform guidance is collapsed / secondary and uses player-facing copy.
- No store schema, CharacterData, runtime logic, dice algorithm, rule data, map, inventory, session, Workshop, backend, or plugin implementation changed.
- Landmark: `SYSTEM_HOME_NAVIGATION_DEDUPLICATION`.

## Scope

### Allowed Files

- `src/pages/PlayWorkspace.tsx`
- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Changes

- Store schema / migration
- CharacterData / Investigator / CP RED save structure
- Runtime rule logic
- Dice algorithms
- Rule data
- True multi-character systems
- Rules Compendium engine
- Source Manager engine
- Workshop / Plugin / backend implementation
- Map / backpack / item / token / session data contracts

## Navigation

### Key Symbols

- `SYSTEM_HOME_NAVIGATION_DEDUPLICATION`
- `renderNonDndWorkspaceDashboard`
- `navigation.rulesAndDataInTopNav`
- `navigation.platformGuidance`
- `dndWorkspace.home.createFirstCharacter`

### Locate Commands

```powershell
rg -n "SYSTEM_HOME_NAVIGATION_DEDUPLICATION|rulesAndDataInTopNav|platformGuidance|createFirstCharacter" src docs
```

## Completion Criteria

- Homepage body does not repeat top nav entries.
- Homepage body shows current asset context plus one or two immediate actions.
- Empty state routes to creation.
- Technical architecture guidance is collapsed / secondary.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
