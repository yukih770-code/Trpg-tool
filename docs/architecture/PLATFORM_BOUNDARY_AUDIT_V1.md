# P8 Platform Boundary Audit v1

> Read-only. No implementation, no refactor, no behavior change.
> Classifies runtime concepts against the four-layer model:
> Platform Kernel / Game Systems / Content-Mods / World Server Policy.

Method: every claim below is grounded in a grep of the current worktree, not in
recollection. Line references are to the working tree as audited.

## 1. Headline

The codebase is **already closer to the four-layer model than it looks**. The
Actor Vault stores `payload` as documented "system-agnostic JSON"; campaign
actor snapshot/override are opaque JSONB; `serverContentSet.ts` contains **zero**
D&D references; conditions are opaque `string[]`; the content-pack schema and
`world_server_game_system_bindings.enabled_pack_version_ids` are already the
World Server Policy layer.

There is exactly **one coupling that genuinely blocks a second system**, and it
is small and mechanical. Everything else is either correct already, or cosmetic
pollution that should be left alone until a second system actually exists.

## 2. Classification

| Concept | Class | Evidence / note |
|---|---|---|
| **Actor (Vault)** | PLATFORM CORE | `postgresActorRepository.ts:19,28` — "`payload` holds the FULL character sheet as system-agnostic JSON". Tagged by `systemId`. Genuinely neutral. |
| **Character (`CharacterData`)** | D&D IMPLEMENTATION | `src/lib/dnd-types.ts`. Correctly D&D-shaped. Must **not** be generalized. |
| **CampaignActorInstance** | PLATFORM CORE | `snapshot_payload` / `override_payload` are opaque JSONB. The D&D sheet lives under the namespaced key `dndLiteActorSheetV1` — a system namespacing its own key inside an opaque bag is the *correct* pattern. |
| **RuntimeActorProjection** | PLATFORM CORE + mild D&D shaping | Carries `armorClass`, `initiativeModifier`. D&D reading is properly gated (`projectRoomRuntimeActorProjections.ts:155,262`: `systemId === 'dnd5e-2024'`). The dispatch is right; only the field names lean D&D. |
| **Sheet** | Split, correctly | `DndLiteActorSheet` = D&D. `RuntimeQuickViewCombatSection` = platform, and already partly neutralized (`defenseLabel` beside `armorClass`). |
| **Resource** | SYSTEM-NEUTRAL SEAM — already exists | `RuntimeQuickViewResource {id,label,current,max,note}`, commented "system-specific pools (slots/SAN/etc.) map here." This is the seam T14 should use. |
| **Action** | ACCIDENTAL COUPLING | `RoomRuntimeDndActionShortcut` lives in **`src/lib/platform/roomRuntimeActorProjectionTypes.ts`** and hardcodes `spell_attack` / `spell_cast` / `save_dc` and `saveAbility: 'strength'\|'dexterity'\|…`. D&D ability names inside a platform contract. |
| **Result (dice)** | PLATFORM CORE + D&D semantics attached | `sharedDiceTypes.ts:37,59,65` — `SharedDiceRollMode = normal\|advantage\|disadvantage`, `dc`, `outcome`. Expression parsing and RNG are neutral; advantage/DC are D&D. Fields are optional and documented as d20-only. |
| **Combat** | SYSTEM-NEUTRAL SEAM | Event kinds are generic: started / initiative_rolled / turn_advanced / round_advanced / combatant_±/updated / damage / healing / temporary_hp / condition_±. Only `Combatant.armorClass` leans D&D. |
| **Tracker / initiative** | PLATFORM CORE | Initiative-ordered turns are common across TRPGs; `initiativeFormula` is a neutral dice string. |
| **Condition / effect** | SYSTEM-NEUTRAL SEAM | `conditions: string[]` everywhere — opaque, no D&D semantics. This is exactly right and is the seam T13 must respect. |
| **Dice** | PLATFORM CORE | `sharedDiceExpression.ts` + crypto RNG in `rollSharedDice.ts`. Neutral infrastructure. |
| **Map / token** | PLATFORM CORE | Clean, apart from two enum members: `MapTokenSourceType` includes `'dndLiteActor'` and `'monsterTemplate'`. |
| **RuntimeLog / replay** | PLATFORM CORE | Kinds are neutral; reserved prefixes `room.runtimeLog.` / `room.mapEvent.` are enforced. See §3.G for the one real defect. |
| **Content catalog** | SYSTEM-NEUTRAL SEAM — already correct | `serverContentSet.ts` greps **0** matches for D&D vocabulary. Entry kinds are generic with an `other` escape hatch. Unwired, but well-shaped. |
| **World Server / game-system binding** | WORLD SERVER POLICY | `world_server_game_system_bindings` already has `game_system_id`, `current_ruleset_version_id`, `enabled_pack_version_ids`. The policy layer exists in storage; nothing reads it. |
| **Private monster vertical** | D&D IMPLEMENTATION, co-located in `server/` | `dndPrivateMonsterApiHandlers.ts`, `postgresDndPrivateMonsterRepository.ts`, migration `0011`. The only direct `server/ → src/lib/dnd/` imports. Isolated (own files, routes, table), so it constrains nothing. |

