# D&D Actor Size → Token Footprint Materialization V1

Date: 2026-09-16. Starting checkpoint: `1073dbd`. Implementation is uncommitted.

## 1. Executive verdict

**PASS — AUTHORITATIVE D&D SIZE MATERIALIZATION ACTIVE**

Supported new D&D Token placements now initialize authoritative Platform bounds from accepted typed Actor size. Real PC and NPC placement, existing melee enforcement, explicit override, clearing, reload, and PostgreSQL backend restart were exercised. This is a creation default, never live inheritance.

## 2. Previous manual-footprint limitation

Scene geometry, Token bounds, and narrow melee enforcement were already authoritative. The missing connection was typed Actor size: the GM previously had to enter numeric bounds before exact legality became available. The generic editor remains available after this change.

## 3. Existing size-data audit

| Surface | Prior field | Classification and treatment |
| --- | --- | --- |
| CharacterData / accepted Character JSON | `size: string` | Legacy display-only; never parsed |
| Species data / Creator | species identity and descriptions | Rule source could supply typed metadata; descriptions cannot |
| DndLiteActorSheet / Campaign override | no creature-size field | Add optional validated field to existing sheet |
| Monster catalog/template | `size?: string` | Display-only; database text remains unchanged |
| Runtime Actor projection | no typed size | Optional D&D diagnostic field added |
| MapToken | `size`, visual width/height | Marker appearance; not occupied space |
| MapToken | `footprint` | Existing authoritative Platform bounds |
| Scene | world, grid, scale | Existing authoritative generic geometry |

CharacterData ≠ CampaignActorInstance ≠ RuntimeActor; Actor ≠ Token ≠ Combatant.

## 4. Approved source provenance

Only owner-approved local source `dnd-local-chm-primary` was used. Occupied space and the five-foot square are from `C:/TRPG_CHM_WORK/extracted/玩家手册2024/进行游戏/移动和位置.htm`, SHA-256 `0C7E72DC0BCEF6FB95F1ABB16DC0800896D7E854B527DD42A21B26DD61F4C6E1`.

| Size | Source square in feet | Width in five-foot cells |
| --- | --- | --- |
| Tiny | 2.5 × 2.5 | 0.5 |
| Small | 5 × 5 | 1 |
| Medium | 5 × 5 | 1 |
| Large | 10 × 10 | 2 |
| Huge | 15 × 15 | 3 |
| Gargantuan | 20 × 20 | 4 |

Fixed species metadata is keyed by canonical species ID. Each file is under `玩家手册2024/角色起源/种族/` in the same extracted source:

| File | Typed size | SHA-256 |
| --- | --- | --- |
| 矮人.htm | medium | `4C20A005A6AE222FED0E97ACC2EBF00C22D0AD99FD512E536B5755B143F652F8` |
| 精灵.htm | medium | `7F8CDF74E5FB3A40CD8EA35999B5A089E995B23F783107E0ED8B9A96F422B224` |
| 半身人.htm | small | `1711343A9D8B94A956E619D372A9E3B1FF452D1595496BC7E79BCE647C896763` |
| 侏儒.htm | small | `809188A77F8BC2CDF615B5A3E4410E47CB395C357D9671D7DFC3FC2EEF81C4B0` |
| 龙裔.htm | medium | `34A5C25349CA7AD952CBFEB80055891878823DCE3B246AEABE595E11C0F85DAE` |
| 兽人.htm | medium | `7BE8B93B11850FF7592C986174542450794EC6BF842A2C3BD7B70229F935A833` |
| 歌利亚.htm | medium | `D881CCE53B3F6613A680BC2B0E8D56142379C364B8C8B1E9C992D0D0D259A404` |

The focused smoke verifies the locally available source digests. These values were not inferred from names, appearance, or model memory.

## 5. Typed D&D size contract

`DndCreatureSize` is the finite serializable union `tiny | small | medium | large | huge | gargantuan`. `readDndCreatureSize` accepts only canonical identities. Chinese/English labels are presentation. No universal Platform creature-size rule was introduced.

## 6. Character integration

Optional `CharacterData.dndCreatureSize` accompanies the unchanged legacy display field. Selecting one of the seven fixed-size species sets it from approved metadata. Selecting an unsupported/variable-size species clears it. Old saved Characters load without backfill; migration preserves only valid typed data. Existing Characters can explicitly revisit their source choice, then undergo the normal source-review process.

## 7. Campaign Actor integration

