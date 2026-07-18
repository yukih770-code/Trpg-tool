# P5 Actor Presence Foundation

## Scope

This slice makes a map token an optional scene projection of a campaign actor,
DND Lite actor, private monster template, or combatant. A token remains a map
instance; it does not replace the Character Vault, Campaign Actor Instance, or
Combatant.

## Token Prototype Lite

The frontend derives a small display prototype when placing a source: name,
initials fallback, optional image URL, size, kind, owner/control hints, and an
optional HP/condition summary. It is additive metadata on `map.token_*`
events, so old manual tokens and old event payloads remain valid.

## Placement and Combat Projection

The map exposes a compact **Place unit** surface. A source already linked to a
token resolves to **Locate** instead of creating a duplicate. Combat remains
the HP/condition authority: a linked map token only projects the latest local
combat summary for display. Moving a token never changes combat HP or status.

## Permission Boundary

Hosts retain existing map token control. Player-owned movement is deliberately
not enabled in this slice: owner/control metadata is only a UI hint until the
server has a verified per-token ownership grant. Spectators remain view-only.
The authenticated room-member permission guard remains authoritative.

## Character entry bridge

`EntryCharacterRef` normalizes lightweight display data from legacy campaign
entry selection, campaign actors, DND Lite sheets, and Room Lobby bindings. A
local draft is never automatically placed in a room. The Runtime map receives a
Room Lobby entry only after its binding and clearance are both approved. These
are source hints for map projection, not token ownership or an authority grant.

Read `P5_CHARACTER_ENTRY_CANONICALIZATION_BRIDGE.md` before adding another
character-to-token path.

## Not Included

No asset upload, full token editor, fog/LOS/pathfinding, automatic range
damage, automatic spell resolution, full token ownership ACL, official rules
content, or persistence migration is added here.
