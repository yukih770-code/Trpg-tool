/**
 * EntityGraph — Graph-first platform domain model.
 *
 * AI-LANDMARK: GRAPH_FIRST_ENTITY_GRAPH_DOMAIN_MODEL_V1
 *
 * The EntityGraph is the SINGLE authoritative model for every cross-object
 * relationship on the platform (Actor / Campaign / SessionLog / Map /
 * WorkshopPackage / FanWork / BlockDocument / MediaAsset / World / NPC …).
 *
 * Hard rules (enforced by the Repository boundary, see ./repositories.ts):
 *   - Business modules MUST NOT keep private relation arrays.
 *   - Pages/components MUST NOT hand-write relation filtering over mock maps.
 *   - All relation reads/writes go through an EntityGraphRepository.
 *
 * Scope of V1: types + query option shapes only. Persistence is decided later
 * (see docs/architecture audit — relational `entity` + `entity_relation` is the
 * provisional authoritative store; a graph DB may later be added as a read
 * projection). No database, no backend here.
 *
 * Node = identity + metadata + a payloadRef. Heavy content (BlockDocument /
 * ActorPayload / WorkshopPayload / FanWork body / media blob) is NOT stored on
 * the node; it is referenced by `payloadRef` and loaded on demand (A3/A6).
 */

export type EntityId = string;
export type RelationId = string;

/** Canonical entity kinds. The first 10 are V1-locked; `handout` is an extension. */
export type EntityType =
  | 'actor'
  | 'campaign'
  | 'sessionLog'
  | 'map'
  | 'workshopPackage'
  | 'fanWork'
  | 'blockDocument'
  | 'mediaAsset'
  | 'world'
  | 'npc'
  | 'handout';

/** Canonical relation kinds (edges). */
export type RelationType =
  | 'features'
  | 'belongsTo'
  | 'recaps'
  | 'mentions'
  | 'uses'
  | 'adaptedFrom'
  | 'inspiredBy'
  | 'relatedTo'
  | 'authoredBy'
  | 'containedIn'
  | 'dependsOn'
  | 'publishedFrom'
  | 'clonedFrom';

export type EntityStatus =
  | 'draft'
  | 'published'
  | 'archived'
  | 'hidden'
  | 'underReview'
  | 'deleted';

/** Stored on the entity (write-side). Canonical source of this enum. */
export type EntityVisibility =
  | 'private'
  | 'campaignOnly'
  | 'unlisted'
  | 'public';

/** Read-side projection selector (NOT stored — derived per viewer + visibility). */
export type EntityProjection =
  | 'public'
  | 'unlisted'
  | 'owner'
  | 'gm'
  | 'player';

/** Reference to the heavy payload that lives outside the graph node. */
export type PayloadRefKind =
  | 'none'
  | 'blockDocument'
  | 'actorPayload'
  | 'campaignPayload'
  | 'workshopPayload'
  | 'fanWorkBody'
  | 'mediaBlob';

export type PayloadRef = {
  kind: PayloadRefKind;
  /** Opaque reference into the payload store (A3/A6). Undefined while unbound. */
  ref?: string;
};

/**
 * A graph node — identity + light metadata only.
 * NEVER inline large bodies, galleries, or full payloads here.
 */
