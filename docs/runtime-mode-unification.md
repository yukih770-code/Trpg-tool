# Runtime Mode Unification & Character Authority — Decision Draft (M65A)

Status: **audit / decision draft only.** No core implementation changes in this
milestone. This document records the architecture finding and the recommended
implementation packs.

## 1. Finding: there are two runtimes, but the shell is already shared

| | Local Campaign Runtime | Room Runtime |
| --- | --- | --- |
| Entry | Workspace shell "主持战役" tab → `CampaignRuntimeShell` | Workspace "加入战役"/"开启局域网房间" → `RoomLobbyShell` → `RoomRuntimeEntryBridge` |
| Context type | `CampaignRuntimeContext` (`selectedActorId` / `selectedActorName` / `selectedEntryRole`) | `RoomRuntimeEntryContext` (`actorRef` / `currentMemberId` / `binding` / `clearance`) |
| Log authority | local `useRuntimeLogLocalStore` | server RuntimeLog over HTTP + WebSocket |
| Dice | browser RNG | server crypto RNG |
| Shared UI | `RuntimeFullscreenShell`, `RuntimeActionDock` + `buildRuntimeDockActions`, `SharedDiceDock`, `RuntimePublicInfoPanel`, `RuntimeManualStateLogPanel` | same |
| **NOT shared** | no character sheet, no Scene Focus/Board, no Map Stage, no Actor Roster, no snapshot resolver | has all of these (M42–M64) |

Key point: **the fullscreen shell and the action dock are already one shared
component.** The split is not the shell — it is (a) the authority/log backend,
(b) the actor-context shape, and (c) which panels each caller wires in.

## 2. Why local mode shows no character sheet

`CampaignRuntimeShell` predates the M46–M64 character stack and was never updated.
Concretely:

- It calls `buildRuntimeDockActions(...)` **without** the `actorPanel` extra, so
  the player "我的角色" entry stays a placeholder.
- It never calls `resolveRuntimeActorSnapshot` / `buildRuntimeCharacterSummary` /
  `buildRuntimeInventorySummary`, even though it already holds `selectedActorId`
  and `selectedActorName`.
- The snapshot resolver and adapters are **mode-agnostic** — they read the local
  `characterStore`/`cocStore`/`cpStore` directly. So local mode could show the
  exact same read-only sheet **with no new infrastructure**, just by wiring the
  resolver with `selectedActorId` → `actorId`, `selectedActorName` → `displayName`.
- Its `mainStage` is still the old placeholder, not `RuntimeMapStage` /
  `RuntimeSceneBoardPanel`.

This is the single most important gap: local Runtime is missing wiring, not
capability.

## 3. Decision recommendations

- **`CampaignRuntimeShell` should become the "local mode" of a shared Runtime**,
  not a separate placeholder. It keeps local authority (local log store, browser
  dice) but wires the same feature panels (sheet, scene, map, state log).
- **`RoomRuntimeEntryBridge` should shrink toward a multiplayer sync adapter**:
  its unique job is server authority + membership/approval/presence/ready + WS
  broadcast. The feature assembly (scene/board/sheet/dock/log) should be driven
  by a shared assembler that both modes call.
- **The Runtime Character Sheet should be driven by a shared `RuntimeActorContext`**
  built by both modes, not by room-only data. Solo mode must be able to hold BOTH
  host controls and the player's own actor context at once.

### Proposed shared seams (names only, not implemented here)

```
RuntimeActorContext        // { actorId?, displayName?, systemId, role, ready?, admission? }
                           //   built from selectedActor (local) OR actorRef+binding (room)
RuntimeAuthorityAdapter    // append/roll/publish/recordState — local store vs server impl
RuntimeFeatureAssembler    // given actor context + authority + feed → dock + scene + sheet + log
```

Both `CampaignRuntimeShell` and `RoomRuntimeEntryBridge` become thin: build a
`RuntimeActorContext` + pick an authority, then call the assembler.

## 4. Local → Multiplayer toggle boundaries

Product goal (BG3-style): start solo, then "开启联机" from campaign detail, from
in-runtime settings, or from the lobby — same runtime, multiplayer layer switched on.

What must be classified before a toggle is safe:

| State | Where it can live | On toggle |
| --- | --- | --- |
| Scene focus, public info, manual state log, dice history | local store (solo) | must be **replayed into the Room Server** so joiners see history |
| Actor context (who I am, my character) | local (per client) | stays per-client; room adds membership/approval/presence/ready |
| Membership / approval / presence / ready | **Room Server only** | created on toggle; absent in solo |
| Room identity / invite / room code | Room Server only | created on toggle |
| Authoritative dice / server log | Room Server only | authority moves from local to server |

Current gaps: no shared session-mode enum (`solo | hosting | joined`); no
"promote local runtime → room" path that carries existing scene/log/state; local
and room use different log stores with no bridge/replay.

**Minimum first step:** wire the local character sheet (Part 2), then introduce a
`RuntimeSessionMode` enum + a read-only "current mode" indicator, before any real
promotion logic. Promotion (replaying local log into a new room) is a later pack.

## 5. Character authority / clearance field tiers

Using the real DND `CharacterData` (and analogous COC/CP fields) as the model:

