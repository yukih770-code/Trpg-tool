# P6 Room Runtime Campaign Actor Projection

## Purpose

Connect the already-persisted DND Lite campaign actor override to the linked
Room Runtime without treating a campaign actor record as a public character
sheet or a new permission source.

## Read Path

`RoomRuntimeEntryBridge` asks `GET /rooms/:roomId/runtime-actors` for the
current active member. The Room Server verifies the same authenticated room
membership and `combat.view` permission used by the Runtime, then projects only
approved bindings.

For an eligible DND binding, the server may read the linked
`campaign_actor_instances` record only when its campaign id and owner match the
Room binding. It returns the validated DND Lite override's display name, HP,
temporary HP, and AC. It does not return source payloads, actions, inventory,
notes, source actor ids, or owner ids.

If durable storage is unavailable or the record cannot be safely matched, the
endpoint falls back to the pre-existing compact Room binding. Entering or using
the Runtime must not depend on this enrichment.

## UI Effect

The player read-only sheet and DND map placement candidates use this compact
projection when available. The status label explicitly says that it is a
campaign-state summary, not a full remote character card.

## Boundaries

- No campaign actor write from Room Runtime.
- No actor ownership or Room permission change.
- No WebSocket payload change or cross-client full snapshot sync.
- No inventory/action/notes projection and no combat automation.
- Existing generic campaign actor APIs remain out of the Room Runtime path.

## Verification

Run `npm run runtime:verify:room-runtime-actor-projection` for the projection
contract, followed by TypeScript and build checks.
