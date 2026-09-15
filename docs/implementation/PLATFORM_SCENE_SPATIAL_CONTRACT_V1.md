# Platform Scene Spatial Contract V1

## 1. Executive verdict

**PASS — SPATIAL CONTRACT ESTABLISHED, EXACT COMBAT DISTANCE STILL BLOCKED**

The Platform now persists a versioned, render-independent Scene world extent, square-grid geometry, generic scale, and center-anchored normalized-to-world conversion. Map event replay, Scene snapshots, reconnect, and PostgreSQL-backed backend restart preserve the contract. Exact D&D edge-to-edge reach remains inactive because Token footprint or bounds are not authoritative.

## 2. Previous blocker

The previous weapon mode/range work could represent source-backed reach and range, but the server could not derive distance independently of the browser. The live map stored normalized Token positions and pixel-oriented display grid settings without a canonical world extent.

## 3. Old normalized-coordinate model

`MapToken.x` and `MapToken.y` remain normalized values on the inclusive 0–100 board axes. Existing map events, replay, and rendering use this representation. The contract preserves those fields and does not shift existing Tokens.

## 4. Why DOM geometry was insufficient

`getBoundingClientRect()`, viewport dimensions, browser zoom, device resolution, and the legacy grid `sizePx` describe one rendering. They cannot be reproduced by the server or trusted across clients. None of those values is used as Scene authority.

## 5. New world extent contract

`SceneSpatialV1` has `schemaVersion: 1`, `coordinateSystem: 'normalized-100'`, `tokenAnchor: 'center'`, and a required `world: { width, height }`. Width and height are finite, positive abstract world units. The stored extent contains no DOM or pixel dimensions.

## 6. Normalized → world conversion

World points are derived deterministically:

```text
xWorld = xNormalized / 100 × world.width
yWorld = yNormalized / 100 × world.height
```

The reverse conversion uses the inverse formula. World coordinates are derived values; they are not independently mutable state.

## 7. Token center anchor

The contract fixes `tokenAnchor` to `center`, matching existing `left/top` percentage placement with the visual `translate(-50%, -50%)` offset. This documents existing behavior and causes no Token migration or visual shift.

## 8. Token footprint limitation

The generic measurement result explicitly reports `footprint: 'point-only'`. Fixed visual circles, optional width/height data, D&D creature size, and inferred grid occupancy are not treated as authoritative bounds. Center-to-center geometry is therefore reproducible, while exact edge-to-edge reach is not.

## 9. Generic grid geometry

An optional grid stores `kind: 'square'`, `originX`, `originY`, and `cellSize` in world coordinates. Grid rendering and snapping derive from these values. The legacy pixel grid may still render an unconfigured Scene, but `sizePx` is never promoted to world authority.

## 10. Generic scale

An optional scale stores `unitsPerGridCell` and an optional display `unitLabel`. The Platform does not assign D&D meaning to the unit, encode weapon reach, or decide attack legality. A Game System adapter may interpret the generic measurement later.

## 11. Legacy Scene compatibility

`MapBoardState.spatial` is optional. Replaying old map streams and importing old snapshots therefore produces a valid spatially unconfigured Scene. The code does not guess an extent from DOM size, viewport size, or legacy grid pixels.

## 12. Explicit initialization path

The existing GM grid panel now offers Scene columns, Scene rows, units per cell, and a unit label. Saving creates an explicit V1 world with one world unit per square cell and appends the authoritative update. Until the GM saves it, the UI labels the Scene honestly as lacking authoritative spatial configuration.

## 13. Spatial events

`map.spatial_updated` carries `{ spatial: SceneSpatialV1 }`. The server parses and allowlists the payload before append, rejects malformed configurations, and strips unknown fields. No raw spatial payload is trusted.

## 14. Replay, snapshot, and recovery

Map replay recognizes `map.spatial_updated` and applies the latest valid configuration. Scene snapshot export/import preserves and sanitizes the same V1 shape. The existing Room Map stream provides reconnect replay, while durable map-event restoration reconstructs it after backend restart.

