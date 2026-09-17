# D&D Hosted Pilot Deployment V1

2026-09-17. **The private pilot is deployed. Automated hosted acceptance, actual restart recovery, and isolated backup restoration passed.** Live URL: **https://dnd-web-production.up.railway.app**. Human group sessions have not occurred. No next product milestone was started.

## Git checkpoint

| Commit | Purpose |
| --- | --- |
| `8d9ed1c` | Starting HEAD: completed First-Session Action Clarity |
| `4754c0d` | Atomic Online Pilot Readiness commit, 24 manifest-listed files |
| `a66001f` | Railway image, startup/migration guards, transport configuration, security fixes and runbook |
| `cd9715a` | Preparation report and account-authorization handoff |
| `84215fe` | Correct service configuration for new Railway services; configurable internet verifier timeout |
| Final evidence commit | This report, continuation manifest, sanitized evidence and handoff; resolve with `git log -1 -- docs/implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md` |

`origin/main` has been fast-forward pushed through `84215fe`. The final evidence commit is pushed separately; the task response records its hash and remote equality. No force push or use of `origin-old`. Current hosted-deployment authorization supersedes historical no-push instructions. Automatic review initially cited that old restriction; checking the newer explicit authorization resolved it, and the audited push/release succeeded.

The running application is the explicit `84215fe` release, deployment `b57849cb-5fbc-4d0a-a56f-be7c28fbc3d7`. GitHub automatic deployment is disabled: documentation pushes do not replace it. No application logic changed between the earlier successful hosted acceptance build (`cd9715a`) and this release; nine additional recovery checks passed on the final release.

## Security review before push

The readiness audit covered 469 reachable commits, 4,701 historical blobs and 1,178 tracked files. Checksum-verified Gitleaks 8.30.1 produced 28 reviewed false positives: 26 fixture identifiers and two translation keys. Follow-up deployment commit scans passed. Three sufficiently long local sensitive values were compared privately against history; only two historical copies of an example API-key placeholder matched. Historical DB URLs were 16 loopback examples, one reserved example endpoint and five template placeholders. No known live secret, real tracked `.env`, private key, database dump or browser-storage capture was found in the reviewed paths/history.

All 89 tracked image artifacts were visually reviewed. The two additional hosted screenshots were inspected: fixture gameplay, no credentials/cookies. This scoped review cannot prove that arbitrary historical binary content never contains private information. Raw scans, credentials, browser state, operator SSH key and backups remain in ignored `.pilot-private/`, protected by Windows ACLs for the operator and SYSTEM. None are committed or included in the image; published evidence is explicitly whitelisted.

Compatible dependency fixes reduced the production audit from 22 findings to one low finding, with zero moderate/high/critical findings. The remaining esbuild advisory concerns its Windows development server; the pilot uses Linux and Express. No forced major upgrade was introduced. [Maintainer advisory](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).

## Actual Railway architecture

Project **dnd-private-pilot**, environment **production**, region **sfo**. Project ID `16f792bf-eaa6-4e50-a37c-afea3fc03741`; environment ID `7f8db2bc-fa41-4a79-accb-fab74b06fb28`.

| Resource | Actual configuration |
| --- | --- |
| `dnd-web` | One Node process serves React, Express HTTP and WebSocket; one replica; sleeping disabled |
| Application identity | Service `9a0a76e8-77e4-4bb8-b75c-97bb7477e4e4` |
| Application volume | Persistent 500 MB volume mounted at `/data/assets` |
| `Postgres` | Railway PostgreSQL template, actual PostgreSQL 18.6; authoritative database |
| Database identity | Service `1f606300-308c-4a20-93bd-adcf46181a0f` |
| Database volume | Persistent 500 MB volume mounted at `/var/lib/postgresql/data` |
| Database network | Private Railway hostname; public TCP proxy list is empty |
| Public entry | Generated HTTPS domain above; same-origin HTTPS/WSS; no custom domain |

No worker, separate frontend, new schema, replacement persistence, paid-plan upgrade or domain purchase was introduced. The account remains subject to Railway's trial allowance; any later paid-plan selection is an account-owner action.

The image builds with Node 24.15.0, packages the existing twelve migrations and starts the application as UID1000 after checking the actual asset mount. Pre-deploy applies migrations and verifies checksums. All migrations `0000`–`0011` applied; strict status reported 12 ready and zero pending. Hosted `/health` returns JSON with private-alpha authentication, all 11 schema groups ready and startup recovery ready.

