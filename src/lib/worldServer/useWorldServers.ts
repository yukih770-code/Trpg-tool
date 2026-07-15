import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/apiTypes';
import {
  worldServerApiClient,
  type CreateWorldServerInput,
  type WorldServerRecord,
} from '../api/worldServerApiClient';

export type WorldServersState = {
  servers: WorldServerRecord[];
  loading: boolean;
  error: ApiClientError | null;
  source: 'api' | 'empty';
};

export function useWorldServers(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false;
  const [state, setState] = useState<WorldServersState>({
    servers: [],
    loading: enabled,
    error: null,
    source: 'empty',
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ servers: [], loading: false, error: null, source: 'empty' });
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const servers = await worldServerApiClient.listWorldServers();
      setState({ servers, loading: false, error: null, source: servers.length > 0 ? 'api' : 'empty' });
    } catch (error) {
      setState({
        servers: [],
        loading: false,
        error: error instanceof ApiClientError ? error : new ApiClientError('invalid_response', '服务器请求暂时失败。'),
        source: 'empty',
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createServer = useCallback(async (input: CreateWorldServerInput) => {
    const server = await worldServerApiClient.createWorldServer(input);
    await refresh();
    return server;
  }, [refresh]);

  return { ...state, refresh, createServer };
}
