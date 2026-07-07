# Postgres User Repository Smoke v1

This note documents the manual verification path for the first server-only
Postgres user repository slice. It does not add a public smoke endpoint and it
does not require Postgres for local Room Server development.

## Manual DDL

Apply the first-slice DDL manually when testing against a real database:

```text
server/db/migrations/0001_user_identity.sql
```

There is no migration runner yet. The server never creates or mutates schema at
startup.

## Local Environment

Server-only environment variables:

```text
DATABASE_URL=postgres://...
DATABASE_SSL_MODE=disable
DATABASE_POOL_MAX=5
DATABASE_CONNECTION_TIMEOUT_MS=3000
```

Do not create any Vite-prefixed database URL variable. The frontend must never
receive a database connection string.

## Health Without Database

With no `DATABASE_URL`, the Room Server still starts. `/health` reports:

```json
{
  "database": {
    "configured": false,
    "status": "not_configured",
    "schema": {
      "status": "not_configured"
    }
  }
}
```

## Health With Database But Missing Schema

When `DATABASE_URL` points to a reachable database but the first-slice tables
have not been applied, `/health` reports database connectivity as ok and schema
readiness as missing:

```json
{
  "database": {
    "configured": true,
    "status": "ok",
    "schema": {
      "status": "schema_missing",
      "missingTables": ["users", "user_identities", "user_profiles"]
    }
  }
}
```

Column-level drift is reported through `missingColumns`.

## Health With Ready Schema

After applying `0001_user_identity.sql`, `/health` can report:

```json
{
  "database": {
    "configured": true,
    "status": "ok",
    "schema": {
      "status": "ready"
    }
  }
}
```

The health response must never include `DATABASE_URL`, credentials, or raw
driver error output.

## Read-only Smoke Helper

`server/db/postgresUserRepositorySmoke.ts` exposes a server-only read-only
smoke helper. It checks:

- database configuration and connectivity;
- first-slice user schema readiness;
- a harmless repository read for a reserved smoke probe user id.

It does not write test data and it is not wired to a public HTTP endpoint.

## Leak Checks

Recommended checks:

```powershell
Get-ChildItem src -Recurse -File | Select-String -Pattern "DATABASE_URL"
Get-ChildItem . -Recurse -File | Select-String -Pattern "VITE_DATABASE"
```

Expected:

- `DATABASE_URL` has zero occurrences under `src/`.
- Vite-prefixed database URL variables have zero occurrences in the project.

## Excluded Domains

This slice still excludes:

- Campaign DB adapters;
- Actor DB adapters;
- RuntimeEvent persistence;
- object storage;
- auth/login;
- frontend DB access;
- cloud sync;
- migration runner;
- Room protocol or WebSocket changes.
