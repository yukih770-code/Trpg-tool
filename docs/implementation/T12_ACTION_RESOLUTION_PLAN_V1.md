# T12 — Authoritative D&D Action Resolution: Trace & Implementation Plan (V1)

> **2026-09-10 correction — authoritative visibility decision (supersedes §A
> and all Host/owner-only assumptions below):** T12 inherits current HEAD's
> combatant viewer projection. Exact-visible AC permits `targetAc`; exact-visible
> HP permits before/after HP; visible temporary HP permits its before/after values,
> absorption and applied amount. `publicShared` intentionally exposes these exact
> displays. Preserve global combat/map/spectator visibility and existing tests.
> The attack event uses an explicit per-kind allowlist consulting the projected
> target; it never exposes more target information than that projection allows.
> Shared text remains conservative: roll total, hit/miss, damage **rolled**;
> no AC, absolute HP/temp HP, applied amount, or potentially private names.
> The newer task also requires pending single-flight reservations, fingerprint
> mismatch rejection, and authoritative-history fallback on every cache miss;
> the older §B eviction limitation and rebuild-once design are superseded.

> **Status: T12-A through T12-F implemented; final validation recorded in T12_ACTION_RESOLUTION_REPORT_V1.md. No commit or push. Stop before T13.**
>
> Sections 1–14 retain the original architectural trace and plan. Sections A–E are the mandatory
> amendments resolved before implementation; **where an amendment conflicts with
> an earlier section, the amendment wins** and the affected section is marked.

---

## 1. Executive recommendation

**The rules already exist and are already server-safe. What is missing is that
nobody on the server calls them.**

`rollDndAttack` and `rollDndDamage` (T1, `src/lib/dnd/dndDiceRoller.ts`) already
implement advantage/disadvantage, nat20 auto-hit, nat1 auto-miss, AC comparison,
and critical damage that doubles dice but not the modifier — all pure, all
injectable-RNG, all smoke-asserted. They are called from exactly one place: a
**client** panel. Meanwhile `rollSharedDice` has the crypto RNG and the append
authority but no rules.

T12 is the wire between them:

- One new server service that resolves a D&D attack from server-held facts and
  returns a **proposal**.
- One new platform service that validates the proposal structurally and appends
  **one** event.
- One new event kind, `combat.attack_resolved`, carrying fully resolved facts.
- One replay branch so that event moves HP — the same `afterHp` mechanism
  `combat.damage_applied` already uses.
- One narrow fix to `projectCombatPayload` so the resolution survives projection.

**No resolver registry, no plugin framework, no new Resource/Effect/Action
model.** The seam is a *data contract* (the proposal type), not a code extension
point. With one system and one action, a registry would be a guess.

---

## 2. Exact current action/combat data flow

### 2a. Dice today — two separate stacks

| | `sharedDiceExpression` + `rollSharedDice` | `dndDiceRoller` |
|---|---|---|
| Layer | Platform (system-agnostic) | D&D |
| RNG | `node:crypto randomInt` — server | injected `() => number`, defaults to `Math.random` |
| Where it runs | **Server** (`POST /rooms/:roomId/runtime/dice-roll`) | **Client only** (`DndDiceCheckPanel`) |
| adv/dis | yes (`mode`) | yes (`rollD20`) |
| DC | yes | yes (`rollDndCheck`) |
| nat20 / nat1 | metadata only — *"Applies NO automatic success"* | **rules** — nat20 auto-hit, nat1 auto-miss |
| AC comparison | no | yes (`rollDndAttack`) |
| Critical damage | no | yes — `multiplier = 2` on dice counts, modifier untouched |
| Appends RuntimeLog | yes, `dice.roll`, public, durability-confirmed | no — its `dnd.*` kinds are **not** in `ROOM_RUNTIME_LOG_EVENT_KINDS` and cannot be appended to a room at all |

`RuntimeDndActionPanel` (the player-facing palette) is explicit about its own
limits in its header comment: target choice *"only enriches the append-only dice
label, while hit resolution and HP changes remain under the existing
host-confirmed combat controls."* It fires `dice.roll` and shows the server's
answer. It resolves nothing.

### 2b. Combat and HP today

```
HOST CLIENT                                    SERVER
useCombatRuntimeTable.damage(id, amount)
  -> combatComfort.applyDamage()     <- the arithmetic happens HERE, in the browser
       returns {beforeHp, afterHp, absorbedByTemporaryHp}
  -> setState(local React state)     <- source of truth #1
  -> createDamageEvent() draft {amount, beforeHp, afterHp, targetCombatantId, ...}
RoomRuntimeCombatPanel.persist(draft)
  -> POST /rooms/:id/runtime-log/events ---->  requireRoomRuntimeAction('runtime.event.append')
                                               appendRuntimeLogEvent()
                                                 - kind in ROOM_RUNTIME_LOG_EVENT_KINDS
                                                 - combat.* => ACTIVE HOST AUTHOR REQUIRED
                                                 - actorBindingId checked vs approved bindings
                                                 - NO arithmetic validation of any kind
                                               confirmRuntimeLogAppend() (durable mirror)
                                               broadcastRuntimeLogAppended()
  <- on failure: table.replaceState(rollback)
```

Read-back for every viewer:

