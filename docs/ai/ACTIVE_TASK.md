# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Room Session AI Assistant v1
- Name: `ROOM_SESSION_AI_ASSISTANT_V1`
- Goal: Close an active-host Room Runtime loop from server-projected RuntimeLog context → structured local-model draft → deterministic preview → explicit host visibility choice → stale-guarded append-only RuntimeLog confirmation → durable acknowledgement and audit metadata.
- Phase: Core game experience / internal AI foundation
- Status: Complete

## Layer Declaration

- IA: Runtime / Gameplay contextual tool plus Backend / Repository boundary.
- Object: Campaign identity metadata (read only), Runtime room/session context (read only), projected LogEvent context, one newly appended LogEvent on confirm, Projection.
- State: UI State, Flow State, Server State, Persistent Domain State for confirmed RuntimeLog only.
- Excluded: CatalogObject, OwnedObject writes, CampaignMembership, CampaignActorInstance, RuntimeActor mutation, collaborative state, rule adjudication, cloud provider, billing.

## UI Declaration

- Page responsibility: the active Room Runtime log surface shows the current viewer's server-projected event history and contextual host tools.
- Not responsible for: campaign creation, actor creation, rules compendium, character-sheet edits, membership assignment, map mutation, combat adjudication, or public AI chat.
- New action tier: `Session AI 助手` is a secondary Runtime-context action available only in an active host session; generate/discard/confirm remain inside its modal.
- Primary action inside the modal: confirm one reviewed draft into RuntimeLog. Public visibility requires an explicit host choice and warning.
- Navigation: modal owns `×`; no page-level Back/Home entry is added.

## Allowed Files

- `server/ai/modelGateway.ts`
- `server/ai/modelGatewaySmoke.ts`
- `server/ai/roomSessionAssistant*`
- `server/api/roomSessionAssistant*`
- `server/room-server.ts`
- `src/lib/ai/sessionAssistantTypes.ts`
- `src/lib/platform/roomSessionAssistantHttpClient*`
- `src/components/platform/RoomSessionAssistantDialog.tsx`
- `src/components/platform/RoomRuntimeLogPreviewPanel.tsx`
- `src/components/platform/RoomRuntimeEntryBridge.tsx`
- `package.json`
- `CURRENT_PLATFORM_STAGE.md`
- `ECOSYSTEM_AND_AI_ROADMAP.md`
- `README.md`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Actor, Campaign, Room, Runtime, map, combat, permission, or membership schemas/migrations
- Historical RuntimeLog mutation/deletion, actor state writes, rules decisions, hidden auto-apply
- Client-supplied RuntimeLog context, frontend-only role authority, player/spectator AI entry
- Catalog/compendium retrieval claims, cloud provider, billing, public AI service
- `output/`, `tools/`, `work/`

## Completion Criteria

- Only the authenticated active host can generate or confirm a Room Session AI draft.
- Context is assembled server-side from the same per-viewer RuntimeLog projection used by room reads, with bounded event/body/payload size and provenance cursor/fingerprint.
- Preparation, in-session guidance, and recap task modes use one structured contract and truthful scope limits.
- Suggestions are transient, owner/member/room bound, TTL/cap bounded, single-confirm, and stale when the RuntimeLog advances.
- UI covers model status, loading, unavailable, error, cancel, preview, private/public visibility warning, discard, confirm, stale, and success states.
- Confirmation appends a new `host.note`; it never rewrites prior events. Required cloud durability is acknowledged before success and the existing socket projection broadcasts the confirmed event.
- Focused permission/projection/context/registry/gateway/API/client/UI-state smokes pass, plus existing RuntimeLog, AI policy, TypeScript, server/frontend builds, and diff checks.

## Verification

```powershell
npm run ai:verify:model-gateway
npm run ai:verify:room-session-assistant
npm run api:verify:room-session-assistant
npm run frontend:verify:room-session-assistant
npm run policy:verify:ai-scope
npm run policy:verify:ai-retrieval
npx tsc --noEmit
npm run server:build
npm run build
git diff --check
```
