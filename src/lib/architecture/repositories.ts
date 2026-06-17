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
import type { WorkshopBrowseItem, WorkshopSubscriptionItem } from '../platform/workshopTypes';
import type { FanWork } from '../platform/communityTypes';
import type {
  BlockDocument,
  BlockDocumentDetail,
  BlockDocumentSummary,
  BlockDocumentValidationResult,
} from './blockDocument';
import type {
  WorkshopPackageDetail,
  WorkshopPackageManifest,
  WorkshopPackageManifestValidationResult,
  WorkshopPackageSummary,
} from './workshopPackage';
import type {
  ProjectedEntityDetail,
  ProjectedEntitySummary,
  ProjectionDecision,
} from './projection';
import type {
  MediaAsset,
  MediaAssetDetail,
  MediaAssetSummary,
  MediaAssetValidationResult,
  MediaAssetVariant,
  ResolvedMediaVariant,
} from './mediaAsset';

/** Viewer + projection types live in ./projection (single source); re-exported here. */
import type { ViewerContext, ViewerRole } from './projection';
export type { ViewerContext, ViewerRole };

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
  listDocuments(): BlockDocumentSummary[];
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
  /**
   * Legacy browse-item access (consumed by current Workshop UI). Future: derived
   * from `WorkshopPackageSummary` — see WORKSHOP_PACKAGE_MANIFEST_V1.md §11.
   */
  list(): WorkshopBrowseItem[];
  getById(id: EntityId): WorkshopBrowseItem | undefined;
  /** Legacy subscription samples (current "My Subscriptions" UI). */
  listSubscriptions(): WorkshopSubscriptionItem[];

  // ── Manifest protocol (A4) ──
  getPackageSummary(id: string): WorkshopPackageSummary | undefined;
  getPackageDetail(id: string): WorkshopPackageDetail | undefined;
  listPackages(options?: { systemId?: string }): WorkshopPackageSummary[];
  /** Packages that include / reference an entity (derived; authority = EntityGraph). */
  getPackagesByEntity(entityId: EntityId): WorkshopPackageSummary[];
  getPackagesByDocument(documentId: string): WorkshopPackageSummary[];
  getPackageManifest(id: string): WorkshopPackageManifest | undefined;
  validateManifest(manifest: WorkshopPackageManifest): WorkshopPackageManifestValidationResult;
}

// ─── FanWork (uses existing community FanWork shape for now) ──────────────────

export interface FanWorkRepository {
  list(): FanWork[];
  getById(id: EntityId): FanWork | undefined;
}

// ─── MediaAsset (model defined in ./mediaAsset — A6) ──────────────────────────

export interface MediaAssetRepository {
  getMediaSummary(id: string, viewer?: ViewerContext): MediaAssetSummary | undefined;
  getMediaDetail(id: string, viewer?: ViewerContext): MediaAssetDetail | undefined;
  /** Resolve one variant under projection (thumbnail/preview/original/...). */
  getMediaVariant(id: string, variant: MediaAssetVariant, viewer?: ViewerContext): ResolvedMediaVariant;
  /** Media used by an entity / document / package (projection-filtered). */
  getMediaByEntity(entityId: EntityId, viewer?: ViewerContext): MediaAssetSummary[];
  getMediaByDocument(documentId: string, viewer?: ViewerContext): MediaAssetSummary[];
  getMediaByPackage(packageId: string, viewer?: ViewerContext): MediaAssetSummary[];
  validateMediaAsset(asset: MediaAsset): MediaAssetValidationResult;
}

// ─── Permission / Projection ──────────────────────────────────────────────────

export interface PermissionProjectionRepository {
  /** Resolve the projection decision (which view, or denied) for a viewer. */
  resolveProjection(entityId: EntityId, viewer: ViewerContext): ProjectionDecision;
  canViewEntity(entityId: EntityId, viewer: ViewerContext): boolean;
  canEditEntity(entityId: EntityId, viewer: ViewerContext): boolean;
  canCloneEntity(entityId: EntityId, viewer: ViewerContext): boolean;
  canReferenceEntity(entityId: EntityId, viewer: ViewerContext): boolean;
  /** Repository/Service-enforced projected DTOs — never filter in components. */
  projectEntitySummary(entityId: EntityId, viewer: ViewerContext): ProjectedEntitySummary;
  projectEntityDetail(entityId: EntityId, viewer: ViewerContext): ProjectedEntityDetail;
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
