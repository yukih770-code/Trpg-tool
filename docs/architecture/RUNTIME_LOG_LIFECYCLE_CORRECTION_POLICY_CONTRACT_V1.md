# RuntimeLog Lifecycle / Correction Policy Contract v1

<!-- AI-LANDMARK: RUNTIME_LOG_LIFECYCLE_CORRECTION_POLICY_CONTRACT_V1 -->

Last updated: 2026-06-21

Status: architecture contract only.

Scope: platform RuntimeLog event lifecycle, correction, tombstone, local hide,
purge boundaries, export/import expectations, and future repository behavior.

This document does not implement UI, store writes, schema migration, backend,
multiplayer sync, permission enforcement, rules automation, AuditLog, map,
handout, CampaignMembership, CampaignActorInstance, RuntimeActor, or
RuntimeSession behavior.

## 1. Purpose

The platform now has a local RuntimeLog repository and `CampaignRuntimeShell`
can append browser-local events for system notes and manual state changes. That
is useful for the offline campaign MVP, but it creates a lifecycle risk:

```text
If a RuntimeLog event can be edited or deleted like ordinary UI state, the log
stops being reliable gameplay history.
```

This contract defines how RuntimeLog entries should be corrected, hidden,
tombstoned, exported, imported, and eventually purged without treating the log
as a rules engine, permission system, multiplayer protocol, or audit ledger.

## 2. Layer Identification

RuntimeLog events are `LogEvent` objects.

Related state layers:

- Current MVP local log storage is `Persistent Domain State` backed by local
  browser storage.
- The runtime shell entry context remains `Runtime Local Context`.
- Future shared runtime logs may become server-backed `Persistent Domain State`
  and may also feed `Server State` projections.
- RuntimeLog is not `Collaborative State` by default. Future collaboration can
  subscribe to the event stream, but events should still be appended through a
  repository/service boundary.

RuntimeLog must not collapse these layers:

```text
ActorVaultActor != CampaignActorInstance
CampaignActorInstance != RuntimeActor
RuntimeLog event != ActorVaultActor mutation
RuntimeLog event != CampaignMembership
RuntimeLog event != permission proof
RuntimeLog event != AuditLog event
```

## 3. Current Baseline

Current platform local repository:

```text
src/lib/platform/runtimeLogLocalStore.ts
```

Current local event shape:

```ts
interface LocalRuntimeLogEvent {
  id: string;
  campaignId: string;
  sessionId?: string;
  actorId?: string;
  systemId: LocalCampaignSystemId;
  type: RuntimeLogEventType;
  message: string;
  payload?: unknown;
  createdAt: string;
}
```

Current store behavior:

- append local event;
- list local events by campaign;
- list local events by session;
- physically delete one event through `deleteRuntimeLogEvent`;
- physically clear events for one campaign;
- physically clear all logs for local/dev use.

The physical delete and clear helpers are local/dev escape hatches. They are
not the preferred product lifecycle policy.

The older per-system `RuntimeLogEntry` / RollConsole model is still separate
from platform `LocalRuntimeLogEvent`. This contract governs the platform local
RuntimeLog repository first. Future convergence must be explicitly scoped.

## 4. Lifecycle Vocabulary

RuntimeLog lifecycle should use these conceptual states:

```ts
type RuntimeLogLifecycleStatus =
  | 'active'
  | 'hidden'
  | 'tombstoned'
  | 'purged';
```

- `active`: visible in normal runtime log views.
- `hidden`: hidden from default views but still present for export, recovery,
  and GM review.
- `tombstoned`: the original event content is no longer shown as a normal event,
  but its identity, timestamp, campaign/session references, and replacement or
  deletion reason remain available.
- `purged`: physically removed from storage after explicit local/dev or
  administrative policy.

Current MVP schema does not need to implement these fields immediately. Future
implementation must not use physical deletion as the normal substitute for
`hidden` or `tombstoned`.

## 5. Append-Only Principle

RuntimeLog is append-oriented.

Allowed:

- append gameplay events;
- append system notes;
- append manual state change notes;
- append correction events;
- append tombstone marker events if the store cannot yet decorate the original
  event;
- export existing events in stable chronological order.

Forbidden as normal product behavior:

- mutate an existing event message in place;
- rewrite an event's type, actor reference, campaign reference, or timestamp;
- delete an event silently because it was mistaken;
- use RuntimeLog as the source of truth for actor HP, SAN, Humanity, resources,
  inventory, permissions, or membership.

The event stream may be projected differently for Host View and Player View, but
projection is not permission enforcement.

## 6. Correction Policy

A correction is a new event that explains or supersedes a previous event.

Preferred future shape:

```ts
type RuntimeLogCorrectionPayload = {
  correctsEventId: string;
  reason?: string;
  correctedMessage?: string;
  correctedPayload?: unknown;
};
```

Rules:

1. The original event remains stored.
2. The correction event references the original event id.
3. The UI may display the corrected version as the default reading, but it must
   preserve access to the original event or an explicit "corrected" marker.
4. Correction does not mutate actor state. If gameplay state must change, that
   requires a separate explicit state-change workflow.
5. Correction does not grant authority. Future permission checks must come from
   membership/server policy, not from the existence of a correction event.

Current MVP may implement corrections as ordinary `system.note` or future
`log.corrected` events only when that implementation is explicitly scoped.

## 7. Tombstone Policy

A tombstone preserves the fact that an event existed while removing it from
normal gameplay reading.

Preferred future shape:

```ts
type RuntimeLogTombstonePayload = {
  tombstonesEventId: string;
  reason?: string;
  displayNameSnapshot?: string;
  redactionLevel: 'hideMessage' | 'hidePayload' | 'hideMessageAndPayload';
};
```

Rules:

1. Tombstone is preferred over physical delete for normal user flows.
2. Tombstone must keep enough metadata to preserve chronological history:
   event id, campaign id, session id when present, actor display snapshot when
   available, created timestamp, and tombstone timestamp.
3. Tombstone must not remove related actor, campaign, handout, map, scene, or
   membership records.
4. Tombstoned events should be excluded from default player-facing views unless
   a future projection contract says otherwise.
5. Host or administrative review may show tombstone markers.

Tombstone is not legal/privacy erasure. Privacy erasure is a separate policy
outside this MVP contract.

## 8. Hide Policy

Hide is a view/lifecycle decision, not a data deletion.

Use hide when:

- an event is noisy or table-private but still useful for GM review;
- an event should not be shown in default player projection;
- an MVP needs a reversible local cleanup without destroying history.

Rules:

1. Hidden events remain exportable unless the export scope explicitly excludes
   hidden items.
2. Hidden events remain referenceable.
3. Hide must not be presented as permanent delete.
4. Player projection must not use hidden/visible as proof of real permission.

## 9. Purge Policy

Purge is physical deletion.

Allowed only when:

- a local/dev clear/reset operation is explicitly requested;
- a future administrative policy explicitly allows purge;
- a future privacy/legal erasure workflow requires it;
- an import preflight rejects uncommitted events before write.

Rules:

1. Purge must require stronger confirmation than hide or tombstone.
2. Purge should recommend local export first when export exists.
3. Purge must never silently delete actors, campaigns, membership, maps,
   handouts, media, or package data.
4. Purge should record an AuditLog event in future backend/server phases.
5. The current `deleteRuntimeLogEvent`, `clearRuntimeLogForCampaign`, and
   `clearAllRuntimeLogsForDev` helpers must remain understood as local/dev
   escape hatches until lifecycle behavior is implemented.

## 10. RuntimeLog And AuditLog Boundary

RuntimeLog records gameplay and table activity.

AuditLog records administrative and data-management activity.

RuntimeLog examples:

- session started;
- roll performed;
- actor note;
- manual HP/SAN/Humanity/resource note;
- host system note;
- correction of a gameplay note.

AuditLog examples:

- campaign archived, trashed, restored, or purged;
- actor archived or purged;
- import accepted or rejected;
- member invited, assigned, removed, or role-changed;
- RuntimeLog event hidden, tombstoned, or purged.

The local MVP does not need a real AuditLog before this contract can exist.
Future lifecycle implementation should not pretend RuntimeLog is a complete
administrative audit system.

## 11. Actor Reference Policy

Current MVP `actorId` may point to a local selected actor id carried from
runtime entry context. It is not persistent membership and it is not a
CampaignActorInstance.

