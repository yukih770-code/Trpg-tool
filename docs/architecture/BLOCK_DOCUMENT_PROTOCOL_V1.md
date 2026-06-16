# BlockDocument Protocol v1

<!-- AI-LANDMARK: BLOCK_DOCUMENT_PROTOCOL_V1 -->

Last updated: 2026-06-16
Task: `A3 BlockDocument Protocol v1`
Builds on: A1 (`GRAPH_FIRST_ENTITY_GRAPH_DOMAIN_MODEL_V1`), A2 (`GRAPH_PERSISTENCE_DECISION_V1`)

Types + pure helpers + mock seed only. No editor, no UI wiring, no backend, no
upload, no publish. The three rule engines (DND/COC/CP RED) are untouched.

## Purpose

One structured content protocol reused by scenario chapters, rule summaries, NPC
profiles, map notes, session logs, character stories, fan works, Workshop drafts,
system reference pages, and AI drafts.

## Layout

```
src/lib/architecture/
  blockDocument.ts        protocol: BlockDocument, ContentBlock union, helpers
  blockDocumentSeed.ts    3 example documents for A9
  repositories.ts         BlockDocumentRepository (extended, not duplicated)
  mockRepositories.ts     MockBlockDocumentRepository over the seed
```

## Model

- `BlockDocument` = `{ id, schemaVersion, title, summary, ownerId?, visibility,
  status, blocks, relatedEntityIds?, payloadRef?, createdAt, updatedAt }`.
  `status`/`visibility` reuse the canonical `EntityStatus`/`EntityVisibility`
  (single source — no second enum).
- Content truth is `blocks: ContentBlock[]` — a discriminated union. **Never an
  HTML string.** Text/callout blocks carry `RichText { text, marks? }` with a
  constrained mark set (`bold | italic | code | link`), not arbitrary HTML.
- `relatedEntityIds` is a **derived cache only**, never the relation authority.

## V1 blocks (must render)

`text` · `heading` (level 1–3) · `callout` (info/note/warning/tip) ·
`image` (references a MediaAsset by id) · `imageGallery` (MediaAsset ids) ·
`entityMention` (inline object ref) · `entityCard` (block object card).

## Contract-only blocks (typed now, full render deferred)

`audio` · `externalLink` · `diceFormula` · `statBlock` · `mapPreview` ·
`workshopReference` · `fanWorkReference` · `ruleReference` · `table`.

Unknown/unimplemented blocks normalize to an `unknown` block and render as a
placeholder card — they never crash the page (`validateBlockDocument` flags them).

## Entity reference rule

Every reference-bearing block stores ONLY `{ entityId, entityType }`
(`EntityRef`). No inlined title/cover/summary/payload. Render resolves the ref
through `EntityRepository` / `EntityGraphRepository`.

## Relation to the EntityGraph (§7)

- A `BlockDocument` is itself an entity (`EntityType: 'blockDocument'`). Its
  reference blocks are **edges from the document node to the referenced entity**.
- The bridge `projectDocumentRelations(doc)` returns `CreateRelationInput[]`
  (document → referenced entity) that a future write path (A9) feeds to
  `EntityGraphRepository.createRelation`. The EntityGraph stays the authority; the
  document's ref blocks are the editing surface, the graph edges are the truth.
- **Reverse lookup** ("which documents reference this entity") is served by the
  EntityGraph in production; the mock `getDocumentsByEntity` derives it from block
  refs for now.
- Block → RelationType mapping (uses existing A1 RelationTypes — **no new
  `references` member is added this round**; it can be added later if a distinct
  semantic is needed):

  | block | RelationType |
  |---|---|
  | entityMention | `mentions` |
  | entityCard | `mentions` |
  | mapPreview | `uses` |
  | statBlock | `uses` |
  | workshopReference | `relatedTo` |
  | fanWorkReference | `relatedTo` |

  Document containment (e.g. a session-log document belonging to a campaign) is
  expressed with the existing `containedIn` / `belongsTo` edges, created
  explicitly — not inferred from a block.

## BlockDocumentRepository

Extended (not duplicated) from A1:

```
getDocumentSummary(id)      getDocumentDetail(id)
getDocumentsByEntity(id)    getDocumentsByOwner(ownerId)
getDocumentPayload(id)      validateDocument(document)
```

Mock implementation reads `BLOCK_DOCUMENT_SEED`. No Local/Api repository yet.

## Loading layers (A5/A6 alignment)

- **Summary**: title, summary, `blockTypeSummary`, cover hint (first image /
  entity card), owner, updatedAt. No block bodies, no media.
- **Detail**: full `blocks` structure, but media and referenced entities are
  resolved lazily by the caller (per-block, on demand).
- **Payload**: large text, media originals, external resources, future
  attachments — fetched on demand only.

## Relation to FanWork (§9 — future migration, not done now)

```
FanWork.contentBlocks: Kind[]   →  derived display tags
FanWork.bodyDocumentId (reserved) →  points to a BlockDocument (the real body)
```

`bodyDocumentId?` is reserved on the `FanWork` type this round; no UI change, no
data migration. When A9/A10 land, the FanWork body becomes a BlockDocument and
`contentBlocks` is derived from it.

## Relation to WorkshopPackage (§10 — A4)

A `WorkshopPackage` may include BlockDocuments. Scenario chapters / NPC profiles /
map notes / rule summaries should be **Entity + BlockDocument payload**, not
copied prose. The future Manifest references `documentId` / `entityId` only — it
**does not copy block bodies as a second source of truth**.

## Hard rules (restated)

1. No HTML string as content truth.
2. No cross-object relation hidden inside block arrays as authority.
3. Blocks reference entities by id+type only; relations live in the EntityGraph.
4. BlockDocument owns content structure only — not Workshop packaging, FanWork
   publish, projection enforcement, or persistence.
