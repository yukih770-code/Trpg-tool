/**
 * WorkshopPackage Manifest Protocol — the platform's unified content-package
 * descriptor.
 *
 * AI-LANDMARK: WORKSHOP_PACKAGE_MANIFEST_V1
 *
 * A package is a *manifest* that DECLARES what it bundles (entities, documents,
 * media) — it never copies prose/bodies as a second source of truth. Cross-object
 * relation authority stays in the EntityGraph; the manifest's `includedEntities`
 * / `includedDocuments` / `dependencies` PROJECT to EntityGraph edges
 * (see projectPackageRelations).
 *
 * Private-first today: packages support export-to-friend / clone-to-library /
 * add-to-local-list / enable-to-campaign, and later public Workshop publish.
 *
 * Types + pure helpers + mock seed only. No real clone/export/publish/subscribe,
 * no UI, no backend, no upload.
 */
import type {
  CreateRelationInput,
  EntityStatus,
  EntityType,
  EntityVisibility,
} from './entityGraph';

export type WorkshopPackageId = string;

/** Version of the manifest FORMAT (not the package release). */
export type WorkshopPackageManifestVersion = number;

/** Reuse canonical lifecycle/visibility enums (single source). */
export type WorkshopPackageStatus = EntityStatus;
export type WorkshopPackageVisibility = EntityVisibility;

export type ClonePolicy = 'cloneAllowed' | 'referenceOnly' | 'forbidden';
export type ReadOnlyPolicy = 'editableClone' | 'readOnlyReference' | 'ownerOnlyEditable';
export type SourceTrust = 'official' | 'community' | 'personal' | 'imported' | 'unknown';

export const CLONE_POLICIES: ClonePolicy[] = ['cloneAllowed', 'referenceOnly', 'forbidden'];
export const READ_ONLY_POLICIES: ReadOnlyPolicy[] = ['editableClone', 'readOnlyReference', 'ownerOnlyEditable'];
export const SOURCE_TRUST_LEVELS: SourceTrust[] = ['official', 'community', 'personal', 'imported', 'unknown'];

export type WorkshopPackageAuthor = {
  id?: string;
  handle: string;
  displayName?: string;
};

export type UsageNote = {
  text: string;
  license?: string;
};

// ─── Reference shapes (id-only declarations) ─────────────────────────────────

export type WorkshopPackageEntityRef = {
  entityId: string;
  entityType: EntityType;
  /** Optional role inside the package (e.g. 'npc', 'boss', 'characterTemplate'). */
  role?: string;
};

export type WorkshopPackageDocumentRef = {
  documentId: string;
  title?: string;
  role?: 'chapter' | 'ruleSummary' | 'note' | 'handout' | 'mapNote';
};

export type WorkshopPackageMediaRef = {
  mediaAssetId: string;
  kind?: string;
};

export type WorkshopPackageDependencyKind = 'package' | 'entity' | 'ruleSystem';

export type WorkshopPackageDependency = {
  kind: WorkshopPackageDependencyKind;
  /** packageId | entityId | systemId, per kind. */
  ref: string;
  /** Required when kind === 'entity'. */
  entityType?: EntityType;
  version?: string;
  optional?: boolean;
  note?: string;
};

export type WorkshopPackageEntryPointKind = 'blockDocument' | 'entity';

export type WorkshopPackageEntryPoint = {
  kind: WorkshopPackageEntryPointKind;
  /** documentId | entityId, per kind. */
  ref: string;
  /** Required when kind === 'entity'. */
  entityType?: EntityType;
  title?: string;
  primary?: boolean;
};

// ─── Manifest ────────────────────────────────────────────────────────────────

