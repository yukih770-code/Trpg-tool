# Production Flow Consolidation — D&D-Only Public Frontend (V1)

> Scope reduction, not redesign. The public product is D&D-first; Call of
> Cthulhu and Cyberpunk Red frontends are paused while every line of their
> domain code, stores, rule data and saved records is kept.

## 1. Public product scope after this task

| Surface | Before | After |
|---|---|---|
| Home launchpad | 3 system cards (D&D / CoC / CPR), all launchable | 1 card (D&D) + one honest line naming the paused systems |
| System library | D&D, CoC, CPR all `available` and clickable | D&D `available`; CoC and CPR `unavailable` with the library's own disabled state and no `system` field to launch with |
| Play workspace | Switchboard rendering `CocWorkspaceShell` / `CpWorkspaceShell` + legacy embedded bodies | D&D workspace only; a non-D&D selection renders `PausedGameSystemNotice` |
| New campaign | Any bound world-server system selectable | Paused systems shown disabled; creation refuses them; default never pre-selects one |
| Existing CoC/CPR campaign | Opened the full preparation surface | Listed and readable, with a paused notice instead of a retired editor |

## 2. Production journey inventory (traced in the real render tree)

`main.tsx` → `App.tsx` (single stateful router, `appView` + `playStage`) → `PlayWorkspace`
is the system switchboard. `ServerCampaignWorkspace` is the **only** campaign-actor
creation surface in the product — `CampaignLibraryShell`, `DndWorkspaceShell`,
`LivePlayShell` and `PlayWorkspace` contain no `createCampaignActor` call.

| Journey | Real path | Verdict |
|---|---|---|
| A/B D&D player | App → campaign → room → `RoomLobbyShell` → Character Library or `DndCharacterCreationDialog` → submit → approval → live | canonical |
| C host-only | Room entry without a binding | canonical, no fake host character |
| D host + PC | Same lobby binding flow as any player | canonical |
| E GM prep | `ServerCampaignWorkspace` → Campaign Cast → intent buttons | canonical |
| F create NPC | **was** name-only → **now** archetype → canonical sheet → create | **fixed** |
| G add monster | Monster Catalog → campaign actor → canonical sheet | unchanged, still primary |
| H custom monster | **was** name-only → **now** archetype → canonical sheet → create | **fixed** |
| I map/scene | `BasicMapBoard` background presets + URL | **blocked** (§10) |
| J combat | Actor → Token → Combatant → action → T12 | unchanged |
| K live improvisation | Same campaign-cast creation, reachable from the table | unchanged |

## 3. Obsolete branch inventory

