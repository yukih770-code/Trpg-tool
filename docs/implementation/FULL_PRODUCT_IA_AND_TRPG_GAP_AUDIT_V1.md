# Full Product IA, Journey, Consistency and TRPG Completeness Audit (V1)

> One user intent → one canonical feature experience. This pass collapsed the
> last simplified creator, closed the remaining paused-system exposure, and
> measured the product against what a real D&D session actually needs.

## A. Executive verdict

The **information architecture is now sound**; the **feature completeness is
not**. Every capability the product exposes has one canonical owner and one
canonical UI after this pass. But a GM cannot run a normal 3-hour session end to
end without leaving the product — not because flows are tangled, but because
three table-critical capabilities do not exist yet: **uploading a map image**,
**typed conditions**, and **resources/spell slots**.

The IA work is converging. The next investment should be capability, not layout.

## B. Current user mental model (before this pass)

"Create NPC opens a small form. Then a bigger sheet appears later. Am I done?
Which one is the real editor?" — two surfaces for one intent, and the second one
only showed up after the first had already committed something.

## C. Target user mental model (after)

"Create NPC opens the character sheet. There's a starting archetype at the top I
can change. When it looks right, I press Create." — one surface, one draft, one
save.

## D. Product navigation map (actual, traced)

```
main.tsx → App.tsx  (single stateful router: appView + playStage)
├── home ................. Home.tsx            resume + recent + quick access
├── systemLibrary ........ SystemLibrary.tsx   catalog (D&D available; CoC/CPR unavailable)
├── play ................. PlayWorkspace.tsx   D&D only → DndWorkspaceShell
│                                              non-D&D → PausedGameSystemNotice
├── personalHub .......... PersonalContentHub
├── workshop / fanPlaza .. Workshop / FanPlaza
├── documents ............ DocumentLibraryShell
├── profile .............. UserProfileSpace
├── operations ........... PlatformOperationsWorkspace   (admin)
└── server context ....... ServerCampaignWorkspace  ← campaigns, cast, rooms, live
                              └── live → HostedRoomLaunchPanel / RoomLobbyShell
                                          └── LivePlayShell → map / combat / dice / log
```

## E. Canonical capability map

| Capability | Domain owner | Canonical write path | Canonical UI | Disposition |
|---|---|---|---|---|
| Player character | CharacterData | character store / vault | `Creator` (via `DndCharacterCreationDialog`) | KEEP |
| Campaign actor (NPC/monster/PC record) | CampaignActorInstance | `createCampaignActor` / `updateCampaignActor` | **`DndLiteActorSheetPanel`** (create + edit) | KEEP |
| Monster content | DndPrivateMonsterTemplate | monster template API | `DndMonsterTemplateLibraryPanel` | KEEP |
| Token | MapToken | map events | `BasicMapBoard` | KEEP |
| Combatant | Combatant | RuntimeLog `combat.*` | `RoomRuntimeCombatPanel` | KEEP |
| Attack resolution | SystemResolutionProposal | T12 `declareDndAttack` | `RuntimeDndActionPanel` | KEEP |
| Free dice | SharedDiceRollResult | `rollSharedDice` | `SharedDiceDock` | KEEP |
| Map background | MapBoardState.backgroundUrl | `map.background_set` | `BasicMapBoard` | **GAP (§W)** |
| Game system scope | — | — | `publicGameSystemAvailability` | KEEP |

## F. Canonical UI surfaces

One editor per lifecycle object, no exceptions after this pass:

- **Player character** → `Creator`
- **Campaign actor** → `DndLiteActorSheetPanel`, `mode = create | edit`
- **Monster content** → `DndMonsterTemplateLibraryPanel`

## G. Entry-point convergence

| Intent | Entrances | Converge? |
|---|---|---|
| Edit a campaign actor | Campaign cast row · token · combatant · live prep | ✅ same panel |
| Create an NPC | Campaign cast · live prep | ✅ same panel, create mode |
| Create a custom monster | Catalog fallback disclosure | ✅ same panel, create mode |
| Create a player character | Library · room lobby | ✅ same `Creator` |
| Roll dice | Dock · action panel · combat panel | ✅ one server roll path |

