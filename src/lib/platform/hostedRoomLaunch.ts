import { createRoomOnServer } from './roomServerHttpClient';
import { roomServerHttpUrl } from './roomServerConfig';
import type { LocalCampaignSystemId } from './campaignLocalStore';
import type { RoomSnapshot, RoomSystemId } from './roomTypes';

export type RoomLaunchSource = 'campaignList' | 'campaignDetail' | 'runtimeSettings';

export type RoomLaunchActionState = 'idle' | 'launching' | 'failed';

export interface HostedRoomLaunchCampaignRef {
  id: string;
  title: string;
  systemId: LocalCampaignSystemId;
}

export interface HostedRoomLaunchSession {
  baseUrl: string;
  room: RoomSnapshot;
  hostMemberId: string;
  sourceCampaignId: string;
  source: RoomLaunchSource;
}

export interface LaunchHostedRoomInput {
  campaign: HostedRoomLaunchCampaignRef;
  source: RoomLaunchSource;
  baseUrl?: string;
  hostDisplayName?: string;
}

export async function launchHostedRoomFromCampaign({
  campaign,
  source,
  baseUrl = roomServerHttpUrl,
  hostDisplayName = 'GM',
}: LaunchHostedRoomInput): Promise<HostedRoomLaunchSession> {
  const { room } = await createRoomOnServer(
    { baseUrl },
    {
      hostDisplayName,
      systemId: campaign.systemId as RoomSystemId,
      campaignRef: {
        source: 'localCampaignLibrary',
        campaignId: campaign.id,
        displayName: campaign.title,
        systemId: campaign.systemId as RoomSystemId,
      },
    },
  );
  const host = room.members.find((member) => member.role === 'host');
  if (!host) {
    throw new Error('Room created but host member was not returned.');
  }
  return {
    baseUrl,
    room,
    hostMemberId: host.memberId,
    sourceCampaignId: campaign.id,
    source,
  };
}

export function normalizeHostedRoomLaunchError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
