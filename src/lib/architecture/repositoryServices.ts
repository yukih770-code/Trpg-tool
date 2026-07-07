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
import type { EntityId, EntityVisibility, RelatedEntitiesOptions, RelatedEntity } from './entityGraph';
import type { MediaAssetSummary, MediaAssetVariant, ResolvedMediaVariant } from './mediaAsset';
import { documentEntityRefs, documentMediaRefs, type BlockDocumentDetail, type BlockDocumentSummary } from './blockDocument';
import type { WorkshopPackageDetail, WorkshopPackageSummary } from './workshopPackage';
import type { FanWork } from '../platform/communityTypes';
import type {
  DraftItem,
  ImportedPackageItem,
  OwnedPackageItem,
  PackageHealthStatus,
  PersonalContentSummary,
} from '../platform/personalContent';
import type { UserProfile, UserProfileSection, UserProfileSummary } from '../platform/userProfile';
import {
  detailModeForEntityType,
  sectionForEntityType,
  type RoutableEntityTarget,
} from '../platform/routableEntity';
import type { PlatformRepositories } from './repositories';
// P5.4: legacy 'author-sample' seed content resolves to the current local
// anonymous user at read time (aliasing only — no seed migration, no filter removal).
import { resolveSeedOwnerIdForCurrentUser, seedOwnerMatchesUser } from '../platform/localViewerIdentity';

