# Active Task

## Authoritative checkpoint — 2026-09-17, Hosted Pilot Deployment V1 complete

**Live: https://dnd-web-production.up.railway.app.** Railway project `dnd-private-pilot` has one app, private PostgreSQL 18.6 and persistent DB/asset volumes. Twelve existing migrations are applied. The explicit deployed revision is `84215fe`; auto-deploy is disabled. Read [the final hosted report](../implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md), its continuation manifest and sanitized evidence. Final documentation HEAD is available through `git log -1 -- docs/implementation/DND_HOSTED_PILOT_DEPLOYMENT_V1.md`.

Actual hosted checks passed: 90 protocol, 20 gameplay/role browser, six origin/health/asset, login throttle, backend-secret bundle exclusion, ten real-restart recovery, 24 preparation/25 restart protocol and nine final-release recovery checks. GM/player/spectator had separate authenticated browser contexts. A real hosted PostgreSQL dump plus asset archive was restored into an isolated local PostgreSQL 18.4 cluster: all 59 tables, 12 migration records and asset bytes matched. Target stopped; live database never overwritten. No native volume snapshots, scheduled backups or human sessions are claimed.

Readiness `4754c0d`, deployment preparation `a66001f`, preparation handoff `cd9715a`, correction `84215fe` are committed and pushed. Final evidence is committed/pushed separately. New Railway services require the explicit API settings in `deploy/railway-service-settings.*`; obsolete `railway.json` was removed. Use the runbook and an explicit reviewed commit for future releases, not automatic redeploy of an old manifest. Do not repeat completed audits or provision duplicate services.

Next user action: sign in at the live URL with the GM bootstrap code retrieved privately from Railway Variables, issue personal player invitations, then run two human pilot sessions. Trial/billing and ongoing paired off-device backups need owner attention before valuable campaign use. Technical deployment gate is ready for a separately authorized Pilot Character Builder V1; do not start it automatically.

Keep current backend authority, PostgreSQL, replay and visibility/permission rules. Secrets, session state, backups and operator SSH key remain in protected ignored `.pilot-private/`; never expose them. Preserve `.env`, normal local services/database, unrelated `scripts/dev-local.ps1` and 1,412 untracked files. No gameplay expansion, custom domain or T13/T14 work.

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