| # | Obsolete branch | Why obsolete |
|---|---|---|
| 1 | Name-only NPC creation (`createCampaignActor({displayName, actorKind})`, no payload) | Produced an actor with no abilities, AC, HP or actions |
| 2 | Name-only custom-monster creation (same form) | Same |
| 3 | Create-then-fill ordering | Persisted a half-empty actor before the host had seen anything |
| 4 | `PlayWorkspace` CoC branches: `CocInvestigatorBuilderShell`, `CocSheet`, `CocGameplay`, `CocWorkspaceShell`, `CocBackground` | Built on the pre-IA model |
| 5 | `PlayWorkspace` CPR branches: `CpEdgerunnerBuilderShell`, `CpEdgerunnerSheetShell`, `CpGameplay`, `CpMarket`, `CpWorkspaceShell`, `CpBackground` | Same |
| 6 | `embeddedPlayBody` legacy container + `theme`/`THEMES[system]` lookup | Existed only to host #4 and #5 |
| 7 | `openWorkspaceTab` / `openWorkspaceView` | Callers were only the retired shells |
| 8 | `src/pages/CocCreator.tsx`, `CpCreator.tsx`, `CpSheet.tsx` | **Already zero-importer dead code before this pass** |
| 9 | Home resume card able to resume into a paused system | Would open a retired workspace |
| 10 | Unvalidated map background input | Accepted `file://`, `C:\`, `blob:`, `data:` into a replayed record |

## 4. Canonical replacements

| Old surface | Unique capability | Canonical replacement | Safe? |
|---|---|---|---|
| Name-only NPC form | Name an NPC | Archetype + name → `DndLiteActorSheetPanel` draft → Create | yes |
| Name-only monster form | Name a monster | Same, monster archetypes | yes |
| CoC builder/sheet/gameplay | CoC play | None — paused; `PausedGameSystemNotice` explains | yes, by product decision |
| CPR builder/sheet/gameplay/market | CPR play | Same | yes, by product decision |
| `CocCreator`/`CpCreator`/`CpSheet` | Superseded by the WorkspaceShell builders | Already replaced before this pass | yes |

## 5. Deleted frontend surfaces

23 files, ~406 KB, listed in §14. **They are provably unreachable after this
pass** (sole importer removed), but I could not remove them from disk — see the
limitation in §17.

## 6. Remaining intentional alternate paths

- **PC placeholder record** (name-only, behind an advanced `<details>`): a
  deliberate GM prep note for an absent player. Not an NPC/monster path, and no
  archetype applies to a player character.
- **Non-D&D name-only creation**: retained as a fallback because archetypes are
  D&D-owned. Unreachable in practice while D&D is the only active system.
- **Monster Catalog vs custom monster**: two entrances, one canonical sheet.

## 7. NPC creation final path

```
Campaign Cast → Create NPC
  → archetype picker (Ordinary person / Armed / Scout / Ranged /
                      Spellcaster-like / Skilled expert / Blank)  + name
  → Continue                       ← nothing persisted yet
  → canonical DndLiteActorSheetPanel, driven by an unsaved draft
  → Create actor                   ← ONE createCampaignActor with the full sheet
```

## 8. Monster creation final path

```
Add monster → Monster Catalog (primary, unchanged)
  → select → campaign actor → canonical sheet
Add monster → "没有合适的怪物？" → Create custom monster
  → monster archetype + name → Continue → canonical sheet → Create actor
