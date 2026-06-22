import {
  useCampaignLocalStore,
  type LocalCampaign,
  type LocalCampaignLifecycleStatus,
  type LocalCampaignSystemId,
} from './campaignLocalStore';
import type { CampaignImportPreview } from './campaignImportPreview';
import { generateInternalId, generatePublicCode } from './platformObjectIdentity';

export type CampaignSafeAppendPlan = {
  preview: CampaignImportPreview;
  importableCampaigns: LocalCampaign[];
  skippedInvalidCount: number;
  skippedSameIdExistingCount: number;
  skippedSameRoomCodeExistingCount: number;
  skippedUnsupportedMalformedCount: number;
};

export type CampaignSafeAppendResult = {
  importedCampaigns: LocalCampaign[];
  skippedSameIdExistingCount: number;
  skippedSameRoomCodeExistingCount: number;
  skippedInvalidCount: number;
  systemCounts: Record<LocalCampaignSystemId, number>;
  lifecycleCounts: Record<LocalCampaignLifecycleStatus, number>;
};

export type CampaignCopyAsNewMapping = {
  title: string;
  originalCampaignId: string;
  newCampaignId: string;
  originalRoomCode: string;
  newRoomCode: string;
};

export type CampaignCopyAsNewPlan = {
  preview: CampaignImportPreview;
  copyableCampaigns: LocalCampaign[];
  skippedInvalidCount: number;
  skippedNoConflictCount: number;
};

export type CampaignCopyAsNewResult = {
  copiedCampaigns: LocalCampaign[];
  skippedFailedCount: number;
  skippedInvalidCount: number;
  skippedNoConflictCount: number;
  systemCounts: Record<LocalCampaignSystemId, number>;
  lifecycleCounts: Record<LocalCampaignLifecycleStatus, number>;
  mappings: CampaignCopyAsNewMapping[];
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

export function buildCampaignSafeAppendPlan(preview: CampaignImportPreview): CampaignSafeAppendPlan {
  const plan: CampaignSafeAppendPlan = {
    preview,
    importableCampaigns: [],
    skippedInvalidCount: 0,
    skippedSameIdExistingCount: 0,
    skippedSameRoomCodeExistingCount: 0,
    skippedUnsupportedMalformedCount: preview.isRecognizedSnapshot ? 0 : 1,
  };

  if (!preview.isRecognizedSnapshot) return plan;

  for (const item of preview.campaigns) {
    if (item.status !== 'valid' || !item.campaign) {
      plan.skippedInvalidCount += 1;
      continue;
    }
    if (item.conflicts.includes('same-id-existing')) {
      plan.skippedSameIdExistingCount += 1;
      continue;
    }
    if (item.conflicts.includes('same-roomCode-existing')) {
      plan.skippedSameRoomCodeExistingCount += 1;
      continue;
    }
    plan.importableCampaigns.push(item.campaign);
  }

  return plan;
}

export function applyCampaignSafeAppendImport(plan: CampaignSafeAppendPlan): CampaignSafeAppendResult {
  const appendResult = useCampaignLocalStore.getState().appendImportedCampaigns(plan.importableCampaigns);
  const result: CampaignSafeAppendResult = {
    importedCampaigns: appendResult.appendedCampaigns,
    skippedSameIdExistingCount: plan.skippedSameIdExistingCount + appendResult.skippedSameIdCount,
    skippedSameRoomCodeExistingCount: plan.skippedSameRoomCodeExistingCount + appendResult.skippedSameRoomCodeCount,
    skippedInvalidCount: plan.skippedInvalidCount + plan.skippedUnsupportedMalformedCount,
    systemCounts: emptySystemCounts(),
    lifecycleCounts: emptyLifecycleCounts(),
  };

  for (const campaign of result.importedCampaigns) {
    result.systemCounts[campaign.systemId] += 1;
    result.lifecycleCounts[campaign.lifecycleStatus] += 1;
  }

  return result;
}

export function buildCampaignCopyAsNewPlan(preview: CampaignImportPreview): CampaignCopyAsNewPlan {
  const plan: CampaignCopyAsNewPlan = {
    preview,
    copyableCampaigns: [],
    skippedInvalidCount: 0,
    skippedNoConflictCount: 0,
  };

  if (!preview.isRecognizedSnapshot) {
    plan.skippedInvalidCount += 1;
    return plan;
  }

  for (const item of preview.campaigns) {
    if (item.status !== 'valid' || !item.campaign) {
      plan.skippedInvalidCount += 1;
      continue;
    }
    if (
      item.conflicts.includes('same-id-existing') ||
      item.conflicts.includes('same-roomCode-existing')
    ) {
      plan.copyableCampaigns.push(item.campaign);
      continue;
    }
    plan.skippedNoConflictCount += 1;
  }

  return plan;
}

export function applyCampaignCopyAsNewImport(plan: CampaignCopyAsNewPlan): CampaignCopyAsNewResult {
  const store = useCampaignLocalStore.getState();
  const existingCampaigns = store.campaigns;
  const existingIds = new Set(existingCampaigns.map((campaign) => campaign.id));
  const existingRoomCodes = new Set(
    existingCampaigns
      .map((campaign) => campaign.roomCode?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code)),
  );
  const copiedCampaigns: LocalCampaign[] = [];
  const mappings: CampaignCopyAsNewMapping[] = [];
  let skippedFailedCount = 0;

  for (const campaign of plan.copyableCampaigns) {
    const newCampaignId = generateUniqueCampaignId(existingIds);
    const newRoomCode = generatePublicCode('campaign', existingRoomCodes);

    if (!newCampaignId || existingIds.has(newCampaignId) || existingRoomCodes.has(newRoomCode.toUpperCase())) {
      skippedFailedCount += 1;
      continue;
    }

    const copiedCampaign: LocalCampaign = {
      ...structuredCloneCampaign(campaign),
      id: newCampaignId,
      roomCode: newRoomCode,
    };

    copiedCampaigns.push(copiedCampaign);
    mappings.push({
      title: campaign.title,
      originalCampaignId: campaign.id,
      newCampaignId,
      originalRoomCode: campaign.roomCode ?? '',
      newRoomCode,
    });
    existingIds.add(newCampaignId);
    existingRoomCodes.add(newRoomCode.toUpperCase());
  }

  const appendResult = store.appendImportedCampaigns(copiedCampaigns);
  const importedIds = new Set(appendResult.appendedCampaigns.map((campaign) => campaign.id));
  const result: CampaignCopyAsNewResult = {
    copiedCampaigns: appendResult.appendedCampaigns,
    skippedFailedCount:
      skippedFailedCount +
      appendResult.skippedSameIdCount +
      appendResult.skippedSameRoomCodeCount +
      copiedCampaigns.filter((campaign) => !importedIds.has(campaign.id)).length,
    skippedInvalidCount: plan.skippedInvalidCount,
    skippedNoConflictCount: plan.skippedNoConflictCount,
    systemCounts: emptySystemCounts(),
    lifecycleCounts: emptyLifecycleCounts(),
    mappings: mappings.filter((mapping) => importedIds.has(mapping.newCampaignId)),
  };

  for (const campaign of result.copiedCampaigns) {
    result.systemCounts[campaign.systemId] += 1;
    result.lifecycleCounts[campaign.lifecycleStatus] += 1;
  }

  return result;
}

function generateUniqueCampaignId(existingIds: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const id = generateInternalId('campaign');
    if (!existingIds.has(id)) return id;
  }
  return '';
}

function structuredCloneCampaign(campaign: LocalCampaign): LocalCampaign {
  return JSON.parse(JSON.stringify(campaign)) as LocalCampaign;
}
