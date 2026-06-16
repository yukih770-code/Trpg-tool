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
  LINKABLE_OBJECT_TYPES,
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
  MediaAssetMetadata,
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
import { FAN_WORKS } from '../platform/communityMockData';
import type { FanWork } from '../platform/communityTypes';
import { WORKSHOP_BROWSE_SAMPLES } from '../platform/workshopTypes';
import type { WorkshopBrowseItem } from '../platform/workshopTypes';

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
  list(): WorkshopBrowseItem[] {
    return WORKSHOP_BROWSE_SAMPLES;
  }
  getById(id: EntityId): WorkshopBrowseItem | undefined {
    return WORKSHOP_BROWSE_SAMPLES.find((w) => w.id === id);
  }
}

// ─── Reserved repos (contract only — A3 / A6) ─────────────────────────────────

class MockBlockDocumentRepository implements BlockDocumentRepository {
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
  getMetadata(_id: EntityId): MediaAssetMetadata | undefined {
    return undefined; // reserved until MediaAsset model (A6)
  }
}

class MockPermissionProjectionRepository implements PermissionProjectionRepository {
  constructor(private graph: MockEntityGraphRepository) {}
  resolveProjection(viewer: ViewerContext, entityId: EntityId): EntityProjection {
    const node = this.graph.getEntity(entityId);
    if (viewer.role === 'owner') return 'owner';
    if (viewer.role === 'gm') return 'gm';
    if (viewer.role === 'player') return 'player';
    if (node?.visibility === 'unlisted') return 'unlisted';
    return 'public';
  }
}

// ─── Composition root (singleton) ─────────────────────────────────────────────

function createMockRepositories(): PlatformRepositories {
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

/** Platform repository singleton. UI/components query this, never raw mocks. */
export const platformRepo: PlatformRepositories = createMockRepositories();

export { LINKABLE_OBJECT_TYPES };
