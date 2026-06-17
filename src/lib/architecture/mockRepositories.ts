/**
 * Mock repository implementations + composition root.
 *
 * AI-LANDMARK: MOCK_PLATFORM_REPOSITORIES_V1
 *
 * Backs the Repository interfaces with the in-memory EntityGraph seed and the
 * existing FanWork / WorkshopPackage mock payloads. This is the ONLY place that
 * binds concrete mock data to the repository boundary. UI imports `platformRepo`
 * (the abstraction), never the raw mock maps.
 *
 * Swap target: replace this module's bindings with LocalRepository /
 * ApiRepository implementations without touching any page (see repositories.ts).
 */
import {
  toEntitySummary,
  type CreateRelationInput,
  type DependencyTreeNode,
  type EntityDetailRef,
  type EntityId,
  type EntityNode,
  type EntityProjection,
  type EntityRelation,
  type EntitySummary,
  type EntityType,
  type RelatedEntitiesOptions,
  type RelatedEntity,
  type RelationDirection,
  type RelationId,
  type RelationQueryOptions,
  type RelationType,
} from './entityGraph';
import { ENTITY_GRAPH_SEED } from './entityGraphSeed';
import type {
  BlockDocumentRepository,
  EntityGraphRepository,
  EntityRepository,
  FanWorkRepository,
  MediaAssetRepository,
  PermissionProjectionRepository,
  PlatformRepositories,
  ViewerContext,
  WorkshopPackageRepository,
} from './repositories';
import {
  documentEntityRefs,
  toBlockDocumentSummary,
  validateBlockDocument,
  type BlockDocument,
  type BlockDocumentDetail,
  type BlockDocumentSummary,
  type BlockDocumentValidationResult,
} from './blockDocument';
import { BLOCK_DOCUMENT_SEED, getBlockDocumentSeedById } from './blockDocumentSeed';
import {
  toWorkshopPackageSummary,
  validateWorkshopPackageManifest,
  type WorkshopPackageDetail,
  type WorkshopPackageManifest,
  type WorkshopPackageManifestValidationResult,
  type WorkshopPackageSummary,
} from './workshopPackage';
import { WORKSHOP_PACKAGE_SEED, getWorkshopPackageSeedById } from './workshopPackageSeed';
import {
  decideProjection,
  projectNodeDetail,
  projectNodeSummary,
  type ProjectedEntityDetail,
  type ProjectedEntitySummary,
  type ProjectionDecision,
} from './projection';
import {
  getMediaAssetSeedById,
  getMediaUsageBy,
  resolveMediaVariant,
  toMediaAssetDetail,
  toMediaAssetSummary,
  validateMediaAsset,
  type MediaAsset,
  type MediaAssetDetail,
  type MediaAssetSummary,
  type MediaAssetValidationResult,
  type MediaAssetVariant,
  type ResolvedMediaVariant,
} from './mediaAsset';
import { FAN_WORKS } from '../platform/communityMockData';
import type { FanWork } from '../platform/communityTypes';
import { WORKSHOP_BROWSE_SAMPLES, WORKSHOP_SUBSCRIPTION_SAMPLES } from '../platform/workshopTypes';
import type { WorkshopBrowseItem, WorkshopSubscriptionItem } from '../platform/workshopTypes';

// ─── EntityGraphRepository ─────────────────────────────────────────────────

class MockEntityGraphRepository implements EntityGraphRepository {
  private nodes = new Map<EntityId, EntityNode>(
    ENTITY_GRAPH_SEED.nodes.map((n): [EntityId, EntityNode] => [n.id, n]),
  );
  private relations: EntityRelation[] = [...ENTITY_GRAPH_SEED.relations];
  private nextSyntheticId = 0;

  getEntity(id: EntityId): EntityNode | undefined {
    return this.nodes.get(id);
  }

  getEntities(ids: EntityId[]): EntityNode[] {
    return ids.map((id) => this.nodes.get(id)).filter((n): n is EntityNode => Boolean(n));
  }

  private edgeMatches(rel: EntityRelation, id: EntityId, direction: RelationDirection): boolean {
    if (direction === 'outgoing') return rel.sourceId === id;
    if (direction === 'incoming') return rel.targetId === id;
    return rel.sourceId === id || rel.targetId === id;
  }

  private otherEndpoint(rel: EntityRelation, id: EntityId): { id: EntityId; type: EntityType; direction: 'outgoing' | 'incoming' } {
    return rel.sourceId === id
      ? { id: rel.targetId, type: rel.targetType, direction: 'outgoing' }
      : { id: rel.sourceId, type: rel.sourceType, direction: 'incoming' };
  }

