# D&D Platform — Code-First Audit Snapshot (2026-08-18)

<!-- AI-LANDMARK: DND_CODE_FIRST_AUDIT_2026_08_18 -->

Status: **historical audit snapshot. Not a status source, not a contract, not a roadmap.**

- This document records what the repository looked like on 2026-08-18 during a read-only,
  code-first audit. It is frozen; later work does not update it.
- The authoritative current-status source remains `CURRENT_PLATFORM_STAGE.md`. If this
  document and `CURRENT_PLATFORM_STAGE.md` disagree, `CURRENT_PLATFORM_STAGE.md` wins.
- Enforcement level: **Level 3 (reference)** under `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md`.
  It creates no binding requirement and overrides no Level 0 / Level 1 contract.
- The milestone and task proposals in sections 9–12 are a recommendation captured at the
  time of the audit, not an approved plan. Approved sequencing lives in
  `ECOSYSTEM_AND_AI_ROADMAP.md` and `docs/ai/ACTIVE_TASK.md`.
- File paths and line numbers cite the tree as of 2026-08-18 and will drift.

---

**Repository:** `D:\Download\dnd`
**Date:** 2026-08-18
**Method:** read-only inspection of current source, migrations, routes, smoke scripts and UI components. Documentation used as context only; every load-bearing claim below is anchored to a file. Nothing was modified; nothing was committed; `output/`, `tools/`, `work/` were not touched.

---

## 1. Executive assessment

**What this product really is today:**

> A genuinely working **single-node multiplayer virtual tabletop** — identity, world server, campaign, room, lobby admission, map/token, initiative table, shared dice, projected logs and durable restart recovery are all real and server-enforced — wrapped around a **D&D character builder that is deep on character *construction* and almost absent on character *play*.**

The platform half is much further along than the docs suggest, and the D&D half is much shallower **at the table** than the builder makes it look.

Three structural facts define the current state:

1. **The character you build is not the character you play.** The Builder produces a rich `CharacterData` (classes, subclasses, feats, level-up, multiclass, class resources, pact magic). None of it reaches the live room. The Room Runtime's D&D action list is read from a *separately hand-typed* "lite actor sheet" (`dndLiteActorSheetV1`) plus a list of spell *names* — see `server/services/projectRoomRuntimeActorProjections.ts:74-131`. HP and AC submitted to a room are typed by hand into three text inputs in the lobby (`src/components/platform/RoomLobbyShell.tsx:186-188, 506-520`).
2. **There are three parallel "runtime" surfaces**, with different data, different authority and very different D&D depth: `CampaignRuntimeShell` (local, no server), `RoomRuntimeEntryBridge` (the real multiplayer table), and `ServerCampaignWorkspace` (a campaign admin page that also embeds a map board, combat table, monster library and the *best* D&D dice/attack/damage panel in the repo — behind a `<details>` disclosure, and unavailable to players). Evidence: `src/components/platform/ServerCampaignWorkspace.tsx:670-770`.
3. **The rules data is honestly labelled and honestly thin.** 20 runtime spells vs. 507 display-only indexed entries (`src/data/spells.ts`, `src/data/dnd2024/spellIndex.ts`, counts confirmed in `src/data/dnd2024/characterOptionsIndex.ts:200`). Equipment is a display-only catalog; AC is a manual modifier (`10 + character.acMod`, `src/pages/Creator.tsx:906`). This is the *correct* posture given the source policy — but it means a real session cannot be run from the character sheet.

The engineering discipline here is unusually high (permission projection, durability circuits, idempotent event streams, honest empty states, source/trust metadata on every rule dataset). The gap is not quality. The gap is that **the vertical slice "my character does a thing at the table" is not closed.**

---

## 2. Real D&D flow map

Legend: ✅ real · 🟡 partial · 📄 display-only · ✋ manual · 🧪 placeholder · ❌ absent

