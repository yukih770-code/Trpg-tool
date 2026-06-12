# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Home Shell v1 Product Polish + Settings Language Placement
- Name: Platform Home Shell v1 Product Polish + Settings Language Placement
- Goal: turn Home from a developer explanation page into a product dashboard with short labels, keep language switching only under Settings / Language, and keep Coming Soon placeholders clear but concise.
- Phase: P1 Platform Shell / Home / Play Workspace
- Status: Completed

## Result Summary

- Platform Home Shell v1 product polish completed.
- Language switching moved under Settings / Language (already placed there; leftover outer-shell language keys removed).
- Home microcopy was reduced to product-style labels.
- Coming Soon placeholders use a short badge plus a one-line note ("该功能已列入后续阶段。/ Planned for a later phase.").
- i18n foundation remains extensible; copy still flows through translation keys.
- No PlayWorkspace or rules logic was changed.

## Scope

### Allowed Files

- `src/App.tsx`
- `src/pages/Home.tsx`
- `src/i18n/index.ts` only if exports must be adjusted
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- `src/pages/PlayWorkspace.tsx` internal rules logic
- DND / COC / CP RED rule code
- `src/store/*`
- schema / migration files
- `RuntimeLogEntry` types
- `src/lib/*`
- `src/data/*`
- package / Vite / TypeScript config
- `PLATFORM_ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `docs/archive/**`

### Do Not Do

- Do not rewrite the i18n foundation.
- Do not introduce `react-router`.
- Do not add external dependencies.
- Do not change DND / COC / CP RED gameplay behavior.
- Do not change store schema, migration, or RuntimeLogEntry.
- Do not use `git add .` or `git add -A`.
- Do not auto commit.

## Navigation

### Key Symbols

- `Locale`
- `setLocalePreference`
- `trpg-platform-locale`
- `shell.settings.language`
- `shell.comingSoon` / `shell.plannedNote`
- `createTranslator`
- `Home`
- `PlayWorkspace`

### Locate Commands

```powershell
rg -n "setLocalePreference|shell.settings|comingSoon|plannedNote|trpg-platform-locale" src/App.tsx src/pages/Home.tsx src/i18n
```

## Completion Criteria

- Language switch is located under Settings / Language only.
- Home cards use short product labels instead of long developer explanations.
- Coming Soon states remain visible and not misleading.
- Locale still persists via `trpg-platform-locale`; default remains `zh-CN`; English remains available.
- Shell/Home/Settings/Placeholder copy still uses translation keys.
- PlayWorkspace behavior remains unchanged.
- No store schema, migration, package, router, or dependency changes.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