  getRelations(entityId: EntityId, options: RelationQueryOptions = {}): EntityRelation[] {
    const direction = options.direction ?? 'both';
    return this.relations.filter((rel) => {
      if (!this.edgeMatches(rel, entityId, direction)) return false;
      if (options.relationType && rel.relationType !== options.relationType) return false;
      if (options.neighborTypes) {
        const other = this.otherEndpoint(rel, entityId);
        if (!options.neighborTypes.includes(other.type)) return false;
      }
      return true;
    });
  }

  getOutgoing(entityId: EntityId, relationType?: RelationType): EntityRelation[] {
    return this.getRelations(entityId, { direction: 'outgoing', relationType });
  }

  getIncoming(entityId: EntityId, relationType?: RelationType): EntityRelation[] {
    return this.getRelations(entityId, { direction: 'incoming', relationType });
  }

  getRelatedEntities(entityId: EntityId, options: RelatedEntitiesOptions = {}): RelatedEntity[] {
    const direction = options.direction ?? 'both';
    const out: RelatedEntity[] = [];
    for (const rel of this.relations) {
      if (!this.edgeMatches(rel, entityId, direction)) continue;
      if (options.relationType && rel.relationType !== options.relationType) continue;
      const other = this.otherEndpoint(rel, entityId);
      if (options.types && !options.types.includes(other.type)) continue;
      if (options.excludeTypes && options.excludeTypes.includes(other.type)) continue;
      const entity = this.nodes.get(other.id);
      if (!entity) continue;
      out.push({ entity, relation: rel, direction: other.direction });
    }
    return out;
  }

  getNeighbors(entityId: EntityId, options: RelatedEntitiesOptions = {}): EntityNode[] {
    const seen = new Set<EntityId>();
    const out: EntityNode[] = [];
    for (const related of this.getRelatedEntities(entityId, options)) {
      if (seen.has(related.entity.id)) continue;
      seen.add(related.entity.id);
      out.push(related.entity);
    }
    return out;
  }

  private dedupeNeighborsByType(entityId: EntityId, type: EntityType): EntityNode[] {
    return this.getNeighbors(entityId, { direction: 'both', types: [type] });
  }

  getRelatedFanWorks(entityId: EntityId): EntityNode[] {
    return this.dedupeNeighborsByType(entityId, 'fanWork');
  }

  getRelatedWorkshopPackages(entityId: EntityId): EntityNode[] {
    return this.dedupeNeighborsByType(entityId, 'workshopPackage');
  }

  getDependencyTree(entityId: EntityId): DependencyTreeNode {
    const root = this.nodes.get(entityId);
    const empty: DependencyTreeNode = {
      entity:
        root ?? {
          id: entityId,
          type: 'blockDocument',
          title: '',
          summary: '',
          visibility: 'private',
          status: 'draft',
          schemaVersion: 1,
          tags: [],
          payloadRef: { kind: 'none' },
        },
      dependencies: [],
    };
    if (!root) return empty;
    // Shallow: direct dependsOn / containedIn outgoing neighbors (mock has none).
    const deps = this.getNeighbors(entityId, { direction: 'outgoing' })
      .filter((n) =>
        this.getRelations(entityId, { direction: 'outgoing' }).some(
          (r) =>
            (r.relationType === 'dependsOn' || r.relationType === 'containedIn') &&
            r.targetId === n.id,
        ),
      )
      .map((n) => ({ entity: n, dependencies: [] as DependencyTreeNode[] }));
    return { entity: root, dependencies: deps };
  }

  createRelation(input: CreateRelationInput): EntityRelation {
    const rel: EntityRelation = {
      id: `mem-rel-${this.nextSyntheticId++}`,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      targetId: input.targetId,
      targetType: input.targetType,
      relationType: input.relationType,
      label: input.label ?? input.relationType,
      metadata: input.metadata,
    };
    this.relations.push(rel);
    return rel;
  }

  removeRelation(relationId: RelationId): void {
    this.relations = this.relations.filter((r) => r.id !== relationId);
  }
}

// ─── EntityRepository ──────────────────────────────────────────────────────

class MockEntityRepository implements EntityRepository {
  constructor(private graph: MockEntityGraphRepository) {}

  getSummary(id: EntityId, _projection?: EntityProjection): EntitySummary | undefined {
    const node = this.graph.getEntity(id);
    return node ? toEntitySummary(node) : undefined;
  }

  getDetail(id: EntityId, _projection?: EntityProjection): EntityNode | undefined {
    return this.graph.getEntity(id);
  }

  getDetailRef(id: EntityId): EntityDetailRef | undefined {
    const node = this.graph.getEntity(id);
    return node ? { id: node.id, type: node.type, payloadRef: node.payloadRef } : undefined;
  }

