/**
 * Platform Repository interfaces — the data-access boundary.
 *
 * AI-LANDMARK: PLATFORM_REPOSITORY_INTERFACES_V1
 *
 * Pages/components depend ONLY on these interfaces, never on concrete mock
 * data. Implementations are swappable:
 *
 *   MockRepository   — reads the in-memory EntityGraph seed (current).
 *   LocalRepository  — localStorage / IndexedDB (private-first persistence).
 *   ApiRepository    — B0 backend over OpenAPI (future).
 *   GraphDbRepository— graph DB read-model projection (only if traversal
 *                      workloads ever justify it; see persistence audit).
 *   HybridRepository — composes Api/Local for payload+business, GraphDb for
 *                      graph reads, behind this same interface.
 *
 * V1 NOTE (sync): the mock/local phase exposes synchronous reads to keep the
 * current synchronous render path unchanged. Introducing an async ApiRepository
 * (A11) is a bounded change at the (few) repository call sites — not a rewrite.
 * The architectural win here is the single authoritative graph + the boundary,
 * independent of sync/async.
 */
import type {
  CreateRelationInput,
  DependencyTreeNode,
  EntityDetailRef,
  EntityId,
  EntityNode,
  EntityProjection,
  EntityRelation,
  EntitySummary,
  EntityType,
  RelatedEntitiesOptions,
  RelatedEntity,
  RelationId,
  RelationQueryOptions,
} from './entityGraph';
import type { WorkshopBrowseItem } from '../platform/workshopTypes';
import type { FanWork } from '../platform/communityTypes';
import type {
  BlockDocument,
  BlockDocumentDetail,
  BlockDocumentSummary,
  BlockDocumentValidationResult,
} from './blockDocument';

/** Viewer context used to resolve a projection (auth/permissions land later). */
export type ViewerContext = {
  userId?: string;
  role?: 'owner' | 'gm' | 'player' | 'guest';
};

// ─── Graph ───────────────────────────────────────────────────────────────────

export interface EntityGraphRepository {
  getEntity(id: EntityId): EntityNode | undefined;
  getEntities(ids: EntityId[]): EntityNode[];

  getRelations(entityId: EntityId, options?: RelationQueryOptions): EntityRelation[];
  getOutgoing(entityId: EntityId, relationType?: EntityRelation['relationType']): EntityRelation[];
  getIncoming(entityId: EntityId, relationType?: EntityRelation['relationType']): EntityRelation[];

  getNeighbors(entityId: EntityId, options?: RelatedEntitiesOptions): EntityNode[];
  getRelatedEntities(entityId: EntityId, options?: RelatedEntitiesOptions): RelatedEntity[];

  /** Convenience reads (query BOTH directions, filtered by neighbor type). */
  getRelatedFanWorks(entityId: EntityId): EntityNode[];
  getRelatedWorkshopPackages(entityId: EntityId): EntityNode[];

  getDependencyTree(entityId: EntityId): DependencyTreeNode;

  createRelation(input: CreateRelationInput): EntityRelation;
  removeRelation(relationId: RelationId): void;
}

// ─── Entities ──────────────────────────────────────────────────────────────

export interface EntityRepository {
  getSummary(id: EntityId, projection?: EntityProjection): EntitySummary | undefined;
  getDetail(id: EntityId, projection?: EntityProjection): EntityNode | undefined;
  getDetailRef(id: EntityId): EntityDetailRef | undefined;
  list(filter?: { type?: EntityType }): EntitySummary[];
}

// ─── BlockDocument (protocol defined in ./blockDocument — A3) ──────────────────

export interface BlockDocumentRepository {
  getDocumentSummary(id: string): BlockDocumentSummary | undefined;
  getDocumentDetail(id: string): BlockDocumentDetail | undefined;
  /** Documents that reference an entity (derived; authority is the EntityGraph). */
  getDocumentsByEntity(entityId: EntityId): BlockDocumentSummary[];
  getDocumentsByOwner(ownerId: string): BlockDocumentSummary[];
  /** Full payload (blocks). In mock this equals the detail. */
  getDocumentPayload(id: string): BlockDocument | undefined;
  validateDocument(document: BlockDocument): BlockDocumentValidationResult;
}

// ─── WorkshopPackage (uses existing browse-item metadata shape for now) ───────

export interface WorkshopPackageRepository {
  list(): WorkshopBrowseItem[];
  getById(id: EntityId): WorkshopBrowseItem | undefined;
}

// ─── FanWork (uses existing community FanWork shape for now) ──────────────────

export interface FanWorkRepository {
  list(): FanWork[];
  getById(id: EntityId): FanWork | undefined;
}

// ─── MediaAsset (contract reserved — media model is A6) ───────────────────────

export type MediaAssetMetadata = {
  id: string;
  kind: string;
  altLabel?: string;
  placeholderKind?: string;
};

export interface MediaAssetRepository {
  /** Reserved: returns undefined until the MediaAsset model lands (A6). */
  getMetadata(id: EntityId): MediaAssetMetadata | undefined;
}

// ─── Permission / Projection ──────────────────────────────────────────────────

export interface PermissionProjectionRepository {
  /** Resolve which projection a viewer may read for an entity. */
  resolveProjection(viewer: ViewerContext, entityId: EntityId): EntityProjection;
}

// ─── Aggregate composition root ───────────────────────────────────────────────

export interface PlatformRepositories {
  entityGraph: EntityGraphRepository;
  entities: EntityRepository;
  blockDocuments: BlockDocumentRepository;
  workshopPackages: WorkshopPackageRepository;
  fanWorks: FanWorkRepository;
  mediaAssets: MediaAssetRepository;
  permissions: PermissionProjectionRepository;
}