| Stage | State | Evidence |
|---|---|---|
| Character creation (identity/species/background/class/abilities/feats) | ✅ real, deterministic validation, atomic commit | `src/lib/dnd2024/dndLevelOneCharacter.ts` (`evaluateDndLevelOneReadiness`, `finalizeDndLevelOneCharacter`); `src/pages/Creator.tsx:32-42, 946-957` |
| Legal-option filtering | 🟡 within the 12 classes / 9 species / 16 backgrounds actually in data; every dataset carries `needs-human-check` metadata | `src/data/classes.ts` (12 entries), `src/lib/rules/rulesDataSourceMap.ts:193-199` |
| Missing/conflicting choice feedback | ✅ good — blockers deep-link to the offending section | `src/pages/Creator.tsx:920-930` |
| Level up | ✅ real plan → validate → commit → receipt → safe rollback | `src/lib/dnd2024/dndLevelAdvancement.ts` (`DndLevelAdvancementPlan`, `DndLevelAdvancementReceipt`) |
| Multiclass | 🟡 level allocation + prerequisites *flagged*, combined spellcasting explicitly deferred | issue codes `multiclass-prerequisites-unverified`, `combined-spellcasting-deferred`, `multiclass-automation-deferred` in `dndLevelAdvancement.ts:24-38` |
| Spells (selection) | 🟡 only ~20 runtime spells selectable; class spell lists not modelled | `src/data/spells.ts` (20 `name_en` entries); `src/lib/dnd2024/dndSpellAvailability.ts:1-13` states the limitation |
| Spells (browse) | 📄 507-entry source index, display-only, never promoted | `src/data/dnd2024/spellIndex.ts:12-19` |
| Equipment | 📄 starter-equipment plan rendered as non-interactive `<span>` chips; nothing materialises into inventory | `src/pages/Creator.tsx:853-882` |
| Inventory | ✋ separate manual panel on the Sheet | `src/pages/sheet/CharacterInventoryPanel.tsx`, `src/lib/platform/characterInventory.ts` |
| AC | ✋ manual modifier, no armour derivation | `src/pages/Creator.tsx:906` (`10 + character.acMod`) |
| Class resources / pact magic | ✅ structured, initialised, manually spent + rest recovery — **only in the solo `Gameplay` page** | `src/lib/dnd2024/resource-utils.ts`, `src/pages/Gameplay.tsx` (contains **zero** references to room/socket) |
| Character library ("Actor Vault") | 🟡 real, but **browser-local** (`zustand/persist`, key `dnd-character-storage`) | `src/store/characterStore.ts:201, 739`; `src/lib/platform/actorVaultRepositoryBridge.ts:1-16` |
| Cloud character record | 🟡 created lazily *at room-submit time only* | `src/lib/platform/actorVaultCloudSync.ts:23-26` |
| Join campaign / room | ✅ real: create → join → host approve → membership | `server/room-server.ts:683, 748, 877, 895` |
| Submit character to room | 🟡 real API + ownership canonicalisation, but **HP/AC/summary are hand-typed** | `server/room-server.ts:918-989`; `src/components/platform/RoomLobbyShell.tsx:186-188, 506-520` |
| Host review / approval | 🟡 real approve/reject + campaign-actor linkage; the "clearance" shown is **display metadata, not a legality engine** | `server/services/approveActorBinding.ts`, `linkApprovedRoomBindingToCampaignActor.ts`; `src/lib/platform/characterClearanceDetails.ts:3-8` ("not a character sheet, legality engine, or runtime actor state"); `src/lib/platform/characterClearanceTypes.ts:5-9` ("does NOT enforce clearance") |
| Ready + enter Runtime | ✅ real, invariant-checked (active + approved binding + ready) | `src/components/platform/RoomLobbyShell.tsx:384-389`; `server/room-server.ts:1047` |
| Runtime shell | ✅ real: host/player/spectator projection, map stage, actor rail, action dock, log drawer | `src/components/platform/RoomRuntimeEntryBridge.tsx:950-1085` |
| Map / tokens | ✅ real: grid, snap, measurement, area templates, background presets, hidden tokens, per-member move grants, shared ruler previews | `src/components/platform/BasicMapBoard.tsx`; `server/room/roomTokenControlGuard.ts` |
| Fog of war / vision / walls / uploaded battle maps | ❌ | background is preset or URL only (`BasicMapBoard.tsx:729`) |
| Dice | 🟡 server-authoritative but **grammar has no advantage/disadvantage, no DC, no crit** | `src/lib/platform/sharedDiceExpression.ts:1-13` ("No parentheses / \* / kh / kl / advantage / exploding") |
| Rich D&D rolls (advantage, DC compare, attack vs AC, crit damage) | 🟡 fully implemented — **but only reachable from the campaign admin page, not the live table** | `src/lib/dnd/dndDiceRoller.ts:90-197`; consumed by `src/components/platform/DndDiceCheckPanel.tsx`, mounted only in `ServerCampaignWorkspace.tsx:736` |
| Player actions in Runtime | 🟡 a **roll launcher only** — self-described | `src/components/platform/RuntimeDndActionPanel.tsx:12-18` ("deliberately a roll launcher, not an authority surface") |
| Player HP / resources / spell slots during play | ❌ the runtime character panel is read-only | `src/components/platform/RuntimeCharacterSheetPanel.tsx:8-19` ("READ-ONLY … NEVER … edits an actor") |
| Short/long rest in Runtime | ❌ no occurrences of rest in any `components/platform/*` |
| Initiative / turn order | ✅ present and host-driven; **initiative is rolled on the host's client with `Math.random`** and the numbers are trusted | `src/lib/combat/useCombatRuntimeTable.ts:117-140`; `src/lib/combat/combatRuntimeTypes.ts:152-176` |
| Combat state authority | 🟡 server enforces *who* (host-only for `combat.*`), never *what* | `server/services/appendRuntimeLogEvent.ts:104-118` |
| Conditions | 🟡 free-text strings with 8 quick chips; no mechanical effect | `src/components/platform/RoomRuntimeCombatPanel.tsx:82` |
| Public info / handouts | 🟡 title + body text only; no images or attachments | `src/components/platform/RuntimePublicInfoPanel.tsx` |
| Logs | ✅ append-only, per-viewer projected, host-only visibility respected | `server/room/roomRuntimeVisibilityProjection.ts`; `server/room-server.ts:1073-1110` |
| Persistence / reconnect | ✅ strong: durable-append confirmation, durability circuit-breaker, startup recovery of lobbies + admissions + logs + map, WS cursor catch-up | `server/services/liveRoomDurabilityCircuit.ts`, `restoreRoomActorAdmissions.ts`, `server/room-server.ts:1350-1400`, `src/lib/platform/roomSocketClient.ts:84-150` |
| Session recap | 🟡 a copyable markdown draft inside the live log drawer | `src/components/platform/RoomRuntimeLogPreviewPanel.tsx:154-158, 420-480` |
| Post-session review (after the room is disbanded) | ❌ no surface lists past runtime sessions; disband tells the user history is kept, but nothing reads it back | `src/components/platform/RoomRuntimeEntryBridge.tsx:942` |

---

## 3. Critical product gaps, ordered by impact on actually playing D&D

1. **You cannot roll with advantage at the table.** The live-room grammar forbids it by design (`sharedDiceExpression.ts:11-12`). Advantage/disadvantage is the single most-used D&D 2024 mechanic. The code to do it correctly already exists in `dndDiceRoller.ts` but is wired to the wrong surface.
2. **The character sheet does not power the character's actions.** Runtime attack/damage buttons come from `dndLiteActorSheetV1` — an ad-hoc sheet someone must fill in by hand — not from the built character (`projectRoomRuntimeActorProjections.ts:74-89`).
3. **Players cannot track their own state during play.** No HP change, no temp HP, no spell slot spend, no class resource spend, no conditions, no rest. Everything routes through the host's combat table.
4. **HP and AC are typed by hand into the lobby** every time a character is submitted, and are not prefilled from the selected character (`RoomLobbyShell.tsx:506-520`; `selectVaultActor` sets only name + subtitle).
5. **Casters cannot bring their real spells.** 20 runtime spells; class spell lists unmodelled; the 507-entry index is display-only.
6. **The characters live in one browser.** `dnd-character-storage` in localStorage; the cloud record is only created at submit time. New device = no characters.
7. **The best D&D host tooling is on the wrong page.** Monster template library, D&D check/attack/damage panel with DC and damage chaining, scene snapshots and saved scenes exist only in `ServerCampaignWorkspace`, behind a collapsed `<details>`, and only for `canManageServer`.
8. **No equipment ever materialises.** Starter equipment is text chips; inventory is a separate manual list; AC is a number you type.
9. **Two write paths into the same `runtime_events` stream** (see §4) — a live-room event path and a campaign-API event path that bypasses the in-memory authority and the WebSocket broadcast.
10. **No post-session artefact.** The recap is a clipboard string that dies with the room view.
11. **The multiplayer surface is Chinese-only.** `RoomLobbyShell.tsx` has 104 hardcoded Chinese literals and **zero** `t()` calls; `RoomRuntimeEntryBridge.tsx` 62/0; `RoomRuntimeCombatPanel.tsx` 62/0 — while `src/i18n/locales/en.ts` is 100 KB.
12. **No URL routing.** `src/App.tsx` is a hand-rolled `AppView` state machine (line 47); refresh loses your place, and you cannot link a player to a room.