  list(filter?: { type?: EntityType }): EntitySummary[] {
    return ENTITY_GRAPH_SEED.nodes
      .filter((n) => (filter?.type ? n.type === filter.type : true))
      .map(toEntitySummary);
  }
}

// ─── FanWork / WorkshopPackage (payload repos over existing mock shapes) ──────

class MockFanWorkRepository implements FanWorkRepository {
  list(): FanWork[] {
    return FAN_WORKS;
  }
  getById(id: EntityId): FanWork | undefined {
    return FAN_WORKS.find((w) => w.id === id);
  }
}

class MockWorkshopPackageRepository implements WorkshopPackageRepository {
  // ── Legacy browse-item access (current Workshop UI) ──
  list(): WorkshopBrowseItem[] {
    return WORKSHOP_BROWSE_SAMPLES;
  }
  getById(id: EntityId): WorkshopBrowseItem | undefined {
    return WORKSHOP_BROWSE_SAMPLES.find((w) => w.id === id);
  }
  listSubscriptions(): WorkshopSubscriptionItem[] {
    return WORKSHOP_SUBSCRIPTION_SAMPLES;
  }

  // ── Manifest protocol (A4) ──
  getPackageSummary(id: string): WorkshopPackageSummary | undefined {
    const manifest = getWorkshopPackageSeedById(id);
    return manifest ? toWorkshopPackageSummary(manifest) : undefined;
  }

  getPackageDetail(id: string): WorkshopPackageDetail | undefined {
    return getWorkshopPackageSeedById(id);
  }

  listPackages(options?: { systemId?: string }): WorkshopPackageSummary[] {
    return WORKSHOP_PACKAGE_SEED
      .filter((m) => (options?.systemId ? m.systemId === options.systemId : true))
      .map(toWorkshopPackageSummary);
  }

  getPackagesByEntity(entityId: EntityId): WorkshopPackageSummary[] {
    return WORKSHOP_PACKAGE_SEED
      .filter((m) =>
        m.includedEntities.some((e) => e.entityId === entityId) ||
        m.entryPoints.some((ep) => ep.kind === 'entity' && ep.ref === entityId) ||
        m.dependencies.some((dep) => dep.kind === 'entity' && dep.ref === entityId),
      )
      .map(toWorkshopPackageSummary);
  }

  getPackagesByDocument(documentId: string): WorkshopPackageSummary[] {
    return WORKSHOP_PACKAGE_SEED
      .filter((m) =>
        m.includedDocuments.some((d) => d.documentId === documentId) ||
        m.entryPoints.some((ep) => ep.kind === 'blockDocument' && ep.ref === documentId),
      )
      .map(toWorkshopPackageSummary);
  }

  getPackageManifest(id: string): WorkshopPackageManifest | undefined {
    return getWorkshopPackageSeedById(id);
  }

  validateManifest(manifest: WorkshopPackageManifest): WorkshopPackageManifestValidationResult {
    return validateWorkshopPackageManifest(manifest);
  }
}

// ─── Reserved repos (contract only — A3 / A6) ─────────────────────────────────

class MockBlockDocumentRepository implements BlockDocumentRepository {
  listDocuments(): BlockDocumentSummary[] {
    return BLOCK_DOCUMENT_SEED.map(toBlockDocumentSummary);
  }
  getDocumentSummary(id: string): BlockDocumentSummary | undefined {
    const doc = getBlockDocumentSeedById(id);
    return doc ? toBlockDocumentSummary(doc) : undefined;
  }

  getDocumentDetail(id: string): BlockDocumentDetail | undefined {
    return getBlockDocumentSeedById(id);
  }

  getDocumentsByEntity(entityId: EntityId): BlockDocumentSummary[] {
    // Mock reverse lookup derived from block refs. In production this is served
    // by the EntityGraph (documents projected as nodes + edges), not a scan.
    return BLOCK_DOCUMENT_SEED
      .filter((doc) => documentEntityRefs(doc).some((ref) => ref.entityId === entityId))
      .map(toBlockDocumentSummary);
  }

  getDocumentsByOwner(ownerId: string): BlockDocumentSummary[] {
    return BLOCK_DOCUMENT_SEED
      .filter((doc) => doc.ownerId === ownerId)
      .map(toBlockDocumentSummary);
  }

  getDocumentPayload(id: string): BlockDocument | undefined {
    return getBlockDocumentSeedById(id);
  }

  validateDocument(document: BlockDocument): BlockDocumentValidationResult {
    return validateBlockDocument(document);
  }
}

