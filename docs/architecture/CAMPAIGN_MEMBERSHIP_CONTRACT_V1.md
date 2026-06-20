# Campaign Membership Contract v1

Status: architecture contract only.

Scope: future campaign membership, campaign actor instances, participant control, runtime actors, runtime sessions, permissions, visibility, logs, maps, handouts, and multiplayer boundaries.

This contract does not implement UI, store writes, schema, migrations, backend, multiplayer, permissions, runtime actor state, or rules runtime.

## 1. Purpose

The current platform intentionally supports UI-only campaign entry flows:

- `suggestedActor` UI preview.
- local `CampaignRuntimeContext`.
- placeholder Campaign Runtime Shell.
- no real campaign membership.
- no real actor-to-campaign relation.
- no persistent `selectedActorId`.

This document defines the future model so later work does not confuse:

- a character in the user's Actor Vault;
- an actor instance inside one campaign;
- a live runtime actor inside one session;
- a player/host participant;
- campaign membership/control authority;
- UI suggestions and local runtime context.

## 2. Layer Alignment

This contract follows `REFERENCE_ARCHITECTURE_APPLICATION_GUIDE_V1.md`:

- Actor Vault actors are `OwnedObject`.
- Campaign actor instances are `CampaignObject`.
- Runtime actors are `RuntimeObject`.
- Runtime logs are `LogEvent`.
- player/host-visible surfaces are `Projection`.
- `suggestedActor` is `Flow State`.
- local `CampaignRuntimeContext` is `Runtime Local Context`.
- future membership, participant, and campaign actor records are `Persistent Domain State` / `Server State`.

## 3. Core Concepts

### ActorTemplate

`ActorTemplate` is a reusable actor definition or source package actor template.

Examples:

- a pre-generated character from a package;
- a monster/NPC template;
- a companion template;
- a system-specific actor archetype;
- a fan/community-provided actor preset.

Rules:

- ActorTemplate is catalog/package/template data.
- ActorTemplate is not owned by a player by default.
- ActorTemplate is not a campaign member.
- ActorTemplate can be instantiated into an ActorVaultActor or directly into a CampaignActorInstance, depending on future import/create workflow.

### ActorVaultActor

`ActorVaultActor` is a user-owned actor stored in the Actor Vault.

Examples:

- DND character.
- COC investigator.
- CP RED character.
- future unit, vehicle, companion, or custom player asset.

Rules:

- ActorVaultActor belongs to a user/account/library.
- ActorVaultActor is outside any specific campaign unless a membership/instance is created.
- ActorVaultActor can be used in multiple campaigns.
- ActorVaultActor is not the runtime actor state.
- ActorVaultActor can seed a CampaignActorInstance.

Current code mapping:

- `ActorVaultSummary` is a UI projection of ActorVaultActor-like data.
- `ActorCreationCompletionContext` is still flow/UI-only and does not create an ActorVaultActor unless a future real creation flow writes one.

### CampaignActorInstance

`CampaignActorInstance` is an actor as it exists inside one concrete campaign.

Examples:

- a player's DND character copied/linked into a campaign;
- a COC investigator participating in one investigation campaign;
- a CP RED character participating in one Night City campaign;
- an NPC in the campaign;
- an enemy, minion, summoned creature, companion, vehicle, or faction-controlled unit.

Rules:

- CampaignActorInstance belongs to one CampaignInstance.
- It may be seeded from ActorVaultActor, ActorTemplate, NPC template, package content, or GM-created data.
- It has a stable campaign-scope identity.
- It can hold campaign-specific state such as campaign HP, resources, equipment changes, visibility, owner/controller relationship, status, notes, scene placement, and progression.
- It is not the original ActorVaultActor.
- It is not the live RuntimeActor.

Required distinction:

```text
ActorVaultActor != CampaignActorInstance
```

### CampaignParticipant

`CampaignParticipant` represents a user/account/person participating in a campaign.

Examples:

- host / GM;
- player;
- co-GM;
- spectator;
- invited pending user.

Rules:

- CampaignParticipant is about the human/user side, not the actor object.
- A participant can control zero, one, or many CampaignActorInstances depending on campaign policy.
- Host/GM participant can view/manage campaign actor instances according to future permission rules.
- Player participant can control assigned CampaignActorInstances only.
- Spectator participant may only see public projections.

### CampaignMembership

`CampaignMembership` is the persistent relationship between a participant, campaign, and optional controlled actor instances.

It should answer:

- Who is in this campaign?
- What role do they have?
- Which CampaignActorInstances can they control?
- What invitation/membership status do they have?
- What visibility/permission profile applies?

Possible future fields:

```ts
type CampaignMembership = {
  campaignId: string;
  participantId: string;
  role: 'host' | 'coHost' | 'player' | 'spectator';
  status: 'invited' | 'active' | 'left' | 'removed' | 'archived';
  controlledCampaignActorInstanceIds: string[];
};
```

Rules:

- CampaignMembership is persistent domain/server state.
- CampaignMembership is created only by an explicit join/invite/assign/accept workflow.
- selectedActorId alone does not create CampaignMembership.
- suggestedActor never creates CampaignMembership.

### RuntimeActor

`RuntimeActor` is the live session object derived from a CampaignActorInstance for one RuntimeSession.

Examples:

- combatant actor in one combat;
- token/actor live state in one scene;
- actor with temporary conditions, initiative, temporary HP, turn state, or scene-local visibility;
- summoned creature/runtime duplicate tied to a session.

Rules:

- RuntimeActor belongs to one RuntimeSession.
- RuntimeActor is derived from CampaignActorInstance or created by runtime rules.
- RuntimeActor may be temporary.
- RuntimeActor should not overwrite CampaignActorInstance or ActorVaultActor without an explicit commit/reconciliation workflow.

Required distinction:

```text
CampaignActorInstance != RuntimeActor
```

### RuntimeSession

`RuntimeSession` is one active or archived play session inside a CampaignInstance.

It contains or references:

- RuntimeActors.
- RuntimeLog events.
- active scene/map.
- published handouts.
- chat/message stream.
- current turn/combat state.
- visibility projections.
- connection/session metadata.

Rules:

- RuntimeSession is not the campaign itself.
- Campaign can have many RuntimeSessions over time.
- RuntimeSession may be active, paused, archived, or replayed.

### suggestedActor

`suggestedActor` is a UI recommendation/preselection generated by a previous flow.

Examples:

- Actor card -> select campaign -> campaign detail suggests that actor.
- Add actor from campaign -> completion returns a suggested actor to campaign entry.

Rules:

- suggestedActor is flow state.
- suggestedActor is not selectedActorId.
- suggestedActor does not imply membership.
- suggestedActor does not imply control rights.
- suggestedActor does not imply the actor exists as a CampaignActorInstance.

### selectedActorId

`selectedActorId` is the local value chosen when the user confirms a campaign entry flow.

Current phase:

- selectedActorId in `CampaignRuntimeContext` is local UI runtime context only.
- It is not persisted.
- It does not create CampaignMembership.
- It does not create CampaignActorInstance.

Future phase:

- selectedActorId must clarify which layer it points to.
- Preferred future naming should avoid ambiguity:
  - `selectedActorVaultActorId` for pre-membership selection;
  - `selectedCampaignActorInstanceId` for confirmed campaign actor;
  - `runtimeActorId` for session-local runtime state.

Required distinction:

```text
suggestedActor != selectedActorId
selectedActorId != persistent campaign membership
Campaign entry UI context != real campaign membership
```

## 4. Required Boundary Statements

The platform must preserve these boundaries:

```text
ActorVaultActor != CampaignActorInstance
CampaignActorInstance != RuntimeActor
suggestedActor != selectedActorId
selectedActorId != persistent campaign membership
Campaign entry UI context != real campaign membership
```

Additional boundaries:

- ActorTemplate is not ActorVaultActor.
- ActorTemplate is not CampaignActorInstance.
- CampaignParticipant is not CampaignActorInstance.
- CampaignMembership is not RuntimeSession.
- RuntimeSession is not CampaignInstance.
- Visibility Projection is not real permission authority.
- RuntimeLog reference is not a write to ActorVaultActor.

## 5. Required Questions And Answers

### 1. Can one character be used in multiple campaigns?

Yes. One ActorVaultActor can be used as the source for multiple CampaignActorInstances in different campaigns.

The actor in the vault remains the user's reusable asset. Each campaign gets its own campaign-scoped instance so campaign-specific state does not leak between campaigns.

### 2. Should the same ActorVaultActor generate different CampaignActorInstances in different campaigns?

Yes. The same ActorVaultActor should generate different CampaignActorInstances per CampaignInstance.

Reason:

- campaign A may modify HP, items, notes, visibility, progression, scars, clues, or conditions;
- campaign B should not inherit those changes unless the user explicitly exports/syncs/updates the vault actor;
- each campaign needs its own audit trail and log references.

### 3. Do campaign HP / resources / equipment belong to the original actor or the campaign instance?

Campaign-specific HP, resources, equipment changes, conditions, campaign notes, visibility, and scene placement belong to CampaignActorInstance or RuntimeActor, not directly to ActorVaultActor.

Recommended split:

- long-term reusable identity/default build: ActorVaultActor;
- campaign-specific inventory/resources/progression: CampaignActorInstance;
- temporary session effects/turn state/token state: RuntimeActor.

Any sync-back to ActorVaultActor requires an explicit reconciliation workflow.

### 4. How does a player control a CampaignActorInstance?

Through CampaignMembership and participant/controller relationship.

Future control model:

```text
CampaignParticipant
  -> CampaignMembership
  -> controlledCampaignActorInstanceIds
```

Rules:

- player control is assigned by host, invitation flow, or accepted membership flow;
- control is not inferred from suggestedActor;
- control is not inferred from selectedActorId until a real membership/assignment write happens;
- one participant may control multiple instances if the campaign allows it.

### 5. Can GM view/manage all CampaignActorInstances?

Yes, future host/GM participants should be able to view/manage all CampaignActorInstances according to permission and visibility rules.

But:

- UI projection alone is not real permission enforcement;
- host-only UI must not imply server permissions until backend/auth exists;
- hidden/private fields still need visibility projection and server authority later.

### 6. Are NPCs, enemies, companions, summons, and minions CampaignActorInstances?

Yes. NPCs, enemies, companions, summons, vehicles, units, and other campaign-contained actor-like objects should use CampaignActorInstance or a specialized subtype.

Reason:

- they belong to a campaign;
- they can appear in scenes/maps;
- they can generate runtime actors;
- they can participate in logs, handouts, visibility, combat, and notes.

### 7. Is RuntimeActor derived from CampaignActorInstance?

Usually yes. RuntimeActor should normally be derived from CampaignActorInstance for one RuntimeSession.

Exceptions:

- temporary summon/spawn generated during runtime may create a RuntimeActor first;
- such temporary actors may later be promoted into CampaignActorInstance only through an explicit commit/save workflow.

### 8. Should RuntimeLog reference ActorVaultActor, CampaignActorInstance, or RuntimeActor?

RuntimeLog should primarily reference RuntimeActor and/or CampaignActorInstance, not ActorVaultActor.

Recommended model:

- event actor in active scene/combat: `runtimeActorId`;
- durable campaign actor reference: `campaignActorInstanceId`;
- source/vault provenance optional: `sourceActorVaultActorId`;

Reason:

- logs belong to campaign/session context;
- the same ActorVaultActor can appear in many campaigns;
- runtime actions may involve temporary actors or campaign NPCs not in a user's vault.

### 9. Should Handout / Map / Scene actor references point to which layer?

Default references should point to CampaignActorInstance.

Layer choices:

- Handout mention or clue assigned to a campaign actor: CampaignActorInstance.
- Scene/token placement: CampaignActorInstance plus scene/runtime token reference.
- Live token/action state: RuntimeActor.
- Package/template authoring: ActorTemplate.
- Personal vault notes outside campaign: ActorVaultActor.

