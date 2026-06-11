# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: COC Growth Skill Cap 99 v1
- Name: COC Growth Skill Cap 99 v1
- Goal: Cap COC skill growth results at 99 while preserving the existing Growth Check v1 flow.
- Phase: P1

## Scope

### Allowed Files

- `src/pages/CocGameplay.tsx`
- `src/pages/cocGameplay/CocChecksPanel.tsx`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/COC_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- DND files
- CP RED files
- `src/store/cocStore.ts` unless strictly required
- store schema / migration
- package / vite / tsconfig
- large UI style changes

### Do Not Do

- Do not implement Keeper Console.
- Do not implement campaign management.
- Do not implement occupation / archetype progression automation.
- Do not implement full insanity automation.
- Do not use `git add .` or `git add -A`.
- Do not auto commit.

## Navigation

### Key Symbols

- `handleGrowthCheck`
- `updateSkill`
- `skillGrowthMarks`
- `growth-check`

### Relevant Landmarks

- `AI-LANDMARK: COC_GROWTH_CHECK_RESOLUTION`

### Locate Commands

```powershell
Select-String -Path src\pages\CocGameplay.tsx,src\pages\cocGameplay\CocChecksPanel.tsx,src\store\cocStore.ts -Pattern "COC_GROWTH_CHECK_RESOLUTION","handleGrowthCheck","updateSkill","skillGrowthMarks","growth-check"
```

## Completion Criteria

- Growth success uses `rawNewValue = previousValue + increaseRoll`.
- Final skill value uses `newValue = Math.min(99, rawNewValue)` equivalent.
- RuntimeLogEntry payload records `rawNewValue`, `cap`, and `capped`.
- Growth Check UI mentions the 99 cap.
- Docs no longer describe the 99 cap as deferred.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```

## Report Requirements

- Files read
- Files changed
- Navigation points
- Extra files read and why
- Verification results
- Unexpected changes