## 15. Host permissions

The new event maps to the existing `map.grid.edit` action. Under the current permission policy this is a host/GM operation. Focused authority tests prove host allow, ordinary-player deny, and spectator deny without adding a second permission subsystem.

## 16. Generic server spatial API

`resolveSceneWorldPosition` converts a normalized point into a world point. `measureSceneSpatialDelta` returns world endpoints, axis deltas, direct Euclidean center distance, optional grid-cell distance, and optional scaled distance. `snapSceneNormalizedPosition` snaps through world-grid geometry and converts back to the one persisted normalized representation. These pure helpers require no DOM and are available to server code.

## 17. Platform/System boundary

The Platform owns coordinates, world extent, square-grid geometry, generic scale, and reproducible point measurements. A Game System owns movement metrics, diagonal rules, creature footprint, reach, range bands, disadvantage, ammunition, and attack legality. Platform code imports no D&D weapon rules.

## 18. Why D&D range enforcement is still inactive

The new direct distance is center-to-center. D&D reach needs the separation between authoritative occupied bounds and may also require a chosen grid metric. Activating T12 from the point measurement would overstate what the current Token model knows, so T12 remains GM-adjudicated for distance and unchanged by this task.

## 19. Browser acceptance

Acceptance used the built frontend and the real room `V599VT`. The legacy view first displayed the unconfigured warning. The host then configured a 20 × 12 square Scene at 5 `ft` per cell through the real grid panel. The panel continued to render, a pointer drag moved `Derived Dagger Hero` from `(50, 50)` to `(55, 54.790419161676645)`, and the browser posted `map.spatial_updated` followed by `map.token_moved`. Reload and room re-entry showed the configured control and identical Token position. Host-only control presentation plus server authority tests cover player and spectator denial.

Evidence:

- [Legacy unconfigured Scene](platform-scene-spatial-contract-v1/01-legacy-unconfigured.png)
- [Configured Scene](platform-scene-spatial-contract-v1/02-configured-scene.png)
- [Token moved](platform-scene-spatial-contract-v1/03-token-moved.png)
- [Map stream before restart](platform-scene-spatial-contract-v1/04-before-restart-map-events.json)
- [Post-restart recovery facts](platform-scene-spatial-contract-v1/05-post-restart-recovery.json)
- [Recovered browser Scene](platform-scene-spatial-contract-v1/06-post-restart-recovered.png)

## 20. PostgreSQL and restart

The configured backend reported database status `ok` and startup recovery `ready`. Before restart, the room stream reached sequence 8. After stopping and rebuilding/restarting the production `dist-server` backend, startup restored 6 rooms, 1 admission, 13 RuntimeLog events, and 39 Room Map events. The same stream returned spatial sequence 7 and movement sequence 8. The recovered normalized point derives to world `(11, 6.574850299401197)` in the persisted 20 × 12 extent.

## 21. Tests and builds

The focused contract smoke passed 14 checks; authority passed 6; map replay passed 10/10; Scene snapshot passed 20/20; Room Map bridge, permissions, Asset/background, and live map persistence passed; Token control passed 20/20. Weapon mode/range passed 27/27, gameplay profiles 41/41, Character weapon derivation 22/22, T9/T11/override checks passed, and all T12 resolver, kernel, intent, visibility, HTTP, boundary, and frontend checks passed. TypeScript, server production build, frontend production build, and task-owned `git diff --check` passed. `package.json` was not changed.

## 22. Remaining spatial limitation

There is still no authoritative Token spatial footprint or bounds. Optional Token dimensions and visual CSS do not define occupied world space. The current primitive can state center separation only and cannot establish exact combat edge separation.

## 23. Recommended next task

Implement **AUTHORITATIVE TOKEN SPATIAL FOOTPRINT / BOUNDS CONTRACT** as a separate Platform task. Define versioned occupied bounds in world units, preserve them through map events/replay/snapshots/restart, and specify how Game Systems consume those bounds. Only after that contract is authoritative should D&D connect weapon reach and range to T12 before RNG.
