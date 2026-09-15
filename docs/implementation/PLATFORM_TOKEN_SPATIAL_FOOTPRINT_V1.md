# Platform Token Spatial Footprint / Bounds Contract V1

## 1. Executive verdict

**PASS — AUTHORITATIVE TOKEN FOOTPRINT ACTIVE.** A Token may now carry one optional, versioned Platform footprint in Scene world units. The authoritative map stream, server projection, replay, Scene snapshots, durable restoration, and real GM surface preserve it. Pure geometry resolves deterministic world bounds and separation without DOM input or Game System rules.

## 2. Previous point-only limitation

`SceneSpatialV1` established a Token's authoritative center, but the Platform could not state what region around that center was occupied. All Tokens therefore behaved as point-only for authoritative geometry, even though the UI drew circular markers.

## 3. Legacy Token size audit

`MapToken` already had a semantic `size` enum (`tiny` through `gargantuan`, plus `custom`) and optional numeric `width` and `height`. The enum is display/content metadata and is not used to derive map geometry. Repository-wide use showed legacy `width` and `height` only being accepted, replayed, snapshotted, and projected; no unit, initialization rule, or bounds calculation was attached to them. The actual marker body is a fixed `h-12 w-12` CSS circle regardless of those values or the `size` enum. No other hidden authoritative scale field was found. Existing records may retain these fields, but their meaning cannot be proven, so they remain presentation-only compatibility data.

## 4. Why visual pixels are not authority

CSS dimensions, image dimensions, DOM boxes, viewport dimensions, device pixels, browser zoom, and map zoom/pan describe presentation. They change without changing the fictional world. None enters footprint validation or world-bound calculation.

## 5. New footprint contract

`MapToken.footprint` optionally stores `TokenSpatialFootprintV1`:

```ts
{
  schemaVersion: 1;
  shape: 'axis-aligned-rectangle';
  coordinateSpace: 'scene-world';
  anchor: 'center';
  width: number;
  height: number;
}
```

Validation requires finite positive dimensions no greater than `1_000_000_000`. Parsing returns only the six allowlisted contract fields. This is the sole authoritative Token footprint; legacy dimensions and visual marker size do not compete with it.

## 6. Shape choice and rationale

V1 uses one axis-aligned rectangle. Width and height are sufficient for the current generic product need: characters, monsters, companions, and objects may occupy unequal extents. A circle would assert a shape based only on the current artwork, while one diameter would not represent rectangular objects. Rotation, polygons, and 3D volumes have no current authoritative requirement and remain outside V1.

## 7. Units

Footprint width and height use the same abstract world coordinates as `SceneSpatialV1.world`. The optional Scene scale can label those coordinates for display, but the footprint does not encode feet, meters, grid squares, or D&D assumptions.

## 8. Center anchor

The anchor is explicitly `center`, matching `SceneSpatialV1.tokenAnchor` and canonical normalized Token `x/y`. Width extends equally left and right; height extends equally above and below the world center.

## 9. World bounds derivation

`resolveTokenWorldBounds` first converts normalized `x/y` to a world center. For a bounded Token it returns `minX = center.x - width/2`, `maxX = center.x + width/2`, `minY = center.y - height/2`, and `maxY = center.y + height/2`. A Token without a valid footprint returns `point-only` plus its center. The helper is deterministic and server-readable.

## 10. Generic separation facts

`compareTokenWorldBounds` returns center delta, Euclidean center distance, both resolved bounds, and, when both Tokens are bounded, overlap, axis separation, and Euclidean nearest-boundary separation. These are geometric facts. The function does not label any result as movement distance, reach, or legal range.

## 11. Grid interaction

V1 does not derive occupied cells. Axis-aligned bounds and existing square-grid geometry could support a later generic intersection helper, but no current workflow needs it and boundary-touch policy would need an explicit contract. No D&D grid occupancy was inferred.

## 12. Legacy Token behavior

Tokens and old snapshots without `footprint` continue to load. They resolve as `point-only`. Legacy `size`, `width`, `height`, marker diameter, and grid scale never produce an implicit footprint, so there is no guessed upgrade or migration.

## 13. Initialization/edit UX

The existing GM Token selection surface now includes an **Authoritative footprint** editor. Once Scene space is configured, the GM enters generic width and height in Scene world units, then sets, updates, or clears the bounds. Clearing emits explicit `null` and restores point-only behavior. The product explains that the values are centered and do not resize the visual Token.

## 14. Permissions

Footprint mutation uses existing `map.token_updated` authority. The active host/GM can update it. Ordinary players and spectators are denied. A player's narrow own-Token movement grant remains `map.token.move.own` and does not grant `map.token.update.any`, so moving an admitted character cannot resize its authoritative footprint.

## 15. Event/replay

The existing `map.token_added` and `map.token_updated` events carry optional footprint state. Before append, the server validates and allowlists the footprint object; malformed values are rejected. Replay applies valid state, preserves it through unrelated updates and movement, and treats explicit `null` as clear. Visible Token projection includes the same occupied geometry while preserving existing hidden-Token policy.

