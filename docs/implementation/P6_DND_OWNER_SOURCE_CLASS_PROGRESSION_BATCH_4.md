# P6 DND Owner-Source Class Progression Batch 4

## Scope

This batch replaces placeholder progression entries for Rogue and Sorcerer with
their 1-20 level-table facts from the local owner-provided DND 2024 source.

Source pages:

- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\游荡者\游荡者.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\术士\术士.htm`

It records Rogue Sneak Attack dice progression, Sorcerer point-table alignment,
and the Sorcerer cantrip, prepared-spell, and spell-slot columns.

## Boundary

- This completes structural 1-20 table coverage for the six previously
  placeholder standard classes.
- It does not complete every standard class's feature implementation: earlier
  progression batches still carry explicit high-level placeholder notes where
  they have not yet been owner-source matched.
- No class feature, Sneak Attack, Metamagic, spellcasting choice, or conversion
  rule is executed by this data.

## Verification

`npm run frontend:verify:dnd-class-progression-batch-4` checks Rogue and
Sorcerer level-table facts and the final Sorcerer spell-slot snapshot.
