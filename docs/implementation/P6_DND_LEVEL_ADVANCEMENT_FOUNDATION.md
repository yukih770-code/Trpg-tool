# P6 DND Level Advancement Foundation

## Scope

The local DND gameplay level-up dialog now reads a pure advancement summary
before changing a character. It shows the planned level, average hit-point gain
from the selected class hit die, known class features, and any declared
resource/action/passive additions for that level.

## Boundary

- This is a single-class, local character flow only.
- It does not evaluate feature text, grant Runtime actions, or change Room
  approval.
- It does not introduce a multiclass schema, class-level allocation, combined
  spell-slot calculation, or automatic choices.
- Personal class data remains author-declared reference material and must be
  reviewed by the Room host before shared play.

## Data Coverage

The summary labels incomplete standard progression data as partial. It must not
present unverified placeholder entries as complete rules. Extending remaining
classes requires owner-source extraction and field-level verification, not
memory-based supplementation.

## Follow-up

Multiclass support needs a dedicated schema and migration slice because it
changes hit dice, level allocation, resources, spellcasting, subclass timing,
and Room clearance projections.
