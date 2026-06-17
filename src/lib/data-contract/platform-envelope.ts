/**
 * Platform Export / Import Envelope v2.
 *
 * AI-LANDMARK: PLATFORM_EXPORT_IMPORT_ENVELOPE_V2
 *
 * Extends the character export envelope (./export-envelope, UNCHANGED — full
 * backward compatibility) into a platform-level envelope that can carry Entity,
 * EntityRelation, BlockDocument, WorkshopPackageManifest, MediaAsset metadata,
 * FanWork, Campaign / SessionLog summaries, and full platform backups — with
 * per-object schemaVersion, dry-run import, validation, conflict detection, and
 * corrupt-object isolation.
 *
 * Hard rules:
 *   - Does NOT break the existing character envelope (it wraps it).
 *   - Every object carries its own schemaVersion (no untyped JSON blob).
 *   - Imports are dry-runnable; one corrupt object never fails the whole import.
 *   - Media ORIGINAL binaries are never embedded — only MediaAsset metadata; real
 *     bytes are handled later by package files / storage refs.
 *   - EntityRelation imports validate source/target existence.
 *   - WorkshopPackageManifest never copies prose as a second source of truth.
 *
 * Types + pure helpers only. No UI, no backend, no real upload.
 */
import type { EntityNode, EntityProjection, EntityRelation, EntityVisibility } from '../architecture/entityGraph';
import { validateBlockDocument, type BlockDocument } from '../architecture/blockDocument';
import { validateWorkshopPackageManifest, type WorkshopPackageManifest } from '../architecture/workshopPackage';
import { validateMediaAsset, type MediaAsset } from '../architecture/mediaAsset';
import {
  createCharacterExportEnvelope,
  type PlatformRulesetSystem,
  type TrpgCharacterExportEnvelope,
} from './export-envelope';

/** Envelope FORMAT version (distinct from payload schemaVersion / manifestVersion). */
export const PLATFORM_ENVELOPE_VERSION = 2 as const;

export type PlatformExportKind =
  | 'character'
  | 'entity'
  | 'entityGraph'
  | 'blockDocument'
  | 'workshopPackage'
  | 'mediaAssetMetadata'
  | 'fanWork'
  | 'campaignSummary'
  | 'sessionLogSummary'
  | 'platformBackup';

export const PLATFORM_EXPORT_KINDS: PlatformExportKind[] = [
  'character', 'entity', 'entityGraph', 'blockDocument', 'workshopPackage',
  'mediaAssetMetadata', 'fanWork', 'campaignSummary', 'sessionLogSummary', 'platformBackup',
];

/** Export intent — maps to a projection ceiling (see projectionForScope). */
export type ExportScope = 'ownerBackup' | 'friendShare' | 'publicPackage';

export type PlatformExportSource = {
  exportedBy?: string;
  sourceApp?: string;
  sourceVersion?: string;
};

export type EnvelopeValidationSummary = {
  ok: boolean;
  errorCount: number;
  warningCount: number;
};

export type PlatformExportEnvelope = {
  kind: PlatformExportKind;
  /** Format version of the envelope itself. */
  envelopeVersion: number;
  /** Schema version of the PRIMARY payload object. */
  schemaVersion: number;
  exportedAt: string;
  exportScope: ExportScope;
  exportedBy?: string;
  sourceApp?: string;
  sourceVersion?: string;
  /** Kind-specific primary payload. For 'character', the legacy character envelope. */
  payload?: unknown;
  /** Each included object carries its own schemaVersion / manifestVersion. */
  includedEntities?: EntityNode[];
  includedRelations?: EntityRelation[];
  includedDocuments?: BlockDocument[];
  includedPackages?: WorkshopPackageManifest[];
  /** Metadata only — NEVER original binaries. */
  includedMediaAssets?: MediaAsset[];
  validation?: EnvelopeValidationSummary;
  metadata?: Record<string, string>;
};

// ─── Import validation / dry-run model ───────────────────────────────────────

export type ExportObjectKind =
  | 'character' | 'entity' | 'relation' | 'document' | 'package' | 'mediaAsset' | 'fanWork';

export type ImportValidationSeverity = 'valid' | 'warning' | 'error';