export type WorkshopPackageManifest = {
  packageId: WorkshopPackageId;
  manifestVersion: WorkshopPackageManifestVersion;
  /** Version of the package CONTENT schema. */
  schemaVersion: number;
  title: string;
  summary: string;
  author: WorkshopPackageAuthor;
  /** Package release (semver-like, e.g. 'v1.0.0'). */
  version: string;
  systemId?: string;
  status: WorkshopPackageStatus;
  visibility: WorkshopPackageVisibility;
  /** Browse metadata. */
  tags: string[];
  previewKind?: string;

  includedEntities: WorkshopPackageEntityRef[];
  includedDocuments: WorkshopPackageDocumentRef[];
  dependencies: WorkshopPackageDependency[];
  entryPoints: WorkshopPackageEntryPoint[];

  clonePolicy: ClonePolicy;
  readOnlyPolicy: ReadOnlyPolicy;
  sourceTrust: SourceTrust;
  usageNote?: UsageNote;

  /** Provenance for cloned packages (emits a clonedFrom edge). */
  clonedFromPackageId?: WorkshopPackageId;

  createdAt: string;
  updatedAt: string;

  // ── Contract-only (reserved; not consumed this round) ──
  includedMediaAssets?: WorkshopPackageMediaRef[];
  license?: string;
  remoteSource?: string;
  publishChannel?: string;
  subscriptionPolicy?: string;
  changelog?: string;
  compatibility?: string;
  installHints?: string;
};

export type WorkshopPackageSummary = {
  packageId: WorkshopPackageId;
  title: string;
  summary: string;
  author: WorkshopPackageAuthor;
  version: string;
  systemId?: string;
  status: WorkshopPackageStatus;
  visibility: WorkshopPackageVisibility;
  sourceTrust: SourceTrust;
  tags: string[];
  previewKind?: string;
  entityCount: number;
  documentCount: number;
  updatedAt: string;
};

/** Detail = the full manifest; included refs resolved lazily by the caller. */
export type WorkshopPackageDetail = WorkshopPackageManifest;

// ─── Validation ──────────────────────────────────────────────────────────────

export type WorkshopPackageManifestValidationIssue = {
  ref?: string;
  code:
    | 'missing-package-id'
    | 'missing-version'
    | 'invalid-manifest-version'
    | 'missing-entity-ref'
    | 'missing-document-ref'
    | 'missing-entrypoint-ref'
    | 'missing-dependency-ref'
    | 'invalid-clone-policy'
    | 'invalid-read-only-policy'
    | 'invalid-source-trust';
  message: string;
};

export type WorkshopPackageManifestValidationResult = {
  ok: boolean;
  issues: WorkshopPackageManifestValidationIssue[];
};

// ─── EntityGraph bridge ──────────────────────────────────────────────────────

/**
 * Project a manifest's structural declarations into EntityGraph edges. The graph
 * stays the authority; this is the bridge a future write path (A10/A11) feeds to
 * `EntityGraphRepository.createRelation`. Uses existing A1 RelationTypes only
 * (containedIn / dependsOn / publishedFrom / clonedFrom) — no new member.
 *
 * Directions:
 *   Entity     -- containedIn  --> Package
 *   Document   -- containedIn  --> Package
 *   Package    -- dependsOn    --> Package | Entity  (ruleSystem deps not projected)
 *   Package    -- publishedFrom--> primary entry point (document/entity)
 *   Package    -- clonedFrom   --> source Package
 * `authoredBy` is deferred until user/author nodes exist (no 'user' EntityType yet).
 */
