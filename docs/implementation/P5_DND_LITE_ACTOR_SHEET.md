# P5 DND Lite Actor Sheet

## Purpose

This slice follows the DND dice/check layer by supplying a small, host-operated
actor data model for the current DND runtime page. It reduces repeated manual
entry of ability modifiers, saves, skills, AC, HP, attack bonuses, and damage
formulas without attempting to become a full character builder.

## Model and helpers

`DndLiteActorSheet` is versioned (`schemaVersion: 1`) and contains six ability
scores, proficiency bonus, simple defenses, optional save/skill overrides,
actions, notes, and tags. Pure helpers derive ability modifiers, resolve skill
and save fallbacks, validate values, produce combat prefill data, and prepare
dice-panel action inputs. No helper calls a backend or rolls dice.

## Persistence strategy

Campaign Actor Instance records expose read/create/archive only in the current
API surface; there is no actor PATCH route for `snapshotPayload` or
`overridePayload`. To avoid silently widening that contract, Lite Actor Sheets
are held in the current host page state and keyed by existing campaign actor
instance id. They survive component interaction during that page session only.
They are not written to the actor vault, database, scene snapshots, or server.

## Runtime integration

The Dice panel can derive an ability, skill, or save modifier when a saved Lite
sheet is selected. An action can prefill attack bonus and damage formula while
manual values remain editable. The sheet can also prefill the local combat-table
add form with name, AC, HP, notes, and the existing source actor instance id.

The existing dice result events remain the only activity records. Saving a
local-only sheet does not claim durable or live synchronization.

## Boundaries

This is not a full DND character builder, class/race/subclass system, spell or
monster database, rules engine, HP apply workflow, inventory system, or official
content source. It makes no DB migration, API contract, WebSocket, auth, or
runtime-authority change.

## Next phases

- NPC / Monster Template Library
- HP / Damage Apply Workflow
- Spellcasting Lite
- Equipment / Inventory Lite
- Rest / Resource Tracking

## Verification

Run `npm run frontend:verify:dnd-lite-actor`, then the DND dice, runtime, API,
TypeScript, build, leak, and diff verification chain.
