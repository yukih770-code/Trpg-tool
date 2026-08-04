# P6 DND Owner-Source Class Progression Batch 1

## Scope

This batch replaces placeholder progression entries for Fighter and Cleric with
their 1-20 level-table facts from the local owner-provided DND 2024 source.

Source pages:

- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\战士\战士.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\牧师\牧师.htm`

The data records only level-table feature names, resource references, and the
Cleric table's cantrip, prepared-spell, and spell-slot numbers.

## Boundary

- This is reference and level-up-preview data only.
- Feature names are not executable effects, Actions, conditions, or automated
  combat rules.
- It does not calculate multiclass spell slots, evaluate prerequisites, select
  subclasses, prepare spells, or change Room review authority.
- The remaining six placeholder classes still display as partial coverage and
  require their own owner-source extraction batches.

## Verification

`npm run frontend:verify:dnd-class-progression-batch-1` confirms the sourced
Fighter and Cleric tables have twenty levels, key feature names, and Cleric
spellcasting snapshots without placeholder notes.
