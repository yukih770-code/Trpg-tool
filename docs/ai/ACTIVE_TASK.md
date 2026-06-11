# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Home Shell v1 i18n Polish
- Name: Platform Home Shell v1 i18n Polish
- Goal: move Platform Shell, Home, and placeholder copy into a lightweight translation-key i18n foundation while preserving the PlayWorkspace and all rules runtime behavior.
- Phase: P1 Platform Shell / Home / Play Workspace

## Scope

### Allowed Files

- `src/App.tsx`
- `src/pages/Home.tsx`
- `src/i18n/index.ts`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `src/pages/PlayWorkspace.tsx` only if wrapper/import changes are necessary
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- DND / COC / CP RED Gameplay internal rule logic
- `src/store/*` state structure or actions
- schema / migration files
- `RuntimeLogEntry` types
- `src/lib/*`
- `src/data/*`
- package / Vite / TypeScript config
- `PLATFORM_ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `docs/archive/**`

### Do Not Do

- Do not introduce `react-router`.
- Do not add external dependencies or an external i18n framework.
- Do not implement Campaigns, Community Modules, Private Import expansion, Content Studio, map, multiplayer, AI Host, account, cloud, marketplace, or real Campaign features.
- Do not change DND / COC / CP RED gameplay behavior.
- Do not change store schema, migration, or RuntimeLogEntry.
- Do not use `git add .` or `git add -A`.
- Do not auto commit.

## Navigation

### Key Symbols

- `Locale`
- `defaultLocale`
- `trpg-platform-locale`
- `messages`
- `createTranslator`
- `t`
- `tList`
- `Home`
- `PlayWorkspace`

### Locate Commands

```powershell
rg -n "Locale|defaultLocale|trpg-platform-locale|messages|createTranslator|tList|glossary" src/App.tsx src/pages/Home.tsx src/i18n
rg -n "Platform Home Shell v1|language toggle|localStorage|localized" PROJECT_STATUS.md TEST_CHECKLIST.md docs/ai
```

## Completion Criteria

- Platform Home defaults to `zh-CN`.
- Language toggle switches between Chinese and English immediately.
- Locale persists after refresh via `localStorage`.
- English UI remains available.
- Home / Shell / Placeholder text, helper text, empty states, and Coming Soon text are read through translation keys such as `t('home.hero.title')`.
- Common acronyms and system names live under glossary keys and remain readable.
- Future locale support only needs adding a locale file and registering it in `src/i18n/index.ts`, without restructuring Home.
- No DND / COC / CP RED rule logic changed.
- No store schema, migration, package, router, or dependency changes.
- Owner docs updated.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```

## Report Requirements

- Files changed
- Language toggle location
- Default locale status
- English availability
- `localStorage` persistence status
- Localization coverage
- Preserved terms
- Rule logic and store schema status
- Dependency and router status
- Verification results
- Unexpected changes
