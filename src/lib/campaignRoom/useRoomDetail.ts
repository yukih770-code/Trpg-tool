import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import {
  campaignRoomApiClient,
  type RoomLobbySlot,
  type RoomParticipant,
  type RoomRecord,
  type RuntimeSessionDetail,
} from '../api/campaignRoomApiClient';

export type RoomDetailState = {
  room: RoomRecord | null;
  participants: RoomParticipant[];
  slots: RoomLobbySlot[];
  runtimeSession: RuntimeSessionDetail | null;
  loading: boolean;
  error: ApiClientError | null;
  partialErrors: ApiClientError[];
};

export function useRoomDetail(worldServerId: string, campaignId: string, roomId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && worldServerId.trim() !== '' && campaignId.trim() !== '' && roomId.trim() !== '';
  const [state, setState] = useState<RoomDetailState>({ room: null, participants: [], slots: [], runtimeSession: null, loading: enabled, error: null, partialErrors: [] });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ room: null, participants: [], slots: [], runtimeSession: null, loading: false, error: null, partialErrors: [] });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const [room, participants, slots, runtimeSession] = await Promise.allSettled([
      campaignRoomApiClient.getRoom(worldServerId, campaignId, roomId),
      campaignRoomApiClient.listRoomParticipants(worldServerId, campaignId, roomId),
      campaignRoomApiClient.listLobbySlots(worldServerId, campaignId, roomId),
      campaignRoomApiClient.getRuntimeSession(worldServerId, campaignId, roomId),
    ]);
    if (room.status === 'rejected') {
      setState({ room: null, participants: [], slots: [], runtimeSession: null, loading: false, error: room.reason instanceof ApiClientError ? room.reason : new ApiClientError('invalid_response', '服务器请求暂时失败。'), partialErrors: [] });
      return;
    }
    const partialErrors = [participants, slots, runtimeSession]
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason)
      .filter((error): error is ApiClientError => error instanceof ApiClientError && error.statusCode !== 404);
    setState({
      room: room.value,
      participants: participants.status === 'fulfilled' ? participants.value : [],
      slots: slots.status === 'fulfilled' ? slots.value : [],
      runtimeSession: runtimeSession.status === 'fulfilled' ? runtimeSession.value : null,
      loading: false,
      error: null,
      partialErrors,
    });
  }, [campaignId, enabled, roomId, worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, refresh };
}
