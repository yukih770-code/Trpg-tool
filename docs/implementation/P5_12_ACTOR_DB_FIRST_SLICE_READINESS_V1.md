# P5.12 Actor / Character DB First Slice — Readiness v1

Rationale note for the Actor / Character Vault DB first slice. Implemented in
P5.12A-C — see `POSTGRES_ACTOR_REPOSITORY_FIRST_SLICE_V1.md` for the mechanics.

## 1. Why Actor DB follows User and Campaign

- Every durable aggregate references a **User `ownerId`** (P4.3). User (P5.10)
  established the identity + repository + smoke pattern; Campaign (P5.11) cloned it
  for the first non-user asset. Actor is the next owner-scoped asset and reuses the
  exact same pattern instead of inventing a third approach.
- `actors.owner_id` is a FK to `users.user_id` — the User tables must exist first.
- Actor and Campaign are **sibling** asset tables under one owner. They are
  intentionally created independently: there is no actor↔campaign binding yet.

## 2. Why the full sheet uses JSONB first

- DND 5e, COC 7e, and CP RED sheets have almost nothing in common structurally
  (classes/levels vs skills/sanity vs role/humanity). A single relational schema
  covering all three would be premature and lossy.
- Storing the **whole sheet as `actor_payload JSONB`** with a `schema_version`
  preserves every field losslessly for migration, while still promoting the few
  columns needed to list/filter/own/lifecycle (`display_name`, `system_id`,
  `owner_id`, timestamps, `archived_at`).
- This mirrors how the local stores already hold full per-system character objects.

## 3. Why not relationalize every sheet field yet

- The first slice's job is a safe, reviewable persistence boundary, not a query
  model. Relationalizing (e.g. a stats table, an inventory table) can be layered on
  later per system without breaking the payload contract.
- Premature normalization would couple the DB to one system's rules and make the
  slice large and risky.

## 4. How local actor ownership informs migration

- `src/lib/platform/actorVaultOwnership.ts` (P5.2) already assigns the device's
  local anonymous user as owner of local actors via an additive registry keyed by
  `${systemId}:${actorId}`. That `(systemId, actorId, ownerId)` triple is exactly
  the migration source for the cloud `(owner_id, system_id, local_actor_id)` origin
  key — the local `actorId` becomes `local_actor_id`, and the cloud mints a global
  `actor_id`.
- The read-only `ActorVaultReadAdapter`
  (`src/lib/platform/actorVaultRepositoryBridge.ts`) is the shape a future cloud
  actor adapter mirrors; this slice does NOT implement that frontend cloud path.

## 5. How future Campaign Actor Instance differs from Character Vault

- **Character Vault (this slice):** the long-term owner-scoped character asset.
- **Campaign Actor Instance (future):** a campaign-scoped instance with its own
  HP/inventory/growth/state, bound to a campaign — a separate table with different
  ownership/lifecycle semantics. Not modeled here.
- Live current HP/SAN/resources remain **runtime authority**, never Vault DB
  authority.

## 6. What P5.12 completes

- `0003_actors.sql`, `PostgresActorRepository`, actor schema readiness, read-only
  actor smoke, rollback-only actor write smoke, `db:verify:actor` /
  `db:verify:actor:write`, `/health` `database.actorSchema`, and docs.

## 7. What remains for later

- Frontend Character Vault cloud sync + local→cloud actor upload.
- Actor API routes (env-gated dev read route first, mirroring the User pattern).
- Campaign Actor Instance DB + actor↔campaign binding.
- RuntimeEvent DB, Asset/Object Storage DB.
- Auth/login/session, permission model.
- Per-system relationalization of hot query fields, if/when needed.
