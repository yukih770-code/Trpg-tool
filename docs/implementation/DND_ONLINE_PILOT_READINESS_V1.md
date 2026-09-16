# D&D Online Pilot Readiness V1

2026-09-17. **Repository preparation complete; hosted acceptance pending.** This is a private workshop for one GM, three players and optional spectators over two sessions. No public launch, provider selection, deployment or push occurred. The new readiness work is uncommitted.

## 1. Protected checkpoint

Initial HEAD was the expected `75686c9`. The Action Clarity report, pilot protocol, handoff and 38-file source manifest matched the working changes. Fresh rendering and frozen-intent checks passed before committing exactly those files:

**`8d9ed1c` — `feat(dnd): clarify first-session attack intent and feedback`**.

The separate tracked modification in `scripts/dev-local.ps1` and 1,412 unrelated untracked files remained outside that commit. Those files include `.work/`, `.yuki-*`, `Claude outputs/`, `output/`, `outputs/`, `tools/`, `work/` and older evidence. No reset, cleanup or blanket staging was used. This milestone leaves the local `.env`, normal services and database unchanged.

## 2. Architecture found in source

| Area | Actual implementation / consequence |
| --- | --- |
| Frontend | React 19, Vite 6, TypeScript, single-file production bundle in `dist/index.html`. `vite.config.ts` controls public env substitution. |
| Backend | Node ESM, Express 4, `ws`; compiled entry `dist-server/server/room-server.js`. Tested here with Node 24.15.0/npm 11.12.1. |
| Serving | Cloud mode already serves `dist/` and SPA fallback after API/room routes. No separate frontend host is needed. |
| API | Browser requests include credentials. `apiClient.ts` has a production same-origin fallback; the room endpoint resolver needed the same behavior. |
| Realtime | `/ws` on the same HTTP server; authenticated membership and per-viewer projections; reconnect cursors for room/map/runtime history. |
| Database | PostgreSQL through `pg`; one pool, default maximum 5, connection timeout 3,000ms. Existing acceptance used PostgreSQL 18. No database engine migration added. |
| Schema | Twelve existing SQL migrations in `server/db/migrations/`; checksum/order checks and explicit apply tool. Readiness checks eleven schema groups. |
| Identity | Backend-signed session cookie and persisted auth sessions/users. Verified sessions establish identity. Cloud rejects dev identity-header configuration. |
| Cookies | Host-only `trpg_private_alpha_session`, `HttpOnly`, `SameSite=Lax`, path `/`, `Secure` outside localDev; default lifetime 30 days. Logout revokes the session. |
| Assets | Metadata in PostgreSQL; map/token bytes in filesystem object storage. `ASSET_STORAGE_DIR` defaults to `.data/assets`; an ephemeral release directory would lose bytes. |
| Room state | Active room registries, intent locks/caches and socket subscriptions live in one process. PostgreSQL stores durable facts for recovery. |
| Recovery | Startup restores live-room lifecycle, accepted admissions, RuntimeLog and map events. Traffic/readiness gates remain closed on recovery or durability failure. |
| Health | `/health` returns 200 when DB/schema/recovery/durability are ready, otherwise 503. It is readiness, not proof of working public TLS, writable persistent assets or backup restoration. Its existing version label is not a Git revision. Record release hash separately. |
| Authority | Accepted Character/Campaign state, actor authorization, token geometry, resolved-event replay, frozen retry semantics and current viewer visibility remain unchanged. |

Source entry points: `server/room-server.ts`, `server/config/serverRuntimeConfig.ts`, `server/config/databaseRuntimeConfig.ts`, `server/db/postgresClient.ts`, `server/db/postgresMigrationRegistry.ts`, `server/auth/privateAlphaAuth.ts`, `server/api/privateAlphaAuthApiRoutes.ts`, `server/transport/roomSocketServer.ts`, `src/lib/api/apiClient.ts`, `src/lib/platform/roomServerEndpoint.ts`.

## 3. Minimum deployment

