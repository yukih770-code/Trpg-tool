import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import {
  campaignRoomApiClient,
  type CampaignActorInstance,
  type CampaignDetail,
  type RoomRecord,
} from '../api/campaignRoomApiClient';

export type CampaignDetailState = {
  detail: CampaignDetail | null;
  actors: CampaignActorInstance[];
  rooms: RoomRecord[];
  loading: boolean;
  error: ApiClientError | null;
  partialErrors: ApiClientError[];
};

export function useCampaignDetail(worldServerId: string, campaignId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && worldServerId.trim() !== '' && campaignId.trim() !== '';
  const [state, setState] = useState<CampaignDetailState>({ detail: null, actors: [], rooms: [], loading: enabled, error: null, partialErrors: [] });

  const revision = useRef(0);
  const currentScope = useRef('');
  currentScope.current = `${worldServerId}:${campaignId}`;

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    if (!enabled) {
      setState({ detail: null, actors: [], rooms: [], loading: false, error: null, partialErrors: [] });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const [detail, actors, rooms] = await Promise.allSettled([
      campaignRoomApiClient.getCampaign(worldServerId, campaignId),
      campaignRoomApiClient.listCampaignActors(worldServerId, campaignId),
      campaignRoomApiClient.listRooms(worldServerId, campaignId),
    ]);
    if (request !== revision.current || currentScope.current !== `${worldServerId}:${campaignId}`) return;
    if (detail.status === 'rejected') {
      setState({ detail: null, actors: [], rooms: [], loading: false, error: detail.reason instanceof ApiClientError ? detail.reason : new ApiClientError('invalid_response', '服务器请求暂时失败。'), partialErrors: [] });
      return;
    }
    const partialErrors = [actors, rooms]
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason)
      .filter((error): error is ApiClientError => error instanceof ApiClientError);
    setState({
      detail: detail.value,
      actors: actors.status === 'fulfilled' ? actors.value : [],
      rooms: rooms.status === 'fulfilled' ? rooms.value : [],
      loading: false,
      error: null,
      partialErrors,
    });
  }, [campaignId, enabled, worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createRoom = useCallback(async (input: { roomCode?: string; metadata?: Record<string, unknown> }) => {
    const room = await campaignRoomApiClient.createRoom(worldServerId, campaignId, input);
    await refresh();
    return room;
  }, [campaignId, refresh, worldServerId]);

  // Keep the accepted server record in the canonical actor collection. A
  // separate saved-sheet overlay would resurrect stale data after clear.
  const updateActor = useCallback(async (actorId: string, input: Parameters<typeof campaignRoomApiClient.updateCampaignActor>[3]) => {
    const actor = await campaignRoomApiClient.updateCampaignActor(worldServerId, campaignId, actorId, input);
    if (currentScope.current === `${worldServerId}:${campaignId}`) {
      revision.current += 1;
      setState(previous => ({ ...previous, loading: false, actors: previous.actors.map(item => item.campaignActorInstanceId === actorId ? actor : item) }));
    }
    return actor;
  }, [campaignId, worldServerId]);

  return { ...state, refresh, createRoom, updateActor };
}
