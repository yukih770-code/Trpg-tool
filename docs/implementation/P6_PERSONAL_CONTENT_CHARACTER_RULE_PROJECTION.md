# Personal DND Character Rule Projection (P6.13)

## Purpose

When a character selects an immutable personal DND content version, Character
Builder may show the declared facts of that character's selected personal class
and subclass. This makes complex authored material legible while the player is
building the character.

## Included Read Model

- Current-level class and subclass features, plus a read-only complete
  progression table for planning future levels.
- Declared resources, including their author-written maximum and recovery text.
- Declared actions, choice groups, and trigger reminders.
- The selected personal content version already recorded on the character.

The projection is bounded, defensive about malformed entry content, and filters
to the character's selected class/subclass and current level.

## Boundaries

- It does not add fields to `CharacterData` or persist a choice selection.
- It does not calculate resource formulas or alter a resource counter.
- It does not execute effects, create Runtime actions, place Tokens, or grant
  spellcasting authority.
- It does not imply that a private version is valid for a Room. Submission and
  host review remain the multiplayer authority.

## Follow-up

Future work may add explicit character-level selections and bounded resource
state after their ownership, validation, Room review, and Runtime authority
contracts are designed together.