```
projectRuntimeLogEventsForViewer()
  for combat.* -> projectCombatPayload()
      replayCombatRuntimeEvents(RAW history)     <- server rebuilds true state
      projectCombatant(scope, ...)               <- redacts HP/AC per viewer
      returns {roundNumber, turnIndex, activeCombatantId, combatantCount,
               combatants, targetCombatantId}    <- EVERY other payload key discarded
CLIENT: replayCombatRuntimeEvents(projected events)
  first branch: any combat.* whose payload has a `combatants` array
                replaces state wholesale         <- why state stays correct
```

Restart: `restoreLiveRoomRuntimeLogs` restores the **raw** envelopes (filtered by
`ROOM_RUNTIME_LOG_EVENT_KINDS`), and replay reads `payload.afterHp`.
**Replay already never re-derives HP** — it reads a recorded fact. That is the
property T12 must preserve, not invent.

---

## 3. Exact authoritative T12 data flow

> Amended by **§B** (idempotency) and **§C** (actor identity). The corrected
> request shape is in §C.

```
PLAYER or HOST declares - INTENT ONLY
  POST /rooms/:roomId/runtime/dnd-attack
  { memberId, intentId, actorCombatantId, actionId, targetCombatantId, mode? }
  -- no attackBonus, no damageFormula, no d20, no total, no hit/miss --
        |
        v  KERNEL - knows nothing about D&D
resolvedIntentIndex.lookup(roomId, memberId, intentId)  -> replay the stored event if present
requireRoomRuntimeAction(room, memberId, 'combat.action.declare')
room live? member active?
replayCombatRuntimeEvents(raw runtime log) -> authoritative combat state
actor combatant exists and is active; requester authorized to control it (§C)
target combatant exists and is active
        |
        v  D&D SYSTEM - knows nothing about rooms, sockets or the log
resolveDndAttackAction({ attacker, target, action, mode, random })
  action re-read SERVER-SIDE from campaign_actor_instances
      .override_payload.dndLiteActorSheetV1.actions[actionId]
  rollDndAttack({attackBonus, targetAc, mode})                <- T1, crypto RNG
  hit? -> rollDndDamage(action.damageFormula, {critical})     <- T1, crypto RNG
  temp-HP absorption + floor at 0 via combatComfort.applyDamage (pure, reused)
  returns SystemResolutionProposal - resolved facts + ONE structural mutation
        |
        v  KERNEL - validates shape, not rules
mutation targets a combatant that exists; beforeHp matches replayed state;
afterHp within [0, hpMax]; kind in SERVER_RESOLVED_EVENT_KINDS
appendResolvedRuntimeEvent('combat.attack_resolved')          <- §D
confirmRuntimeLogAppend()      <- T7 durability gate, unchanged
resolvedIntentIndex.record(roomId, memberId, intentId, eventId)
broadcastRuntimeLogAppended()
        |
        v
projectRuntimeLogEventsForViewer -> projectCombatPayload (+ resolution allow-list, §A)
CLIENT replay: combatants snapshot + afterHp -> HP moves. No dice, no rules.
RESTART: raw envelope restored -> same replay -> byte-identical state.
```

The client never chooses hit/miss, never supplies damage, never mutates HP.

---

## 4. Minimal Platform / System seam

One type file. No registry, no interface a mod "implements", no dispatch table.

```
src/lib/platform/systemResolutionTypes.ts   (types only, ~60 lines)

SystemResolutionProposal {
  systemId: string                       // kernel compares, never interprets
  resolutionId: string
  publicSummaryText: string              // §A - public tier only, by type
  publicFacts: Record<string, unknown>   // opaque to kernel, explicit public allowlist
  privilegedFacts: Record<string, unknown> // opaque to kernel, target-projection gated
  mutations: RuntimeMutation[]           // the ONLY part the kernel reads
}

RuntimeMutation =
  | { type: 'combatantHp'; combatantId: string;
      beforeHp: number; afterHp: number;
      beforeTemporaryHp: number; afterTemporaryHp: number }
```

`mutations` is deliberately a one-member union today.

**Why not a resolver interface.** The call graph has exactly one caller and one
callee. A `SystemResolver` interface with `resolve(input): Proposal` would be a
single-implementation abstraction whose shape is a guess about COC and CP RED.
The proposal type is the part that must be stable, because it is what a future
resolver — including a mod's — has to produce. Introduce the dispatch when there
is a second system to dispatch to.

---

## 5. D&D-specific resolver responsibilities

Entirely in `server/services/resolveDndAttackAction.ts` + `src/lib/dnd/`:

- Reading the action from the campaign actor's `dndLiteActorSheetV1.actions`
- Attack modifier (`action.attackBonus`)
- Advantage / disadvantage -> which d20 face is kept
- AC comparison, and the fact that AC is even the relevant defence
- nat20 auto-hit, nat1 auto-miss
- Critical -> damage dice doubling
- Damage formula parsing and rolling; damage type
- Temp-HP absorption ordering and the floor at 0
- The public summary sentence (built from the public tier only — §A)

None of this appears in `appendRuntimeLogEvent.ts`, `room-server.ts`,
`roomRuntimeLogTypes.ts`, or `roomRuntimeVisibilityProjection.ts` — except the
allow-listed field *names* in the projection, which is presentation, not rules.

---

## 6. Kernel responsibilities

Everything here is checkable without knowing what "AC" means:

1. Requester authenticated and bound to the claimed `memberId`
   (`resolveRoomParticipant`, existing)
2. Room live, not closed/archived
3. `intentId` present, well-formed, and not already resolved (§B)
4. The acting combatant exists in replayed state, is `active`, and the requester
   is authorized to control it (§C)
5. The target combatant exists in replayed state and is `active`
6. `proposal.systemId` equals the room's system id
7. Every mutation names a combatant present in the replayed state
8. `beforeHp` equals the state the kernel just replayed — a stale proposal is
   rejected, not applied
9. `afterHp` is a finite integer in `[0, hpMax]` (or `>= 0` when `hpMax` is unknown)
10. Event kind is in `SERVER_RESOLVED_EVENT_KINDS` (§D)
11. Durable append confirmed before broadcast (T7, existing)

Checks 8 and 9 are what make the kernel meaningfully authoritative rather than a
rubber stamp: it independently confirms the mutation is a legal transition from
the state it holds.

---

## 7. Proposed event shape

> Field tiering amended by **§A**. The tier column below is authoritative.

**One event, one new kind.** Two events (`attack_resolved` + `damage_applied`)
would create a window where the first append succeeds and the second fails,
leaving a hit recorded with no HP change. Atomicity wins.

```
kind: 'combat.attack_resolved'
visibility: 'public'
authorMemberId: <the declaring member>
actorBindingId: <their approved binding, when one exists - absent for host NPCs>
text: "Attack: 23, hit. 9 damage rolled."   <- PUBLIC TIER ONLY

payload: {
  schemaVersion: 1,
  systemId: 'dnd5e-2024',
  resolutionId, intentId,

  // structural - the kernel reads and validates these
  actorCombatantId, targetCombatantId,

  resolution: { <public tier, see §A> },
  privileged: { <target facts gated by projected displays, see §A> },
  mutations: [ { type: 'combatantHp', combatantId, beforeHp, afterHp, beforeTemporaryHp, afterTemporaryHp } ],
  sessionId, fingerprint // server-only retry metadata
}
```

**Why this survives everything:**

- *The D&D implementation changes later* — nothing is recomputed. `afterHp` is a
  recorded number; replay assigns it.
- *A content pack changes later* — the damage formula and its faces are frozen in
  the event. Re-reading the action definition is never needed.
- *A mod is removed later* — the event references no mod, no script, no external
  id. `systemId` is a label, not a lookup.
- *Restart* — the raw envelope round-trips through
  `LIVE_ROOM_RUNTIME_LOG_PAYLOAD_KEY`; replay reads `afterHp` exactly as it does
  for `combat.damage_applied` today.

A **miss** emits the same event with `outcome: 'miss'`, no damage block, and
`afterHp === beforeHp`. One code path, one kind, no special case.

---

## 8. How damage updates HP

**Append the resolved event and let state application move HP. One path, no
exceptions.**

Raw attack replay reads the frozen structural `payload.mutations` and assigns
recorded after-values. Projected replay consumes the existing combatant snapshot
branch. Neither path runs RNG or reinterprets system fact bags.

The host client must **not** call `table.damage()` for this flow. It renders the
projected state like every other viewer. The optimistic-local-state path in
`RoomRuntimeCombatPanel.persist()` stays for the host's manual HP controls (a
host adjusting HP by hand is a legitimate, different action), but the attack flow
does not go through it. That distinction must be explicit in the code, or the
second source of truth creeps back.

---

## 9. Critical hits — first version

**Use only what is already implemented and asserted:**

- `rollDndAttack`: `isCritical = keptRoll === 20`; a nat20 hits regardless of AC;
  a nat1 misses regardless of AC.
- `rollDndDamage(formula, { critical: true })`: multiplies each dice group's
  **count** by 2, leaves the flat modifier alone. `dndDiceRollerSmoke.ts:69`
  asserts exactly this — *"critical damage doubles dice only"*: `1d8+3` critical
  with faces 1 and 5 gives total 9, modifier 3.

**Explicitly out of scope — the repository does not contain the rule data:**

- Expanded crit ranges (Champion 19–20) — no feature/subclass rule data drives
  dice ranges anywhere in the repo.
- Extra crit dice from features (Brutal Critical, Savage Attacks) — same.
- Sneak Attack / Divine Smite / conditional bonus damage — no resource or feature
  model exists, and T14 is deferred.
- Resistance / vulnerability / immunity — `dndEffectDefinitions.ts` has damage
  types but no resistance table wired to anything.

There **is** a real weapon dataset — `src/data/dnd2024/equipment.ts`, 38 weapons
with `damageDice` and `damageType`, sourced `dnd-local-chm-primary`. **It is
marked `usagePolicy: 'display-only'`.** T12 must not auto-derive attacks from it.
Changing that policy is a deliberate decision, not a side effect of T12.

---

## 10. Action source

**Derive from the existing action object (option 2), with a precise caveat.**

`RoomRuntimeDndActionShortcut` already exists in
`roomRuntimeActorProjectionTypes.ts` with `attackBonus`, `damageFormula`,
`damageType`, `saveDc`. `readDndLiteActionShortcuts()` already reads them
**server-side** from
`campaign_actor_instances.override_payload.dndLiteActorSheetV1.actions`, and
`projectRoomRuntimeActorProjections` already returns them as `selfDndActions` —
to the owning member only.

