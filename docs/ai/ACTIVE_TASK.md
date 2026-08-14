# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: AI Settings + Model Routing v1
- Name: `AI_SETTINGS_MODEL_ROUTING_V1`
- Goal: Close a platform preference loop from authenticated safe model catalog → device-local route/model choice → server-authoritative resolution → existing character/session AI tasks, without changing their permissions or confirmation rules.
- Phase: Internal AI foundation / platform settings
- Status: Complete

## Layer Declaration

- IA: Platform Shell / Settings plus Backend AI Gateway.
- Object: safe Projection of installed local model identifiers and capabilities only.
- State: UI State, replaceable device-local preference state, Server State.
- Excluded: CatalogObject, OwnedObject, Campaign, Runtime, RuntimeLog, Collaborative State, account-domain persistence, model installation, cloud billing.

## UI Declaration

- Page responsibility: `AI 与自动化` manages the current device's AI route preference and shows server-projected local model availability.
- Not responsible for: chat, prompt editing, model downloads, API-key entry, billing, permissions, content access, business suggestions, or actor/campaign/runtime writes.
- Actions: choose Off / Auto / Local; choose one installed local model when Local is active; refresh model availability as a secondary action.
- Cloud route: shown only as a truthful disabled future capability until a real provider, billing, privacy, and failure contract exists.
- Navigation: reuse the existing Settings category rail and existing page exit; add no new permanent navigation entry or duplicate Back/Home control.

## Routing And Authority

- Browser preference is untrusted input and is parsed with bounded values.
- Server validates the requested route/model against its live, optionally allowlisted Ollama inventory.
- `auto` deterministically prefers an installed Qwen 3.6 model, then configured default, then another allowed installed model.
- `off` stops generation; `cloud` is unavailable until implemented; `local` never accepts an unknown/uninstalled model.
- Model choice cannot grant new content access, change viewer role, bypass task-specific confirmation, or mutate domain state.
- Server responses never expose provider base URLs, credentials, prompts, or hidden inventory fields.

## Allowed Files

- `server/ai/modelGateway*`
- `server/ai/localOllamaProvider.ts`
- `server/config/modelGatewayConfig*`
- `server/api/aiCharacterAssistant*`
- `server/api/roomSessionAssistant*`
- `src/lib/ai/modelRouting*`
- `src/lib/ai/dndCharacterAssistantTypes.ts`
- `src/lib/api/aiModelGatewayApiClient*`
- `src/lib/platform/roomSessionAssistantHttpClient*`
- `src/components/platform/AiSettingsPanel.tsx`
- existing character/session assistant dialog status copy
- `src/App.tsx`
- `.env.example`
- `package.json`
- platform status, roadmap, README, test checklist, AI archive/symbol map documentation

## Forbidden Changes

- Actor, Campaign, Room, Runtime, RuntimeLog, permission, membership, or account schemas/migrations
- Model installation/deletion, arbitrary provider URLs from clients, API-key storage, cloud usage/billing claims
- Hidden auto-apply, background domain writes, permission expansion, prompt/content exposure in settings
- `output/`, `tools/`, `work/`

## Completion Criteria

- Authenticated settings can load a safe local model catalog and truthfully distinguish disabled, unreachable, empty, and ready states.
- Off / Auto / Local preferences persist on the current device; cloud remains visibly unavailable.
- Server resolves every generation request authoritatively and rejects disabled, unavailable, uninstalled, or disallowed selections.
- Existing DND character and Room Session assistants read the preference on each request and preserve all current task authorization, projection, preview, and confirmation behavior.
- Focused config/router/API/client/presentation smokes pass, plus AI policies, TypeScript, server/frontend builds, and diff checks.

## Verification

```powershell
npm run ai:verify:model-gateway
npm run ai:verify:model-routing
npm run api:verify:dnd-character-assistant
npm run api:verify:room-session-assistant
npm run frontend:verify:ai-routing-settings
npm run frontend:verify:dnd-character-assistant
npm run frontend:verify:room-session-assistant
npm run policy:verify:ai-scope
npm run policy:verify:ai-retrieval
npx tsc --noEmit
npm run server:build
npm run build
git diff --check
```
