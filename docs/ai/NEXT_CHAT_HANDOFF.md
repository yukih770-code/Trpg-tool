# Continuation checkpoint — 2026-09-17

## Current: Hosted Pilot Deployment V1 complete

Live URL: **https://dnd-web-production.up.railway.app**. Read [the final report](../implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md) and [exact continuation manifest](../implementation/hosted-pilot-acceptance-files.json). Readiness `4754c0d`, Railway preparation `a66001f`, prior handoff `cd9715a`, release correction `84215fe` are committed/pushed; final evidence is a separate commit. Resolve final HEAD with Git. Current user authorized audited push and deployment; older no-push/login-pending statements below are historical.

Project `dnd-private-pilot`, production environment: one `dnd-web` process/replica, private PostgreSQL 18.6, persistent DB and asset volumes, generated domain only. Running release `84215fe`, deployment `b57849cb-5fbc-4d0a-a56f-be7c28fbc3d7`. All twelve migrations ready. GitHub auto-deploy disabled. New services cannot use the obsolete `railway.json`; reviewed API settings in `deploy/railway-service-settings.*` and explicit Docker selection now apply. Follow `deploy/RAILWAY_PILOT.md` for future maintenance.

Real hosted GM/player/spectator UI, action pending/rejection/retry/concurrent duplicate/mismatch, HTTP/WSS origins, cookies, throttle, bundle-secret exclusion, footprints, reconnect and real service restart passed. Restart/cache-loss retry reused the recorded event; nine additional final-release checks passed. Hosted logical DB backup and paired asset archive were actually restored to isolated local PostgreSQL 18.4: 59 tables, 12 migration records and asset bytes matched; target stopped. Protected backup: `.pilot-private/backups/20260917-151841`. No live DB overwrite, native snapshots, scheduled backups or restored-app browser claim. Private harness/state/key files remain ignored and must not be published.

Next: user signs in using GM-only bootstrap code from Railway Variables, issues personal invites, and runs two human pilot sessions. No current account/billing blocker; monitor trial limits and arrange ongoing paired off-device backups before valuable campaign use. Technical gate is ready for separately authorized Pilot Character Builder V1, but no new product milestone should start automatically. Preserve authority, permissions/visibility, replay and PostgreSQL. Preserve `.env`, normal local services/database and unrelated dirt (`scripts/dev-local.ps1` plus 1,412 untracked files).

## Earlier checkpoint (historical)

**Current:** Action Clarity committed as **8d9ed1c**; **Online Pilot Readiness V1 implemented/verified, uncommitted**. Nothing pushed or deployed. Read [the readiness report](../implementation/DND_ONLINE_PILOT_READINESS_V1.md) and `docs/implementation/online-pilot-readiness-files.json`. The older checkpoint below is historical.

Single-origin HTTPS/WSS → one Node process → PostgreSQL plus persistent asset volume. Config/origin/build/migration packaging blockers are fixed; tests pass. `.env`, unrelated files and normal local services/database were preserved. Hosted TLS/cookies, multi-user real-host acceptance, volume durability, backup restore and the two human sessions remain pending. The test bundle uses `pilot.example.test`; rebuild for the selected real domain. Bootstrap code is GM-only; use personal player invites and keep session secret stable because identity derivation also depends on it.

Next work needs the deployment target/domain/storage choices, then the report's release and acceptance procedure. Do not restart completed gameplay audits, expand gameplay, push or deploy automatically. New work is not committed. Preserve unrelated `scripts/dev-local.ps1` and older untracked evidence. The user requested committing the former Action Clarity milestone, which is fulfilled.

## Previous checkpoint (historical)

The user authorized committing the previous work and proceeding with the development roadmap. Size materialization is committed as **75686c9** (63 manifest-listed files). No push occurred.

**First-Session Action Clarity V1 is implemented, verified and uncommitted.** Read [its report](../implementation/DND_FIRST_SESSION_ACTION_CLARITY_V1.md), [roadmap](../development/PRODUCT_BENCHMARK_AND_ROADMAP_V1.md) and [pilot protocol](../development/FIRST_SESSION_PILOT_V1.md). Do not restart completed audits.

The action UI preserves frozen intent retries, server authorization, projection and replay. Real player/GM attacks, rejection after source change, response-loss replay, spectator restrictions and database restart passed. Evidence distinguishes fixture integration, real localDev backend checks, and human testing (not performed).

Next: obtain actual group-session observations. Two human sessions cannot be substituted with browser automation. Gameplay expansion should follow those observations; footprint-aware movement is a future slice. Build revision reporting and deployment/backup restoration remain operational follow-ups.

Normal service/database access was healthy at assessment, superseding the former DB-down note. Acceptance used and stopped separate backend8798/PostgreSQL55460 without altering .env or normal database content. Reproduce using tests/action-clarity/README.md.

Locked boundaries remain: approved rule sources, accepted Character/T11 authority, campaign overrides, generic Platform geometry, creation-only size defaults, explicit Token override/clear, recorded-fact replay and current visibility. No new migration, rules engine, equipment system or T13/T14 expansion.

Preserve unrelated work and older evidence; no blanket staging/cleanup/reset. The former milestone commit request is fulfilled. New action-clarity changes remain available for review.
