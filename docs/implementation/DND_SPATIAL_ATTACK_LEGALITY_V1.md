# D&D Spatial Attack Legality V1

## 1. Executive verdict

Implementation verdict: **authoritative D&D simple-melee spatial legality is active when the narrow V1 spatial contract is fully available**. Focused verification, production builds, real-browser acceptance, PostgreSQL recovery, and a post-restart repeated rejection all pass.

The server now resolves a canonical authored Action, its canonical weapon mode, both combatants, their unique linked Tokens, the replayed Scene, and both authoritative footprints before T12 rolls. A supported attack is classified `legal`, `illegal`, or `unavailable`. Only `illegal` rejects. `unavailable` preserves theater-of-the-mind and existing GM adjudication.

## 2. Platform spatial inputs

Platform supplies only generic facts: `SceneSpatialV1` world extent and square-grid geometry, normalized Token centers, `TokenSpatialFootprintV1` world-space rectangles, deterministic bounds, the Room Map append-only stream, and replay. Browser pixels, DOM dimensions, legacy Token presentation width/height, and request-authored coordinates are never inputs.

## 3. D&D Actor-size authority audit

Current Actor size is **DISPLAY-ONLY / FREE TEXT** for this purpose.

- `CharacterData.size` is a plain `string`. The accepted Character snapshot freezes it and T11 hashes it as combat-relevant, but no canonical size-category parser validates it.
- `DndPrivateMonsterTemplate.size` is optional free text.
- Monster conversion places size inside Lite Sheet notes.
- `RoomRuntimeActorProjection` and `Combatant` have no authoritative D&D size field.

The data is therefore insufficient for automatic Player Character or NPC/Monster size-to-footprint mapping. No mapping is fabricated.

## 4. Approved size/space source

The approved owner source is `dnd-local-chm-primary:玩家手册2024/进行游戏/移动和位置.htm`, SHA-256 `0C7E72DC0BCEF6FB95F1ABB16DC0800896D7E854B527DD42A21B26DD61F4C6E1`.

It establishes that creature size determines occupied space, gives occupied-space dimensions, states that each grid square represents 5 feet, and defines range between things by the shortest count of adjacent squares. The normalized occupied-space widths are stored once as `DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS`. V1 enforces integral one-through-four-square spaces; the sourced half-square Tiny space remains unavailable because the source does not define its exact occupancy inside a shared square.

Ordinary melee reach remains sourced from `dnd-local-chm-primary:玩家手册2024/进行游戏/近战攻击.htm`, SHA-256 `5B16E67A8CFEFCC20BD0DA2A2EFF2DFE234B9BA6BC51141F276D25E34CC1D2CE`.

## 5. D&D size → footprint adapter

No size-to-footprint adapter is active. The approved rule table is sufficient to validate supported occupied bounds, but current Actor size is not a canonical typed category. Manual authoritative Token footprints can support legality without pretending the free-text Actor field is executable rules data.

## 6. Materialize-once semantics

No automatic materialization occurs in V1. A future adapter may initialize a missing footprint once during a supported D&D Token placement, but it must wait for authoritative typed Actor size. Historical point-only Tokens are not silently mutated.

## 7. Scene unit interpretation

The Platform scale stays generic. Inside an already-authorized `dnd5e-2024` Room, the D&D adapter accepts only a square Scene whose explicit `unitsPerGridCell` equals the approved D&D value `DND_2024_GRID_CELL_DISTANCE_FEET` (5). The optional `unitLabel` is ignored and cannot grant semantic authority. World units are converted through the Scene grid cell size; Platform itself does not import feet or D&D rules.

## 8. Approved distance interpretation

The D&D seam converts both authoritative bounds into exact occupied square ranges. Bounds must be square, source-valid in cell width, inside the Scene, and aligned to grid lines. It then computes the shortest adjacent-square count between occupied ranges. Because diagonal squares are adjacent under the approved movement/range text, the two axis counts combine with Chebyshev distance. The square count is multiplied by the sourced 5 feet per square.

Adjacent occupied spaces are therefore 5 feet apart; one intervening square makes them 10 feet apart. Generic Platform boundary separation is not treated as the D&D distance.

## 9. Tri-state legality

`DndSpatialAttackLegalityDecision` is an explicit union:

- `legal`: source-backed distance is at or within the mode reach;
- `illegal`: source-backed distance exceeds the mode reach;
- `unavailable`: the action mode, Scene, scale, link, footprint, alignment, or occupied-space facts are insufficient.

Unavailable reasons are typed and retained inside the server seam. They are not exposed as coordinate diagnostics in the live UI.

## 10. Theater-of-the-mind behavior

No Scene, no linked Token, a point-only Token, incompatible scale, off-grid/unsupported bounds, ambiguous linkage, different Scenes, or unsupported action mode returns `unavailable`. T12 then resolves exactly as before. A map is never mandatory.

## 11. Combatant/Token authority

The attack request names combatants only. The server reads each combatant's replayed `mapTokenId`, searches the authoritative Room Map stream, and requires exactly one matching Token. Contradictory Token back-links, duplicate IDs across maps, a shared Token link, or Tokens on different Scenes make enforcement unavailable. Request fields cannot select a substitute Token.

## 12. Simple melee scope

Spatial enforcement is active only for the existing canonical executable modes:

- Dagger melee
- Mace melee
- Flail melee
- Morningstar melee

The mode registry supplies action identity, attack kind, availability, reach, unit, and enforcement status. T12 contains no weapon-name branch.