### Gap table by requested category

| | Area | Verdict |
|---|---|---|
| A | Rules completeness | Level 1 + advancement are real and deterministic. Everything downstream of "which options exist" (spell lists, equipment mechanics, AC, attacks, conditions, concentration, action economy, rests) is 0–2 on the repo's own 0–6 coverage scale (`docs/rules/DND_RULE_COVERAGE.md` §3–4). |
| B | Character builder UX | Strong: sectioned workbench, live todo list, blockers that deep-link. Weak: equipment step is read-only, spell step is visibly starved, ability step and review are the only places that feel finished. |
| C | Sheet / gameplay UX | The deep sheet (`Sheet.tsx`, `Gameplay.tsx`) is solo-only and has no room integration whatsoever. |
| D | Campaign preparation | Real campaign/room/actor CRUD, saved scenes, monster templates — but scattered across an admin workspace whose language is infrastructural (`runtimeSessionId`, `lobbySlotId`, `sourceId:`). |
| E | Lobby / admission | Genuinely good: invariant-checked ready state, review queue counts, host approve/reject, personal-content references validated server-side. Marred by the manual HP/AC fields. |
| F | Runtime ergonomics | Dock + rail + inspector + mobile HUD is a real design. Panels stay mounted across tool switches (`RuntimeActionDock.tsx:27-29`) — good. Missing: any player-side write. |
| G | Map / token | The most complete part of the D&D experience. Missing fog/vision/uploads/layers. |
| H | Combat | Initiative, turn/round, damage/heal/temp HP, conditions, defeat — all present, all host-only, all client-computed. |
| I | Spell / action / resource execution | Absent in multiplayer. Present but manual in solo. |
| J | Persistence / reconnect | The strongest area of the codebase. |
| K | Host tools | Split across three pages; the richest ones are not at the table. |
| L | Player tools | Thin: roll a formula, read a summary, read public info. |
| M | Logs / recap / history | Live log is excellent. Post-session is absent. |
| N | Content / source / version | Excellent provenance model, weak promoted content; personal packs have immutable versions + export/import + room-scoped references. |
| O | Multiplayer authority | Correct within one process; explicitly single-instance. |
| P | UI consistency | Three runtime shells, two dice systems, two character lists, audit vocabulary in user surfaces. |

---

## 4. Architecture and authority findings

**What the server genuinely enforces.** `server/room/roomRuntimePermissionGuard.ts` binds a claimed `memberId` to the authenticated viewer before any action, rejects closed rooms, and evaluates `canRoomRuntimeAction` with host-granted per-member map grants. Token moves get a dedicated verifier that checks the mover owns the admitted binding (`roomTokenControlGuard.ts` → `resolveVerifiedRoomTokenMove`). RuntimeLog events are server-stamped (`eventId`, `createdAt`, `seq`, `campaignRef` copied from the room, never the body) and `actorBindingId` is validated against approved bindings (`appendRuntimeLogEvent.ts:120-127`). Per-viewer projection is applied on both HTTP and WebSocket paths. This is real authority, not a shell.

**Where authority stops.** The server validates the *actor* of a combat event, never the *content*:

```ts
// server/services/appendRuntimeLogEvent.ts:107
const requiresHostAuthor = input.kind === 'host.note' || visibility === 'hostOnly' || input.kind.startsWith('combat.');
```

Initiative values, HP deltas, AC, conditions and turn order are computed on the host's browser (`useCombatRuntimeTable.ts:117-140` rolls `Math.floor(Math.random() * 20) + 1`) and stored verbatim. Combat state is then *replayed from the log* on every client (`combatRuntimeReplay.ts`). This is a defensible "host is the referee" model, but it should be stated as such — it is not the same guarantee as the map/dice paths, which are server-computed.

**Dual write path into one event stream — the most serious finding.**

- Path 1 (live room): `POST /rooms/:roomId/runtime-log/events` and `POST /rooms/:roomId/map-events` → in-memory registry → durable mirror into the room's `runtime_session` → WebSocket broadcast (`server/room-server.ts:1113, 1192`).
- Path 2 (campaign admin): `POST /api/.../rooms/:roomId/runtime-session/events` (`server/api/campaignRoomApiRoutes.ts:87`), used by `ServerCampaignWorkspace`'s map board, combat table and D&D dice panel (`handleAppendMapEvent`/`handleAppendCombatEvent`/`handleAppendDndEvent`, `ServerCampaignWorkspace.tsx:390-400`).

The live room binds its `runtime_session` to the room (`prepareLiveRoomRuntimeSession`, `liveRoomRuntimeLogPersistence.ts:123-160`). If a host has the campaign workspace open while a session is live, path 2 writes into the same session, is **not** reflected in the in-memory registry, is **not** broadcast to players, and *is* replayed on restart. That is a silent divergence between what players saw and what the room recovers.

Related: the two paths use different event vocabularies. `dnd.attack_rolled` / `dnd.damage_rolled` (emitted by `dndDiceRoller.ts`) are **not** in the live room's `VALID_KINDS` (`appendRuntimeLogEvent.ts:32-39`), so a D&D attack roll can only exist in the campaign-API stream.

**Single-instance.** `createInMemoryRoomRegistry` (`server/room-registry.ts`), `createInMemoryRuntimeLogRegistry`, `createInMemoryRoomMapRegistry`, `createInMemoryActorAdmissionRegistry` are all process-local. Restart recovery reads them back from Postgres; a second process would serve stale rooms. `CURRENT_PLATFORM_STAGE.md` states this correctly.

