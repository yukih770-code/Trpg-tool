# Postgres Local Dev Verification v1

This document explains how to verify the P5.10 user repository slice against a
local Postgres database. It is a local development workflow only.

## What This Verifies

- Room Server `/health` remains safe without a database.
- `DATABASE_URL` is server-only.
- The user slice reports missing schema before manual DDL.
- The user slice reports ready after manual DDL.
- The read-only smoke helper can run without writing data.

It does not verify or implement Campaign, Actor, RuntimeEvent, Auth, cloud sync,
object storage, migrations, or frontend DB access.

## 1. Start Local Postgres

Use the local-only compose file:

```powershell
docker compose -f docker-compose.postgres.yml up -d
```

It starts:

```text
database: trpg_platform_dev
user: trpg_local
host port: 55432
```

The password is local-only and intentionally not suitable for production.

## 2. Set Server-only Environment

Use `.env.postgres.example` as a reference. For a PowerShell session:

```powershell
$env:DATABASE_URL = "postgres://trpg_local:trpg_local_password@localhost:55432/trpg_platform_dev"
$env:DATABASE_SSL_MODE = "disable"
```

Do not put database connection strings into frontend or Vite environment
variables. Do not put them into Netlify frontend environment settings.

## 3. Health Without Database

With `DATABASE_URL` unset, run the server and open `/health`.

Expected database shape:

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

The server should still start.

## 4. Health Before DDL

With `DATABASE_URL` set and Postgres reachable, but before applying the DDL:

```json
{
  "database": {
    "configured": true,
    "status": "ok",
    "schema": {
      "status": "schema_missing"
    }
  }
}
```

The response may include `missingTables` or `missingColumns`. It must not print
the connection string.

## 5. Apply Manual DDL

Apply:

```text
server/db/migrations/0001_user_identity.sql
```

Example with `psql`:

```powershell
psql "$env:DATABASE_URL" -f server/db/migrations/0001_user_identity.sql
```

This project still has no migration runner and does not auto-create tables at
startup.

## 6. Health After DDL

Expected database shape:

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

## 7. Read-only User Slice Smoke

Run:

```powershell
npm run db:verify:user
```

The script prints safe JSON with:

- database health;
- schema readiness;
- read-only user repository smoke result.

It does not write users and it does not run migrations. If you want CI-style
failure when the schema is not ready:

```powershell
npm run db:verify:user -- --strict
```

## 8. Confirm No Frontend DB Leak

Preferred checks:

```powershell
Get-ChildItem src -Recurse -File | Select-String -Pattern "DATABASE_URL"
Get-ChildItem . -Recurse -File | Where-Object { $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\dist-server\\|\\.git\\" } | Select-String -Pattern "VITE_DATABASE"
```

Expected:

- no `DATABASE_URL` occurrences under `src/`;
- no Vite-prefixed database URL variable in the project.

## 9. Stop Local Postgres

```powershell
docker compose -f docker-compose.postgres.yml down
```

To remove the local dev data volume:

```powershell
docker compose -f docker-compose.postgres.yml down -v
```

Only remove the volume when you intentionally want to discard local dev DB data.

## Boundary Reminder

This local harness does not change the active local adapters. It does not add
frontend database access, Campaign DB, Actor DB, RuntimeEvent DB, auth/login, a
migration runner, or cloud sync.