export type EntityNode = {
  id: EntityId;
  type: EntityType;
  title: string;
  subtitle?: string;
  summary: string;
  visibility: EntityVisibility;
  status: EntityStatus;
  schemaVersion: number;
  ownerId?: string;
  tags: string[];
  /** Identity-only cover/preview hint (e.g. PreviewArt kind). Not the media. */
  previewKind?: string;
  /** Reference to heavy payload; not loaded with the node. */
  payloadRef: PayloadRef;
  /** Display-only share metadata (NOT a real accessible URL). */
  shareCode?: string;
  publicPathLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

/** A directed edge. Carries no inlined titles/covers/bodies. */
export type EntityRelation = {
  id: RelationId;
  sourceId: EntityId;
  sourceType: EntityType;
  targetId: EntityId;
  targetType: EntityType;
  relationType: RelationType;
  label: string;
  createdAtLabel?: string;
  metadata?: Record<string, string>;
};

/** List/summary DTO projection of a node. */
export type EntitySummary = {
  id: EntityId;
  type: EntityType;
  title: string;
  subtitle?: string;
  summary: string;
  visibility: EntityVisibility;
  status: EntityStatus;
  tags: string[];
  previewKind?: string;
  shareCode?: string;
  publicPathLabel?: string;
};

/** Lightweight pointer used to lazily fetch a node's payload. */
export type EntityDetailRef = {
  id: EntityId;
  type: EntityType;
  payloadRef: PayloadRef;
};

/** Seed shape (mock / local). The single normalized source of the graph. */
export type EntityGraphSeed = {
  nodes: EntityNode[];
  relations: EntityRelation[];
};

export type RelationDirection = 'outgoing' | 'incoming' | 'both';

export type RelationQueryOptions = {
  direction?: RelationDirection;
  relationType?: RelationType;
  /** Restrict to relations whose OTHER endpoint has one of these types. */
  neighborTypes?: EntityType[];
};

export type RelatedEntitiesOptions = {
  direction?: RelationDirection;
  relationType?: RelationType;
  /** Include only neighbors of these types. */
  types?: EntityType[];
  /** Exclude neighbors of these types. */
  excludeTypes?: EntityType[];
};

export type NeighborQueryOptions = RelatedEntitiesOptions;

/** A neighbor node together with the edge and direction it was reached by. */
export type RelatedEntity = {
  entity: EntityNode;
  relation: EntityRelation;
  direction: 'outgoing' | 'incoming';
};

export type DependencyTreeNode = {
  entity: EntityNode;
  dependencies: DependencyTreeNode[];
};

export type CreateRelationInput = {
  sourceId: EntityId;
  sourceType: EntityType;
  targetId: EntityId;
  targetType: EntityType;
  relationType: RelationType;
  label?: string;
  metadata?: Record<string, string>;
};

// ─── Derived constants / helpers (no business logic) ─────────────────────────

/** "Object" entities that show up as related objects on a work detail page. */
export const LINKABLE_OBJECT_TYPES: EntityType[] = [
  'actor', 'campaign', 'sessionLog', 'map', 'world', 'npc', 'handout',
];

/** Default payload kind per entity type (provisional, A3/A6 may refine). */
export const DEFAULT_PAYLOAD_KIND: Record<EntityType, PayloadRefKind> = {
  actor: 'actorPayload',
  campaign: 'campaignPayload',
  sessionLog: 'blockDocument',
  map: 'mediaBlob',
  workshopPackage: 'workshopPayload',
  fanWork: 'fanWorkBody',
  blockDocument: 'blockDocument',
  mediaAsset: 'mediaBlob',
  world: 'blockDocument',
  npc: 'blockDocument',
  handout: 'blockDocument',
};

/**
 * Map a canonical EntityType to an existing `fanPlaza.entityType.*` i18n leaf.
 * i18n locale files are outside this layer's edit scope, so new canonical types
 * (workshopPackage / mediaAsset / blockDocument) reuse the closest legacy leaf
 * to avoid missing-key fallbacks in the UI.
 */
export const ENTITY_TYPE_I18N_KEY: Record<EntityType, string> = {
  actor: 'actor',
  campaign: 'campaign',
  sessionLog: 'sessionLog',
  map: 'map',
  workshopPackage: 'workshopItem',
  fanWork: 'fanWork',
  blockDocument: 'handout',
  mediaAsset: 'music',
  world: 'world',
  npc: 'npc',
  handout: 'handout',
};

export function toEntitySummary(node: EntityNode): EntitySummary {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    subtitle: node.subtitle,
    summary: node.summary,
    visibility: node.visibility,
    status: node.status,
    tags: node.tags,
    previewKind: node.previewKind,
    shareCode: node.shareCode,
    publicPathLabel: node.publicPathLabel,
  };
}