## 3. Accidental couplings

### A. Closed `RoomSystemId` union — **the only genuine blocker**

```
src/lib/platform/roomTypes.ts:38   RoomSystemId = 'dnd5e-2024'|'coc7e'|'cp-red'|'custom'
server/services/createRoom.ts:42   VALID_ROOM_SYSTEM_IDS = [...same four...]
server/services/createRoom.ts:80   systemId = input.systemId ?? 'dnd5e-2024'
server/services/liveRoomRuntimeLogPersistence.ts:94
    systemId !== 'dnd5e-2024' && systemId !== 'coc7e' && systemId !== 'cp-red' && systemId !== 'custom'
server/room-server.ts:716          body.systemId ?? 'dnd5e-2024'
```

**Does it block another system? Yes.** Registering a system means editing at
least three kernel files, one of which is a persistence guard. A mod-supplied or
third-party system cannot exist at all.

**Smallest seam:** replace the closed literal union with an opaque
`GameSystemId = string` validated against a single registry list, and make the
persistence guard consult that registry instead of four inline literals. One
registry module; no behavior change for the existing four ids. Do **not** build
a plugin-registration API — a static registry array is enough today.

### B. `RoomRuntimeDndActionShortcut` in platform projection types

**Does it block another system? No.** Optional and additive; a CoC projection
would simply not populate it. But every system adding its own shortcut type to
the same kernel file is how the kernel rots.

**Smallest seam:** move the type into `src/lib/dnd/`, and have the platform
projection carry an opaque, system-namespaced `systemActions?: unknown` (or keep
the D&D field but source the type from the D&D layer). Cheap; do it while
touching this file for T12.

### C. `characterClearanceDetails.ts` combat block is a D&D stat block

Lives in `src/lib/platform/`; its `combat` section is `ac`, `proficiencyBonus`,
`initiativeBonus`, `passivePerception`, `abilityScores`, `saves`, `skills`, and
it sniffs D&D keys (`acMod`, `attrs`, `savingThrowProficiencies`).

**Does it block another system? No** — it is duck-typed, imports nothing from
`src/lib/dnd`, and every field is optional. A CoC character simply produces an
empty block. But SAN / Luck / Humanity have nowhere to go.

**Smallest seam:** none yet. Add a `systemSummary?: Array<{label, value}>`
only when a second system actually needs to show a stat the D&D block cannot
express. **Leave as-is for now.**

### D. `campaignActorOverride.ts` sits in `platform/` but imports `dnd/`

```
src/lib/platform/campaignActorOverride.ts:2  import { validateDndLiteActorSheet } from '../dnd/dndLiteActorSheet'
```

A real layering inversion: the kernel directory depends on the system directory.
**Blocks nothing**, but it is the one place the dependency arrow points the wrong
way, and it is a one-line fix.

