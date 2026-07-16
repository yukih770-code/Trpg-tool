# P5 Scene Runtime Snapshot v0

## Scope

This slice exports the current local combat table and basic map board as a
versioned JSON scene snapshot. A host can validate pasted JSON and explicitly
apply it back to the current local runtime page.

The snapshot contains only whitelisted scene projection data:

- combatants and turn state
- map background reference, viewport, and tokens
- optional room, campaign, and runtime-session provenance
- optional small title/notes metadata

The UI shows a summary before applying an import. A provenance mismatch is a
warning for the host to review, never a silent context rewrite.

## Boundary

Scene snapshots are local JSON transport. They are not a database backup, live
Room Server authority, WebSocket sync mechanism, asset upload/archive, auth
artifact, permission decision, or complete campaign export.

Importing a snapshot updates only the current browser's combat/map projection.
It does not alter stored character data, campaign actors, room membership,
RuntimeActor state, or backend repositories. The target map keeps its current
board identity when applied through the map hook.

Optional `scene.snapshot_exported` and `scene.snapshot_imported` Runtime Events
are append-only audit notes with counts only. A failed append never blocks the
local export or import action.

## Safety

The parser accepts schema version 1 only, tolerates missing combat or map
sections, and ignores unsupported fields through a whitelist sanitizer. It
rejects malformed values and does not carry controller identifiers, request
headers, credentials, permissions, or environment configuration.

## Not Implemented

- database persistence or migrations
- WebSocket/live map or combat synchronization
- assets, uploads, bundled images, or object storage
- full campaign backup/restore, merge, or overwrite
- authorization, role enforcement, AI, rules automation, or replay promotion

## Next Phase Candidates

- persisted scene/map repository with an explicit ownership and versioning contract
- asset references through a storage adapter
- live Room Server synchronization after runtime authority design is approved
- a separately governed campaign backup/export format

## Verification

Run `npm run frontend:verify:scene-snapshot`, then the combat/map replay smokes
and standard TypeScript/build/leak checks.
