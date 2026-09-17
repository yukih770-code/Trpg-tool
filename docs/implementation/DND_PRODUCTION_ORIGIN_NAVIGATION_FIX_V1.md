# Production origin navigation failure — focused correction

2026-09-18, working-tree base `d789506bd2d2f6c461834c320777a33d235f2b92`. No commit, push, deployment or Railway variable change was performed during this investigation.

## Root cause and live reproduction

This is a **code bug in the HTTP Fetch Metadata check**, not an incorrect Railway allowlist or the previously addressed invite-code failure. `createPilotOriginGuard()` rejects an Origin-less request whenever `Sec-Fetch-Site` is `cross-site`, regardless of method. Following an external link can legitimately navigate to the frontend with those headers. The global guard rejects the request before frontend serving.

Read-only probes against `https://dnd-web-production.up.railway.app` reproduced:

| Deployed request | Result |
| --- | --- |
| `GET /`, no Origin/Fetch Metadata | 200, frontend HTML |
| `GET /`, no Origin, `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document` | 403, exact reported JSON error |
| `HEAD /`, no Origin | 200, frontend content type, no body |
| `GET /health`, no Origin | 200, JSON readiness/production endpoints |
| `GET /`, approved production Origin | 200, frontend HTML |
| `GET /`, explicit evil Origin | 403, exact reported JSON error |

Thus missing Origin **alone is already accepted**. The bug requires the cross-site Fetch Metadata condition. The failing headers of the user's browser were not captured; the live reproducer matches the reported error exactly. The previous acceptance checks used direct/same-origin browser entry and did not cover arrival via a cross-site link.

## Exact responsible source and route scope

- `server/transport/pilotHttpBoundary.ts`: `isAllowedBrowserOrigin()` accepts absent Origin or an exact allowlist match; `createPilotOriginGuard()` produces the HTTP JSON rejection. `createPilotLoginLimiter()` remains unchanged.
- `server/room-server.ts`: installs that guard globally at line 192 for non-localDev environments, before CORS/OPTIONS handling, JSON parsing, viewer attachment, every API/room registration, `/health`, static serving and the SPA fallback. There are **no HTTP path exemptions**, including health. HEAD follows the existing Express GET/static handling. CORS reflects approved origins and credentials; it does not make an origin decision using proxy headers.
- `server/config/serverRuntimeConfig.ts`: `readString()`, `readFirstString()`, `readAllowedOrigins()`, `readServerRuntimeConfigFromEnv()`, `isPublicSecureOrigin()` and `validateServerStartupConfig()` parse and validate production configuration.
- `server/transport/roomSocketServer.ts`: `createRoomSocketServer()` configures `verifyClient` for `/ws`; explicit unapproved Origin returns 403 before upgrade. `room-server.ts` supplies `isAllowedBrowserOrigin()` as its callback in cloud environments. Upgrades use this separate WebSocket check, not the Express HTTP guard. Message processing still resolves verified viewer identity and checks room permissions.
- `server/room-server.ts`: `/health` calls actual PostgreSQL/schema/startup-recovery readiness and returns 200/503 accordingly. Its ordinary Origin-less probes already work. No fake readiness result or bypass was added.

The appendix enumerates all explicit HTTP registrations found by resolving source AST string/template constants. All deployed registrations inherit the global guard. The three `/api/dev/users` registrations are listed for completeness but are **not mounted in this production configuration**. There are 127 other explicit registrations, including the wildcard frontend fallback. Static files are additionally covered at every path served by `express.static`; OPTIONS requests at every path meet the guard before the existing CORS 204 response. Unknown paths meet the guard before downstream 404/fallback handling.

## Actual non-secret Railway configuration

The existing service variables were read privately; only the following public routing/runtime values were printed:

| Variable | Actual value |
| --- | --- |
| `APP_PUBLIC_HTTP_URL` | `https://dnd-web-production.up.railway.app` |
| `APP_PUBLIC_WS_URL` | `wss://dnd-web-production.up.railway.app` |
| `ROOM_ALLOWED_ORIGINS` | `https://dnd-web-production.up.railway.app` |
| `RAILWAY_PUBLIC_DOMAIN` | `dnd-web-production.up.railway.app` |
| `SERVER_DEPLOYMENT_ENVIRONMENT` | `cloudPrivateAlpha` |
| `SERVER_RUNTIME_MODE` | `cloud` |

No origin aliases were present in the queried variable set. `ROOM_ALLOWED_ORIGINS` takes precedence over `ROOM_SERVER_ALLOWED_ORIGINS`. HTTP/WS endpoint aliases are fallback configuration; they do not populate the allowlist automatically.

