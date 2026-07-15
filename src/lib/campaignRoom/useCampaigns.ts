import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import {
  campaignRoomApiClient,
  type CampaignListItem,
} from '../api/campaignRoomApiClient';

export type CampaignsState = {
  campaigns: CampaignListItem[];
  loading: boolean;
  error: ApiClientError | null;
  source: 'api' | 'empty';
};

export function useCampaigns(worldServerId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && worldServerId.trim() !== '';
  const [state, setState] = useState<CampaignsState>({ campaigns: [], loading: enabled, error: null, source: 'empty' });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ campaigns: [], loading: false, error: null, source: 'empty' });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const campaigns = await campaignRoomApiClient.listCampaigns(worldServerId);
      setState({ campaigns, loading: false, error: null, source: campaigns.length > 0 ? 'api' : 'empty' });
    } catch (error) {
      setState({ campaigns: [], loading: false, source: 'empty', error: error instanceof ApiClientError ? error : new ApiClientError('invalid_response', '服务器请求暂时失败。') });
    }
  }, [enabled, worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createCampaign = useCallback(async (input: { title: string; description?: string; systemId: string }) => {
    const created = await campaignRoomApiClient.createCampaign(worldServerId, input);
    await refresh();
    return created;
  }, [refresh, worldServerId]);

  return { ...state, refresh, createCampaign };
}