```text
GM / players / spectator browsers
           | HTTPS + WSS, one origin
TLS reverse proxy: https://<pilot-host>
           | private HTTP + WebSocket Upgrade
ONE Node process serving frontend, API and /ws
           |                         |
      PostgreSQL                persistent asset volume
           +---- coordinated backup / restore ----+
```

One replica, one process, no cluster workers, no autoscaling and no overlapping rolling replacements. Sticky sessions alone do not coordinate independent registries, locks or intent caches. Use a controlled stop/start release with maintenance time. Neither serverless request execution nor an ephemeral filesystem satisfies this design.

The proxy must terminate trusted TLS, redirect public HTTP to HTTPS, preserve Host/Origin/Cookie, support `/ws` Upgrade and long-lived connections, and forward all app paths to the single service. Do not expose the backend port or database publicly. Keep DB network access private and use verified TLS for a remote database. The app does not enable Express `trust proxy`: secure cookies are determined by explicit deployment mode, and the new login limiter intentionally does not trust forwarded IP headers. No broad trust-proxy bypass is needed.

Choose a target supporting a persistent process, persistent disk and PostgreSQL backups. Provider/domain, region, cost, disk location, TLS and backup destination remain operator choices; no provider-specific files were introduced.

## 4. Blockers addressed

| Finding | Change |
| --- | --- |
| Room client defaulted to localhost in a production browser | Production uses browser origin when no explicit endpoint is supplied; WSS derives from HTTPS. Local development and explicit endpoint behavior remain. |
| Local `.env` could select the wrong build endpoints/auth screen | `npm run build:pilot -- --origin https://<pilot-host>` explicitly supplies all pilot API/room/auth build variables without editing `.env`. |
| Vite loaded all env keys and defined an unused backend Gemini key substitution | Restricted config loading to `VITE_`; removed the unused secret define. No current production consumer of that define was found. |
| Invalid deployment values silently fell back to localDev | Unsupported/conflicting environment or mode settings fail validation; `NODE_ENV=production` cannot select localDev. |
| Cloud accepted insecure/malformed advertised endpoints | Require HTTPS/WSS origin shapes, reject credentials/paths/query/fragment/loopback and require exact HTTPS browser origins. |
| CORS blocked reads but did not reject foreign-origin mutations; WS lacked origin check | Cloud HTTP guard rejects foreign/opaque origins before handlers, plus cross-site Fetch Metadata without Origin. WS rejects foreign origins before upgrade. Origin-less tools still require existing authentication/permissions. |
| Public login endpoint had no request-work cap | Cloud login has a coarse total limit of 60 attempts per minute with 429/Retry-After, before DB/auth work. It ignores spoofed forwarding headers. A sustained attacker can still deny login capacity; configure edge rate limits and keep invites private. |
| Startup required bootstrap code although auth already supports personal invites | Startup now accepts enabled auth with a session secret and existing personal invites. Missing session-secret validation remains. |
| TypeScript build omitted SQL needed by compiled migration tools | `server:build` copies existing migration SQL beside compiled registry. No SQL/schema changes. |
| Runtime defaults do not establish durable assets or strong deployment secrets | `pilot:verify:deployment` checks explicit absolute readable/writable assets directory, non-placeholder sufficiently long secrets, DB TLS settings, and one matching HTTP/WSS/browser origin. It cannot prove randomness or that a directory is a durable mount. |

No new gameplay feature, rule registry, equipment system, migration, visibility policy or UI redesign was added. Existing localDev auth/transport is retained.

## 5. Environment contract

Use `.env.cloud.backend.example` and `.env.cloud.frontend.example` as placeholders. The compiled server reads its process environment; `npm run server:start` does **not** automatically load `.env`. Inject configuration through the service manager/secret manager (or an explicitly secured Node env file). Never copy local development `.env` into the release.