```

## 9. Character creation final path

Unchanged and already canonical: Character Library / Room / campaign
participation all reach the same `DndCharacterCreationDialog` → `Creator`.

## 10. Scene / Asset — **blocked, exact missing contract**

Local image upload was **not** implemented. Two independent gaps:

**Gap 1 — no asset transport exists.**
- `src/lib/architecture/mediaAsset.ts` states in its own header: *"Types + pure
  helpers + mock seed only. No upload, no object store, no image processing."*
- There is **no asset HTTP route** anywhere on the server (`server/api/**` and
  `server/room-server.ts` expose none).
- There is **no frontend asset API client** in `src/lib/api/`.
- `server/adapters/postgresAssetRepository.ts` exists and migration `0004`
  defines `asset_metadata` + `object_storage_refs` (`provider_kind`, `bucket`,
  `object_key`, `url`, `content_hash`) — but nothing writes bytes to any store,
  and nothing serves them.

**Gap 2 — the map domain cannot reference an asset.**
`MapBoardState` carries `backgroundUrl?: string` and nothing else; the
`map.background_set` event persists that string and replay reads it. Pointing a
map at a durable asset needs a new `backgroundAssetId` on the map state, the
event and the replay — a map-domain + persistence change.

**Required before "Upload local image" can exist**, in order:
1. A binary upload endpoint + object-store implementation behind `object_storage_refs`.
2. An asset read endpoint that serves/redirects to the stored object.
3. A frontend asset API client and picker.
4. `MapBoardState.backgroundAssetId` + event + replay support, resolved through (2).

**What was implemented instead** (inside the existing contract, no new
subsystem): `checkMapBackgroundSource` now refuses `file://`, `C:\`, UNC paths,
`blob:`, `data:` and unknown schemes before they can be persisted into a
replayed, shared map record, with a bilingual message that says local upload is
not available yet rather than implying it works.

## 11. CoC frontend retirement

Removed from public exposure: Home card, System-library launch, and every
`PlayWorkspace` render branch. `PausedGameSystemNotice` replaces the editor for
stored CoC selections and campaigns.

## 12. Cyberpunk Red frontend retirement

Identical treatment, including `CpMarket`.

## 13. Existing-data compatibility

- No record is deleted, migrated or converted. No migration was added.
- CoC/CPR campaigns still list, still load, and show a notice stating plainly
  that records are kept.
- `useCocStore` / `useCpStore` remain live and are still imported by platform
  infrastructure (`actorVaultOwnership`, `actorVaultExportSnapshot`,
  `actorSnapshotAdapter`, `actorVaultRepositoryBridge`,
  `runtimeActorSnapshotSource`), so vault ownership backfill, export and
  snapshot adapters keep working for existing non-D&D characters.
- Home never resumes into a paused system.
- Server-side system ids and validation are untouched, so re-exposing a system
  is a revert of `publicGameSystemAvailability.ts` plus its surfaces.

## 14. Frontend dead code removed

**Deleted (UI only) — 23 files:**

```
src/pages/CocCreator.tsx  CocSheet.tsx  CocGameplay.tsx
src/pages/cocGameplay/{CocChecksPanel,CocDiceTrayPanel,CocGameplayShared,
                       CocRollConsolePanel,CocRuntimeStatePanel,CocSanCheckPanel}.tsx
src/pages/cocWorkspace/CocWorkspaceShell.tsx
src/pages/CpCreator.tsx  CpSheet.tsx  CpGameplay.tsx  CpMarket.tsx
src/pages/cpGameplay/{CpChecksPanel,CpCriticalInjuryPanel,CpDamagePanel,
                      CpDiceTrayPanel,CpGameplayShared,CpRoleAbilityPanel,
                      CpRollConsolePanel,CpRuntimeStatePanel}.tsx
src/pages/cpWorkspace/CpWorkspaceShell.tsx
```

**Removed in place:** `CocBackground`, `CpBackground`, `embeddedPlayBody`,
`theme`/`THEMES[system]`, `openWorkspaceTab`, `openWorkspaceView`
(`PlayWorkspace.tsx`: 700+ → 328 lines).

## 15. Core code deliberately preserved

- `src/lib/coc-types.ts`, `coc-utils.ts`, `cocMigration.ts`
- `src/lib/cp-types.ts`, `cpMigration.ts`, `src/lib/cp2024/**`
- `src/store/cocStore.ts`, `src/store/cpStore.ts`
- `src/lib/rules/cocCpRuleDataMetadata.ts`, `rulesDataSourceMap.ts`
- **Data adapters kept although now unreferenced** (domain glue, not UI):
  `cocWorkspace/cocActorVaultAdapter.ts`, `cpWorkspace/cpActorVaultAdapter.ts`,
  `cocWorkspace/cocRuleSourcesAdapter.ts`, `cpWorkspace/cpRuleSourcesAdapter.ts`,
  `cocGameplay/cocSanUtils.ts`
- `THEMES.CoC` / `THEMES.CP` presentation constants, so restoring a system does
  not mean re-deriving its palette

## 16. Tests

New: `frontend:verify:public-system-scope` — 49 assertions covering the
availability policy, the paused-notice promises, and every rejected map
background value (`file://`, `C:\`, UNC, `blob:`, `data:`, `javascript:`, empty).

No backend or security assertion was weakened.

## 17. Remaining limitations

1. **File deletion could not be performed.** The device shell is unavailable, so
   the bridge can write files but not remove them. The 23 files are unreachable
   from any render path but still on disk; §14 is the exact removal list.
2. **Browser verification could not run.** No dev server was reachable and this
   container cannot run Vite (Windows-only native binaries in `node_modules`).
3. **Scene local upload remains blocked** — §10.
4. `src/lib/mod-utils.ts` / `modManager.ts` were left untouched (Mod work is
   explicitly out of scope).
5. i18n keys for the retired CoC/CPR surfaces were left in place; they are inert
   and removing them is cosmetic churn with restore cost.