Do not point campaign handouts/maps/scenes directly at ActorVaultActor unless the feature is explicitly personal-vault scoped.

### 10. When can suggestedActor be submitted as selectedActorId?

Only when the user explicitly confirms the entry selection on campaign detail / entry preparation.

Current shell phase:

- click `进入战役` may convert suggestedActor into local `CampaignRuntimeContext.selectedActorId`;
- this is local UI runtime context only;
- it is not persisted and not membership.

Future real phase:

- the user must choose/confirm the actor;
- the system must resolve whether the selection is an ActorVaultActor or a CampaignActorInstance;
- if no CampaignActorInstance exists, the system must run a create/link/assign workflow before persistent membership or runtime entry.

### 11. When can selectedActorId be persisted as CampaignMembership?

Only after a dedicated membership/assignment workflow:

1. validate campaign;
2. validate participant identity;
3. validate actor ownership/source;
4. create or select CampaignActorInstance;
5. create/update CampaignMembership;
6. assign control relationship;
7. emit audit/log event;
8. update visibility projection.

SelectedActorId from local UI context cannot be persisted directly as CampaignMembership.

## 6. Current Stage Rules

Current stage still forbids:

- real campaign joining;
- real CampaignActorInstance creation;
- real CampaignMembership;
- real permission system;
- real multiplayer;
- real runtime actor state;
- actor store writes;
- campaign store writes;
- schema/migration changes.

Current stage allows only:

- `suggestedActor` UI preview;
- local `CampaignRuntimeContext`;
- placeholder Campaign Runtime Shell;
- Host/Player projection UI;
- disabled/placeholder host/player tools;
- documentation/contracts.

Current code must keep:

- `CampaignSuggestedActor` as UI flow recommendation;
- `CampaignRuntimeContext` as local runtime shell context;
- no persistent membership, no real actor binding.

## 7. Future Data Model Sketch

Conceptual future types only:

```ts
type CampaignActorInstance = {
  id: string;
  campaignId: string;
  systemId: string;
  kind: 'playerCharacter' | 'npc' | 'enemy' | 'companion' | 'summon' | 'vehicle' | 'custom';
  source:
    | { kind: 'actorVaultActor'; actorVaultActorId: string }
    | { kind: 'actorTemplate'; actorTemplateId: string }
    | { kind: 'packageActor'; packageId: string; actorTemplateId: string }
    | { kind: 'campaignCreated' };
  displayName: string;
  campaignStateRef?: string;
};

type CampaignParticipant = {
  id: string;
  campaignId: string;
  userId: string;
  displayName: string;
};

type CampaignMembership = {
  campaignId: string;
  participantId: string;
  role: 'host' | 'coHost' | 'player' | 'spectator';
  status: 'invited' | 'active' | 'left' | 'removed' | 'archived';
  controlledCampaignActorInstanceIds: string[];
};

type RuntimeSession = {
  id: string;
  campaignId: string;
  status: 'active' | 'paused' | 'archived';
  startedAt: string;
};

type RuntimeActor = {
  id: string;
  runtimeSessionId: string;
  campaignActorInstanceId?: string;
  displayName: string;
  runtimeStateRef?: string;
};
```

These are not approved implementation schemas. They are a vocabulary guide for future schema tasks.

## 8. Runtime Log Reference Policy

RuntimeLog is append-only and campaign/session scoped.

Future log events should prefer:

```ts
type RuntimeLogActorRef = {
  runtimeActorId?: string;
  campaignActorInstanceId?: string;
  sourceActorVaultActorId?: string;
  displayNameSnapshot: string;
};
```

Rules:

- Always keep a display name snapshot for log stability.
- Reference RuntimeActor when the event occurred in live runtime state.
- Reference CampaignActorInstance for durable campaign actor identity.
- Reference ActorVaultActor only as optional provenance.
- Do not mutate ActorVaultActor from runtime logs.

