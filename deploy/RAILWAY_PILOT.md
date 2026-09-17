# Railway private pilot

Use one combined web service, one Railway PostgreSQL service and an app asset volume. No custom domain. The first deployment must use the generated HTTPS domain. Hosted execution/results belong in `docs/implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md`.

## Account boundary

On the operator's computer, run `npx --yes @railway/cli login` and complete the browser authorization. Never paste the CLI token in chat or Git. Select the intended workspace/project after login. If billing or terms require confirmation, the account owner must complete that step. The local repository contains no Railway credentials.

## Services and build

1. Create a private pilot project and a PostgreSQL service using Railway's PostgreSQL template. Keep it private; do not enable its public TCP proxy for ordinary app traffic.
2. Create an empty app service. Keep one replica and application sleeping disabled. Attach an asset volume at `/data/assets` **before starting the app**. With CLI volume commands use exact service/environment IDs before the `add` subcommand; name lookup in the tested Windows CLI panicked. The startup script fails closed if the mount is absent.
3. Generate the app's Railway domain, using the service networking panel or `railway domain --service <app-service> --port 8080`. Use that generated domain only. If creating through the UI stages an early build before variables exist, it should fail closed; finish configuration and redeploy.
4. Set public variables and backend-only secrets below in Railway. The Docker build accepts only `APP_PUBLIC_HTTP_URL` as a build argument. Do not add credential build arguments. The `build:pilot` command supplies the Vite endpoints/auth flags without reading a local credential file into the image.
5. Apply the versioned service settings below, then connect the audited GitHub repository. Explicitly deploy the reviewed commit. Railway builds the multi-stage Dockerfile, runs `deploy/railway-predeploy.mjs`, then starts the image. Pre-deploy applies existing SQL and checks status. It does not touch the app volume. Startup verifies the actual mount, makes its root directory writable by UID1000, drops root, runs deployment preflight and starts the existing backend.
6. Wait for `/health`200, then perform the hosted acceptance gate. The backend already reads `PORT` and listens on the wildcard/dual-stack address; no localhost bind is introduced. Railway terminates HTTPS and forwards WebSocket upgrades to the same process.

Reference variables avoid embedding a particular generated hostname in source. In the app's Railway Variables panel configure:

| Name | Configuration |
| --- | --- |
| `NODE_ENV` | production |
| `RAILWAY_DOCKERFILE_PATH` | Dockerfile; explicitly select the combined backend/frontend image |
| `SERVER_DEPLOYMENT_ENVIRONMENT` | cloudPrivateAlpha |
| `SERVER_RUNTIME_MODE` | cloud |
| `PORT` | 8080 (match generated domain target port; another Railway-provided port also works) |
| `APP_PUBLIC_HTTP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `APP_PUBLIC_WS_URL` | `wss://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `ROOM_ALLOWED_ORIGINS` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `DATABASE_URL` | Reference the PostgreSQL service's private `DATABASE_URL`, e.g. `${{Postgres.DATABASE_URL}}`; use its actual service name |
| `DATABASE_SSL_MODE` | disable for the explicitly selected Railway private network; require for verified TLS connections elsewhere |
| `DATABASE_NETWORK` | railway-private, only with the private `*.railway.internal` DB URL |
| `ASSET_STORAGE_DIR` | /data/assets |
| `PRIVATE_ALPHA_AUTH_ENABLED` | true |
| `PRIVATE_ALPHA_SESSION_SECRET` | Generate an independent secret from at least32 random bytes, store only in Railway, retain securely |
| `PRIVATE_ALPHA_INVITE_CODE` | Generate another secret from at least32 random bytes; GM/operator only |
| `PRIVATE_ALPHA_SESSION_MAX_AGE_DAYS` | 30 or a deliberately chosen session lifetime |
| `POSTGRES_USER_DEV_API_ENABLED` | false |

