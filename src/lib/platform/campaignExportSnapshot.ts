import {
  createPlatformExportEnvelope,
  type PlatformExportEnvelope,
} from '../data-contract/platform-envelope';
import {
  useCampaignLocalStore,
  type LocalCampaign,
  type LocalCampaignLifecycleStatus,
  type LocalCampaignSystemId,
} from './campaignLocalStore';

export const CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const CAMPAIGN_LIBRARY_EXPORT_KIND = 'campaign-library-snapshot' as const;

export type CampaignLibraryExportSnapshotPayload = {
  schemaVersion: typeof CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION;
  exportKind: typeof CAMPAIGN_LIBRARY_EXPORT_KIND;
  exportedAt: string;
  source: {
    app: 'trpg-platform';
    storage: 'local';
  };
  includedSystems: LocalCampaignSystemId[];
  includedLifecycleStatuses: LocalCampaignLifecycleStatus[];
  campaigns: LocalCampaign[];
  boundaries: {
    includesActorVault: false;
    includesCampaignEntryDraft: false;
    includesCampaignMembership: false;
    includesCampaignActorInstance: false;
    includesRuntimeActor: false;
    includesRuntimeSession: false;
    includesRuntimeLog: false;
    includesBackendState: false;
  };
};

export type CampaignLibraryExportSnapshotEnvelope = PlatformExportEnvelope & {
  payload: CampaignLibraryExportSnapshotPayload;
};

const CAMPAIGN_LIBRARY_EXPORT_LIFECYCLE_STATUSES: LocalCampaignLifecycleStatus[] = [
  'active',
  'archived',
  'trashed',
];

export function createCampaignLibraryExportSnapshot(
  exportedAt = new Date().toISOString(),
): CampaignLibraryExportSnapshotEnvelope {
  const campaigns = useCampaignLocalStore.getState().campaigns.map((campaign) => ({ ...campaign }));
  const includedSystems = Array.from(
    new Set(campaigns.map((campaign) => campaign.systemId)),
  ).sort();

  const payload: CampaignLibraryExportSnapshotPayload = {
    schemaVersion: CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION,
    exportKind: CAMPAIGN_LIBRARY_EXPORT_KIND,
    exportedAt,
    source: {
      app: 'trpg-platform',
      storage: 'local',
    },
    includedSystems,
    includedLifecycleStatuses: CAMPAIGN_LIBRARY_EXPORT_LIFECYCLE_STATUSES,
    campaigns,
    boundaries: {
      includesActorVault: false,
      includesCampaignEntryDraft: false,
      includesCampaignMembership: false,
      includesCampaignActorInstance: false,
      includesRuntimeActor: false,
      includesRuntimeSession: false,
      includesRuntimeLog: false,
      includesBackendState: false,
    },
  };

  return createPlatformExportEnvelope({
    kind: 'platformBackup',
    schemaVersion: CAMPAIGN_LIBRARY_EXPORT_SNAPSHOT_SCHEMA_VERSION,
    exportScope: 'ownerBackup',
    exportedAt,
    source: {
      sourceApp: 'trpg-platform',
      sourceVersion: CAMPAIGN_LIBRARY_EXPORT_KIND,
    },
    payload,
    metadata: {
      exportKind: CAMPAIGN_LIBRARY_EXPORT_KIND,
      includedSystems: includedSystems.join(','),
      includedLifecycleStatuses: CAMPAIGN_LIBRARY_EXPORT_LIFECYCLE_STATUSES.join(','),
    },
  }) as CampaignLibraryExportSnapshotEnvelope;
}

export function makeCampaignLibraryExportSnapshotFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `campaign-library-snapshot-${year}-${month}-${day}-${hour}${minute}.json`;
}

export function downloadCampaignLibraryExportSnapshot(): CampaignLibraryExportSnapshotEnvelope {
  const snapshot = createCampaignLibraryExportSnapshot();
  downloadJson(snapshot, makeCampaignLibraryExportSnapshotFilename());
  return snapshot;
}

function downloadJson(value: unknown, filename: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
