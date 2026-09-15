# D&D Weapon Mode & Range Contract V1

## 1. Executive verdict

**PASS — MODE CONTRACT ESTABLISHED, RANGE EXECUTION BLOCKED BY SPATIAL SCALE.**

The D&D layer now has deterministic weapon attack-mode identities, source-backed ordinary melee reach, and the already-approved dagger thrown range. The existing four melee Actions remain executable under the established GM-adjudicated theater-of-mind policy. Automatic server range rejection is intentionally inactive because persisted Platform map state cannot produce authoritative game distance without using the browser's render dimensions.

## 2. Current 4/38 baseline

The historical coverage milestones are preserved:

| Milestone | `SAFE_NOW` | Remaining |
|---|---:|---:|
| Weapon Coverage Audit V1 | 1 / 38 | 37 |
| Weapon Gameplay Profiles V1 | 4 / 38 | 34 |
| Weapon Mode & Range Contract V1 | 4 / 38 | 34 |

The current set remains Dagger melee, Mace, Flail, and Morningstar. This task adds contract precision rather than unsupported breadth.

## 3. Platform spatial audit

The authoritative trace is:

```text
Room Scene/runtime
→ append-only Room Map events
→ replayMapRuntimeEvents
→ MapBoardState
→ MapToken x/y percentages + optional grid configuration
→ BasicMapBoard render-time measurement
```

`SceneRuntimeSnapshot` can contain `MapBoardState`, and T12 can replay room map events. Neither path stores board width, board height, a world-coordinate extent, nor a canonical grid geometry rule. `RuntimeActor`, `Combatant`, and `MapToken` remain separate. A combatant may have `mapTokenId`, but map placement is not mandatory, and the map schema permits more than one token to reference the same actor identity.

## 4. Scene coordinate/scale findings

`MapToken.x` and `MapToken.y` are normalized percentages clamped to 0–100. `MapGridConfig` stores `sizePx`, `feetPerSquare`, origin, snap, and display flags. `measureMapDistance` converts percentage deltas to pixels using `widthPx` and `heightPx` supplied by its caller, then divides by `sizePx` and multiplies by `feetPerSquare`.

`BasicMapBoard` supplies `getBoundingClientRect().width / zoom` and `.height / zoom`. Those DOM dimensions are not persisted or available to the server. Thus the same persisted token percentages and grid values can yield different feet on different rendered board extents. The current geometry is also the UI helper's Euclidean `Math.hypot`, not a persisted Platform geometry contract.

## 5. Platform/System boundary

Platform continues to own token identity, position, grid display configuration, visibility, and generic map event replay. D&D owns weapon modes, reach/range bands, ability eligibility, proficiency category, and future attack legality. No D&D weapon rule was added to `MapBoardState`, `BasicMapBoard`, map replay, or generic Runtime types.

## 6. D&D attack-mode contract

`DndWeaponAttackMode` is a D&D-owned registry record with:

- `modeId`, `weaponDefinitionId`, `actionDefinitionId`, and `effectDefinitionId`;
- `attackKind` (`melee`, `thrown`, or `ranged`);
- typed `abilityRule` and `proficiencyRule`;
- `distanceProfile` using the existing D&D Action range shape;
- `availability`, `spatialEnforcement`, explicit blockers, and source references.

The registry validates that every represented mode points to the matching canonical sourced Action and damage Effect. Derivation consults this registry and materializes only an executable melee mode. It no longer infers mode executability from a tag string.

## 7. Stable mode identity

The deterministic mapping is `action.item.<weapon>.<usage>` → `mode.item.<weapon>.<usage>`. IDs never depend on array index, display order, localized labels, or UUIDs.

Current mode IDs are:

- `mode.item.dagger.melee-weapon-attack`
- `mode.item.dagger.thrown-weapon-attack`
- `mode.item.mace.melee-weapon-attack`
- `mode.item.flail.melee-weapon-attack`
- `mode.item.morningstar.melee-weapon-attack`

All pre-existing Action IDs remain unchanged.

## 8. Range/reach metadata contract

Approved local sources are pinned by path and SHA-256:

| Rule | Source | SHA-256 |
|---|---|---|
| weapon categories, ordinary melee distance, weapon table, dagger 20/60 | `dnd-local-chm-primary:玩家手册2024/装备/武器.htm` | `DFFA4E8D79C3A97C18FBD3631045A9DDD318A916A960A19C53F8BF2191EC89F7` |
| ordinary melee reach | `dnd-local-chm-primary:玩家手册2024/进行游戏/近战攻击.htm` | `5B16E67A8CFEFCC20BD0DA2A2EFF2DFE234B9BA6BC51141F276D25E34CC1D2CE` |
| normal/maximum range and long-range consequence | `dnd-local-chm-primary:玩家手册2024/进行游戏/远程攻击.htm` | `3F799847F0AAB29849464FF1F596AAB75A9CC04B4519452C2B6CAC3F2BCEFC2D` |
| melee/ranged governing abilities | `dnd-local-chm-primary:玩家手册2024/进行游戏/攻击检定.htm` | `A68E5D5A5772612FA80292B98CF1A33DB04ACA9F3C66E5E539CF6AED93674DDC` |
| thrown property and ability carry-through | `dnd-local-chm-primary:玩家手册2024/装备/词条.htm` | `7DDBE92400A0E8A97940AD67D57249268F47418E48F1618CD71BA29BBEB9022A` |

Ordinary 5-foot melee reach is normalized once as `DND_2024_ORDINARY_MELEE_DISTANCE`. Dagger's 20/60-foot thrown profile is normalized once separately. No missing distance is defaulted and no special-reach weapon is treated as ordinary melee.

## 9. Existing simple melee behavior

Dagger, Mace, Flail, and Morningstar still derive the same `DndLiteActorAction` IDs and Character-specific attack/damage values. Their canonical Actions now reference an executable melee mode and expose source-backed 5-foot reach at the definition layer. Because server distance is unavailable, T12 behavior remains GM-adjudicated and otherwise unchanged.

## 10. Theater-of-the-mind policy

When authoritative spatial distance is absent, `evaluateDndWeaponRange` returns `gm-adjudicated`. T12 continues resolving an otherwise valid authoritative Action. Combatants without tokens, targets without tokens, and no-map play are not rejected merely for lacking spatial context.

## 11. Spatial legality algorithm

The D&D-only comparison seam accepts a mode and an authoritative distance in feet. For an executable ordinary melee mode, distance at or below reach is allowed and distance above reach is rejected. Missing distance is GM-adjudicated. Deferred modes return a blocker.

This seam is deliberately not connected to T12 yet. A future Platform primitive must first return authoritative world distance from persisted state. Only then should T12 call the D&D comparison after authoritative actor/action/target resolution and before RNG.

## 12. Illegal-attack behavior

The focused test proves the future ordering seam: a supplied authoritative 6-foot distance rejects a 5-foot melee mode before any RNG callback. Current production T12 cannot perform that rejection because it cannot obtain authoritative feet. It does not roll and discard based on guessed pixels, and it emits no misleading range-failure event.

## 13. T12 integration

T12 itself was not rebuilt and gained no weapon-name branch. It still resolves authorization, accepted/override Action authority, roll mode, crypto-backed RNG, AC, criticals, damage, HP/temp HP, one `combat.attack_resolved` event, idempotency, and replay. Mode/range enforcement remains a documented pre-RNG insertion point pending the Platform spatial contract.

## 14. Client-forgery protection

`readDndAttackIntent` still constructs an allowlisted intent containing only intent ID, actor combatant ID, target combatant ID, Action ID, and d20 roll mode. Client fields such as distance, reach, attacker/target coordinates, attack bonus, and damage formula are discarded. Because no client spatial value is consumed, there is no range bypass field.

## 15. Dagger thrown-mode decision

Dagger thrown mode was not activated. The approved sources establish the mode and 20/60-foot range, and existing dice modes can represent disadvantage. Correct automatic selection still needs authoritative distance. Correct throwing also needs item removal/retrieval semantics that this task excludes. The registry therefore marks the mode `deferred` with explicit spatial, long-range-selection, and thrown-item-lifecycle blockers.

## 16. Ranged-weapon decision

No ranged weapon was activated. Most rows remain display-only and lack reviewed executable Item/Action/Effect profiles. Bows, crossbows, sling, blowgun, and firearms also require authoritative ammunition/loading or flat-damage handling as applicable. The range contract can represent future modes without pretending those mechanics exist.

## 17. Long-range decision

The approved rule says attacks beyond normal range and at or within maximum range have disadvantage, while targets beyond maximum range cannot be attacked. This rule is recorded as provenance and a deferred blocker. It is not active because the server cannot authoritatively decide the range band. T12's existing advantage/disadvantage roller was left unchanged.

## 18. Grid/distance semantics

The live grid has pixel size and feet-per-square settings, but persisted coordinates are percentages and no persisted board extent completes the conversion. No Euclidean, Chebyshev, Manhattan, diagonal, center/edge, or occupied-space rule was promoted to server authority. No pixel-to-feet assumption was introduced.

