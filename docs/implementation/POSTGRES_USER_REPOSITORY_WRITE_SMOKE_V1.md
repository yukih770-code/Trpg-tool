# Postgres User Repository Write Smoke v1

This document describes the rollback-only write smoke for the P5.10 Postgres
user repository slice.

## What It Tests

The write smoke runs these repository operations inside a single transaction:

1. `createUserWithIdentity`
2. `getUserById`
3. `getUserByIdentity`
4. `getUserProfile`
5. `saveUserProfile`
6. `getUserProfile` again to confirm the update is readable

The transaction rolls back by default. No permanent smoke user should remain
after the default run.

## Prerequisites

- Local Postgres is running.
- `DATABASE_URL` is set server-side.
- `server/db/migrations/0001_user_identity.sql` has been applied manually.

There is still no migration runner and no startup auto-create behavior.

## Commands

Read-only verification:

```powershell
npm run db:verify:user
```

Rollback write smoke:

```powershell
npm run db:verify:user:write
```

Strict rollback write smoke:

```powershell
npm run db:verify:user:write -- --strict
```

Strict mode exits nonzero unless the smoke status is `rolled_back`.

## Expected Safe Output

Successful rollback smoke:

```json
{
  "smoke": {
    "status": "rolled_back",
    "transaction": {
      "attempted": true,
      "rolledBack": true
    }
  }
}
```

No database configured:

```json
{
  "smoke": {
    "status": "not_configured",
    "transaction": {
      "attempted": false,
      "rolledBack": false
    }
  }
}
```

Schema missing:

```json
{
  "smoke": {
    "status": "schema_missing"
  }
}
```

Repository failure:

```json
{
  "smoke": {
    "status": "repository_failed",
    "errorKind": "conflict"
  }
}
```

Transaction failure:

```json
{
  "smoke": {
    "status": "transaction_failed"
  }
}
```

The output must not include `DATABASE_URL`, credentials, or raw driver error
text.

## Test Identity

The smoke uses clearly test-only identity values:

```text
userId: user_postgres_write_smoke
providerSubject: postgres-write-smoke
handle: postgres-write-smoke
```

Because the transaction rolls back, these values should not persist after the
default smoke.

## Boundary

This smoke does not implement login, auth, Campaign DB, Actor DB, RuntimeEvent
DB, cloud sync, migration runner, frontend DB usage, or any Room protocol /
WebSocket behavior.