Railway supplies `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_PUBLIC_DOMAIN`, and `RAILWAY_VOLUME_MOUNT_PATH`. The DB transport exception requires explicit opt-in, Railway project/environment context and an internal hostname. It does not allow unverified TLS or plaintext public DB connections. This uses Railway's encrypted WireGuard network; PostgreSQL authentication/transactions/persistence are unchanged. If using a public database endpoint for a separate operations workflow, configure verified TLS and its trusted CA; never select `prefer` merely to bypass certificate errors. [Private networking](https://docs.railway.com/networking/private-networking).

### Apply settings to new Railway services

New services cannot opt into the deprecated `railway.json` mechanism. The first hosted attempt therefore skipped the migration/healthcheck settings; this was diagnosed and corrected without changing the application. The obsolete file has been removed. Use the public API's explicit service settings, or equivalent reviewed IaC, before deployment. [Railway compatibility notice](https://docs.railway.com/config-as-code).

Run this from the repository root after replacing the two IDs with the app service and its intended environment. The checked-in variables file contains settings only, never credentials:

```powershell
npx --yes @railway/cli api --file deploy/railway-service-settings.graphql --variables '@deploy/railway-service-settings.json' --raw-var serviceId=APP_SERVICE_ID --raw-var environmentId=ENVIRONMENT_ID --compact
```

The API builder enum does not contain `DOCKERFILE`; `RAILWAY_DOCKERFILE_PATH` selects Docker explicitly. Do not assume a successful provider status proves that the backend is running: inspect `/health` for JSON, `privateAlpha`, schema readiness and successful startup recovery. A static frontend returning HTML for `/health` is not backend acceptance.