So the client sends `actionId`; the server re-reads the same record and
re-derives the action. **The wire carries no attack bonus and no damage
formula.** That is the whole reason option 2 beats manual entry: with manual
entry the client supplies numbers that become authoritative.

Two caveats:

1. **T9's derivation emits `actions: []` on purpose** — its own comment says *"an
   invented attack is worse than no attack because the table would trust it."* A
   PC therefore has no attack until the host authors one in
   `DndLiteActorSheetPanel` (the "Add action" controls already capture
   name/kind/attackBonus/damageFormula/damageType). T12 makes that authoring step
   load-bearing; the UI must say so rather than let it be discovered at the table.
2. **Monsters already work** — `dndMonsterToLiteActorSheet` maps
   `monster.actions` straight into the sheet, so a host-imported monster has
   attacks immediately.

No item or equipment system is built. The action object *is* the source.

---

## 11. Interaction with future Mods (seam only)

The seam is the proposal type plus one structural rule:

> **Only `applyRuntimeResolution` may append a server-resolved event.** A
> resolver — D&D's, or a future mod's — is a pure function that receives resolved
> state and returns a `SystemResolutionProposal`. It never receives
> `roomRegistry`, `runtimeLogRegistry`, a socket, or a repository handle.

A future deterministic mod resolver sits exactly where `resolveDndAttackAction`
sits: same input (a resolved actor, a resolved target, an action id, an injected
RNG), same output type. Because the kernel validates `mutations` and only copies
the fact bags, a mod cannot invent an event kind, cannot write HP outside
`[0, hpMax]`, cannot address a combatant absent from replayed state, and cannot
append anything at all.

M5 scripting — sandbox, capability grants, determinism enforcement, versioning —
is not designed here.

---

## 12. `projectCombatPayload` — special audit

**Correctness: not a blocker. Visibility: yes, a blocker, and it belongs to T12.**

*Correctness.* `projectCombatPayload` replaces the payload wholesale, so
`afterHp` never reaches the client — but `replayCombatRuntimeEvents` has an early
branch: any `combat.*` event whose payload carries a `combatants` array replaces
state wholesale, and the projection always emits `combatants` rebuilt from a
server-side replay of raw history. Client state is therefore already correct, and
would remain correct for `combat.attack_resolved`. Authoritative replay (server,
restart recovery) uses raw events and is untouched.

*Visibility.* Everything a player needs to see about their own attack lives in
the payload, and `projectCombatPayload` keeps exactly one key:
`targetCombatantId`. Ship T12 without fixing this and every player sees a log
entry with no numbers in it.

**Smallest fix, scoped to T12:** carry through an explicit allow-list — never a
raw passthrough — using §A and consulting the target already returned by
`projectCombatant`. T12 adds no global visibility rule.

**Do not** broaden this to restore raw payload passthrough for
`combat.damage_applied` or any other kind. One kind, one allow-list.

---

## 13. Scope for the first playable attack

**In**

- One action shape: `weapon_attack` and `spell_attack` (mechanically identical
  here — attack bonus vs AC)
- Attacker: any combatant the requester is authorized to control (§C)
- Target: any active combatant in replayed state
- Normal / advantage / disadvantage, chosen by the declarer
- AC comparison, nat20 auto-hit, nat1 auto-miss
- Critical damage: doubled dice, modifier untouched
- Temp-HP absorption, HP floor at 0
- One authoritative event; HP moves through replay only
- Retry-safe declaration (§B)
- Restart-identical reconstruction

**Deliberately deferred**

| | Why |
|---|---|
| Saving-throw actions (`save_dc`), spell effects | Needs target-side save resolution; T13/T14 |
| Conditions from attacks | T13 |
| Spell slots, resources, ammunition | T14 |
| Resistance / vulnerability / immunity | No rule data wired |
| Expanded crit ranges, extra crit dice | No rule data (§9) |
| Reactions, opportunity attacks, concentration | No turn-interrupt model |
| Multiattack, extra attack, action economy | No action-economy model |
| Range, cover, positioning | Map data exists; no rule binding |
| Auto-derived weapon attacks from `equipment.ts` | `display-only` policy |
| Death saves, unconsciousness at 0 HP | HP floors at 0; `isDefeated` stays a host judgement |
| Equipment system, mod scripting, resolver registry, migration | Out of scope, all phases |
| Any COC / CP RED resolver | No second system until there is one |

---

## 14. Risks and hidden second sources of truth

**1. `src/lib/dnd2024/gameplay/**` — a complete parallel combat model.** It
contains `weaponAttackResolver.ts` (dagger-only, pure), `daggerAttackFlow.ts`,
`runtimeChangeApplier.ts`, `runtimeCombatStore.ts` (a **Zustand** store holding
its own `DndRuntimeEncounterState`), `runtimeLogDraftAdapter.ts`, and
`runtimeLogLocalStore`. It has its own actor ids, its own HP model, its own log
drafts. It is reachable from exactly one place: `DndRuntimeCombatDevPanel`,
mounted in `CampaignRuntimeShell` as `slotContent={{ devPanel: ... }}`.

