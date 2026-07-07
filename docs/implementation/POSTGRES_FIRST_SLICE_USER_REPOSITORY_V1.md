# Postgres First Slice User Repository v1

This note records the first server-only Postgres slice for user identity and
profile data. It is an implementation note, not a deployment requirement.

## Scope

- Adds a server-only Postgres runtime configuration reader.
- Adds a lazy `pg` pool and health helper.
- Adds manual DDL for `users`, `user_identities`, and `user_profiles`.
- Adds a Postgres user repository adapter for user identity/profile reads and
  first-slice writes.
- Adds database health to the existing Room Server `/health` response.

## Explicit Non-Goals

- No frontend database access.
- No database credentials in client bundles.
- No migration runner.
- No campaign, actor, runtime, room, workshop, media, package, or log storage.
- No auth provider integration.
- No cloud sync.
- No Room protocol or WebSocket changes.

## Query Layer

The first slice uses `pg` (`node-postgres`) directly. The reasons are:

- It keeps the server adapter small and explicit.
- It supports parameterized SQL without adding an ORM boundary.
- It avoids tying the repository contract to a generated client.
- It is easy to replace behind the repository boundary later if needed.

All SQL in the user repository uses positional parameters.

## Environment

Server-only environment variables:

- `DATABASE_URL`
- `DATABASE_SSL_MODE` (`disable`, `prefer`, or `require`; default `disable`)
- `DATABASE_POOL_MAX` (default `5`)
- `DATABASE_CONNECTION_TIMEOUT_MS` (default `3000`)

When `DATABASE_URL` is missing, the server still starts and `/health` reports
database status as `not_configured`.

## Health Response

`/health` now includes a `database` object with:

- `configured`
- `status`
- optional `latencyMs`
- optional `errorKind`

It must never return `DATABASE_URL`, credentials, or raw driver error messages.

## Manual DDL

DDL lives at:

```text
server/db/migrations/0001_user_identity.sql
```

It is not executed automatically. Operators can apply it manually in a prepared
Postgres database when this slice is ready to be tested against real storage.

## Future Work

- Add a controlled migration runner.
- Add auth provider integration.
- Connect user identity to room/session ownership through explicit service
  boundaries.
- Add campaign and actor repositories in later slices.
