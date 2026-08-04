# P6 DND Owner-Source Class Progression Batch 2

## Scope

This batch replaces placeholder progression entries for Druid and Monk with
their 1-20 level-table facts from the local owner-provided DND 2024 source.

Source pages:

- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\德鲁伊\德鲁伊.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\武僧\武僧.htm`

It also corrects the existing Wild Shape use-count table to the values shown in
the Druid source table.

## Boundary

- The table remains display and level-up-preview reference data only.
- Wild Shape, Focus Points, Martial Arts, movement, spell preparation, and
  class features are not executable effects in this slice.
- The remaining four placeholder classes still require their own owner-source
  extraction batches.

## Verification

`npm run frontend:verify:dnd-class-progression-batch-2` checks sourced Druid
and Monk facts and prevents the Wild Shape resource from being misrepresented
as a dice mechanic.
