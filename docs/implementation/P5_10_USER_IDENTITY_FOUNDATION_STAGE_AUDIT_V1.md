# P5.10 User Identity Foundation — Stage Audit v1 (P5.10K-L)

Closeout audit for the P5.10 User Identity Foundation (slices A–J). **Audit +
docs only — no new DB feature, no auth, no frontend↔backend User API wiring.**

## 1. Completed slices (A–J)

| Slice | Delivered | Boundary |
| --- | --- | --- |
| A | `users`/`user_identities`/`user_profiles` DDL (`migrations/0001_user_identity.sql`); pg client; server-only DB env | manual DDL, no runner |
| B | DB health + `postgresSchemaReadiness` | read-only |
| C | `PostgresUserRepository` (`server/adapters`) | maps to DDL |
| D | read-only smoke + rollback write smoke + local dev harness (`db:verify:user`, `db:verify:user:write`) | write smoke rolls back |
| E | API envelope (`apiResponse.ts`) + `createUserApiHandlers` + injection seam; **no routes** | server-only |
| F | handler fake-repo smoke + `api:verify:user` (no DB) | no DB |
| G | env-gated dev-only READ routes (`userDevRoutes.ts`) + `POSTGRES_USER_DEV_API_ENABLED` | read-only, prod-off |
| H | dev-API verification doc + boundary note update | — |
| I | `currentViewerAccount.ts` projection; account menu unified to local user | frontend-only |
| J | `currentViewerAccountSmoke.ts`; account-surface binding doc | frontend-only |

## 2. Modified systems

Backend: `server/db/**`, `server/adapters/postgresUserRepository.ts`,
`server/api/**`, `server/config/serverRuntimeConfig.ts` (+`databaseRuntimeConfig`),
`server/room-server.ts` (gated dev mount + health flag), `package.json` (verify
scripts). Frontend: `src/App.tsx` (account display), `src/lib/platform/{localUserIdentity,
localViewerIdentity,currentViewerAccount,actorVaultOwnership,campaignOwnership,
localPersistenceAdapter}.ts`. Docs: `docs/implementation/POSTGRES_*`, `FRONTEND_ACCOUNT_*`.

## 3. Architecture chain (current)

```
local anonymous user (localUserIdentity, P5.1)
  → local viewer bridge + seed alias (localViewerIdentity, P5.4)
  → ownership registries (actorVaultOwnership P5.2, campaignOwnership P5.3; shared localPersistenceAdapter P5.5)
  → local repository adapters / cloud repository CONTRACTS (contracts only)
  → Postgres User first slice (DDL → PostgresUserRepository, server-only)
  → User API handler boundary (createUserApiHandlers + safe envelope)
  → dev-only READ route (env-gated, prod-off)
  → frontend account projection (currentViewerAccount → account surfaces)
```

The two ends **do not touch**: the frontend account projection reads the local
user; the Postgres user slice is exercised only by server smoke + dev routes.

## 4. What is verified vs unverified

- **Verified (static + smoke where runnable):** DDL ↔ repository ↔ readiness ↔
  error-code mapping are consistent; `api:verify:user` runs with a fake repo and
  **no DB**; handler error mappings (not_configured/schema_missing/database_error→
  503, unknown→500, missing→404, bad input→400); account menu no longer shows the
  legacy sample author.
- **Unverified without a local Postgres URL:** `db:verify:user` /
  `db:verify:user:write` return `not_configured` when `DATABASE_URL` is unset —
  expected, **not** faked. Real end-to-end DB behavior is confirmed only when a
  local Postgres is configured.

## 5. Boundaries (current, confirmed)

- **Server-only database:** `DATABASE_URL` used only under `server/`; **zero
  occurrences under `src/`**; no Vite-prefixed database env.
- **Frontend identity:** current viewer = local anonymous user; frontend makes
  **no** call to `/api/dev/users` or Postgres.
- **Dev route:** `POSTGRES_USER_DEV_API_ENABLED` server-only, default off, **forced
  off in production**; **read-only** (`GET` only); `saveUserProfileHandler` is
  **not** mounted; no public write endpoint.
- **Account surface:** account dropdown + top-nav + "我的主页" + "我的资料库" all
  resolve to the local user; `author-sample`/`graycastle_author` never shown as the
  current account (seed-content author alias only).

## 6. Known limitations

- No auth/session/login (login/logout are reserved UI).
- Server user state persists only with a configured Postgres; no cloud sync.
- Ownership lives in additive local registries (not on records) — a deliberate
  offline-first choice; a future cloud-sync step normalizes them.
- Dev routes are unauthenticated — safe only locally behind the flag.

## 7. Explicit exclusions (unchanged)

Campaign/Actor/RuntimeEvent/Asset DB; Auth/OAuth/JWT/cookies/session; frontend→User
API; public production user API; migration runner; auto table creation; membership/
sharing; cloud sync; Room protocol/WebSocket changes.

## 8. Go / No-Go for P5.11 (Campaign DB)

**GO** — the User first slice pattern (DDL → server-only repository → readiness →
read/rollback smoke → safe API envelope → optional dev-gated route → local
ownership registry as migration source) is proven and repeatable. P5.11 should
clone this pattern for a **CampaignRepository Postgres skeleton only**, starting
from the boundary (not frontend sync). See
`P5_11_CAMPAIGN_DB_FIRST_SLICE_READINESS_V1.md`.
