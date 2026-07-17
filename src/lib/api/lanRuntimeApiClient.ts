import { frontendApiClient } from './apiClient';

export type LanRuntimeEndpoint = {
  host: string;
  frontendUrl: string;
  backendUrl: string;
  wsUrl: string;
};

export type LanRuntimeStatus = {
  enabled: boolean;
  bindHost?: string;
  frontendPort: number;
  backendPort: number;
  allowedOriginsSource: 'explicit' | 'generated' | 'none';
  endpoints: LanRuntimeEndpoint[];
  warnings: string[];
};

export const lanRuntimeApiClient = {
  getStatus: () => frontendApiClient.request<LanRuntimeStatus>('/api/lan/runtime'),
};
