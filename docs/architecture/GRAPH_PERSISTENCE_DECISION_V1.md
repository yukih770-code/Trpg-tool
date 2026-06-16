# Graph Persistence Decision v1

<!-- AI-LANDMARK: GRAPH_PERSISTENCE_DECISION_V1 -->

Last updated: 2026-06-16
Status: **Accepted** (private-first / B0 horizon)
Task: `A2 Graph Persistence Decision + Storage Boundary v1`
Builds on: `GRAPH_FIRST_ENTITY_GRAPH_DOMAIN_MODEL_V1` (A1), `ENTITY_GRAPH_AND_REPOSITORY_LAYER_V1.md`

This is a documentation baseline. It defines no `src/` behavior and changes no
store schema, runtime logic, rule data, routing, or persistence implementation.
It fixes the **decision and boundaries** so later phases (A3–A11) do not drift.

---

## 1. Core principles (locked)

1. **Domain model is Graph-first.** The platform's object model is defined as a
   graph of typed entities and typed relations, independent of any physical store.
2. **EntityGraph is the platform core domain**, not an auxiliary feature. Every
   cross-object association is an edge in the EntityGraph.
3. **All cross-object relationships live in the EntityGraph.** There is exactly
   one authoritative edge set.
4. **Pages and business components must not privately maintain cross-object
   relations.** No relation arrays on payloads as a source of truth; no hand-written
   relation filtering in components.
5. **The Repository layer isolates the physical store.** UI depends on the
   `EntityGraphRepository` / `PlatformRepositories` interfaces (A1), never on a
   concrete database, mock map, or query dialect.

These principles are **physical-store-independent**. Choosing a database below
does not weaken them; it only decides where the already-defined graph lives.

---

## 2. Option comparison

The workload this product actually has: a **small, low-fan-out, shallow** graph.
A campaign holds dozens of objects (not millions); traversals are 1–3 hops
(work → character → campaign → logs); reverse lookup and relation counts dominate;
deep variable-length traversal and large-scale graph analytics are **not** core.

| Dimension | A: RDB + `entity_relation` | B: Graph DB authoritative | C: RDB primary + Graph read-model | D: Graph DB authoritative + RDB payload/tx |
|---|---|---|---|---|
| Long-term model stability | ↑ logical model decoupled from engine | ～ bound to engine semantics | ↑ | ↓ authority split |
| Future migration cost | ↑ easiest to project into C/B | ↓ | ↑ incremental | ↓ |
| Single-hop / count queries | ↑ | ↑ | ↑ | ↑ |
| Deep / variable-length traversal | ～ recursive CTE (sufficient here) | ↑↑ | ↑↑ | ↑↑ |
| Permission / visibility modeling | ↑ row-level + views | ↓ self-built | ↑ at primary | ↓ cross-store consistency |
| public/internal projection | ↑ | ↓ | ↑ | ↓ |
| BlockDocument payload (A3) | ↑ JSONB | ↓ not suited to large docs | ↑ | ～ |
| Workshop Package payload (A4) | ↑ | ↓ | ↑ | ～ |
| MediaAsset management (A6) | ↑ metadata + object store | ↓ | ↑ | ～ |
| Transactional consistency (atomic publish) | ↑ ACID | ～ | ↑ primary ACID | ↓↓ cross-store tx |
| Local dev complexity | ↑↑ SQLite, zero ops | ↓ run a graph DB | ↓ dual store | ↓↓ |
| Deploy / ops | ↑↑ single store | ↓ | ↓ | ↓↓ |
| Backup / restore | ↑↑ | ～ | ～ dual backups | ↓ |
| Performance / caching (this scale) | ↑ | ↑ (large graphs) | ↑↑ | ↑ |
| Repository encapsulation difficulty | ↑ | ～ | ～ | ↓ |
| Impact on frontend | ↑ minimal | ～ | ～ | ↓ |
| Impact on B0 backend | ↑ minimal | ～ | ～ | ↓ |

Legend: ↑ favorable · ～ neutral · ↓ unfavorable.

---

## 3. Recommendation

**Adopt Option A for the current private-first / B0 phase — implemented as
"Graph-first domain + relational physical storage".**

- Authoritative store: a single relational database (**SQLite** for local dev,
  **PostgreSQL** for any shared/server phase), same schema. Core tables:
  `entity` (nodes), `entity_relation` (edges), plus JSONB payload tables.
- This is **not** a "non-graph design." The graph is fully modeled (A1's
  `EntityNode` / `EntityRelation` / `EntityType` / `RelationType`); the relational
  database is merely the substrate. Reverse lookups and shallow traversals are
  served by indexed edge queries and recursive CTEs.
- **Future upgrade path is Option C**: when (and only when) the triggers in §5
  fire, add a graph database as a **read-model / projection** alongside the
  relational primary. The relational DB stays the source of truth; the graph DB
  is a derived index for traversal/recommendation workloads.

### Why not "put everything in a graph database" (B / D)

- The workload is shallow and small; native deep-traversal strength is unused.
- A graph DB adds a second datastore: extra ops, backup split, local-dev burden,
  and (for D) cross-store transactions for atomic publish — a net liability for a
  private-first tool that must run locally.
- Large JSONB payloads (BlockDocument, Workshop payload, FanWork body) and
  transactional business data (publish, subscription, audit) are a poor fit for a
  graph engine and a natural fit for a relational store.
- Premature physical commitment to an engine is the expensive, hard-to-reverse
  choice. The clean relational model is the more portable long-term substrate.

