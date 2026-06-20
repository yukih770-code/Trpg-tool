# Data Management MVP Scope v1

Status: architecture scope contract only.

This document defines the smallest data-management path that can turn the current
platform shell into a local, personal campaign tool. It does not authorize UI,
store, repository, schema, runtime, backend, multiplayer, or rule-engine changes
by itself.

## 1. Purpose

The current platform has strong information architecture, workspace shells,
campaign entry bridges, runtime projection shells, and contract boundaries. Many
areas are still UI shell, local component state, placeholder data, or contract
only.

The Data Management MVP targets an offline, personal GM/player workflow:

- create, save, read, update, archive, and export local characters where the
  current system store supports it;
- create, save, read, update, archive, and export local campaigns;
- carry an actor into campaign entry as local UI context;
- enter `CampaignRuntimeShell` with a local runtime context;
- record a minimal append-only local runtime log;
- manually record HP, SAN, Humanity, and resource changes;
- import/export a local JSON envelope for backup and transfer.

This is not a public platform launch, not real multiplayer, not account-based,
not a full permissions system, not a Workshop installer, and not a full map or
VTT implementation.

## 2. Prior Audit Baseline

The MVP starts from the following data-management audit grades:

| Module | Current Grade | Meaning |
| --- | --- | --- |
| Actor / Character Management | B | Partial local implementation. |
| Character Sheet Data | B | Partial local implementation and runtime summaries. |
| Campaign Management | C | UI shell only. |
| Campaign Entry / Suggested Actor Flow | C | UI shell and local flow only. |
| Campaign Membership / Participant | D | Contract only. |
| RuntimeLog | C | UI shell / static placeholder only. |
| Map / Scene | E | Missing as real data management. |
| Handout | C/D | Placeholder shell / contract direction only. |
| Import / Export | B/D | Existing character import/export exists in places; platform export envelope is contract only. |

The grades are intentionally conservative. A page, card, button, or placeholder
does not count as real data management.

## 3. MVP Boundaries

The MVP is for local browser/notebook use. It should be useful for one person
running or preparing a campaign on one machine.

The MVP does not include:

- real multiplayer sync;
- WebSocket or server authority;
- public deployment;
- account system;
- complete permissions;
- real `CampaignMembership`;
- real `CampaignActorInstance`;
- full Workshop install/update/dependency management;
- full map, scene, token, fog, or drag/drop system;
- real Handout publication workflow;
- MediaAsset upload pipeline;
- Compendium management;
- backend persistence.

## 4. Required MVP Modules

### 4.1 Actor / Character Local Repository Bridge

The first MVP layer should not rewrite the three existing character stores. It
should introduce a platform adapter or bridge over existing system-specific
storage and expose a minimal Actor Vault interface.

Minimum capability:

- list actors;
- read actor summary/detail;
- create actor when the underlying system already supports it;
- update actor when the underlying system already supports it;
- delete/archive actor when safely supported;
- expose explicit system limitations.

Important system notes:

- DND already has multi-character local storage behavior and can be treated as
  the first practical local MVP source.
- COC and CP RED currently behave more like single-actor or runtime-page assets.
  Their wrappers must clearly state that they are not full multi-character
  repositories yet.
- The bridge must not pretend that all systems already have equal CRUD depth.

Suggested shape:

```ts
interface ActorRepositoryBridge {
  systemId: string;
  listActors(): Promise<ActorVaultSummary[]>;
  readActor(actorId: string): Promise<ActorVaultDetail | null>;
  createActor?(input: unknown): Promise<ActorVaultDetail>;
  updateActor?(actorId: string, patch: unknown): Promise<ActorVaultDetail>;
  archiveActor?(actorId: string): Promise<void>;
  exportActor?(actorId: string): Promise<unknown>;
}
```

This is a repository bridge contract, not a new persisted schema by itself.

### 4.2 Campaign Local Store

`CampaignLibraryShell` must eventually stop relying on a hard-coded sample
campaign as the only apparent campaign. The MVP needs a local campaign store
with explicit CRUD boundaries.

Minimum model:

```ts
interface LocalCampaign {
  id: string;
  systemId: 'dnd5e-2024' | 'coc7e' | 'cp-red';
  title: string;
  description?: string;
  roomCode?: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

Minimum capability:

- create campaign;
- list campaigns by system;
- read campaign detail;
- update title, description, and status;
- archive campaign;
- export campaign metadata.

This local store is not the final backend schema. It is an offline MVP storage
layer that must remain easy to migrate or export later.

### 4.3 Campaign Entry Draft

Campaign entry currently uses `suggestedActor` and local runtime context. The
MVP may persist only an entry draft, not real membership.

Allowed MVP concept:

```ts
interface CampaignEntryDraft {
  campaignId: string;
  systemId: string;
  suggestedActorId?: string;
  suggestedActorName?: string;
  updatedAt: string;
}
```

Rules:

- `suggestedActor` is a UI preview or recommendation.
- `selectedActorId` may be created only as local entry/runtime context when the
  user clicks the campaign entry CTA.
- `selectedActorId` is not persistent `CampaignMembership`.
- Campaign entry context is not real campaign membership.
- No `CampaignActorInstance` is created in this MVP.

### 4.4 RuntimeLog MVP

`CampaignRuntimeShell` currently presents a structured log shell. The MVP should
add a local append-only event log per campaign/session.

Minimum event types:

```ts
type RuntimeLogEventType =
  | 'session.started'
  | 'roll.performed'
  | 'actor.note'
  | 'actor.hpChanged'
  | 'actor.resourceChanged'
  | 'actor.sanChanged'
  | 'actor.humanityChanged'
  | 'system.note';
