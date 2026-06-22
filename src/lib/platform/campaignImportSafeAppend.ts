import {
  useCampaignLocalStore,
  type LocalCampaign,
  type LocalCampaignLifecycleStatus,
  type LocalCampaignSystemId,
} from './campaignLocalStore';
import type { CampaignImportPreview } from './campaignImportPreview';

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
