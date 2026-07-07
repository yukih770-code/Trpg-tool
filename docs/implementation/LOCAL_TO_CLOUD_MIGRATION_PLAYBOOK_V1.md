# Local-to-Cloud Migration Playbook V1 (P5.9)

Status: **planning document only.** No implementation, no sync, no upload, no
login, no schema change, no local-store migration. Defines how the P5.1–P5.7
local data will LATER become cloud-owned assets under the
POSTGRES_SCHEMA_MINIMAL_MODEL_V1 model.

---

## 1. Goal

Turn device-local data into cloud-owned assets **without ever breaking local
play**.

Local sources (all existing):
- local anonymous user — `localUserIdentity.ts`
  (`trpg-platform-local-user-v1`)
- actor ownership registry — `actorVaultOwnership.ts`
  (`trpg-actor-vault-ownership-v1`)
- campaign ownership registry — `campaignOwnership.ts`
  (`trpg-campaign-ownership-v1`)
- local viewer identity bridge — `localViewerIdentity.ts`
- local persistence adapter — `localPersistenceAdapter.ts`
- campaign local adapter — `campaignLocalRepositoryAdapter.ts` over
  `campaignLocalStore` (`platform-campaign-local-store`)
- actor vault bridge — `actorVaultRepositoryBridge.ts` over the three system
  character stores

Cloud targets: `users` / `user_identities`, `campaigns`, `actors`,
`runtime_events` (future ingest), `asset_metadata`.

## 2. Migration Principles

- **Dry-run before apply** — every migration produces a reviewable plan first
  (the P5.1 `OwnershipMigrationPlan` dry-run pattern generalizes here).
- **Never delete local data during first upload.** Upload copies; it does not
  move.
- **Preserve local IDs when safe** (campaign ids and the device user id share
  the cloud id space by design); **generate cloud IDs only when needed**
  (actors always get cloud ids; origin key preserved).
- **Idempotency keys** on every upload unit so retries never duplicate.
- **Conflict detection before write**, not after (§5).
- **User confirmation for any destructive choice** — and the first version
  simply has no destructive choices.
- **Rollback strategy** documented per step (§8).
- **Local remains fully usable offline** during and after migration.

## 3. Claim Flow (future; no implementation now)