### Why not "business relations scattered across tables"

- Per-domain relation tables (`fanWorkActorRelations`, `campaignMapRelations`, …)
  recreate exactly the debt A1 removed: scattered authority, hand-written joins,
  no reverse-lookup uniformity, no single graph to project to a graph DB later.
- One `entity_relation` edge set keeps the graph authoritative, queryable
  uniformly, and projectable to Option C without rework.

**What makes "no rewrite later" true is the logical graph-first model + the
Repository boundary — not the engine.** The engine can change behind the
Repository; the model does not.

---

## 4. Storage layering (boundaries)

Five **logical** layers. Physically, B0 may be one Postgres + one object store;
the code and schema are split by layer so each can later move out independently.

| Layer | Owns | Does NOT own |
|---|---|---|
| **Graph Store** | `entity` (node identity/type/owner/visibility/status/version) + `entity_relation` (edges); relation queries; reverse lookup; relation-count basis | bodies, media, business transactions, projection decisions |
| **Payload Store** | `block_document`, `actor_payload`, `campaign_payload`, `workshop_payload`, `fanwork_body` (JSONB/document); loaded lazily by `payloadRef` | relations, permissions |
| **Business Store** | `user_profile`, permission/membership, `publish_status`, subscription/content-list, `version`, `audit_log` | object bodies, edge authority |
| **Media Store** | object storage for thumbnail / preview / original / audio / map; DB holds `media_asset` metadata + `placeholderKind` (PreviewArt) | content semantics, relations |
| **Cache / Index** | `relation_count`, `related_entity_index`, `search_index` | — **derived only, always rebuildable; never a source of truth** |

Rule: the **Graph Store is the only authority for relations**; the Cache/Index
layer may denormalize counts and reverse indexes but is rebuilt from the graph.

---

## 5. Triggers to introduce a Graph DB (Option C)

Adopt Option C (graph DB as read-model) only when one or more hold:

1. **Deep traversal is hot**: 3+ hop variable-length traversals become a
   high-frequency, core read path (not occasional analytics).
2. **Scale**: relation count exceeds the ~millions range where indexed recursive
   CTEs on the relational store stop meeting latency targets.
3. **Graph-native product capability**: recommendation, influence/derivation
   chains, or social graph become a core, real-time product feature.
4. **Performance ceiling**: relational recursive query / indexed edge query can no
   longer satisfy the required latency/throughput after normal tuning.
5. **Analytics depth**: graph analysis needs exceed plain reverse lookup and
   shallow relations (e.g. community detection, centrality, pathfinding at scale).

Until then, Option A is the correct choice. The relational `entity` /
`entity_relation` model is designed so adding the graph DB is an additive
projection, not a migration of authority.

---

## 6. Hard constraints

1. **No business module may bypass `EntityGraphRepository`** for cross-object
   relations (read or write).
2. **No private authoritative relation tables** (`fanWorkActorRelations`,
   `campaignMapRelations`, etc.). The single authority is `entity_relation`.
3. **Pages must not import mock relation data** directly. They depend on the
   Repository abstraction (`platformRepo`).
4. **Payload-internal arrays must not be the source of truth for cross-object
   relations.** (A1 deprecated `FanWork.relationIds` / `relatedWorkshopItemIds`
   to seed-only for exactly this reason.)
5. **Cache fields are allowed**, but the authoritative relation set comes only
   from the EntityGraph; caches are derived and rebuildable.

---

## 7. Impact on A1

- A1's **Repository interface is the correct abstraction** and is unaffected by
  this decision.
- `MockRepository` (current), `LocalRepository`, `ApiRepository`, and a future
  `GraphDbRepository` / `HybridRepository` all implement the **same** interfaces.
- A future graph DB **only replaces or augments a Repository implementation**; no
  page or component changes.
- One bounded A1 follow-up remains independent of this decision: the mock reads
  are synchronous; introducing async at the `ApiRepository` boundary (A11) is a
  localized change at the repository call sites, not a model change. (Tracked for
  A7/A11; not required by A2.)

---

## 8. Impact on later phases

- **A3 BlockDocument**: entity references inside a document (`entityMention` /
  `entityCard` / `*Reference`) carry only `{ entityId, entityType }` and resolve
  through the EntityGraph/Repository — never inlined copies. Document→entity
  associations that are meant to be navigable/reverse-queryable become EntityGraph
  edges, not arrays inside the document body.
- **A4 Workshop Package Manifest**: `includedEntities` and `dependencies`
  ultimately resolve to EntityGraph nodes and edges (`containedIn`, `dependsOn`).
  The manifest is a transport/packaging view over graph nodes, not a second
  relation authority.
- **A5 Visibility + Projection**: projection is enforced by the Repository /
  Service layer (server-side in B0), never by frontend filtering. `entity` rows
  carry `visibility`/`status`; the Repository selects the public vs internal
  projection per viewer.
- **A11 B0 Backend**: schema is designed to this decision — relational `entity` +
  `entity_relation` + JSONB payload tables + business tables; the OpenAPI/DTOs map
  to the same A1 domain types; ApiRepository swaps in behind the unchanged
  interfaces.

---

## Decision summary (one line)

Graph-first domain model with a relational physical store (Option A: SQLite/Postgres,
single `entity` + `entity_relation` + JSONB payloads), Repository-isolated, with a
defined upgrade to Option C (graph DB read-model) gated by explicit triggers.
