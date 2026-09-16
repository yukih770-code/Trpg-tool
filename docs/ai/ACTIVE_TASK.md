# Active Task

D&D Actor Size → Token Footprint Materialization V1 is complete and verified, uncommitted, at starting HEAD `1073dbd`.

The requested scope ends here. Do not begin T13/T14 or later spatial expansion without a new request. Do not stage, commit, or push under this task.

Read [the complete implementation report](../implementation/DND_ACTOR_SIZE_FOOTPRINT_MATERIALIZATION_V1.md) and its evidence directory for the exact authority chain, limitations, A–V answers, file manifest, tests, browser walkthrough, and PostgreSQL restart results.

Implemented: six-value optional typed size; seven source-backed fixed species; canonical NPC/custom Monster selector; V3 T11 hash/review; accepted Actor server lookup at creation; pure size/grid mapping; normal map persistence; diagnostic Runtime projection; local-only initializer. No live inheritance, old-Token resize, new migration, or T12 resolver changes.

Acceptance: canonical dwarf PC 1×1 and Large NPC 2×2 without numeric bounds; adjacent dagger resolves; farther dagger returns 409; GM 3×3 override survives Actor Small size and reload; clear persists; same isolated PostgreSQL backend restarted and recovered footprints/legality.

Environment: configured database localhost:55453 is unavailable. Acceptance used a dedicated temporary PostgreSQL 18 cluster on 55459, backend8787/frontend3000, leaving .env and existing databases untouched. The harness is tests/size-materialization/local-infrastructure.mjs; it provisions only existing schema.

Preserve unrelated dirt: scripts/dev-local.ps1, .work/, .yuki-*, Claude outputs/, output/, outputs/, tools/, work/, and earlier untracked evidence. The task source manifest separates its own files.
