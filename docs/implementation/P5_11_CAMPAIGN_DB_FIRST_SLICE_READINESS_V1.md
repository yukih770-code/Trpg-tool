# P5.11 Campaign DB First Slice — Readiness v1

Readiness note for the NEXT stage. **Planning only — no code, no Campaign DB
implementation in this task.** Grounded in the existing repo.

## 1. Why Campaign DB comes after the User first slice

- Every durable aggregate references a **User `ownerId`** (P4.3). The user slice
  (P5.10) established the identity + repository + smoke + API pattern; Campaign
  reuses it instead of inventing a second approach.
- `campaigns.owner_id` is a FK to `users.user_id` — the User tables must exist
  first (the minimal-schema doc lists `campaigns` right after users/identities/
  profiles).
- The proven pattern to clone: **manual DDL → server-only repository → schema
  readiness → read + rollback-write smoke → safe API envelope → optional dev-gated
  read route**, with a **local ownership registry as the migration source**.

## 2. Existing pieces to reuse

- **Local campaign ownership registry:** `src/lib/platform/campaignOwnership.ts`
  (P5.3) — already assigns the local user as owner of local campaigns via an
  additive registry (never rewrites `LocalCampaign`). This is the **migration
  source** for `campaigns.owner_id`.
- **Local campaign store/adapter:** `campaignLocalStore.ts` (persisted, versioned)
  + `campaignLocalRepositoryAdapter.ts` — the shape a cloud `CampaignRepository`
  mirrors.
- **Schema:** `POSTGRES_SCHEMA_MINIMAL_MODEL_V1.md` §3.4 already specifies the
  `campaigns` table (PK `campaign_id TEXT` = `campaign_<uuid>`, `owner_id FK→users`,
  `system_id`, title/status/`schema_version`/timestamps; local ids preservable on
  upload).
- **User slice as template:** `server/db/**`, `server/adapters/postgresUserRepository.ts`,
  `server/api/**` — copy structure, not content.

## 3. Critical boundary warnings (grounded in existing docs)

- **`campaigns.owner_id` ≠ `hostUserId`.** The minimal-schema doc is explicit:
  the room *host* identity lives in `runtime_sessions`, **not** in
  `campaigns.owner_id`. Do not backfill `campaigns.owner_id` from a room's
  `hostUserId`; use the **campaign owner** (local ownership registry / campaign
  record owner).
- **`campaignRef` must NOT become DB authority.** The Room Server's `campaignRef`
  is a read-only echo (protocol-frozen); the `campaigns` row is the durable asset.
  Do not wire the Room protocol into the Campaign DB.
- **Vault actor vs campaign actor instance stay separate** (existing boundary doc):
  campaign-scoped HP/inventory/growth is a Phase-2 `campaign_actor_instances`
  concern — **not** part of the first Campaign slice.

## 4. Recommended P5.11A first slice (small but meaningful)

- Manual `campaigns` DDL (`server/db/migrations/0002_campaign.sql`) matching
  minimal-schema §3.4.
- Server-only `CampaignRepository` Postgres contract/adapter **skeleton**
  (`getCampaignById`, `getCampaignsByOwner`, `saveCampaign`, `checkReadiness`) —
  same result-envelope + error-mapping style as `PostgresUserRepository`.
- Campaign schema readiness check + read-only smoke + rollback-only write smoke;
  add `db:verify:campaign` (+`:write`) mirroring the user scripts.
- Optional: env-gated dev-only READ route later (mirror `POSTGRES_USER_DEV_API_ENABLED`),
  NOT in the first slice unless explicitly requested.

## 5. Must NOT include yet

- No frontend sync / no frontend call to a Campaign API.
- No migration runner / no auto table creation.
- No membership/sharing (`campaign_memberships` is Phase 2).
- No `campaign_actor_instances` / actor or runtime persistence.
- No public write endpoint; no auth/session.
- No Room protocol/WebSocket change; `campaignRef` untouched.

## 6. Go/No-Go

**GO for P5.11A** as a server-only CampaignRepository boundary slice, starting from
the repository (not frontend sync), reusing the User-slice pattern and the local
campaign ownership registry as the migration source.

## 7. Status — implemented (P5.11A-C)

The first slice is now implemented (server-only): `0002_campaigns.sql`,
`postgresCampaignRepository.ts`, `postgresCampaignSchemaReadiness.ts`, read-only +
rollback write smokes, and `db:verify:campaign` / `db:verify:campaign:write`. See
`POSTGRES_CAMPAIGN_REPOSITORY_FIRST_SLICE_V1.md`. No frontend sync, no Campaign API
routes, no membership/actor/runtime persistence.
