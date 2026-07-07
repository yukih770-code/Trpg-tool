# Postgres User API Boundary v1

This note records the first server-side API boundary skeleton around the
Postgres UserRepository. It is an implementation boundary, not a production
account API.

## Scope

- Adds a small server API response envelope.
- Adds server-only User API handler functions.
- Keeps UserRepository behind an injection/composition boundary.
- Keeps handlers unmounted from public Express routes.
- Documents future route-mounting direction.

## Explicit Non-Goals

- No login.
- No auth provider.
- No JWT, cookie, or session management.
- No frontend user UI.
- No frontend database access.
- No public write endpoint.
- No Campaign, Actor, RuntimeEvent, Asset, Workshop, or cloud sync database
  implementation.
- No migration runner or automatic table creation.
- No Room Server protocol or WebSocket changes.

## API Envelope

The server-side envelope lives in:

```text
server/api/apiResponse.ts
```

Successful responses include:

```text
ok: true
statusCode
value
requestId?
```

Error responses include:

```text
ok: false
statusCode
error.kind
error.message
error.retryable?
requestId?
```

Allowed safe error kinds:

```text
bad_request
not_found
unavailable
validation
conflict
internal
```

The envelope must not include `DATABASE_URL`, credentials, raw driver errors,
or stack traces.

## User API Handlers

Handlers live in:

```text
server/api/userApiHandlers.ts
```

Current handlers:

```text
getUserByIdHandler
getUserProfileHandler
getUserByIdentityHandler
saveUserProfileHandler
```

The read handlers are the intended first public route candidates. The profile
write handler exists only as an internal skeleton until auth and permission
boundaries exist.

## Repository Injection Boundary

Handlers are created with:

```text
createUserApiHandlers({ userRepository })
```

If no repository is provided, the default Postgres UserRepository is used. The
handlers do not create database pools directly and do not import frontend code.

## Input Validation

The current skeleton validates only the minimum:

- `userId` must be a non-empty string.
- `providerKind` must be a non-empty string.
- `providerSubject` must be a non-empty string.
- profile payloads must be objects with non-empty `userId`, `handle`, and
  `displayName` when the internal save handler is used.

No validation library is introduced.

## Error Translation

Repository errors are translated into safe API errors:

- missing records -> `not_found`
- conflicts -> `conflict`
- unconfigured database, missing schema, or database query failure ->
  `unavailable`
- invalid inputs -> `bad_request` or `validation`
- unknown failures -> `internal`

Raw database errors are intentionally not exposed.

## Route Mounting

No routes are mounted in this slice.

Future read-only route candidates may include:

```text
GET /api/users/:userId
GET /api/users/:userId/profile
GET /api/users/by-identity?providerKind=...&providerSubject=...
```

Public write routes should wait for explicit auth, permission, and audit
boundaries.

## Excluded Domains

Campaign, Actor, RuntimeEvent, Asset, Workshop, Room Runtime, membership, and
cloud sync remain outside this slice. Existing local adapters remain active.

## Update — P5.10F-G-H (verification + dev routes)

- **Handlers are now smoke-verifiable** via `createUserApiHandlers({ userRepository })`
  with a fake repository — no database required. Run `npm run api:verify:user`
  (see `docs/implementation/POSTGRES_USER_DEV_API_VERIFICATION_V1.md`).
- **Dev-only READ routes may be mounted** behind the server-only env gate
  `POSTGRES_USER_DEV_API_ENABLED=true` (default off; **always off in production**):
  `GET /api/dev/users/:userId`, `GET /api/dev/users/:userId/profile`,
  `GET /api/dev/users/by-identity`. No write/save route is ever mounted.
- **Production public API is still blocked** by the missing auth / session /
  permission layer. The dev routes exist only for local verification precisely
  because there is no authentication yet.