1. **描述 / 创作字段 (no clearance):** `name`, `age`, `gender`, `description`,
   `appearanceDescription`, flavor `background`, `customLanguages`, portrait,
   backstory/notes. Free to edit anytime.
2. **初始构筑字段 (re-clearance on change):** `attrs` (point-buy), starting
   `level`, `jobClass`/`subclass`, mechanical `race`/`subrace`, initial
   `skillProficiencies`/`savingThrowProficiencies`, initial `feats`, starting
   `inventory`/`spellbook`. Rebuilding these ("重车卡") triggers re-clearance.
3. **战役演化字段 (legitimate growth — no clearance IF provenance exists):**
   `hpCurrent`/`tempHp`, current resources (`spellbook.slots.current`,
   `classResources.current`), `coin` deltas, inventory gained/consumed, XP /
   in-campaign level-ups, permanent buffs earned, `san`/`humanity` changes,
   injuries, experiences. Legitimate **when they arrived via RuntimeLog /
   Session Recap / Host confirmation.**
4. **战役权威字段 (future CampaignActorInstance):** the campaign-scoped
   authoritative instance of tiers 3 — the record that legitimately diverges from
   the vault original and is never auto-overwritten back.

### Clearance rules

- **No clearance:** tier-1 edits; tier-3 changes with matching chronicle
  provenance.
- **Re-clearance:** any tier-2 change; tier-3 fields changed **outside** the
  runtime/log path (e.g. editing HP-max / attrs / adding items directly in the
  vault while bound to a campaign) — indistinguishable from cheating without
  provenance.
- **Into character history via Recap/Host:** tier-3 deltas earned in a session.
- **Re-entry recognition (avoid re-checking whole sheet):** store a per-(campaign,
  actor) **baseline snapshot hash** + a **chronicle of legitimate deltas**. On the
  next entry, `expected = baseline ⊕ appliedChronicleDeltas`; if `actual` matches
  expected → auto-pass; if `actual` carries extra unexplained deltas → re-clearance
  only for those fields.

## 6. AI's correct place in clearance

```
Deterministic system rules  = HARD validation (field-tier diff, hash compare)
AI                          = diff SUMMARY / anomaly hints / review assist (advisory only)
Host                        = FINAL confirmation
```

AI is never authoritative and never auto-approves. It only helps a human read a
diff faster.

## 7. Character Chronicle / blog pipeline (future)

```
RuntimeLog (chat + scene + state log + dice + story)
  → Session Recap (already produces a markdown draft: buildSessionRecap)
  → Character Chronicle Draft (per-actor, filtered + tagged)   ← NEW contract
  → player edits
  → 角色经历栏 / 角色主页博客
  → optional publish to 同人广场
```

Current gaps: RuntimeLog state/inventory events carry a free-text `targetName`,
**not** a stable `actorRef`, so per-actor filtering is unreliable; Session Recap
is per-room, not per-actor; there is no Chronicle draft contract or store.

**Short-term (no blog, no AI):** define a `CharacterChronicleDraft` contract and
add an OPTIONAL `actorRef` tag to manual-state / inventory events, so Recap can be
filtered into a per-actor draft. Rendering/editing/publishing come later.

## 8. Recommended next implementation packs

- **M65B–M68 Local Runtime Actor Context & Shared Runtime Shell** — extract
  `RuntimeActorContext` + `RuntimeAuthorityAdapter`; wire `CampaignRuntimeShell`
  to the snapshot resolver + character sheet (immediate win); bring Scene/Map/Board
  parity to local mode; converge the two context shapes behind the assembler.
- **M69–M72 Multiplayer Toggle Contract** — `RuntimeSessionMode` enum
  (`solo | hosting | joined`) + a documented promotion contract (create room,
  replay local scene/log/state, keep actor context); presence/ready/approval as an
  additive sync layer. Contract + read-only indicator first, promotion logic later.
- **M73–M76 Character Clearance Diff Contract** — field-tier classification module
  + snapshot-hash baseline + diff engine + per-campaign chronicle-of-deltas +
  auto-pass / flag decision. Deterministic only; AI advisory hook stubbed.
- **M77–M80 Character Chronicle Draft Contract** — per-actor chronicle draft from
  RuntimeLog/Recap; add optional `actorRef` tagging to events; draft store +
  read-only draft surface (edit/publish later).

## 9. Risks

- Converging two context shapes risks regressing the working room runtime — do it
  behind a shared assembler with both callers kept thin, not a big-bang rewrite.
- Local↔room log stores differ; a naïve promotion that double-writes or loses
  history is the main hazard — replay must be explicit and idempotent.
- Clearance tiers depend on reliable provenance; without event `actorRef` tagging,
  tier-3 auto-pass is not yet safe. Chronicle tagging should precede auto-pass.
- Reading stores via `getState()` at render is non-reactive; a shared actor
  context should subscribe properly if local edits must live-update the sheet.

## 10. Do NOT do yet

Full context unification rewrite, real multiplayer promotion/replay, clearance
auto-approval, CampaignActorInstance storage/migration, chronicle editing/blog/
publish, AI clearance, or any store-schema change. This milestone is the map, not
the build.
