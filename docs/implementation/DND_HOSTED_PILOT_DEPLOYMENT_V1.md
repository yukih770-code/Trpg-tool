# D&D Hosted Pilot Deployment V1

2026-09-17. **Railway deployment preparation is implemented and locally verified. Actual hosted deployment and acceptance are blocked on Railway account authorization. This milestone is not complete.**

## Checkpoint and Git

- Starting HEAD: `8d9ed1c` (completed Action Clarity).
- Readiness commit: `4754c0d` — `feat(deploy): prepare private online pilot readiness`; exactly the 24 files in `online-pilot-readiness-files.json`, verified before commit. That older report/manifest describes its historical uncommitted state; this checkpoint supersedes it.
- Deployment commit: `a66001f` — `feat(deploy): prepare Railway private pilot deployment`; 12 explicitly staged implementation/runbook files.
- This report, exact manifest and three handoff files form a separate documentation commit. Find its hash with `git log -1 -- docs/implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md`; a document cannot embed its own commit hash.
- GitHub push: successful through `a66001f`; `origin/main` advanced from `d87dc15` by a normal fast-forward push. The documentation checkpoint is committed and pushed separately; the final task response records its resulting HEAD and remote verification.
- Remote selected: `origin`, `yukih770-code/Trpg-tool`, branch `main`. `origin-old` was not used. No force push.

## Security review before push

The readiness checkpoint audit covered 469 reachable commits, 4,701 historical blobs and 1,178 tracked files. Gitleaks 8.30.1 was downloaded from its official release and checksum-verified. Its 28 findings were reviewed: 26 map/token fixture identifiers and two translation keys, all false positives. The deployment commit's additional Gitleaks scan passed without findings.

Three sufficiently long sensitive values from local `.env` were compared privately against historical blobs. The only matches were two historical copies of a known template API-key placeholder in `.env.example`. No real local credential match was found. Historical database URLs were classified as 16 loopback examples, one reserved example endpoint and five explicit template placeholders. No known live credential, private key/certificate, tracked real `.env`, PostgreSQL data directory, database dump or browser-storage capture was found in the reviewed paths/history.

All 89 currently tracked screenshot/image artifacts were visually reviewed using private contact sheets. They show fixture UI/gameplay evidence; no visible credential/cookie capture was found. This is a scoped review, not a proof that arbitrary historical binary content can never contain private information. Fixture room codes and actor names are not production credentials. Raw scanner output, audit tools and contact sheets stay in ignored `.pilot-private/`; none are published with this report or included in the image.

`.gitignore` excludes real env files, local assets and private pilot artifacts. The Docker build uses an explicit file allowlist, excluding repository history, local env files, evidence, user data and audit tools. Runtime image exclusions were also tested. Production credentials must be stored in Railway, never in Git or Vite configuration. No known live secret required rotation; do not reinterpret this as permission to commit future secrets.

Compatible lockfile security updates reduced the production dependency audit from 22 findings to one low finding, with zero moderate/high/critical findings. Express's `qs` dependency is constrained to patched 6.16.0. The remaining esbuild advisory concerns its development file server on Windows; the pilot image runs Linux and serves through Express. No forced major dependency migration was made. [Maintainer advisory](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).

## Deployment architecture prepared

One Railway application service serves the built React frontend, Express HTTP API and WebSocket endpoint from one Node process. One Railway PostgreSQL service remains the authoritative database. One app volume holds asset bytes; database metadata and asset bytes must both be backed up. One replica is required by the existing process-local state/lock architecture. No additional worker, reverse proxy or separate frontend service was introduced.

Railway service creation has **not occurred**. No project, database, app volume or generated HTTPS URL was provisioned. The selected first-domain policy is Railway's generated HTTPS domain only; there is no custom-domain work.

`Dockerfile` pins Node 24.15.0 on Debian, builds frontend/backend and packages the existing twelve migrations. Its only explicit build argument is the public frontend origin. `railway.json` configures a migration pre-deploy command, required asset mount, healthcheck, one replica and no sleeping. The backend already binds Railway's assigned port on the wildcard address. Startup verifies the configured asset mount, then drops root privileges before preflight and application startup.

Pre-deploy invokes the existing strict migration apply/status tools, with no new SQL or schema changes. Volume checks happen at runtime because Railway's pre-deploy environment does not mount service volumes. [Railway pre-deploy lifecycle](https://docs.railway.com/deployments/pre-deploy-command).

The deployment preflight accepts an explicit provider-private DB transport only when the internal hostname, opt-in and Railway project/environment context all match. Railway's private network is encrypted with WireGuard. Public database connections still require verified TLS; unverified TLS remains rejected. This is a provider transport configuration, not an authentication/origin/visibility exception. [Railway private networking](https://docs.railway.com/networking/private-networking).

Environment variable **names only** for this milestone:

`NODE_ENV`, `SERVER_DEPLOYMENT_ENVIRONMENT`, `SERVER_RUNTIME_MODE`, `PORT`, `APP_PUBLIC_HTTP_URL`, `APP_PUBLIC_WS_URL`, `ROOM_ALLOWED_ORIGINS`, `DATABASE_URL`, `DATABASE_SSL_MODE`, `DATABASE_NETWORK`, `ASSET_STORAGE_DIR`, `PRIVATE_ALPHA_AUTH_ENABLED`, `PRIVATE_ALPHA_SESSION_SECRET`, `PRIVATE_ALPHA_INVITE_CODE`, `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS`, `POSTGRES_USER_DEV_API_ENABLED`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_VOLUME_MOUNT_PATH`.

The operational setup and reference-variable expressions are in [the Railway runbook](../../deploy/RAILWAY_PILOT.md). No live secret values are recorded there. Keep the session secret stable because identity derivation also depends on it.

## Verification actually performed

The final image was built from the committed dependency lockfile using `npm ci`, with a reserved test origin. Both production frontend and compiled backend builds passed.

| Verification | Result and scope |
| --- | --- |
| Existing readiness checks in the Linux build | 19 config/HTTP/WS/cookie checks + 4 endpoint checks passed |
| New Railway contract checks | 11 passed: explicit private DB transport, spoof/public/unverified rejection and fail-closed pre-deploy/volume startup |
| Isolated Docker/PostgreSQL rehearsal | 7 passed, detailed below |
| Production dependency audit | One low finding; zero moderate/high/critical |
| Deployment-file whitespace checks | Passed; unrelated existing script whitespace was not changed |
| Hosted tests | None; do not count local results as hosted acceptance |

The seven real-container checks used a new isolated PostgreSQL 16 container and a uniquely named asset volume/network. They verified fresh migration apply, safe migration rerun, configured port and DB/schema readiness, production frontend serving without rehearsal secrets, foreign HTTP-origin rejection, twelve packaged SQL files with local sensitive paths excluded, and application PID1 running as UID1000. The harness removed its own disposable containers/volume/network. It never targeted the normal local database. The local verification image remains available for inspection.

No screenshots or browser-storage dumps were generated for hosted acceptance. Existing readiness/auth checks establish local behavior only. The new rehearsal did not exercise real GM/player/spectator browser profiles, actual internet TLS, hosted WebSocket proxying, service replacement, or backup restoration.

## Hosted acceptance ledger

| Required gate | Actual status |
| --- | --- |
| Railway project/application service/asset volume | Not created; account login required |
| Railway PostgreSQL | Not provisioned |
| Fresh hosted migration/schema verification | Not run; local isolated migrations passed |
| Generated production URL and HTTPS | No URL; not deployed |
| Production frontend/backend and bundle-secret check | Not run on a hosted build |
| Production HTTP origin, cookie/session and login throttle | Not run; local checks passed |
| Production WebSocket approved/rejected origin | Not run; local checks passed |
| Separate GM/player/spectator browser acceptance | Not run |
| Actor/action/target pending/result/rejection path | Not run hosted |
| Frozen retry, fingerprint mismatch and no duplicate action | Not run hosted |
| Rejected-action no-mutation and distinct previous result | Not run hosted |
| Token footprint/spatial legality | Not run hosted; no gameplay changes made |
| Hosted reconnect and cross-client state consistency | Not run |
| Actual service restart/redeploy and persisted recovery | Not run |
| PostgreSQL backup creation and protected off-service storage | Not performed; no dump/location exists |
| Actual isolated PostgreSQL restoration | Not performed; no restore target exists |
| Restored schema and representative data/asset verification | Not performed |

## Backup/restore gate

The runbook gives the supported procedure: pause writes, record schema and representative state, take paired DB/asset backups, create a logical custom-format dump, transfer it to protected durable storage, verify a distinct restore-target identity, restore transactionally into that isolated database, and compare schema, actors, tokens/footprints, permissions and event history. Restore verification must use a paired asset snapshot. Cleanup is restricted to identified disposable restore resources.

These instructions are preparation only. No backup was created and no restoration was executed during this checkpoint. Neither a local test nor backup creation alone satisfies the user's actual hosted restoration requirement. Never restore over the active pilot database.

## Exact changed files and preserved work

[hosted-pilot-deployment-files.json](hosted-pilot-deployment-files.json) lists all 17 files in this deployment preparation and evidence checkpoint: 12 implementation/runbook files and five report/manifest/handoff files. The preceding readiness commit has its own 24-file manifest; overlapping package/config/handoff files are deliberate.

The unrelated tracked modification in `scripts/dev-local.ps1` and all 1,412 pre-existing untracked files remain uncommitted. These include `.work/`, `.yuki-*`, `Claude outputs/`, `output/`, `outputs/`, `tools/`, `work/` and older evidence. `.env`, normal frontend/backend services and the configured local database were preserved. No reset, restore, clean, blanket staging or unrelated repair was performed.

## Continuation boundary

The missing prerequisite is Railway account login on this computer. The minimal manual step is:

```powershell
npx --yes @railway/cli login
```

Complete browser authorization and tell the assistant it succeeded; do not paste a token. Then resume from these commits: confirm the intended workspace, provision services/volume, generate the Railway domain, inject secrets privately, deploy, and execute every hosted acceptance/recovery/isolated-restore gate above. If Railway requires account-owner billing or terms confirmation, pause only for that step. No repository or architecture re-audit is needed merely to resume.

**Not yet ready to advance to Pilot Character Builder V1.** Hosted verification and recovery/restore remain mandatory. Do not begin a new product milestone automatically after deployment. Preserve structured Actor/Action/Target requests, authoritative server validation/rules/persistence, recorded-fact replay, PostgreSQL, current visibility and permission boundaries. Future AI remains a requester/presenter, never an unrestricted writer of persistent state. No new gameplay, AI, UI redesign or custom-domain work belongs in this milestone.