**Frontend convenience state acting as truth.** `useCharacterStore` (zustand `persist`, `dnd-character-storage`) is the only home of a D&D character until the moment of room submission. The Actor Vault library page reads only local stores (`actorVaultRepositoryBridge.ts:18-21`); cloud actors are listed exclusively inside `RoomLobbyShell.tsx:254`. Two lists, one product concept.

**Good boundaries that should be preserved.** `ActorVaultActor` → cloud `Actor` → `CampaignActorInstance` (with `overridePayload` vs `snapshotPayload`) → `RoomActorBinding` (+ `clearance`) → `ActorAdmission` → `RoomRuntimeActorProjection` → `MapToken`/`Combatant` are genuinely distinct objects with distinct storage and distinct projections. Do not collapse them. `projectRoomRuntimeActorProjections.ts:140-155` correctly refuses a campaign record whose `campaignId` or `ownerId` does not match the binding.

---

## 5. D&D rules / data findings

| Dataset | Location | Runtime? | Provenance |
|---|---|---|---|
| Classes (12) | `src/data/classes.ts` | ✅ | `applyDndClassSubclassMetadata`, source-labelled; Artificer indexed but deliberately excluded |
| Class progression | `src/data/dnd2024/classProgression.ts` (56 KB) | ✅ drives level-up, slots, pact magic | `needs-human-check` on values |
| Species (9) / Backgrounds (16) / Feats | `src/data/races.ts`, `backgrounds.ts`, `feats.ts` | ✅ selection only | mixed `ai-assisted-unverified` → local-CHM matched |
| Spells — runtime | `src/data/spells.ts` | ✅ 20 entries with effects | per-spell metadata, some `needs-human-check` |
| Spells — index | `src/data/dnd2024/spellIndex.ts` | 📄 507 (SRD 391 / TCoE 21 / XGtE 95) | name/level/school/class only, explicitly *not* runtime |
| Equipment (85 rows) | `src/data/dnd2024/equipment.ts`, `src/lib/dnd2024/dndItemDefinitions.ts` | 📄 catalog | local CHM matched; "display/catalog only; do not wire attacks, mastery, ammunition" |
| Monsters | Postgres `dnd_private_monster_templates` (migration `0011`) + importer `server/tools/importPrivateDndMonsters.ts` | ✅ but only in campaign workspace | owner-imported private data |
| Personal content (10 kinds) | `dndPersonalContentDefinitions.ts`, `dndPersonalContentAdapter.ts`, personal compendium packs | ✅ real: immutable versions, export/import envelope, room-scoped references | owner-authored |
| Source map | `src/lib/rules/rulesDataSourceMap.ts` (26 KB) | — | per-dataset `source` / `trustLevel` / `usagePolicy` / `sourceRef` |

**Executable vs declarative.** Executable today: ability/skill/save modifiers, proficiency bonus, spell-slot and pact-magic progression, class-resource pools and rest recovery, HP at level 1 and per level, multiclass level allocation, dice formula parsing, distance/template geometry. Declarative only: every spell effect, every feat effect, every weapon property and mastery, armour → AC, conditions, concentration, action economy, reactions.

**Duplicate rule truth (three instances, all worth resolving):**
1. Two dice engines — `src/lib/dnd/dndDiceRoller.ts` (D&D semantics, client RNG) vs `src/lib/platform/sharedDiceExpression.ts` + `server/services/rollSharedDice.ts` (generic grammar, server RNG). Different capabilities, different event kinds.
2. Two D&D "sheets" — `CharacterData` (`src/lib/dnd-types.ts`, the real builder output) vs `DndLiteActorSheet` (`src/lib/dnd/dndLiteActorTypes.ts`, hand-entered, and the *only* one Runtime reads).
3. Two combat tables — `CombatRuntimeTable` (campaign workspace, DB events) vs `RoomRuntimeCombatPanel` (live room, RuntimeLog events), both built on `useCombatRuntimeTable`.

**Model-memory contamination.** I found no evidence of invented rules text being passed off as sourced. The opposite: `spellRow()` writes the literal string `'needs-human-check'` into `nameCn`/`school` when a row is unverified (`spellIndex.ts:82-95`), and legacy datasets carry `trustLevel: 'ai-assisted-unverified'` with `usagePolicy: 'needs-human-verification'` (`src/data/spells.ts:4-10`). This discipline is an asset — keep it.

---

## 6. UX findings

**Developer/audit language in user surfaces.**
- `sceneLabel="Runtime Alpha"` rendered in the live runtime header (`RoomRuntimeEntryBridge.tsx:958`).
- The D&D workspace has a whole **"sources"** view listing `sourceId: dnd5echm-srd52-primary` and trust badges (`DndWorkspaceShell.tsx:863-888`), plus a **"compendium"** view that is a table of *counts*, not a browsable reference (`:836-861`).
- `ServerCampaignWorkspace` shows `lobbySlotId`, `runtimeSessionId`, `participantStatus`/`membershipStatus` raw (`:663-672`).
- `CampaignRuntimeShell` renders four participant rows whose value is the literal `campaignRuntime.status.placeholder` (`:202-206`).

**Competing navigation.** No router (`App.tsx:47`, and `TEST_CHECKLIST.md:546` actively forbids adding one). Navigation is an `AppView` + `dndWorkspaceView` + `systemWorkspaceView` triple plus a hand-rolled breadcrumb/parent map (`App.tsx:433-457`) and a history stack. Consequences a user feels: no deep link to a room, refresh returns to Home, and browser Back does something different from the in-app ←.

**Fragmented D&D workflow.** To play one session a player passes through: System Library → D&D workspace → characters → Builder → Sheet → (back out) → campaigns → join panel → room lobby → *retype HP/AC* → wait for approval → ready → Runtime. Context (which character, which campaign) is carried by ad-hoc `returnTo` context objects (`DndWorkspaceShell.tsx:457-497`) rather than a route.

**Character information during Runtime.** Reachable, but read-only and shallow: dock → 我的角色 → summary + inventory highlights (`RuntimeCharacterSheetPanel.tsx`). No spells, no features detail, no resources you can spend.

