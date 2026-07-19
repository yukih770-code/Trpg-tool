# P5 Combat Mode HUD Foundation

## Purpose

This slice makes the existing local combat table easier to run at the table.
It adds a compact initiative rail, a current-combatant panel, and map focus
without changing Room Runtime authority or token movement permissions.
It uses the platform's own neutral UI and adds no third-party game assets,
names, icons, or copied interface treatment.

## Combat modes and events

The existing table statuses remain the canonical persisted shape: `setup`,
`active`, `paused`, and `ended`. The HUD derives product states
`not_in_combat`, `combat_setup`, `in_combat`, `paused`, and `ended` without a
parallel state machine. Starting combat rolls only missing initiatives,
preserves manual entries, starts round one at the highest active combatant, and
appends `combat.started` with the resolved combatant list. Manual initiative
rolls use `combat.initiative_rolled`. A DND Lite actor selected from the
existing actor sheet defaults its editable initiative modifier from Dexterity;
otherwise the existing manual modifier fallback remains in use.

Replay accepts the new start payload while remaining compatible with older
events that only contain the turn fields. Scene snapshots already carry the
same `CombatRuntimeTableState`, including order, round, and current turn.

## Interaction boundary

The HUD can select or locate a linked map token and can focus the existing DND
dice/check panel. It does not create actions, spells, attacks, damage, effects,
or character-sheet writes. Current-turn token emphasis is presentation only and
never changes visibility or movement permission.

Turn lifecycle controls remain host-managed in this slice. A player-owned
end-turn action stays deferred until the Server Workspace has an authoritative
controller-to-combatant binding; spectators have no combat controls.

## Verification

- `npm run frontend:verify:combat-mode-hud`
- `npm run frontend:verify:combat-runtime`
- `npm run frontend:verify:combat-replay`
