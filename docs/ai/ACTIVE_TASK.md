# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Multi-System Workspace Shell Planned Slots v1
- Name: Multi-System Workspace Shell Planned Slots v1
- Goal: expose platform-level workspace module entries and planned slots for DND / COC / CP RED without implementing real inventory, map, item, community, backend, or multiplayer functionality.
- Phase: P1 platform IA / workspace shell
- Status: Implemented; verification commands pending local run

## Result Summary

- DND Workspace gained planned Backpack / Items, Map / Tactical Board, and Quests / Notes / Logs slots.
- COC gained a lightweight workspace dashboard with entries for Investigator Vault, Creator, Sheet, Skill Checks, Pushed Rolls, Growth Checks, Clues / Handouts, Investigation Notes / Session Log, Locations / Map, and Source Status.
- CP RED gained a lightweight workspace dashboard with entries for Edgerunner Vault, Creator, Sheet, Skill Checks, Combat, Equipment / Black Market, Cyberware, Netrunning, Enemies / Encounter, Map / Tactical Position, Session Log, and Source Status.
- Planned modules show placeholder copy only: real functionality waits for data contracts.
- No rule data, store, schema, migration, CharacterData, Sheet runtime, Gameplay runtime, inventory contract, map/token contract, community/backend logic, or multiplayer sync changed.
- Landmark: `MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS`.

## Scope

### Allowed Files

- `src/pages/PlayWorkspace.tsx`
- `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/rules/COC_RULE_COVERAGE.md`
- `docs/rules/CPRED_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- Rule data files
- `src/store/*`
- Store schema / migration
- CharacterData / save format
- Creator business logic
- Sheet runtime logic
- Gameplay runtime logic
- Inventory / map / token / encounter data contracts
- Community / backend / multiplayer code

### Do Not Do

- Implement real inventory, backpack, item, map, token, enemy, encounter, session log, community, subscription, backend, or multiplayer functionality
- Rewrite DND Builder
- Rewrite Sheet / Gameplay runtime
- Modify rules data
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS`
- `multiWorkspace.*`
- `dndWorkspace.modules.inventory`
- `dndWorkspace.modules.map`
- `dndWorkspace.modules.journal`

### Locate Commands

```powershell
rg -n "MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS|multiWorkspace|dndWorkspace\\.modules\\.(inventory|map|journal)" src docs
```

## Completion Criteria

- DND planned slots appear and only show placeholder copy.
- COC dashboard module entries route to existing Creator / Sheet / Gameplay or placeholder.
- CP RED dashboard module entries route to existing Creator / Sheet / Gameplay / Market or placeholder.
- Module card grids are responsive and do not horizontally overflow.
- No schema, migration, store, rule data, Sheet runtime, or Gameplay runtime changes.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