| Backend variable | Pilot value / purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `SERVER_DEPLOYMENT_ENVIRONMENT` | `cloudPrivateAlpha` |
| `SERVER_RUNTIME_MODE` | `cloud` |
| `PORT` | Private listening port, e.g. 8787; proxy forwards to it |
| `APP_PUBLIC_HTTP_URL` | Exact `https://<pilot-host>` origin, no trailing slash |
| `APP_PUBLIC_WS_URL` | Matching `wss://<pilot-host>` origin |
| `ROOM_ALLOWED_ORIGINS` | The single exact HTTPS browser origin |
| `DATABASE_URL` | Server-only PostgreSQL credentials/host/database; no SSL query overrides |
| `DATABASE_SSL_MODE` | `require` for verified remote TLS; `disable` only for loopback DB in pilot preflight |
| `DATABASE_POOL_MAX` | Optional, default 5 |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Optional, default 3000 |
| `ASSET_STORAGE_DIR` | Absolute persistent mounted directory, writable by service user |
| `PRIVATE_ALPHA_AUTH_ENABLED` | `true` |
| `PRIVATE_ALPHA_SESSION_SECRET` | Stable backend secret generated from at least 32 random bytes |
| `PRIVATE_ALPHA_INVITE_CODE` | Independent bootstrap secret, operator/GM only; optional after onboarding |
| `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS` | Optional, default 30; enough for the two sessions |
| `POSTGRES_USER_DEV_API_ENABLED` | `false` |

Prefer canonical names; do not set conflicting `ROOM_SERVER_ENV` or `ROOM_SERVER_RUNTIME_MODE` aliases. Use Node's trusted certificate configuration if the chosen DB requires an additional CA; never turn off certificate verification to make deployment pass. In this implementation `prefer` means TLS without certificate verification, so pilot preflight rejects it. Connection-string SSL parameters can replace the configured SSL object; the preflight rejects those overrides. [node-postgres SSL documentation](https://node-postgres.com/features/ssl).

