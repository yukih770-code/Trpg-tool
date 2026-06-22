import type {
  CampaignLibraryExportSnapshotPayload,
} from './campaignExportSnapshot';
import {
  CAMPAIGN_LIBRARY_EXPORT_KIND,
  CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION,
} from './campaignExportSnapshot';
import type {
  LocalCampaign,
  LocalCampaignLifecycleStatus,
  LocalCampaignStatus,
  LocalCampaignSystemId,
} from './campaignLocalStore';

export type CampaignImportPreviewConflict = 'same-id-existing' | 'same-roomCode-existing';

export type CampaignImportPreviewCampaign = {
  campaign: LocalCampaign | null;
  status: 'valid' | 'invalid';
  conflicts: CampaignImportPreviewConflict[];
  warnings: string[];
  errors: string[];
};

export type CampaignImportPreviewSummary = {
  totalCampaigns: number;
  validCampaigns: number;
  invalidCampaigns: number;
  sameIdExistingConflicts: number;
  sameRoomCodeExistingConflicts: number;
  unsupportedMalformedCount: number;
  systemCounts: Record<LocalCampaignSystemId, number>;
  lifecycleCounts: Record<LocalCampaignLifecycleStatus, number>;
};

export type CampaignImportPreview = {
  isRecognizedSnapshot: boolean;
  errors: string[];
  warnings: string[];
  summary: CampaignImportPreviewSummary;
  campaigns: CampaignImportPreviewCampaign[];
};

const emptySystemCounts = (): Record<LocalCampaignSystemId, number> => ({
  'dnd5e-2024': 0,
  coc7e: 0,
  'cp-red': 0,
});

const emptyLifecycleCounts = (): Record<LocalCampaignLifecycleStatus, number> => ({
  active: 0,
  archived: 0,
  trashed: 0,
});

export function parseCampaignImportPreview(
  text: string,
  existingCampaigns: LocalCampaign[],
): CampaignImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return makeUnsupportedPreview('Malformed JSON.');
  }

  return buildCampaignImportPreview(parsed, existingCampaigns);
}

export function buildCampaignImportPreview(
  value: unknown,
  existingCampaigns: LocalCampaign[],
): CampaignImportPreview {
  const summary: CampaignImportPreviewSummary = {
    totalCampaigns: 0,
    validCampaigns: 0,
    invalidCampaigns: 0,
    sameIdExistingConflicts: 0,
    sameRoomCodeExistingConflicts: 0,
    unsupportedMalformedCount: 0,
    systemCounts: emptySystemCounts(),
    lifecycleCounts: emptyLifecycleCounts(),
  };

  if (!isRecord(value) || value.kind !== 'platformBackup') {
    return makeUnsupportedPreview('Unsupported envelope kind.');
  }

  const payload = value.payload;
  if (!isCampaignLibrarySnapshotPayload(payload)) {
    return makeUnsupportedPreview('Unsupported or malformed campaign library snapshot payload.');
  }

  const existingIds = new Set(existingCampaigns.map((campaign) => campaign.id));
  const existingRoomCodes = new Set(
    existingCampaigns
      .map((campaign) => campaign.roomCode?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code)),
  );

  const campaigns = payload.campaigns.map((candidate) =>
    previewCampaign(candidate, existingIds, existingRoomCodes),
  );

  for (const item of campaigns) {
    summary.totalCampaigns += 1;
    if (item.status === 'valid' && item.campaign) {
      summary.validCampaigns += 1;
      summary.systemCounts[item.campaign.systemId] += 1;
      summary.lifecycleCounts[item.campaign.lifecycleStatus] += 1;
    } else {
      summary.invalidCampaigns += 1;
      summary.unsupportedMalformedCount += 1;
    }

    if (item.conflicts.includes('same-id-existing')) {
      summary.sameIdExistingConflicts += 1;
    }
    if (item.conflicts.includes('same-roomCode-existing')) {
      summary.sameRoomCodeExistingConflicts += 1;
    }
  }

  return {
    isRecognizedSnapshot: true,
    errors: [],
    warnings: [],
    summary,
    campaigns,
  };
}