**Host vs player separation.** This is done *well*. `buildRuntimeDockActions` (`RuntimeActionDock.tsx:277-340`) returns disjoint action sets per role; host-only panels are `undefined` for players rather than disabled; spectators get exactly one action. The mobile dock keeps ≤3 primary actions with a More overflow (`splitRuntimeDockActionsForMobile`). Keep this pattern.

**Modal discipline.** Good — the dock uses mounted-but-hidden floating panels with single-open coordination and Escape-to-close, not dialogs. The main modal offenders are elsewhere: `window.confirm('确认解散房间？…')` (`RoomLobbyShell.tsx:623`) and the level-advancement dialog.

**Empty / loading / error states.** Consistently present and honest across lobby, runtime, workshop and AI settings (`AiSettingsPanel.tsx:80` labels Cloud API "Not connected yet" and disables it). Workshop and Fan Plaza show true empty states — `communityMockData.ts` and `workshopPackageSeed.ts` were deliberately emptied.

**i18n.** The entire multiplayer product is untranslated:

| Component | Hardcoded CN literals | `t()` calls |
|---|---:|---:|
| `RoomLobbyShell.tsx` | 104 | 0 |
| `RoomRuntimeEntryBridge.tsx` | 62 | 0 |
| `RoomRuntimeCombatPanel.tsx` | 62 | 0 |
| `RuntimeCharacterSheetPanel.tsx` | 42 | 0 |
| `RuntimeDndActionPanel.tsx` | 28 | 0 |
| `Creator.tsx` | 39 | 123 |

**Natural future inline-AI seams** (do not build yet, but note them): the Builder's blocker list (`Creator.tsx:920-930`) wants "why is this illegal / what would fix it"; the host review panel wants a ranked legality summary; the runtime log drawer already hosts the session-assistant entry; the campaign workspace wants NPC/location drafting. All three already have deterministic validation to sit behind — which is the right order.

---

## 7. Test coverage findings

**Shape:** 178 npm scripts, **155 of them `*:verify:*`**, each running a hand-written `tsx` assertion module. There is **no test runner** (no vitest/jest/playwright in `package.json`), no component tests, no browser E2E.

**Meaningfully covered journeys:**
- `server/api/verifyPrivateAlphaTwoAccountProtocol.ts` (48 KB) — the crown jewel. Two real accounts over HTTP + WebSocket: login → world server → campaign → live room create → join → pending-applicant isolation → host approve → actor binding submit/approve → ready → combat start (and rejection of a non-host start) → turn advance → own-token move before/after grant → hidden-token host-only broadcast → host-only log rejection for players → projection convergence → reconnect catch-up → disband → fixture cleanup.
- `server/api/verifyPrivateAlphaRestartRecovery.ts` — offline appends, restart, lifecycle/admission/log/map recovery.
- Per-slice DB read/write/schema-readiness smokes for all 11 migrations.
- Deterministic domain smokes: level advancement, multiclass, class progression batches 1–5, subclass source batches 1–4, level-one readiness, dice roller, combat replay, map replay, visibility projection, permission resolver, token ownership, clearance details, room lobby presentation, socket reconnect.

**Not covered at all:**
- Every UI component. Zero React tests.
- **The Builder as a flow** — no test creates a character through `Creator.tsx`; only the pure readiness/finalize functions are tested.
- Spell selection, preparation limits, equipment step, inventory.
- The `dndLiteActorSheetV1` → `RoomRuntimeDndActionShortcut` projection is smoke-tested (`projectRoomRuntimeActorProjectionsSmoke.ts`) but nothing tests that the shortcuts a player sees match the character they submitted (they can't — the link doesn't exist).
- The campaign-API runtime-event write path against a concurrently live room (the divergence in §4 is untested in either direction).
- Solo `Gameplay.tsx` resource/rest/spellcasting flows.
- Anything requiring a browser: reconnect *in the UI*, dock behaviour, mobile HUD.

**Practical note:** the strongest tests require a running server + Postgres + `E2E_PRIVATE_ALPHA_ACCESS_CODE`, so they are release-gate tests, not CI-on-every-commit tests.

---

## 8. Documentation drift (most important only)

1. **A Level-0 binding gate contradicts the repository.** `docs/architecture/AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` §11 "Do not implement early" forbids: *real multiplayer, complete permissions, complete `CampaignMembership`, complete `CampaignActorInstance`, complete map/Scene/Token, backend/WebSocket/account system.* Every one of those now exists and is under test. Because §1 makes this document a mandatory execution gate for every task, and §15 makes "MVP scope conflicting with a higher-priority contract" a **stop condition**, this drift will keep forcing false stops. It needs a scoped correction (mark §11 as a superseded phase note) before implementation resumes.
2. **`DATA_MANAGEMENT_MVP_SCOPE_V1.md` is still listed as a triggered Level-1 contract** in `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` §5 for "data management, local stores, backup, import, export" — with an enforcement requirement of "Do not implement backend, multiplayer, full permissions…". Same problem, one level down.
3. **`PROJECT_STATUS.md:6` still describes the product as "Multi-system TTRPG character manager."** The file is 123 KB of append-only history whose top-of-file summary is two product generations old. `CURRENT_PLATFORM_STAGE.md` is accurate and should be the only file anyone reads for status.
4. **`README.md` claims more D&D depth than exists at the table.** "地图、Token、测距/范围、公开信息、投骰、先攻与回合" is true; but the adjacent claim that the D&D 车卡 chain is the most complete part reads, to a new contributor, as if the sheet drives play. It does not.
5. **`docs/rules/DND_RULE_COVERAGE.md` is the most accurate document in the repo** (2026-06-13) — its 0–6 coverage scale and "Data Integrity Warning" match the code exactly. It is under-referenced relative to its value.
6. **`ECOSYSTEM_AND_AI_ROADMAP.md` item 5 names "战役 / Session AI 循环" as the current chain.** Under the new priority this is no longer next; the roadmap needs re-sequencing rather than rewriting.
7. Minor: `@google/genai@^1.29.0` is declared in `package.json:191` and imported nowhere — a dead dependency that implies a cloud AI integration that `modelRoutingGateway.ts:107` correctly reports as `not-implemented`.

---

## 9. Recommended next 3 milestones

