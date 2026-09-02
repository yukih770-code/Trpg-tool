# P8 Boundary Cleanup — Minimal Implementation Plan (P0-A + P0-B)

> Read-only plan. Nothing implemented. Both items are **pure de-duplication with
> no behavior change** — no new framework, no extensibility API, no migration.

## Sequencing constraint (read first)

`server/services/liveRoomRuntimeLogPersistence.ts` is touched by **both** P0
items **and** is one of the 41 uncommitted files in the historical worktree
(it carries the T7 reserved-prefix export). This cleanup must land **after**
Codex finishes landing that worktree, or the two edits collide.

---

# P0-A — one canonical source for system ids

## Current state (exact)

```
src/lib/platform/roomTypes.ts:38
    export type RoomSystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red' | 'custom';
server/services/createRoom.ts:42
    export const VALID_ROOM_SYSTEM_IDS: readonly RoomSystemId[] = ['dnd5e-2024','coc7e','cp-red','custom'];
server/services/createRoom.ts:80
    const systemId: RoomSystemId = input.systemId ?? 'dnd5e-2024';
server/services/liveRoomRuntimeLogPersistence.ts:94
    || (systemId !== 'dnd5e-2024' && systemId !== 'coc7e' && systemId !== 'cp-red' && systemId !== 'custom')
server/room-server.ts:716
    validateCampaignRef(body.campaignRef, body.systemId ?? 'dnd5e-2024')
```

Four hand-maintained copies of one list, across three kernel files plus the type.

## Change

**New file — `src/lib/platform/roomSystemRegistry.ts`** (~25 lines, no deps):

```ts
export const KNOWN_ROOM_SYSTEM_IDS = ['dnd5e-2024', 'coc7e', 'cp-red', 'custom'] as const;
export const DEFAULT_ROOM_SYSTEM_ID = 'dnd5e-2024';
export function isKnownRoomSystemId(value: unknown): value is RoomSystemId;
export function normalizeRoomSystemId(value: unknown): RoomSystemId | undefined;
```

**`src/lib/platform/roomTypes.ts:38`** — one line:

```ts
-export type RoomSystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red' | 'custom';
+/** Opaque, stable system identifier. Membership is validated at the boundary
+ *  by roomSystemRegistry — never by a literal union. */
+export type RoomSystemId = string;
```

**`server/services/createRoom.ts`** — re-export the registry list for
compatibility, drop the local array and the literal default:

```ts
export const VALID_ROOM_SYSTEM_IDS = KNOWN_ROOM_SYSTEM_IDS;   // keep the name
const systemId: RoomSystemId = input.systemId ?? DEFAULT_ROOM_SYSTEM_ID;
```

**`server/services/liveRoomRuntimeLogPersistence.ts:94`** — replace four
literals with `|| !isKnownRoomSystemId(systemId)`.

**`server/room-server.ts:716`** — `body.systemId ?? DEFAULT_ROOM_SYSTEM_ID`.

**Files touched: 5 (1 new). Import churn at the ~25 `RoomSystemId` call sites:
zero** — the type name and its module stay put.

## Why `string` and not a branded type

A brand (`string & {__brand}`) would require a cast at every construction site —
dozens of edits for no runtime benefit. Plain `string` keeps the diff at one
line. The user-visible contract becomes "opaque id, validated at the boundary",
which is the stated goal.

## Compatibility risks

1. **Loss of compile-time literal checking.** `const s: RoomSystemId = 'typo'`
   previously failed to compile; it now type-checks. Mitigated because the two
   places that matter — room creation and recovery validation — validate at
   runtime through the registry, and that is now the single source.
2. **Exhaustiveness — verified safe.** No `Record<RoomSystemId, …>` and no
   `switch` on a `RoomSystemId` exists. All seven `switch (systemId)` sites are
   on the separate three-member local unions (see "do not refactor").