## 19. Coverage reclassification

The generated matrix advances to schema version 2 and adds:

- `canonicalAttackModeIds`
- `attackModeContractRepresented`
- `rangeOrReachMetadataRepresented`
- `rangeExecutionStatus`
- `otherRequiredMechanics`

Dagger records two modes, with thrown deferred. The four supported weapons record `BLOCKED_SPATIAL_SCALE` for automatic range execution while retaining `SAFE_NOW` for their existing GM-adjudicated melee Action. The other 34 remain `MISSING_APPROVED_DATA`; the first blocking gate remains missing reviewed executable content.

## 20. Tests

Final focused and regression results:

| Check | Result |
|---|---|
| Mode & Range contract | 27/27 |
| Weapon Gameplay Profiles | 41/41 |
| Dagger/Character weapon derivation, T9/T11/override | 22/22 |
| T12 resolver | passed |
| T12 kernel/recovery | passed |
| T12 concurrent idempotency/replay | passed |
| T12 HTTP/authority | passed |
| T12 boundaries | passed |
| T12 visibility | passed |
| T12 UI intent and rendering | passed |
| existing map grid/range helper | passed |
| coverage audit regeneration | 38 rows, 4 `SAFE_NOW` |
| TypeScript | passed |
| server production build | passed |
| frontend production build | passed |

The existing T11 suite confirms an unaccepted source change cannot alter the accepted Action. Existing override tests confirm `actions: []` and custom manual Actions remain authoritative. The T12 intent suite confirms concurrent and sequential replay do not rerun RNG or rules, including cache eviction/history fallback.

## 21. Browser acceptance

After `npm run server:build`, the backend was stopped and restarted through the production `dist-server` path. Health returned 200 and readiness `ready`. In Chrome, the restored room `V599VT` opened its live D&D map and grid panel. The panel showed `格子像素 = 50` and `每格英尺 = 5` with multiple placed tokens.

A browser-side authenticated read of the room's map stream returned five events. Token-add events carried normalized positions including `(50,50)`, `(35,25)`, and `(56,56)`. No event or board state carried width, height, world extent, or geometry. The screenshot is [browser-spatial-model.png](dnd-weapon-mode-range-contract-v1/browser-spatial-model.png); the structured capture is [browser-spatial-model.json](dnd-weapon-mode-range-contract-v1/browser-spatial-model.json).

## 22. PostgreSQL/restart

The strict read-only readiness gate passed with 12 applied migrations, 0 pending migrations, and 11/11 required schema groups ready. No migration or range table was added. Backend startup recovery completed with 6 rooms, 13 RuntimeLog events, and 36 map events restored. The tested room and map stream remained available after the fresh production build/restart.

## 23. Remaining blockers

The exact next blocker is a system-neutral persisted Scene spatial contract: authoritative world-coordinate extent plus a canonical distance/geometry definition the server can reproduce without DOM measurements. Once that exists, D&D can enforce the four ordinary melee ranges before RNG. Dagger thrown additionally needs thrown-item lifecycle and authoritative long-range band selection. Ranged weapons additionally need approved executable profiles and ammunition/loading state.

## 24. Recommended next task

Implement a Platform Scene Spatial Distance Contract V1. Persist a render-independent coordinate/world extent and explicit geometry, expose a server-side generic distance primitive, prove restart stability and map-token linkage, and only then integrate `evaluateDndWeaponRange` into T12 before RNG. Keep D&D reach/range rules in the D&D layer.

## 25. Historical follow-up: Platform Scene Spatial Contract V1

Before the Platform spatial contract, the server lacked render-independent Scene geometry. After the spatial contract, authoritative Scene/world extent, generic square-grid geometry, generic scale, and deterministic normalized-to-world conversion exist. Exact combat range remains blocked because Token footprint or bounds are still non-authoritative; T12 range enforcement therefore remains inactive.

## 26. Follow-up: D&D Spatial Attack Legality V1

The previously inactive seam is active for Dagger melee, Mace, Flail, and Morningstar when a D&D Room has an explicit 5-unit square Scene scale, unique same-Scene combatant/Token links, and supported grid-aligned authoritative footprints. The canonical mode registry now marks those four modes for square-grid footprint enforcement. Illegal attacks return `dnd_attack_out_of_range` before T12 RNG; missing or unsupported spatial authority remains GM-adjudicated. Dagger thrown and all ranged/reach modes remain deferred.
