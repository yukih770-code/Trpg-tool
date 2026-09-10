# T12 authoritative action resolution — final implementation report

Date: 2026-09-10. T12-A through T12-F are implemented and validated in the current
worktree. No commit, push, migration or T13 work was performed. Pre-existing
unrelated workspace changes were preserved.

## Delivered behavior

A host or authorized player declares an attack using `actorCombatantId`,
`targetCombatantId`, `actionId`, a UUID `intentId`, and a roll mode. The server
authenticates the requester, resolves actor ownership and campaign membership,
reads the authored Lite Sheet action, rolls through the T1 rules engine, and
records one `combat.attack_resolved` event after structural validation and durable
confirmation. The browser receives the projected event and replays its combat
snapshot. It does not determine hit, damage or HP.

| Phase | Result |
|---|---|
| T12-A | Data-only proposal/mutation contract; pure D&D resolver; authored weapon/spell attacks; crypto-backed T1 adapter; conservative summary builder |
| T12-B | Private resolved append producer; generic-append rejection; structural validation; recorded-fact replay; concurrent intent reservations; bounded cache with history fallback |
| T12-C | Explicit attack allowlist consulting the existing projected target; current visibility preserved; partial/unknown projection coverage |
| T12-D | Authorized attack and action-list HTTP endpoints; live session/member/campaign/actor checks; projected response; broadcast only after successful confirmation |
| T12-E | Player declaration and host actor/NPC selection; frozen retry intent; authoritative result display in the initiating panel and history; authored-action empty state; separate manual HP controls |
| T12-F | Eight T12 smoke commands, 30 regression commands, frontend/server builds and TypeScript checking; corrected plan and prototype boundary note |

## Server authority and rules

`POST /rooms/:roomId/runtime/dnd-attack` accepts this intent:

```json
{
  "memberId": "player",
  "intentId": "a6d704b7-48b1-4e10-9d1f-65756cb2a354",
  "actorCombatantId": "pc",
  "targetCombatantId": "npc",
  "actionId": "sword",
  "mode": "normal"
}
```

Mode also supports `advantage` and `disadvantage`. The request reader copies
only intent fields. Client-supplied bonuses, AC, faces, totals, critical flags,
damage formulas, HP values and controller hints cannot determine the result.

The existing server permission guard binds the member to the authenticated
viewer. Host control requires no invented actor binding. Players need their own
approved lobby binding and matching campaign actor ownership. Actor and map
source identifiers are links, not permission grants. The actor must belong to
the room's campaign and must not be archived. The runtime session must be active,
unarchived and associated with the room/campaign. Actor and target combatants
must be active and not marked defeated.

`GET /rooms/:roomId/runtime/dnd-actions?memberId=...&actorCombatantId=...` applies
the same access checks and returns identifiers/names/kinds of valid authored
attacks for selection. Declaration re-reads the action from
`overridePayload.dndLiteActorSheetV1.actions`; it does not trust this earlier
selection response for rule values.

The resolver supports normal/advantage/disadvantage rolls, AC equality as a hit,
natural 20 auto-hit/critical, natural 1 auto-miss, doubled critical dice with the
flat modifier unchanged, temporary HP absorption and a zero HP floor. An attack
without a damage formula records its outcome without damage. Missing/malformed
actions are rejected. Host defeat judgement is preserved; reaching zero does not
introduce conditions, death saves or automatic defeated status.

The RNG adapter is `randomInt(0, 2 ** 32) / 2 ** 32`, explicitly injected into T1.
It is crypto-backed but not described as perfectly unbiased when mapped onto
every die size. T1 and the reused damage helper retain their original arithmetic;
their only edits are `.js` type-import extensions for NodeNext compilation.

## One event, structural application and replay

The kernel snapshots the proposal, checks system/session identity and the source
log revision, validates actor/target existence, requires exactly one target HP
mutation, verifies before-values, and checks safe nonnegative integer HP/temp HP
with the existing HP maximum bound. Rejected proposals append nothing.

`appendResolvedRuntimeEvent` is private to `applyRuntimeResolution.ts`.
`appendRuntimeLogEvent` rejects `SERVER_RESOLVED_EVENT_KINDS` for both host and
player callers. No client flag grants the internal append capability.