The existing `DndLiteActorSheet.creatureSize` is optional and validated. Character derivation preserves it. The canonical NPC/custom Monster editor exposes the same localized selector. `resolveDndActorSheetAuthority` retains Campaign override precedence over frozen accepted Character source. An absent/malformed override size does not fall through to a different source.

## 8. Monster integration

The Monster template adapter preserves an optional trusted typed `creatureSize`. The current catalog database only persists free-text `size`; those records do not gain invented authority. Canonical custom Monster/NPC sheets can use the selector now. The template preservation smoke uses a typed fixture, not a claim that an official catalog record was migrated or accepted in the browser.

## 9. T11/hash behavior

Typed size participates in combat-relevant field version 3. Earlier V2 hashes become `unknown`, not falsely unchanged. Review exposes a compact creature-size difference. Tests call actual source-review and acceptance services: changed Vault source does not modify the Campaign baseline before host acceptance. Acceptance updates the source; it never rewrites placed map events. Existing override precedence remains intact.

## 10. D&D size → Platform footprint adapter

`materializeDndCreatureSizeFootprint` is pure: validated canonical size + validated Scene → optional existing `TokenSpatialFootprintV1`. Width and height equal source cell width × generic `grid.cellSize`. Output uses the existing centered, axis-aligned rectangle in Scene world coordinates. No network, DOM, React, RNG, or writes occur in the adapter.

`initializeDndTokenFootprint` runs at creation and aligns lower bounds to grid lines, including even-width squares. It clamps a new square within the Scene. If the square cannot fit, it leaves the point Token unchanged. Marker visual size is independent.

## 11. Scene-scale dependency

Automatic mapping requires an authoritative square grid and `unitsPerGridCell === 5`, interpreted by the existing D&D adapter as five feet per cell. Generic world units are not hardcoded as feet. A cell size of seven world units makes a Large footprint fourteen world units wide. No Scene, no grid, incompatible scale, invalid size, or insufficient space yields no suggestion and does not block ordinary Token creation.

## 12. Materialize-once semantics

Only new placement calls the initializer. Replay, rendering, movement, attacks, Actor edits, and source acceptance do not. Once appended, the footprint is Platform Token state. An existing linked Token is located without initialization; repeated adds of an existing ID/link receive no automatic suggestion.

## 13. Explicit GM override precedence

Any explicitly supplied footprint property, including `null`, wins. Browser evidence: PC initialized at 1 × 1; GM changed it to 3 × 3; Campaign PC size was changed to Small; the existing Token remained 3 × 3 through re-entry and backend restart. This deliberately demonstrates that Actor size and Token footprint can differ.

## 14. Existing Token behavior

No historical Token is resized or migrated. Existing point-only Tokens remain point-only. V1 chooses replacement/new placement as the smallest explicit way to obtain a new default. The existing generic bounds editor remains another explicit GM action.

## 15. Clear/rematerialize behavior

The GM can clear a footprint to point-only. Browser reload and a backend restart preserved the cleared NPC. Missing bounds leave exact spatial legality unavailable; no attack or render reapplies Actor size. An explicit “Set bounds” action restored the NPC's 2 × 2 footprint for the final restart check. Automatic restoration would require a genuinely new placement.

## 16. Token placement integration

| Path | Initialization authority |
| --- | --- |
| Live bound PC → map | Host-authorized map creation; server loads accepted Campaign Actor |
| Live NPC/custom Monster → map | Same server helper; canonical Campaign override sheet |
| Campaign preparation/session map | Same server helper over replayed session map history |
| Local standalone D&D carried Character | Pure initializer over the local selected Character snapshot |
| Monster catalog-derived Actor | Same Campaign path, only if trusted typed size survives materialization |
| Combatant placement with Actor linkage | Same new-token map event path |
| Independent marker / no Actor linkage | No D&D default |
| Existing/replayed Token | No initializer |

`BasicMapBoard` only adds a generic optional local initializer callback. Live/preparation clients do not submit computed defaults. `materializeDndActorToken` checks Actor ID agreement, Campaign scope, archival, existing Token/link, Scene, and explicit footprint before resolving source authority. Live requests recheck map-create permission after repository I/O and reject stale map state with a retryable 409.

## 17. Runtime projection

Runtime Actor projection may carry optional `dndCreatureSize` for current Actor information. It is not a mutable footprint store. Platform geometry, combat projection, map visibility, and spectator policy remain unchanged. The only Platform-facing rule result is the existing generic footprint object.

## 18. Existing melee legality integration

No T12 or legality-resolver production code changed. The existing canonical dagger/mace/flail/morningstar seam consumes the newly available map facts. Browser dagger attack: total 20, hit, five piercing damage, target 40 → 35 HP. Moving the NPC beyond reach produced HTTP 409 `dnd_attack_out_of_range`. Instrumented server regressions verify rejection before RNG, HP mutation, append, and broadcast.