Public frontend variables are `VITE_API_BASE_URL`, `VITE_ROOM_SERVER_HTTP_URL`, `VITE_ROOM_SERVER_WS_URL`, `VITE_PRIVATE_ALPHA_AUTH_ENABLED=true`, `VITE_LOCAL_DEV_AUTH_ENABLED=false`. The pilot build sets these together and clears the dev viewer ID. Rebuild for a changed domain. Every `VITE_*` value is public; never place a secret there. [Vite environment documentation](https://vite.dev/guide/env-and-mode).

## 6. Identity and secrets

The bootstrap credential can create/sign in identities derived from display names. **Do not share it with players:** someone with that credential and the GM name could authenticate as that bootstrap identity. GM creates a server and separate personal invites with one-use binding and suitable expiry. Existing auth binds an invite to the first identity and rejects a different name after binding. Invite codes remain bearer credentials: deliver privately and retain the participant's original sign-in name/code for session two. Set expiry beyond both sessions. A room join code is not an account credential.

Bootstrap may be disabled after onboarding, but retain its original value securely for GM account recovery; disabling it also disables a fresh GM bootstrap login. Do not casually rotate the session secret: existing identity derivation uses it as well as cookie signing, so rotation needs an explicit identity-recovery plan. Do not imply password reset or multi-factor authentication exists.

Never track or serve database URLs/passwords, session/bootstrap secrets, personal invitation codes, cookies, auth recovery fixtures, TLS private keys, database dumps or private asset backups. Existing `.gitignore` excludes `.env*` except four examples, builds, dependencies, coverage, logs and `.data/assets`. Added `.pilot-private/` for local operator-only scratch artifacts; prefer backups/secrets outside the repository entirely. Arbitrary backup filenames elsewhere are not magically ignored.

The release check confirmed only example env files are tracked and no inspected backend values occur in the built frontend. This is a scoped check, not a full repository-history secret audit. Any suspected prior credential exposure requires rotation/recovery, not merely adding an ignore rule. Production error/safe-config checks must not print supplied credentials.

## 7. Build, preflight and start

Run in a clean release checkout of the intended revision plus these reviewed readiness changes. Pin the tested Node major and use the lockfile. These commands are sequential; any failure blocks release:

```sh
npm ci
npm run pilot:verify:readiness
npm run cloud:verify:env
npm run cloud:verify:startup
npm run auth:verify:private-alpha
npm run runtime:verify:room-socket-reconnect
npm run lint
npm run build:pilot -- --origin https://YOUR_PILOT_HOST
npm run server:build
node tests/online-pilot/release-artifacts.mjs https://YOUR_PILOT_HOST
```

`YOUR_PILOT_HOST` is a placeholder to replace with the selected host. The build verified here used `https://pilot.example.test`; do not deploy that bundle as a real endpoint.

Release only `dist/`, `dist-server/` (including SQL), package manifests and production dependencies. Install production dependencies with the lockfile in the release directory. Do not publish the repository root, tests, screenshots, fixture servers, generated evidence, `.env`, `.pilot-private/`, backups or local tooling. Compiled test modules within `dist-server` are not static assets; the web root is exclusively `dist`. Runtime assets live outside the release directory.

With backend environment injected and the persistent directory mounted, use the compiled commands so the deployed service does not require `tsx`:

```sh
node dist-server/server/config/verifyOnlinePilotDeployment.js
node dist-server/server/db/verifyPostgresMigrationStatus.js --strict
node dist-server/server/db/applyPostgresMigrations.js --apply --strict
node dist-server/server/db/verifyPostgresMigrationStatus.js --strict
node dist-server/server/room-server.js
```

Migration commands use existing migrations only. Take a backup before changing an existing database, verify the destination, and run one migration job with sufficient privileges before application startup. Use a suitably restricted runtime DB identity afterward. Do not copy local pilot/test data into a real campaign inadvertently. Never point verification scripts at somebody's active session.

Wait for `/health` HTTP 200 before enabling ingress. During startup restore it may be 503; allow startup time and do not create a restart loop. Health reports do not supply a Git SHA: keep the commit/patch, Node version, build origin and release time in the operator release record.

## 8. Restart, backup and recovery

No new graceful-shutdown handler was added. Plan a short maintenance window: stop new ingress, ask participants to pause, let active requests settle, close/drain connections at the proxy, then stop the old process. Start exactly one replacement against the same DB, asset directory and session secret. Wait for readiness, reconnect and compare event IDs/sequences, accepted actors, HP/resources and token footprints. Frozen unconfirmed actions must retry their original intent, not be recreated.

Before each session and before a release, quiesce writes and create a coordinated PostgreSQL backup and asset-volume snapshot/copy to protected off-host storage. Keep the paired timestamp/revision and encryption/access controls. PostgreSQL metadata alone does not restore image bytes. Restore both into an isolated fresh environment, then validate users/campaign/admissions/runtime/map/asset rendering and token geometry. Record measured restoration time and recovery point. A process restart is not a backup restore.

On failure: keep ingress closed, preserve diagnostics without credentials, restore the prior compatible code release or the paired DB/assets backup as appropriate. Do not run two revisions concurrently. Reopen only after readiness and the acceptance checks pass. Provider-specific backup/restore commands and automated retention must be selected and rehearsed before inviting the group.

## 9. Hosted acceptance gate

Use a disposable campaign and separate browser profiles/devices for GM, three players and spectator. Record revision, hostname, browser versions, dates, event IDs/sequences and redacted evidence. All following rows must pass on the actual host; local fixtures cannot pass them:

| Area | Required observation |
| --- | --- |
| GM | Valid HTTPS app load/deep-link refresh; bootstrap sign-in; create/load campaign; personal invites; source acceptance, room launch and permitted authoritative actions. |
| Player | Separate personal accounts can join, select/submit appropriate characters, receive approval, enter table and use only their permitted actors/actions. No dev headers needed. |
| Spectator | Can observe the allowed projections; cannot control PCs/NPCs or submit attacks/host mutations. Preserve current publicShared visibility expectations. |
| Consistency | All browsers see the same permitted resolved event and resulting state. Rich target data follows authoritative projection. |
| Rejection | Foreign actor/NPC claim, stale/removed action and known illegal range reject without new events, HP changes or broadcast mutation. |
| Retry | Drop response after server acceptance, reconnect and retry frozen intent: same event ID, no second damage application; changed fingerprint gets409. Check history fallback after cache eviction/restart. |
| Persistence | Controlled backend restart restores same campaign, admissions, actor state, runtime events and map. Large-token footprint and explicit override/clear survive. Fresh-env DB-plus-assets restore separately passes. |
| Session | Secure/HttpOnly/Lax host-only cookie present; JSON/localStorage does not receive raw session token; refresh and return in session two work; logout revokes; an unrelated account cannot impersonate another by headers/member IDs. |
| Network | Actual trusted HTTPS/WSS, no mixed content or localhost traffic; WS101, reconnect/cursor catch-up and duplicate-free log/map display; test ordinary idle interval and proxy disconnect. |
| Origin | Unallowed Origin/opaque Origin mutation gets403; foreign WS upgrade gets403; same-origin HTTP/WS remains usable. |
| Login pressure | Disposable login test gets429/Retry-After at the limit and recovers; no spoofed forwarding-header bypass. Do not run during participant onboarding. |
| Secrets/errors | Public files/network/error bodies contain no server credentials. Authentication/database failures expose safe messages. No test evidence/backup file is reachable under the public web root. |

Automated hosted entry points already exist: `cloud:verify:health`, `cloud:verify:deployed-e2e`, `alpha:verify:two-account-protocol -- --strict`, and `alpha:verify:restart-recovery -- --prepare/--verify --strict`. Inspect their required env and write scope before use. Set `E2E_API_BASE_URL` explicitly to the chosen disposable environment; operator-only `E2E_PRIVATE_ALPHA_ACCESS_CODE` must never become a browser variable. Restart verification also requires `PRIVATE_ALPHA_RESTART_STATE_FILE`, which contains cookies and belongs outside public/Git storage. These scripts may create test campaigns/accounts and do not replace browser TLS/cookie-policy tests.

After hosted gates pass, run [the two-session human pilot](../development/FIRST_SESSION_PILOT_V1.md). Record actual intervention/confusion and select the next gameplay task from observed failures. No AI GM, guild, matchmaking, world-news, broad character-builder or movement expansion was started.

## 10. Verification completed in this milestone

| Check | Result |
| --- | --- |
| Action Clarity checkpoint | 38-file atomic commit; fresh rendering/intent checks before commit |
| New pilot readiness | 19 config/preflight/real HTTP+WS boundary/cookie-serialization checks and 4 endpoint assertions pass; auth handlers are fixtures, not real DB accounts |
| Existing cloud config/startup/build/e2e-plan | 6 + 1 + 3 + 4 checks pass |
| Existing private-alpha auth | 6 checks pass, including personal-invite second-name rejection |
| Existing frontend/server socket reconnect | Both pass |
| TypeScript | `npm run lint` and `npm run server:build` pass |
| Production pilot bundle | Build for `https://pilot.example.test` passes |
| Release artifacts | All 12 SQL files byte-identical; expected public origin present; four inspected backend values absent from bundle; only env examples tracked |
| Whitespace | Task changes pass; existing unrelated `scripts/dev-local.ps1` trailing blank line left untouched |

Action Clarity's prior real PostgreSQL/host/player/spectator/retry/restart evidence remains available in its report. It was not relabeled as new cloud testing. No actual hosted target, TLS certificate, cloud DB, volume replacement, backup restoration, multi-device acceptance or human session has been verified here.

**Next concrete step:** select the private host/domain and persistent PostgreSQL/assets arrangement, configure backend-only secrets, review/commit this readiness patch, build for that actual origin, rehearse restore, then execute the hosted gate. The remaining uncertainty is operational and hosted behavior, not permission to expand gameplay.