## 13. Pre-RNG rejection

The server order is authorization and intent reservation → accepted/override Actor authority → authored Action validation → target and combatant resolution → authoritative map replay → D&D spatial decision → existing T12 resolver. `illegal` throws `RuntimeResolutionError('dnd_attack_out_of_range', 409)` before the resolver and before its injected RNG callback.

The focused authority test proves zero RNG calls, unchanged target HP, unchanged RuntimeLog length, no broadcast, and no fake miss event.

## 14. T12 integration

`declareDndAttack` calls one generic D&D legality seam with canonical mode metadata. Legal and unavailable decisions both enter the unchanged `resolveDndAttackAction` and `applyRuntimeResolution` path. Existing one-event resolution, partitioned append, durability confirmation, idempotency fingerprint, cache/history replay, and visibility projection remain intact.

## 15. Client forgery

`readDndAttackIntent` still allowlists only intent ID, actor combatant ID, target combatant ID, Action ID, and roll mode. Tests submit forged coordinates, distance, bounds, footprint, reach, and distance profile. The server ignores them and rejects from replayed authority.

## 16. T11

T11 behavior is unchanged. An unaccepted Character edit cannot replace the frozen campaign snapshot or its derived Action. Actor size is not read by the spatial seam, so free-text source changes cannot resize a Token or alter current legality.

## 17. Campaign overrides

Campaign override presence remains the complete authored Action authority, including an intentional empty action list. A manual/noncanonical override Action is unsupported by the spatial mode registry and therefore GM-adjudicated. A canonical Action identity continues to obtain its D&D mode/reach metadata from the canonical registry while attack/damage values come from the authoritative accepted or override Lite Action.

## 18. Browser acceptance

Real Chrome acceptance passed in the recovered cloud Room `V599VT` (`room_fe4b1ecd-26dc-47b2-b066-1f9025835e8b`) using the existing Dagger melee Action and the normal Runtime action panel.

- Scene authority was a 20 × 12 square grid with one world unit per cell and 5 feet per cell. Both combatants had explicit 1 × 1 scene-world footprints and server-owned `mapTokenId` links.
- At adjacent occupied squares, the attack entered T12 and produced a normal resolved result. The final pre-restart adjacent proof was a miss with total 8, appended as RuntimeLog seq 15.
- Moving the target one additional square away made the shortest occupied-square distance 10 feet. The same action returned the concise `dnd_attack_out_of_range` UI message. Target HP stayed 17/20 and RuntimeLog stayed at seq/count 15.
- Moving the target back adjacent produced another normal resolved result, completing the in-range → out-of-range → in-range boundary sequence.
- Reload/re-entry restored the 1 × 1 footprints and adjacent positions at actor `(52.5%, 45.8333%)` and target `(57.5%, 45.8333%)`.
- After the production backend restart, moving the target to `(62.5%, 45.8333%)` and repeating the attack again produced the same rejection with unchanged HP and RuntimeLog.

Screenshots and the structured result record are stored in `docs/implementation/dnd-spatial-attack-legality-v1/`.

## 19. Restart/PostgreSQL

No migration is introduced. The built backend was restarted through the production `server:start` path with the configured PostgreSQL store. Health returned `ready`, database status `ok`, all 11 required schemas ready, and startup recovery restored 6 rooms, 1 admission, 17 RuntimeLog events, and 55 Room Map events. The acceptance Room then replayed its Scene, both footprints, and positions correctly; its next map move appended at seq 25 and its post-restart illegal attack left RuntimeLog at seq 15.

## 20. Tests/builds

Focused pure D&D and server authority tests pass, including source constants, legal/illegal/unavailable, diagonal adjacency, explicit footprint precedence, client forgery, HTTP 409, and pre-RNG invariants. Existing T12 resolver/kernel/idempotency/visibility/HTTP/boundary/UI suites, T11/source review, campaign overrides, weapon derivation/profile/mode-range suites, Scene contract, footprint contract, authority checks, and live map recovery pass. `npx tsc --noEmit`, `npm run server:build`, and `npm run build` pass in the required order.

## 21. Deferred ranged/thrown/reach modes

Dagger thrown remains deferred for thrown-item removal/retrieval and long-range consequence selection. Other ranged weapons still require approved executable profiles plus ammunition/loading or other row-specific mechanics. Reach weapons need their own sourced profile cohort and tests. None is inferred from the simple-melee seam.

## 22. Remaining blockers

Automatic size materialization is blocked by free-text Actor size and the missing Runtime size projection. Fractional Tiny occupancy, off-grid occupied bounds, arbitrary rectangles, and non-5-foot Scenes are deliberately unavailable. These limitations do not block the supported manual-footprint simple-melee path.

## 23. Recommended next task

Define a canonical typed D&D Actor size projection and a materialize-once Token placement adapter, with explicit source acceptance and no live inheritance. Keep thrown/ranged mechanics in later, separately reviewed tasks.


## Follow-up: typed Actor size materialization (2026-09-16)

Supported new D&D Token placement now supplies the previously manual footprint automatically when accepted typed Actor size and compatible Scene scale exist. The existing legality resolver is unchanged. GM overrides/clears and old Tokens remain independent map authority; no live resizing or free-text inference occurs. PC/NPC browser acceptance and isolated PostgreSQL restart evidence are in [D&D Actor Size Materialization V1](DND_ACTOR_SIZE_FOOTPRINT_MATERIALIZATION_V1.md).