The raw event stores:

- Schema/system/resolution/intent IDs and actor/target combatant IDs.
- Public resolution facts in `resolution`.
- Target AC, absorption and actual HP loss in `privileged`.
- Before/after HP and temporary HP in one structural `mutations` entry.
- Server-only session and fingerprint metadata for retry matching.

The normal fixture resolves d20 **11 + 5 = 16**, rolls **5 + 3 = 8** damage,
absorbs **4** temporary HP, and moves HP **30 → 26**, temporary HP **4 → 0**.
There is one event, not a separate attack event plus damage event. A miss uses
the same kind with unchanged HP and no damage block.

Raw replay assigns the stored mutation after-values. Viewer replay consumes
the projected combatant snapshot. Neither path invokes rules or RNG. Tests
round-trip the event through the actual persistence-envelope/restore services
using an in-memory repository fixture, compare restored event/state equality,
and retry the restored intent with a fresh index that must not resolve again.

## Corrected visibility decision

Current HEAD's combatant projection is authoritative. T12 does not change global
combat, map, HP, AC, temporary HP or spectator visibility. The existing
`publicShared` behavior remains exact-visible and its old tests are unchanged.

The attack helper receives the target already produced by `projectCombatant`:

| Fields | Disclosure condition |
|---|---|
| Mode, attack rolls/kept roll/bonus/total, outcome, critical/natural-1, damage formula/rolls/modifier/total/type | Explicit public resolution allowlist |
| `targetAc` | Exact AC display |
| `beforeHp`, `afterHp` | Exact current HP display |
| `beforeTemporaryHp`, `afterTemporaryHp`, `absorbedByTemporaryHp` | Exact display exposing temporary HP |
| `amount` | Current HP and temporary HP disclosure |

HEAD's exact display emits a temporary property even when zero is represented by
undefined. This is checked against the server projection before JSON serialization.
Partial exact displays, stage/unknown displays and missing targets omit fields
they do not disclose. Unknown payload keys, raw mutations, fingerprints and
session metadata do not pass the attack allowlist, including for hosts.

The `privileged` bag name does not define a new Host/owner-only policy. Tests
compare its contents against real host/owner/publicShared projections, including
another player and a spectator, and independently exercise restricted displays.

Shared text remains `Attack: 16, hit. 8 damage rolled.` It excludes actor/target
names, authored descriptions, AC, absolute HP, temporary HP, absorption and
applied amount. Rich details and available display names render from structured
projection in both the initiating panel and history. Text is not a second
visibility-policy implementation.

## Retry, concurrency and durability

- Scope is `(roomId, sessionId, memberId, intentId)`; the fingerprint includes
  actor, target, action and normalized mode.
- Synchronous pending reservations precede asynchronous source reads and RNG.
  Matching concurrent requests share one resolution promise.
- Any fingerprint mismatch returns 409 `intent_reuse_mismatch`, including
  pending requests, completed cache hits and history fallback.
- Different intents queue by room through confirmation. Revision checks and an
  internal pending-room guard reject stale or overlapping proposals.
- The completed cache is bounded to 512 entries globally. Every cache miss scans
  authoritative history, so eviction does not permit re-execution. A fresh index
  after restore uses the same fallback.
- A retry returns the original event/resolution/rolls with `replayed: true`.
  It rechecks member/runtime access, but does not re-read the action, run RNG,
  append another event or rebroadcast.
- Durability failure releases reservations, discards unpublished events and
  produces no successful response or broadcast. The existing T7 traffic gate,
  confirmation path, persistence services and durability circuit are unchanged.
- The UI mints on deliberate action, freezes the intent, and retains uncertain
  network/5xx requests for retry through session storage. Success or definitive
  4xx rejection clears it. Disabled storage retains in-memory retries only.

This guarantee uses the existing single-process live-room authority and complete
RuntimeLog history. It does not introduce multi-process coordination, a new
persistence writer, history compaction or a database migration.

## Validation results

All eight T12 commands passed:

```text
runtime:verify:t12-resolver
runtime:verify:t12-kernel
runtime:verify:t12-intents
runtime:verify:t12-visibility
runtime:verify:t12-http
runtime:verify:t12-boundaries
frontend:verify:t12-intents
frontend:verify:t12-rendering
```

The HTTP smoke uses a real loopback Express listener and requests, with an
in-memory actor/session/persistence fixture. It verifies authenticated own-PC and
host-NPC attacks, rejected ownership/member/binding/campaign/runtime cases,
hostile authoritative-looking fields, simultaneous duplicate requests, each
fingerprint field, delayed retry after action changes, and durability failure
without append/publication. Boundary tests inspect TypeScript syntax trees for
rule-free replay/kernel imports, the private producer and intent-only UI imports.
Rendering tests use React server rendering, not a browser simulation.

All 30 selected existing regression commands passed:

```text
frontend:verify:combat-runtime-table
frontend:verify:combat-replay
frontend:verify:combat-mode-hud
frontend:verify:runtime-combat-controls
frontend:verify:runtime-player-turn-callout
frontend:verify:mobile-combat-hud-presentation
runtime:verify:room-combat-controls
frontend:verify:dnd-comfort-combat
frontend:verify:map-runtime
frontend:verify:runtime-map-tool-presentation
frontend:verify:runtime-map-panel-coordination
frontend:verify:actor-presence
frontend:verify:token-rendering
runtime:verify:room-socket-reconnect
runtime:verify:durable-append-confirmation
runtime:verify:durability-circuit
runtime:verify:room-traffic-gate
runtime:verify:room-traffic-middleware
room:verify:map-bridge
runtime:verify:room-permissions
runtime:verify:token-ownership
runtime:verify:runtime-visibility-projection
frontend:verify:token-inspect-safe-visual-surface
frontend:verify:room-permissions
frontend:verify:dnd-dice
frontend:verify:shared-dice
runtime:verify:combatant-seed
runtime:verify:live-room-log-recovery
runtime:verify:live-room-map-recovery
runtime:verify:room-runtime-actor-projection
```

`npm run lint`, `npm run server:build` and `npm run build` passed. The Vite build
transformed 2,211 modules. T12-scoped `git diff --check` passed. The unrestricted
check reports a pre-existing trailing blank line in `scripts/dev-local.ps1`,
which this continuation did not edit. The new owner-projection fixture initially
missed a required author field; it was corrected and final type checking passed.

No real PostgreSQL instance, deployed service or interactive browser session was
used for this validation. Persistence/recovery assertions exercise the real
services with repository fixtures; UI assertions cover rendering and the pending
intent state helper. These are the practical limits of the reported verification.

## File inventory and boundaries

New production files:

```text
server/api/dndAttackHandlers.ts
server/room/projectAttackResolvedFacts.ts
server/services/applyRuntimeResolution.ts
server/services/declareDndAttack.ts
server/services/resolveDndAttackAction.ts
server/services/resolvedIntentIndex.ts
src/components/platform/RoomAttackResolutionDetails.tsx
src/lib/dnd/dndAttackIntent.ts
src/lib/dnd/dndAttackPendingIntent.ts
src/lib/platform/systemResolutionTypes.ts
```

New validation files are the eight smoke entrypoints named by the T12 scripts
and `server/services/t12TestFixture.ts`. Existing integration edits are in
`server/room-server.ts`, `server/room/roomRuntimeVisibilityProjection.ts`,
`server/services/appendRuntimeLogEvent.ts`, the persistence smoke,
`RoomRuntimeCombatPanel.tsx`, `RoomRuntimeEntryBridge.tsx`,
`RoomRuntimeLogPreviewPanel.tsx`, `RuntimeActionDock.tsx`,
`RuntimeDndActionPanel.tsx`, combat types/replay, runtime log types/permissions,
the room HTTP client, the two type-import adjustments, `package.json`, and the
prototype `weaponAttackResolver.ts` header.

The corrected plan is `docs/implementation/T12_ACTION_RESOLUTION_PLAN_V1.md`.
No equipment system, automatic equipment-derived attacks, T13 conditions,
T14 resources, Mod scripting, resolver registry, migrations, resistance rules,
action economy or prototype gameplay promotion was added. No commit or push.