After settings change, use `serviceInstanceDeployV2` with the explicit reviewed `commitSha` through `railway api`; inspect the effective deployment manifest. The CLI `redeploy` rehearsal reused settings from an older deployment and was insufficient for applying this configuration correction. Keep GitHub auto-deploy disabled through `serviceInstanceAutoDeployUpdate` during the pilot. [Service deployment API](https://docs.railway.com/integrations/api/manage-services).

No backend secret needs a `VITE_` prefix. No custom domain, DNS record or certificate purchase is part of this setup. Application TLS is provided by the generated domain. [Generated domains](https://docs.railway.com/networking/domains/working-with-domains).

## Single writer and releases

Use one volume-attached service instance and one region. Disable automatic deployment on every unrelated push while the pilot is active. Schedule maintenance: pause users, stop new actions, then redeploy. Volume-attached Railway services incur downtime instead of concurrent access to the same volume; verify that the previous instance has stopped before testing the replacement. Do not remove the asset volume to obtain zero-downtime deployment. The app's process-local locks/registries are not a multi-replica protocol. [Healthchecks and volume deployment](https://docs.railway.com/deployments/healthchecks).

Do not apply migrations during Docker build: private networking is available in the pre-deploy/runtime environment. The packaged SQL files are copied by `server:build`; there are twelve current migrations. Pre-deploy must fail if configuration or migration files are absent. Volumes are checked only at startup because Railway does not mount them in pre-deploy containers. [Pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).

## Acceptance and restart

Use separate GM/player/spectator browser contexts on the actual generated URL. Give each player a personal one-use server invitation, not the GM bootstrap credential. Run the checklist in the readiness report: admission/ownership, permitted attacks, illegal-action no-mutation, original-intent retry,409 mismatch, reconnect/no duplicate, token geometry, secure cookies, foreign-origin HTTP/WS rejection and login cap.

Record event IDs/sequence, actor/HP state, token footprints and asset metadata before an actual Railway restart/redeploy. Compare the same persisted values afterward. A local Docker rehearsal does not satisfy this check. Revoke disposable sessions/invites after acceptance; never publish cookie jars or browser storage captures.

The existing HTTP/two-account/restart scripts can target the generated origin using server-side `E2E_API_BASE_URL` and `E2E_PRIVATE_ALPHA_ACCESS_CODE`. Review each script's setup/cleanup effects; use a disposable campaign. `PRIVATE_ALPHA_RESTART_STATE_FILE` contains cookies and must be outside Git/public storage. Do not print all Railway variables or use verbose HTTP traces containing Cookie/Authorization.

Set `E2E_SOCKET_TIMEOUT_MS` to 20000 for the two-account internet protocol. Its default remains 5000 for local checks; the permitted range is 5000–60000. This changes only the verifier's wait, not server authentication or reconnect behavior. Compare recovered JSON structurally; PostgreSQL JSONB may reorder object keys. Spatial acceptance must use grid-aligned occupied bounds: off-grid geometry intentionally preserves GM adjudication in the current rules.

## Backup AND isolated restore procedure

This section is a procedure, not evidence that a backup/restore happened.

1. Pause writes. Record source project/service/environment IDs, PostgreSQL major version, migration IDs/checksums, representative campaign/actor/event IDs and token footprints. Record the paired asset snapshot time. No credentials in that record.
2. Create a Railway database volume backup and an app asset volume backup. Retain the pair. Additionally create a logical custom-format PostgreSQL dump using a client with the same or newer major version as the hosted server. Use an authenticated operator shell in the database service or an explicitly secured private-network job; keep connection credentials in that job's environment.
3. Run the following **inside that source operator environment**, with PostgreSQL connection variables already injected. Place output in private operator storage, never `dist` or the publicly served asset namespace:

```sh
umask 077
pg_dump --format=custom --no-owner --no-acl --file=/tmp/pilot-backup.dump
pg_restore --list /tmp/pilot-backup.dump > /tmp/pilot-backup.contents
sha256sum /tmp/pilot-backup.dump
```

Transfer the dump through authenticated tooling into protected off-service storage. Record its location and checksum without connection strings. A file only in a container's `/tmp` is not a durable backup. Select/verify the transfer method in the authorized Railway environment before claiming completion.

4. Provision a **separate test PostgreSQL service/database**. Record its service/database identity and verify that it differs from the active pilot target. Inject only the restore target's connection variables into the restore job. Verify the destination with `SELECT current_database(), inet_server_addr();` and the Railway service/environment ID. Do not overwrite the active database or run `--clean` against it.
5. In the isolated restore environment, import the transferred dump:

```sh
pg_restore --exit-on-error --single-transaction --no-owner --no-acl --dbname="$PGDATABASE" /tmp/pilot-backup.dump
```

6. Point an isolated verification instance at that restored DB, with the paired restored asset volume. Run the packaged migration status command and compare checksums/counts with the source. Check representative campaign, accepted Actors, room permissions, RuntimeLog event IDs/sequences, map tokens/footprints and rendered assets. Test a read-only browser entry before any deliberate post-restore mutation. Keep the restored clone isolated from the actual pilot domain.
7. Record backup creation, protected storage, restore target, commands, schema/data comparisons, elapsed time and failures. Only then mark restore passed. After saving evidence, remove only explicitly identified disposable restore services/volumes and revoke restore-only credentials; retain the protected backup according to the chosen retention policy. Do not delete the live pilot DB or its assets.

## Local verification

`npm run server:build` then `npm run pilot:verify:railway` checks private-DB transport and fail-closed startup/pre-deploy behavior. Build the production image with a test origin and run `node tests/online-pilot/railway-image.mjs` to rehearse migrations, container readiness, origin rejection, image file exclusions and non-root application execution. The harness creates uniquely named disposable Docker resources and removes only those resources in its cleanup. It never targets the normal local DB or hosted pilot.

## Remaining dependency advisory

Compatible lockfile fixes removed the reported high/moderate advisories, including `ws`. Express's transitive `qs` is explicitly pinned to the patched6.16.0 version because Express's own range remained on the vulnerable minor series. One low esbuild advisory remains: it affects its development file server on Windows; this Linux production image runs Express and does not start that server. Do not expose development servers as the pilot. [Maintainer advisory](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).
