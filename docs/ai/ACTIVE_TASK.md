# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Session AI Campaign Artifact Persistence v1
- Name: `SESSION_AI_CAMPAIGN_ARTIFACT_PERSISTENCE_V1`
- Goal: Let an authorized live-room host explicitly save a biography or quest-log draft as an owner-private, campaign/session-linked GeneratedArtifact with append-only provenance, then manage it from the existing campaign AI artifact history.
- Phase: Internal AI foundation / post-session durable outcomes
- Status: Complete

## Layer Declaration

- IA: Existing post-entry RuntimeLog contextual panel plus existing campaign-detail AI artifact history; no new page, route surface, modal, or global AI entry.
- Object: LogEvent projection as source; viewer-owned GeneratedArtifact as durable outcome; Campaign and RuntimeSession identifiers as validated scope references only.
- State: UI State, Flow State, transient Server State suggestion, Persistent Domain State GeneratedArtifact and append-only provenance.
- Excluded: ActorVaultActor, CampaignActorInstance, RuntimeActor, character sheet, quest state, Campaign payload, AI Memory, BlockDocument/Handout, Workshop/publication, Collaborative State.

## Page Responsibility And Action Hierarchy

- RuntimeLog remains responsible for the active room timeline and host-context assistance. `保存到战役成果` is a contextual runtime secondary action available only for an eligible post-session draft in a real campaign RuntimeSession.
- Campaign detail remains responsible for campaign preparation and management. Session outcomes appear only inside its existing secondary `AI 备团与回顾` history; no parallel page or primary CTA is added.
- Primary CTA: unchanged on both surfaces.
- Secondary actions: save eligible draft; archive/restore a saved outcome through the existing artifact lifecycle controls.
- Hidden actions: direct character-sheet adoption, quest-state application, public/share, AI-memory adoption for session outcomes, and save for ad-hoc/non-campaign rooms.

## Authority, Projection And Persistence

- Save re-checks verified viewer -> active Room host -> World Server owner/active admin -> live room world/campaign/session scope.
- Only `character_biography` and `quest_log` suggestions are eligible; the latest RuntimeLog seq must still equal the generation context.
- Save converts the reviewed session suggestion into a structured campaign-history projection without another model call.
- One PostgreSQL transaction creates one `user_private` GeneratedArtifact plus one append-only RuntimeSession projection source.
- Campaign listing, archive, and restore continue to re-authorize campaign edit access and owner/campaign scope.
- Session outcomes are excluded from `prior_artifacts` AI retrieval in v1 so an unadopted narrative draft cannot silently become campaign fact.

## Allowed Files

- `src/lib/ai/sessionAssistantTypes.ts`
- `src/lib/ai/campaignArtifactAssistantTypes.ts`
- `server/ai/roomSessionAssistantRegistry.ts`
- `server/api/roomSessionAssistantHandlers.ts`
- `server/api/roomSessionAssistantRoutes.ts`
- `server/api/roomSessionAssistantHandlersSmoke.ts`
- `server/api/campaignArtifactAssistantHandlers.ts`
- `server/api/campaignArtifactAssistantHandlersSmoke.ts`
- `server/room-server.ts`
- `src/lib/platform/roomSessionAssistantHttpClient.ts`
- `src/lib/platform/roomSessionAssistantHttpClientSmoke.ts`
- `src/lib/api/campaignArtifactAssistantApiClient.ts`
- `src/lib/api/campaignArtifactAssistantApiClientSmoke.ts` only if present/needed
- `src/components/platform/RoomSessionAssistantDialog.tsx`
- `src/components/platform/CampaignAiArtifactPanel.tsx`
- focused atomic persistence smoke/package scripts if needed
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`, architecture index

## Forbidden Changes

- Schema/migrations or concrete repository SQL changes
- Actor, CampaignActorInstance, RuntimeActor, character sheet, quest, Campaign payload, membership, permissions, map, combat, BlockDocument/Handout, Workshop, or public/shared writes
- Autonomous/background generation, direct apply, ProposedCommand, AI Memory adoption of session outcomes, rules adjudication
- `output/`, `tools/`, `work/`

## Completion Criteria

- Eligible draft completes generate -> explicit save -> atomic private GeneratedArtifact/provenance -> campaign history projection.
- Ad-hoc room, missing RuntimeSession, non-post-session task, stale log, player, unrelated viewer, or non-manager campaign context fails closed.
- Saved outcomes remain distinguishable from campaign-generated artifacts and cannot enter later AI retrieval merely by being saved.
- Campaign artifact history renders session outcome body/source and supports recoverable archive/restore.
- Existing RuntimeLog confirmation, campaign generation/adoption, and all authority/visibility regressions pass.
- Navigation/action audit, TypeScript, server/frontend builds, focused smokes, policy checks, diff check, docs, and one isolated commit pass.