3. `isActorVaultSystemId(systemId: RoomSystemId | undefined)` and
   `toRoomSystemId(systemId: string): RoomSystemId` both still compile — a
   literal union is assignable to `string`, and narrowing `string` by `===`
   still produces the narrow type.

## Migration impact

**None.** `system_id` is already `TEXT` in storage; no stored value changes.

---

# P0-B — one canonical RuntimeLog event-kind contract

## Current state (exact)

```
src/lib/platform/roomRuntimeLogTypes.ts:17   type RoomRuntimeLogEventKind = 5 literals | CombatRuntimeEventKind
server/services/appendRuntimeLogEvent.ts:32  const VALID_KINDS            = [same 5, ...COMBAT_RUNTIME_EVENT_KINDS]
server/services/liveRoomRuntimeLogPersistence.ts:40
                                             const ROOM_RUNTIME_LOG_KINDS = [same 5, ...COMBAT_RUNTIME_EVENT_KINDS]
```

The **type** is declared once; the **runtime list** is declared twice, by hand,
in two files that must agree. A kind added to `VALID_KINDS` only is accepted
live and then silently dropped by restart recovery.

## The fix already exists in this codebase

The map side does it correctly and has all along:

```
src/lib/platform/roomMapTypes.ts:16   export const ROOM_MAP_EVENT_KINDS = MAP_RUNTIME_EVENT_KINDS;
server/services/appendRoomMapEvent.ts:9        imports ROOM_MAP_EVENT_KINDS
server/services/liveRoomMapPersistence.ts:17   imports ROOM_MAP_EVENT_KINDS
```

P0-B is simply applying the map pattern to the RuntimeLog. No new idea.

## Change

**`src/lib/platform/roomRuntimeLogTypes.ts`** — add the const beside the type
and derive the type from it, mirroring how `CombatRuntimeEventKind` is already
derived from `COMBAT_RUNTIME_EVENT_KINDS as const`:

```ts
-import type { CombatRuntimeEventKind } from '../combat/combatRuntimeTypes.js';
+import { COMBAT_RUNTIME_EVENT_KINDS } from '../combat/combatRuntimeTypes.js';

+export const ROOM_RUNTIME_LOG_BASE_EVENT_KINDS = [
+  'system.note', 'chat.message', 'dice.roll', 'host.note', 'state.manualChange',
+] as const;
+
+/** The ONLY list. Append and restart recovery both consume this. */
+export const ROOM_RUNTIME_LOG_EVENT_KINDS = [
+  ...ROOM_RUNTIME_LOG_BASE_EVENT_KINDS,
+  ...COMBAT_RUNTIME_EVENT_KINDS,
+] as const;
+
+export type RoomRuntimeLogEventKind = typeof ROOM_RUNTIME_LOG_EVENT_KINDS[number];
```

**`server/services/appendRuntimeLogEvent.ts`** — delete `VALID_KINDS` (lines
32-39), import `ROOM_RUNTIME_LOG_EVENT_KINDS`, use it at the `:78` guard.

**`server/services/liveRoomRuntimeLogPersistence.ts`** — delete
`ROOM_RUNTIME_LOG_KINDS` (lines 40-48), import the same const, use it in
`eventKindOf` at `:80`.

**Files touched: 3. Net: −17 lines.**

## Why this is provably behavior-preserving

The two arrays are today **character-for-character identical** (same five base
kinds, same spread of `COMBAT_RUNTIME_EVENT_KINDS`). Replacing both with one
shared const cannot change which kinds are accepted or restored.

## Constraints preserved

- **No client/mod-defined kinds.** The list stays a compile-time `as const`
  tuple in the platform layer. Nothing reads it from a request, a pack manifest
  or the database. Extensibility is explicitly *not* introduced.
- **T7 single-write authority untouched.** No change to the reserved
  `room.runtimeLog.` / `room.mapEvent.` prefix rejection, the live-session 409
  path, or the append ordering.
