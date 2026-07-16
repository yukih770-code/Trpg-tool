# P5 Combat Runtime Table v0

## Scope

This slice adds a small local combat table to the API-backed server workspace:

- initiative order and a d20 initiative helper
- setup, active, paused, and ended turn states with round and turn index
- character, NPC, and other combatant rows
- source type, controller/source reference, armor class, current/max HP, notes, and condition labels
- host-facing start, previous, next, pause, resume, end, defeat, and remove controls
- append-only `combat.*` runtime event records through the existing API client

The table is a local page state projection. It is not live Room Server authority,
not a WebSocket feature, and not a rules engine.

## Replay from Runtime Events

When a runtime session is opened, persisted `combat.*` runtime events for that
session are replayed in server sequence order to reconstruct the local combat
table. The table also exposes a manual `Restore from combat log` action for a
fresh rebuild. Replay covers combatant add/update/remove, start, turn and round
advance, pause, resume, and end events.

Replay is deterministic and ignores unknown or incomplete event payloads. It is
only a local read projection: it does not append events, write character data,
or start live synchronization. New events still require the existing append
path and a later refresh/replay to rebuild state.

## Boundaries

This slice does not change character sheets, inventory, campaign actor storage,
room membership, RuntimeActor, CampaignActorInstance persistence, maps, tokens,
or automatic HP/rules calculations. Linking a campaign actor only supplies a
display name and source reference for the table row.

Runtime events remain append-only and server-sequenced. A failed event append does
not roll back the local table action; the UI reports that the record was not
saved so the local state is not presented as durable authority.

## Not Implemented

- full VTT map, grid, tokens, pathfinding, range, or line of sight
- rules automation, complete monster data, or compendium import
- complete character sheet editing
- WebSocket live combat sync or moving Room Server authority into the database
- AI recap, deployment, auth, or object storage

## Next Phase Candidates

- persisted combat encounter DB/API slice
- a basic map board without rules automation
- a monster/NPC template pack
- ruleset and compendium editor boundaries

## Verification

Run `npm run frontend:verify:combat-runtime` for the 20-case pure turn-order and
event-model smoke, `npm run frontend:verify:combat-replay` for replay ordering
and tolerance coverage, then use the standard TypeScript and build checks.