## 9. Handout / Map / Scene Reference Policy

Future reference targets:

- Published handout visibility: participant, membership, campaign actor instance, or role projection.
- Handout content mention: CampaignActorInstance or ActorTemplate depending on context.
- Map token: TokenDocument references CampaignActorInstance and may bind to RuntimeActor during a session.
- Scene notes: CampaignActorInstance for campaign objects; ActorTemplate for package/template content.
- GM-only references: visibility projection plus server-side permission later.

Rule:

```text
Campaign materials reference campaign-layer objects by default.
Runtime materials reference runtime-layer objects when live state matters.
Catalog/package materials reference template/catalog objects.
```

## 10. Permission And Visibility Boundary

Future permissions must distinguish:

- membership role;
- controller relationship;
- visibility projection;
- server authority;
- UI disabled/locked presentation.

Rules:

- Host UI projection is not permission enforcement.
- Player locked UI is not permission enforcement.
- Backend/server must enforce real access later.
- Visibility projections should be generated from membership, role, controlled actor instances, handout publish events, map visibility, and scene state.

## 11. Phase Plan

### Phase 1: UI-only suggestedActor / selected local runtime context

Current phase.

Allowed:

- suggestedActor preview;
- local selected actor/role in `CampaignRuntimeContext`;
- runtime shell projection.

Forbidden:

- persistence;
- membership;
- campaign actor instance creation.

### Phase 2: CampaignActorInstance schema

Define campaign-scoped actor records.

Must include:

- source provenance;
- campaignId;
- systemId;
- actor kind;
- campaign-specific state boundary.

Must not automatically overwrite ActorVaultActor.

### Phase 3: CampaignParticipant / controller relationship

Define participants, roles, invitations, membership status, and controlled actor links.

Must answer:

- who controls which campaign actor;
- who hosts;
- who can spectate;
- how invited users become active members.

### Phase 4: RuntimeActor / RuntimeSession

Define live runtime session records and runtime actors.

Must include:

- derivation from CampaignActorInstance;
- temporary actor handling;
- runtime state isolation;
- session archival/replay relationship.

### Phase 5: permissions / visibility projection

Define:

- host/player/co-host/spectator projections;
- handout visibility;
- map/token visibility;
- private GM notes;
- log visibility.

Must not rely on UI hiding alone.

### Phase 6: multiplayer sync / server authority

Define:

- server-authoritative membership, HP, resources, inventory, permissions;
- append-only runtime log persistence;
- CRDT candidates for map annotations/collaborative notes;
- chat/message stream;
- backend repository boundaries.

## 12. Coding AI Checklist

Before touching campaign entry, actor selection, runtime shell, maps, handouts, logs, or membership:

- Is this value an ActorVaultActor, CampaignActorInstance, or RuntimeActor?
- Is this user a CampaignParticipant or a CampaignMembership?
- Is the current actor value suggested or selected?
- Is selectedActorId local runtime context or persistent membership?
- Does this flow create a real CampaignActorInstance?
- Does this flow create a real CampaignMembership?
- Does this log reference runtime actor, campaign actor, or vault actor?
- Does this map/handout reference campaign layer or runtime layer?
- Is this just a UI projection?
- Is this a placeholder or real permission?
- Does this need a schema/migration task?
- Does this write actor store or campaign store?
- Does this require backend/server authority?

If the task is UI-only, do not introduce:

- campaign membership writes;
- actor-to-campaign relation writes;
- runtime actor persistence;
- permissions;
- multiplayer;
- backend calls;
- schema/migration changes.

## 13. Acceptance Boundary

This contract is satisfied when future tasks can clearly say:

- whether they are operating on ActorVaultActor, CampaignActorInstance, or RuntimeActor;
- whether the current actor is suggested, locally selected, or persistently assigned;
- whether any real CampaignMembership is created;
- whether runtime logs/maps/handouts reference the correct layer;
- whether permission is real or projection-only.

It is not satisfied if an implementation silently treats campaign entry UI state as real campaign membership.