## H. Duplicate feature inventory

| Duplicate | Status |
|---|---|
| Lightweight NPC creator vs canonical sheet | **REMOVED this pass** |
| Lightweight custom-monster creator vs canonical sheet | **REMOVED this pass** |
| Workspace-level preset picker vs in-sheet picker | **MERGED into the sheet** |
| `PlayMenu.tsx` (second system menu) | **DEAD — zero importers**, deletion listed |
| CoC/CPR workspace shells vs D&D shell | Removed from routing in the previous pass |
| Import/export system counts naming CoC/CPR | **KEEP** — factual counts about the user's own data, not a launch affordance |

## I. Obsolete frontend inventory

24 files, ~410 KB, all with zero importers. Listed in §Y.

## J. UI consistency findings

- **Fixed:** "Create" now means the same thing in both actor entrances — commit
  the thing you are looking at. Previously "Create campaign actor" meant "make a
  stub and show me an editor later".
- **Fixed:** terminology — "Refresh actor records" → "Refresh list";
  "Campaign combat sheet" → "Character sheet"; "Edit the campaign definition" →
  plain language about what is stored where.
- **Fixed:** empty states — `noActors` now teaches the action ("Add player
  characters, create an NPC, or add a monster") instead of naming a record type.
- **Remaining:** the campaign workspace still presents several controls at equal
  visual weight; live-play chrome and preparation chrome differ more than the
  shared feature identity should allow. Low confidence to fix blind — deferred.

## K–R. Journey findings (condensed)

| Journey | Verdict | Finding |
|---|---|---|
| First-time player | OK | Library → creator → submit → approval → table |
| Returning player | OK | Resume reaches the table |
| First-time GM | **Blocked at map** | Cast and rooms fine; cannot upload a map image |
| Returning GM | OK | Resume works; recovery is authoritative |
| GM preparation | **Fixed** | NPC/monster creation now one surface |
| Live GM improvisation | **Fixed** | Same canonical creation from live prep |
| Host + PC | OK | Ordinary player flow, no fake host character |
| Player combat | OK | Turn → target → action → T12 → result → log |
| Exploration | Partial | Map, chat, dice fine; no conditions (T13) |
| End/resume | OK | Restart recovery verified in earlier passes |

**Token/Actor/Combat chain** (§R): Character → Campaign Actor → Token →
Combatant → RuntimeActor → Action → Result → State → Log → Recovery is
traversable without recreating an entity. `combatantSeedFromProjection` carries
AC and initiative modifier across, so the host does not retype them.

**Chat / activity / log** (§S): there is one runtime log surface
(`RoomRuntimeLogPreviewPanel`) rendering both chat and gameplay events with kind
badges. Not duplicated. The terminology is still engineering-flavoured in
places, but users see rendered sentences, not `RuntimeLog` vocabulary.

## U. Public game system scope

D&D is the only active system. Every exposure point audited:

| Surface | State |
|---|---|
| Home resume / recent | D&D only + one honest line naming the paused systems |
| System library | CoC/CPR `unavailable`, `system` field removed so the card cannot launch |
| PlayWorkspace | D&D only; anything else → `PausedGameSystemNotice` |
| Campaign creation | Paused systems disabled and refused |
| Existing campaigns | Listed, readable, paused notice instead of a retired editor |
| **Dev demo world servers** | **Fixed this pass** — the `MOCK_WORLD_SERVERS` seed in `App.tsx` still advertised `COC 7e` / `Cyberpunk RED` as enabled systems. Dev-only (`VITE_SERVER_WORKSPACE_DEMO`), but a developer with the flag on saw paused systems look enabled. Now D&D-only. |
| Import/export counts | Kept — factual reporting about the user's own saved data |

## V. CoC / Cyberpunk RED retirement

Frontend routing removed in the previous pass; this pass adds `PlayMenu.tsx` to
the dead list and closes the demo-seed leak. **Preserved, untouched:**
`coc-types`, `coc-utils`, `cocMigration`, `cp-types`, `cpMigration`, `cp2024/**`,
`cocStore`, `cpStore`, the rule-data provenance maps, the four vault/rule-source
adapters, and `cocSanUtils`. No record deleted, migrated or converted.

## W. TRPG completeness gap matrix

| Capability | Current state | Usable in a real session? | Severity |
|---|---|---|---|
| Campaign, cast, rooms, lobby, admission | Implemented | Yes | — |
| Character creation, sheets, vault | Implemented | Yes | — |
| NPC / custom monster authoring | Implemented (this pass) | Yes | — |
| Monster catalog | Implemented (user-imported content) | Yes | — |
| Map grid, presets, tokens, movement, targeting | Implemented | Yes | — |
| **Map image upload** | **Missing — no asset transport at all** | **No** | **P0** |
| Initiative, turns, HP/temp HP, damage/healing | Implemented | Yes | — |
| Attack resolution (T12) | Implemented, server-authoritative | Yes | — |
| Chat, free dice, checks | Implemented | Yes | — |
| Persistence, reconnect, restart recovery | Implemented | Yes | — |
| **Typed conditions** | Free-text strings only | Workaround | **P1** (T13) |
| **Resources / spell slots** | Absent | Workaround | **P1** (T14) |
| Handouts / documents to players | Document library exists; no in-session sharing | Workaround | P2 |
| Saving-throw actions (`save_dc`) | Authorable, not resolvable | Workaround | P2 |
| Fog of war / dynamic vision | Absent | Workaround | P2 |
| Token images | Initials/colour only | Workaround | P2 |
| Measurement, AoE templates | Implemented | Yes | — |
| Resistance / vulnerability / immunity | Absent | Manual | P3 |
| Multiattack, reactions, action economy | Absent | Manual | P3 |
| Death saves | Absent (HP floors at 0) | Manual | P3 |

## X. Prioritized roadmap

**P0 — session-blocking**
1. **Platform Asset Pipeline MVP.** Re-verified: `mediaAsset.ts` is types-only
   by its own header; there is no asset HTTP route anywhere on the server; there
   is no frontend asset client; `MapBoardState` has only `backgroundUrl`. The
   metadata tables (`asset_metadata`, `object_storage_refs`) exist and are
   unused. Contract: (1) upload endpoint + object store behind
   `object_storage_refs`, (2) asset read/serve endpoint, (3) frontend client +
   picker, (4) `MapBoardState.backgroundAssetId` through state, event and replay.
   **Not small. Not implemented here.**

**P1 — major normal-session gaps**
2. T13 typed conditions.
3. T14 resources / spell slots.

**P2 — completeness**
4. Saving-throw action resolution. 5. Token images (depends on P0).
6. In-session handouts. 7. Fog of war.

**P3 — later**
8. Resistance/vulnerability. 9. Action economy. 10. Death saves.

## Y. High-confidence fixes implemented

1. **Removed the lightweight NPC creator.** Create NPC now opens
   `DndLiteActorSheetPanel` in create mode immediately.
2. **Removed the lightweight custom-monster creator.** Same surface.
3. **Preset selection moved inside the canonical sheet.** Switching archetype
   re-seeds the draft in place and preserves the typed name, notes and tags.
4. **Deleted the workspace-level preset picker and its state.**
5. **Closed the demo-seed paused-system leak** in `App.tsx`.
6. **Terminology:** three implementation phrases replaced with user language.
7. **Empty states:** `noActors` now teaches the action, in both locales.
8. **`PlayMenu.tsx` identified as dead** (zero importers) and added to removal.

## Z. Deferred architecture decisions

- **Scene model.** `RuntimeSceneBoardPanel`, `SavedSceneLibraryPanel`,
  `SceneRuntimeSnapshotPanel` and `BasicMapBoard` are four surfaces over three
  different notions of "scene". This is confusing but not session-blocking, and
  unifying it is a domain change — explicitly out of scope.
- **Visual hierarchy** of the campaign workspace.
- **Mods / Workshop / scripting**, per the roadmap.
