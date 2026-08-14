# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Session AI Curated Reference Adoption v1
- Name: `SESSION_AI_CURATED_REFERENCE_ADOPTION_V1`
- Goal: Let an authorized campaign manager explicitly adopt a saved Session biography or quest-log outcome as an owner-private, reversible AI Memory reference, and include it in later Campaign AI generation only when the manager selects the dedicated source family for that request.
- Phase: Internal AI foundation / curated continuity
- Status: Complete

## Layer Declaration

- IA: Existing campaign-detail `AI 备团与回顾` history and source selector only; no new page, modal, global AI entry, or Runtime control.
- Object: viewer-owned Session GeneratedArtifact as reviewed source; viewer-owned campaign-scoped AI Memory as curated reference; Campaign and RuntimeSession remain scope/provenance references only.
- State: UI State, Flow State, Persistent Domain State AI Memory, Server State retrieval projection.
- Excluded: ActorVaultActor, CampaignActorInstance, RuntimeActor, RuntimeLog mutation, character sheet, quest state, Campaign payload, BlockDocument/Handout, Workshop/publication, Collaborative State.

## Page Responsibility And Action Hierarchy

- Campaign detail owns adoption, withdrawal, source selection, archive, and restore because all are management actions on campaign-scoped private AI outcomes.
- `采用为后续 AI 参考` is a contextual secondary action on eligible Session outcomes; it never becomes the page primary CTA.
- `已采用的会后参考` is a separate request-local source family and is off by default.
- Hidden actions: automatic adoption, background retrieval, direct character/quest/Campaign application, public/share, Workshop publication, and BlockDocument promotion.

## Authority, Retrieval And Persistence

- Every list/adopt/withdraw/generate request re-checks authenticated campaign `edit` authority and owner/campaign scope.
- Only active owner-private `session_character_biography` and `session_quest_log` artifacts are eligible for Session reference adoption.
- First adoption atomically writes one `session_outcome_reference` AI Memory and one append-only GeneratedArtifact provenance source. Repeated adoption is idempotent; withdrawal archives; re-adoption restores the same memory.
- Session reference memory remains `user_private`, `memory_scope=campaign`, and carries its RuntimeSession only as provenance where available.
- Retrieval keeps creative directions and Session references in separate source families. Session references enter a model request only after explicit request-local selection, continue through preflight/post-fetch scope enforcement, and are labeled as fallible narrative references rather than campaign fact.

## Allowed Files

- `src/lib/ai/campaignArtifactAssistantTypes.ts`
- `server/ai/campaignArtifactContext.ts`
- `server/api/campaignArtifactAssistantHandlers.ts`
- `server/api/campaignArtifactAssistantHandlersSmoke.ts`
- `src/components/platform/CampaignAiArtifactPanel.tsx`
- focused API client smoke only if needed
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`, architecture index

## Forbidden Changes

- Schema/migrations or concrete repository SQL changes
- RuntimeLog, Actor, character sheet, quest, Campaign payload, membership, permission model, map, combat, BlockDocument/Handout, Workshop, or public/shared writes
- Automatic/background adoption or retrieval, default-on Session reference sources, ProposedCommand, rules adjudication, cloud billing
- `output/`, `tools/`, `work/`

## Completion Criteria

- Eligible Session outcome completes explicit adopt → atomic private AI Memory/provenance → history status projection → explicit request-local retrieval → cited Campaign AI draft.
- Factual campaign artifacts, archived artifacts, other owner/campaign records, unauthorized viewers, withdrawn memories, and unselected Session reference families fail closed or remain absent.
- Adoption is idempotent and recoverable; active memory protects its source artifact from archive until withdrawal.
- Model guidance and UI distinguish reviewed Session reference from role sheet, quest state, public fact, Handout, RuntimeLog, and campaign truth.
- Existing creative adoption, campaign generation, Session persistence, authority, visibility, and atomic rollback regressions pass.
- Navigation/action audit, TypeScript, server/frontend builds, focused smokes, policy checks, diff check, docs, cleanup, and one isolated commit pass.
