# Active Task

## Authoritative continuation checkpoint — 2026-09-17, Hosted Pilot Deployment V1

**Readiness is committed as `4754c0d`; Railway preparation is committed as `a66001f`. Actual hosted deployment is blocked on Railway account login.** The current user explicitly authorized audited GitHub push and Railway provisioning/deployment. This supersedes older no-push/provider-unselected/uncommitted statements below. Read [the hosted report](../implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md) for push status, exact manifest and acceptance ledger.

Railway is selected: one app process, private PostgreSQL, persistent app asset volume and generated HTTPS domain only. Docker builds plus 23 readiness, 11 Railway contract and seven isolated PostgreSQL/container checks passed. The history/tracked-file audit found no known live secrets; dependency remediation leaves one low Windows esbuild development-server advisory. No Railway service or URL exists yet. No hosted role/WS/reconnect/retry/restart/backup/restore result may be claimed from these local checks.

User's minimal next action: run `npx --yes @railway/cli login`, complete browser authorization and report success without sharing credentials. Continue provisioning and actual acceptance from [the runbook](../../deploy/RAILWAY_PILOT.md). Pause only for account-owner authorization/billing boundaries. Preserve `.env`, normal services/database, `scripts/dev-local.ps1` and 1,412 unrelated untracked files. Do not start Pilot Character Builder or another product milestone.

## Earlier checkpoints (historical)

## Current checkpoint — 2026-09-17

**Online Pilot Readiness V1 repository work is complete and uncommitted.** The prior Action Clarity milestone was verified and committed atomically as **8d9ed1c** (38 files); no push. Read [the readiness report/runbook](../implementation/DND_ONLINE_PILOT_READINESS_V1.md) and its source manifest before continuing. This supersedes the uncommitted Action Clarity status below.

The provider-neutral plan is one HTTPS/WSS origin, one Node process, PostgreSQL and persistent asset storage. Implemented production endpoint fallback, explicit pilot build, safe Vite env handling, fail-closed cloud config, HTTP/WS origin checks, a coarse login cap, personal-invite-compatible config, compiled SQL packaging and deployment preflight. New readiness checks (19 + 4), existing auth/cloud/reconnect checks, builds and TypeScript pass. No hosted TLS, cloud database, volume replacement, backup restore or human sessions have been tested.

Next: select target/domain and storage, configure secrets privately, review/commit readiness changes, build for the actual origin and complete the hosted acceptance/restore gate before the two human sessions. Current generated bundle targets `https://pilot.example.test` for verification only. No gameplay expansion or provider-specific deployment files. Preserve `.env`, normal services/database and unrelated worktree dirt. Only Action Clarity was authorized for this checkpoint commit; readiness remains reviewable.

## Previous checkpoint (historical)

2026-09-16: the user requested committing the former work and proceeding with the roadmap.

Completed checkpoint: **75686c9 — feat(dnd): materialize token footprints from accepted actor size**. Exactly the prior milestone's 63 manifest-listed files were committed. Nothing pushed; unrelated files excluded.

Current slice: **D&D First-Session Action Clarity V1 — implemented and verified, uncommitted.** Read [the report](../implementation/DND_FIRST_SESSION_ACTION_CLARITY_V1.md) and [roadmap](../development/PRODUCT_BENCHMARK_AND_ROADMAP_V1.md). Do not repeat the size or product architecture audits.

Implemented: projected actor/action/target summary, frozen pending display, separate rejection/unconfirmed feedback, labeled prior-result disclosure, action loading, existing character/source-review navigation and localized errors. Intent/replay/visibility/permission authority remains unchanged.

Evidence: 19 new browser checks, 47 established live-tabletop checks, eight real PostgreSQL/backend host/player/spectator checks, lost-response retry, unchanged event identities after restart, focused T12 smokes and successful builds. Real acceptance uses authored training actions and localDev identities; it is not a human pilot or deployed-auth acceptance.

Next gate: two real 60–90-minute group sessions using [the pilot protocol](../development/FIRST_SESSION_PILOT_V1.md). Observe actual friction before choosing gameplay expansion. Do not fabricate human participation or automatically expand T13/T14, visibility, weapons or movement.

Normal backend8787/frontend3000 and configured DB55453 were healthy in the assessment. This slice used and stopped a separate temporary PostgreSQL55460/backend8798. Existing database/.env and normal services were untouched. The harness now supports alternate ports and test-user seeding.

New work remains unstaged/uncommitted for review. Preserve scripts/dev-local.ps1, .work/, .yuki-*, Claude outputs/, output/, outputs/, tools/, work/, and older evidence. Do not blanket-stage or reset unrelated files.