### Milestone A — "The character I built is the character I play"
Close the loop from `CharacterData` → deterministic combat profile → room submission → Runtime action surface. Nothing new invented; derive from what already exists and stop asking the user to retype it. **This is the single highest-value milestone.**

### Milestone B — "The table is comfortable"
Server-authoritative D&D roll semantics (advantage/disadvantage, DC, attack-vs-AC, crit) in the live room; player-owned state changes (HP, temp HP, conditions, spell slots, class resources, rest) as first-class logged events; consolidate host combat tooling into the live room instead of the admin page.

### Milestone C — "The session survives the session"
One authoritative runtime write path; account-scoped character vault (not per-browser); post-session history and review reachable after the room closes.

Deliberate ordering note: A before B because B's ergonomics are worthless if the numbers being rolled are hand-typed. C after both because it is continuity, not playability — with **one exception**: task 7 below (closing the dual write path) is a correctness fix and should be done as soon as it can be scheduled.

---

## 10. Recommended next 10 implementation tasks

Each is a vertical slice: entry → deterministic core → persistence → UI state → test.

---

**T1 · Server-authoritative D&D roll semantics in the live room**

- *User problem:* a player at the table cannot roll with advantage/disadvantage, cannot roll against a DC, and cannot roll a critical.
- *Evidence:* `src/lib/platform/sharedDiceExpression.ts:11-12` explicitly excludes them; `src/lib/dnd/dndDiceRoller.ts:90-197` already implements them correctly but is only mounted in `ServerCampaignWorkspace.tsx:736`.
- *Change:* extend the shared, RNG-injected grammar with `adv`/`dis` (2d20 keep-highest/lowest) and an optional `dc`; add a `dnd.check`/`dnd.attack`/`dnd.damage` payload shape to the existing `dice.roll` RuntimeLog kind (or add the kinds to `VALID_KINDS`); server computes outcome, client only labels.
- *Modules:* `src/lib/platform/sharedDiceExpression.ts`, `sharedDiceTypes.ts`, `server/services/rollSharedDice.ts`, `server/services/appendRuntimeLogEvent.ts`, `src/components/platform/SharedDiceDock.tsx`, `RuntimeDndActionPanel.tsx`.
- *Boundaries:* `LogEvent` + `Projection`; `Server State`. No object-layer change.
- *Risk:* low. Grammar must stay shared-compilable (no `node:crypto`/DOM imports — see the NodeNext note at `sharedDiceExpression.ts:15-17`). Existing `dice.roll` payloads must keep parsing.
- *Validation:* extend `frontend:verify:dnd-dice`; new server smoke for the grammar; add an advantage roll + DC outcome assertion to `verifyPrivateAlphaTwoAccountProtocol.ts`.
- *Schema/API:* no schema. Additive payload fields only.
- *Polish:* **before** UI polish.

---

**T2 · Deterministic D&D combat profile derived from `CharacterData`**

- *User problem:* HP, AC, attack bonuses and save DCs are hand-typed in the lobby and again in the lite sheet.
- *Evidence:* `RoomLobbyShell.tsx:186-188, 506-520` (three free-text inputs); `Creator.tsx:906` (`10 + character.acMod`); `projectRoomRuntimeActorProjections.ts:74-89` reads a hand-entered sheet.
- *Change:* a new pure module `src/lib/dnd2024/dndCombatProfile.ts` that computes, from `CharacterData` + equipped items: AC (armour + shield + Dex cap), initiative bonus, proficiency bonus, save/skill modifiers, spell save DC and spell attack bonus, and one attack entry per equipped weapon (ability choice, proficiency, damage die + modifier). Emit an explicit `unresolved[]` list for anything the current data cannot support rather than guessing.
- *Modules:* new `dndCombatProfile.ts`; consumed by `dndActorVaultAdapter.ts`, `RoomLobbyShell` (prefill, read-only), `characterClearanceDetails.ts`.
- *Boundaries:* `OwnedObject` → submission projection. Pure function; writes nothing.
- *Risk:* medium — this is where invented rules could creep in. Hard rule: every number must trace to `equipment.ts` / `classProgression.ts` / `CharacterData`; anything else goes in `unresolved[]`.
- *Validation:* new `frontend:verify:dnd-combat-profile` with fixture characters per class; assert `unresolved` is populated (not silently defaulted) when data is missing.
- *Schema/API:* none.
- *Polish:* **before**.

---

**T3 · Submission carries the derived profile; lobby inputs become overrides**

- *User problem:* retyping HP/AC every submission, and a host reviewing numbers with no provenance.
- *Evidence:* `RoomLobbyShell.tsx:284-298` builds clearance details from a snapshot but still takes HP/AC from the manual fields.
- *Change:* prefill and mark fields as *derived*; allow explicit override with a visible "overridden" badge that the host sees in `CharacterClearanceDetailsPanel`. Carry the profile in `actorRef.details`.
- *Modules:* `RoomLobbyShell.tsx`, `characterClearanceDetails.ts`, `CharacterClearanceDetailsPanel.tsx`, `server/services/submitActorBinding.ts` (validation only).
- *Boundaries:* `RoomActorBinding` stays a room object; the vault actor is not mutated.
- *Risk:* low-medium — `buildCharacterClearanceDetails` must stay tolerant of old bindings (every field optional, per its own contract).
- *Validation:* extend `frontend:verify:character-entry` and the clearance-details smoke; add an override case.
- *Schema/API:* none (`details` is already `unknown`).
- *Polish:* **before**.

---

**T4 · Runtime action surface reads the derived profile**

