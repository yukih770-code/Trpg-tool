# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Campaign AI Curated Memory Adoption v1
- Name: `CAMPAIGN_AI_CURATED_MEMORY_ADOPTION_V1`
- Goal: Let an authorized host explicitly adopt or withdraw a saved creative proposal as recoverable, owner-private campaign AI memory, then make adopted memory available as a bounded source for later campaign assistance.
- Phase: Internal AI foundation / campaign memory
- Status: Complete

## Layer Declaration

- IA: Existing campaign-detail contextual AI panel; no new page or navigation entry.
- Object: viewer-owned GeneratedArtifact, viewer-owned campaign-scoped AI Memory, server-projected source DTOs.
- State: UI State, Flow State, Server State, Persistent Domain State.
- Excluded: CampaignObject payload writes, BlockDocument/ContentDocument, CampaignMembership, Actor, Room, RuntimeObject, RuntimeLog, Collaborative State, Workshop/publication.

## UI And Action Declaration

- Page responsibility: review saved private Campaign AI artifacts and manage whether a creative artifact is available to later AI as a host-adopted direction.
- New object-level secondary actions: `采用为 AI 战役记忆`, `撤回采用`, and `重新采用`.
- Adoption is an explicit persistent action; it is not a primary page CTA and does not publish, notify, enter Runtime, or modify campaign/player-visible content.
- No page-level Back/Home/exit affordance, chat box, global AI center, or parallel AI entry.

## Authority, Visibility And Lifecycle

- Every adoption/withdrawal request re-authorizes authenticated campaign edit authority and re-checks artifact owner/campaign/task/lifecycle on the server.
- Only unarchived `worldbuilding_outline` / `adventure_seed` artifacts may create a memory.
- AI Memory is fixed to `user_private`, `memory_scope=campaign`, and current owner/campaign; it never becomes shared/public in v1.
- Adoption creates one AI Memory plus append-only provenance atomically. Withdrawal archives the memory; re-adoption restores it. No hard delete.
- Archiving a source artifact with an active adopted memory is rejected until adoption is withdrawn.

## Retrieval And Meaning

- `adopted_memories` is a distinct selectable source family and is checked by retrieval preflight plus post-fetch scope guard.
- UI selects it by default for contextual acceleration, but users may deselect it per request.
- Adopted means “host-approved direction for future private AI assistance,” not established player-visible fact, published handout, BlockDocument, official adventure, Workshop item, or Runtime state.
- Unadopted saved artifacts remain drafts/inspiration and are never silently promoted.

## Allowed Files

- `src/lib/ai/campaignArtifactAssistantTypes.ts`
- `server/ai/campaignArtifactContext.ts`
- `server/services/generatedArtifactPersistence.ts`
- `server/services/generatedArtifactPersistenceSmoke.ts`
- `server/api/campaignArtifactAssistantHandlers.ts`
- `server/api/campaignArtifactAssistantRoutes.ts`
- `server/api/campaignArtifactAssistantHandlersSmoke.ts`
- `src/lib/api/campaignArtifactAssistantApiClient.ts`
- `src/lib/api/campaignArtifactAssistantApiClientSmoke.ts`
- `src/components/platform/CampaignAiArtifactPanel.tsx`
- focused package scripts only if needed
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`

## Forbidden Changes

- Schema/migrations or concrete repository SQL changes
- Campaign, BlockDocument/ContentDocument, membership, Actor, Room, Runtime, RuntimeLog, permission, account, Workshop, or public/shared writes
- Autonomous adoption, background model call, hidden auto-apply, ProposedCommand, publication, recommendation ranking
- `output/`, `tools/`, `work/`

## Completion Criteria

- Creative artifact adoption atomically persists one curated AI Memory and one append-only provenance row; duplicate adoption is idempotent.
- Withdrawal/archive and re-adoption/restore are recoverable; source artifact archive is reference-safe.
- Owner/campaign/task/lifecycle checks fail closed and other users cannot observe the resource.
- Later Campaign AI can use active adopted memories only through explicit bounded source selection and both AI context guards.
- UI clearly distinguishes saved proposal, adopted AI memory, withdrawn memory, and published/campaign fact semantics.
- Existing preparation/recap/creative generation and all other AI routes continue to pass.
- TypeScript, server/frontend builds, focused smokes, policy checks, diff check, docs, and one isolated commit pass.
