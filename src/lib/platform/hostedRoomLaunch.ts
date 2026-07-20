import { createRoomOnServer, getRoomServerEntry } from './roomServerHttpClient';
import { resolveRoomServerHttpUrl } from './roomServerEndpoint';
import type { RoomCampaignRef, RoomSnapshot, RoomSystemId } from './roomTypes';

export type RoomLaunchSource = 'campaignList' | 'campaignDetail' | 'runtimeSettings';

export type RoomLaunchActionState = 'idle' | 'launching' | 'failed';

export interface HostedRoomLaunchCampaignRef {
  id: string;
  title: string;
  systemId: RoomSystemId;
  /** Optional cloud context for the durable campaign/room bridge. */
  worldServerId?: string;
  /** Local libraries retain their existing source; cloud campaigns use `unknown` until the protocol grows a cloud source. */
  campaignRefSource?: RoomCampaignRef['source'];
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
  roomDisplayName?: string;
}

export interface ResumeHostedRoomInput {
  roomId: string;
  campaignId: string;
  baseUrl?: string;
}

export async function launchHostedRoomFromCampaign({
  campaign,
  source,
  baseUrl = resolveRoomServerHttpUrl(),
  hostDisplayName = 'GM',
  roomDisplayName,
}: LaunchHostedRoomInput): Promise<HostedRoomLaunchSession> {
  const { room } = await createRoomOnServer(
    { baseUrl },
    {
      hostDisplayName,
      displayName: roomDisplayName?.trim() || campaign.title,
      systemId: campaign.systemId,
      campaignRef: {
        source: campaign.campaignRefSource ?? 'localCampaignLibrary',
        worldServerId: campaign.worldServerId,
        campaignId: campaign.id,
        displayName: campaign.title,
        systemId: campaign.systemId,
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

/** Restores the host's existing durable lobby entry after a room-server restart. */
export async function resumeHostedRoomFromCampaign({
  roomId,
  campaignId,
  baseUrl = resolveRoomServerHttpUrl(),
}: ResumeHostedRoomInput): Promise<HostedRoomLaunchSession> {
  const entry = await getRoomServerEntry({ baseUrl }, roomId);
  if (entry.role !== 'host') {
    throw new Error('Only the room host can resume this lobby from the campaign workspace.');
  }
  return {
    baseUrl,
    room: entry.room,
    hostMemberId: entry.memberId,
    sourceCampaignId: campaignId,
    source: 'campaignDetail',
  };
}

export function normalizeHostedRoomLaunchError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