class MockMediaAssetRepository implements MediaAssetRepository {
  getMediaSummary(id: string, viewer?: ViewerContext): MediaAssetSummary | undefined {
    const asset = getMediaAssetSeedById(id);
    if (!asset) return undefined;
    if (resolveMediaVariant(asset, 'thumbnail', viewer).kind === 'denied') return undefined;
    return toMediaAssetSummary(asset);
  }

  getMediaDetail(id: string, viewer?: ViewerContext): MediaAssetDetail | undefined {
    const asset = getMediaAssetSeedById(id);
    if (!asset) return undefined;
    if (resolveMediaVariant(asset, 'preview', viewer).kind === 'denied') return undefined;
    return toMediaAssetDetail(asset);
  }

  getMediaVariant(id: string, variant: MediaAssetVariant, viewer?: ViewerContext): ResolvedMediaVariant {
    const asset = getMediaAssetSeedById(id);
    if (!asset) return { kind: 'denied' };
    return resolveMediaVariant(asset, variant, viewer);
  }

  private summariesFor(usedById: string, viewer?: ViewerContext): MediaAssetSummary[] {
    return getMediaUsageBy(usedById)
      .map((usage) => this.getMediaSummary(usage.mediaAssetId, viewer))
      .filter((s): s is MediaAssetSummary => Boolean(s));
  }

  getMediaByEntity(entityId: EntityId, viewer?: ViewerContext): MediaAssetSummary[] {
    return this.summariesFor(entityId, viewer);
  }

  getMediaByDocument(documentId: string, viewer?: ViewerContext): MediaAssetSummary[] {
    return this.summariesFor(documentId, viewer);
  }

  getMediaByPackage(packageId: string, viewer?: ViewerContext): MediaAssetSummary[] {
    return this.summariesFor(packageId, viewer);
  }

  validateMediaAsset(asset: MediaAsset): MediaAssetValidationResult {
    return validateMediaAsset(asset);
  }
}

class MockPermissionProjectionRepository implements PermissionProjectionRepository {
  constructor(private graph: MockEntityGraphRepository) {}

  resolveProjection(entityId: EntityId, viewer: ViewerContext): ProjectionDecision {
    const node = this.graph.getEntity(entityId);
    if (!node) return { projection: 'denied', allowed: false, reason: 'not-found', accessLevel: 'none' };
    return decideProjection({ visibility: node.visibility, ownerId: node.ownerId, shareCode: node.shareCode }, viewer);
  }

  canViewEntity(entityId: EntityId, viewer: ViewerContext): boolean {
    return this.resolveProjection(entityId, viewer).allowed;
  }

  canEditEntity(entityId: EntityId, viewer: ViewerContext): boolean {
    const node = this.graph.getEntity(entityId);
    if (!node) return false;
    return viewer.role === 'admin' || (!!node.ownerId && node.ownerId === viewer.userId);
  }

  // View-tier gate. The real clone/reference ALLOWANCE is governed by the
  // WorkshopPackage clonePolicy/readOnlyPolicy (A4), checked separately.
  canCloneEntity(entityId: EntityId, viewer: ViewerContext): boolean {
    return this.canViewEntity(entityId, viewer);
  }

  canReferenceEntity(entityId: EntityId, viewer: ViewerContext): boolean {
    return this.canViewEntity(entityId, viewer);
  }

  projectEntitySummary(entityId: EntityId, viewer: ViewerContext): ProjectedEntitySummary {
    const node = this.graph.getEntity(entityId);
    if (!node) return { projection: 'denied', accessLevel: 'none' };
    return projectNodeSummary(node, viewer);
  }

  projectEntityDetail(entityId: EntityId, viewer: ViewerContext): ProjectedEntityDetail {
    const node = this.graph.getEntity(entityId);
    if (!node) return { projection: 'denied', accessLevel: 'none' };
    return projectNodeDetail(node, viewer);
  }
}

// ─── Mock implementation factory ──────────────────────────────────────────────
//
// This module is the MOCK IMPLEMENTATION layer only. The composition root + the
// platform singleton live in ./repositoryComposition so that Local/Api/GraphDb
// implementations can be swapped at one place without touching this file.

/** Build a fresh set of mock-backed platform repositories. */
export function createMockRepositories(): PlatformRepositories {
  const entityGraph = new MockEntityGraphRepository();
  return {
    entityGraph,
    entities: new MockEntityRepository(entityGraph),
    blockDocuments: new MockBlockDocumentRepository(),
    workshopPackages: new MockWorkshopPackageRepository(),
    fanWorks: new MockFanWorkRepository(),
    mediaAssets: new MockMediaAssetRepository(),
    permissions: new MockPermissionProjectionRepository(entityGraph),
  };
}