Future RuntimeLog actor references should prefer the policy from
`CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md`:

```ts
type RuntimeLogActorRef = {
  runtimeActorId?: string;
  campaignActorInstanceId?: string;
  sourceActorVaultActorId?: string;
  displayNameSnapshot: string;
};
```

Rules:

1. Always keep a display name snapshot when a stable actor reference is
   available.
2. Do not mutate ActorVaultActor from RuntimeLog.
3. Do not infer CampaignMembership from `actorId`.
4. Do not infer player control rights from `actorId`.
5. Do not block old logs just because the source actor was archived or deleted;
   prefer snapshots and tombstones.

## 12. Export / Import Policy

RuntimeLog export must preserve lifecycle information when lifecycle fields
exist.

Minimum export expectations:

- stable event id;
- campaign id;
- session id when present;
- actor reference or actor snapshot when available;
- event type;
- message or tombstone/redaction marker;
- payload when allowed by export scope;
- created timestamp;
- correction/tombstone references when present.

Import rules:

1. Import must validate event shape before write.
2. Import must show preview and warnings before commit.
3. Import must not silently overwrite local events with the same id.
4. Import should detect correction/tombstone references whose target event is
   missing and show warnings.
5. Import must distinguish local backup import from Workshop/content package
   installation.

## 13. UI Projection Rules

Future UI may show:

- normal active events;
- corrected event markers;
- hidden event count or host-only review;
- tombstone markers;
- export warnings before purge.

UI must not:

- show dev clear/reset as ordinary delete;
- hide physical delete behind a vague label;
- imply player/host permissions are enforced by the local UI;
- imply multiplayer sync exists because a log exists;
- imply manual state change notes modified character sheet state.

Any UI implementation touching RuntimeLog lifecycle must run the navigation,
button semantics, placeholder, and destructive-action checks from the relevant
platform contracts.

## 14. Repository Implementation Guidance

Future local store alignment should prefer an additive migration:

```ts
interface LocalRuntimeLogEventV2 extends LocalRuntimeLogEvent {
  lifecycleStatus?: RuntimeLogLifecycleStatus;
  correctedByEventId?: string;
  tombstonedByEventId?: string;
  hiddenAt?: string;
  hiddenReason?: string;
}
```

This is a conceptual implementation guide, not an approved schema by itself.

Implementation order should be:

1. Add contract and acceptance checks.
2. Add lifecycle fields through a scoped local-store alignment task.
3. Add correction/tombstone append helpers.
4. Update runtime log projection to filter active/hidden/tombstoned events.
5. Include lifecycle fields in local export envelope.
6. Validate lifecycle references in local import preflight.

Do not introduce backend, multiplayer, real permission enforcement,
CampaignMembership, CampaignActorInstance, RuntimeActor, RuntimeSession, map,
handout, or rules automation while implementing local RuntimeLog lifecycle.

## 15. Stop Conditions

Stop and report instead of implementing when a task would:

- mutate historical RuntimeLog events in place as the default correction method;
- physically delete events in normal product flow without tombstone or export
  warning;
- treat RuntimeLog as actor state or rules resolution;
- treat RuntimeLog as AuditLog;
- persist selected runtime actor context as CampaignMembership;
- infer host authority from local UI projection;
- add backend/multiplayer/session authority without a dedicated contract;
- import RuntimeLog events without validation and preview.

## 16. Acceptance Checklist

Future RuntimeLog lifecycle implementation must answer:

1. Which layer is touched: LogEvent, Projection, RuntimeObject, CampaignObject,
   or OwnedObject?
2. Is the action append, correction, hide, tombstone, or purge?
3. Does correction append a new event instead of rewriting history?
4. Does tombstone preserve references and display snapshots?
5. Is physical delete restricted to local/dev, administrative, or privacy/legal
   policy?
6. Does the implementation avoid confusing RuntimeLog with AuditLog?
7. Does it avoid actor store writes, campaign membership writes, runtime actor
   persistence, backend sync, or permission enforcement?
8. Does export preserve lifecycle metadata?
9. Does import validate lifecycle references and avoid silent overwrite?
10. Are placeholders and disabled actions clearly labeled?