After final restart, another illegal PC dagger attempt returned the same 409. An explicit before/after RuntimeLog read was byte-for-byte equal at seq 6. Additional acceptance-control actions account for seq 5/6: a cleared-footprint fallback attack and an authored NPC attack. They are retained in the evidence, not counted as exact spatial rejection tests.

## 19. Client authority/security

Server placement ignores forged size labels and typed-size payload fields, loading the accepted Actor instead. Explicit bounds remain a permitted GM-authored operation. Player/spectator create attempts are denied; preparation map writes require Room management authority. Attack intents retain their existing allowlist and cannot supply size/bounds. Existing movement and visibility guards remain in place. Repository failure fails closed rather than fabricating size.

## 20. Browser acceptance

Real Chrome, canonical product UI, no manual numeric bounds for the initial PC/NPC:

1. Created D&D campaign and live Room `UWPWDP` in an isolated local acceptance server.
2. Created dwarf Rogue “Size Dagger Hero” in the canonical Creator, submitted and approved it.
3. Configured a 20 × 12 Scene with one world unit / five feet per cell.
4. Placed accepted PC; editor showed 1 × 1 automatically.
5. Created “Large Size NPC” through the canonical Campaign sheet; selected Large and placed it; editor showed 2 × 2 automatically.
6. Generated/equipped the PC dagger through existing equipment UI, uploaded the changed source through normal admission, then explicitly accepted its weapon-action difference through T11.
7. Performed adjacent legal and farther illegal dagger attacks.
8. Exercised GM override, Actor-size change, clear, reload/re-entry, explicit restore, and restart recovery.

Evidence directory: [size-materialization-evidence](size-materialization-evidence/). Primary screenshots: `01-pc-auto-footprint.png`, `03-npc-auto-footprint.png`, `04-adjacent-dagger-resolved.png`, `05-out-of-reach-rejected.png`, `09-cleared-after-reload.png`, `13-final-restart-override-rejection.png`. Screenshots were visually inspected for the PC/NPC bounds editor and final recovered rejection state.

## 21. Restart/PostgreSQL

The configured database at localhost:55453 was unavailable, and Docker Desktop failed startup. Acceptance therefore used the repository's existing isolated PostgreSQL 18 harness approach, with a dedicated new temporary cluster on port 55459 and the built backend on 8787. Existing databases and `.env` were untouched. The harness applies the 12 existing baseline migrations only; this feature adds or requires no SQL migration.

Repeated built-backend restarts, including after the final production build, used the same temporary database. Final readiness: 11/11 schemas, no blockers; restored one Room, one admission, six RuntimeLog events and nine map events. Recovered PC bounds were 3 × 3, NPC bounds 2 × 2, and final out-of-range enforcement remained active. Health, initial/recovered map events, successful attack, rejection, and unchanged-log evidence are saved as JSON. This proves durability in isolated PostgreSQL, not availability of the user's stopped configured database.

## 22. Tests/builds

The new materialization smoke passes 70 assertions, covering the finite contract, all source mappings/digests, migration, T11 review/acceptance, server source authority, PC/NPC, Monster typed preservation, no-size/no-scale fallback, explicit bounds/null, existing Token, replay, clear, melee legality, and forgery rejection. Campaign API coverage includes preparation initialization and nonmanager denial; Actor projection checks include typed size.

Focused existing suites for source hashing/review, Character derivation, Actor sheet validation, map replay/persistence, spatial legality, T12 resolver/HTTP/idempotency/visibility also pass. TypeScript, server production build, and frontend production build pass. See `verification-results.json` (23 commands, including 109/109 strict Campaign API checks) and `build-results.json` for exact commands and output. Task-owned whitespace checks pass; the pre-existing protected `scripts/dev-local.ps1` EOF warning is not changed.

Exact changed/added files and git output are recorded in `source-changes.json`, `git-status.txt`, and `git-diff-stat.txt` in the evidence directory. No staging, commit, or push was performed.

### Exact production file changes

Modified:

- `package.json`
- `server/api/campaignRoomApiHandlers.ts`
- `server/room-server.ts`
- `server/services/projectRoomRuntimeActorProjections.ts`
- `src/components/platform/BasicMapBoard.tsx`
- `src/components/platform/CampaignRuntimeShell.tsx`
- `src/components/platform/DndLiteActorSheetPanel.tsx`
- `src/data/races.ts`
- `src/lib/characterMigration.ts`
- `src/lib/dnd-types.ts`
- `src/lib/dnd/dndCharacterCombatRelevantFields.ts`
- `src/lib/dnd/dndCharacterSourceReview.ts`
- `src/lib/dnd/dndCharacterToLiteActorSheet.ts`
- `src/lib/dnd/dndLiteActorSheet.ts`
- `src/lib/dnd/dndLiteActorTypes.ts`
- `src/lib/dnd/dndMonsterTemplateTypes.ts`
- `src/lib/dnd2024/multiclass.ts`
- `src/lib/platform/roomRuntimeActorProjectionTypes.ts`
- `src/pages/Creator.tsx`

Added:

- `server/services/materializeDndActorToken.ts`
- `src/lib/dnd2024/gameplay/dndCreatureSize.ts`
- `src/lib/dnd2024/gameplay/dndSpeciesSizeSource.ts`

### Exact test additions and changes

- Modified: `server/api/campaignRoomApiHandlersSmoke.ts`
- Modified: `server/services/dndCharacterCombatRelevantHashSmoke.ts`
- Modified: `server/services/projectRoomRuntimeActorProjectionsSmoke.ts`
- Modified: `src/lib/dnd/dndCharacterCombatRelevantFieldsSmoke.ts`
- Added: `server/services/dndActorSizeMaterializationSmoke.ts`
- Added: `tests/size-materialization/local-infrastructure.mjs`

The manifest also lists documentation and evidence additions. `git diff --stat` describes tracked changes only; newly added files remain untracked and are listed separately.

## 23. Remaining limitations

- Automatic Creator source size currently covers seven fixed-size species. Human, aasimar, tiefling, legacy Characters without typed metadata, and unsupported personal-content species remain unspecified until a separately approved source/UI choice is implemented.
- Existing Monster catalog free-text size is not authoritative or migrated. The typed template adapter is ready; persistence/source coverage is deferred.
- Tiny gets its supported half-cell footprint, but the existing exact melee contract requires whole-cell aligned bounds and returns unavailable for Tiny.
- Generic dragging/snapping can leave even-sized or custom bounds off-grid; existing legality then returns unavailable. This task does not redesign movement or snapping.
- Initial placement aligns/clamps to fit; it does not perform collision avoidance. Too-small/incompatible Scenes keep point Tokens.
- No historical resize, live inheritance, transform mechanics, squeezing, reach expansion, ranged/thrown enforcement, spells/AoE, collision/pathfinding, visibility changes, T13/T14, Mods, or scripting.
- The configured non-test database still needs its own runtime recovery; acceptance uses an isolated cluster.

## 24. Recommended next step

Stop this task here and review/checkpoint its explicit file set when requested. A later separately scoped product task can add source-backed variable-species size choice or typed Monster catalog persistence. Existing Token defaults should remain explicit; never add background resizing.

### Requested A–V answers

| Item | Answer |
| --- | --- |
| A | Character/Monster text size, Token visual size/dimensions, Scene geometry, and optional Token footprint existed. |
| B | Only Scene geometry and explicit Token footprint were spatial authority; text/marker sizes were display-only. |
| C | D&D-owned six-value `DndCreatureSize`. |
| D | Approved local 2024 movement/position source and recorded SHA-256 above. |
| E | Yes: optional `CharacterData.dndCreatureSize`; seven fixed species populate it. |
| F | Yes: accepted Character derivation or Campaign `DndLiteActorSheet.creatureSize`. |
| G | Trusted typed template values are preserved; legacy text catalog values are not promoted. |
| H | Source cell width × Scene cell size yields equal world width/height. |
| I | Yes: authoritative compatible square grid and five units per cell. |
| J | Once, at new placement. |
| K | No; explicit GM values win and survive later Actor changes. |
| L | Point-only; no automatic refill, exact legality unavailable. |
| M | Unchanged; no migration. |
| N | Yes, V3 hash/review and explicit acceptance gate source changes. |
| O | No new size-specific T12 production code. |
| P | Players cannot; server loads Actor authority. Hosts retain explicit generic bounds editing. |
| Q | Yes, canonical dwarf PC automatically received 1 × 1. |
| R | Yes, canonical Large NPC automatically received 2 × 2. No official catalog claim. |
| S | Yes, adjacent dagger resolved and farther dagger rejected with 409. |
| T | Yes, isolated PostgreSQL/backend restarts recovered bounds and legality. |
| U | No new database migration. Existing schema was provisioned in the isolated fixture. |
| V | Variable-size species, typed catalog persistence, Tiny/off-grid exact legality, and configured-database availability remain as stated above. |
