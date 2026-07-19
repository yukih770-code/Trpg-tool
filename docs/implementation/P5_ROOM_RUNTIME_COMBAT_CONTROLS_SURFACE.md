# P5 Room Runtime Combat Controls Surface

## Visibility Update

Room Runtime combat controls now consume viewer-projected combat snapshots.
Enemy/NPC values use injury stages and unknown AC by default for non-host
viewers; host editing and combat authority remain unchanged. See
`P5_TOKEN_INSPECT_SAFE_VISUAL_SURFACE.md`.

## Purpose

This slice mounts the existing combat table inside `RoomRuntimeEntryBridge` so a
live Room Runtime can run initiative, turns, and host-confirmed combat state
changes without falling back to the Server Campaign Workspace.

## Room event boundary

Combat transitions are appended as public `combat.*` Room RuntimeLog events.
The server assigns event identity and sequence, requires an active host author,
and broadcasts the existing RuntimeLog envelope. Players and spectators can
replay and view those records but cannot append combat transitions.

The Room Runtime replays its combat state from those append-only events. Older
combat events and scene snapshots remain valid; `mapTokenId` is optional
presentation linkage that lets an existing map token display combat HP,
conditions, and current-turn emphasis. It neither creates tokens nor grants
ownership.

## Table flow

The host adds already placed map tokens to combat, rolls only missing initiative
when starting, and can explicitly reroll all initiative. Manual initiative is
preserved unless rerolled. The host may adjust HP, maximum HP, temporary HP, AC,
and conditions. Each adjustment is an append-only combat update.

Players see the current turn and their linked combat summary, with a basic d20
shortcut. Spectators are read-only. The map can locate a combatant, and selecting
a linked map token selects its combatant; token movement remains governed by the
existing server-verified ownership guard.

## Not included

No spell or attack automation, AI turns, inventory automation, character-sheet
write-back, monster database, map asset import, database migration, or new
WebSocket command channel is included.

## Verification

- `npm run frontend:verify:runtime-combat-controls`
- `npm run runtime:verify:room-combat-controls`
- existing combat HUD, comfort combat, token ownership, scene snapshot, API,
  TypeScript, and build checks.