1. User plays local-anonymous (today's state; `user_<uuid>` on device).
2. User logs in with an external provider (future auth work, out of scope).
3. Backend links the device's localAnonymous identity to the cloud user
   (`user_identities` insert; unique `(provider_kind, provider_subject)`
   makes this idempotent).
4. Client scans local data via the EXISTING read boundaries (campaign local
   adapter, actor vault bridge, ownership registries).
5. **Dry-run migration preview** is rendered (see §7).
6. User selects what to upload; selected assets upload with idempotency keys.
7. Cloud ownership is established (`owner_id` = claimed cloud user).
8. A **local-cloud mapping table** is stored locally (§6) via
   `localPersistenceAdapter` (new key, additive — never touches existing
   keys).
9. Future sync (P5.11+) can begin from that mapping.

## 4. Local Data Inventory

| Source | Decision | Notes |
| --- | --- | --- |
| `localUserIdentity` record | **Migrate** (becomes claim input) | Identity + profile → `users`/`user_profiles`; handle may need uniqueness adjustment (confirm with user). |
| `actorVaultOwnership` registry | **Migrate as metadata** | Not uploaded as rows; consumed to set `actors.owner_id`. Registry stays local afterwards for offline mode. |
| `campaignOwnership` registry | **Migrate as metadata** | Same: consumed into `campaigns.owner_id`. |
| Character stores (DND/COC/CP) | **Migrate only after user confirmation** | Full sheets are user property; per-actor selection in preview. |
| `campaignLocalStore` campaigns | **Migrate only after user confirmation** | Per-campaign selection; payload = export-envelope snapshot. |
| Local runtime logs (`runtimeLogLocalStore`) | **Migrate later (P5.11+), default no** | Local solo-session logs are low-value v0 data; server-hosted logs are a SERVER ingest concern, not client upload. |
| Entry drafts (`campaignEntryDraftStore`) | **Do not migrate** | UI-local selections, not repository data (P5.7 rule). |
| Mock/seed content (author-sample docs, packages, fan works, media seeds) | **Remain seed/mock — never uploaded as user content** | P5.4 alias makes them READABLE by the local user; readable ≠ owned-for-upload. Explicit "copy to my library" (future feature) would be required first. |
| localViewerIdentity / localPersistenceAdapter | **Not data** | Infrastructure; nothing to migrate. |

## 5. Conflict Strategy

| Conflict | Resolution |
| --- | --- |
| Same local ID already exists in cloud | If content-hash equal → treat as already-uploaded (idempotent skip). Else mint a new cloud id, record both in mapping, mark `conflictStatus: 'renamed'`. |
| Same actor uploaded from two devices | `(owner_id, system_id, local_actor_id)` unique catches identical origin; different origins with same name are DIFFERENT actors (no auto-merge — surface in preview). |
| Campaign same title, different ID | Not a conflict — titles are not keys. Preview groups them so the user can spot accidental duplicates. |
| Local payload changed after upload | Mapping stores `localUpdatedAt`/`cloudUpdatedAt`; a later re-upload becomes an explicit user choice ("update cloud copy") — no silent overwrite in v1. |
| Cloud newer than local | v1 never downloads-overwrites; mark `conflictStatus: 'cloudNewer'` and leave both intact (sync policy is P5.11). |
| Local anonymous user linked to a DIFFERENT cloud user | Hard `conflict` from the identity unique constraint; requires explicit unlink/support flow — never auto-relink. |
| Seed content vs user content | Seed origin ids (`author-sample`-owned, demo-* ids) are excluded by inventory rules before preview. |

## 6. ID Mapping Strategy (local store shape, future)

One additive local record set (behind `localPersistenceAdapter`, new key,
e.g. `trpg-cloud-id-mapping-v1` — final name decided at implementation):

- `localEntityId` · `cloudEntityId` · `entityType`
  (`user|campaign|actor|asset`) · `ownerId` (cloud user) · `schemaVersion` ·
  `lastSyncedAt` · `localUpdatedAt` · `cloudUpdatedAt` · `conflictStatus`
  (`none|renamed|cloudNewer|localNewer|error`)

Rules: append/update-in-place per entity; never blocks local reads; deleting
the mapping only forgets sync state — it never touches domain data.

## 7. Migration Preview UX Requirements (no UI now)

The future preview must show: what will upload (grouped by type, with
counts), what stays local (and why: unselected / seed / unsupported),
detected conflicts (with per-item resolution), missing assets (dangling
references, e.g. portrait URL unreachable), estimated upload size (from
payload sizes + asset bytes), and require explicit confirmation before ANY
apply. Destructive choices (none in v1) would require typed confirmation.
No raw technical ids in the normal view (productized names + counts;
ids only in a diagnostics expander).

## 8. Rollback / Recovery

- First upload never mutates local data → local IS the rollback.
- A failed/interrupted upload leaves local data valid; retry is idempotent
  (keys from §2).
- Partial uploads are visible in the mapping (`conflictStatus: 'error'`) and
  can resume item-by-item.
- Cloud rollback = archive/tombstone (soft delete per the schema doc), never
  hard delete.
- Event-log rollback (future ingest) = correction/tombstone events only —
  append-only discipline holds even for mistakes.

## 9. Security / Privacy

- **No automatic upload without user action** — claiming an account does not
  upload anything by itself.
- Mock/seed content is never uploaded as user content (must be explicitly
  copied into the user's library first, a future feature).
- Raw provider auth objects/tokens are never stored in the local mapping.
- Private local assets stay local until individually confirmed; visibility
  defaults to `private` on upload.

## 10. P5.10 / P5.11 Link

P5.10 (database first slice): users/user_identities/user_profiles adapter +
health (see readiness checklist). P5.11+ (in order): campaign/actor cloud
repository implementations → migration preview service (dry-run over local
adapters) → local mapping store → claim flow wiring (needs auth work) →
sync policy (cloudNewer/localNewer resolution) → runtime event server-side
ingest. Each step lands behind the P5.8 contracts and the P5.6/P5.7 seams;
UI callers never rewire.