export type ImportValidationCode =
  | 'valid'
  | 'unsupportedVersion'
  | 'unsupportedKind'
  | 'missingDependency'
  | 'missingRelationTarget'
  | 'corruptPayload'
  | 'duplicateId'
  | 'visibilityRisk'
  | 'mediaMissing'
  | 'unknownBlockType';

export type ImportValidationIssue = {
  severity: ImportValidationSeverity;
  code: ImportValidationCode;
  objectKind?: ExportObjectKind;
  objectId?: string;
  message: string;
};

export type ImportValidationResult = {
  ok: boolean;
  issues: ImportValidationIssue[];
};

export type ImportConflictKind = 'duplicateId' | 'versionMismatch';
export type ImportConflictResolution = 'skip' | 'rename' | 'remapId' | 'preserveId' | 'overwrite';

export type ImportConflict = {
  kind: ImportConflictKind;
  objectKind: ExportObjectKind;
  objectId: string;
  message: string;
  suggestedResolution: ImportConflictResolution;
};

export type ImportStrategy =
  | 'skipInvalid'
  | 'validOnly'
  | 'renameDuplicates'
  | 'preserveIds'
  | 'remapIds'
  | 'dryRunOnly';

export type ImportScope = {
  strategy: ImportStrategy;
  dryRun: boolean;
  existingEntityIds?: string[];
  existingDocumentIds?: string[];
};

export type PerObjectImportStatus = 'imported' | 'skipped' | 'warning' | 'error' | 'remapped';

export type PerObjectImportOutcome = {
  objectKind: ExportObjectKind;
  objectId: string;
  status: PerObjectImportStatus;
  issues: ImportValidationIssue[];
};

export type ImportDryRunSummary = {
  total: number;
  importable: number;
  skipped: number;
  remapped: number;
  warnings: number;
  errors: number;
};

export type ImportDryRunResult = {
  ok: boolean;
  validation: ImportValidationResult;
  conflicts: ImportConflict[];
  outcomes: PerObjectImportOutcome[];
  summary: ImportDryRunSummary;
};

// ─── Projection / scope ──────────────────────────────────────────────────────

/** The projection ceiling an export scope is allowed to carry. */
export function projectionForScope(scope: ExportScope): EntityProjection {
  switch (scope) {
    case 'ownerBackup': return 'owner';
    case 'friendShare': return 'unlisted';
    case 'publicPackage': return 'public';
    default: return 'public';
  }
}

/** A private/campaignOnly object exported beyond an owner backup is a risk. */
export function assessVisibilityRisk(visibility: EntityVisibility, scope: ExportScope): boolean {
  if (scope === 'ownerBackup') return false;
  return visibility === 'private' || visibility === 'campaignOnly';
}

// ─── Construction ────────────────────────────────────────────────────────────

export function createPlatformExportEnvelope(params: {
  kind: PlatformExportKind;
  schemaVersion: number;
  exportScope: ExportScope;
  payload?: unknown;
  includedEntities?: EntityNode[];
  includedRelations?: EntityRelation[];
  includedDocuments?: BlockDocument[];
  includedPackages?: WorkshopPackageManifest[];
  includedMediaAssets?: MediaAsset[];
  source?: PlatformExportSource;
  exportedAt?: string;
  metadata?: Record<string, string>;
}): PlatformExportEnvelope {
  return {
    kind: params.kind,
    envelopeVersion: PLATFORM_ENVELOPE_VERSION,
    schemaVersion: params.schemaVersion,
    exportedAt: params.exportedAt ?? new Date().toISOString(),
    exportScope: params.exportScope,
    exportedBy: params.source?.exportedBy,
    sourceApp: params.source?.sourceApp,
    sourceVersion: params.source?.sourceVersion,
    payload: params.payload,
    includedEntities: params.includedEntities,
    includedRelations: params.includedRelations,
    includedDocuments: params.includedDocuments,
    includedPackages: params.includedPackages,
    includedMediaAssets: params.includedMediaAssets,
    metadata: params.metadata,
  };
}

