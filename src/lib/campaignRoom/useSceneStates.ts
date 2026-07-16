import { useCallback, useEffect, useState } from 'react';

import { campaignRoomApiClient, type SceneStateDocument } from '../api/campaignRoomApiClient';
import { ApiClientError } from '../api/apiTypes';

export function useSceneStates(worldServerId: string, campaignId: string, roomId: string) {
  const enabled = worldServerId.trim() !== '' && campaignId.trim() !== '' && roomId.trim() !== '';
  const [sceneStates, setSceneStates] = useState<SceneStateDocument[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiClientError | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSceneStates([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSceneStates(await campaignRoomApiClient.listSceneStates(worldServerId, campaignId, roomId));
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason : new ApiClientError('invalid_response', '场景库暂时无法加载。'));
    } finally {
      setLoading(false);
    }
  }, [campaignId, enabled, roomId, worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { sceneStates, loading, error, refresh };
}