/** Simple package health badge (detailed diagnostics deferred to a future report). */
function packageHealth(status: string, visibility: string): PackageHealthStatus {
  if (status === 'draft') return 'hasUnpublishedChanges';
  if (visibility === 'private' || visibility === 'campaignOnly') return 'hasPrivateContent';
  if (status === 'underReview' || status === 'archived') return 'needsAttention';
  return 'available';
}

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
  listDocuments(viewer: ViewerContext = ANONYMOUS_VIEWER): BlockDocumentSummary[] {
    return this.repos.blockDocuments
      .listDocuments()
      .filter((s) => decideProjection({ visibility: s.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(s.ownerId) }, viewer).allowed);
  }

  getDocumentDetail(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): BlockDocumentDetail | undefined {
    const detail = this.repos.blockDocuments.getDocumentDetail(id);
    if (!detail) return undefined;
    return decideProjection({ visibility: detail.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(detail.ownerId) }, viewer).allowed
      ? detail
      : undefined;
  }

  /** Entities a document references (each individually projected). */
  getDocumentReferencedEntities(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): ProjectedEntitySummary[] {
    const detail = this.repos.blockDocuments.getDocumentDetail(id);
    if (!detail) return [];
    return documentEntityRefs(detail).map((ref) => this.repos.permissions.projectEntitySummary(ref.entityId, viewer));
  }

  /** Media a document references (projection-filtered summaries; thumbnail only). */
  getDocumentReferencedMedia(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): MediaAssetSummary[] {
    const detail = this.repos.blockDocuments.getDocumentDetail(id);
    if (!detail) return [];
    return documentMediaRefs(detail)
      .map((mediaId) => this.repos.mediaAssets.getMediaSummary(mediaId, viewer))
      .filter((s): s is MediaAssetSummary => Boolean(s));
  }

  /** Workshop packages that reference a document (visibility-filtered). */
  getPackagesByDocument(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): WorkshopPackageSummary[] {
    return this.repos.workshopPackages
      .getPackagesByDocument(id)
      .filter((pkg) => decideProjection({ visibility: pkg.visibility }, viewer).allowed);
  }

  // ── Packages (gated by manifest visibility) ──
  getPackageDetail(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): WorkshopPackageDetail | undefined {
    const detail = this.repos.workshopPackages.getPackageDetail(id);
    if (!detail) return undefined;
    return decideProjection({ visibility: detail.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(detail.author.id) }, viewer).allowed
      ? detail
      : undefined;
  }

  // ── Fan works (gated by fan-work visibility) ──
  getFanWork(id: string, viewer: ViewerContext = ANONYMOUS_VIEWER): FanWork | undefined {
    const fw = this.repos.fanWorks.getById(id);
    if (!fw) return undefined;
    return decideProjection({ visibility: fw.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(fw.authorId) }, viewer).allowed ? fw : undefined;
  }
  listFanWorks(viewer: ViewerContext = ANONYMOUS_VIEWER): FanWork[] {
    return this.repos.fanWorks
      .list()
      .filter((fw) => decideProjection({ visibility: fw.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(fw.authorId) }, viewer).allowed);
  }

  // ── Personal Content Hub (owner-scoped, read-only) ──
  listMyDocuments(viewer: ViewerContext = ANONYMOUS_VIEWER): PersonalContentSummary[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    return this.repos.blockDocuments
      .listDocuments()
      .filter((d) => seedOwnerMatchesUser(d.ownerId, ownerId))
      .map((d): PersonalContentSummary => ({
        kind: 'document', id: d.id, title: d.title, status: d.status, visibility: d.visibility, updatedAt: d.updatedAt,
      }));
  }

  listMyFanWorks(viewer: ViewerContext = ANONYMOUS_VIEWER): PersonalContentSummary[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    return this.repos.fanWorks
      .list()
      .filter((w) => seedOwnerMatchesUser(w.authorId, ownerId))
      .map((w): PersonalContentSummary => ({
        kind: 'fanWork', id: w.id, title: w.title, subtitle: w.authorName, visibility: w.visibility, updatedAt: w.updatedAtLabel,
      }));
  }

  listMyPackages(viewer: ViewerContext = ANONYMOUS_VIEWER): OwnedPackageItem[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    return this.repos.workshopPackages
      .listPackages()
      .filter((p) => seedOwnerMatchesUser(p.author.id, ownerId))
      .map((p): OwnedPackageItem => ({
        kind: 'package', id: p.packageId, title: p.title, status: p.status, visibility: p.visibility,
        updatedAt: p.updatedAt, health: packageHealth(p.status, p.visibility),
      }));
  }

  listMyDrafts(viewer: ViewerContext = ANONYMOUS_VIEWER): DraftItem[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    const docDrafts = this.repos.blockDocuments
      .listDocuments()
      .filter((d) => seedOwnerMatchesUser(d.ownerId, ownerId) && d.status === 'draft')
      .map((d): DraftItem => ({ kind: 'document', id: d.id, title: d.title, status: d.status, visibility: d.visibility, updatedAt: d.updatedAt }));
    const pkgDrafts = this.repos.workshopPackages
      .listPackages()
      .filter((p) => seedOwnerMatchesUser(p.author.id, ownerId) && p.status === 'draft')
      .map((p): DraftItem => ({ kind: 'package', id: p.packageId, title: p.title, status: p.status, visibility: p.visibility, updatedAt: p.updatedAt }));
    return [...docDrafts, ...pkgDrafts];
  }

  listMyCollections(viewer: ViewerContext = ANONYMOUS_VIEWER): PersonalContentSummary[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    return this.repos.personalContent
      .listCollections(ownerId)
      .map((c) => this.resolveCollectionItem(c.itemKind, c.targetId, viewer))
      .filter((s): s is PersonalContentSummary => Boolean(s));
  }

  listImportedPackages(viewer: ViewerContext = ANONYMOUS_VIEWER): ImportedPackageItem[] {
    const ownerId = viewer.userId;
    if (!ownerId) return [];
    return this.repos.personalContent.listImportedPackages(ownerId);
  }

  // ── User Profile Space (visitor showcase, projection-aware) ──
  /** Resolve an object to its owner's profile detail target (or null if denied/missing). */
  resolveEntityProfileTarget(entityId: string, viewer: ViewerContext = ANONYMOUS_VIEWER): RoutableEntityTarget | null {
    const projected = this.repos.permissions.projectEntitySummary(entityId, viewer);
    if (!projected.summary) return null;
    const node = this.repos.entities.getDetail(entityId);
    // Ownerless official content routes to a future SystemProfile (placeholder id).
    const profileUserId = node?.ownerId ?? 'official';
    return {
      profileUserId,
      entityId,
      entityType: projected.summary.type,
      section: sectionForEntityType(projected.summary.type),
      detailMode: detailModeForEntityType(projected.summary.type),
    };
  }

  /** Profile metadata, gated by profile visibility (aggregate view, not truth source). */
  getProfile(userId: string, viewer: ViewerContext = ANONYMOUS_VIEWER): UserProfile | undefined {
    const profile = this.repos.userProfiles.getProfile(userId);
    if (!profile) return undefined;
    return decideProjection({ visibility: profile.visibility, ownerId: resolveSeedOwnerIdForCurrentUser(userId) }, viewer).allowed ? profile : undefined;
  }

  getProfileSummary(userId: string): UserProfileSummary | undefined {
    return this.repos.userProfiles.getProfileSummary(userId);
  }

  /** Items shown in a profile section, filtered to what the viewer may see (showcase). */
  listProfileSectionItems(
    userId: string,
    section: UserProfileSection,
    viewer: ViewerContext = ANONYMOUS_VIEWER,
  ): PersonalContentSummary[] {
    const visible = (visibility: EntityVisibility, ownerId?: string): boolean =>
      decideProjection({ visibility, ownerId: resolveSeedOwnerIdForCurrentUser(ownerId) }, viewer).allowed;
    if (section === 'documents') {
      return this.repos.blockDocuments
        .listDocuments()
        .filter((d) => seedOwnerMatchesUser(d.ownerId, userId) && visible(d.visibility, d.ownerId))
        .map((d): PersonalContentSummary => ({ kind: 'document', id: d.id, title: d.title, status: d.status, visibility: d.visibility, updatedAt: d.updatedAt }));
    }
    if (section === 'fanWorks') {
      return this.repos.fanWorks
        .list()
        .filter((w) => seedOwnerMatchesUser(w.authorId, userId) && visible(w.visibility, w.authorId))
        .map((w): PersonalContentSummary => ({ kind: 'fanWork', id: w.id, title: w.title, subtitle: w.authorName, visibility: w.visibility, updatedAt: w.updatedAtLabel }));
    }
    if (section === 'workshopPackages') {
      return this.repos.workshopPackages
        .listPackages()
        .filter((p) => seedOwnerMatchesUser(p.author.id, userId) && visible(p.visibility, p.author.id))
        .map((p): PersonalContentSummary => ({ kind: 'package', id: p.packageId, title: p.title, status: p.status, visibility: p.visibility, updatedAt: p.updatedAt }));
    }
    // characters / campaigns / media / collections / overview: not graph-entity-backed yet (A10.8+).
    return [];
  }

  private resolveCollectionItem(
    kind: PersonalContentSummary['kind'],
    targetId: string,
    viewer: ViewerContext,
  ): PersonalContentSummary | undefined {
    if (kind === 'fanWork') {
      const w = this.repos.fanWorks.getById(targetId);
      return w ? { kind: 'fanWork', id: w.id, title: w.title, subtitle: w.authorName, visibility: w.visibility, updatedAt: w.updatedAtLabel } : undefined;
    }
    if (kind === 'package') {
      const p = this.repos.workshopPackages.getPackageSummary(targetId);
      return p ? { kind: 'package', id: p.packageId, title: p.title, status: p.status, visibility: p.visibility, updatedAt: p.updatedAt } : undefined;
    }
    if (kind === 'document') {
      const d = this.repos.blockDocuments.getDocumentSummary(targetId);
      return d ? { kind: 'document', id: d.id, title: d.title, status: d.status, visibility: d.visibility, updatedAt: d.updatedAt } : undefined;
    }
    const projected = this.repos.permissions.projectEntitySummary(targetId, viewer);
    return projected.summary
      ? { kind: 'entity', id: projected.summary.id, title: projected.summary.title, subtitle: projected.summary.subtitle, visibility: projected.summary.visibility }
      : undefined;
  }
}

/** The default viewer-aware data service (mock-backed via the composition root). */
export const platformDataService = new PlatformDataService();
