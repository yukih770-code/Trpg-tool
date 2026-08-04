# P6 DND Owner-Source Class Progression Batch 5

## Scope

This batch completes the remaining high-level level-table facts for Barbarian,
Bard, Warlock, and Wizard from local owner-provided DND 2024 class pages.

Source pages:

- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\野蛮人\野蛮人.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\吟游诗人\吟游诗人.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\魔契师\魔契师.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\法师\法师.htm`

All twelve standard DND class progressions now have source-matched 1-20 level
table facts for display and level-up preview. The batch also corrects older
Bard, Warlock, and Wizard table values where they differed from the local 2024
source.

## Boundary

- Completing level tables does not complete class automation.
- Feature names, spell-slot numbers, resource tables, and prepared-spell counts
  do not select options, execute attacks, cast spells, convert resources, or
  apply auras and conditions.
- Subclass details, feats, spell choice, multiclass calculation, and runtime
  action authority remain separate work.

## Verification

`npm run frontend:verify:dnd-class-progression-batch-5` verifies the remaining
source-table values and ensures standard-class level tables no longer carry
high-level placeholder notes.
