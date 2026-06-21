# Data Lifecycle & Deletion Policy v1

<!-- AI-LANDMARK: DATA_LIFECYCLE_AND_DELETION_POLICY_V1 -->

This contract defines the platform policy for data lifecycle, deletion, recovery, reference safety, and future audit behavior.

这是数据安全、生命周期和删除策略契约。它用于指导后续 CRUD、归档、恢复、回收站、导入导出和审计日志实现。

This document is not a UI redesign, not a backend schema finalization, and not a permission-system implementation. It does not authorize changes to stores, migrations, runtime logic, rules, or repository behavior by itself.

## Reference Principles

Mature systems use layered data states instead of treating every removal as an immediate hard delete:

- Social platforms separate unpublish, hide, archive, restore, and permanent deletion. Visibility changes do not automatically erase history.
- Game save systems use save slots, backups, copy/overwrite confirmation, and rollback paths before destructive replacement.
- Banking and audit systems keep append-only critical histories; deleting a visible object does not erase the fact that an action happened.
- SaaS admin tools use explicit status fields, archive views, trash views, filters, batch actions, permission boundaries, and recovery windows.
- File systems normally move objects to trash first; permanent delete requires a second explicit confirmation.

The platform should follow the same safety posture: reversible actions by default, irreversible actions only after explicit warning, and references preserved whenever possible.

## Lifecycle Status

Future platform repositories should converge on this lifecycle vocabulary:

```ts
type DataLifecycleStatus =
  | 'active'
  | 'archived'
  | 'trashed'
  | 'purged';
```

- `active`: The object is visible in normal lists and available for normal use.
- `archived`: The object is hidden from default lists but remains recoverable and referenceable.
- `trashed`: The object was explicitly deleted by the user into a recovery area.
- `purged`: The object was physically removed after explicit confirmation and should no longer be recoverable through normal app flows.

Current MVP stores may not implement every status yet. For example, `LocalCampaignStatus` currently uses `draft | active | archived`; `trashed` and `purged` are future lifecycle states, not current schema requirements.

## Object Policies

### Actor / Character

Actors and characters should default to archive, not hard delete.

Before trashing or purging an actor, the platform should check references from:

- Campaign Entry Draft `selectedActorId`
- RuntimeLog `actorId`
- Future CampaignMembership
- Future CampaignActorInstance
- Character portrait media bindings

If a reference exists, the UI should warn the user and prefer archive. Purge should be blocked or require explicit confirmation plus clear explanation that references may become stale. Character sheet data should not be silently removed when a campaign, log, or media reference still points to it.

### Campaign

Campaigns should default to archive. Trashing a campaign should be recoverable. Purging a campaign is dangerous and should require a second confirmation, with an export warning when local export exists.

Campaign purge must not silently erase unrelated actor records, package records, media files, or source data. Campaign-scoped future objects may be archived, tombstoned, or purged according to their own policies.

### Campaign Entry Draft

Campaign Entry Draft is local UI/runtime entry preference, not membership. It may be cleared safely as a flow preference, but stale actor ids should produce a warning instead of silently creating membership or runtime state.

Clearing a draft must not delete the actor, campaign, campaign log, or future membership.

### CampaignMembership

Future CampaignMembership records represent real participation and control relationships. They should not default to hard delete.

Leaving, removing, or changing a participant should preserve a history trail. Membership removal should normally become an archived membership or audit event, not an erased record.

### CampaignActorInstance

Future CampaignActorInstance records are campaign-scoped actor instances. They are not the same as ActorVaultActor and should not be deleted just because the source actor is archived.

If a campaign actor instance is referenced by logs, maps, scenes, handouts, or combat history, deletion should preserve a tombstone or display snapshot so old records remain readable.

### RuntimeLog

RuntimeLog is append-oriented gameplay history. Default behavior should be correction, tombstone, or hide, not physical deletion.

The current MVP local log repository may expose `deleteRuntimeLogEvent` as a local/dev ability. Product flows should treat this as an escape hatch, not the long-term default. Future UX should prefer:

- Add correction note
- Hide from default view
- Tombstone event
- Purge only under explicit local/dev or administrative policy

### BlockDocument / Handout

Documents and handouts should support archive and unpublish before trash. Deleting a document must not silently clear references from scenes, campaigns, logs, packages, or handout publication history.

When a document is referenced, the platform should warn, preserve a tombstone, or keep a read-only snapshot.

### MediaAsset

Media assets require reference checks before trash or purge. Known and future references include:

- Actor portraits
- BlockDocument embedded media
- Package entries
- Maps and scenes
- Handouts
- User profile media

Purge should require explicit confirmation and should explain which references may break.

### WorkshopPackage / Package Subscription

