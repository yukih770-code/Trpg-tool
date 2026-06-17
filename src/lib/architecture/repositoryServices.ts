/**
 * Platform data Service layer — the viewer-aware read funnel.
 *
 * AI-LANDMARK: PLATFORM_DATA_SERVICE_V1
 *
 * Repositories (./repositories) are the raw data-access boundary. This Service
 * adds the cross-cutting concern that MUST NOT live in UI components:
 * PROJECTION ENFORCEMENT. UI should read viewer-scoped data through
 * `platformDataService`, never decide public/owner/gm/player itself.
 *
 * Enforcement here:
 *   - entity summary/detail go through PermissionProjectionRepository.
 *   - related-entity reads are projection-filtered (neighbors the viewer can't
 *     view are dropped) — the contract that EntityGraph queries are projected.
 *   - media variants (incl. original) go through MediaAssetRepository projection.
 *   - document / package / fan-work reads are gated by their own visibility.
 *
 * Sync now: this Service is the SINGLE place that turns async when ApiRepository
 * lands (A11). Funnelling viewer-aware reads here keeps that migration bounded.
 * UI adoption of this Service is incremental (A9) — not forced this round.
 */
import { platformRepositories } from './repositoryComposition';
import {
  ANONYMOUS_VIEWER,
  decideProjection,
  type ProjectedEntityDetail,
  type ProjectedEntitySummary,
  type ViewerContext,
} from './projection';
import type { EntityId, RelatedEntitiesOptions, RelatedEntity } from './entityGraph';
import type { MediaAssetSummary, MediaAssetVariant, ResolvedMediaVariant } from './mediaAsset';
import type { BlockDocumentDetail } from './blockDocument';
import type { WorkshopPackageDetail } from './workshopPackage';
import type { FanWork } from '../platform/communityTypes';
import type { PlatformRepositories } from './repositories';

export class PlatformDataService {
  constructor(private readonly repos: PlatformRepositories = platformRepositories) {}

  // ── Entities (projected) ──
  getEntitySummary(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): ProjectedEntitySummary {
    return this.repos.permissions.projectEntitySummary(id, viewer);
  }
  getEntityDetail(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): ProjectedEntityDetail {
    return this.repos.permissions.projectEntityDetail(id, viewer);
  }
  canView(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): boolean {
    return this.repos.permissions.canViewEntity(id, viewer);
  }
  canEdit(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): boolean {
    return this.repos.permissions.canEditEntity(id, viewer);
  }
  canClone(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): boolean {
    return this.repos.permissions.canCloneEntity(id, viewer);
  }
  canReference(id: EntityId, viewer: ViewerContext = ANONYMOUS_VIEWER): boolean {
    return this.repos.permissions.canReferenceEntity(id, viewer);
  }

  // ── Relations (projection-filtered) ──
  getRelatedEntities(
    entityId: EntityId,
    options?: RelatedEntitiesOptions,
    viewer: ViewerContext = ANONYMOUS_VIEWER,
  ): RelatedEntity[] {
    return this.repos.entityGraph
      .getRelatedEntities(entityId, options)
      .filter((related) => this.repos.permissions.canViewEntity(related.entity.id, viewer));
  }

  // ── Media (projection-gated; original only via getMediaVariant) ──
  getMediaSummary(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): MediaAssetSummary | undefined {
    return this.repos.mediaAssets.getMediaSummary(id, viewer);
  }
  getMediaVariant(id: string, variant: MediaAssetVariant, viewer: ViewerContext = ANONYMOUS_VIEWER): ResolvedMediaVariant {
    return this.repos.mediaAssets.getMediaVariant(id, variant, viewer);
  }

  // ── Documents (gated by document visibility) ──
  getDocumentDetail(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): BlockDocumentDetail | undefined {
    const detail = this.repos.blockDocuments.getDocumentDetail(id);
    if (!detail) return undefined;
    return decideProjection({ visibility: detail.visibility, ownerId: detail.ownerId }, viewer).allowed
      ? detail
      : undefined;
  }

  // ── Packages (gated by manifest visibility) ──
  getPackageDetail(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): WorkshopPackageDetail | undefined {
    const detail = this.repos.workshopPackages.getPackageDetail(id);
    if (!detail) return undefined;
    return decideProjection({ visibility: detail.visibility, ownerId: detail.author.id }, viewer).allowed
      ? detail
      : undefined;
  }

  // ── Fan works (gated by fan-work visibility) ──
  getFanWork(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): FanWork | undefined {
    const fw = this.repos.fanWorks.getById(id);
    if (!fw) return undefined;
    return decideProjection({ visibility: fw.visibility, ownerId: fw.authorId }, viewer).allowed ? fw : undefined;
  }
  listFanWorks(viewer: ViewerContext = ANONYMOUS_VIEWER): FanWork[] {
    return this.repos.fanWorks
      .list()
      .filter((fw) => decideProjection({ visibility: fw.visibility, ownerId: fw.authorId }, viewer).allowed);
  }
}

/** The default viewer-aware data service (mock-backed via the composition root). */
export const platformDataService = new PlatformDataService();
