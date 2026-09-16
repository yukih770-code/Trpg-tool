# Continuation checkpoint — 2026-09-17

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