```

Minimum model:

```ts
interface LocalRuntimeLogEvent {
  id: string;
  campaignId: string;
  sessionId?: string;
  actorId?: string;
  systemId: string;
  type: RuntimeLogEventType;
  message: string;
  payload?: unknown;
  createdAt: string;
}
```

Rules:

- RuntimeLog is append-only for MVP.
- RuntimeLog is not a rules engine.
- RuntimeLog does not prove permissions.
- RuntimeLog does not imply multiplayer sync.
- Roll entries may be manually recorded or connected to existing local roll UI
  only in a future implementation task.

### 4.5 Manual State Change MVP

The first playable data management value should come from manual state changes,
not full automation.

Minimum per-system scope:

- DND: HP, class resource, and spell slot placeholder notes.
- COC: HP, SAN, Luck, and MP.
- CP RED: HP, Humanity, EMP, and armor note.

Rules:

- State changes are manual.
- Each change should append a RuntimeLog event.
- No full rest automation is required.
- No full class resource, spell preparation, combat, or damage automation is
  required.
- System-specific stores must not be rewritten without a dedicated schema task.

### 4.6 Local Import / Export MVP

The MVP should support a local JSON backup envelope covering actors, campaigns,
entry drafts, and runtime logs.

Suggested envelope:

```ts
interface LocalDataExportEnvelope {
  format: 'trpg-platform-local-data';
  version: 1;
  exportedAt: string;
  actors: unknown[];
  campaigns: LocalCampaign[];
  campaignEntryDrafts?: CampaignEntryDraft[];
  runtimeLogs: LocalRuntimeLogEvent[];
}
```

Import rules:

- show preview before import;
- show validation warnings;
- do not silently overwrite existing local data;
- allow cancel before write;
- distinguish local backup import from Workshop package install.

This is not a Workshop package installer, dependency resolver, source manager, or
community content subscription system.

## 5. Explicit Non-MVP Modules

These modules should remain out of the Data Management MVP unless a later task
explicitly scopes them:

- real `CampaignMembership`;
- real `CampaignActorInstance`;
- participant/controller relationships;
- primary host enforcement in code;
- full permissions and visibility projection;
- server-backed RuntimeSession;
- multiplayer sync;
- map/scene/token data contracts and UI;
- Handout publish/visibility system;
- Workshop package install/update/dependency system;
- MediaAsset upload and storage pipeline;
- full Compendium management;
- account and cloud backup.

## 6. Implementation Order

The recommended implementation order is:

1. Campaign Local Store v1.
2. Connect `CampaignLibraryShell` to real local campaign CRUD.
3. ActorVault repository bridge audit and minimal unified interface.
4. Campaign Entry Draft local context.
5. RuntimeLog local repository v1.
6. Connect `CampaignRuntimeShell` to real RuntimeLog read/append.
7. Manual state change actions that append RuntimeLog events.
8. Local import/export envelope with preview and validation.

This order makes campaigns real before runtime logs, and makes runtime logs real
before broad state mutation. It also keeps membership and multiplayer out of
scope until the local data model is stable.

## 7. Boundary Warnings

- Campaign Entry Draft is not `CampaignMembership`.
- `suggestedActor` is not `selectedActorId`.
- `selectedActorId` in local runtime context is not persistent campaign
  membership.
- `RuntimeLog` is not a rules engine.
- Local campaign store is not the final backend schema.
- COC and CP RED single-actor wrappers are not full multi-character support.
- Sample campaigns must not impersonate real campaign management once local CRUD
  exists.
- Host/player projection in UI is not a real permissions system.
- Import/export backup is not Workshop installation.

## 8. MVP Acceptance Checklist

Data Management MVP can be considered complete only when:

- local campaigns can be created, listed, edited, archived, and exported;
- Actor Vault can read/list actors through system adapters with limitations
  clearly surfaced;
- campaign entry can carry a suggested actor into local runtime context without
  creating membership;
- RuntimeLog can append and read local events per campaign;
- manual HP/SAN/Humanity/resource changes produce log entries;
- local export/import can round-trip MVP data with validation preview;
- UI labels do not imply real multiplayer, permissions, membership, Workshop, or
  map support.

## 9. Future Backend Boundary

Future backend work should treat the MVP local repositories as a migration
source, not as the final domain schema. Backend phases should separately define:

- canonical IDs;
- user accounts;
- campaign ownership;
- participant membership;
- server-authoritative RuntimeSession;
- permission checks;
- sync conflict handling;
- media storage;
- package installation and versioning.

Until then, the local MVP must stay honest: it is a local personal data manager
for offline preparation and lightweight table use.