function previewCampaign(
  value: unknown,
  existingIds: Set<string>,
  existingRoomCodes: Set<string>,
): CampaignImportPreviewCampaign {
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts: CampaignImportPreviewConflict[] = [];

  if (!isRecord(value)) {
    return {
      campaign: null,
      status: 'invalid',
      conflicts,
      warnings,
      errors: ['Campaign record is malformed.'],
    };
  }

  const id = readString(value, 'id');
  const systemId = readString(value, 'systemId');
  const title = readString(value, 'title');
  const description = readOptionalString(value, 'description');
  const roomCode = readString(value, 'roomCode');
  const status = readString(value, 'status');
  const lifecycleStatus = readString(value, 'lifecycleStatus');
  const createdAt = readString(value, 'createdAt');
  const updatedAt = readString(value, 'updatedAt');
  const archivedAt = readOptionalString(value, 'archivedAt');
  const trashedAt = readOptionalString(value, 'trashedAt');

  if (!id) errors.push('Missing campaign id.');
  if (!isLocalCampaignSystemId(systemId)) errors.push('Unsupported or missing systemId.');
  if (!title) errors.push('Missing campaign title.');
  if (!roomCode) errors.push('Missing roomCode.');
  if (!isLocalCampaignStatus(status)) errors.push('Unsupported or missing status.');
  if (!isLocalCampaignLifecycleStatus(lifecycleStatus)) errors.push('Unsupported or missing lifecycleStatus.');
  if (!createdAt) errors.push('Missing createdAt.');
  if (!updatedAt) errors.push('Missing updatedAt.');

  if (id && existingIds.has(id)) conflicts.push('same-id-existing');
  if (roomCode && existingRoomCodes.has(roomCode.trim().toUpperCase())) {
    conflicts.push('same-roomCode-existing');
  }

  if (errors.length > 0) {
    return {
      campaign: null,
      status: 'invalid',
      conflicts,
      warnings,
      errors,
    };
  }

  return {
    campaign: {
      id,
      systemId: systemId as LocalCampaignSystemId,
      title,
      description,
      roomCode,
      status: status as LocalCampaignStatus,
      lifecycleStatus: lifecycleStatus as LocalCampaignLifecycleStatus,
      createdAt,
      updatedAt,
      archivedAt,
      trashedAt,
    },
    status: 'valid',
    conflicts,
    warnings,
    errors,
  };
}

function makeUnsupportedPreview(message: string): CampaignImportPreview {
  return {
    isRecognizedSnapshot: false,
    errors: [message],
    warnings: [],
    summary: {
      totalCampaigns: 0,
      validCampaigns: 0,
      invalidCampaigns: 0,
      sameIdExistingConflicts: 0,
      sameRoomCodeExistingConflicts: 0,
      unsupportedMalformedCount: 1,
      systemCounts: emptySystemCounts(),
      lifecycleCounts: emptyLifecycleCounts(),
    },
    campaigns: [],
  };
}

function isCampaignLibrarySnapshotPayload(value: unknown): value is CampaignLibraryExportSnapshotPayload {
  return (
    isRecord(value) &&
    value.exportKind === CAMPAIGN_LIBRARY_EXPORT_KIND &&
    value.schemaVersion === CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION &&
    Array.isArray(value.campaigns)
  );
}

function readString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  return typeof item === 'string' ? item.trim() : '';
}

function readOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const item = value[key];
  return typeof item === 'string' ? item : undefined;
}

function isLocalCampaignSystemId(value: string): value is LocalCampaignSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isLocalCampaignStatus(value: string): value is LocalCampaignStatus {
  return value === 'draft' || value === 'active';
}

function isLocalCampaignLifecycleStatus(value: string): value is LocalCampaignLifecycleStatus {
  return value === 'active' || value === 'archived' || value === 'trashed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