- **Replay semantics untouched.** Kind strings are unchanged, so every stored
  row replays exactly as before.

## Compatibility risks

1. `roomRuntimeLogTypes.ts` gains a **value** import of
   `combatRuntimeTypes.js` (currently type-only). Verified no cycle:
   `roomRuntimeLogTypes → combatRuntimeTypes → roomRuntimeVisibility`, and
   `roomRuntimeVisibility` imports nothing. The file already uses `.js`
   suffixes, so NodeNext resolution is satisfied.
2. `[...A, ...B] as const` requires variadic tuple support — fine on the
   project's TypeScript 5.8.3.
3. `VALID_KINDS` is module-private today; deleting it breaks no external caller.

## Migration impact

**None.**

---

# Test and regression coverage

## Reuse (must stay green)

`alpha:verify:restart-recovery`, `alpha:verify:two-account-protocol`,
`api:verify:campaign-room`, `runtime:verify:room-runtime-actor-projection`,
`frontend:verify:combat-replay`, `frontend:verify:combat-runtime-table`,
plus the T7 live-room persistence smokes.

## Add — two assertions that would have caught the original bugs

**P0-B (the important one).** In the live-room RuntimeLog persistence smoke:
> for **every** kind in `ROOM_RUNTIME_LOG_EVENT_KINDS`, an appended event
> survives a persist → restart-restore round trip.

This is the regression that makes the classes of bug structurally impossible: a
future kind added to the const is automatically covered, and a kind that append
accepts but recovery drops fails the suite.

**P0-A.** In the create-room smoke:
> every id in `KNOWN_ROOM_SYSTEM_IDS` is accepted; an unknown id is rejected;
> an omitted id resolves to `DEFAULT_ROOM_SYSTEM_ID`,

and in the recovery smoke, that `campaignRefOf` accepts exactly the registry set
— pinning the two validators to one list.

---

# Explicitly NOT to refactor

- **`ActorVaultSystemId`** (`actorVaultRepositoryBridge.ts:31`) and
  **`LocalCampaignSystemId`** — three-member unions with no `'custom'`, used as
  `Record<…, number>` keys and `switch` subjects. They enumerate **which local
  browser stores exist**, not which systems the platform supports. Correctly
  closed. Leave alone.
- The ~6 local-store guards `value === 'dnd5e-2024' || 'coc7e' || 'cp-red'` in
  `campaignLocalStore`, `runtimeLogLocalStore`, `actorVaultLifecycleStore`,
  `campaignEntryDraftStore`, `campaignImportPreview`. Same reason.
- `toRoomSystemId` (`ServerCampaignWorkspace.tsx:105`) — becomes redundant but
  is harmless; removing it is unrelated churn.
- `ROOM_MAP_EVENT_KINDS` — already correct.
- Any renaming of `armorClass` / `initiativeModifier` (P2 in the audit).
- T1 dice files and all T7 behavior.
- **No system-registration API. No mod-supplied event kinds.** Both are
  explicitly out of scope; the registry is a static array.

---

# Can this land as one commit?

**Yes — one small `P8 boundary cleanup` commit is the right shape.**

- 8 files total (2 new), roughly +60 / −25.
- One shared file, `liveRoomRuntimeLogPersistence.ts`, but the two items touch
  **disjoint regions**: P0-A the `campaignRefOf` guard at `:94`, P0-B the kinds
  array at `:40`. No interleaving.
- Both are de-duplication with zero behavior change and zero migration, so the
  commit is atomically revertible and reviewable as one idea: *"every duplicated
  kernel allowlist gets one canonical source."*
- Splitting into two commits is also defensible if you prefer one concern per
  commit; nothing forces it.

**Precondition:** land only after Codex has landed the historical worktree,
since `liveRoomRuntimeLogPersistence.ts`, `room-server.ts` and
`appendRuntimeLogEvent.ts` are all in the uncommitted set.
