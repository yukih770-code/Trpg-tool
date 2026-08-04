# P6 DND Multiclass Level Allocation

## Scope

Gameplay now asks where a new total character level is allocated. A player can
continue an existing class allocation or create a new level-one allocation from
the available class list. The level preview is calculated from the selected
class's own current level, rather than from the character's total level.

## Guardrails

- Allocation is structurally capped at total level 20 and class level 20.
- `jobClass` remains the legacy primary-class compatibility field.
- When more than one allocation exists, existing spell slots and class resources
  are preserved. This avoids inventing combined-caster totals before a verified
  multiclass rules resolver exists.
- Subclass choice is retained on the allocation being advanced; the legacy
  character-level `subclass` field changes only when the primary class advances.

## Out Of Scope

This does not evaluate multiclass prerequisites, calculate combined spell slots
or pact magic, grant starting proficiencies, execute features, automate HP, or
change Room review and Runtime authority. Those need separately sourced rules
and an explicit resolver.
