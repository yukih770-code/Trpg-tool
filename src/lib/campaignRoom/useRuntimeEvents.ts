import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import { campaignRoomApiClient, type RuntimeEvent } from '../api/campaignRoomApiClient';

export function useRuntimeEvents(worldServerId: string, campaignId: string, roomId: string, runtimeSessionId: string, options: { enabled?: boolean; limit?: number } = {}) {
  const enabled = options.enabled !== false && worldServerId.trim() !== '' && campaignId.trim() !== '' && roomId.trim() !== '' && runtimeSessionId.trim() !== '';
  const limit = options.limit ?? 50;
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiClientError | null>(null);

  const refresh = useCallback(async (afterSeq?: number) => {
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await campaignRoomApiClient.listRuntimeEvents(worldServerId, campaignId, roomId, { runtimeSessionId, afterSeq, limit });
      if (afterSeq === undefined) setEvents(next);
      else setEvents((previous) => [...previous, ...next]);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason : new ApiClientError('invalid_response', '运行记录暂时无法加载。'));
    } finally {
      setLoading(false);
    }
  }, [campaignId, enabled, limit, roomId, runtimeSessionId, worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const appendEvent = useCallback(async (input: { eventKind: string; payload?: Record<string, unknown>; visibility?: string }) => {
    const event = await campaignRoomApiClient.appendRuntimeEvent(worldServerId, campaignId, roomId, { runtimeSessionId, ...input });
    setEvents((previous) => [...previous, event].sort((left, right) => left.seq - right.seq));
    return event;
  }, [campaignId, roomId, runtimeSessionId, worldServerId]);

  return { events, loading, error, refresh, appendEvent };
}
