# P5 Basic Map Board v0

## Scope

This slice adds a small frontend-local map board to the API-backed server
workspace. It supports an optional background image URL, pan, zoom, manual
tokens, campaign actor/combatant references, token movement, basic token
metadata, hidden state, and removal.

Map state is reconstructed from the existing append-only Runtime Event API.
`map.*` events are ordered by server sequence and unknown or incomplete events
are ignored. A manual `Restore from map log` action is available, and existing
map events are automatically replayed when a runtime session is opened.

## Boundaries

The board is local UI state plus persisted event records. It is not live map
sync, WebSocket authority, a database map repository, or a permission system.
Event append failures do not roll back the local projection; the UI displays a
safe warning. Token source references point to existing campaign actors or
combatants and do not create CampaignActorInstance or RuntimeActor state.

This slice does not add asset upload, object storage, grid measurement,
pathfinding, dynamic lighting, fog of war, line of sight, wall editing,
compendium or monster data, AI features, or map editing tools.

## Runtime Events

The board uses append-only events:

- `map.background_set`
- `map.background_cleared`
- `map.viewport_changed`
- `map.token_added`
- `map.token_moved`
- `map.token_updated`
- `map.token_removed`

The existing runtime log renders readable labels and summaries for these event
kinds. No event update/delete path is introduced.

## Next Phase Candidates

- persisted scene/map DB and API repository
- WebSocket live map sync
- grid and measurement
- token permissions and visibility rules
- asset storage
- fog, line of sight, walls, and map editing

## Verification

Run `npm run frontend:verify:map-runtime` and
`npm run frontend:verify:map-replay` for replay and boundary coverage. Then run
the standard frontend, API, TypeScript, server build, leak, and diff checks.
