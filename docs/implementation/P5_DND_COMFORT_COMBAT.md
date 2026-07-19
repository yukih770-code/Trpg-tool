# P5 DND Comfort Combat

## Scope

This slice adds host-confirmed comfort controls to the local DND combat table:

- current/max HP and temporary HP on combatant rows
- apply damage, healing, temporary HP, conditions, and explicit HP overrides
- common condition chips for quick table use
- damage-roll handoff from the DND dice panel to a selected combatant
- private monster actions continuing to prefill the dice panel
- deterministic rebuild from append-only `combat.*` Runtime Events

It is a table-facing projection for a DND campaign session. A damage roll does
not change HP by itself: the host selects the target and confirms the apply
action. Lite actor data only pre-fills a combatant and is never written back.

## Deterministic HP behavior

Damage consumes temporary HP before current HP and never lowers known current
HP below zero. Healing is capped by known maximum HP; when maximum HP is not
known, it simply adds to known current HP. Temporary HP keeps the higher value
by default; the host can explicitly replace it. Manual HP adjustment is an
append-only correction event, not an in-place edit of historical records.

## Runtime events and replay

The following events are public, append-only combat records:

- `combat.damage_applied`
- `combat.healing_applied`
- `combat.temporary_hp_applied`
- `combat.condition_added`, `combat.condition_removed`, `combat.condition_toggled`
- `combat.hp_overridden`
- `combat.table_cleared`

Payloads carry target identity/display name, the applied amount, relevant
before/after HP values, optional condition/note, and optional dice reference.
Replay is sequence ordered, ignores incomplete or unknown records safely, and
rebuilds only the local table projection. It is not live sync, authority,
rules automation, or a character-sheet write path.

## Boundaries

This slice does not add grid/range handling, templates, spell automation,
official monster data, a full rules engine, character editing, inventory
updates, campaign actor persistence changes, database migrations, WebSocket
protocol work, or automatic rules enforcement. The host remains able to make
the final table decision.

## Verification

Run `npm run frontend:verify:dnd-comfort-combat` together with the existing
combat replay/table, DND dice/actor, campaign-room, scene snapshot, local
lobby, API, TypeScript, build, and leak checks.

## Combat mode HUD follow-up

`P5_COMBAT_MODE_HUD_FOUNDATION.md` adds an initiative rail and a current actor
shortcut surface. Dice navigation only focuses the existing DND check panel;
this document's manual host-confirmed damage and condition boundary remains in
place.

## Room Runtime follow-up

The Room Runtime now exposes the same host-confirmed HP, temporary HP, AC, and
condition fields through append-only `combat.*` records. These are combat-table
state only: they never write to a character sheet, inventory, or rules engine.