export function projectPackageRelations(manifest: WorkshopPackageManifest): CreateRelationInput[] {
  const out: CreateRelationInput[] = [];

  for (const e of manifest.includedEntities) {
    out.push({
      sourceId: e.entityId,
      sourceType: e.entityType,
      targetId: manifest.packageId,
      targetType: 'workshopPackage',
      relationType: 'containedIn',
      label: 'containedIn',
    });
  }

  for (const d of manifest.includedDocuments) {
    out.push({
      sourceId: d.documentId,
      sourceType: 'blockDocument',
      targetId: manifest.packageId,
      targetType: 'workshopPackage',
      relationType: 'containedIn',
      label: 'containedIn',
    });
  }

  for (const dep of manifest.dependencies) {
    if (dep.kind === 'ruleSystem') continue; // system id is not a graph node
    const targetType: EntityType = dep.kind === 'package' ? 'workshopPackage' : (dep.entityType ?? 'blockDocument');
    out.push({
      sourceId: manifest.packageId,
      sourceType: 'workshopPackage',
      targetId: dep.ref,
      targetType,
      relationType: 'dependsOn',
      label: 'dependsOn',
    });
  }

  for (const ep of manifest.entryPoints) {
    if (!ep.primary) continue;
    const targetType: EntityType = ep.kind === 'blockDocument' ? 'blockDocument' : (ep.entityType ?? 'blockDocument');
    out.push({
      sourceId: manifest.packageId,
      sourceType: 'workshopPackage',
      targetId: ep.ref,
      targetType,
      relationType: 'publishedFrom',
      label: 'publishedFrom',
    });
  }

  if (manifest.clonedFromPackageId) {
    out.push({
      sourceId: manifest.packageId,
      sourceType: 'workshopPackage',
      targetId: manifest.clonedFromPackageId,
      targetType: 'workshopPackage',
      relationType: 'clonedFrom',
      label: 'clonedFrom',
    });
  }

  return out;
}

/** BlockDocument entry points (documentIds). */
export function packageBlockDocumentEntryPoints(manifest: WorkshopPackageManifest): string[] {
  return manifest.entryPoints.filter((ep) => ep.kind === 'blockDocument').map((ep) => ep.ref);
}

export function toWorkshopPackageSummary(manifest: WorkshopPackageManifest): WorkshopPackageSummary {
  return {
    packageId: manifest.packageId,
    title: manifest.title,
    summary: manifest.summary,
    author: manifest.author,
    version: manifest.version,
    systemId: manifest.systemId,
    status: manifest.status,
    visibility: manifest.visibility,
    sourceTrust: manifest.sourceTrust,
    tags: manifest.tags,
    previewKind: manifest.previewKind,
    entityCount: manifest.includedEntities.length,
    documentCount: manifest.includedDocuments.length,
    updatedAt: manifest.updatedAt,
  };
}

/** Lightweight structural validation (no side effects). */
export function validateWorkshopPackageManifest(
  manifest: WorkshopPackageManifest,
): WorkshopPackageManifestValidationResult {
  const issues: WorkshopPackageManifestValidationIssue[] = [];

  if (!manifest.packageId) issues.push({ code: 'missing-package-id', message: 'packageId is required.' });
  if (!manifest.version) issues.push({ code: 'missing-version', message: 'version is required.' });
  if (typeof manifest.manifestVersion !== 'number') {
    issues.push({ code: 'invalid-manifest-version', message: 'manifestVersion must be a number.' });
  }
  for (const e of manifest.includedEntities) {
    if (!e.entityId || !e.entityType) {
      issues.push({ ref: e.entityId, code: 'missing-entity-ref', message: 'includedEntities entry missing entityId/entityType.' });
    }
  }
  for (const d of manifest.includedDocuments) {
    if (!d.documentId) issues.push({ ref: d.documentId, code: 'missing-document-ref', message: 'includedDocuments entry missing documentId.' });
  }
  for (const ep of manifest.entryPoints) {
    if (!ep.ref) issues.push({ code: 'missing-entrypoint-ref', message: 'entryPoints entry missing ref.' });
  }
  for (const dep of manifest.dependencies) {
    if (!dep.ref) issues.push({ code: 'missing-dependency-ref', message: 'dependencies entry missing ref.' });
  }
  if (!CLONE_POLICIES.includes(manifest.clonePolicy)) {
    issues.push({ code: 'invalid-clone-policy', message: `Unknown clonePolicy "${manifest.clonePolicy}".` });
  }
  if (!READ_ONLY_POLICIES.includes(manifest.readOnlyPolicy)) {
    issues.push({ code: 'invalid-read-only-policy', message: `Unknown readOnlyPolicy "${manifest.readOnlyPolicy}".` });
  }
  if (!SOURCE_TRUST_LEVELS.includes(manifest.sourceTrust)) {
    issues.push({ code: 'invalid-source-trust', message: `Unknown sourceTrust "${manifest.sourceTrust}".` });
  }

  return { ok: issues.length === 0, issues };
}