Allowlist parsing trims outer/per-entry whitespace, splits commas, removes empty entries and deduplicates. It does not strip quotes or convert a bare hostname into an origin. Cloud startup requires canonical HTTPS origin strings: insecure HTTP, wildcard, opaque `null`, credentials, paths, trailing slash and noncanonical case fail validation. Incoming Origin is compared exactly; browsers normally provide serialized origins. Regression coverage preserves this behavior instead of adding request normalization exceptions.

Origin validation does not trust `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` or `Referer` to authorize a request. Railway proxy headers therefore cannot approve an evil Origin. **No Railway variable change is required.** Do not change any secret or add a wildcard to address this failure.

## Minimum fix and security behavior

The only application change adds `isRead = req.method === 'GET' || req.method === 'HEAD'` and applies the Origin-less cross-site Fetch Metadata rejection only when `!isRead`. Explicit-Origin validation remains unconditional.

| Request class | Before | After |
| --- | --- | --- |
| Origin-less GET/HEAD without cross-site metadata | Allowed | Allowed |
| Origin-less GET/HEAD with cross-site metadata | 403 | Allowed to reach existing route/static/auth handling |
| Explicit approved Origin, including API mutations | Allowed subject to auth/permissions | Same |
| Explicit unapproved/opaque Origin, any HTTP method | 403 | Same |
| Origin-less cross-site POST/PUT/PATCH/DELETE/OPTIONS | 403 | Same |
| Origin-less authenticated tools without cross-site metadata | Supported | Same |
| Approved browser WebSocket Origin | Upgrade permitted; room messages remain protected | Same |
| Unapproved/opaque browser WebSocket Origin | 403 before upgrade | Same |
| Existing Origin-less socket tools | Supported; room messages remain protected | Same |

No auth, session/cookie, login limiter, CORS response, room authority/permission, WebSocket, persistence, deployment or global combat/map visibility changes were made. Permitting safe reads does not grant identity or permission and does not grant CORS read access to a foreign site.

## Regression and validation

`server/transport/pilotHttpBoundarySmoke.ts` uses the actual guard and WebSocket server over an ephemeral loopback HTTP server, with real static/SPA responses and fixture auth/health handlers. Its fixture authentication is test-only and does not modify application authentication. The temporary static directory is checked to stay directly under the OS temp directory with the task prefix before cleanup. No normal service/database or production state is changed.

Before the fix, the corrected test suite exited nonzero: **15 passed, four failed** (GET cross-site navigation, HEAD navigation, static reads, health reads). After the fix: **19 passed, zero failed**. Explicit evil/opaque origins, authenticated mutations, spoofed proxy headers and WS upgrade rejection pass on both implementations.

| Command | Result |
| --- | --- |
| `node --import tsx server/transport/pilotHttpBoundarySmoke.ts` | 19 passed |
| `npm run pilot:verify:readiness` | 19 existing config/HTTP/WS/cookie/throttle + four endpoint checks passed |
| `npm run auth:verify:private-alpha` | Six passed |
| `node --import tsx server/api/verifyApiGuardFoundation.ts --strict` | 36 passed |
| `npm run cloud:verify:env` | Six passed |
| `npm run runtime:verify:room-socket-reconnect` | Passed startup gate, projected catch-up, baseline and cursor validation |
| `npm run runtime:verify:room-permissions` | Passed authenticated binding, grant/revoke and LAN non-authority |
| `npm run runtime:verify:server-health-readiness` | Passed database, schema, recovery and memory-only readiness |
| `node tests/online-pilot/release-artifacts.mjs https://dnd-web-production.up.railway.app` | Twelve migrations copied byte-for-byte; actual public origin present; four backend values absent from bundle; only env examples tracked |
| `npm run build:pilot -- --origin https://dnd-web-production.up.railway.app` | Production frontend build passed |
| `npm run server:build` | Backend TypeScript build and migration packaging passed |
| `npm run lint` | Frontend TypeScript check passed |
| `node node_modules/typescript/bin/tsc -p server/tsconfig.server.json --noEmit` | Backend TypeScript check passed |

Read-only live WebSocket probes also confirmed approved production Origin → 101 and explicit evil Origin → 403. No cookies or room subscriptions were used. These confirm the unchanged deployed socket policy, not hosted verification of the HTTP fix. No post-fix hosted frontend success is claimed because this work has not been deployed.

## Changed files, Git and release readiness

Exactly three task files: modified `server/transport/pilotHttpBoundary.ts`, new `server/transport/pilotHttpBoundarySmoke.ts`, and this report. Unrelated tracked `scripts/dev-local.ps1` and the existing 1,412 untracked files remain untouched. With the two new task files, Git now lists 1,414 untracked files. Build output is ignored. HEAD remains `d789506`; nothing staged, committed or pushed.

