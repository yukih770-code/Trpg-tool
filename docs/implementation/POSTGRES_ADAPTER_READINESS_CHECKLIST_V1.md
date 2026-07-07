# Postgres Adapter Readiness Checklist V1 (P5.9)

Status: **planning gate only.** This is the step-by-step implementation gate
for P5.10 (the first real database round). Nothing here is implemented in
P5.9. Companion docs: POSTGRES_SCHEMA_MINIMAL_MODEL_V1,
LOCAL_TO_CLOUD_MIGRATION_PLAYBOOK_V1.

---

## 1. What P5.10 Is Allowed To Implement

- Choose the query layer (per §3) and add THAT dependency (server-side only).
- Server-side env parsing for `DATABASE_URL` (see §5).
- The **first slice only** (§4): users / user_identities / user_profiles
  Postgres adapter implementing `CloudUserRepositoryContract` semantics
  server-side.
- A database health check (feeding `CloudRepositoryHealth` shape).
- One integration smoke path (create user → read back → idempotent identity
  insert), runnable locally.
- Zero UI changes; zero frontend bundle changes.

## 2. What P5.10 Must NOT Implement

Full campaign sync · full actor sync · runtime event persistence/ingest ·
object storage · membership system · auth provider/login · cloud migration
UI · claim flow · frontend wiring of cloud adapters · Room Server changes.

## 3. ORM / Query Layer Decision Matrix (short; decision NOT made here)

| Criterion | node-postgres (pg) | Prisma | Drizzle |
| --- | --- | --- | --- |
| Type safety | Manual (SQL strings + hand types) | Generated client, strong | Strong, TS-first schema |
| Migration workflow | External tool needed (e.g. hand-written SQL + runner) | Built-in (prisma migrate) | Built-in (drizzle-kit) |
| Portability / lock-in | None (raw SQL) | Schema DSL + client runtime | TS schema, thin runtime |
| Runtime overhead | Minimal | Heavier client/engine | Light |
| Schema control | Total (raw DDL) | DSL-mediated | High (SQL-like TS) |
| JSONB handling | Native, manual typing | Supported, typed via Json | Supported, typed |
| Local dev ergonomics | Spartan | High | High |
| Server deployment fit (small Node server) | Excellent | Good (heavier artifacts) | Excellent |

Guidance (non-binding): the project values **schema control, small runtime,
vendor neutrality** (P4/P5 rules) — which weights toward Drizzle or raw pg
with a migration runner; Prisma trades control for ergonomics. Decide at
P5.10 start with the owner; record the decision in the P5.10 report.

## 4. Minimal First Database Slice

users + user_identities + user_profiles + health check + adapter smoke test.

Why not Campaign first: every other table needs `owner_id → users`; identity
claim semantics (§4 of the schema doc) are the highest-risk design and should
be exercised by the smallest possible slice; campaigns additionally drag in
payload envelope questions and migration preview — none of which block once
users exist. User-first also matches the local foundation order
(P5.1 → P5.2/P5.3).

## 5. Environment Boundary

- `DATABASE_URL` — server-only env; parsed in server config; **never** in
  Vite env (`VITE_*`), never in the frontend bundle, never in Netlify
  frontend env.
- `DATABASE_SSL_MODE` — optional later; same server-only rule.
- Frontend continues to know ONLY `VITE_ROOM_SERVER_*` and future API base
  URLs (`CloudRepositoryEnvironment.apiBaseUrl`) — URLs, never credentials.
- Verification rule for every P5.10+ round: grep the built frontend bundle
  for `DATABASE_URL` / connection strings → must be absent.

## 6. Migration Tooling Checklist (future rules)

- [ ] All migrations committed to the repo (no console-applied schema).
- [ ] No destructive migration without a documented backup step.
- [ ] Every JSONB payload column has `schema_version`; adapters upcast on
      read (mirror of the zustand `migrate` discipline).
- [ ] Upcasting strategy documented per table before its first write path.
- [ ] Every migration file carries rollback notes (down migration or
      documented manual recovery).

## 7. Test / Verification Plan (expected of P5.10)

- `npx tsc --noEmit` and `npx tsc -p server/tsconfig.server.json --noEmit`
- `npm run build` and `npm run server:build`
- Migration dry-run against a local dev database
- Database health endpoint returns `ok` locally (and `unavailable` cleanly
  when DB is down — mapped to the P5.8 error shape, no raw driver errors)
- Repository smoke test: create user + identity → read → duplicate identity
  insert returns `conflict`
- Frontend bundle leak check per §5

## 8. Risks

- **Premature ORM choice** — locked by the §3 matrix + explicit owner
  decision at P5.10 start; keep raw-SQL escape hatch regardless of choice.
- **Schema drift** vs the planning doc — P5.10 must diff its DDL against
  POSTGRES_SCHEMA_MINIMAL_MODEL_V1 and record deviations in its report.
- **Local-cloud identity mismatch** — mitigated by the
  `(provider_kind, provider_subject)` unique + claim-flow conflict semantics;
  smoke test covers it.
- **Secrets leakage** — server-only env rule + bundle grep (§5/§7).
- **Vendor lock-in** — contracts (P5.8) + vendor-neutral schema; vendor names
  stay behind the adapter.
- **Runtime event seq correctness** — NOT in P5.10 scope, but the append+bump
  transaction (schema doc §15.5) must not be "simplified" when it lands.

## 9. Go / No-Go Checklist

P5.10 may begin only when ALL are true:
- [ ] POSTGRES_SCHEMA_MINIMAL_MODEL_V1 approved by owner
- [ ] Query layer chosen (recorded decision)
- [ ] Local dev database available (docker or native; documented setup)
- [ ] Env boundary (§5) approved
- [ ] First slice (§4) approved
- [ ] Rollback plan (§6 rules) understood
