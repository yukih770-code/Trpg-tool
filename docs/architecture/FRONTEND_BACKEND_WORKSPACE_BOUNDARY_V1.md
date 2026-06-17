# Frontend / Backend Workspace Boundary + Local Server Architecture v1

<!-- AI-LANDMARK: FRONTEND_BACKEND_WORKSPACE_BOUNDARY_V1 -->

Last updated: 2026-06-17
Task: `A8.5 Frontend / Backend Workspace Boundary + Local Server Architecture v1`
Builds on: A1–A8 (esp. A2 persistence, A6 media, A7 repository boundary, A8 envelope).

Documentation baseline only. No code moved, no business logic changed, no server,
no Docker, no DB. This fixes the **boundary decision + migration plan** so A9–A11
do not drift, and so the project is not pushed onto the cloud prematurely.

## Stance

```
Private-first · Architecture-first · Local-server-ready
```

Target runtime: at an offline session, the **GM's laptop is the private server**.
Web + API + local PostgreSQL + local media all run on that laptop; friends join the
same Wi-Fi and reach it over a LAN address. Public deployment, cloud, OSS/CDN,
ICP filing, public accounts — all deferred.

---

## 1. Current judgement

- Today the repo is a single Vite + React + TS app (`src/`), with a clean internal
  layering already in place: `src/lib/architecture` (domain), `src/lib/data-contract`
  (contracts), repository interfaces + Mock impl + composition root + service
  (`repositories.ts` / `mockRepositories.ts` / `repositoryComposition.ts` /
  `repositoryServices.ts`).
- That internal layering is **already the monorepo boundary in embryo** — the
  hard part (decoupling pages from data via repositories, A7) is done.
- There is no server yet and nothing in A9/A10 needs one. The first real need for a
  server is **A11 B0 Local Backend**.

Conclusion: the boundary is logically sound; the only open question is *when* to
physically split into a monorepo. The natural cut is **when server code first
appears = A11**, not before.

## 2. Migrate the directory now?

**No.** Do not convert to a monorepo this round, and not before A9/A10. A premature
move would churn `tsconfig` / `vite` / path aliases and risk regressions for zero
current benefit (no server exists). Migrate **just before A11**, when the first
server package is introduced and the shared packages start being imported by two
apps. A9/A10 proceed on the current structure.

## 3. Recommended final structure (target — at A11)

```
trpg-platform/
  apps/
    web/                # current Vite app (pages, components, rule engines, i18n)
    server/             # B0 local API server (added at A11)
  packages/
    domain/             # ← src/lib/architecture (entityGraph, blockDocument,
                        #    workshopPackage, mediaAsset, projection) — pure
    contracts/          # ← src/lib/data-contract (envelopes) + repository INTERFACES
    repositories/       # Mock / Local / Api repository IMPLEMENTATIONS + composition + services
    shared/             # small cross-cutting utils (ids, result types, etc.)
  data/                 # gitignored runtime data (not source)
    postgres/
    media/
    backups/
  docker-compose.yml    # postgres (+ optional server) for local-server mode
  docs/
```

Variant A (keep `src/` + add `server/` + `data/`) is acceptable as an *interim*,
but Variant B (above) is the recommended **final** target because it makes
front/back shared types first-class and Docker Compose deployment clean.

### A vs B comparison

| Dimension | A: evolve current `src/` + `server/` | B: monorepo (apps/packages) |
|---|---|---|
| Migration cost | low (now) | medium (one focused move at A11) |
| tsconfig / vite / path alias impact | small | one-time setup (project refs + aliases) |
| Front/back shared types | awkward (server reaches into web `src/`) | first-class (`packages/*` imported by both) |
| Docker Compose deploy | messy (one big app) | clean (`apps/server` + `data/`) |
| Local dev convenience | high now | high after setup |
| Long-term maintainability | degrades as server grows | high |
| Impact on current code | none | bounded, at A11 |
| Impact on A9/A10/A11 | fine for A9/A10; strains at A11 | ideal for A11 |

## 4. Front / back / shared package boundaries

| Today | → Target package | Who imports |
|---|---|---|
| `src/lib/architecture/*` (domain model + pure helpers) | `packages/domain` | web, server, repositories |
| `src/lib/data-contract/*` (export/platform envelopes) | `packages/contracts` | web, server, repositories |
| `repositories.ts` (interfaces) | `packages/contracts` (access contract) | web, server, repositories |
| `mockRepositories.ts` + seeds | `packages/repositories` (Mock impl) | web (dev), server (tests/seed) |
| `repositoryComposition.ts` / `repositoryServices.ts` | `packages/repositories` | web, server |
| Local/Api repository impls (future) | `packages/repositories` | web, server |
| pages / components / i18n | `apps/web` | web only |
| DND / COC / CP rule engines | `apps/web` (stay client-side; local-first) | web only |

Import rules (enforced by project references / lint at A11):

- **server MAY import** `packages/{domain,contracts,repositories,shared}`.
- **web MAY import** the same packages.
- **web MUST NOT import `apps/server`**; **server MUST NOT import `apps/web`**.
- `MockRepository` is **shared** (`packages/repositories`), not web-only — the
  server uses it for tests/seeding before the real Local/Api repo lands.