All listed validation passed; the minimal correction is technically suitable for a reviewed deployment. Production still runs the old guard; linking into it from another site can still produce 403 until the reviewed fix is released. No Railway variable change or migration is necessary. Review/commit/push/deployment are intentionally pending the user's requested review boundary.


## Appendix — complete explicit HTTP registration inventory

Every entry below is downstream of the global origin guard when mounted. File/line references describe the current source. GET registrations also support the existing HEAD behavior; static GET/HEAD resources and global OPTIONS handling are described above.

### server/room-server.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/health` | 567 |
| GET | `/api/lan/runtime` | 715 |
| GET | `/rooms` | 728 |
| POST | `/rooms/create` | 740 |
| POST | `/rooms/join` | 805 |
| GET | `/rooms/:roomId/entry` | 836 |
| GET | `/rooms/:roomId/runtime-actors` | 864 |
| GET | `/rooms/:roomId` | 883 |
| GET | `/rooms/:roomId/join-status` | 900 |
| POST | `/rooms/:roomId/disband` | 923 |
| POST | `/rooms/:roomId/members/:memberId/approve` | 942 |
| POST | `/rooms/:roomId/members/:memberId/reject` | 960 |
| POST | `/rooms/:roomId/actor-bindings/submit` | 983 |
| POST | `/rooms/:roomId/actor-bindings/:bindingId/approve` | 1055 |
| POST | `/rooms/:roomId/actor-bindings/:bindingId/reject` | 1093 |
| POST | `/rooms/:roomId/members/:memberId/ready` | 1112 |
| GET | `/rooms/:roomId/runtime-log` | 1138 |
| POST | `/rooms/:roomId/runtime-log/events` | 1178 |
| GET | `/rooms/:roomId/map-events` | 1220 |
| POST | `/rooms/:roomId/map-events` | 1257 |
| POST | `/rooms/:roomId/map-permissions/:memberId` | 1331 |
| POST | `/rooms/:roomId/runtime/dice-roll` | 1386 |
| GET | `*` | 1447 |

### server/api/actorApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/actors` | 40 |
| POST | `/api/actors` | 41 |
| GET | `/api/actors/:actorId` | 42 |
| PATCH | `/api/actors/:actorId` | 43 |
| POST | `/api/actors/:actorId/archive` | 44 |
| POST | `/api/actors/:actorId/restore` | 45 |

### server/api/aiCharacterAssistantRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/ai/model-gateway/catalog` | 36 |
| GET | `/api/ai/model-gateway/status` | 37 |
| POST | `/api/ai/dnd-character-assistant/suggest` | 38 |

### server/api/assetApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/assets` | 21 |
| POST | `/api/assets` | 25 |
| GET | `/api/assets/:assetId/content` | 34 |

### server/api/campaignArtifactAssistantRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/status` | 24 |
| GET | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts` | 25 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/suggestions` | 26 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/suggestions/:suggestionId/confirm` | 27 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/:artifactId/adopt` | 28 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/:artifactId/withdraw-adoption` | 29 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/:artifactId/archive` | 30 |
| POST | `/api/ai/world-servers/:worldServerId/campaigns/:campaignId/artifacts/:artifactId/restore` | 31 |

### server/api/campaignRoomApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/world-servers/:worldServerId/campaigns` | 51 |
| POST | `/api/world-servers/:worldServerId/campaigns` | 52 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId` | 53 |
| PATCH | `/api/world-servers/:worldServerId/campaigns/:campaignId` | 54 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/archive` | 55 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/restore` | 56 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors` | 58 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors` | 59 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors/:actorInstanceId` | 60 |
| PATCH | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors/:actorInstanceId` | 61 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors/:actorInstanceId/archive` | 62 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors/:actorInstanceId/source-review` | 64 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/actors/:actorInstanceId/source-review/accept` | 65 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms` | 68 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms` | 69 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId` | 70 |
| PATCH | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId` | 71 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/participants` | 72 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/lobby-slots` | 73 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states` | 76 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states` | 77 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states/:sceneStateId` | 78 |
| PATCH | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states/:sceneStateId` | 79 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states/:sceneStateId/duplicate` | 80 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/scene-states/:sceneStateId/archive` | 81 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/runtime-session` | 84 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/runtime-session` | 85 |
| PATCH | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/runtime-session` | 86 |
| GET | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/runtime-events` | 89 |
| POST | `/api/world-servers/:worldServerId/campaigns/:campaignId/rooms/:roomId/runtime-events` | 90 |

### server/api/dndPersonalContentAssistantRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| POST | `/api/ai/dnd-personal-content-assistant/suggest` | 11 |

