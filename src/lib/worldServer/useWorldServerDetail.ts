import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import {
  worldServerApiClient,
  type WorldServerGameSystemBinding,
  type WorldServerMembership,
  type WorldServerRecord,
  type WorldServerRole,
  type WorldServerSettings,
} from '../api/worldServerApiClient';

export type WorldServerDetailState = {
  server: WorldServerRecord | null;
  members: WorldServerMembership[];
  roles: WorldServerRole[];
  settings: WorldServerSettings | null;
  gameSystems: WorldServerGameSystemBinding[];
  loading: boolean;
  error: ApiClientError | null;
  partialErrors: ApiClientError[];
};

const emptyState: WorldServerDetailState = {
  server: null,
  members: [],
  roles: [],
  settings: null,
  gameSystems: [],
  loading: false,
  error: null,
  partialErrors: [],
};

export function useWorldServerDetail(worldServerId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && worldServerId.trim() !== '';
  const [state, setState] = useState<WorldServerDetailState>({ ...emptyState, loading: enabled });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState(emptyState);
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const [serverResult, membersResult, rolesResult, settingsResult, systemsResult] = await Promise.allSettled([
        worldServerApiClient.getWorldServer(worldServerId),
        worldServerApiClient.listMembers(worldServerId),
        worldServerApiClient.listRoles(worldServerId),
        worldServerApiClient.getServerSettings(worldServerId),
        worldServerApiClient.listGameSystems(worldServerId),
      ]);
      const serverError = serverResult.status === 'rejected' ? serverResult.reason : null;
      const errors = [membersResult, rolesResult, settingsResult, systemsResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason)
        .filter((error): error is ApiClientError => error instanceof ApiClientError);
      if (serverError) throw serverError;
      setState({
        server: (serverResult as PromiseFulfilledResult<WorldServerRecord>).value,
        members: membersResult.status === 'fulfilled' ? membersResult.value : [],
        roles: rolesResult.status === 'fulfilled' ? rolesResult.value : [],
        settings: settingsResult.status === 'fulfilled' ? settingsResult.value : null,
        gameSystems: systemsResult.status === 'fulfilled' ? systemsResult.value : [],
        loading: false,
        error: null,
        partialErrors: errors,
      });
    } catch (error) {
      setState({ ...emptyState, loading: false, error: error instanceof ApiClientError ? error : new ApiClientError('invalid_response', '服务器请求暂时失败。') });
    }
  }, [enabled, worldServerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
