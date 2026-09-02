# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Campaign Actor Source Baseline v1 (T11a)
- Name: `CAMPAIGN_ACTOR_SOURCE_BASELINE_V1`
- Goal: A campaign actor froze the character a host approved, but nothing
  recorded WHICH version it froze — `snapshot_hash` was NULL for every player
  character ever linked. A player could level up and no one could tell. This
  records a combat-relevant baseline at the moment of the link and reports, as
  one boolean, whether the source has moved since.
- Phase: Core D&D tabletop comfort — the third rung of CharacterData → Runtime
- Status: Implemented; awaiting local dependency-backed validation
- Explicitly NOT in this task: T11b (host review endpoint, derived proposal and
  field diff, explicit acceptance, review UI).

## Layer Declaration

- IA: No UI change at all. No new page, route, modal, dock action, panel or
  control. One optional boolean appears on an existing Runtime read.
- Object: No new object, no new table, no migration, no new combat event and no
  new event kind. `campaign_actor_instances.snapshot_hash` already existed and
  was already accepted by `createCampaignActorInstance`; it was simply never
  written. `RoomRuntimeActorProjection` gains one optional boolean.
- State: No new store, no schema change, no RuntimeLog write. The baseline is
  written exactly once, in the same INSERT that writes `snapshot_payload`.
- Authority: unchanged. The flag is a REVIEW SIGNAL, not a gate. It ejects no
  player, blocks no reconnect, refuses no room entry, and mutates no live
  combat. It never produces an admission status and specifically never produces
  `ActorAdmissionStatus = 'stale'`.
- Rules boundary: no rule is read, invented or applied. The covered field set is
  the set the T9 derivation reads, minus volatile values.
- Excluded: snapshot refresh, acceptance, review endpoints, review UI (all
  T11b); server-authoritative attacks (T12), typed conditions (T13), resources
  and slots (T14), AI, spells, inventory.

## Page Responsibility And Action Hierarchy

- The host remains the only reviewer. Nothing about this task decides for them.
- A difference means "a host may want to look", never "re-derive the sheet".
  Applying a derived sheet stays the explicit T9 `从角色卡填充` flow, and a
  GM-edited `override.dndLiteActorSheetV1` is never touched by this task.
- Hidden actions: any automatic snapshot refresh, any automatic re-derivation,
  and any projection of the hash itself to any client.

## Allowed Files

- `src/lib/dnd/dndCharacterCombatRelevantFields.ts` (new, pure)
- `src/lib/dnd/dndCharacterCombatRelevantFieldsSmoke.ts` (new)
- `server/services/dndCharacterCombatRelevantHash.ts` (new)
- `server/services/dndCharacterCombatRelevantHashSmoke.ts` (new)
- `src/lib/platform/roomRuntimeActorProjectionTypes.ts` (one optional field)
- `server/services/linkApprovedRoomBindingToCampaignActor.ts` (+ its smoke)
- `server/services/projectRoomRuntimeActorProjections.ts` (+ its smoke)
- `server/room-server.ts` (pass the read-only Vault port at one call site)
- `package.json` (two verify scripts)
- `TEST_CHECKLIST.md`, `docs/ai/ACTIVE_TASK.md`
- Prerequisite, applied first and gated on Windows builds:
  `.js` import suffixes in `src/lib/dnd-types.ts`,
  `src/lib/dnd/dndCharacterToLiteActorSheet.ts`,
  `src/lib/dnd2024/dndCharacterCombatMath.ts`,
  `src/lib/dnd2024/progression-utils.ts`, `src/data/classes.ts`,
  `src/data/dnd2024/classProgression.ts`

## Forbidden Changes

- Any migration or PostgreSQL schema change
- `UpdateCampaignActorInstanceInput` and the client-facing campaign actor update
  surface — a client-supplied `snapshotHash` or `snapshotPayload` must stay
  rejected/ignored
- `roomRuntimeEntryGuard.ts`, `ActorAdmissionStatus`, the admission pipeline
- Combat state, `combatRuntimeReplay.ts`, `combatRuntimeTypes.ts`, the runtime
  log, either kind whitelist, T7 files, T1 files
- CharacterData storage, `src/store/characterStore.ts`, the character builder
- `override.dndLiteActorSheetV1` — a GM's edited combat sheet
- AI, spell system, inventory system
- `output/`, `tools/`, `work/`, `.work/`, `.yuki-private-judge-stage/`

## Completion Criteria

- Two payloads produce the same canonical string exactly when they would derive
  the same combat sheet, for the covered fields; asserted in both directions,
  field by field.
- `snapshot_hash` is written at first link, from the SAME object stored as
  `snapshot_payload`, and stays NULL when the payload is not a character this
  build can read.
- Every non-comparison outcome projects the field as ABSENT — no stored
  baseline, an unrecognised baseline, no Vault port, a failed Vault read, an
  archived actor, an unreadable current payload, a non-DND system. Absence
  means unknown, never "unchanged".
- A level-up flags; a round of damage does not.
- The flag reaches the host and a member's own binding only; the hash itself
  reaches no client at all.
- A confirmed comparison, in either direction, leaves every combat value on the
  projection byte-identical, and a failed Vault read does not degrade
  `persistence`.
- The generic campaign actor update path still cannot write either field.
- Field, hash, link, projection, T9 and T10 suites, TypeScript, frontend build
  and server build all pass, in one isolated commit, before T11b starts.
