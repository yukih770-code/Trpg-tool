# Postgres User Dev API Verification v1 (P5.10F-G-H)

This note explains how to verify the P5.10E User API boundary and how to enable
the optional dev-only read routes. It adds **no** login, auth, session, cookies,
JWT, frontend usage, or public write route.

## Handler smoke vs route smoke

- **Handler contract smoke (P5.10F):** exercises `createUserApiHandlers` directly
  with a **fake repository** — no database, no HTTP server. It asserts the safe
  envelope (status code + error kind) for every handler path.
  - Code: `server/api/userApiHandlersSmoke.ts` (fake repo + cases).
  - Runner: `server/api/verifyUserApiHandlers.ts` → `npm run api:verify:user`.
- **Route smoke (P5.10G, manual):** exercises the mounted dev routes over HTTP
  against a running local server. Optional; done with `curl` (below). It never
  requires a successful DB — `not_found` / `unavailable` responses are expected
  and correct when no DB / schema / user exists.

## Run the handler smoke

```bash
npm run api:verify:user
```

- Requires **no** `DATABASE_URL`; opens **no** database connection.
- Prints a compact JSON report `{ total, passed, failed, cases[] }`.
- Exits **nonzero** if any case fails.

Covered cases: `getUserByIdHandler` success / not_found / bad_request;
`getUserProfileHandler` success / not_found; `getUserByIdentityHandler` success /
bad_request; repository `not_configured` → `503 unavailable`, `database_error` →
`503 unavailable`, `unknown` → `500 internal`; `saveUserProfileHandler` validation
(non-object → `validation`, missing `userId` → `bad_request`) and success through
the fake repo (handler only — **never mounted as a route**).

## Enable the dev-only read routes

Server-only env gate (NO `VITE_` prefix), default off, **always off in
production**:

```bash
POSTGRES_USER_DEV_API_ENABLED=true npm run server:dev
# or the built server: POSTGRES_USER_DEV_API_ENABLED=true npm run server:start
```

Mounted routes (READ-ONLY):

```text
GET /api/dev/users/:userId
GET /api/dev/users/:userId/profile
GET /api/dev/users/by-identity?providerKind=...&providerSubject=...
```

No `POST`/`PUT`/`PATCH`/`DELETE`, no save-profile route, no write smoke endpoint.

`/health` reports `devUserApiEnabled: true|false` (a boolean only — no secret).

## Expected responses

- **DB not configured** (`DATABASE_URL` unset): read routes return
  `503 { ok:false, error.kind:'unavailable' }`.
- **DB configured but schema missing:** also `503 unavailable`.
- **DB configured, user missing:** `404 { ok:false, error.kind:'not_found' }`.
- **Bad input** (empty id / missing provider fields): `400 bad_request`.
- Every response is the safe envelope — **no `DATABASE_URL`, no credentials, no
  raw driver error, no stack trace.**

Manual check (with dev routes enabled):

```bash
curl -s localhost:8787/health
curl -s localhost:8787/api/dev/users/nonexistent-user
curl -s localhost:8787/api/dev/users/nonexistent-user/profile
curl -s "localhost:8787/api/dev/users/by-identity?providerKind=localAnonymous&providerSubject=missing"
```

## Why no write route

`saveUserProfileHandler` performs an authoritative write. Without authentication,
sessions, permissions, and audit, exposing it publicly would let any caller
overwrite any profile. It stays an internal handler (smoke-tested only) until
those boundaries exist.

## Why no auth means dev-only only

These routes have no identity, no permission check, and no rate limiting. They are
safe **only** on a local dev machine behind an explicit opt-in flag. They must
never be enabled in production, which is enforced by forcing the gate off when the
server environment is `production`.

## Confirm the frontend has no DB leak

```bash
rg "VITE_DATABASE_URL" .      # expected: 0 occurrences
rg "DATABASE_URL" src          # expected: 0 occurrences under src/
```

PowerShell fallback:

```powershell
Select-String -Path .\**\* -Pattern "VITE_DATABASE_URL" -List
Select-String -Path .\src\**\* -Pattern "DATABASE_URL" -List
```

`DATABASE_URL` must appear only under `server/`, docs, and dev-env files — never in
`src/` frontend code, and `VITE_DATABASE_URL` must never appear (a `VITE_` prefix
would bundle a secret into the client).

## Excluded (unchanged)

Campaign DB, Actor DB, RuntimeEvent DB, Asset DB, cloud sync, migration runner,
auto table creation, login/auth/session, and any frontend DB access remain **out
of scope**. Existing local adapters and DB smoke scripts (`db:verify:user`,
`db:verify:user:write`) are unchanged and still work.