Workshop packages and package subscriptions should distinguish disabling/unsubscribing from deleting local derived content.

Disabling a package should not delete campaigns, actors, handouts, or notes created from that package. If a package is used as a source dependency, the platform should show dependency warnings before removal.

### Map / Scene

Future maps and scenes should support archive and trash. If maps or scenes are referenced by logs, tokens, handouts, or campaign history, purge should require explicit confirmation and preferably an export path.

Tokens and scene annotations should not disappear silently from old logs.

### User Profile / Personal Content

Personal content should support archive, unpublish, or deactivate where appropriate. Account deletion is a separate privacy and compliance process and may need to preserve audit obligations while removing personal identifiers.

## Reference Checks

Before archive, trash, or purge, repositories and UI flows should check known references where possible:

- `CampaignEntryDraft.selectedActorId` to ActorVaultRecord
- `RuntimeLog.actorId` to ActorVaultRecord
- `RuntimeLog.campaignId` to Campaign
- Future `CampaignMembership.actorId` to Actor
- Future `CampaignActorInstance.sourceActorId` to Actor
- MediaAsset references from actor portraits, documents, packages, maps, scenes, and profiles
- Package dependency references from campaigns, documents, actors, and source settings

If the MVP cannot fully check references yet, it should:

- Show a conservative warning.
- Prefer archive over hard delete.
- Keep a recovery path.
- Avoid physical purge in normal user flows.

## Action Layering

Deletion-like operations must use explicit action names:

```text
archiveObject
restoreObject
trashObject
purgeObject
```

- `archiveObject`: Safe default removal from ordinary active views.
- `restoreObject`: Returns archived or trashed object to an active or previous usable state.
- `trashObject`: Explicit user delete into a recovery area.
- `purgeObject`: Permanent physical deletion. Requires stronger confirmation and should be rare.

The visible UI should avoid ambiguous `delete` when the actual behavior is archive or trash. If a control says delete, the destination must be clear: archive, move to trash, or permanently delete.

## RuntimeLog And AuditLog Boundary

RuntimeLog and AuditLog are separate concepts:

- RuntimeLog records gameplay events, table events, manual state change notes, and session-visible activity.
- AuditLog records data management operations, administrative changes, permission changes, destructive actions, and recovery actions.

The MVP may use RuntimeLog for manual state change notes, but RuntimeLog is not a full audit system. Future data management operations such as archive campaign, restore actor, purge media, or change participant role should write AuditLog entries, not only RuntimeLog entries.

RuntimeLog deletion should prefer correction, hide, or tombstone. AuditLog should be append-only except under explicit legal/privacy policy.

## UI Rules For Destructive Actions

Deletion-related UI must follow these rules:

1. Prefer `归档` / `Archive` as the default removal action.
2. Permanent delete requires a second confirmation.
3. Referenced objects cannot be silently deleted.
4. Archive and trash views must provide restore actions.
5. Destructive actions must be visually distinct from ordinary primary actions.
6. Dev-only clear/reset helpers must not be presented as normal user delete flows.
7. UI copy must explain whether the action affects visibility, recovery, references, or physical storage.

## Data Management MVP Application Order

The platform should apply this policy in this order:

1. Campaign archive / restore / trash UI.
2. Campaign edit / duplicate / search management.
3. Actor archive / delete bridge rules.
4. ActorVault management actions.
5. RuntimeLog tombstone / correction policy.
6. Local export before purge.
7. Media, document, package, map, and scene lifecycle policies.

## Current MVP Cautions

Current local stores include pragmatic local/dev deletion helpers. These should not be mistaken for final product semantics:

- `campaignLocalStore.deleteCampaign` physically removes local campaign data and should remain a dev/local escape until trash/purge flows exist.
- `runtimeLogLocalStore.deleteRuntimeLogEvent` physically removes a local log event and should remain a local/dev escape until tombstone/correction behavior exists.
- Campaign Entry Draft selected actor fields are local UI draft values, not CampaignMembership or CampaignActorInstance.

Future implementation tasks must state whether they are implementing lifecycle policy, repository behavior, UI affordance, audit logging, or only local MVP cleanup.

## Acceptance Checklist

Any future lifecycle implementation must answer:

- Which object layer is being changed?
- Is the action archive, restore, trash, or purge?
- Does it check known references?
- Does it preserve recoverability where expected?
- Does it avoid confusing RuntimeLog with AuditLog?
- Does it keep ActorVaultActor, CampaignActorInstance, CampaignMembership, RuntimeActor, and RuntimeSession boundaries intact?
- Does it avoid treating UI draft state as real membership?
- Does it avoid exposing dev-only clear/reset as product deletion?
