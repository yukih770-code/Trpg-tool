# Implementation Context Manifest v1

**Read this before you code.** A short operating contract for Fable/Codex runs on
this repo. Pair it with `docs/architecture/ARCHITECTURE_INDEX_V1.md` (the map).

## Mandatory start condition

1. `git status --short` — if the prerequisite task isn't committed OR the tree is
   dirty, **stop and report**; do not continue on a dirty tree unless explicitly
   instructed.
2. Read the relevant Architecture Index section(s) for your task domain (below).
3. Run baseline verification when the environment allows (never fake results).

## Standard verification

```
npx tsc --noEmit
npx tsc -p server/tsconfig.server.json --noEmit
npm run build
npm run server:build
npm run db:verify:user           # not_configured is OK without local Postgres — do not fake
npm run db:verify:user:write     # rollback-only smoke
npm run api:verify:user          # fake repo, no DB; expect failed:0
git diff --check
```

If `dist-server/` is generated:

```
Remove-Item -Recurse -Force .\dist-server   # PowerShell
Test-Path .\dist-server                       # expect: False
```

## Standard leak checks

```
Search for Vite-prefixed database env names in the repo  # expect: 0
rg "DATABASE_URL" src                                      # expect: 0 (server-only)
```

PowerShell fallback: `Select-String -Path .\src\**\* -Pattern "DATABASE_URL"`.

## Git rules

- **No `git add`, no `git commit`** unless explicitly instructed.
- Suggested `git add` must list **exact paths only** — never `git add .`/`-A`.

## Invariants (do not violate)

- **Frontend must not use database env** (`DATABASE_URL` and any Vite-prefixed
  database env never in `src/` or the client bundle).
- **Server owns database access** — the frontend never calls Postgres or
  `/api/dev/users`.
- **Local anonymous identity** is the current viewer until real Auth exists.
- **`author-sample` is a seed-content author alias only** — never the current
  account.
- **User API dev routes** stay dev-only, env-gated, prod-off, read-only; no public
  write route; `saveUserProfileHandler` never mounted.
- **AI has no authority** — advisory only; never appends authoritative events or
  writes core aggregates.
- **RuntimeLog is append-only** with authority-assigned `seq`; corrections are new
  events, never in-place edits.
- **Ownership is additive** (registries, never rewrite records); migrate on read.
- **No vendor lock-in** — vendors live behind adapters, never in the domain.

## Task-domain read sets

| You are changing… | Read first |
| --- | --- |
| Frontend account/profile UI | Index → Frontend Account Surface + Identity/Ownership; `FRONTEND_ACCOUNT_SURFACE_IDENTITY_BINDING_V1` |
| User DB | Index → Postgres User First Slice; `POSTGRES_SCHEMA_MINIMAL_MODEL_V1`, `POSTGRES_FIRST_SLICE_USER_REPOSITORY_V1`, readiness checklist; `server/db/**` + `server/adapters/postgresUserRepository.ts` |
| User API | Index → User API Boundary; `POSTGRES_USER_API_BOUNDARY_V1`, `POSTGRES_USER_DEV_API_VERIFICATION_V1`; `server/api/**` |
| Campaign DB (P5.11) | Index → Campaign DB; `P5_11_CAMPAIGN_DB_FIRST_SLICE_READINESS_V1`, `POSTGRES_SCHEMA_MINIMAL_MODEL_V1` §3.4; `campaignOwnership.ts`, `campaignLocalRepositoryAdapter.ts` |
| Runtime / session / log | Index → Runtime/Room Authority; `RUNTIME_EVENT_REPLAY_BOUNDARY_AUDIT_V1`; `server/services/**`, `runtimeLogLocalStore.ts` |
| AI features | Index → AI Memory; `DOMAIN_MODEL_BOUNDARY_AUDIT_V1` (AI section) |

## Verification script index

| Script | Purpose | Needs DB? |
| --- | --- | --- |
| `npm run db:verify:user` | read-only DB slice check | optional (not_configured OK) |
| `npm run db:verify:user:write` | rollback-only write smoke | optional |
| `npm run api:verify:user` | handler contract smoke (fake repo) | no |