Its own headers are honest about being v0 prototypes (*"No RuntimeLog append...
No UI / no Action Dock / no CampaignRuntimeShell wiring"*). But it now overlaps
T12 in name and intent, and `weaponAttackResolver` is a better-factored resolver
than what T12 will write — while being wired to nothing authoritative.

**Action:** T12 must not build on it (it models RuntimeChange against an
encounter state with no relationship to `Combatant` or the RuntimeLog), and must
not silently duplicate it either. Add a header note to `weaponAttackResolver.ts`
pointing at the T12 resolver as the authoritative path. Whether the dev-panel
stack is retired or promoted is a **separate decision, not part of T12** — but
two files that both look like "the D&D attack resolver" must not be left with
nothing saying which one runs.

**2. Host-client optimistic state.** `useCombatRuntimeTable` + `combatComfort`
still compute HP for the host's manual controls. If the T12 attack flow ever
routes through `table.damage()`, the arithmetic silently returns to the browser.

**3. `combatComfort.applyDamage` is shared.** T12 reuses it server-side, which is
right — one implementation of temp-HP absorption. It must stay pure, and a smoke
should assert that.

**4. `projectCombatPayload` will accumulate allow-list pressure.** T13 conditions
and T14 resources will each want fields carried through. The allow-list must stay
explicit and per-kind; the moment someone "simplifies" it to a raw passthrough,
redacted HP and AC leak.

**5. The action-authoring gap.** A PC with no host-authored action cannot attack.
Discovered at the table, that reads as a bug.

**6. Intent-index eviction.** See §B.

---

# Mandatory amendments

---

## §A. Event visibility and conservative shared text — corrected decision

### Authoritative rule

A `combat.attack_resolved` event must never expose more target information
than the viewer receives through the authoritative combatant projection.
T12 inherits current HEAD. This replaces the previous Host/owner-only assumption;
it does not change combat, map, HP, AC, temporary HP or spectator visibility.
Current `publicShared` intentionally carries exact HP, temporary HP and AC.
Existing regression expectations remain unchanged.

### Explicit per-kind allowlist

Public resolution facts: `mode`, `attackRawRolls`, `attackKeptRoll`,
`attackBonus`, `attackTotal`, `outcome`, `critical`, `natural1`,
`damageFormula`, `damageRawRolls`, `damageModifier`, `damageTotal`, `damageType`.
The event also projects schema/system/resolution/intent and actor/target combatant
identifiers. Fingerprints, session metadata, raw mutations, arbitrary fact-bag
keys and authored action names never pass through this allowlist.

Target facts follow the target returned by `projectCombatant`:

| Structured field | Required projected information |
|---|---|
| `targetAc` | Exact AC display |
| `beforeHp`, `afterHp` | Exact current HP display |
| `beforeTemporaryHp`, `afterTemporaryHp`, `absorbedByTemporaryHp` | Exact display exposing temporary HP |
| `amount` (actual HP lost after absorption and the zero floor) | Both current and temporary HP disclosure |

HEAD's `hpFor` emits the temporary property even when zero temporary HP is
represented by undefined. The event helper consumes that server-side projection
before JSON serialization; a partial exact display lacking temporary disclosure
receives no temporary HP facts or applied amount. Unknown, stage-only and missing
target projections fail closed. No role-to-visibility policy is duplicated here.
The raw `privileged` bag name is retained as storage structure; it is not a
Host/owner-only access rule.

### RuntimeLog.text

Shared text uses only roll total, outcome, natural/critical markers and damage
**rolled**, for example: `Attack: 23, hit. 9 damage rolled.`
It never includes AC, absolute HP, temporary HP, applied amount or absorption.
The builder accepts a narrow public-summary input and reads only those fields.
Names and free-form authored descriptions are omitted from shared text; safe
actor/target display names and richer details are rendered from the projected
structured payload in the initiating panel and history. There is no privileged
second text or parallel text visibility policy.

### Verification

Compare attack facts with combatant displays for host, owner, another player and
spectator. Cover exact, partial exact, stage, unknown and missing target displays;
assert unknown payload keys and raw mutations do not survive. Keep all existing
global visibility regression tests intact. Assert conservative text independently
of today's open policy.

---

## §B. Idempotency and retry — final mechanism

The durable mirror deduplicates by generated event id, which alone cannot
identify two declarations of the same action. T12 adds request identity without
changing the T7 persistence path or database schema.

1. The client mints a UUID on a deliberate attack, freezes actor, target, action
   and mode, and retains the pending intent across retries, panel remounts and tab
   reloads using session storage. Transport code never mints an id. A definitive
   4xx rejection clears the request; uncertain network/5xx failures retain it.
2. Scope is `(roomId, sessionId, memberId, intentId)`. The fingerprint includes
   actorCombatantId, targetCombatantId, actionId and normalized mode.
3. Reserve the key synchronously before asynchronous actor reads or RNG. Matching
   concurrent retries share one promise. A differing fingerprint returns HTTP
   409 `intent_reuse_mismatch` both during resolution and after completion.
4. Different intents queue by room through durable confirmation, so they resolve
   against sequential confirmed combat state. Structural application additionally
   checks the source revision and rejects overlapping internal proposals.
5. Completed cache entries are bounded at 512 globally. Every cache miss scans
   authoritative RuntimeLog history, including after eviction and after restart.
   History owns correctness; there is no eviction retry horizon or rebuild-once
   flag. A hit returns the original event/resolution/rolls with `replayed: true`.
6. Successful entries are remembered only after durable confirmation. Failure
   releases reservations and discards unpublished events. Existing T7 traffic
   gating and durability circuits remain responsible for live-room persistence.
7. Retries still validate current member/runtime access. They do not re-read
   authored action definitions, run rules/RNG, append, or rebroadcast.

The guarantee uses the existing single-process live-room authority and complete
restored RuntimeLog history. Multi-process room writers and history truncation
are outside this architecture. No migration or alternative persistence writer.

Coverage includes concurrent/sequential retry, independent intents, member and
session separation, all fingerprint fields, missing/malformed UUID, eviction,
restored history with a fresh index, durability failure/retry and frozen UI intent.

---

## §C. Host-controlled NPC / monster actor resolution — traced

### Trace

1. `RoomRuntimeActorProjection.bindingId` comes **only** from
   `room.lobby.actorBindings`, which `projectRoomRuntimeActorProjections`
   iterates. A `RoomActorBindingSummary` carries `memberId` — a binding is
   submitted by a member for their own actor and approved by the host.
2. Monster combatants are created by `handleCreateMonsterActorDraft`
   (`ServerCampaignWorkspace.tsx:448`), which creates a
   `campaign_actor_instances` row with
   `sourceActorId: 'private-monster:<templateId>'` and
   `overridePayload.dndLiteActorSheetV1` from `dndMonsterToLiteActorSheet`
   (which **does** carry `actions`). **No lobby binding is created, and no
   member owns it.**
3. `RoomRuntimeCombatPanel.addToken` builds the combatant with
   `sourceActorInstanceId: token.sourceActorInstanceId ?? token.campaignActorId`,
   `controllerUserId: token.controlledByUserId ?? token.ownerUserId`,
   `mapTokenId: token.id`.
4. `findProjectionForToken` matches `actorBindingId` first, then
   `campaignActorInstanceId`.

### Answer

**A host-controlled monster or NPC has no `actorBindingId`, and inventing one
would mean inventing a fake player ownership binding. The request must identify
`actorCombatantId`.**

The corrected request body:

```
POST /rooms/:roomId/runtime/dnd-attack
{ memberId, intentId, actorCombatantId, actionId, targetCombatantId, mode? }
```

### Kernel resolution chain

```
actorCombatantId
  -> combatant            (server replay of the raw runtime log)
  -> combatant.mapTokenId -> MapToken (roomMapRegistry) -> token.actorBindingId?
  -> combatant.sourceActorInstanceId
  -> campaign_actor_instances record
       REQUIRED: record.campaignId === room.campaignRef.campaignId
       REQUIRED: record.archivedAt is null
  -> overridePayload.dndLiteActorSheetV1.actions[actionId]
```

### Authorization — two branches, one path

**Full control** (host role, world-server owner, world-server admin — the
existing `fullControl` branch of `resolveRoomRuntimePermissions`):
may act for **any** combatant in the room. No binding is invented and none is
required. The campaign-actor record must still belong to the room's campaign.

**Player**: may act only through a combatant linked to an **approved lobby
binding they own**. The link is accepted only via a server-held path:

- `token.actorBindingId === binding.bindingId`, **or**
- `binding.campaignActorInstanceId === combatant.sourceActorInstanceId`

and in both cases `binding.memberId === memberId` **and**
`binding.status === 'approved'` **and** `record.ownerId === member.userId` — the
same ownership check `projectRoomRuntimeActorProjections` already performs.

### The rule that makes this safe

> **`Combatant.controllerUserId` and `Combatant.sourceActorInstanceId` are
> client-authored fields replayed out of the log — the host client wrote them.
> They may be used as a *link*. They must never be used as *authority*.**

Authority comes from `room.lobby.actorBindings` (server-held, host-approved) or
from the full-control role. The `record.campaignId` check is what stops a forged
`sourceActorInstanceId` from reading another campaign's actor.

The resolution service therefore needs `roomMapRegistry` as well as
`platformFoundationRepository`; `room-server.ts` already holds both and already
passes `roomMapRegistry.list(...)` into the projection.

### Smoke coverage

- Host attacks with a monster combatant that has no binding: succeeds.
- Player attacks with their own bound PC combatant: succeeds.
- Player attacks with **another player's** combatant: rejected.
- Player attacks with a **monster** combatant: rejected.
- Player whose binding is `pending` or `rejected`: rejected.
- Forged `sourceActorInstanceId` pointing at another campaign's actor: rejected
  on the `campaignId` check.
- Combatant whose `controllerUserId` names the requester but who owns no approved
  binding: rejected — proves `controllerUserId` grants nothing.

---

## §D. Server-resolved append authority — decision

**Chosen: B, in its strongest form — a partitioned kind space, with no boolean
anywhere.**

### Design

- `SERVER_RESOLVED_EVENT_KINDS = ['combat.attack_resolved'] as const`, declared
  once beside `ROOM_RUNTIME_LOG_EVENT_KINDS`.
- `appendRuntimeLogEvent` — the generic path used by the HTTP route, shared dice,
  and the audit log — gains exactly **one rejection**: any kind in
  `SERVER_RESOLVED_EVENT_KINDS` returns
  `decision: 'serverResolvedKind'`. It gains **no flag, no option, no boolean**.
- `applyRuntimeResolution.ts` exports `appendResolvedRuntimeEvent`, the only
  producer of those kinds, which rejects any kind **not** in the set.
- The shared room / member / binding / visibility validation is extracted into an
  internal `validateRuntimeLogAppendContext()` used by both, so the two paths
  cannot drift.

The partition is bidirectional: the generic path cannot write a resolved kind,
and the resolved path cannot write anything else.

### Why B over A

`resolvedByServer: true` is a boolean that lives in the same object shape a
request body deserializes into, and `appendRuntimeLogEvent` is already called
with a body-derived object literal at `room-server.ts:1148`. One careless spread
(`...body`) at any point in the future makes it settable from HTTP, and nothing
about the resulting code would look wrong.

A partitioned kind space has no such affordance. There is no value a request body
can carry that makes the generic path emit `combat.attack_resolved`, because the
check is on the kind itself — the very thing the caller is asking for.

### Requirements, all satisfied

- **Resolved authority never comes from an HTTP body** — there is no field to
  send. The route supplies intent; the kind is chosen by the resolution service.
- **Only approved server resolution code may invoke it** — `applyRuntimeResolution`
  is the sole caller of `appendResolvedRuntimeEvent`, asserted by a static scan.
- **Kind restricted to an explicit set** — `SERVER_RESOLVED_EVENT_KINDS`.
- **Hostile-input coverage** — below.

### Hostile-input smoke coverage

- `POST /rooms/:id/runtime-log/events` with `kind: 'combat.attack_resolved'`,
  as **host**: rejected, nothing appended.
- Same as **player**: rejected, nothing appended.
- Same with `resolvedByServer: true`, `serverResolved: true`, `internal: true`
  and a fully-formed `resolution` object in the body: still rejected — the fields
  do not exist.
- `POST /rooms/:id/runtime/dnd-attack` with `outcome`, `afterHp`, `damageTotal`,
  `attackBonus`, `attackKeptRoll`, `damageFormula`, `targetAc` in the body:
  every one ignored; assert the stored values differ from the injected ones.
- `appendResolvedRuntimeEvent` called with `chat.message`: rejected.
- Static scan: `SERVER_RESOLVED_EVENT_KINDS` is referenced in exactly two
  non-test modules.

---

## §E. RNG decision — approved, documented

**T12 v1 reuses the T1 D&D roller through a crypto-backed unit-interval
adapter. The T1 dice engine is not rewritten and not touched.**

```
DndRollRandom adapter:  () => randomInt(0, 2 ** 32) / (2 ** 32)
```

`randomInt` is `node:crypto`'s unbiased integer generator — the same primitive
`rollSharedDice` uses. The adapter's output is in `[0, 1)`, so
`rollDie`'s `floor(random() * sides) + 1` can never overflow `sides`.

### The bias, stated honestly

`rollDie` maps a uniform draw over 2^32 values onto `sides` faces. When `sides`
divides 2^32 the mapping is exactly uniform — this covers **d2, d4, d8, d16**.
When it does not, the remainder is distributed unevenly.

Worked example, **d20**: 2^32 = 4 294 967 296, and 4 294 967 296 / 20 =
214 748 364.8. Sixteen faces receive 214 748 365 source values and four receive
214 748 364 (16 x 214 748 365 + 4 x 214 748 364 = 4 294 967 296, exact). The
largest relative deviation from a perfectly fair d20 is therefore about
**3.7 x 10^-9** — roughly four parts per billion. The same bound, scaled by
`sides / 2^32`, applies to d6, d10, d12 and d100.

This is not zero and is not described as unbiased. It is roughly nine orders of
magnitude below anything a table could observe, and it buys full reuse of the
reviewed, smoke-asserted T1 rules code without editing a baseline file.

---

## §F. Final implementation files

The original file counts were estimates. The completed implementation uses:

| Area | Files |
|---|---|
| Data contracts | `systemResolutionTypes.ts`, `dndAttackIntent.ts`, the existing combat/runtime kind lists |
| Rules and declaration | `resolveDndAttackAction.ts`, `declareDndAttack.ts` |
| Kernel and retries | `applyRuntimeResolution.ts`, `resolvedIntentIndex.ts`, the append-service partition |
| HTTP wiring | `dndAttackHandlers.ts`, `room-server.ts`, `roomServerHttpClient.ts`, runtime permissions |
| Projection and replay | `projectAttackResolvedFacts.ts`, the existing combat projection and replay |
| UI | `RuntimeDndActionPanel.tsx`, `RoomRuntimeEntryBridge.tsx`, `RoomAttackResolutionDetails.tsx`, `RoomRuntimeLogPreviewPanel.tsx`, action dock/manual-control labels |
| Pending UI intent | `dndAttackPendingIntent.ts` |
| Validation | Eight T12 verify scripts, shared `t12TestFixture.ts`, additive persistence-smoke coverage and unchanged regression suites |
| Documentation | This corrected plan, final implementation report and prototype resolver header note |

The full paths, validation commands and outcomes are in
[T12_ACTION_RESOLUTION_REPORT_V1.md](./T12_ACTION_RESOLUTION_REPORT_V1.md).

### Preserved boundaries

- T1 dice and shared damage arithmetic are unchanged. Only type-import `.js`
  extensions in `dndDiceRoller.ts` and `combatComfort.ts` were needed for the
  server's NodeNext build.
- T7 persistence, durable confirmation, durability circuit, traffic middleware
  and campaign API writer guards are unchanged.
- T9/T10 character derivation and combatant seed are unchanged.
- T11 source review/hash/binding services are unchanged.
- Global combat/map/HP/AC/temporary HP/spectator projection rules and their
  regression expectations are unchanged. The only projection integration is
  the explicit attack-event helper call.
- No equipment data or display-only policy changes, migrations, Mod scripts,
  resolver registry, T13 or T14 work.
- The prototype gameplay resolver receives a boundary comment only.

---

## §G. Migration

**None required.** `combat.attack_resolved` enters `ROOM_RUNTIME_LOG_EVENT_KINDS`
through the P8-unified list, which both append validation and restart recovery
already consume. The durable envelope is kind-agnostic (`room.runtimeLog.`
prefix, JSONB payload). No column, no index, no backfill. Existing
`combat.damage_applied` events keep replaying unchanged. The intent index is
in-memory and reconstructed from the log.

Verified directly against real PostgreSQL 16 during the T11b follow-up:
`runtime_events.payload` is JSONB and `campaign_actor_instances` needs nothing new.

---

## §H. Test plan

**Unit — D&D resolver** (seeded deterministic RNG)

1. Normal hit vs AC; miss vs AC; exact `total === ac` hits
2. Advantage keeps the higher face, disadvantage the lower — both faces recorded
3. Nat20 hits vs AC 30; nat1 misses vs AC 1
4. Critical doubles dice, not the modifier (mirrors the T1 assertion)
5. Temp HP absorbs first; `afterHp` floors at 0; host defeat/status judgement is preserved
6. Unknown `actionId` -> rejected, no proposal
7. Action with no `damageFormula` -> hit with no damage block, never a throw
8. Static scan: the resolver names no room, socket, registry or repository
   (comments stripped)

**Unit — kernel**

9. `afterHp` above `hpMax` -> rejected, nothing appended
10. `afterHp` negative -> rejected
11. `beforeHp` disagrees with replayed state -> rejected
12. Mutation naming an unknown combatant -> rejected
13. `systemId` mismatch -> rejected
14. A rejected proposal appends **zero** events (registry write-count assertion)

**Privacy (§A)**

15. Gated numerals absent from `text`
16. Host/player/owner/spectator attack disclosure matches combatant projection
17. Partial, stage, unknown and missing target displays omit unavailable facts
18. Temp HP fields and applied amount require appropriate target disclosure

**Idempotency (§B)**

19. Same `(memberId, intentId)` twice -> one append, `replayed: true`, one RNG resolution
20. Different `intentId` -> two appends
21. Same `intentId`, different member -> not suppressed
22. Missing / malformed `intentId` -> 400, nothing appended
23. Durability failure -> no index entry, retry resolves
24. Restart rebuild -> retry suppressed, HP moved exactly once

**Authorization (§C)**

25. Host with an unbound monster combatant -> allowed
26. Player with their own approved-bound combatant -> allowed
27. Player with another player's combatant -> rejected
28. Player with a monster combatant -> rejected
29. Pending / rejected binding -> rejected
30. Forged `sourceActorInstanceId` (other campaign) -> rejected
31. `controllerUserId` matches but no approved binding -> rejected

**Append authority (§D)** — cases listed in §D.

**Restart recovery — the one that matters most**

32. Append attacks -> snapshot -> `restoreLiveRoomRuntimeLogs` -> replay ->
    assert deep equality of combatant HP, temp HP, and status
33. Replay with an RNG that throws if called -> state still reconstructs
34. Static scan: `combatRuntimeReplay.ts` references no RNG, no resolver,
    no `Math.random`
35. Restart round-trip preserves the new kind

---

## §I. Recommended implementation sequence

**T12-A — contract and rules, no wiring.** `systemResolutionTypes.ts`,
`resolveDndAttackAction.ts` + smoke, the public-summary builder and its
public-tier-only input type. No behaviour change; fully testable.

**T12-B — kernel, event, idempotency.** The new kind, the replay branch,
`applyRuntimeResolution.ts`, `resolvedIntentIndex.ts`, the
`appendRuntimeLogEvent` partition, and both smokes. Land the **restart-recovery
determinism test here** — before the feature is reachable, so a regression cannot
hide behind a working UI.

**T12-C — projection and privacy.** The projection-consistent allowlist plus every §A disclosure
assertion. Small, security-relevant, deserves its own diff.

**T12-D — route and permission.** `combat.action.declare`, the attack route, and
all hostile-input coverage from §C and §D.

**T12-E — UI.** Declaration, `intentId` minting on press, resolution rendering,
manual HP controls kept visibly separate, and the "no actions authored yet" notice.

**T12-F — validation and boundary note.** Full regression sweep, the
`weaponAttackResolver.ts` header note, the report.

A through D is the first playable attack. E makes it usable. F is the honesty pass.


## Implementation reconciliation (2026-09-10)

The file counts above are original estimates. The final report enumerates the
actual implementation and checks. The intent lives in the validated kernel
context rather than being trusted from a resolver proposal. Raw replay applies
structural mutations; viewer replay receives snapshots. T12 adds a narrow
authorized action-list endpoint for host NPC and player attack selection.
Only import extensions changed in the T1 roller and combat damage helper; their
arithmetic is unchanged. No T13/T14, equipment system, Mod scripting, resolver
registry, migration, commit or push is part of this delivery.
