# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: DND Spellcasting Path Unification v1
- Name: DND Spellcasting Path Unification v1
- Goal: unify DND spellcasting resource consumption so standard spell slots and pact slots flow through one explicit path before future Action Registry / target / concentration work.
- Phase: P1

## Scope

### Allowed Files

- DND Gameplay related files
- DND store spell slot / spellcasting logic
- DND Action Registry files if already involved
- DND spell / progression utilities if directly relevant
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/ACTIVE_TASK.md`

### Forbidden Files

- COC code
- Cyberpunk RED code
- map / multiplayer / AI Host
- module / community ecosystem
- package / vite / tsconfig
- README
- `PLATFORM_ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `docs/archive/**`
- store schema / migration unless proven necessary

### Do Not Do

- Do not implement target selection.
- Do not implement concentration.
- Do not implement spell effects or damage automation.
- Do not implement enemy / map / multiplayer / AI Host.
- Do not create a platform middle layer.
- Do not use `git add .` or `git add -A`.
- Do not auto commit.

## Navigation

### Key Symbols

- `castSpell`
- `consumeSpellSlot`
- `spellSlot`
- `pactMagicState`
- `pactSlot`
- `DND_SPELLCASTING_RESOURCE_CONSUMPTION`

### Relevant Landmarks

- `AI-LANDMARK: DND_SPELLCASTING_RESOURCE_CONSUMPTION`

### Locate Commands

```powershell
rg -n "castSpell|consumeSpellSlot|spellSlot|spellSlots|pactSlot|pactSlots|preparedSpells|ActionRegistry|DND_SPELL" src/pages src/store src/lib src/data
rg -n "DND_SPELLCASTING_RESOURCE_CONSUMPTION|AI-LANDMARK" src/pages src/store src/lib
```

## Completion Criteria

- Current DND spell slot consumption paths are audited.
- Standard spellcasting resource consumption flows through one explicit function.
- Pact Magic remains supported or clearly routed through the same resource path.
- DND spellcasting RuntimeLogEntry is structured.
- No target, concentration, damage, map, multiplayer, COC, or CP RED changes.
- No schema or migration changes unless strictly required.

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
- Old spellcasting paths audited
- Unified resource consumption path
- Landmark changes
- Verification results
- Unexpected changes