**Smallest seam:** move the file to `src/lib/dnd/`. The override *key* pattern
itself is correct and should be kept.

### E. Dice `mode` / `dc` semantics

**Does it block another system? No.** Both fields are optional, rejected on
non-d20 expressions, and a request without them yields the exact v0 shape.
CoC bonus/penalty dice and CP RED exploding d10s would each want their own
semantics — at which point a discriminated per-system block is warranted.

**Recommendation: leave as-is.** Generalizing now would be premature and would
disturb T1, which is baseline and untouchable.

### F. `MapTokenSourceType` contains `'dndLiteActor'` / `'monsterTemplate'`

Cosmetic. Blocks nothing. **Leave as-is.**

### G. Dual RuntimeLog kind whitelist — kernel defect, not a system boundary

`VALID_KINDS` (`appendRuntimeLogEvent.ts:32`) governs append; a separate
`ROOM_RUNTIME_LOG_KINDS` (`liveRoomRuntimeLogPersistence.ts`) governs restart
recovery. **A kind added to only one is accepted live and then silently vanishes
on restart.** This is unrelated to multi-system, but it becomes materially worse
the moment systems or mods can contribute event kinds — which is precisely the
direction now chosen.

**Smallest seam:** one exported list, consumed by both. No new abstraction.

## 4. Prioritized boundary cleanup

### P0 — blocks multi-system architecture
1. **A** — open `RoomSystemId` behind a single system registry (3 kernel sites).
2. **G** — collapse the two RuntimeLog kind whitelists into one source of truth.

### P1 — fix while doing the upcoming D&D work
3. **D** — move `campaignActorOverride.ts` into `src/lib/dnd/` (one-line move).
4. **B** — relocate `RoomRuntimeDndActionShortcut` to the D&D layer while T12 is
   already editing the projection.

### P2 — defer until a second system or a mod actually needs it
5. **C** — `characterClearanceDetails` generic stat rows.
6. **E** — per-system dice semantics.
7. **F** — token source-type enum.
8. `RuntimeActorProjection` field renaming (`armorClass` → `defenseValue`). HP,
   defense and initiative are near-universal; renaming buys nothing today.

## 5. Where T11b / T12 / T13 / T14 belong

**T11b — host review and acceptance of a changed character source**
Split. *Platform:* "propose → host reviews → host accepts a new snapshot for a
CampaignActorInstance", plus the acceptance write path. *D&D:* the summariser
that turns two `CharacterData` versions into a readable field diff (level, AC,
proficiencies). The kernel must never know what an ability score is; it moves an
opaque payload and records who accepted it.

**T12 — server-authoritative attacks — the pivotal one**
Attack-vs-AC resolution is D&D IMPLEMENTATION. But T12 is where the first real
Platform↔System seam becomes unavoidable:

> a System-provided resolver returns a **proposed** runtime event;
> the kernel validates authorship, permission and event kind, then appends.

Build that seam deliberately in T12, because **it is the same seam scripted mods
will later use** (per the P7 rule: a script runs once, server-side, at resolution
time; replay only applies recorded results). Getting it right once serves both.

**T13 — typed conditions**
D&D IMPLEMENTATION only. Condition *semantics* (what "prone" does) belong to the
system. The platform keeps `conditions: string[]` for tracking and display.
**Explicitly do not** introduce a platform effect/status model until a second
system needs one — the opaque string list is already the correct seam.

**T14 — resources and spell slots**
D&D IMPLEMENTATION mapped onto the **existing** `RuntimeQuickViewResource` seam,
which was designed for exactly this ("slots/SAN/etc. map here"). Do **not** add a
`spellSlots` field to any platform type.

## 6. Standing recommendation

Only P0 items 1 and 2 are worth doing before more D&D gameplay work; together
they are small and mechanical. Everything else should ride along with the
feature that already touches the file. D&D remains the gameplay priority, and
the fastest route to a complete playable session is unchanged by this audit.