The original `railway.json` was ineffective for this new service: Railway no longer permits new services to opt into that mechanism. Provider success also allowed an incorrect static frontend fallback returning HTML for `/health`. The correction removes the obsolete file, versions explicit API settings in `deploy/railway-service-settings.graphql` and `.json`, selects the Dockerfile with `RAILWAY_DOCKERFILE_PATH`, and deploys an explicit reviewed commit. No auth, origin, mount or schema guard was relaxed. [Compatibility notice](https://docs.railway.com/config-as-code), [deployment API](https://docs.railway.com/integrations/api/manage-services).

Private DB transport requires the internal hostname, explicit opt-in and Railway project/environment context. Railway encrypts private networking with WireGuard; public DB connections still require verified TLS. Pre-deploy cannot access service volumes, so mount checks remain in startup. [Private networking](https://docs.railway.com/networking/private-networking), [pre-deploy lifecycle](https://docs.railway.com/deployments/pre-deploy-command).

Environment variable **names only**:

`NODE_ENV`, `SERVER_DEPLOYMENT_ENVIRONMENT`, `SERVER_RUNTIME_MODE`, `PORT`, `APP_PUBLIC_HTTP_URL`, `APP_PUBLIC_WS_URL`, `ROOM_ALLOWED_ORIGINS`, `DATABASE_URL`, `DATABASE_SSL_MODE`, `DATABASE_NETWORK`, `ASSET_STORAGE_DIR`, `PRIVATE_ALPHA_AUTH_ENABLED`, `PRIVATE_ALPHA_SESSION_SECRET`, `PRIVATE_ALPHA_INVITE_CODE`, `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS`, `POSTGRES_USER_DEV_API_ENABLED`, `RAILWAY_DOCKERFILE_PATH`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_VOLUME_MOUNT_PATH`.

Backend credentials were generated independently and injected privately. Keep the session secret stable: identity derivation also depends on it. The actual frontend bundle was checked against three backend-sensitive values; none appeared. See [the operations runbook](../../deploy/RAILWAY_PILOT.md).

## Hosted acceptance evidence

[Sanitized results](evidence/hosted-pilot/results.json) list individual checks. These are actual production HTTPS requests/browser sessions, not localhost mocks. Separate GM/player/spectator browser contexts had distinct authenticated identities. Player/spectator entry used individual invitations; secure cookies were verified. Fixture creation used authorized existing APIs.

| Gate | Actual result |
| --- | --- |
| Existing two-account protocol | 90 checks passed over hosted HTTPS/WSS |
| GM/player/spectator | All entered hosted UI; player and GM NPC attacks resolved; spectator attack controls absent |
| Action UI and integrity | 20 browser/gameplay checks passed, including frozen pending actor/action/target, rejection feedback and separate prior result |
| Response-loss retry | Real request reached backend, response deliberately lost; exact original request replayed the same event |
| Concurrent duplicate/mismatch | Duplicates returned the same persisted event; changed fingerprint returned 409 |
| Rejected action | Grid-aligned out-of-range melee returned 409 without adding an event or changing accepted history |
| Footprint | Server materialized Medium 1×1 and Large 2×2; existing off-grid adjudication policy preserved |
| Cross-client consistency | Permitted attack IDs agreed across GM, player and spectator |
| HTTPS/WSS/reconnect | Production endpoints; no localhost browser endpoints; offline/reconnect did not duplicate attacks |
| Origins, health and assets | Six checks passed; foreign HTTP and authenticated foreign WS origins rejected with 403 |
| Login throttle | 60 invalid attempts returned 401; next ten returned 429 despite spoofed forwarding headers |
| Frontend bundle | No match for three actual backend secrets/connection values |
| Actual hosted restart | Ten state/asset recovery checks passed; existing browser reconnected after process restart |
| Existing restart protocol | 24 preparation checks and 25 post-restart checks passed |
| Final release | Nine additional state, replay, spectator and asset checks passed on `84215fe` |

The two-account verifier accepts `E2E_SOCKET_TIMEOUT_MS` between 5000 and 60000; hosted tests used 20000. Its local default remains 5000. This changes only the verifier wait, not server behavior. Recovery uses structural equality because PostgreSQL JSONB may reorder keys. An early off-grid fixture correctly used existing GM adjudication; aligning its occupied bounds made exact-range rejection testable. Neither discovery changed gameplay rules or old expectations.

The final browser run added exactly three deliberate attacks once each relative to its baseline. Earlier fixture runs remain, so the disposable room totals seven attack events at RuntimeLog sequence eight; this is not seven attacks from the final run. The fixture campaign/room remain for inspection, not as a user campaign.

Screenshots: [player rejection with prior success collapsed](evidence/hosted-pilot/player-rejection.png), [spectator without attack controls](evidence/hosted-pilot/spectator.png). Raw private state contains cookies and must never be shared. No human group-session result is claimed.

Earlier local evidence remains separate: 23 readiness, 11 Railway contract and seven isolated Docker/PostgreSQL 16 checks passed, alongside frontend/backend builds. The final backend TypeScript build passed after the verifier change. These local results do not substitute for hosted acceptance.

## Actual restart and persistence

A real Railway restart replaced the process while a player browser was open. It reconnected automatically. Successful recorded startup recovery began at `2026-09-17T06:12:30.684Z`. Attack IDs, HP/result payloads, sequence, map events/footprints, approved room binding and campaign Actors matched their pre-restart snapshot. Retry after process-cache loss recovered the original RuntimeLog event without duplication. Spectator projection and asset bytes remained available. The later explicit `84215fe` release repeated state/asset checks successfully.

Future releases require a quiet period: one instance and attached volume intentionally allow maintenance downtime. Multi-replica safety and zero-downtime releases are not claimed. Auto-deploy remains disabled.

## Actual backup AND isolated restoration

Source: hosted PostgreSQL 18.6. Browser writers were closed; all 59 public tables had stable counts/canonical row digests before and after the dump. Authenticated SSH streamed `pg_dump --format=custom --no-owner --no-acl` and a paired `/data/assets` archive into protected local storage, without a public DB endpoint.

- Backup directory: `D:\Download\dnd\.pilot-private\backups\20260917-151841`.
- `pilot.dump`: 266,046 bytes; SHA-256 `b09765b1d2bdad2848aaa42a043f92e3675b513674c017b79b215e23b375eca9`.
- `assets.tar`: SHA-256 `461f0988e00d0c9dd937edcafd74d548fb2ae6d1d9d365cb1480ad98dc1edd3f`.
- Isolated destination: fresh PostgreSQL 18.4 cluster at `D:\Download\dnd\.pilot-private\restore-20260917-151841`, loopback `127.0.0.1:50969`, database `pilot_restore`.
- Restore: `pg_restore --exit-on-error --single-transaction --no-owner --no-acl --dbname=pilot_restore`, with isolated connection settings supplied privately through its environment.
- All **12 migration records and 59 public tables** matched source counts and canonical row digests, including campaign Actors, room records, permissions/memberships, event history and asset metadata. The paired archive was extracted into the isolated target; its one asset matched byte-for-byte by SHA-256.
- Source database was never overwritten. The isolated cluster was stopped; its temporary password file deleted. A stopped earlier disposable attempt remains for inspection. No normal local database/service was altered and no recursive cleanup occurred.

This was a hosted backup restored into an isolated **local** PostgreSQL server, not a third Railway database. No provider-native volume snapshot or scheduled backup policy was created. No app browser was pointed at the restored clone; verification compared all database content plus asset bytes. The backup is off-service on this computer, not redundant off-device archival storage. These are explicit operational limitations.

Private verifier/evidence: `.pilot-private/hosted-restore.py` and `hosted-restore-result.json`. Published evidence contains aggregate counts/checksums, never rows/cookies/connection strings. Retain the protected backup. For later cleanup, inspect exact resolved restore directories and confirm their clusters are stopped before removing only those disposable paths. Never delete active Railway volumes.

## Exact manifest and preserved work

[hosted-pilot-acceptance-files.json](hosted-pilot-acceptance-files.json) enumerates this continuation relative to `cd9715a`, including obsolete config deletion, five release changes and final evidence/handoff files. The earlier [deployment manifest](hosted-pilot-deployment-files.json) and readiness manifest remain historical records.

Unrelated tracked `scripts/dev-local.ps1` and 1,412 pre-existing untracked files remain outside these commits: `.work/`, `.yuki-*`, `Claude outputs/`, `output/`, `outputs/`, `tools/`, `work/` and older evidence. `.env`, normal local database and frontend/backend services were preserved. No blanket staging/reset/restore/clean was used. Ignored private acceptance artifacts and local verification images remain on this computer.

## User next steps and development boundary

1. Open the live URL. In Railway, open `dnd-private-pilot` → `dnd-web` → Variables and privately retrieve `PRIVATE_ALPHA_INVITE_CODE` for GM sign-in. Do not send it in chat or share it with players.
2. Enter the server workspace, create/select the intended server and campaign, and issue each player a personal invitation. Disposable acceptance fixtures are not a real campaign.
3. Run two 60–90 minute human sessions using [the pilot protocol](../development/FIRST_SESSION_PILOT_V1.md). Record confusion around joining, character preparation, targeting, retries and reading results.
4. Before retaining valuable campaign data, establish ongoing paired DB/asset backups with off-device retention and review Railway trial/usage limits. The one-off recovery drill does not provide ongoing backup automation.

No login, billing or domain action currently blocks deployment. The technical hosted gate is ready for a separately authorized Pilot Character Builder V1. Human pilot feedback remains pending and should inform priorities. Do not automatically begin that or another product milestone.

Preserve structured Actor/Action/Target requests, authoritative backend validation/rules/persistence, recorded-fact replay, PostgreSQL and current visibility/permissions. Future AI remains a requester/presenter, never an unrestricted writer of persistent state. No new gameplay, AI GM, companion, guild, matchmaking, complete builder, UI redesign, custom domain or T13/T14 work belongs in this milestone.
