# P6 DND Owner-Source Class Progression Batch 3

## Scope

This batch replaces placeholder progression entries for Paladin and Ranger with
their 1-20 level-table facts from the local owner-provided DND 2024 source.

Source pages:

- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\圣武士\圣武士.htm`
- `C:\TRPG_CHM_WORK\extracted\玩家手册2024\角色职业\游侠\游侠.htm`

The source tables share a half-caster spell-slot progression that begins at
level 1. This batch records that table, prepared-spell counts, feature names,
and already-modeled resource references.

## Boundary

- This is level-table reference and preview data only.
- It does not prepare or cast spells, calculate multiclass slots, execute Smite
  or Favored Enemy, summon mounts, apply auras, or alter Room authority.
- Rogue and Sorcerer remain explicit placeholders for the next source batch.

## Verification

`npm run frontend:verify:dnd-class-progression-batch-3` checks the sourced
Paladin/Ranger table facts and their level-one half-caster slot availability.