- *User problem:* the action palette is empty or wrong unless someone hand-filled a lite sheet.
- *Evidence:* `RuntimeDndActionPanel.tsx:70` renders "这个角色还没有可用动作…" whenever `dndLiteActorSheetV1` is absent; `projectRoomRuntimeActorProjections.ts:74-89`.
- *Change:* prefer the submitted combat profile when producing `RoomRuntimeDndActionShortcut[]`; keep the lite sheet as an explicit host override for NPCs/monsters. Attack/damage buttons then carry real bonuses and feed T1's server roll.
- *Modules:* `server/services/projectRoomRuntimeActorProjections.ts`, `roomRuntimeActorProjectionTypes.ts`, `RuntimeDndActionPanel.tsx`.
- *Boundaries:* `CampaignActorInstance.snapshotPayload`/`overridePayload` → `RoomRuntimeActorProjection`. Precedence must be explicit (override wins, and say so in the UI).
- *Risk:* medium — projection must stay strictly bounded; do not leak full owner snapshots (the module's existing comment at `:91-95` is the rule).
- *Validation:* extend `runtime:verify:room-runtime-actor-projection`; assert no snapshot fields beyond the whitelist escape.
- *Schema/API:* none.
- *Polish:* **before**.

---

**T5 · Player self-state: HP, temp HP, conditions, spell slots, class resources, rest**

- *User problem:* during play a player cannot record taking damage, spending a slot, or finishing a rest.
- *Evidence:* `RuntimeCharacterSheetPanel.tsx:8-19` is read-only by design; no rest exists in any `components/platform/*`; the resource machinery exists only in `src/pages/Gameplay.tsx` + `resource-utils.ts`.
- *Change:* a player-writable state panel in the runtime dock that emits a new `actor.stateChange` RuntimeLog kind, server-validated to the author's own approved binding (`appendRuntimeLogEvent.ts:120-127` already has the ownership check). Combat table consumes it for HP; host retains override.
- *Modules:* new runtime panel; `appendRuntimeLogEvent.ts` (`VALID_KINDS`), `roomRuntimeVisibilityProjection.ts`, `RoomRuntimeCombatPanel.tsx`, reuse `resource-utils.ts`.
- *Boundaries:* `RuntimeObject` + `LogEvent`. **Must not** write back to the Owned Actor or the `CampaignActorInstance` — runtime HP is session state.
- *Risk:* medium-high; the biggest new surface. Contention with host HP edits must resolve by last-write-wins on the log with the host visibly authoritative.
- *Validation:* new server smoke (player may change own actor, may not change another's); replay smoke; add to the two-account protocol.
- *Schema/API:* none (new event kind only).
- *Polish:* **before**.

---

**T6 · Promote a verified, class-scoped spell subset into runtime**

- *User problem:* a Wizard or Cleric cannot bring their actual spells.
- *Evidence:* `src/data/spells.ts` = 20 entries; `spellIndex.ts` = 507 display-only; `dndSpellAvailability.ts:1-13` documents the missing class-list mapping.
- *Change:* promote spells in bounded, source-verified batches (levels 0–2 first, from `dnd-local-chm-primary` only), carrying `RuleDataMetadata` per entry; add class spell-list membership so `dndSpellAvailability` can filter properly; enforce prepared/known limits from `spell-preparation-model.ts`.
- *Modules:* `src/data/spells.ts`, `spellIndex.ts`, `dndSpellAvailability.ts`, `spell-preparation-model.ts`, `Creator.tsx` spell section.
- *Boundaries:* `CatalogObject` only. Personal-pack spells stay separate and room-reviewed.
- *Risk:* **highest data risk in this list.** Rule: no entry is promoted without a `sourceRef` into the owner CHM path. Anything not found stays indexed. This is data work, not model work.
- *Validation:* a promotion smoke asserting every promoted entry has `trustLevel: 'owner-source-matched'` and a resolvable `sourceRef`; count assertions per batch.
- *Schema/API:* none.
- *Polish:* **before**; can run in parallel with T1–T5.

---

**T7 · Close the dual runtime-event write path**

- *User problem:* (latent) what players saw and what the room recovers can silently diverge.
- *Evidence:* `server/api/campaignRoomApiRoutes.ts:87` vs `server/room-server.ts:1113/1192`; `ServerCampaignWorkspace.tsx:390-400`.
- *Change:* when a live room owns a `runtime_session`, reject direct `appendRuntimeEvent` for that session (409 `sessionOwnedByLiveRoom`) and route the campaign workspace's live tools through the room endpoints; keep the campaign path for prep-only sessions.
- *Modules:* `server/api/campaignRoomApiHandlers.ts`, `liveRoomRuntimeLogPersistence.ts`, `ServerCampaignWorkspace.tsx`, `useRuntimeEvents.ts`.
- *Boundaries:* runtime authority. Read paths unchanged.
- *Risk:* medium — could break existing host prep habits; needs a clear message and a documented prep-vs-live distinction.
- *Validation:* new smoke: create a live room, attempt a campaign-API append, expect 409; restart recovery still converges.
- *Schema/API:* new error kind; no schema.
- *Polish:* independent — schedule as soon as capacity allows.

---

**T8 · Bring host D&D tooling into the live room**

- *User problem:* the host must leave the table to reach the monster library and the real D&D check/attack/damage panel.
- *Evidence:* `ServerCampaignWorkspace.tsx:693-746` mounts `DndLiteActorSheetPanel`, `DndMonsterTemplateLibraryPanel`, `DndDiceCheckPanel` inside a `<details>`; the live host dock (`RuntimeActionDock.tsx:315-340`) has dice/scene/publicInfo/stateLog only.
- *Change:* add a host-only 战斗 dock action in the live room hosting the monster library (add-to-combat) and the D&D check panel wired to T1's server roll. Depends on T1 and T7.
- *Modules:* `RuntimeActionDock.tsx`, `RoomRuntimeEntryBridge.tsx`, `DndMonsterTemplateLibraryPanel.tsx`, `DndDiceCheckPanel.tsx`.
- *Boundaries:* host tools must not appear in the player action set — preserve the disjoint-set pattern.
- *Risk:* medium — dock crowding on mobile; use `mobilePlacement: 'overflow'`.
- *Validation:* `frontend:verify:runtime-action-dock` role-set assertions; mobile split smoke.
- *Polish:* **with** polish — it is partly an IA change.

---

**T9 · Account-scoped character vault**

- *User problem:* characters live in one browser; a new device shows an empty library.
- *Evidence:* `characterStore.ts:201, 739` (localStorage); `actorVaultRepositoryBridge.ts:18-21` (local stores only); `listActors` called only from `RoomLobbyShell.tsx:254` and `actorVaultCloudSync.ts:34`.
- *Change:* have `ActorVaultLibraryShell` list cloud actors alongside local ones with an explicit sync state per record; promote `ensureLocalActorInCloud` from submit-time to an explicit "save to account" action plus autosave on finalize.
- *Modules:* `ActorVaultLibraryShell.tsx`, `actorVaultRepositoryBridge.ts`, `actorVaultCloudSync.ts`, `actorApiClient.ts`.
- *Boundaries:* `OwnedObject`. Local store stays the editing surface; cloud is the durable record. Do not silently overwrite either side — show conflicts.
- *Risk:* medium-high (data loss if merge is careless). Never delete a local record on sync failure.
- *Validation:* extend `frontend:verify:actor-cloud-sync` with conflict and offline cases.
- *Schema/API:* none (`actors` table exists, migration `0003`).
- *Polish:* **before**.

---

**T10 · Product language + i18n pass on lobby and runtime**

- *User problem:* English users get an untranslated table; all users see `Runtime Alpha`, `sourceId:`, `lobbySlotId`, `placeholder`.
- *Evidence:* i18n table in §6; `RoomRuntimeEntryBridge.tsx:958`; `DndWorkspaceShell.tsx:863-888`; `CampaignRuntimeShell.tsx:202-206`.
- *Change:* route lobby/runtime strings through `i18n`; delete `Runtime Alpha`; move the source/trust view out of the player-facing D&D workspace into a clearly-labelled data-status area; replace literal placeholder rows with honest empty states.
- *Modules:* `src/i18n/locales/*`, `RoomLobbyShell.tsx`, `RoomRuntimeEntryBridge.tsx`, `RoomRuntimeCombatPanel.tsx`, `RuntimeCharacterSheetPanel.tsx`, `RuntimeDndActionPanel.tsx`, `DndWorkspaceShell.tsx`, `CampaignRuntimeShell.tsx`.
- *Boundaries:* presentation only.
- *Risk:* low, but large diff — split by component, one commit each.
- *Validation:* navigation/action audit per `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` §7–8; a locale-completeness check.
- *Polish:* **this is the polish milestone.** Do it after T1–T6 so it does not have to be redone.

---

## 11. Do not work on yet

Attractive, but premature against the stated goal:

- **Cloud AI provider + billing.** `modelRoutingGateway.ts:107` reports `not-implemented` honestly. No D&D user journey depends on it. (Also: drop the unused `@google/genai` dependency.)
- **Campaign material retrieval / rule-locating AI** (`ECOSYSTEM_AND_AI_ROADMAP.md` item 5). Retrieval is only as good as the promoted rule corpus — which T6 has barely started. Building retrieval over 20 spells is wasted work.
- **Workshop public publishing, review, subscription, install/update/rollback, `PackageLibraryEntry`.** The empty states are correct and honest; leave them.
- **Multi-instance runtime authority.** Real, documented, and irrelevant until more than one table is running. Single-node recovery already works.
- **COC and CP RED vertical closure.** Every hour here is an hour not spent making D&D good, and D&D is the deepest system.
- **Media / object storage** (avatars, uploaded battle maps, audio). Tempting — an uploaded battle map would feel great — but it pulls in storage, variants, visibility and deletion lifecycle. Preset backgrounds + URL are adequate for now.
- **Full 507-spell effect automation, concentration, action economy, reactions, opportunity attacks.** These need a target/effect model that does not exist. `DND_RULE_COVERAGE.md` §4 is right to keep them at level 0–1.
- **Fog of war / dynamic vision / map layers.** High effort, and the table is playable without it.
- **A router.** Genuinely valuable eventually, but it is a cross-cutting refactor of `App.tsx` (81 KB) and would collide with every task above. Revisit after Milestone B.
- **Rewriting the documentation set.** Fix the two Level-0/Level-1 conflicts (§8 items 1–2) and leave the rest.

---

## 12. Proposed first implementation task

> **T1 — Server-authoritative D&D roll semantics (advantage / disadvantage / DC) in the live room.**

**Why this one first.** It is the smallest change with the largest felt improvement: every D&D player, in every session, rolls with advantage. The deterministic semantics already exist and are already smoke-tested (`dndDiceRoller.ts` + `frontend:verify:dnd-dice`) — the work is moving them to the server-authoritative shared grammar and surfacing them in the two places players already look (`SharedDiceDock`, `RuntimeDndActionPanel`). It touches no object layer, needs no migration, and it de-risks T2/T4 by establishing the roll-result event shape they will emit into.

**Scope (in):**
1. Extend `src/lib/platform/sharedDiceExpression.ts` with advantage/disadvantage (2d20 keep-highest/lowest) and an optional target DC, keeping the module RNG-injected and free of `node:crypto`/DOM imports.
2. Extend `SharedDiceRollResult` with `mode`, `rawRolls`, `keptRoll`, `dc`, `outcome` (`success | failure | critical | fumble`), all optional so existing `dice.roll` payloads keep parsing.
3. Server computes the outcome in `rollSharedDice.ts`; the client only supplies expression + label + optional DC.
4. Surface advantage/disadvantage/DC in `SharedDiceDock.tsx`; make `RuntimeDndActionPanel`'s attack button offer adv/dis.
5. Render mode + kept die + outcome in the log drawer and the combat panel's recent-roll strip.

**Scope (out):** attack-vs-AC auto-resolution, damage application, crit damage doubling, character-derived bonuses (all T2/T4), the campaign-workspace dice panel (T8), any schema change.

**Validation:** extended `frontend:verify:dnd-dice`; a new server-side grammar smoke; a backward-compatibility assertion that a plain `2d6+3` still parses and rolls identically; one new step in `verifyPrivateAlphaTwoAccountProtocol.ts` asserting an advantage roll appears with the correct `keptRoll` in both the host and player projections; `npx tsc --noEmit`, `npm run build`, `npm run server:build`.

**Commit discipline:** one isolated commit. No changes to `output/`, `tools/`, `work/`. `docs/ai/ACTIVE_TASK.md`, `CURRENT_PLATFORM_STAGE.md` and `TEST_CHECKLIST.md` updated in the same commit per the repo's completion definition.

**Prerequisite to flag before starting:** `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` §11 and the `DATA_MANAGEMENT_MVP_SCOPE_V1.md` matrix row (§8 items 1–2) currently trigger a §15 stop condition for any runtime/multiplayer task. Either correct those two clauses first in a separate documentation-only commit, or explicitly record the conflict in the task report as the rules require.