Specific answers:
- `src/lib/architecture` → `packages/domain`: **yes**.
- `src/lib/data-contract` → `packages/contracts`: **yes**.
- Repository interfaces → `packages/contracts`; implementations → `packages/repositories`: **yes** (split interface vs impl on the move).
- `MockRepository` → shared `packages/repositories`: **yes** (not web-only).
- `server` may import `domain`/`contracts`: **yes**. `web` may not import `server`: **yes**.

## 5. Local server runtime form

npm scripts (target, at A11):

```
npm run dev:web      # vite dev server (apps/web)
npm run dev:server   # node/tsx watch (apps/server)
npm run local        # concurrently: db up + server + web, bound to 0.0.0.0 (LAN)
```

Experience target:

```
Local:   Web http://localhost:5173      API http://localhost:3000
LAN:     Web http://192.168.x.x:5173    API http://192.168.x.x:3000
Status:  Database: connected · Media: mounted · Backup: enabled
```

LAN access = Vite `server.host: true` (0.0.0.0) + API binding `0.0.0.0`, with a
startup status check (db reachable, media dir mounted, backup dir writable). No
auth required on a trusted home LAN for B0; a simple shared-session/role
(`gm` / `player`) feeds the A5 `ViewerContext`.

## 6. Database choice

Per A2 (Graph-first domain + relational physical storage):

- **A11 B0 uses PostgreSQL** (via `docker-compose.yml`) as the authoritative store
  — same schema as any future shared/cloud phase, so no rewrite later.
- **SQLite is an optional zero-Docker bridge** only when a GM laptop cannot run
  Docker; same logical schema (`entity` + `entity_relation` + JSONB payloads). It
  is a fallback, not the authoritative path.
- No graph DB (A2 triggers not met).

Recommendation: default A11 to Postgres-in-Docker; document the SQLite fallback.

## 7. Media / backup directory design

```
data/                       # gitignored; runtime data, NOT source
  postgres/                 # PG data dir (must, A11)
  media/
    avatars/                # must
    maps/                   # must
    handouts/               # optional (can defer)
    fanworks/               # must
    packages/               # must (exported package files)
    temp/                   # must (upload/import staging)
  backups/                  # must (platformBackup envelopes)
```

Must at A11: `postgres/`, `media/{avatars,maps,fanworks,packages,temp}`, `backups/`.
Can defer: `media/handouts/` and any per-system media subfolders. `data/` is
gitignored (planned `.gitignore` entry, added at A11 — not this round).

MediaAsset storage refs (A6) point into `data/media/...`; the DB stores only
metadata + variant refs, never binaries.

## 8. npm scripts / docker-compose (future plan)

- `docker-compose.yml` (at A11): a `postgres` service mounting `./data/postgres`;
  optionally a `server` service mounting `./data/media` + `./data/backups`.
- Scripts: `dev:web`, `dev:server`, `local`, `db:up`, `db:down`, `backup`,
  `restore`. None added this round.

## 9. Relation to A8 Export / Import Envelope v2

- **Personal backup**: `kind: 'platformBackup'` envelope written to `data/backups/`
  (scope `ownerBackup` → owner projection, full data).
- **Friend sharing**: `kind: 'workshopPackage'` / `'fanWork'` envelope file passed
  over LAN/USB (scope `friendShare`/`publicPackage` → projection-limited;
  `visibilityRisk` warnings guard private leaks).
- **localStorage/mock → local Postgres migration**: export a `platformBackup`
  envelope from the current web app, `dryRunImport` it, then apply on the server —
  this is exactly the A8 import path.
- **B0 import pre-check**: the server runs `dryRunImport` before writing, isolating
  corrupt objects and reporting per-object outcomes.

## 10. Relation to A11 B0 Backend (local, not cloud)

A11 **does**: local API server · local PostgreSQL · local media folder · basic
backup/export · LAN access · switch the composition root from Mock to
`ApiRepository` (the A7 seam) and turn `PlatformDataService` async.

A11 **does NOT**: public deployment · cloud servers · ICP filing · OSS/CDN ·
payment/VIP · public account system · multi-tenancy · heavy moderation.

## 11. Migration plan

1. **Now (A8.5)**: this document only. No moves.
2. **A9 / A10**: stay on current `src/` structure. Live Object Document + draft
   flows consume `platformDataService` (A7). No server.
3. **Pre-A11 (the move)**: introduce the monorepo (Variant B) in one focused pass:
   `src/lib/architecture → packages/domain`, `src/lib/data-contract +
   repository interfaces → packages/contracts`, `Mock/composition/services →
   packages/repositories`, current app → `apps/web`. Set up TS project references +
   path aliases. No behavior change.
4. **A11**: add `apps/server` (B0), `docker-compose.yml`, `data/` dirs, npm scripts;
   flip the composition root to `ApiRepository`; enforce import rules.
5. **Later**: only if/when going public — cloud, accounts, CDN, etc.

### Now do / don't

- **Do**: keep building on the current structure; keep the A7 repository boundary
  clean (it is what makes the move cheap).
- **Don't**: convert to monorepo now; write server code; add Docker/DB; move files.
```