### server/api/dndPrivateMonsterApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/world-servers/:worldServerId/dnd/monsters` | 9 |
| POST | `/api/world-servers/:worldServerId/dnd/monsters` | 9 |
| GET | `/api/world-servers/:worldServerId/dnd/monsters/:monsterTemplateId` | 9 |
| PATCH | `/api/world-servers/:worldServerId/dnd/monsters/:monsterTemplateId` | 9 |
| POST | `/api/world-servers/:worldServerId/dnd/monsters/:monsterTemplateId/archive` | 9 |

### server/api/personalCompendiumPackApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/me/private-compendium-packs` | 28 |
| GET | `/api/me/private-compendium-packs/:packId/versions` | 29 |
| GET | `/api/me/private-compendium-packs/:packId/versions/:packVersionId` | 30 |
| POST | `/api/me/private-compendium-packs` | 31 |
| POST | `/api/me/private-compendium-packs/:packId/versions` | 32 |

### server/api/privateAlphaAuthApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/auth/me` | 43 |
| POST | `/api/auth/private-alpha/login` | 51 |
| POST | `/api/auth/logout` | 70 |

### server/api/privateCompendiumPackApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/world-servers/:worldServerId/compendium-packs` | 27 |
| POST | `/api/world-servers/:worldServerId/compendium-packs` | 28 |

### server/api/roomSessionAssistantRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/ai/rooms/:roomId/session-assistant/status` | 42 |
| POST | `/api/ai/rooms/:roomId/session-assistant/suggestions` | 46 |
| POST | `/api/ai/rooms/:roomId/session-assistant/suggestions/:suggestionId/confirm` | 51 |
| POST | `/api/ai/rooms/:roomId/session-assistant/suggestions/:suggestionId/save-artifact` | 57 |

### server/api/userDevRoutes.ts (localDev-only; not mounted in production)

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/dev/users/by-identity` | 42 |
| GET | `/api/dev/users/:userId/profile` | 52 |
| GET | `/api/dev/users/:userId` | 61 |

### server/api/worldServerApiRoutes.ts

| Method | Path | Source line |
| --- | --- | --- |
| GET | `/api/world-servers` | 50 |
| POST | `/api/world-servers` | 51 |
| GET | `/api/world-servers/:worldServerId` | 53 |
| PATCH | `/api/world-servers/:worldServerId` | 54 |
| POST | `/api/world-servers/:worldServerId/archive` | 55 |
| POST | `/api/world-servers/:worldServerId/restore` | 56 |
| GET | `/api/world-servers/:worldServerId/members` | 58 |
| PATCH | `/api/world-servers/:worldServerId/members/:membershipId` | 59 |
| GET | `/api/world-servers/:worldServerId/roles` | 60 |
| POST | `/api/world-servers/:worldServerId/roles` | 61 |
| PATCH | `/api/world-servers/:worldServerId/roles/:roleId` | 62 |
| GET | `/api/world-servers/:worldServerId/invites` | 64 |
| POST | `/api/world-servers/:worldServerId/invites` | 65 |
| POST | `/api/world-servers/:worldServerId/invites/:inviteId/revoke` | 66 |
| GET | `/api/world-servers/:worldServerId/join-requests` | 67 |
| POST | `/api/world-servers/:worldServerId/join-requests` | 68 |
| PATCH | `/api/world-servers/:worldServerId/join-requests/:joinRequestId` | 69 |
| GET | `/api/world-servers/:worldServerId/settings` | 71 |
| PATCH | `/api/world-servers/:worldServerId/settings` | 72 |
| GET | `/api/world-servers/:worldServerId/settings/versions` | 73 |
| POST | `/api/world-servers/:worldServerId/settings/versions` | 74 |
| GET | `/api/world-servers/:worldServerId/ruleset-versions` | 75 |
| POST | `/api/world-servers/:worldServerId/ruleset-versions` | 76 |
| GET | `/api/world-servers/:worldServerId/game-systems` | 78 |
| POST | `/api/world-servers/:worldServerId/game-systems` | 79 |
| PATCH | `/api/world-servers/:worldServerId/game-systems/:bindingId` | 80 |
| POST | `/api/world-servers/:worldServerId/game-systems/:bindingId/archive` | 81 |
| POST | `/api/world-servers/:worldServerId/game-systems/:bindingId/restore` | 82 |

### server/api/dndAttackHandlers.ts

| Method | Path | Source line |
| --- | --- | --- |
| POST | `/rooms/:roomId/runtime/dnd-saving-throw` | 15 |
| GET | `/rooms/:roomId/runtime/dnd-resources` | 26 |
| POST | `/rooms/:roomId/runtime/dnd-resource` | 30 |
| POST | `/rooms/:roomId/runtime/dnd-condition` | 41 |
| GET | `/rooms/:roomId/runtime/dnd-actions` | 52 |
| POST | `/rooms/:roomId/runtime/dnd-attack` | 62 |
