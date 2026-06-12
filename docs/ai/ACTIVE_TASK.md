# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Character Builder Responsive Workbench Phase 1
- Name: DND Character Builder Responsive Workbench Phase 1
- Goal: present the existing DND Creator as a responsive platform workbench with builder section navigation, editor area, and live summary while preserving creation logic and data contracts.
- Phase: P1 DND platform UX / builder workbench
- Status: Implemented; verification commands pending local run

## Result Summary

- DND Creator is now rendered as a responsive Builder Workbench.
- Builder sections: identity, sources, species, background, class, abilities, feats, spells, equipment, review.
- Desktop uses nav / editor / summary columns; mobile uses single-column flow with horizontal section tabs.
- Right summary shows current character status and todos.
- DND top utility actions are reduced into a secondary More Actions menu in the DND play view.
- Existing Creator selection, validation, completion, and store writes remain intact.
- Spell/equipment sections are placeholders only; no automation was added.
- No rule data, schema, migration, Sheet logic, Gameplay logic, COC, or CP RED changed.
- Landmark: `DND_CHARACTER_BUILDER_RESPONSIVE_WORKBENCH_PHASE_1`.

## Scope

### Allowed Files

- `src/pages/Creator.tsx`
- `src/pages/PlayWorkspace.tsx`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en.ts`
- `docs/rules/DND_RULE_COVERAGE.md`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- `src/data/*`
- DND Sheet / Gameplay logic
- DND Creator business logic beyond UI layout wrappers
- Store schema / migration
- COC / CP RED code and data
- Platform Shell

### Do Not Do

- Modify DND rule data content
- Rewrite creation logic
- Modify store schema / migration
- Implement spell/equipment automation
- Copy long rule text
- Use BG3, third-party wiki, model memory, or unspecified web sources
- `git add .` / `git add -A` / auto commit

## Navigation

### Key Symbols

- `DND_CHARACTER_BUILDER_RESPONSIVE_WORKBENCH_PHASE_1`
- `dndBuilder.*`

### Locate Commands

```powershell
rg -n "DND_CHARACTER_BUILDER_RESPONSIVE_WORKBENCH_PHASE_1|dndBuilder|BuilderSection" src docs
```

## Completion Criteria

- DND Creator renders responsive builder workbench sections.
- Existing creation logic and completion behavior remain intact.
- Mobile layout avoids horizontal overflow.
- Spell/equipment sections remain placeholders only.
- Schema, migration, rule data, Sheet, Gameplay, COC, and CP RED remain untouched.
- `npx tsc --noEmit` and `npm run build` pass.

## Verification

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```