## 16. Snapshot/recovery

Scene snapshot sanitization parses the footprint and roundtrips it with each Token. Old snapshots remain valid with no footprint. Live Room Map persistence needs no new envelope: the existing JSON event payload retains the optional versioned value, and startup replay reconstructs it.

## 17. Movement invariants

`map.token_moved` changes only canonical normalized center coordinates. Replay constructs the moved Token from existing state, so footprint dimensions remain identical. Resolved bounds translate with the center and do not resize, reset, or consult pixels.

## 18. Rendering independence

The ordinary Token remains the existing fixed visual circle. A selected Token gets an unobtrusive GM-only dashed footprint overlay derived from `footprint / Scene world extent`; this is a view of durable authority, not its source. Geometry helpers have no viewport, map zoom, CSS, DOM, or image parameters, and deterministic tests run without a browser.

## 19. Platform/System boundary

Platform owns the optional footprint schema, center-to-bounds conversion, and generic Euclidean comparison. A Game System may later suggest a footprint and interpret geometric facts. Platform imports no D&D creature size, square occupancy, diagonal, reach, weapon, or attack rule.

## 20. Why D&D range remains inactive

This task deliberately stops at truthful Platform bounds. D&D still needs a reviewed adapter that chooses authoritative actor/weapon mode facts, maps creature size to suggested/required footprint where appropriate, chooses its distance interpretation, and rejects an illegal declaration before RNG. T12 attack resolution was not changed.

## 21. Browser acceptance

Acceptance ran against the production builds in existing Room `V599VT`, whose Scene is 20 × 12 world units. Through the real GM Token editor, `Derived Dagger Hero` received a 1.5 × 2 footprint at normalized center `(55, 54.790419161676645)`. The persisted `map.token_updated` was sequence 9. A real pointer gesture then moved that same bounded Token to `(62.5, 46.51016438460658)` at sequence 11; the editor and overlay still showed 1.5 × 2. At both 100% and 120% map zoom, the stored footprint stayed 1.5 × 2 and its Scene-relative overlay stayed 7.5% × 16.6667%. Reload and full room re-entry reproduced the center, values, and overlay.

Evidence:

- [Footprint authored](platform-token-spatial-footprint-v1/01-footprint-authored.png)
- [Footprint after real pointer move](platform-token-spatial-footprint-v1/02-footprint-after-pointer-move.png)
- [Footprint at 120% map zoom](platform-token-spatial-footprint-v1/03-footprint-map-zoom.png)
- [Footprint after reload and re-entry](platform-token-spatial-footprint-v1/04-footprint-after-reload-reentry.png)
- [Pre-restart authoritative stream](platform-token-spatial-footprint-v1/05-before-restart.json)
- [Post-restart recovery facts and resolved bounds](platform-token-spatial-footprint-v1/06-post-restart-recovery.json)
- [Recovered product after backend restart](platform-token-spatial-footprint-v1/07-footprint-after-backend-restart.png)

## 22. PostgreSQL/restart

Before the restart, the authoritative Room Map stream reached sequence 13. After stopping and restarting the rebuilt `dist-server`, health reported readiness `ready`, database status `ok`, all 11 schemas ready, and startup restoration of 6 Rooms, 1 admission, 13 RuntimeLog events, and 44 Room Map events. Sequence 9 retained the exact footprint and sequence 11 retained the moved center. In the 20 × 12 Scene these facts resolve to center `(12.5, 5.58121972615279)` and bounds `x=[11.75, 13.25]`, `y=[4.58121972615279, 6.58121972615279]`. The rebuilt browser reconnected and displayed the same center and overlay. No SQL migration was required because the optional versioned object fits the existing durable Room Map event JSON.

## 23. Tests/builds

The footprint contract passed 19 checks and server authority passed 15. Scene spatial passed 14; map replay 10/10; snapshot 23/23; Token movement 21/21; live map persistence 12 checks; permissions, map bridge, runtime visibility projection, Asset routes, and 49 public-system/background assertions passed. Weapon mode/range passed 27/27 and weapon profiles 41/41. All T12 resolver, kernel/recovery, intent idempotency, visibility, HTTP/authority, boundary, and frontend intent/render checks passed unchanged. `npx tsc --noEmit`, server production build, frontend production build, and task-owned whitespace/diff checks passed.

## 24. Remaining limitations

Legacy Tokens remain point-only until explicitly configured. V1 represents axis-aligned rectangles only and does not calculate occupied cells, collision, pathfinding, line of sight, elevation, or rotated/non-rectangular bounds. The overlay is a host aid and does not resize the marker.

## 25. Recommended next task

Create a separate D&D spatial legality task that consumes authoritative Scene and Token bounds, defines D&D size-to-footprint adaptation and distance policy, and validates the selected weapon mode before T12 rolls. That task should preserve this Platform contract and keep all D&D interpretation in the Game System layer.
