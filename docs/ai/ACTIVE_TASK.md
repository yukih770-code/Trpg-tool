# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Local AI Kernel + DND Character Assistant v1
- Name: `LOCAL_AI_KERNEL_DND_CHARACTER_ASSISTANT_V1`
- Goal: Add a real provider-neutral model gateway with one configured local-model provider, then close the DND Builder suggestion → deterministic validation → explicit confirmation → atomic Owned Actor write → audit chain.
- Phase: Core game experience / internal AI foundation
- Status: Complete

## Result

- Backend Model Gateway and real Ollama protocol integration are callable when a deployer configures an installed model; unconfigured/unreachable/model-missing states remain truthful.
- The existing DND Builder now closes suggestion → runtime parsing → deterministic validation → preview → explicit confirm → atomic Owned Actor update → bounded local audit → safe undo.
- Campaign, Room, Runtime, visibility projection, cloud provider, billing, rule data, schema, and migration remain unchanged.
- All focused smokes, DND creation/advancement regressions, AI scope/retrieval policies, TypeScript, server build, frontend build, and diff checks pass. Live-model acceptance remains deployment-dependent because this repository does not bundle a model.

## Layer Declaration

- IA: Character Builder plus Backend / Repository boundary.
- Object: Owned Actor and owner-private AI suggestion/audit only.
- State: UI State, Flow State, Persistent Domain State, Server State.
- Excluded: Catalog ownership, CampaignObject, RuntimeObject, LogEvent, collaborative state, public/player projections.

## Allowed Files

- `server/ai/*`
- `server/api/aiCharacterAssistant*`
- `server/api/index.ts`
- `server/room-server.ts`
- `src/lib/ai/*`
- `src/lib/api/aiModelGatewayApiClient*`
- `src/components/dnd/DndCharacterAssistantDialog.tsx`
- `src/pages/Creator.tsx`
- `src/store/characterStore.ts`
- `server/config/modelGatewayConfig*`
- `.env.example`
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

- Campaign, Room, Runtime, multiplayer authority, visibility projection, billing
- DND rule data, spell/equipment automation, character schema or migration
- AI direct writes, hidden auto-apply, prompt-as-permission, fabricated model success
- User-controlled provider URLs, provider secrets in frontend state, cloud provider integration
- `output/`, `tools/`, `work/`

## Completion Criteria

- Gateway exposes authenticated status and suggestion APIs with safe configuration, timeout/cancellation, normalized errors, and no provider URL leakage.
- Local provider performs a real structured-output request when configured and reports unavailable/not-configured truthfully otherwise.
- DND Builder packages only owner actor context and bounded catalog option names.
- Model output passes runtime shape checks and deterministic DND plan validation.
- User sees loading, unavailable, error, preview, warning, cancel, and confirm states.
- Confirm atomically updates the active Owned Actor plus its vault row and appends a bounded persistent audit record; stale suggestions cannot overwrite later edits.
- Automated gateway, handler, client, plan/commit, timeout/error, and stale-suggestion smokes pass.
- Current-stage/status/checklist/docs are synchronized and the logical batch is independently committed.

## Verification

```powershell
npm run ai:verify:model-gateway
npm run api:verify:dnd-character-assistant
npm run frontend:verify:dnd-character-assistant
npx tsc --noEmit
npm run server:build
npm run build
git diff --check
```
