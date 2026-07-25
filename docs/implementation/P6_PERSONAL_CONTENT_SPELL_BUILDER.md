# Personal Content Spell Builder (P6.7)

## Purpose

P6.7 adds a bounded personal-spell authoring form and a corresponding D&D
creator selection surface. It gives private Alpha users a usable way to carry
their authored spell descriptions on a character without turning free-form
content into an automation or authority path.

## Stored and Projected Fields

Only declared display facts are accepted: name, level, school/type, cast time,
range, duration, V/S/M component flags, and description. The adapter supplies
the existing `SpellInfo` read shape for the selected immutable pack version.

## Character Builder Behavior

- Only spells in the currently selected personal-pack version are shown.
- A user may manually add one to the local character's known list and, for a
  leveled spell, mark it prepared.
- Changing these lists does not calculate slots, validate class access,
  resolve range, apply damage, or perform casting automation.
- The personal version reference remains part of character provenance; Room
  submission and host approval remain separate and explicit.

## Deferred

- Official spell selection during initial character creation.
- Spell-slot progression, class legality, and prepared-spell limits.
- Runtime spell execution, target selection, saving throws, and damage.
- Workshop publication or Server-wide custom spell catalogs.