/** Backward-compatible bridge: wrap the legacy character envelope as v2. */
export function createPlatformCharacterEnvelope(params: {
  system: PlatformRulesetSystem;
  character: unknown;
  appVersion?: string;
  exportScope?: ExportScope;
}): PlatformExportEnvelope {
  const legacy: TrpgCharacterExportEnvelope = createCharacterExportEnvelope({
    system: params.system,
    character: params.character,
    appVersion: params.appVersion,
  });
  return createPlatformExportEnvelope({
    kind: 'character',
    schemaVersion: legacy.schemaVersion,
    exportScope: params.exportScope ?? 'ownerBackup',
    payload: legacy,
    source: { sourceApp: 'trpg-platform', sourceVersion: params.appVersion },
  });
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPlatformExportEnvelope(value: unknown): value is PlatformExportEnvelope {
  return isRecord(value) && typeof value.envelopeVersion === 'number' && typeof value.kind === 'string';
}

/** Structural validation of the envelope shell (not its objects). */
export function validatePlatformEnvelope(envelope: PlatformExportEnvelope): ImportValidationResult {
  const issues: ImportValidationIssue[] = [];
  if (!PLATFORM_EXPORT_KINDS.includes(envelope.kind)) {
    issues.push({ severity: 'error', code: 'unsupportedKind', message: `Unsupported export kind "${envelope.kind}".` });
  }
  if (envelope.envelopeVersion > PLATFORM_ENVELOPE_VERSION) {
    issues.push({ severity: 'error', code: 'unsupportedVersion', message: `Envelope version ${envelope.envelopeVersion} is newer than supported (${PLATFORM_ENVELOPE_VERSION}).` });
  }
  if (typeof envelope.schemaVersion !== 'number') {
    issues.push({ severity: 'error', code: 'corruptPayload', message: 'Envelope missing schemaVersion.' });
  }
  return { ok: issues.every((i) => i.severity !== 'error'), issues };
}

// ─── Dry-run import ──────────────────────────────────────────────────────────

function issue(
  severity: ImportValidationSeverity,
  code: ImportValidationCode,
  objectKind: ExportObjectKind,
  objectId: string,
  message: string,
): ImportValidationIssue {
  return { severity, code, objectKind, objectId, message };
}

function visibilityRiskIssues(
  visibility: EntityVisibility,
  scope: ExportScope,
  objectKind: ExportObjectKind,
  objectId: string,
): ImportValidationIssue[] {
  return assessVisibilityRisk(visibility, scope)
    ? [issue('warning', 'visibilityRisk', objectKind, objectId, `${visibility} object exported under "${scope}" scope.`)]
    : [];
}

function outcomeStatus(issues: ImportValidationIssue[], scope: ImportScope): PerObjectImportStatus {
  if (issues.some((i) => i.severity === 'error')) return 'error';
  if (issues.some((i) => i.code === 'duplicateId')) {
    if (scope.strategy === 'renameDuplicates' || scope.strategy === 'remapIds') return 'remapped';
    if (scope.strategy === 'skipInvalid' || scope.strategy === 'validOnly') return 'skipped';
  }
  if (issues.some((i) => i.code === 'missingRelationTarget')) return 'skipped';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  return 'imported';
}

/**
 * Per-object dry-run. Each object is validated independently — a corrupt object
 * never aborts the whole import (corrupt-object isolation).
 */
export function dryRunImport(envelope: PlatformExportEnvelope, scope: ImportScope): ImportDryRunResult {
  const allIssues: ImportValidationIssue[] = [];
  const conflicts: ImportConflict[] = [];
  const outcomes: PerObjectImportOutcome[] = [];

  const existingEntityIds = new Set(scope.existingEntityIds ?? []);
  const existingDocIds = new Set(scope.existingDocumentIds ?? []);
  const incomingEntityIds = new Set((envelope.includedEntities ?? []).map((e) => e.id));
  const known = (id: string): boolean => incomingEntityIds.has(id) || existingEntityIds.has(id);

  const record = (kind: ExportObjectKind, id: string, objectIssues: ImportValidationIssue[]): void => {
    outcomes.push({ objectKind: kind, objectId: id, status: outcomeStatus(objectIssues, scope), issues: objectIssues });
    allIssues.push(...objectIssues);
  };

  // Entities
  for (const node of envelope.includedEntities ?? []) {
    const oi: ImportValidationIssue[] = [];
    if (typeof node.schemaVersion !== 'number') oi.push(issue('error', 'corruptPayload', 'entity', node.id, 'Entity missing schemaVersion.'));
    if (existingEntityIds.has(node.id)) {
      conflicts.push({ kind: 'duplicateId', objectKind: 'entity', objectId: node.id, message: `Entity id ${node.id} already exists.`, suggestedResolution: 'rename' });
      oi.push(issue('warning', 'duplicateId', 'entity', node.id, 'Duplicate entity id.'));
    }
    oi.push(...visibilityRiskIssues(node.visibility, envelope.exportScope, 'entity', node.id));
    record('entity', node.id, oi);
  }

  // Relations — source/target must exist
  for (const rel of envelope.includedRelations ?? []) {
    const oi: ImportValidationIssue[] = [];
    if (!known(rel.sourceId) || !known(rel.targetId)) {
      oi.push(issue('warning', 'missingRelationTarget', 'relation', rel.id, `Relation ${rel.id} references a missing source/target; it will be skipped.`));
    }
    record('relation', rel.id, oi);
  }

  // BlockDocuments
  for (const doc of envelope.includedDocuments ?? []) {
    const oi: ImportValidationIssue[] = [];
    for (const di of validateBlockDocument(doc).issues) {
      if (di.code === 'unknown-block-type') oi.push(issue('warning', 'unknownBlockType', 'document', doc.id, di.message));
      else if (di.code === 'missing-media-ref') oi.push(issue('warning', 'mediaMissing', 'document', doc.id, di.message));
      else if (di.code === 'missing-entity-ref') oi.push(issue('warning', 'missingRelationTarget', 'document', doc.id, di.message));
      else oi.push(issue('error', 'corruptPayload', 'document', doc.id, di.message));
    }
    if (existingDocIds.has(doc.id)) {
      conflicts.push({ kind: 'duplicateId', objectKind: 'document', objectId: doc.id, message: `Document id ${doc.id} already exists.`, suggestedResolution: 'skip' });
      oi.push(issue('warning', 'duplicateId', 'document', doc.id, 'Duplicate document id.'));
    }
    oi.push(...visibilityRiskIssues(doc.visibility, envelope.exportScope, 'document', doc.id));
    record('document', doc.id, oi);
  }

  // WorkshopPackages
  for (const manifest of envelope.includedPackages ?? []) {
    const oi: ImportValidationIssue[] = [];
    for (const pi of validateWorkshopPackageManifest(manifest).issues) {
      oi.push(issue('error', 'corruptPayload', 'package', manifest.packageId, pi.message));
    }
    for (const dep of manifest.dependencies) {
      if (dep.kind === 'ruleSystem') continue;
      if (!known(dep.ref)) oi.push(issue('warning', 'missingDependency', 'package', manifest.packageId, `Dependency ${dep.ref} is not present in the import set.`));
    }
    oi.push(...visibilityRiskIssues(manifest.visibility, envelope.exportScope, 'package', manifest.packageId));
    record('package', manifest.packageId, oi);
  }

  // MediaAsset metadata
  for (const asset of envelope.includedMediaAssets ?? []) {
    const oi: ImportValidationIssue[] = [];
    for (const mi of validateMediaAsset(asset).issues) {
      if (mi.code === 'no-resource') oi.push(issue('warning', 'mediaMissing', 'mediaAsset', asset.id, mi.message));
      else oi.push(issue('error', 'corruptPayload', 'mediaAsset', asset.id, mi.message));
    }
    if (!asset.originalRef && !asset.previewRef && !asset.thumbnailRef && asset.placeholderKind) {
      oi.push(issue('warning', 'mediaMissing', 'mediaAsset', asset.id, 'No media file; importing metadata + PreviewArt placeholder.'));
    }
    oi.push(...visibilityRiskIssues(asset.visibility, envelope.exportScope, 'mediaAsset', asset.id));
    record('mediaAsset', asset.id, oi);
  }

  const summary: ImportDryRunSummary = {
    total: outcomes.length,
    importable: outcomes.filter((o) => o.status === 'imported' || o.status === 'warning' || o.status === 'remapped').length,
    skipped: outcomes.filter((o) => o.status === 'skipped').length,
    remapped: outcomes.filter((o) => o.status === 'remapped').length,
    warnings: outcomes.filter((o) => o.status === 'warning').length,
    errors: outcomes.filter((o) => o.status === 'error').length,
  };
  const ok = allIssues.every((i) => i.severity !== 'error');
  return { ok, validation: { ok, issues: allIssues }, conflicts, outcomes, summary };
}
