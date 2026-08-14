# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Campaign AI Artifact Chain v1
- Name: `CAMPAIGN_AI_ARTIFACT_CHAIN_V1`
- Goal: Close an explicit host/admin flow from campaign-scoped source selection → permission-projected AI draft with citations → human confirmation → durable, recoverable GeneratedArtifact plus append-only provenance.
- Phase: Internal AI foundation / campaign preparation
- Status: Complete

## Layer Declaration

- IA: Campaign detail / host preparation tools plus backend AI Gateway.
- Object: read-only CampaignObject summaries and viewer-owned GeneratedArtifact; Projection is used only for safe model context and response DTOs.
- State: UI State, Flow State, transient Server State, Persistent Domain State.
- Excluded: CatalogObject mutation, CampaignMembership, RuntimeActor, RuntimeObject, RuntimeLog, Collaborative State, rules adjudication, maps, full character sheets, cloud billing.

## UI And Action Declaration

- Page responsibility: campaign detail may expose one contextual, secondary `AI 备团与回顾` tool for users who already have server-authoritative campaign edit permission.
- Not responsible for: chat, a global AI center, role/member management, runtime control, campaign creation, rules lookup, or background automation.
- Primary action: the campaign detail's existing entry/runtime path remains primary; AI is secondary. Inside the AI flow, `生成草稿` previews only and `确认保存` is the sole persistent action.
- Exit/navigation: inline contextual panel only; no new Back/Home/ContextBar/global navigation control.
- Lifecycle: saved artifacts can be archived and restored; no hard delete.

## Authority, Visibility And Retrieval

- Browser `canManageServer` is presentation only. Every status/list/generate/confirm/archive/restore request re-authorizes the authenticated viewer and campaign scope on the server.
- The user explicitly selects bounded source families for each generation request. Consent is request-local and does not alter the Campaign record's stored `aiScope`.
- Only campaign title/description/system/status, actor display-name/status summaries, room status/name summaries, and the current viewer's prior active artifacts are eligible.
- Campaign payloads, actor snapshots/overrides, room codes/access policy/metadata, RuntimeLog, maps, rules books, participant-private data, and other users' artifacts are excluded.
- Retrieval must pass source preflight and the post-fetch AI Context Scope Guard. Denied bodies never enter prompts or responses.
- v1 artifacts are fixed to `user_private` and filtered by owner on every read/mutation.

## Persistence And Confirmation

- A generated suggestion is transient, viewer/world/campaign-bound, expiring, and one-shot.
- Every cited source ID must exist in the server-produced source manifest.
- Confirmation re-fetches the selected source projection and rejects stale fingerprints.
- Artifact plus `ai_context_sources` provenance must be written atomically.
- Model metadata records route/provider/model/time but never credentials, base URLs, system prompts, or denied content.

## Allowed Files

- `src/lib/ai/campaignArtifactAssistantTypes.ts`
- `src/lib/api/campaignArtifactAssistantApiClient.ts`
- `src/components/platform/CampaignAiArtifactPanel.tsx`
- `src/components/platform/ServerCampaignWorkspace.tsx`
- `server/ai/campaignArtifact*`
- `server/ai/modelGateway.ts`
- `server/api/campaignArtifactAssistant*`
- `server/services/generatedArtifactPersistence.ts`
- `server/room-server.ts`
- focused smoke/tests, package scripts, project/test/status/architecture AI docs

## Forbidden Changes

- Schema/migration changes
- Campaign, membership, actor, room, runtime, RuntimeLog, permissions, or account writes
- Campaign-shared/public artifacts, background generation, hidden auto-apply, direct model database access
- Full sheets, payload snapshots, room codes, access policies, metadata, maps, logs, rules books
- `output/`, `tools/`, `work/`

## Completion Criteria

- Unauthorized users cannot learn whether the scoped campaign AI resource exists; authorized host/admin paths work against real repositories.
- Selected sources pass preflight + post-fetch guard and appear as bounded citations in the preview.
- Model output is schema-validated and citation-validated; stale/expired/cross-context suggestions fail closed.
- Explicit confirmation atomically persists one owner-private GeneratedArtifact and append-only source records.
- Owner-scoped history supports list/archive/restore without hard deletion.
- Campaign detail UI is contextual, non-chat, secondary, transparent about privacy/model/source/confirmation, and handles loading/empty/error/stale/unavailable states.
- Focused smokes, AI policy tests, TypeScript, server/frontend builds, diff checks, and clean commit pass.
