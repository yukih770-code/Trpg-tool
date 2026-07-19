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

## Token rendering clarity

Read `P5_TOKEN_RENDERING_CLARITY_PATCH.md` before changing map-token visuals.
One token has one circular avatar body. Existing `imageUrl` is preferred and
stable initials are the fallback. Name, HP, condition, and combat linkage are
external labels or small indicators, never another avatar body.

## Permission Boundary

Hosts retain existing map token control. A player may move only a host-placed
`roomActorBinding` token that the Room Server verifies against that player's
active, approved, clearance-approved binding. Owner/control metadata remains a
display hint, never standalone authority. Spectators remain view-only; manual,
monster, and NPC tokens are host-controlled by default.

## Character entry bridge

`EntryCharacterRef` normalizes lightweight display data from legacy campaign
entry selection, campaign actors, DND Lite sheets, and Room Lobby bindings. A
local draft is never automatically placed in a room. The Runtime map receives a
Room Lobby entry only after its binding and clearance are both approved. These
are source hints for map projection, not token ownership or an authority grant.

Read `P5_CHARACTER_ENTRY_CANONICALIZATION_BRIDGE.md` before adding another
character-to-token path.

## Character Clearance Alpha

`P5_CHARACTER_CLEARANCE_ALPHA.md` adds the preceding Room Lobby flow. A local
Actor Vault selection or quick draft becomes a presence candidate only after
the host approves the binding and the session admission is approved. The
optional name, summary, HP, and AC carried by that entry are display metadata;
they do not grant token control or alter combat authority.

## Not Included

No asset upload, full token editor, fog/LOS/pathfinding, automatic range
damage, automatic spell resolution, full token ownership ACL, official rules
content, or persistence migration is added here.
